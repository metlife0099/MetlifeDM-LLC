import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');

const COLORS = {
  navy: '#0A1730',
  navySoft: '#132242',
  gold: '#D4A73C',
  goldSoft: '#E8C97A',
  ink: '#0A1730',
  slate: '#5B6479',
  muted: '#8890A3',
  line: '#E4E2DA',
  ivory: '#F7F4EC',
  white: '#FFFFFF',
};

const PAGE = { width: 595.28, height: 841.89 }; // A4 pt
const MARGIN = 50;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const truncate = (str, maxLen) => {
  if (!str) return str;
  return str.length > maxLen ? `${str.slice(0, maxLen - 1).trimEnd()}…` : str;
};

const LOGO_ASPECT = 624 / 453;

const fetchImageBuffer = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
};

/* =====================================================================
 * Small hand-drawn vector icon set — pdfkit has no icon-font support, so
 * every "point" icon below is built from primitive shapes (circles, lines,
 * rects) rather than an external asset. Each fn draws centered at (cx, cy)
 * within roughly a `r`-radius box.
 * ================================================================== */
const icons = {
  search: (doc, cx, cy, r, color) => {
    doc.lineWidth(1.8).strokeColor(color);
    doc.circle(cx - r * 0.12, cy - r * 0.12, r * 0.5).stroke();
    doc.moveTo(cx + r * 0.22, cy + r * 0.22).lineTo(cx + r * 0.62, cy + r * 0.62).lineWidth(2.2).lineCap('round').stroke();
  },
  target: (doc, cx, cy, r, color) => {
    doc.lineWidth(1.5).strokeColor(color);
    doc.circle(cx, cy, r * 0.75).stroke();
    doc.circle(cx, cy, r * 0.45).stroke();
    doc.circle(cx, cy, r * 0.15).fillColor(color).fill();
  },
  trendUp: (doc, cx, cy, r, color) => {
    doc.fillColor(color);
    doc.rect(cx - r * 0.75, cy + r * 0.15, r * 0.32, r * 0.45).fill();
    doc.rect(cx - r * 0.22, cy - r * 0.2, r * 0.32, r * 0.8).fill();
    doc.rect(cx + r * 0.32, cy - r * 0.55, r * 0.32, r * 1.15).fill();
    doc.lineWidth(1.8).strokeColor(color).lineCap('round').lineJoin('round');
    doc.moveTo(cx - r * 0.75, cy - r * 0.35).lineTo(cx + r * 0.7, cy - r * 0.9).stroke();
    doc.moveTo(cx + r * 0.7, cy - r * 0.9).lineTo(cx + r * 0.32, cy - r * 0.85).stroke();
    doc.moveTo(cx + r * 0.7, cy - r * 0.9).lineTo(cx + r * 0.62, cy - r * 0.55).stroke();
  },
  check: (doc, cx, cy, r, color) => {
    doc.lineWidth(1.5).strokeColor(color);
    doc.circle(cx, cy, r * 0.8).stroke();
    doc.lineWidth(2.1).strokeColor(color).lineCap('round').lineJoin('round');
    doc.moveTo(cx - r * 0.35, cy).lineTo(cx - r * 0.05, cy + r * 0.32).lineTo(cx + r * 0.42, cy - r * 0.32).stroke();
  },
  lightbulb: (doc, cx, cy, r, color) => {
    doc.lineWidth(1.6).strokeColor(color);
    doc.circle(cx, cy - r * 0.18, r * 0.5).stroke();
    doc.rect(cx - r * 0.2, cy + r * 0.28, r * 0.4, r * 0.2).stroke();
    doc.moveTo(cx - r * 0.2, cy + r * 0.4).lineTo(cx + r * 0.2, cy + r * 0.4).stroke();
  },
  compass: (doc, cx, cy, r, color) => {
    doc.lineWidth(1.5).strokeColor(color);
    doc.circle(cx, cy, r * 0.75).stroke();
    doc.fillColor(color);
    doc.moveTo(cx, cy - r * 0.45).lineTo(cx + r * 0.22, cy).lineTo(cx, cy + r * 0.45).lineTo(cx - r * 0.22, cy).closePath().fill();
  },
  handshake: (doc, cx, cy, r, color) => {
    doc.lineWidth(1.7).strokeColor(color).lineCap('round').lineJoin('round');
    doc.moveTo(cx - r * 0.7, cy).lineTo(cx - r * 0.15, cy + r * 0.35).lineTo(cx + r * 0.15, cy - r * 0.1).lineTo(cx + r * 0.7, cy + r * 0.05).stroke();
    doc.circle(cx - r * 0.7, cy, r * 0.12).fillColor(color).fill();
    doc.circle(cx + r * 0.7, cy + r * 0.05, r * 0.12).fillColor(color).fill();
  },
  globe: (doc, cx, cy, r, color) => {
    doc.lineWidth(1.3).strokeColor(color);
    doc.circle(cx, cy, r).stroke();
    doc.ellipse(cx, cy, r * 0.4, r).stroke();
    doc.moveTo(cx - r, cy).lineTo(cx + r, cy).stroke();
  },
  mail: (doc, cx, cy, r, color) => {
    const w = r * 1.9, h = r * 1.3, x = cx - w / 2, y = cy - h / 2;
    doc.lineWidth(1.3).strokeColor(color);
    doc.rect(x, y, w, h).stroke();
    doc.moveTo(x, y).lineTo(cx, cy + h * 0.12).lineTo(x + w, y).stroke();
  },
  phone: (doc, cx, cy, r, color) => {
    doc.lineWidth(2.4).strokeColor(color).lineCap('round');
    doc.moveTo(cx - r * 0.55, cy - r * 0.65).lineTo(cx + r * 0.55, cy + r * 0.65).stroke();
    doc.circle(cx - r * 0.55, cy - r * 0.65, r * 0.3).fillColor(color).fill();
    doc.circle(cx + r * 0.55, cy + r * 0.65, r * 0.3).fillColor(color).fill();
  },
  pin: (doc, cx, cy, r, color) => {
    doc.fillColor(color);
    doc.circle(cx, cy - r * 0.15, r * 0.58).fill();
    doc.moveTo(cx - r * 0.38, cy + r * 0.02).lineTo(cx, cy + r * 0.85).lineTo(cx + r * 0.38, cy + r * 0.02).closePath().fill();
    doc.circle(cx, cy - r * 0.15, r * 0.24).fillColor(COLORS.navy).fill();
  },
  quote: (doc, cx, cy, r, color) => {
    doc.fillColor(color).font('Helvetica-Bold').fontSize(r * 2.6).text('"', cx - r * 0.55, cy - r * 1.05);
  },
};

