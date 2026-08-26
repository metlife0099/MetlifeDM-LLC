import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';
import { generateVerifyQrBuffer } from './qr.service.js';
import { renderHtmlContent } from './pdfHtmlRenderer.js';
import { DOCUMENT_THEMES } from '../utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');
const LOGO_ASPECT = 624 / 453;

// Exact brand hex confirmed for this module. Themes vary layout, not the
// brand palette — all three stay within Navy/Gold.
const NAVY = '#0A2342';
const GOLD = '#D4AF37';
const GOLD_SOFT = '#E6CB74';
const SLATE = '#5B6479';
const MUTED = '#8890A3';
const LINE = '#E4E2DA';
const WHITE = '#FFFFFF';

const PAGE = { width: 595.28, height: 841.89 }; // A4 pt
const FOOTER_HEIGHT = 32;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

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

const drawImageSafe = (doc, buffer, x, y, opts) => {
  if (!buffer) return false;
  try {
    doc.image(buffer, x, y, opts);
    return true;
  } catch {
    return false;
  }
};

/* =====================================================================
 * Shared footer bar (all themes) — company site/email/phone/address
 * ================================================================== */
const drawFooter = (doc, snapshot, { bg, fg, ruleOnly = false } = {}) => {
  const company = snapshot.company || {};
  const items = [
    company.website || config.urls.client?.replace(/^https?:\/\//, '') || 'metlifedm.com',
    company.email || 'metlifedm4u@gmail.com',
    company.addressLine,
  ].filter(Boolean);
  const y = PAGE.height - FOOTER_HEIGHT;

  if (ruleOnly) {
    doc.moveTo(0, y).lineTo(PAGE.width, y).lineWidth(1).strokeColor(GOLD).stroke();
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
      .text(items.join('   •   '), 0, y + 10, { width: PAGE.width, align: 'center' });
    return;
  }

  doc.rect(0, y, PAGE.width, FOOTER_HEIGHT).fill(bg);
  doc.fillColor(fg).font('Helvetica').fontSize(8.5)
    .text(items.join('   •   '), 40, y + FOOTER_HEIGHT / 2 - 5, { width: PAGE.width - 80, align: 'center' });
};

/* =====================================================================
 * Signature / seal / QR block — shared shape, theme-tinted
 * ================================================================== */
const drawSignatureBlock = (doc, { x, y, width, snapshot, signatureBuffer, sealBuffer, qrBuffer, accent, textColor, mutedColor, style = 'row' }) => {
  const rowHeight = 90;

  if (style === 'letter') {
    // Elegant: traditional letter closing, stacked left, seal+QR to the right.
    doc.fillColor(mutedColor).font('Helvetica-Oblique').fontSize(10.5).text('Sincerely,', x, y);
    let sigY = y + 18;
    if (drawImageSafe(doc, signatureBuffer, x, sigY, { width: 110, height: 38, fit: [110, 38] })) sigY += 42;
    else sigY += 30;
    doc.moveTo(x, sigY).lineTo(x + 160, sigY).lineWidth(1).strokeColor(LINE).stroke();
    doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10.5).text(snapshot.signatory?.name || 'Authorized Signatory', x, sigY + 6);
    doc.fillColor(mutedColor).font('Helvetica').fontSize(8.5).text(snapshot.signatory?.title || '', x, doc.y + 1);

    const qrX = x + width - 76;
    drawImageSafe(doc, qrBuffer, qrX, y, { width: 68, height: 68 });
    doc.fillColor(textColor).font('Helvetica-Bold').fontSize(7).text('SCAN TO VERIFY', qrX - 20, y + 70, { width: 108, align: 'center', characterSpacing: 0.4 });

    if (sealBuffer) drawImageSafe(doc, sealBuffer, qrX - 90, y + 4, { width: 56, height: 56, fit: [56, 56] });
    return sigY + 30;
  }

  // Classic / Modern: signature — seal — QR in a row.
  const sigX = x;
  drawImageSafe(doc, signatureBuffer, sigX, y, { width: 110, height: 40, fit: [110, 40] });
  doc.moveTo(sigX, y + 46).lineTo(sigX + 150, y + 46).lineWidth(1).strokeColor(LINE).stroke();
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10).text(snapshot.signatory?.name || 'Authorized Signatory', sigX, y + 52);
  doc.fillColor(mutedColor).font('Helvetica').fontSize(8.5).text(snapshot.signatory?.title || '', sigX, doc.y + 1);

  const sealCx = x + width / 2;
  const sealCy = y + 30;
  if (!drawImageSafe(doc, sealBuffer, sealCx - 32, sealCy - 32, { width: 64, height: 64, fit: [64, 64] })) {
    doc.circle(sealCx, sealCy, 32).lineWidth(1).dash(2, { space: 2 }).strokeColor(accent).stroke();
    doc.undash();
    doc.fillColor(mutedColor).font('Helvetica').fontSize(7).text('COMPANY\nSEAL', sealCx - 30, sealCy - 10, { width: 60, align: 'center' });
  }

  const qrX = x + width - 70;
  drawImageSafe(doc, qrBuffer, qrX, y - 4, { width: 70, height: 70 });
  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(7.5).text('SCAN TO VERIFY', qrX - 15, y + 68, { width: 100, align: 'center', characterSpacing: 0.5 });

  return y + rowHeight;
};

