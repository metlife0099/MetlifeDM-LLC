import { parse } from 'node-html-parser';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/**
 * Renders a constrained HTML tag set — the subset the admin RichEditor
 * (TipTap StarterKit + Underline) can actually produce — into an open pdfkit
 * document, with automatic pagination when content overflows the page.
 *
 * Supported blocks: p, h1, h2, h3, ul>li, ol>li, blockquote, hr.
 * Supported inline marks: strong/b (bold), em/i (italic), u (underline),
 * s/strike/del (strikethrough), a (rendered as underlined text — no live
 * link, unusual inside a certificate body). Anything else (e.g. an inline
 * <img>) is skipped rather than erroring — its own text, if any, is still
 * pulled through so nothing silently disappears.
 */

// ---- inline run collection -------------------------------------------------

const collectRuns = (node, marks = {}) => {
  const runs = [];
  for (const child of node.childNodes) {
    if (child.nodeType === TEXT_NODE) {
      // .text (not .rawText) decodes HTML entities — rawText would leave a
      // literal "&amp;" in the drawn PDF text instead of "&".
      if (child.text) runs.push({ text: child.text, ...marks });
      continue;
    }
    if (child.nodeType !== ELEMENT_NODE) continue;
    switch (child.tagName) {
      case 'STRONG':
      case 'B':
        runs.push(...collectRuns(child, { ...marks, bold: true }));
        break;
      case 'EM':
      case 'I':
        runs.push(...collectRuns(child, { ...marks, italic: true }));
        break;
      case 'U':
        runs.push(...collectRuns(child, { ...marks, underline: true }));
        break;
      case 'S':
      case 'STRIKE':
      case 'DEL':
        runs.push(...collectRuns(child, { ...marks, strike: true }));
        break;
      case 'A':
        runs.push(...collectRuns(child, { ...marks, underline: true }));
        break;
      case 'BR':
        runs.push({ text: '\n', ...marks });
        break;
      default:
        // Unknown inline tag — still pull its text through, unstyled.
        runs.push(...collectRuns(child, marks));
    }
  }
  return runs;
};

const fontFor = (fontFamily, { bold, italic }) => {
  if (bold && italic) return `${fontFamily}-BoldOblique`;
  if (bold) return `${fontFamily}-Bold`;
  if (italic) return `${fontFamily}-Oblique`;
  return fontFamily;
};

// pdfkit's continued-text mode ("keep flowing on this line") does not treat
// an embedded "\n" as a real line break — it just gets swallowed, so a <br>
// (which collectRuns turns into a { text: '\n' } run) needs to actually end
// the current continued block and restart on a fresh line, not be passed
// through as literal run text.
const drawRuns = (doc, runs, { x, y, width, fontFamily, fontSize, color, lineGap = 3, align = 'left' }) => {
  if (!runs.length) return;
  doc.fillColor(color).fontSize(fontSize);

  const lines = [[]];
  for (const run of runs) {
    if (run.text === '\n') lines.push([]);
    else lines[lines.length - 1].push(run);
  }

  let cursorY = y;
  lines.forEach((lineRuns, li) => {
    if (!lineRuns.length) {
      cursorY += fontSize * 1.3;
      return;
    }
    lineRuns.forEach((run, i) => {
      doc.font(fontFor(fontFamily, run));
      const opts = { lineGap, align, strike: !!run.strike, underline: !!run.underline };
      if (i === 0) {
        doc.text(run.text, x, cursorY, { ...opts, width, continued: lineRuns.length > 1 });
      } else {
        doc.text(run.text, { ...opts, continued: i < lineRuns.length - 1 });
      }
    });
    if (li < lines.length - 1) cursorY = doc.y;
  });
};

// ---- block measurement + drawing -------------------------------------------

const BLOCK_STYLE = {
  H1: { fontSize: 18, bold: true, gapAfter: 8 },
  H2: { fontSize: 15, bold: true, gapAfter: 6 },
  H3: { fontSize: 13, bold: true, gapAfter: 5 },
  P: { fontSize: 10.5, bold: false, gapAfter: 5 },
};

// TipTap renders a blank line (pressing Enter) as an empty <p></p>. It's
// measured/drawn as a normal paragraph gap rather than falling through to
// pdfkit's unreliable doc.text('') path — and renderHtmlContent collapses
// any *run* of consecutive empty blocks down to a single one first, so
// pressing Enter multiple times (or once) always reads as one ordinary
// paragraph break, not a stack of extra blank lines.
const isBlockEmpty = (node) => !(node.text || '').trim();

