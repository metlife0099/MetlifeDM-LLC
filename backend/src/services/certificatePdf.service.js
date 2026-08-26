import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';
import { generateVerifyQrBuffer } from './qr.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');

// Exact brand hex confirmed for the Documents & Certificates module — distinct
// from caseStudyPdf.service.js's close-but-different navy/gold pair.
const COLORS = {
  navy: '#0A2342',
  navySoft: '#123059',
  gold: '#D4AF37',
  goldSoft: '#E6CB74',
  slate: '#5B6479',
  muted: '#8890A3',
  line: '#E4E2DA',
  ivory: '#F7F4EC',
  white: '#FFFFFF',
};

const PAGE = { width: 595.28, height: 841.89 }; // A4 pt
const MARGIN = 50;
const LOGO_ASPECT = 624 / 453;

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

const drawFooterBar = (doc, snapshot) => {
  const barHeight = 30;
  const y = PAGE.height - barHeight;
  const company = snapshot.company || {};
  doc.rect(0, y, PAGE.width, barHeight).fill(COLORS.navy);

  const items = [
    company.website || config.urls.client?.replace(/^https?:\/\//, '') || 'metlifedm.com',
    company.email || 'metlifedm4u@gmail.com',
    company.addressLine,
  ].filter(Boolean);

  doc.fillColor(COLORS.white).font('Helvetica').fontSize(8.5)
    .text(items.join('   •   '), MARGIN, y + barHeight / 2 - 5, {
      width: PAGE.width - MARGIN * 2,
      align: 'center',
      lineBreak: false,
    });
};

export const generateCertificatePdf = async ({ document, settings }) => {
  const snapshot = document.snapshot || {};
  const [logoBuffer, signatureBuffer, sealBuffer, qrBuffer] = await Promise.all([
    fetchImageBuffer(snapshot.company?.logoUrl),
    fetchImageBuffer(snapshot.signatory?.signatureImageUrl),
    fetchImageBuffer(snapshot.company?.sealImageUrl),
    generateVerifyQrBuffer(document.verificationToken),
  ]);
  const contentWidth = PAGE.width - MARGIN * 2;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLORS.white);
    doc.rect(0, 0, PAGE.width, 6).fill(COLORS.gold);

    // ---------- Letterhead ----------
    let y = 34;
    const logoWidth = 46;
    const logoHeight = logoWidth / LOGO_ASPECT;
    try {
      if (logoBuffer) doc.image(logoBuffer, MARGIN, y, { width: logoWidth });
      else doc.image(LOGO_PATH, MARGIN, y, { width: logoWidth });
    } catch { /* missing asset */ }

    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(15)
      .text(snapshot.company?.name || settings?.site?.name || 'MetlifeDM LLC', MARGIN + logoWidth + 12, y + 2, { lineBreak: false });
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(8.5)
      .text(snapshot.company?.tagline || 'Official Company Document', MARGIN + logoWidth + 12, y + 20, { lineBreak: false });

    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(9)
      .text(document.documentNumber, 0, y + 2, { width: PAGE.width - MARGIN, align: 'right' });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
      .text(`Issued ${formatDate(snapshot.issueDate)}`, 0, y + 15, { width: PAGE.width - MARGIN, align: 'right' });

    y += logoHeight + 24;
    doc.moveTo(MARGIN, y).lineTo(PAGE.width - MARGIN, y).lineWidth(1).strokeColor(COLORS.gold).stroke();
    y += 30;

    // ---------- Title ----------
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(9)
      .text('THIS DOCUMENT CERTIFIES', MARGIN, y, { width: contentWidth, align: 'center', characterSpacing: 2.5 });
    y += 20;
    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(24)
      .text(snapshot.documentTypeLabel || 'Certificate', MARGIN, y, { width: contentWidth, align: 'center' });
    y = doc.y + 6;
    doc.moveTo(PAGE.width / 2 - 30, y).lineTo(PAGE.width / 2 + 30, y).lineWidth(2).strokeColor(COLORS.gold).stroke();
    y += 26;

    // ---------- Recipient ----------
    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(19)
      .text(snapshot.recipientName || '—', MARGIN, y, { width: contentWidth, align: 'center' });
    y = doc.y + 22;

    // ---------- Body ----------
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(11)
      .text(snapshot.renderedBody || '', MARGIN + 20, y, { width: contentWidth - 40, align: 'left', lineGap: 4 });
    y = doc.y + 20;

    // ---------- Responsibilities / technologies (project-related types) ----------
    if (snapshot.responsibilities?.length) {
      doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(10.5).text('Key Responsibilities', MARGIN + 20, y);
      y = doc.y + 8;
      snapshot.responsibilities.forEach((item) => {
        doc.fillColor(COLORS.gold).font('Helvetica-Bold').fontSize(10).text('—', MARGIN + 20, y, { continued: false, lineBreak: false });
        doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10)
          .text(item, MARGIN + 36, y, { width: contentWidth - 56, lineGap: 2 });
        y = doc.y + 6;
      });
      y += 8;
    }
    if (snapshot.technologies?.length) {
      doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(10.5).text('Technologies', MARGIN + 20, y);
      y = doc.y + 6;
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10)
        .text(snapshot.technologies.join('  •  '), MARGIN + 20, y, { width: contentWidth - 40, lineGap: 2 });
      y = doc.y + 20;
    }

    // ---------- Signature / Seal / QR row (anchored above the footer) ----------
    const rowHeight = 96;
    const rowY = Math.max(y + 20, PAGE.height - 30 - 40 - rowHeight);

    // Signature (left)
    const sigX = MARGIN + 20;
    if (signatureBuffer) {
      try { doc.image(signatureBuffer, sigX, rowY, { width: 110, height: 40, fit: [110, 40] }); } catch { /* skip */ }
    }
    doc.moveTo(sigX, rowY + 46).lineTo(sigX + 150, rowY + 46).lineWidth(1).strokeColor(COLORS.line).stroke();
    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(10).text(snapshot.signatory?.name || 'Authorized Signatory', sigX, rowY + 52);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text(snapshot.signatory?.title || '', sigX, doc.y + 1);

    // Company seal (center)
    const sealCx = PAGE.width / 2;
    const sealCy = rowY + 30;
    if (sealBuffer) {
      try { doc.image(sealBuffer, sealCx - 32, sealCy - 32, { width: 64, height: 64, fit: [64, 64] }); } catch { /* skip */ }
    } else {
      doc.circle(sealCx, sealCy, 32).lineWidth(1).dash(2, { space: 2 }).strokeColor(COLORS.gold).stroke();
      doc.undash();
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7)
        .text('COMPANY\nSEAL', sealCx - 30, sealCy - 10, { width: 60, align: 'center' });
    }

    // QR (right)
    const qrX = PAGE.width - MARGIN - 20 - 70;
    try { doc.image(qrBuffer, qrX, rowY - 4, { width: 70, height: 70 }); } catch { /* skip */ }
    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(7.5)
      .text('SCAN TO VERIFY', qrX - 15, rowY + 68, { width: 100, align: 'center', characterSpacing: 0.5 });

    drawFooterBar(doc, snapshot);
    doc.end();
  });
};

export default generateCertificatePdf;