/* =====================================================================
 * CLASSIC — bordered certificate. Full gold frame, navy header band,
 * centered title + big recipient name banner.
 * ================================================================== */
const renderClassicTheme = (doc, ctx) => {
  const { document, snapshot, logoBuffer, signatureBuffer, sealBuffer, qrBuffer } = ctx;
  const MARGIN = 42;
  const inner = MARGIN + 14;
  const contentWidth = PAGE.width - inner * 2;
  const theme = { fontFamily: 'Helvetica', headingColor: NAVY, bodyColor: SLATE, mutedColor: MUTED, accentColor: GOLD, ruleColor: GOLD };

  const drawFrame = () => {
    doc.rect(0, 0, PAGE.width, PAGE.height).fill(WHITE);
    doc.rect(MARGIN, MARGIN, PAGE.width - MARGIN * 2, PAGE.height - MARGIN * 2).lineWidth(2).strokeColor(GOLD).stroke();
    doc.rect(MARGIN + 5, MARGIN + 5, PAGE.width - (MARGIN + 5) * 2, PAGE.height - (MARGIN + 5) * 2).lineWidth(0.5).strokeColor(GOLD_SOFT).stroke();
  };

  const drawRunningHeader = () => {
    drawFrame();
    let y = inner + 10;
    try {
      if (!drawImageSafe(doc, logoBuffer, inner, y, { width: 30 })) doc.image(LOGO_PATH, inner, y, { width: 30 });
    } catch { /* missing asset */ }
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(snapshot.company?.name || 'MetlifeDM LLC', inner + 38, y + 4, { lineBreak: false });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(document.documentNumber, 0, y + 4, { width: PAGE.width - inner, align: 'right' });
    y += 34;
    doc.moveTo(inner, y).lineTo(PAGE.width - inner, y).lineWidth(1).strokeColor(GOLD).stroke();
    return y + 20;
  };

  drawFrame();
  let y = inner + 20;

  const logoWidth = 48;
  const logoHeight = logoWidth / LOGO_ASPECT;
  try {
    if (!drawImageSafe(doc, logoBuffer, inner, y, { width: logoWidth })) doc.image(LOGO_PATH, inner, y, { width: logoWidth });
  } catch { /* missing asset */ }
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(15).text(snapshot.company?.name || 'MetlifeDM LLC', inner + logoWidth + 12, y + 2, { lineBreak: false });
  doc.fillColor(SLATE).font('Helvetica').fontSize(8.5).text(snapshot.company?.tagline || 'Official Company Document', inner + logoWidth + 12, y + 20, { lineBreak: false });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(document.documentNumber, 0, y + 2, { width: PAGE.width - inner, align: 'right' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(`Issued ${formatDate(snapshot.issueDate)}`, 0, y + 15, { width: PAGE.width - inner, align: 'right' });

  y += logoHeight + 26;
  doc.moveTo(inner, y).lineTo(PAGE.width - inner, y).lineWidth(1).strokeColor(GOLD).stroke();
  y += 26;

  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text('THIS DOCUMENT CERTIFIES', inner, y, { width: contentWidth, align: 'center', characterSpacing: 2.5 });
  y += 20;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(23).text(snapshot.documentTypeLabel || 'Certificate', inner, y, { width: contentWidth, align: 'center' });
  y = doc.y + 6;
  doc.moveTo(PAGE.width / 2 - 30, y).lineTo(PAGE.width / 2 + 30, y).lineWidth(2).strokeColor(GOLD).stroke();
  y += 22;

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(18).text(snapshot.recipientName || '—', inner, y, { width: contentWidth, align: 'center' });
  y = doc.y + 20;

  const bodyX = inner + 24;
  const bodyWidth = contentWidth - 48;
  const pageBottom = PAGE.height - FOOTER_HEIGHT - 130;
  y = renderHtmlContent(doc, snapshot.renderedBody, { x: bodyX, width: bodyWidth, startY: y, pageBottom, theme, onNewPage: drawRunningHeader });

  const rowY = Math.max(y + 24, PAGE.height - FOOTER_HEIGHT - 110);
  if (rowY + 100 > PAGE.height - FOOTER_HEIGHT) {
    doc.addPage({ size: 'A4', margin: 0 });
    drawSignatureBlock(doc, { x: inner + 20, y: drawRunningHeader(), width: contentWidth - 40, snapshot, signatureBuffer, sealBuffer, qrBuffer, accent: GOLD, textColor: NAVY, mutedColor: MUTED });
  } else {
    drawSignatureBlock(doc, { x: inner + 20, y: rowY, width: contentWidth - 40, snapshot, signatureBuffer, sealBuffer, qrBuffer, accent: GOLD, textColor: NAVY, mutedColor: MUTED });
  }

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, snapshot, { bg: NAVY, fg: WHITE });
  }
};