const STEP_ICONS = ['search', 'compass', 'lightbulb', 'trendUp'];

const drawIconBadge = (doc, x, y, size, iconName, { bg = COLORS.navy, fg = COLORS.gold } = {}) => {
  const r = size / 2;
  if (bg !== 'transparent') doc.circle(x + r, y + r, r).fillColor(bg).fill();
  (icons[iconName] || icons.check)(doc, x + r, y + r, r * 0.52, fg);
};

/* =====================================================================
 * Footer contact bar — repeated on every page for brand consistency.
 * ================================================================== */
const drawFooterBar = (doc, settings) => {
  const barHeight = 34;
  const y = PAGE.height - barHeight;
  const contact = settings?.contact || {};
  const primaryAddress = contact.addresses?.find((a) => a.isPrimary) || contact.addresses?.[0];
  const cityLine = primaryAddress ? [primaryAddress.city, primaryAddress.state].filter(Boolean).join(', ') : null;

  doc.rect(0, y, PAGE.width, barHeight).fill(COLORS.navy);

  const items = [
    { icon: 'globe', text: config.urls.client?.replace(/^https?:\/\//, '') || 'metlifedm.com' },
    { icon: 'mail', text: contact.email || 'hello@metlifedm.com' },
    contact.phone ? { icon: 'phone', text: contact.phone } : null,
    cityLine ? { icon: 'pin', text: cityLine } : null,
  ].filter(Boolean);

  const slotWidth = (PAGE.width - MARGIN * 2) / items.length;
  items.forEach((item, i) => {
    const x = MARGIN + i * slotWidth;
    const iconSize = 13;
    drawIconBadge(doc, x, y + barHeight / 2 - iconSize / 2, iconSize, item.icon, { bg: 'transparent', fg: COLORS.gold });
    doc.fillColor(COLORS.white).font('Helvetica').fontSize(8.5)
      .text(item.text, x + iconSize + 6, y + barHeight / 2 - 5, { width: slotWidth - iconSize - 10, lineBreak: false });
  });
};

/* =====================================================================
 * Cover page
 * ================================================================== */
const drawCover = (doc, cs, settings, heroBuffer) => {
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.white);

  const photoBottom = 300;
  const splitX = PAGE.width * 0.52;
  const contentWidth = PAGE.width - MARGIN * 2;
  const titleWidth = contentWidth - 60;
  const title = truncate(cs.title || 'Case Study', 78);
  const description = truncate(
    cs.tagline || cs.challenge || 'A complete growth engagement, from strategy to measurable results.',
    170
  );

  // Photo panel (top-right, diagonal inner edge)
  doc.save();
  doc.moveTo(splitX, 0).lineTo(PAGE.width, 0).lineTo(PAGE.width, photoBottom).lineTo(splitX - 90, photoBottom).closePath().clip();
  if (heroBuffer) {
    try {
      doc.image(heroBuffer, splitX - 90, 0, { width: PAGE.width - (splitX - 90), height: photoBottom });
    } catch {
      doc.rect(0, 0, PAGE.width, photoBottom).fill(COLORS.navy);
    }
  } else {
    doc.rect(0, 0, PAGE.width, photoBottom).fill(COLORS.navy);
  }
  doc.restore();

  // Gold seam along the diagonal
  doc.moveTo(splitX, 0).lineTo(splitX - 90, photoBottom).lineWidth(3).strokeColor(COLORS.gold).stroke();

  /* ---------- Logo + wordmark + slogan, top-left white zone ---------- */
  const logoWidth = 74;
  const logoHeight = logoWidth / LOGO_ASPECT;
  const logoTop = 40;
  try { doc.image(LOGO_PATH, MARGIN, logoTop, { width: logoWidth }); } catch { /* missing asset */ }

  const wordmarkY = logoTop + logoHeight + 14;
  doc.font('Helvetica-Bold').fontSize(21);
  const metlifeWidth = doc.widthOfString('MetlifeDM');
  doc.fillColor(COLORS.navy).text('MetlifeDM', MARGIN, wordmarkY, { lineBreak: false });
  doc.fillColor(COLORS.gold).text('LLC', MARGIN + metlifeWidth + 8, wordmarkY, { lineBreak: false });
  const wordmarkWidth = metlifeWidth + 8 + doc.widthOfString('LLC');

  const dividerY = wordmarkY + 27;
  doc.moveTo(MARGIN, dividerY).lineTo(MARGIN + wordmarkWidth, dividerY).lineWidth(1).strokeColor(COLORS.gold).stroke();
  doc.fillColor(COLORS.slate).font('Helvetica-Bold').fontSize(9)
    .text('DIGITAL MARKETING', MARGIN, dividerY + 8, { characterSpacing: 2, lineBreak: false });
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5)
    .text('STRATEGY  |  GROWTH  |  VISIBILITY  |  RESULTS', MARGIN, dividerY + 23, { characterSpacing: 0.6, lineBreak: false });

  /* ---------- Diagonal navy panel — height computed from real content, so a
   * long title/meta line can never overlap the icon-points row below it. ---------- */
  const panelTop = photoBottom;
  const eyebrowBlock = 44 + 12 + 12; // top pad + eyebrow line + gap before title
  doc.font('Helvetica-Bold').fontSize(30);
  const titleHeight = doc.heightOfString(title, { width: titleWidth, lineGap: 2 });

  const metaBits = [cs.client, cs.industry, cs.year ? String(cs.year) : null].filter(Boolean);
  const metaText = metaBits.join('   ·   ');
  doc.font('Helvetica').fontSize(11.5);
  const metaHeight = metaBits.length ? doc.heightOfString(metaText, { width: titleWidth }) : 0;
  const metaBlock = metaBits.length ? metaHeight + 20 : 10;

  const iconRowHeight = 34 + 8 + 22; // badge + gap + up to 2 label lines
  const panelBottom = panelTop + eyebrowBlock + titleHeight + 14 + metaBlock + iconRowHeight + 28;

  doc.moveTo(0, panelTop).lineTo(splitX - 90, panelTop).lineTo(splitX, panelTop + 60).lineTo(PAGE.width, panelTop + 60)
    .lineTo(PAGE.width, panelBottom).lineTo(0, panelBottom).closePath().fill(COLORS.navy);
  doc.moveTo(splitX - 90, panelTop).lineTo(splitX, panelTop + 60).lineWidth(3).strokeColor(COLORS.gold).stroke();

  let y = panelTop + 44;
  doc.fillColor(COLORS.gold).font('Helvetica-Bold').fontSize(10).text('CASE STUDY', MARGIN, y, { characterSpacing: 3 });
  y += 26;
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(30).text(title, MARGIN, y, { width: titleWidth, lineGap: 2 });
  y += titleHeight + 14;

  if (metaBits.length) {
    doc.fillColor(COLORS.goldSoft).font('Helvetica').fontSize(11.5).text(metaText, MARGIN, y, { width: titleWidth });
    y += metaHeight + 20;
  } else {
    y += 10;
  }

  // Four icon points — prefer real KPI labels, else the narrative steps
  const points = (cs.kpis?.length ? cs.kpis.slice(0, 4).map((k, i) => ({ label: truncate(k.label, 26) || 'Result', icon: STEP_ICONS[i % STEP_ICONS.length] }))
    : [
      { label: 'The Challenge', icon: 'search' },
      { label: 'The Approach', icon: 'compass' },
      { label: 'The Solution', icon: 'lightbulb' },
      { label: 'The Result', icon: 'trendUp' },
    ]);
  const pointWidth = (PAGE.width - MARGIN * 2) / points.length;
  points.forEach((p, i) => {
    const x = MARGIN + i * pointWidth;
    drawIconBadge(doc, x, y, 34, p.icon, { bg: COLORS.navySoft, fg: COLORS.gold });
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5)
      .text(p.label.toUpperCase(), x, y + 42, { width: pointWidth - 16, characterSpacing: 0.3 });
  });

  /* ---------- Lower white section: summary + stat teaser ---------- */
  const footerTop = PAGE.height - 34;
  let ly = panelBottom + 30;
  doc.font('Helvetica-Bold').fontSize(15);
  const headline1 = `TRANSFORMING ${truncate(cs.client, 32)?.toUpperCase() || 'THE BUSINESS'}`;
  doc.fillColor(COLORS.navy).text(headline1, MARGIN, ly, { width: contentWidth });
  ly = doc.y + 2;
  doc.fillColor(COLORS.gold).font('Helvetica-Bold').fontSize(13).text('THROUGH DIGITAL STRATEGY', MARGIN, ly, { width: contentWidth });
  ly = doc.y + 10;
  doc.moveTo(MARGIN, ly).lineTo(MARGIN + 40, ly).lineWidth(2).strokeColor(COLORS.gold).stroke();
  ly += 14;
  doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9.5)
    .text(description, MARGIN, ly, { width: contentWidth, lineGap: 2 });
  ly = doc.y + 20;

  // Full-width stat teaser row — short, punchy values only; the complete,
  // wrap-safe KPI breakdown lives on the interior Results page. Skipped
  // entirely if a long client name + tagline already used up the room
  // above, so it can never crowd into the footer bar.
  if (cs.kpis?.length && ly + 46 < footerTop - 8) {
    const cells = cs.kpis.slice(0, 3);
    const gap = 16;
    const cellWidth = (contentWidth - gap * (cells.length - 1)) / cells.length;
    const innerWidth = cellWidth - 34;
    cells.forEach((k, i) => {
      const x = MARGIN + i * (cellWidth + gap);
      drawIconBadge(doc, x, ly, 24, STEP_ICONS[i % STEP_ICONS.length], { bg: COLORS.ivory, fg: COLORS.navy });
      const valueText = truncate(k.change || k.after || '—', 16);
      doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(13).text(valueText, x + 32, ly - 1, { width: innerWidth, lineGap: 1 });
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(7.5).text(truncate((k.label || '').toUpperCase(), 30), x + 32, ly + 15, { width: innerWidth });
    });
  }

  drawFooterBar(doc, settings);
};