const measureBlock = (doc, node, { width, theme }) => {
  const tag = node.tagName;
  if (tag === 'HR') return 14;
  if (tag === 'UL' || tag === 'OL') {
    const items = node.childNodes.filter((c) => c.tagName === 'LI' && (c.text || '').trim());
    if (!items.length) return 0;
    doc.font(theme.fontFamily).fontSize(10.5);
    return items.reduce((sum, li) => sum + doc.heightOfString(li.text || ' ', { width: width - 22, lineGap: 3 }) + 4, 0) + 3;
  }
  if (tag === 'BLOCKQUOTE') {
    if (isBlockEmpty(node)) return 0;
    doc.font(`${theme.fontFamily}-Oblique`).fontSize(10.5);
    return doc.heightOfString(node.text || ' ', { width: width - 24, lineGap: 3 }) + 16;
  }
  const style = BLOCK_STYLE[tag] || BLOCK_STYLE.P;
  if (isBlockEmpty(node)) return style.gapAfter;
  doc.font(style.bold ? `${theme.fontFamily}-Bold` : theme.fontFamily).fontSize(style.fontSize);
  return doc.heightOfString(node.text || ' ', { width, lineGap: 3 }) + style.gapAfter;
};

const drawBlock = (doc, node, { x, y, width, theme }) => {
  const tag = node.tagName;

  if (tag === 'HR') {
    doc.moveTo(x, y + 6).lineTo(x + width, y + 6).lineWidth(1).strokeColor(theme.ruleColor || theme.accentColor).stroke();
    return y + 14;
  }

  if (tag === 'UL' || tag === 'OL') {
    const items = node.childNodes.filter((c) => c.tagName === 'LI' && (c.text || '').trim());
    if (!items.length) return y;
    let cursorY = y;
    items.forEach((li, i) => {
      const marker = tag === 'OL' ? `${i + 1}.` : '•';
      doc.font(theme.fontFamily).fontSize(10.5).fillColor(theme.accentColor).text(marker, x, cursorY, { width: 18, lineGap: 3 });
      const runs = collectRuns(li);
      drawRuns(doc, runs.length ? runs : [{ text: li.text || '' }], {
        x: x + 20, y: cursorY, width: width - 20, fontFamily: theme.fontFamily, fontSize: 10.5, color: theme.bodyColor,
      });
      cursorY = Math.max(doc.y, cursorY) + 4;
    });
    return cursorY + 3;
  }

  if (tag === 'BLOCKQUOTE') {
    if (isBlockEmpty(node)) return y;
    const textHeight = doc.font(`${theme.fontFamily}-Oblique`).fontSize(10.5).heightOfString(node.text || '', { width: width - 24, lineGap: 3 });
    doc.rect(x, y, 3, textHeight + 12).fill(theme.accentColor);
    doc.font(`${theme.fontFamily}-Oblique`).fontSize(10.5).fillColor(theme.mutedColor || theme.bodyColor)
      .text(node.text || '', x + 16, y + 6, { width: width - 24, lineGap: 3 });
    return y + textHeight + 18;
  }

  const style = BLOCK_STYLE[tag] || BLOCK_STYLE.P;
  if (isBlockEmpty(node)) return y + style.gapAfter;
  const runs = collectRuns(node, { bold: style.bold });
  const color = style.bold ? theme.headingColor : theme.bodyColor;
  drawRuns(doc, runs.length ? runs : [{ text: node.text || '', bold: style.bold }], {
    x, y, width, fontFamily: theme.fontFamily, fontSize: style.fontSize, color,
  });
  return Math.max(doc.y, y) + style.gapAfter;
};

/**
 * Renders `html` starting at (x, startY) within `width`, automatically
 * page-breaking via `onNewPage()` (which must draw that page's running
 * header/chrome and return the new content start-y) whenever a block would
 * cross `pageBottom`. Returns the final y position after the last block.
 */
const isBlankLineBlock = (node) =>
  ['P', 'H1', 'H2', 'H3'].includes(node.tagName) && isBlockEmpty(node);

export const renderHtmlContent = (doc, html, { x, width, startY, pageBottom, theme, onNewPage }) => {
  const root = parse(html || '', { blockTextElements: { pre: true } });
  const elements = root.childNodes.filter((n) => n.nodeType === ELEMENT_NODE);

  // Collapse a run of consecutive blank-line blocks (pressing Enter more
  // than once) down to a single one, so the gap between two real paragraphs
  // never stacks into multiple blank lines regardless of how many empty
  // paragraphs are in between.
  const blocks = [];
  let prevWasBlankLine = false;
  for (const node of elements) {
    const blankLine = isBlankLineBlock(node);
    if (blankLine && prevWasBlankLine) continue;
    blocks.push(node);
    prevWasBlankLine = blankLine;
  }

  let y = startY;
  for (const node of blocks) {
    const height = measureBlock(doc, node, { width, theme });
    if (y + height > pageBottom) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = onNewPage();
    }
    y = drawBlock(doc, node, { x, y, width, theme });
  }
  return y;
};

export const htmlToPlainText = (html) => parse(html || '').text.replace(/\s+/g, ' ').trim();
