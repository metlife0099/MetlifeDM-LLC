import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '../assets/logo.png');

const COLORS = {
  navy: '#0A1730',
  navySoft: '#1A2340',
  ultra: '#1547FF',
  ultraSoft: '#8FA3FF',
  slate: '#64748B',
  ink: '#0A1730',
  line: '#E2E8F0',
  bg: '#F8FAFC',
};

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

/**
 * Renders a professional, MetlifeDM-branded case study PDF: a full photo +
 * branding cover page, followed by a results/overview page and a narrative
 * report (challenge → approach → solution → result), pulling company details
 * from the global Settings singleton. Returns a Buffer.
 */
export const generateCaseStudyPdf = async ({ caseStudy: cs, settings }) => {
  const heroBuffer = await fetchImageBuffer(cs.heroImage?.url);
  const site = settings?.site || {};
  const contact = settings?.contact || {};

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    /* ============================================================
     * COVER PAGE
     * ============================================================ */
    doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.navy);

    const photoHeight = pageHeight * 0.55;
    if (heroBuffer) {
      try {
        doc.save();
        doc.rect(0, 0, pageWidth, photoHeight).clip();
        doc.image(heroBuffer, 0, 0, { width: pageWidth, height: photoHeight });
        doc.restore();
        // Moody wash so the cover reads as one cohesive brand piece, not a raw photo
        doc.rect(0, 0, pageWidth, photoHeight).fillOpacity(0.32).fill(COLORS.navy).fillOpacity(1);
      } catch {
        // Corrupt/unreadable image — solid navy backdrop already drawn.
      }
    }

    // Accent line between photo and brand panel
    doc.rect(0, photoHeight, pageWidth, 3).fill(COLORS.ultra);

    // Logo, centered in the brand panel
    const logoSize = 52;
    try {
      doc.image(LOGO_PATH, pageWidth / 2 - logoSize / 2, photoHeight + 34, { width: logoSize });
    } catch {
      // Missing asset — proceed with text-only branding below.
    }

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(15)
      .text((site.name || 'MetlifeDM').toUpperCase(), 0, photoHeight + 96, { width: pageWidth, align: 'center', characterSpacing: 2.5 });
    doc.fillColor(COLORS.ultraSoft).font('Helvetica').fontSize(9)
      .text((site.tagline || 'Digital Marketing Excellence for USA Businesses').toUpperCase(), 0, photoHeight + 116, { width: pageWidth, align: 'center', characterSpacing: 1.2 });

    let coverY = photoHeight + 150;
    doc.fillColor(COLORS.ultraSoft).font('Helvetica-Bold').fontSize(10)
      .text('CASE STUDY', 60, coverY, { width: pageWidth - 120, align: 'center', characterSpacing: 3 });
    coverY += 24;
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(26)
      .text(cs.title, 60, coverY, { width: pageWidth - 120, align: 'center' });
    coverY = doc.y + 14;

    const metaBits = [cs.client, cs.industry, cs.year ? String(cs.year) : null].filter(Boolean);
    if (metaBits.length) {
      doc.fillColor('#B9C2DB').font('Helvetica').fontSize(11)
        .text(metaBits.join('   ·   '), 60, coverY, { width: pageWidth - 120, align: 'center' });
    }

    doc.fillColor('#7C87A3').font('Helvetica').fontSize(8)
      .text(`Prepared ${formatDate(new Date())}`, 0, pageHeight - 36, { width: pageWidth, align: 'center' });

    /* ============================================================
     * PAGE 2 — OVERVIEW + RESULTS
     * ============================================================ */
    doc.addPage({ margin: 50 });
    const contentWidth = pageWidth - 100;
    const leftX = 50;

    const drawRunningHeader = (label) => {
      doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(11).text(site.name || 'MetlifeDM', leftX, 40, { lineBreak: false });
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9).text(label, leftX, 40, { width: contentWidth, align: 'right', lineBreak: false });
      doc.moveTo(leftX, 58).lineTo(pageWidth - 50, 58).strokeColor(COLORS.line).lineWidth(1).stroke();
      return 76;
    };
    const ensureSpace = (y, needed, label) => {
      if (y + needed > pageHeight - 60) {
        doc.addPage({ margin: 50 });
        return drawRunningHeader(label);
      }
      return y;
    };

    let y = drawRunningHeader('Case Study Report');

    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(20).text(cs.title, leftX, y, { width: contentWidth });
    y = doc.y + 6;
    if (cs.tagline) {
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(11).text(cs.tagline, leftX, y, { width: contentWidth });
      y = doc.y + 16;
    } else {
      y += 10;
    }

    // Meta strip
    const metaCols = [
      { label: 'CLIENT', value: cs.client },
      { label: 'INDUSTRY', value: cs.industry },
      { label: 'CATEGORY', value: cs.category?.name },
      { label: 'YEAR', value: cs.year ? String(cs.year) : null },
    ].filter((m) => m.value);
    if (metaCols.length) {
      const colWidth = contentWidth / metaCols.length;
      metaCols.forEach((m, i) => {
        doc.fillColor(COLORS.slate).font('Helvetica-Bold').fontSize(8).text(m.label, leftX + i * colWidth, y, { width: colWidth - 10, characterSpacing: 0.5 });
        doc.fillColor(COLORS.navy).font('Helvetica').fontSize(11).text(m.value, leftX + i * colWidth, y + 13, { width: colWidth - 10 });
      });
      y += 46;
      doc.moveTo(leftX, y).lineTo(pageWidth - 50, y).strokeColor(COLORS.line).lineWidth(1).stroke();
      y += 20;
    }

    // Results / KPIs
    if (cs.kpis?.length > 0) {
      doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(13).text('Results', leftX, y);
      y = doc.y + 12;

      const kpiColWidth = contentWidth / Math.min(cs.kpis.length, 3);
      let col = 0;
      let rowStartY = y;
      cs.kpis.forEach((k, i) => {
        y = ensureSpace(rowStartY, 90, 'Case Study Report — Results');
        if (y !== rowStartY) { rowStartY = y; col = 0; }
        const x = leftX + col * kpiColWidth;

        doc.rect(x, rowStartY, kpiColWidth - 14, 78).fill(COLORS.bg);
        doc.fillColor(COLORS.ultra).font('Helvetica-Bold').fontSize(16).text(k.after || '—', x + 12, rowStartY + 12, { width: kpiColWidth - 38 });
        if (k.before) {
          doc.fillColor(COLORS.slate).font('Helvetica').fontSize(8).text(`from ${k.before}`, x + 12, doc.y + 2, { width: kpiColWidth - 38 });
        }
        doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9).text(k.label || '', x + 12, rowStartY + 56, { width: kpiColWidth - 38 });

        col += 1;
        if (col >= 3 || i === cs.kpis.length - 1) {
          y = rowStartY + 90;
          col = 0;
          rowStartY = y;
        }
      });
      y += 10;
    }

    /* ============================================================
     * NARRATIVE — Challenge / Approach / Solution / Result
     * ============================================================ */
    const steps = [
      { label: 'The Challenge', body: cs.challenge },
      { label: 'The Approach', body: cs.approach },
      { label: 'The Solution', body: cs.solution },
      { label: 'The Result', body: cs.result },
    ].filter((s) => s.body);

    steps.forEach((s) => {
      y = ensureSpace(y, 60, 'Case Study Report');
      doc.fillColor(COLORS.ultra).font('Helvetica-Bold').fontSize(13).text(s.label, leftX, y, { width: contentWidth });
      y = doc.y + 6;
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10.5).text(s.body, leftX, y, { width: contentWidth, lineGap: 3 });
      y = doc.y + 22;
    });

    // Testimonial
    if (cs.testimonial?.quote) {
      y = ensureSpace(y, 90, 'Case Study Report');
      doc.rect(leftX, y, contentWidth, 4).fill(COLORS.ultra);
      y += 18;
      doc.fillColor(COLORS.navy).font('Helvetica-BoldOblique').fontSize(13)
        .text(`“${cs.testimonial.quote}”`, leftX, y, { width: contentWidth, lineGap: 3 });
      y = doc.y + 10;
      const attribution = [cs.testimonial.author, cs.testimonial.role].filter(Boolean).join(' · ');
      if (attribution) {
        doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9).text(attribution.toUpperCase(), leftX, y, { width: contentWidth, characterSpacing: 0.5 });
        y = doc.y + 16;
      }
    }

    // Footer on final page
    const footerY = pageHeight - 50;
    doc.moveTo(leftX, footerY).lineTo(pageWidth - 50, footerY).strokeColor(COLORS.line).stroke();
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(9).text(
      `Want results like these? Talk to us at ${contact.email || 'hello@metlifedm.com'}.`,
      leftX, footerY + 14, { width: contentWidth, align: 'center' }
    );

    doc.end();
  });
};

export default generateCaseStudyPdf;
