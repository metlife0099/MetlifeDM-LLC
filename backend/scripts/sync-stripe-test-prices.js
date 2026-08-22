import mongoose from 'mongoose';
import { config } from '../src/config/index.js';
import connectDatabase, { disconnectDatabase } from '../src/config/database.js';
import stripe from '../src/config/stripe.js';
import { Service } from '../src/models/index.js';
import { BILLING_CYCLE } from '../src/utils/constants.js';
import { toCents } from '../src/utils/money.js';

const APPLY = process.argv.includes('--apply');
const INTERVALS = {
  [BILLING_CYCLE.MONTHLY]: { interval: 'month', interval_count: 1 },
  [BILLING_CYCLE.QUARTERLY]: { interval: 'month', interval_count: 3 },
  [BILLING_CYCLE.YEARLY]: { interval: 'year', interval_count: 1 },
};

const isRecurring = (plan) => Boolean(INTERVALS[plan.billingCycle]);
const stableKey = (service, plan, resource) =>
  `metlifedm:${resource}:${service._id}:${plan._id}:${toCents(plan.price)}:${plan.billingCycle}`;

const run = async () => {
  if (!config.stripe.secretKey.startsWith('sk_test_')) {
    throw new Error('Refusing to create catalog objects: this command only accepts a Stripe test secret key');
  }

  await connectDatabase();
  const services = await Service.find({
    isPublished: true,
    pricingPlans: {
      $elemMatch: {
        billingCycle: { $in: Object.keys(INTERVALS) },
        $or: [{ stripePriceId: { $exists: false } }, { stripePriceId: null }, { stripePriceId: '' }],
      },
    },
  });

  const missing = services.flatMap((service) =>
    service.pricingPlans
      .filter((plan) => isRecurring(plan) && !plan.stripePriceId)
      .map((plan) => ({ service, plan }))
  );

  if (!missing.length) {
    console.log('All published recurring plans already have Stripe test Price IDs.');
    return;
  }

  if (!APPLY) {
    missing.forEach(({ service, plan }) => console.log(`${service.title} / ${plan.name}`));
    console.log(`Found ${missing.length} recurring plan(s) without Stripe prices. Re-run with --apply.`);
    return;
  }

  for (const service of services) {
    const plans = service.pricingPlans.filter((plan) => isRecurring(plan) && !plan.stripePriceId);
    for (const plan of plans) {
      const product = plan.stripeProductId
        ? await stripe.products.retrieve(plan.stripeProductId)
        : await stripe.products.create(
          {
            name: `${service.title} - ${plan.name}`,
            description: service.shortDescription,
            metadata: {
              environment: 'test',
              serviceId: service._id.toString(),
              planId: plan._id.toString(),
            },
          },
          { idempotencyKey: stableKey(service, plan, 'product') }
        );

      const price = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: toCents(plan.price, `${service.title} / ${plan.name}`),
          currency: (plan.currency || config.stripe.currency || 'USD').toLowerCase(),
          recurring: INTERVALS[plan.billingCycle],
          metadata: {
            environment: 'test',
            serviceId: service._id.toString(),
            planId: plan._id.toString(),
          },
        },
        { idempotencyKey: stableKey(service, plan, 'price') }
      );

      plan.stripeProductId = product.id;
      plan.stripePriceId = price.id;
      console.log(`Configured ${service.title} / ${plan.name}: ${price.id}`);
    }
    await service.save();
  }

  console.log(`Configured ${missing.length} Stripe test recurring price(s).`);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await disconnectDatabase();
  });
