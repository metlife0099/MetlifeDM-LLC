import PDFDocument from 'pdfkit';

const COLORS = {
  navy: '#0F172A',
  cyan: '#06B6D4',
  slate: '#334155',
  muted: '#64748B',
  line: '#E2E8F0',
  bg: '#F8FAFC',
};

const money = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const addressLines = (addr) => {
  if (!addr?.line1) return [];
  const l2 = addr.line1 + (addr.line2 ? `, ${addr.line2}` : '');
  const l3 = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ') + (addr.country ? ` · ${addr.country}` : '');
  return [l2, l3].filter(Boolean);
};

/**
 * Renders a professional invoice PDF for a payment + its order, pulling
 * company details from the global Settings singleton (so it stays in sync
 * with whatever the admin has configured, rather than being hardcoded).
 * Returns a Buffer — the caller decides whether to stream it or store it.
 */
export const generateInvoicePdf = ({ order, payment, settings }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100;
    const site = settings.site || {};
    const contact = settings.contact || {};
    const business = settings.business || {};
    const officeAddress = contact.addresses?.find((a) => a.isPrimary) || contact.addresses?.[0];

    /* ---------- Header band ---------- */
    doc.rect(0, 0, pageWidth, 96).fill(COLORS.navy);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text(site.name || 'MetlifeDM LLC', 50, 32, { lineBreak: false });
    doc.fillColor(COLORS.cyan).font('Helvetica').fontSize(8)
      .text((site.tagline || '').toUpperCase(), 50, 56, { characterSpacing: 0.8, lineBreak: false });

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('INVOICE', 50, 30, { width: contentWidth, align: 'right' });
    doc.fillColor(COLORS.cyan).font('Helvetica').fontSize(10).text(payment.invoiceNumber || '—', 50, 58, { width: contentWidth, align: 'right' });

    let y = 128;

    /* ---------- From / Bill To ---------- */
    const colWidth = contentWidth / 2 - 10;
    const leftX = 50;
    const rightX = 50 + contentWidth / 2 + 10;
    const sectionTop = y;

    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(9).text('FROM', leftX, sectionTop);
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10);
    let ly = sectionTop + 15;
    const fromLines = [
      business.registeredName || site.name || 'MetlifeDM LLC',
      ...addressLines(officeAddress),
      contact.email,
      contact.phone,
      business.ein ? `EIN ${business.ein}` : null,
    ].filter(Boolean);
    fromLines.forEach((line) => {
      doc.text(line, leftX, ly, { width: colWidth });
      ly += 14;
    });

    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(9).text('BILL TO', rightX, sectionTop);
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10);
    let ry = sectionTop + 15;
    const billLines = [
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.customerWebsite,
      ...addressLines(order.billingAddress),
    ].filter(Boolean);
    billLines.forEach((line) => {
      doc.text(line, rightX, ry, { width: colWidth });
      ry += 14;
    });

    y = Math.max(ly, ry) + 15;

    /* ---------- Meta strip ---------- */
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(9);
    doc.text('INVOICE DATE', leftX, y, { width: colWidth });
    doc.text('ORDER NUMBER', rightX, y, { width: colWidth / 2 });
    doc.text('STATUS', rightX + colWidth / 2, y, { width: colWidth / 2, align: 'right' });
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10);
    doc.text(formatDate(payment.paidAt || payment.createdAt), leftX, y + 14, { width: colWidth });
    doc.text(order.orderNumber || '—', rightX, y + 14, { width: colWidth / 2 });
    doc.text((payment.status || 'pending').toUpperCase(), rightX + colWidth / 2, y + 14, { width: colWidth / 2, align: 'right' });

    y += 42;
    doc.moveTo(leftX, y).lineTo(pageWidth - 50, y).strokeColor(COLORS.line).lineWidth(1).stroke();
    y += 20;

    /* ---------- Line items table ---------- */
    const cols = { desc: leftX, qty: leftX + 270, price: leftX + 330, total: leftX + 410 };
    const tableRight = pageWidth - 50;

    const drawTableHeader = () => {
      doc.rect(leftX, y, contentWidth, 22).fill(COLORS.bg);
      doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8);
      doc.text('SERVICE', cols.desc + 8, y + 7, { width: 250 });
      doc.text('QTY', cols.qty, y + 7, { width: 50, align: 'right' });
      doc.text('UNIT PRICE', cols.price, y + 7, { width: 70, align: 'right' });
      doc.text('AMOUNT', cols.total, y + 7, { width: tableRight - cols.total, align: 'right' });
      y += 30;
    };
    drawTableHeader();

    doc.font('Helvetica').fontSize(10).fillColor(COLORS.slate);
    (order.items || []).forEach((item) => {
      if (y > doc.page.height - 180) {
        doc.addPage();
        y = 50;
        drawTableHeader();
      }
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10)
        .text(item.serviceName || 'Service', cols.desc + 8, y, { width: 250 });
      if (item.planName) {
        doc.fillColor(COLORS.muted).fontSize(8).text(item.planName, cols.desc + 8, y + 13, { width: 250 });
      }
      doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10)
        .text(String(item.quantity || 1), cols.qty, y, { width: 50, align: 'right' })
        .text(money(item.unitPrice, order.currency), cols.price, y, { width: 70, align: 'right' })
        .text(money(item.subtotal ?? item.unitPrice * (item.quantity || 1), order.currency), cols.total, y, { width: tableRight - cols.total, align: 'right' });
      const rowHeight = item.planName ? 32 : 20;
      y += rowHeight;
      doc.moveTo(leftX, y).lineTo(tableRight, y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
      y += 12;
    });

    /* ---------- Totals ---------- */
    if (y > doc.page.height - 220) { doc.addPage(); y = 50; }
    const totalsLabelX = leftX + contentWidth - 220;
    const totalsValueX = leftX + contentWidth - 120;
    const totalsValueWidth = 120;

    const totalLine = (label, value, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(bold ? COLORS.navy : COLORS.slate);
      doc.text(label, totalsLabelX, y, { width: 100 });
      doc.text(value, totalsValueX, y, { width: totalsValueWidth, align: 'right' });
      y += bold ? 20 : 16;
    };

    totalLine('Subtotal', money(order.subtotal, order.currency));
    if (order.discount > 0) {
      totalLine(`Discount${order.coupon?.code ? ` (${order.coupon.code})` : ''}`, `-${money(order.discount, order.currency)}`);
    }
    if (order.tax > 0) totalLine('Tax', money(order.tax, order.currency));
    doc.moveTo(totalsLabelX, y).lineTo(tableRight, y).strokeColor(COLORS.line).stroke();
    y += 10;
    totalLine('Total paid', money(payment.amount ?? order.total, order.currency), true);

    /* ---------- Payment method ---------- */
    y += 20;
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(9).text('PAYMENT METHOD', leftX, y);
    y += 14;
    const methodLine = payment.card?.brand
      ? `${payment.card.brand.toUpperCase()} card ending in ${payment.card.last4} — processed securely via Stripe`
      : `Processed securely via Stripe (${payment.method || 'card'})`;
    doc.fillColor(COLORS.slate).font('Helvetica').fontSize(10).text(methodLine, leftX, y, { width: contentWidth });
    y += 14;
    if (payment.stripeChargeId) {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(`Transaction reference: ${payment.stripeChargeId}`, leftX, y, { width: contentWidth });
    }

    /* ---------- Footer ---------- */
    const footerY = doc.page.height - 70;
    doc.moveTo(leftX, footerY).lineTo(tableRight, footerY).strokeColor(COLORS.line).stroke();
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(
      `Thank you for your business. Questions about this invoice? Contact ${contact.supportEmail || contact.email || 'support@metlifedm.com'}.`,
      leftX,
      footerY + 14,
      { width: contentWidth, align: 'center' }
    );

    doc.end();
  });

export default generateInvoicePdf;
