import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuotationSchema, sendQuotationSchema } from '../src/validators/quotation.validator.js';
import { calculateQuotationPricing } from '../src/controllers/quotation.controller.js';
import { generateQuotationPdf } from '../src/services/quotationPdf.service.js';

const payload = () => ({
  client: { name: 'Client Name', email: 'client@example.com', company: '' },
  projectTitle: 'Growth program',
  projectSummary: 'A complete growth program with measurable project deliverables.',
  lineItems: [
    { title: 'Setup', description: 'Initial setup', quantity: 1, unitPrice: 1000 },
    { title: 'Management', description: 'Ongoing work', quantity: 2, unitPrice: 750.25 },
  ],
  currency: 'USD', discount: 100.5, taxRate: 10,
  validUntil: new Date(Date.now() + 86_400_000),
});

test('quotation validation accepts structured project pricing and rejects invalid email delivery', () => {
  assert.equal(createQuotationSchema.safeParse(payload()).success, true);
  const withoutClientEmail = payload();
  withoutClientEmail.client.email = '';
  assert.equal(createQuotationSchema.safeParse(withoutClientEmail).success, true);
  const inrQuotation = payload();
  inrQuotation.currency = 'INR';
  assert.equal(createQuotationSchema.safeParse(inrQuotation).success, true);
  const unsupportedCurrency = payload();
  unsupportedCurrency.currency = 'EUR';
  assert.equal(createQuotationSchema.safeParse(unsupportedCurrency).success, false);
  assert.equal(sendQuotationSchema.safeParse({ recipientEmail: 'bad', subject: 'Quote', message: 'Attached' }).success, false);
});

test('quotation totals are calculated by the server with currency-safe rounding', () => {
  const result = calculateQuotationPricing(payload());
  assert.equal(result.subtotal, 2500.5);
  assert.equal(result.discount, 100.5);
  assert.equal(result.tax, 240);
  assert.equal(result.total, 2640);
  assert.deepEqual(result.lineItems.map((item) => item.amount), [1000, 1500.5]);
});

test('quotation PDF is a valid generated PDF document', async () => {
  const pricing = calculateQuotationPricing(payload());
  const pdf = await generateQuotationPdf({
    ...payload(), ...pricing,
    quotationNumber: 'MLDM/QTN/2026/0001', version: 1, createdAt: new Date(),
    scope: ['Discovery'], deliverables: ['Roadmap'],
    branding: { companyName: 'MetlifeDM LLC', email: 'metlifedm4u@gmail.com', signatory: { name: 'CEO', title: 'Chief Executive Officer' } },
  });
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.ok(pdf.length > 1000);
});

test('INR quotation PDF renders with portable currency labeling', async () => {
  const inr = payload();
  inr.currency = 'INR';
  const pricing = calculateQuotationPricing(inr);
  const pdf = await generateQuotationPdf({
    ...inr, ...pricing,
    quotationNumber: 'MLDM/QTN/2026/0002', version: 1, createdAt: new Date(),
    branding: { companyName: 'MetlifeDM LLC', signatory: { name: 'CEO', title: 'Chief Executive Officer' } },
  });
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.ok(pdf.length > 1000);
});
