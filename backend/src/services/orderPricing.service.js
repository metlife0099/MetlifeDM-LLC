import { Service } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { BILLING_CYCLE } from '../utils/constants.js';
import { fromCents, toCents } from '../utils/money.js';

const CHECKOUT_CURRENCY = 'USD';

export const buildOrderItems = async (rawItems) => {
  const built = [];
  let subtotalCents = 0;
  for (const item of rawItems) {
    const service = await Service.findById(item.service);
    if (!service || !service.isPublished) throw ApiError.badRequest('Service not available');

    let unitPrice = service.startingPrice;
    let planName = service.title;
    let planId;
    let billingCycle = BILLING_CYCLE.ONE_TIME;
    let stripePriceId;
    let stripeProductId;
    let currency = CHECKOUT_CURRENCY;
    if (item.planId) {
      const plan = service.pricingPlans.id(item.planId);
      if (!plan) throw ApiError.badRequest('Pricing plan not found');
      if (plan.billingCycle === BILLING_CYCLE.CUSTOM) {
        throw ApiError.badRequest(`Plan "${plan.name}" is quote-only; request an enquiry to purchase it`);
      }
      unitPrice = plan.price;
      planName = plan.name;
      planId = plan._id;
      billingCycle = plan.billingCycle;
      stripePriceId = plan.stripePriceId;
      stripeProductId = plan.stripeProductId;
      currency = (plan.currency || CHECKOUT_CURRENCY).toUpperCase();
    } else if (unitPrice === null || unitPrice === undefined) {
      throw ApiError.badRequest(`Service "${service.title}" is quote-only`);
    }
    if (currency !== CHECKOUT_CURRENCY) {
      throw ApiError.badRequest(`Only ${CHECKOUT_CURRENCY} plans can be purchased online`);
    }

    let unitCents;
    try {
      unitCents = toCents(unitPrice, `Price for ${planName}`);
    } catch (error) {
      throw ApiError.badRequest(error.message);
    }
    const lineSubtotalCents = unitCents * item.quantity;
    if (!Number.isSafeInteger(lineSubtotalCents)) {
      throw ApiError.badRequest('Cart amount exceeds the supported payment limit');
    }
    subtotalCents += lineSubtotalCents;
    if (!Number.isSafeInteger(subtotalCents)) {
      throw ApiError.badRequest('Cart amount exceeds the supported payment limit');
    }
    built.push({
      service: service._id,
      serviceName: service.title,
      serviceCategory: service.category,
      planId,
      planName,
      billingCycle,
      stripePriceId,
      stripeProductId,
      currency,
      quantity: item.quantity,
      unitPrice: fromCents(unitCents),
      subtotal: fromCents(lineSubtotalCents),
    });
  }
  return { items: built, subtotal: fromCents(subtotalCents), currency: CHECKOUT_CURRENCY };
};

export const getOrderPaymentMode = (items) => {
  if (items.some((item) => item.billingCycle === BILLING_CYCLE.CUSTOM)) {
    throw ApiError.badRequest('Custom plans are quote-only and cannot be purchased online');
  }
  const recurringItems = items.filter((item) => item.billingCycle !== BILLING_CYCLE.ONE_TIME);
  if (!recurringItems.length) return 'one_time';
  if (recurringItems.length !== items.length) {
    throw ApiError.badRequest('One-time and recurring plans must be purchased separately');
  }
  if (new Set(recurringItems.map((item) => item.billingCycle)).size !== 1) {
    throw ApiError.badRequest('Recurring plans with different billing cycles must be purchased separately');
  }
  if (recurringItems.some((item) => !item.stripePriceId)) {
    throw ApiError.badRequest('A recurring plan is missing its Stripe price configuration');
  }
  return 'subscription';
};
