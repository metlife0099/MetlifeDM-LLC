import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_LOGO = path.join(__dirname, '../assets/logo.png');
const NAVY = '#0A2342';
const GOLD = '#D4AF37';
const SLATE = '#526070';
const MUTED = '#7C8796';
const LINE = '#DDE2E7';
const SOFT = '#F4F6F8';
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const money = (value, currency = 'USD') => {
  const amount = Number(value || 0);
  // PDFKit's built-in Helvetica font is WinAnsi-only and cannot reliably
  // embed the Unicode rupee glyph. The ISO label keeps INR PDFs portable.
  if (currency === 'INR') {
    return `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => new Date(value).toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
});

const fetchImage = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

const image = (doc, source, x, y, options) => {
  if (!source) return false;
  try {
    doc.image(source, x, y, options);
    return true;
  } catch {
    return false;
  }
};

const drawHeader = (doc, quotation, logoBuffer) => {
  const brand = quotation.branding || {};
  doc.rect(0, 0, PAGE.width, 92).fill(NAVY);
  doc.rect(0, 92, PAGE.width, 3).fill(GOLD);
  if (!image(doc, logoBuffer, MARGIN, 22, { fit: [48, 48] })) {
    image(doc, FALLBACK_LOGO, MARGIN, 22, { fit: [48, 48] });
  }
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(17)
    .text(brand.companyName || 'MetlifeDM LLC', 108, 29, { lineBreak: false });
  doc.fillColor('#E7D38A').font('Helvetica').fontSize(8.5)
    .text(brand.tagline || 'Digital growth, delivered with precision.', 108, 52, { lineBreak: false });
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20)
    .text('QUOTATION', 370, 27, { width: 177, align: 'right' });
  doc.fillColor('#E7D38A').font('Helvetica').fontSize(8.5)
    .text(quotation.quotationNumber, 370, 55, { width: 177, align: 'right' });
  doc.y = 116;
};

const drawFooter = (doc, quotation, page, pages) => {
  const brand = quotation.branding || {};
  const contact = [brand.website, brand.email, brand.address].filter(Boolean).join('  •  ');
  doc.moveTo(MARGIN, 806).lineTo(PAGE.width - MARGIN, 806).lineWidth(0.6).strokeColor(GOLD).stroke();
  doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
    .text(contact, MARGIN, 814, { width: CONTENT_WIDTH - 50, align: 'left', lineBreak: false });
  doc.text(`${page} / ${pages}`, PAGE.width - MARGIN - 45, 814, { width: 45, align: 'right' });
};

const addPage = (doc, quotation, logoBuffer) => {
  doc.addPage({ size: 'A4', margin: 0 });
  drawHeader(doc, quotation, logoBuffer);
};

const ensureSpace = (doc, height, quotation, logoBuffer) => {
  if (doc.y + height <= 792) return;
  addPage(doc, quotation, logoBuffer);
};

const sectionTitle = (doc, title) => {
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
    .text(title.toUpperCase(), MARGIN, doc.y, { characterSpacing: 1.2 });
  doc.moveDown(0.45);
};

const drawList = (doc, title, items, quotation, logoBuffer) => {
  if (!items?.length) return;
  ensureSpace(doc, 55, quotation, logoBuffer);
  sectionTitle(doc, title);
  doc.fillColor(SLATE).font('Helvetica').fontSize(9);
  for (const item of items) {
    ensureSpace(doc, 24, quotation, logoBuffer);
    const y = doc.y;
    doc.fillColor(GOLD).circle(MARGIN + 3, y + 5, 2).fill();
    doc.fillColor(SLATE).text(item, MARGIN + 13, y, { width: CONTENT_WIDTH - 13, lineGap: 2 });
    doc.moveDown(0.3);
  }
  doc.moveDown(0.6);
};

const drawTableHeader = (doc) => {
  const y = doc.y;
  doc.rect(MARGIN, y, CONTENT_WIDTH, 25).fill(NAVY);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
  doc.text('SERVICE / DELIVERABLE', MARGIN + 8, y + 8, { width: 250 });
  doc.text('QTY', 365, y + 8, { width: 40, align: 'right' });
  doc.text('RATE', 411, y + 8, { width: 62, align: 'right' });
  doc.text('AMOUNT', 477, y + 8, { width: 62, align: 'right' });
  doc.y = y + 25;
};

const drawPricing = (doc, quotation, logoBuffer) => {
  ensureSpace(doc, 70, quotation, logoBuffer);
  sectionTitle(doc, 'Investment');
  drawTableHeader(doc);
  quotation.lineItems.forEach((item, index) => {
    const descriptionHeight = item.description
      ? doc.heightOfString(item.description, { width: 245, lineGap: 1 })
      : 0;
    const rowHeight = Math.max(34, 24 + descriptionHeight);
    if (doc.y + rowHeight > 760) {
      addPage(doc, quotation, logoBuffer);
      drawTableHeader(doc);
    }
    const y = doc.y;
    if (index % 2 === 1) doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight).fill(SOFT);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8.5)
      .text(item.title, MARGIN + 8, y + 8, { width: 245 });
    if (item.description) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
        .text(item.description, MARGIN + 8, y + 21, { width: 245, lineGap: 1 });
    }
    doc.fillColor(SLATE).font('Helvetica').fontSize(8.5)
      .text(String(item.quantity), 365, y + 10, { width: 40, align: 'right' })
      .text(money(item.unitPrice, quotation.currency), 411, y + 10, { width: 62, align: 'right' })
      .text(money(item.amount, quotation.currency), 477, y + 10, { width: 62, align: 'right' });
    doc.moveTo(MARGIN, y + rowHeight).lineTo(PAGE.width - MARGIN, y + rowHeight)
      .lineWidth(0.4).strokeColor(LINE).stroke();
    doc.y = y + rowHeight;
  });

  ensureSpace(doc, 94, quotation, logoBuffer);
  const x = 365;
  let y = doc.y + 10;
  const totalRow = (label, value, bold = false) => {
    doc.fillColor(bold ? NAVY : SLATE).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 8.5)
      .text(label, x, y, { width: 88 })
      .text(value, 455, y, { width: 84, align: 'right' });
    y += bold ? 22 : 17;
  };
  totalRow('Subtotal', money(quotation.subtotal, quotation.currency));
  if (quotation.discount > 0) totalRow('Discount', `−${money(quotation.discount, quotation.currency)}`);
  if (quotation.tax > 0) totalRow(`Tax (${quotation.taxRate}%)`, money(quotation.tax, quotation.currency));
  doc.moveTo(x, y - 3).lineTo(539, y - 3).lineWidth(1).strokeColor(GOLD).stroke();
  totalRow('Total', money(quotation.total, quotation.currency), true);
  doc.y = y + 5;
};

const drawSignature = (doc, quotation, signatureBuffer, coFounderSignatureBuffer, sealBuffer, logoBuffer) => {
  ensureSpace(doc, 125, quotation, logoBuffer);
  const brand = quotation.branding || {};
  const y = doc.y + 10;
  doc.fillColor(SLATE).font('Helvetica').fontSize(9).text('Sincerely,', MARGIN, y);
  image(doc, signatureBuffer, MARGIN, y + 13, { fit: [115, 42] });
  doc.moveTo(MARGIN, y + 61).lineTo(MARGIN + 165, y + 61).lineWidth(0.6).strokeColor(LINE).stroke();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
    .text(brand.signatory?.name || 'Authorized Signatory', MARGIN, y + 68);
  doc.fillColor(MUTED).font('Helvetica').fontSize(8)
    .text(brand.signatory?.title || 'MetlifeDM LLC', MARGIN, y + 82);

  const coFounder = brand.coFounder || { name: 'Ahad Javed Shaikh', title: 'Co-Founder', digitalMark: true };
  const coFounderX = 222;
  if (!image(doc, coFounderSignatureBuffer, coFounderX, y + 13, { fit: [115, 42] })) {
    // Stable, explicitly labelled approval mark. This is intentionally not a
    // generated handwritten/legal signature; upload the real signature under
    // Settings → Documents when one is authorized for use.
    doc.fillColor(NAVY).font('Helvetica-Oblique').fontSize(18)
      .text('AJS', coFounderX, y + 24, { width: 115, align: 'center' });
    doc.fillColor(MUTED).font('Helvetica').fontSize(5.5)
      .text('DIGITAL APPROVAL MARK', coFounderX, y + 47, { width: 115, align: 'center', characterSpacing: 0.5 });
  }
  doc.moveTo(coFounderX, y + 61).lineTo(coFounderX + 165, y + 61).lineWidth(0.6).strokeColor(LINE).stroke();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
    .text(coFounder.name, coFounderX, y + 68, { width: 165 });
  doc.fillColor(MUTED).font('Helvetica').fontSize(8)
    .text(coFounder.title || 'Co-Founder', coFounderX, y + 82, { width: 165 });

  const sealX = 440;
  if (!image(doc, sealBuffer, sealX, y + 18, { fit: [62, 62] })) {
    doc.circle(sealX + 31, y + 49, 30).lineWidth(1).dash(2, { space: 2 }).strokeColor(GOLD).stroke().undash();
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(7)
      .text('COMPANY\nSEAL', sealX, y + 40, { width: 62, align: 'center' });
  }
  doc.y = y + 105;
};

export const generateQuotationPdf = async (quotationInput) => {
  const quotation = quotationInput.toObject ? quotationInput.toObject() : quotationInput;
  const [logoBuffer, signatureBuffer, coFounderSignatureBuffer, sealBuffer] = await Promise.all([
    fetchImage(quotation.branding?.logoUrl),
    fetchImage(quotation.branding?.signatory?.signatureImageUrl),
    fetchImage(quotation.branding?.coFounder?.signatureImageUrl),
    fetchImage(quotation.branding?.sealImageUrl),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false, bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    addPage(doc, quotation, logoBuffer);
    const brand = quotation.branding || {};
    const left = MARGIN;
    const right = 336;
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('PREPARED FOR', left, doc.y);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text(quotation.client.name, left, doc.y + 5, { width: 230 });
    if (quotation.client.company) doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(quotation.client.company, left, doc.y + 2, { width: 230 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
      .text([quotation.client.email, quotation.client.phone, quotation.client.address].filter(Boolean).join('\n'), left, doc.y + 3, { width: 230, lineGap: 2 });

    const metaY = 116;
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('ISSUE DATE', right, metaY);
    doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(formatDate(quotation.createdAt), right + 82, metaY, { width: 125, align: 'right' });
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('VALID UNTIL', right, metaY + 20);
    doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(formatDate(quotation.validUntil), right + 82, metaY + 20, { width: 125, align: 'right' });
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('VERSION', right, metaY + 40);
    doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(String(quotation.version), right + 82, metaY + 40, { width: 125, align: 'right' });
    doc.y = Math.max(doc.y + 15, 205);

    doc.rect(MARGIN, doc.y, CONTENT_WIDTH, 58).fill(SOFT);
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8).text('PROJECT', MARGIN + 14, doc.y + 12);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(15)
      .text(quotation.projectTitle, MARGIN + 14, doc.y + 5, { width: CONTENT_WIDTH - 28 });
    doc.y += 72;
    sectionTitle(doc, 'Project overview');
    doc.fillColor(SLATE).font('Helvetica').fontSize(9.5)
      .text(quotation.projectSummary, MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 3 });
    doc.moveDown(1);

    drawPricing(doc, quotation, logoBuffer);
    drawList(doc, 'Scope of work', quotation.scope, quotation, logoBuffer);
    drawList(doc, 'Deliverables', quotation.deliverables, quotation, logoBuffer);

    const textSections = [
      ['Timeline', quotation.timeline],
      ['Payment terms', quotation.paymentTerms],
      ['Terms & conditions', quotation.terms],
      ['Notes', quotation.notes],
    ];
    for (const [title, value] of textSections) {
      if (!value) continue;
      ensureSpace(doc, 55, quotation, logoBuffer);
      sectionTitle(doc, title);
      doc.fillColor(SLATE).font('Helvetica').fontSize(9)
        .text(value, MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 3 });
      doc.moveDown(0.8);
    }

    drawSignature(doc, quotation, signatureBuffer, coFounderSignatureBuffer, sealBuffer, logoBuffer);
    doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(7.5)
      .text(`This quotation was prepared by ${brand.companyName || 'MetlifeDM LLC'} and is valid through ${formatDate(quotation.validUntil)}.`, MARGIN, doc.y, { width: CONTENT_WIDTH });

    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(index);
      drawFooter(doc, quotation, index + 1, range.count);
    }
    doc.end();
  });
};

export default generateQuotationPdf;