/* =====================================================================
 * MODERN — minimal. Slim navy left bar, left-aligned title, no name
 * banner (the recipient is addressed naturally within the body text).
 * ================================================================== */
const renderModernTheme = (doc, ctx) => {
  const { document, snapshot, logoBuffer, signatureBuffer, sealBuffer, qrBuffer } = ctx;
  const BAR_WIDTH = 8;
  const MARGIN = 56;
  const contentX = MARGIN;
  const contentWidth = PAGE.width - MARGIN - 44;
  const theme = { fontFamily: 'Helvetica', headingColor: NAVY, bodyColor: SLATE, mutedColor: MUTED, accentColor: NAVY, ruleColor: GOLD };

  const drawChrome = () => {
    doc.rect(0, 0, PAGE.width, PAGE.height).fill(WHITE);
    doc.rect(0, 0, BAR_WIDTH, PAGE.height).fill(NAVY);
  };

  const drawRunningHeader = () => {
    drawChrome();
    let y = 40;
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10).text(snapshot.company?.name || 'MetlifeDM LLC', contentX, y, { lineBreak: false });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(document.documentNumber, 0, y, { width: PAGE.width - MARGIN, align: 'right' });
    y += 22;
    doc.moveTo(contentX, y).lineTo(PAGE.width - MARGIN, y).lineWidth(0.5).strokeColor(LINE).stroke();
    return y + 20;
  };

  drawChrome();
  let y = 48;

  const logoWidth = 40;
  try {
    if (!drawImageSafe(doc, logoBuffer, contentX, y, { width: logoWidth })) doc.image(LOGO_PATH, contentX, y, { width: logoWidth });
  } catch { /* missing asset */ }
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(document.documentNumber, 0, y + 2, { width: PAGE.width - MARGIN, align: 'right' });
  doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(`Issued ${formatDate(snapshot.issueDate)}`, 0, y + 15, { width: PAGE.width - MARGIN, align: 'right' });
  y += logoWidth / LOGO_ASPECT + 34;

  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8.5).text(snapshot.company?.name?.toUpperCase() || 'METLIFEDM LLC', contentX, y, { characterSpacing: 1.5 });
  y += 18;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(24).text(snapshot.documentTypeLabel || 'Document', contentX, y, { width: contentWidth });
  y = doc.y + 8;
  doc.moveTo(contentX, y).lineTo(contentX + 60, y).lineWidth(2.5).strokeColor(GOLD).stroke();
  y += 28;

  const pageBottom = PAGE.height - FOOTER_HEIGHT - 120;
  y = renderHtmlContent(doc, snapshot.renderedBody, { x: contentX, width: contentWidth, startY: y, pageBottom, theme, onNewPage: drawRunningHeader });

  const rowY = Math.max(y + 24, PAGE.height - FOOTER_HEIGHT - 100);
  if (rowY + 100 > PAGE.height - FOOTER_HEIGHT) {
    doc.addPage({ size: 'A4', margin: 0 });
    const newY = drawRunningHeader();
    drawSignatureBlock(doc, { x: contentX, y: newY, width: contentWidth, snapshot, signatureBuffer, sealBuffer, qrBuffer, accent: NAVY, textColor: NAVY, mutedColor: MUTED });
  } else {
    drawSignatureBlock(doc, { x: contentX, y: rowY, width: contentWidth, snapshot, signatureBuffer, sealBuffer, qrBuffer, accent: NAVY, textColor: NAVY, mutedColor: MUTED });
  }

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, snapshot, { ruleOnly: true });
  }
};

/* =====================================================================
 * ELEGANT — formal letterhead. Full-width navy band, gold rules, a
 * traditional letter-closing signature block. No name banner — the
 * recipient is addressed within the letter body via {{employeeName}}.
 * ================================================================== */
