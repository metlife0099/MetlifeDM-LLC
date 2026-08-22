const normalizeId = (value) => value?._id?.toString?.() || value?.toString?.() || null;

export const PURCHASABLE_BILLING_CYCLES = new Set([
  'one_time',
  'monthly',
  'quarterly',
  'yearly',
]);

export const normalizeBillingCycle = (cycle) => {
  const supported = new Set(['one_time', 'monthly', 'quarterly', 'yearly', 'custom']);
  return supported.has(cycle) ? cycle : 'one_time';
};

export const billingCycleLabel = (cycle) => {
  const labels = {
    one_time: 'one-time',
    monthly: 'month',
    quarterly: 'quarter',
    yearly: 'year',
    custom: 'custom term',
  };
  return labels[normalizeBillingCycle(cycle)];
};

export const isPlanPurchasable = (plan) => (
  Boolean(plan) && PURCHASABLE_BILLING_CYCLES.has(plan.billingCycle)
);

export const buildCartItem = ({ service, plan = null, quantity = 1 }) => ({
  serviceId: normalizeId(service),
  slug: service.slug,
  serviceName: service.title,
  icon: service.icon,
  planId: normalizeId(plan),
  planName: plan?.name || 'Custom',
  billingCycle: normalizeBillingCycle(plan?.billingCycle || service.billingCycle),
  unitPrice: Number(plan?.price ?? service.startingPrice ?? 0),
  quantity: Math.max(1, Number(quantity) || 1),
});

export const buildOrderItems = (items) =>
  items.map((item) => ({
    service: item.serviceId,
    ...(item.planId ? { planId: item.planId } : {}),
    quantity: Math.max(1, Number(item.quantity) || 1),
  }));

export const buildCouponPreviewPayload = (code, items) => ({
  code: String(code || '').trim().toUpperCase(),
  items: buildOrderItems(items),
});

export const reconcileCartItems = (cartItems, services) => {
  const serviceMap = new Map((services || []).map((service) => [normalizeId(service), service]));
  let removedCount = 0;
  let updatedCount = 0;

  const items = (cartItems || []).flatMap((item) => {
    const service = serviceMap.get(normalizeId(item.serviceId));
    if (!service) {
      removedCount += 1;
      return [];
    }

    const plan = item.planId
      ? service.pricingPlans?.find((candidate) => normalizeId(candidate) === normalizeId(item.planId))
      : null;
    if (item.planId && !plan) {
      removedCount += 1;
      return [];
    }
    if (plan && !isPlanPurchasable(plan)) {
      removedCount += 1;
      return [];
    }

    const current = buildCartItem({ service, plan, quantity: item.quantity });
    const changed =
      current.serviceName !== item.serviceName ||
      current.planName !== item.planName ||
      current.unitPrice !== Number(item.unitPrice) ||
      current.billingCycle !== normalizeBillingCycle(item.billingCycle);
    if (changed) updatedCount += 1;
    return [current];
  });

  return {
    items,
    removedCount,
    updatedCount,
    changed: removedCount > 0 || updatedCount > 0,
  };
};

export const orderTotalDiffers = (order, localTotal) =>
  Boolean(order) && Math.abs(Number(order.total || 0) - Number(localTotal || 0)) >= 0.01;