/* =====================================================================
 * Content pages — running header + footer bar on each
 * ================================================================== */
const drawRunningHeader = (doc, site, label) => {
  doc.rect(0, 0, PAGE.width, 6).fill(COLORS.gold);
  try { doc.image(LOGO_PATH, MARGIN, 24, { width: 26 }); } catch { /* missing asset */ }
  doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(12).text(site.name || 'MetlifeDM', MARGIN + 34, 30, { lineBreak: false });
  doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9).text(label, MARGIN, 32, { width: PAGE.width - MARGIN * 2, align: 'right', lineBreak: false });
  doc.moveTo(MARGIN, 58).lineTo(PAGE.width - MARGIN, 58).strokeColor(COLORS.line).lineWidth(1).stroke();
  return 78;
};

export const generateCaseStudyPdf = async ({ caseStudy: cs, settings }) => {
  const heroBuffer = await fetchImageBuffer(cs.heroImage?.url);
  const site = settings?.site || {};
  const contact = settings?.contact || {};
  const contentWidth = PAGE.width - MARGIN * 2;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    /* ---------------- Page 1: Cover ---------------- */
    doc.addPage({ size: 'A4', margin: 0 });
    drawCover(doc, cs, settings, heroBuffer);

    /* ---------------- Page 2: Snapshot + Results ---------------- */
    doc.addPage({ size: 'A4', margin: 0 });
    let y = drawRunningHeader(doc, site, 'Case Study Report');

    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(19).text(cs.title, MARGIN, y, { width: contentWidth });
    y = doc.y + 18;

    const metaCols = [
      { label: 'CLIENT', value: cs.client },
      { label: 'INDUSTRY', value: cs.industry },
      { label: 'CATEGORY', value: cs.category?.name },
      { label: 'YEAR', value: cs.year ? String(cs.year) : null },
    ].filter((m) => m.value);
    if (metaCols.length) {
      const colWidth = contentWidth / metaCols.length;
      metaCols.forEach((m, i) => {
        doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(7.5).text(m.label, MARGIN + i * colWidth, y, { characterSpacing: 0.6 });
        doc.fillColor(COLORS.navy).font('Helvetica').fontSize(11).text(m.value, MARGIN + i * colWidth, y + 13, { width: colWidth - 10 });
      });
      y += 48;
      doc.moveTo(MARGIN, y).lineTo(PAGE.width - MARGIN, y).strokeColor(COLORS.line).stroke();
      y += 24;
    }

    if (cs.kpis?.length > 0) {
      doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(14).text('Results', MARGIN, y);
      y = doc.y + 16;

      const perRow = 3;
      const gap = 14;
      const cardWidth = (contentWidth - gap * (perRow - 1)) / perRow;
      const innerWidth = cardWidth - 28;
      // Long descriptive "after" values (e.g. "Fully Functional Ecommerce
      // Platform") need a smaller size than short numeric ones, or they
      // overlap the label below — measure first, then size the card to fit.
      const measure = (k, index) => {
        const afterText = k.after || '—';
        const afterSize = afterText.length > 16 ? 10.5 : 15;
        doc.font('Helvetica-Bold').fontSize(afterSize);
        const afterHeight = doc.heightOfString(afterText, { width: innerWidth, lineGap: 1 });
        doc.font('Helvetica').fontSize(8.5);
        const labelHeight = doc.heightOfString(k.label || '', { width: innerWidth });
        const beforeHeight = k.before ? 12 : 0;
        const height = 14 + 26 + 10 + afterHeight + beforeHeight + 8 + labelHeight + 14;
        return { index, before: k.before, label: k.label, afterText, afterSize, afterHeight, beforeHeight, labelHeight, height: Math.max(height, 100) };
      };

      const rows = [];
      for (let i = 0; i < cs.kpis.length; i += perRow) rows.push(cs.kpis.slice(i, i + perRow).map((k, j) => measure(k, i + j)));

      let rowY = y;
      rows.forEach((row) => {
        const rowHeight = Math.max(...row.map((m) => m.height));
        if (rowY + rowHeight > PAGE.height - 70) {
          doc.addPage({ size: 'A4', margin: 0 });
          rowY = drawRunningHeader(doc, site, 'Case Study Report — Results');
        }
        row.forEach((m, col) => {
          const x = MARGIN + col * (cardWidth + gap);
          doc.rect(x, rowY, cardWidth, rowHeight).fill(COLORS.ivory);
          doc.rect(x, rowY, 3, rowHeight).fill(COLORS.gold);
          drawIconBadge(doc, x + 14, rowY + 14, 26, STEP_ICONS[m.index % STEP_ICONS.length], { bg: COLORS.navy, fg: COLORS.gold });
          let ty = rowY + 14 + 26 + 10;
          doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(m.afterSize).text(m.afterText, x + 14, ty, { width: innerWidth, lineGap: 1 });
          ty += m.afterHeight;
          if (m.beforeHeight) {
            doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(`from ${m.before}`, x + 14, ty + 2, { width: innerWidth });
            ty += m.beforeHeight;
          }
          doc.fillColor(COLORS.slate).font('Helvetica').fontSize(8.5).text(m.label || '', x + 14, ty + 8, { width: innerWidth });
        });
        rowY += rowHeight + 14;
      });
      y = rowY;
    }

    /* ---------------- Narrative — one icon per point ---------------- */
    const steps = [
      { key: 'challenge', label: 'The Challenge', icon: 'search' },
      { key: 'approach', label: 'The Approach', icon: 'compass' },
      { key: 'solution', label: 'The Solution', icon: 'lightbulb' },
      { key: 'result', label: 'The Result', icon: 'trendUp' },
    ].filter((s) => cs[s.key]);

    if (steps.length) {
      if (y + 40 > PAGE.height - 70) {
        doc.addPage({ size: 'A4', margin: 0 });
        y = drawRunningHeader(doc, site, 'Case Study Report — The Story');
      }
      doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(14).text('The Story', MARGIN, y);
      y = doc.y + 18;

      steps.forEach((s) => {
        const bodyHeight = doc.heightOfString(cs[s.key], { width: contentWidth - 46, lineGap: 3 });
        if (y + 30 + bodyHeight > PAGE.height - 70) {
          doc.addPage({ size: 'A4', margin: 0 });
          y = drawRunningHeader(doc, site, 'Case Study Report — The Story');
        }
        drawIconBadge(doc, MARGIN, y, 28, s.icon, { bg: COLORS.navy, fg: COLORS.gold });
        doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(12).text(s.label, MARGIN + 40, y + 3, { width: contentWidth - 46 });
        doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10).text(cs[s.key], MARGIN + 40, doc.y + 4, { width: contentWidth - 46, lineGap: 3 });
        y = doc.y + 24;
      });
    }

    // Testimonial
    if (cs.testimonial?.quote) {
      const quoteHeight = doc.heightOfString(cs.testimonial.quote, { width: contentWidth - 20, lineGap: 3 });
      if (y + 60 + quoteHeight > PAGE.height - 70) {
        doc.addPage({ size: 'A4', margin: 0 });
        y = drawRunningHeader(doc, site, 'Case Study Report');
      }
      doc.rect(MARGIN, y, contentWidth, 3).fill(COLORS.gold);
      y += 18;
      icons.quote(doc, MARGIN + 10, y + 6, 9, COLORS.gold);
      doc.fillColor(COLORS.navy).font('Helvetica-BoldOblique').fontSize(12.5)
        .text(cs.testimonial.quote, MARGIN + 26, y, { width: contentWidth - 26, lineGap: 3 });
      y = doc.y + 10;
      const attribution = [cs.testimonial.author, cs.testimonial.role].filter(Boolean).join(' · ');
      if (attribution) {
        doc.fillColor(COLORS.slate).font('Helvetica-Bold').fontSize(9).text(attribution.toUpperCase(), MARGIN + 26, y, { width: contentWidth - 26, characterSpacing: 0.5 });
      }
    }

    /* ---------------- Back cover ---------------- */
    doc.addPage({ size: 'A4', margin: 0 });
    doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.navy);
    doc.rect(0, 0, PAGE.width, 6).fill(COLORS.gold);

    const logoW = 70;
    const logoH = logoW / LOGO_ASPECT;
    try { doc.image(LOGO_PATH, PAGE.width / 2 - logoW / 2, 120, { width: logoW }); } catch { /* missing asset */ }
    const wordmarkTop = 120 + logoH + 24;
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(16).text('METLIFEDM', 0, wordmarkTop, { width: PAGE.width, align: 'center', characterSpacing: 3 });
    doc.fillColor(COLORS.gold).font('Helvetica').fontSize(9).text('DIGITAL MARKETING EXCELLENCE', 0, wordmarkTop + 22, { width: PAGE.width, align: 'center', characterSpacing: 1.5 });
    doc.fillColor(COLORS.goldSoft).font('Helvetica').fontSize(7.5)
      .text('STRATEGY  |  GROWTH  |  VISIBILITY  |  RESULTS', 0, wordmarkTop + 38, { width: PAGE.width, align: 'center', characterSpacing: 0.6 });

    const dividerY = wordmarkTop + 62;
    doc.moveTo(PAGE.width / 2 - 30, dividerY).lineTo(PAGE.width / 2 + 30, dividerY).lineWidth(1.5).strokeColor(COLORS.gold).stroke();

    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(28)
      .text(`Ready for results\nlike ${cs.client || 'these'}?`, 70, dividerY + 50, { width: PAGE.width - 140, align: 'center', lineGap: 4 });

    doc.fillColor(COLORS.goldSoft).font('Helvetica').fontSize(11.5)
      .text("Let's build your growth story next. Book a free strategy call and we'll map the exact plan.", 90, doc.y + 22, { width: PAGE.width - 180, align: 'center', lineGap: 3 });

    // Contact block
    const contactY = 560;
    const contactItems = [
      { icon: 'globe', text: config.urls.client?.replace(/^https?:\/\//, '') || 'metlifedm.com' },
      { icon: 'mail', text: contact.email || 'hello@metlifedm.com' },
      contact.phone ? { icon: 'phone', text: contact.phone } : null,
    ].filter(Boolean);
    const itemWidth = (PAGE.width - MARGIN * 2) / contactItems.length;
    contactItems.forEach((item, i) => {
      const x = MARGIN + i * itemWidth;
      const badgeSize = 34;
      drawIconBadge(doc, x + itemWidth / 2 - badgeSize / 2, contactY, badgeSize, item.icon, { bg: COLORS.navySoft, fg: COLORS.gold });
      doc.fillColor(COLORS.white).font('Helvetica').fontSize(9.5)
        .text(item.text, x, contactY + badgeSize + 10, { width: itemWidth, align: 'center', lineBreak: false });
    });

    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
      .text(`Case study prepared ${formatDate(new Date())} · © ${new Date().getFullYear()} ${site.name || 'MetlifeDM LLC'}`, 0, PAGE.height - 40, { width: PAGE.width, align: 'center' });

    /* ---------------- Footer bar on every content page (not cover/back cover) ---------------- */
    const range = doc.bufferedPageRange();
    for (let i = 1; i < range.count - 1; i++) {
      doc.switchToPage(i);
      drawFooterBar(doc, settings);
    }

    doc.end();
  });
};

export default generateCaseStudyPdf;