const renderElegantTheme = (doc, ctx) => {
  const { document, snapshot, logoBuffer, signatureBuffer, sealBuffer, qrBuffer } = ctx;
  const MARGIN = 56;
  const contentWidth = PAGE.width - MARGIN * 2;
  const BAND_HEIGHT = 84;
  const theme = { fontFamily: 'Helvetica', headingColor: NAVY, bodyColor: SLATE, mutedColor: MUTED, accentColor: GOLD, ruleColor: GOLD };

  const drawBand = () => {
    doc.rect(0, 0, PAGE.width, PAGE.height).fill(WHITE);
    doc.rect(0, 0, PAGE.width, BAND_HEIGHT).fill(NAVY);
    doc.rect(0, BAND_HEIGHT, PAGE.width, 3).fill(GOLD);
  };

  const drawRunningHeader = () => {
    drawBand();
    const logoWidth = 34;
    try {
      if (!drawImageSafe(doc, logoBuffer, MARGIN, 24, { width: logoWidth })) doc.image(LOGO_PATH, MARGIN, 24, { width: logoWidth });
    } catch { /* missing asset */ }
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13).text(snapshot.company?.name || 'MetlifeDM LLC', MARGIN + logoWidth + 12, 32, { lineBreak: false });
    doc.fillColor(GOLD_SOFT).font('Helvetica').fontSize(8).text(document.documentNumber, 0, 32, { width: PAGE.width - MARGIN, align: 'right' });
    return BAND_HEIGHT + 34;
  };

  drawBand();
  const logoWidth = 44;
  try {
    if (!drawImageSafe(doc, logoBuffer, MARGIN, 22, { width: logoWidth })) doc.image(LOGO_PATH, MARGIN, 22, { width: logoWidth });
  } catch { /* missing asset */ }
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16).text(snapshot.company?.name || 'MetlifeDM LLC', MARGIN + logoWidth + 12, 26, { lineBreak: false });
  doc.fillColor(GOLD_SOFT).font('Helvetica').fontSize(9).text(snapshot.company?.tagline || 'Official Correspondence', MARGIN + logoWidth + 12, 46, { lineBreak: false });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10).text(document.documentNumber, 0, 26, { width: PAGE.width - MARGIN, align: 'right' });
  doc.fillColor(GOLD_SOFT).font('Helvetica').fontSize(8.5).text(`Issued ${formatDate(snapshot.issueDate)}`, 0, 40, { width: PAGE.width - MARGIN, align: 'right' });

  let y = BAND_HEIGHT + 34;
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text(snapshot.documentTypeLabel?.toUpperCase() || 'DOCUMENT', MARGIN, y, { characterSpacing: 2 });
  y += 22;

  const pageBottom = PAGE.height - FOOTER_HEIGHT - 140;
  y = renderHtmlContent(doc, snapshot.renderedBody, { x: MARGIN, width: contentWidth, startY: y, pageBottom, theme, onNewPage: drawRunningHeader });

  const rowY = Math.max(y + 30, PAGE.height - FOOTER_HEIGHT - 120);
  if (rowY + 110 > PAGE.height - FOOTER_HEIGHT) {
    doc.addPage({ size: 'A4', margin: 0 });
    const newY = drawRunningHeader();
    drawSignatureBlock(doc, { x: MARGIN, y: newY, width: contentWidth, snapshot, signatureBuffer, sealBuffer, qrBuffer, accent: GOLD, textColor: NAVY, mutedColor: MUTED, style: 'letter' });
  } else {
    drawSignatureBlock(doc, { x: MARGIN, y: rowY, width: contentWidth, snapshot, signatureBuffer, sealBuffer, qrBuffer, accent: GOLD, textColor: NAVY, mutedColor: MUTED, style: 'letter' });
  }

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc, snapshot, { ruleOnly: true });
  }
};

const THEME_RENDERERS = {
  [DOCUMENT_THEMES.CLASSIC]: renderClassicTheme,
  [DOCUMENT_THEMES.MODERN]: renderModernTheme,
  [DOCUMENT_THEMES.ELEGANT]: renderElegantTheme,
};

export const generateCertificatePdf = async ({ document, settings }) => {
  const snapshot = document.snapshot || {};
  const [logoBuffer, signatureBuffer, sealBuffer, qrBuffer] = await Promise.all([
    fetchImageBuffer(snapshot.company?.logoUrl),
    fetchImageBuffer(snapshot.signatory?.signatureImageUrl),
    fetchImageBuffer(snapshot.company?.sealImageUrl),
    generateVerifyQrBuffer(document.verificationToken),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, autoFirstPage: false });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.addPage({ size: 'A4', margin: 0 });
    const renderer = THEME_RENDERERS[snapshot.theme] || renderClassicTheme;
    renderer(doc, { document, snapshot, logoBuffer, signatureBuffer, sealBuffer, qrBuffer, settings });

    doc.end();
  });
};

export default generateCertificatePdf;
