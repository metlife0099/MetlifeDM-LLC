import { randomUUID } from 'node:crypto';
import stripe from '../config/stripe.js';
import { config } from '../config/index.js';
import { Order, Payment, User, Service, Coupon } from '../models/index.js';
import { ORDER_STATUS, PAYMENT_STATUS, BILLING_CYCLE } from '../utils/constants.js';
import emailService from './email.service.js';
import { notify, notifyAdmins } from '../controllers/notification.controller.js';
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';
import { finalizeCouponUsage, releaseCouponReservation } from './coupon.service.js';

const TERMINAL_ORDER_STATUSES = new Set([
  ORDER_STATUS.PAID,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);
const PAYMENT_SETUP_LEASE_MS = 5 * 60 * 1000;

const getId = (value) => (typeof value === 'string' ? value : value?.id);
const customerIdFor = (order) => order.customer?._id || order.customer;

export const toStripeRefundReason = (reason) => {
  const normalized = reason?.trim().toLowerCase();
  return ['duplicate', 'fraudulent', 'requested_by_customer'].includes(normalized)
    ? normalized
    : 'requested_by_customer';
};

export const isRecurringOrder = (order) =>
  order.paymentMode === 'subscription' ||
  order.items.some((item) => item.billingCycle && item.billingCycle !== BILLING_CYCLE.ONE_TIME);

/** Get or create one stable Stripe Customer per local user. */
export const getOrCreateStripeCustomer = async (user) => {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const freshUser = await User.findById(user._id).select('+stripeCustomerId');
  if (freshUser?.stripeCustomerId) return freshUser.stripeCustomerId;

  const customer = await stripe.customers.create(
    {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone || undefined,
      metadata: { userId: user._id.toString() },
    },
    { idempotencyKey: `customer:user:${user._id}` }
  );
  await User.updateOne(
    { _id: user._id, $or: [{ stripeCustomerId: null }, { stripeCustomerId: { $exists: false } }] },
    { $set: { stripeCustomerId: customer.id } }
  );
  return (await User.findById(user._id).select('stripeCustomerId'))?.stripeCustomerId || customer.id;
};

const claimPaymentSetup = async (orderId) => {
  const now = new Date();
  const token = randomUUID();
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      $or: [
        { 'paymentSetupLock.expiresAt': { $exists: false } },
        { 'paymentSetupLock.expiresAt': { $lte: now } },
      ],
    },
    {
      $set: {
        paymentSetupLock: { token, expiresAt: new Date(now.getTime() + PAYMENT_SETUP_LEASE_MS) },
      },
    },
    { new: true }
  ).select('+paymentAttempt');
  if (!order) throw ApiError.conflict('Payment setup is already in progress; retry shortly');
  return { order, token };
};

const releasePaymentSetup = (orderId, token) =>
  Order.updateOne({ _id: orderId, 'paymentSetupLock.token': token }, { $unset: { paymentSetupLock: 1 } });

const retireProviderGeneration = async ({
  orderId,
  token,
  expectedAttempt,
  providerType,
  providerId,
}) => {
  const providerField = providerType === 'subscription'
    ? 'stripeSubscriptionId'
    : 'stripePaymentIntentId';
  const result = await Order.updateOne(
    {
      _id: orderId,
      paymentAttempt: expectedAttempt,
      $or: [
        { 'paymentSetupLock.token': token },
        { [providerField]: providerId },
        { [providerField]: { $exists: false } },
      ],
    },
    {
      $inc: { paymentAttempt: 1 },
      $unset: {
        paymentSetupLock: 1,
        paymentRecovery: 1,
        [providerField]: 1,
        ...(providerType === 'subscription' ? { stripePaymentIntentId: 1 } : {}),
      },
    }
  );
  if (result.modifiedCount === 1) return result;

  // A no-op is safe only if another request already advanced this generation.
  const current = await Order.findById(orderId).select('+paymentAttempt');
  if (current && current.paymentAttempt > expectedAttempt) return result;
  const error = ApiError.internal('Could not durably retire the terminal Stripe payment generation');
  error.checkoutCleanupUnsafe = true;
  throw error;
};

const recordUncertainProvider = async ({
  orderId,
  token,
  providerType,
  providerId,
  providerStatus,
  expectedAttempt,
  error,
}) => {
  const providerField = providerType === 'subscription'
    ? 'stripeSubscriptionId'
    : 'stripePaymentIntentId';
  const recovery = {
    required: true,
    providerType,
    providerId,
    providerStatus,
    recordedAt: new Date(),
    lastError: String(error?.message || 'Provider cancellation outcome unknown').slice(0, 500),
  };
  const result = await Order.updateOne(
    {
      _id: orderId,
      paymentAttempt: expectedAttempt,
      $or: [
        { 'paymentSetupLock.token': token },
        { [providerField]: providerId },
        { [providerField]: { $exists: false } },
      ],
    },
    {
      $set: { [providerField]: providerId, paymentRecovery: recovery },
      // Clearing a competing same-generation lock is safe: Stripe's
      // idempotency key points both attempts at this exact recovery object.
      $unset: { paymentSetupLock: 1 },
    }
  );
  if (result.modifiedCount === 1) return result;

  const current = await Order.findById(orderId)
    .select('+paymentAttempt +paymentRecovery stripePaymentIntentId stripeSubscriptionId');
  if (
    current &&
    (current.paymentAttempt > expectedAttempt || current[providerField] === providerId)
  ) return result;
  const persistenceError = ApiError.internal('Stripe created a payment object that could not be reconciled locally');
  persistenceError.checkoutCleanupUnsafe = true;
  throw persistenceError;
};

const stripeOrderMetadata = (order, user) => ({
  orderId: order._id.toString(),
  orderNumber: order.orderNumber,
  userId: user._id.toString(),
});

const createOneTimeIntent = async (order, user, customerId) => {
  const { order: claimed, token } = await claimPaymentSetup(order._id);
  let intent;
  try {
    intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(claimed.total * 100),
        currency: (claimed.currency || config.stripe.currency || 'USD').toLowerCase(),
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        receipt_email: user.email,
        description: `Order ${claimed.orderNumber}`,
        metadata: stripeOrderMetadata(claimed, user),
      },
      { idempotencyKey: `order:${claimed._id}:payment-intent:${claimed.paymentAttempt}` }
    );
    if (intent.status === 'canceled') {
      throw ApiError.conflict('The previous payment setup was cancelled and is being replaced; retry shortly');
    }

    const linked = await Order.updateOne(
      { _id: claimed._id, 'paymentSetupLock.token': token },
      {
        $set: {
          paymentMode: 'one_time',
          stripePaymentIntentId: intent.id,
          stripeCustomerId: customerId,
        },
        $unset: { paymentSetupLock: 1, paymentRecovery: 1 },
      }
    );
    if (linked.modifiedCount !== 1) {
      throw ApiError.conflict('Payment setup lock expired before the intent could be linked');
    }
    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      paymentMode: 'one_time',
    };
  } catch (error) {
    let cancellationConfirmed = false;
    if (intent?.status === 'canceled') cancellationConfirmed = true;
    else if (intent) {
      try {
        await stripe.paymentIntents.cancel(intent.id);
        cancellationConfirmed = true;
      } catch (cancelError) {
        error.checkoutCleanupUnsafe = true;
        logger.error(`Could not cancel unlinked PaymentIntent ${intent.id}: ${cancelError.message}`);
      }
    }
    if (cancellationConfirmed) {
      await retireProviderGeneration({
        orderId: order._id,
        token,
        expectedAttempt: claimed.paymentAttempt,
        providerType: 'payment_intent',
        providerId: intent?.id,
      });
    } else if (intent) {
      await recordUncertainProvider({
        orderId: order._id,
        token,
        providerType: 'payment_intent',
        providerId: intent.id,
        providerStatus: intent.status,
        expectedAttempt: claimed.paymentAttempt,
        error,
      });
    } else {
      await releasePaymentSetup(order._id, token);
    }
    throw error;
  }
};

const STRIPE_INTERVALS = {
  [BILLING_CYCLE.MONTHLY]: { interval: 'month', intervalCount: 1 },
  [BILLING_CYCLE.QUARTERLY]: { interval: 'month', intervalCount: 3 },
  [BILLING_CYCLE.YEARLY]: { interval: 'year', intervalCount: 1 },
};

const validateStripeSubscriptionPrices = async (order, items) => {
  const currency = (order.currency || 'USD').toLowerCase();
  await Promise.all(items.map(async (item) => {
    const expectedInterval = STRIPE_INTERVALS[item.billingCycle];
    if (!expectedInterval) {
      throw ApiError.badRequest(`Billing cycle ${item.billingCycle} is not supported by Stripe checkout`);
    }
    const price = await stripe.prices.retrieve(item.stripePriceId);
    const unitAmount = price.unit_amount ?? Number(price.unit_amount_decimal);
    const expectedAmount = Math.round(item.unitPrice * 100);
    const productId = getId(price.product);
    if (!price.active) throw ApiError.badRequest(`Stripe price ${price.id} is inactive`);
    if (price.currency !== currency) {
      throw ApiError.badRequest(`Stripe price ${price.id} currency does not match the order`);
    }
    if (!Number.isFinite(unitAmount) || unitAmount !== expectedAmount) {
      throw ApiError.badRequest(`Stripe price ${price.id} amount does not match the displayed plan price`);
    }
    if (
      price.type !== 'recurring' ||
      price.recurring?.interval !== expectedInterval.interval ||
      (price.recurring?.interval_count || 1) !== expectedInterval.intervalCount
    ) {
      throw ApiError.badRequest(`Stripe price ${price.id} billing interval does not match the plan`);
    }
    if (item.stripeProductId && productId !== item.stripeProductId) {
      throw ApiError.badRequest(`Stripe price ${price.id} is linked to the wrong product`);
    }
  }));
};

const assertInvoiceTotal = (invoice, order) => {
  const expectedCents = Math.round(order.total * 100);
  if (!invoice || invoice.total !== expectedCents || invoice.amount_due !== expectedCents) {
    throw ApiError.conflict('Stripe invoice total does not match the displayed order total');
  }
};

const createSubscription = async (order, user, customerId) => {
  const recurringItems = order.items.filter(
    (item) => item.billingCycle && item.billingCycle !== BILLING_CYCLE.ONE_TIME
  );
  if (recurringItems.length !== order.items.length) {
    throw ApiError.badRequest('One-time and recurring plans must be purchased separately');
  }
  if (recurringItems.some((item) => !item.stripePriceId)) {
    throw ApiError.badRequest('A recurring plan is missing its Stripe price configuration');
  }
  const billingCycles = new Set(recurringItems.map((item) => item.billingCycle));
  if (billingCycles.size !== 1) {
    throw ApiError.badRequest('Recurring plans with different billing cycles must be purchased separately');
  }

  await validateStripeSubscriptionPrices(order, recurringItems);

  const { order: claimed, token } = await claimPaymentSetup(order._id);
  let subscription;
  let providerLinked = false;
  try {
    const couponDoc = claimed.coupon?.code
      ? await Coupon.findOne({ code: claimed.coupon.code })
      : null;
    const discounts = couponDoc?.stripePromoCodeId
      ? [{ promotion_code: couponDoc.stripePromoCodeId }]
      : couponDoc?.stripeCouponId
        ? [{ coupon: couponDoc.stripeCouponId }]
        : [];
    const subscriptionItems = recurringItems.map((item) => ({
      price: item.stripePriceId,
      quantity: item.quantity,
    }));
    const preview = await stripe.invoices.createPreview({
      customer: customerId,
      discounts,
      subscription_details: { items: subscriptionItems },
    });
    assertInvoiceTotal(preview, claimed);

    subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: subscriptionItems,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        metadata: stripeOrderMetadata(claimed, user),
        discounts,
        expand: ['latest_invoice.payment_intent'],
      },
      { idempotencyKey: `order:${claimed._id}:subscription:${claimed.paymentAttempt}` }
    );
    if (['canceled', 'incomplete_expired'].includes(subscription.status)) {
      throw ApiError.conflict('The previous subscription setup expired and is being replaced; retry shortly');
    }

    const invoice = typeof subscription.latest_invoice === 'object'
      ? subscription.latest_invoice
      : subscription.latest_invoice
        ? await stripe.invoices.retrieve(subscription.latest_invoice, { expand: ['payment_intent'] })
        : null;
    assertInvoiceTotal(invoice, claimed);
    const intent = invoice && typeof invoice.payment_intent === 'object' ? invoice.payment_intent : null;
    const paymentIntentId = getId(invoice?.payment_intent);
    const linked = await Order.updateOne(
      { _id: claimed._id, 'paymentSetupLock.token': token },
      {
        $set: {
          paymentMode: 'subscription',
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          stripeCustomerId: customerId,
          ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
        },
        $unset: { paymentSetupLock: 1, paymentRecovery: 1 },
      }
    );
    if (linked.modifiedCount !== 1) {
      throw ApiError.conflict('Payment setup lock expired before the subscription could be linked');
    }
    providerLinked = true;

    if (invoice?.status === 'paid') {
      await handleInvoicePaymentSucceeded(invoice);
    }
    return {
      clientSecret: intent?.client_secret || null,
      paymentIntentId: paymentIntentId || null,
      subscriptionId: subscription.id,
      paymentMode: 'subscription',
    };
  } catch (error) {
    let cancellationConfirmed = false;
    if (subscription && ['canceled', 'incomplete_expired'].includes(subscription.status)) {
      cancellationConfirmed = true;
    } else if (
      subscription &&
      !providerLinked &&
      !['canceled', 'incomplete_expired'].includes(subscription.status)
    ) {
      try {
        await stripe.subscriptions.cancel(subscription.id);
        cancellationConfirmed = true;
      } catch (cancelError) {
        error.checkoutCleanupUnsafe = true;
        logger.error(`Could not cancel unlinked Subscription ${subscription.id}: ${cancelError.message}`);
      }
    }
    if (providerLinked) error.checkoutCleanupUnsafe = true;
    if (cancellationConfirmed) {
      await retireProviderGeneration({
        orderId: order._id,
        token,
        expectedAttempt: claimed.paymentAttempt,
        providerType: 'subscription',
        providerId: subscription?.id,
      });
    } else if (subscription && !providerLinked) {
      await recordUncertainProvider({
        orderId: order._id,
        token,
        providerType: 'subscription',
        providerId: subscription.id,
        providerStatus: subscription.status,
        expectedAttempt: claimed.paymentAttempt,
        error,
      });
    } else {
      await releasePaymentSetup(order._id, token);
    }
    throw error;
  }
};

const createZeroTotalPayment = async (order) => {
  let payment = await Payment.findOne({ order: order._id, 'metadata.zeroTotal': true });
  if (!payment) {
    payment = await Payment.create({
      order: order._id,
      customer: customerIdFor(order),
      amount: 0,
      currency: order.currency,
      status: PAYMENT_STATUS.SUCCEEDED,
      paidAt: new Date(),
      metadata: { zeroTotal: true },
    });
  }
  await synchronizePaidOrder(order, payment, 'Order fully discounted');
  return { clientSecret: null, paymentIntentId: null, paymentMode: 'one_time', payment };
};

/** Create either a PaymentIntent or Subscription based on immutable line snapshots. */
export const createPaymentIntent = async (order, user) => {
  if (!isRecurringOrder(order) && order.total <= 0) return createZeroTotalPayment(order);
  const customerId = await getOrCreateStripeCustomer(user);
  return isRecurringOrder(order)
    ? createSubscription(order, user, customerId)
    : createOneTimeIntent(order, user, customerId);
};

const retrieveCharge = async (chargeOrId) => {
  if (!chargeOrId) return null;
  if (typeof chargeOrId === 'object') return chargeOrId;
  return stripe.charges.retrieve(chargeOrId);
};

const paymentDataFromIntent = async (intent, order, status) => {
  const charge = await retrieveCharge(intent.latest_charge);
  const amount = (intent.amount_received || intent.amount || 0) / 100;
  const amountRefunded = (charge?.amount_refunded || 0) / 100;
  const derivedStatus = status === PAYMENT_STATUS.SUCCEEDED && amountRefunded > 0
    ? (amountRefunded + 0.000001 >= amount
        ? PAYMENT_STATUS.REFUNDED
        : PAYMENT_STATUS.PARTIALLY_REFUNDED)
    : status;
  return {
    order: order._id,
    customer: customerIdFor(order),
    amount,
    amountRefunded,
    currency: (intent.currency || order.currency || 'USD').toUpperCase(),
    status: derivedStatus,
    stripePaymentIntentId: intent.id,
    stripeChargeId: charge?.id,
    stripeCustomerId: getId(intent.customer),
    stripeReceiptUrl: charge?.receipt_url,
    card: charge?.payment_method_details?.card
      ? {
          brand: charge.payment_method_details.card.brand,
          last4: charge.payment_method_details.card.last4,
          expMonth: charge.payment_method_details.card.exp_month,
          expYear: charge.payment_method_details.card.exp_year,
          country: charge.payment_method_details.card.country,
        }
      : undefined,
    paidAt: status === PAYMENT_STATUS.SUCCEEDED ? new Date() : undefined,
    failureCode: status === PAYMENT_STATUS.FAILED ? intent.last_payment_error?.code : undefined,
    failureMessage: status === PAYMENT_STATUS.FAILED ? intent.last_payment_error?.message : undefined,
    metadata: intent.metadata,
  };
};

const saveProviderPayment = async ({ paymentIntentId, invoiceId, data, allowFailure = false }) => {
  const identifiers = [
    ...(paymentIntentId ? [{ stripePaymentIntentId: paymentIntentId }] : []),
    ...(invoiceId ? [{ stripeInvoiceId: invoiceId }] : []),
  ];
  if (!identifiers.length) throw ApiError.internal('Payment provider reference missing');
  let payment = await Payment.findOne({ $or: identifiers });

  if (payment) {
    if (
      !allowFailure ||
      ![
        PAYMENT_STATUS.SUCCEEDED,
        PAYMENT_STATUS.PARTIALLY_REFUNDED,
        PAYMENT_STATUS.REFUNDED,
      ].includes(payment.status)
    ) {
      const priorStatus = payment.status;
      const priorRefunded = payment.amountRefunded;
      Object.assign(payment, data);
      if (
        [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(priorStatus) &&
        data.status === PAYMENT_STATUS.SUCCEEDED
      ) {
        payment.status = priorStatus;
        payment.amountRefunded = Math.max(priorRefunded, data.amountRefunded || 0);
      }
      if (data.status !== PAYMENT_STATUS.FAILED) {
        payment.failureCode = undefined;
        payment.failureMessage = undefined;
      }
      await payment.save();
    }
    return payment;
  }

  try {
    return await Payment.create(data);
  } catch (error) {
    if (error.code !== 11000) throw error;
    payment = await Payment.findOne({ $or: identifiers });
    if (!payment) throw error;
    const priorStatus = payment.status;
    const priorRefunded = payment.amountRefunded;
    Object.assign(payment, data);
    if (
      [PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(priorStatus) &&
      data.status === PAYMENT_STATUS.SUCCEEDED
    ) {
      payment.status = priorStatus;
      payment.amountRefunded = Math.max(priorRefunded, data.amountRefunded || 0);
    }
    await payment.save();
    return payment;
  }
};

const SIDE_EFFECT_LEASE_MS = 5 * 60 * 1000;

const runLeasedSideEffect = async ({ Model, id, doneField, leaseField, work }) => {
  const now = new Date();
  const claimed = await Model.findOneAndUpdate(
    {
      _id: id,
      $and: [
        { $or: [{ [doneField]: null }, { [doneField]: { $exists: false } }] },
        { $or: [{ [leaseField]: { $exists: false } }, { [leaseField]: { $lte: now } }] },
      ],
    },
    { $set: { [leaseField]: new Date(now.getTime() + SIDE_EFFECT_LEASE_MS) } },
    { new: true }
  );
  if (!claimed) return false;

  try {
    await work();
    const completed = await Model.updateOne(
      { _id: id, [doneField]: { $exists: false }, [leaseField]: { $gt: now } },
      { $set: { [doneField]: new Date() }, $unset: { [leaseField]: 1 } }
    );
    if (completed.modifiedCount !== 1) {
      throw new Error(`Could not persist completion marker ${doneField}`);
    }
    return true;
  } catch (error) {
    await Model.updateOne(
      { _id: id, [doneField]: { $exists: false } },
      { $unset: { [leaseField]: 1 } }
    ).catch(() => {});
    throw error;
  }
};

const applyPaidSideEffects = async (order, payment) => {
  await finalizeCouponUsage(order);

  const customer = order.customer?.email
    ? order.customer
    : await User.findById(customerIdFor(order));
  const tasks = [
    runLeasedSideEffect({
      Model: Order,
      id: order._id,
      doneField: 'acquisitionSideEffectsAppliedAt',
      leaseField: 'acquisitionSideEffectsLeaseUntil',
      work: () => Service.bulkWrite(
        order.items.map((item) => ({
          updateOne: {
            filter: { _id: item.service },
            update: { $inc: { 'stats.purchases': item.quantity || 1 } },
          },
        }))
      ),
    }),
  ];

  if (customer) {
    tasks.push(
      runLeasedSideEffect({
        Model: Order,
        id: order._id,
        doneField: 'orderConfirmationEmailSentAt',
        leaseField: 'orderConfirmationEmailLeaseUntil',
        work: () => emailService.orderConfirmation(customer, order),
      }),
      runLeasedSideEffect({
        Model: Payment,
        id: payment._id,
        doneField: 'receiptEmailSentAt',
        leaseField: 'receiptEmailLeaseUntil',
        work: () => emailService.paymentReceipt(customer, payment, order),
      }),
      runLeasedSideEffect({
        Model: Payment,
        id: payment._id,
        doneField: 'customerNotificationSentAt',
        leaseField: 'customerNotificationLeaseUntil',
        work: () => notify({
          recipient: customer._id,
          type: 'payment',
          title: 'Payment received',
          message: `Your payment of $${payment.amount} for ${order.orderNumber} was successful.`,
          resourceType: 'order',
          resourceId: order._id,
          actionUrl: `/dashboard/orders/${order._id}`,
        }),
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) {
    logger.warn(`Paid-order side effect will be retried: ${failed.reason?.message || failed.reason}`);
    throw failed.reason;
  }
};

const synchronizePaidOrder = async (order, payment, note = 'Payment received') => {
  const paymentPaidAt = payment.paidAt || new Date();
  await Order.updateOne(
    {
      _id: order._id,
      $or: [
        { latestPaymentPaidAt: { $exists: false } },
        { latestPaymentPaidAt: { $lte: paymentPaidAt } },
      ],
    },
    {
      $set: {
        payment: payment._id,
        latestPaymentPaidAt: paymentPaidAt,
        paidAt: order.paidAt || paymentPaidAt,
        ...(payment.stripePaymentIntentId
          ? { stripePaymentIntentId: payment.stripePaymentIntentId }
          : {}),
        ...(payment.stripeSubscriptionId
          ? { stripeSubscriptionId: payment.stripeSubscriptionId }
          : {}),
      },
    }
  );
  await Order.updateOne(
    { _id: order._id, status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.FAILED] } },
    {
      $set: { status: ORDER_STATUS.PAID, paidAt: new Date(), commerceFinalizedAt: new Date() },
      $push: { statusHistory: { status: ORDER_STATUS.PAID, note, at: new Date() } },
    }
  );
  await applyPaidSideEffects(order, payment);
};

/** Idempotently recover/create payment state and repair the linked order. */
export const handlePaymentSucceeded = async (intent) => {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return null;
  const order = await Order.findById(orderId).populate('customer');
  if (!order) return null;
  const data = await paymentDataFromIntent(intent, order, PAYMENT_STATUS.SUCCEEDED);
  const payment = await saveProviderPayment({ paymentIntentId: intent.id, data });
  await synchronizePaidOrder(order, payment);
  if (payment.amountRefunded > 0) await synchronizeOrderRefund(payment);
  logger.info(`Payment succeeded -> order ${order.orderNumber}`);
  return payment;
};

export const handlePaymentFailed = async (intent) => {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return null;
  const order = await Order.findById(orderId);
  if (!order) return null;
  const data = await paymentDataFromIntent(intent, order, PAYMENT_STATUS.FAILED);
  const payment = await saveProviderPayment({
    paymentIntentId: intent.id,
    data,
    allowFailure: true,
  });

  if (payment.status !== PAYMENT_STATUS.SUCCEEDED) {
    await Order.updateOne(
      { _id: order._id, status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING] } },
      {
        $set: { status: ORDER_STATUS.FAILED },
        $push: {
          statusHistory: {
            status: ORDER_STATUS.FAILED,
            note: intent.last_payment_error?.message || 'Payment failed',
            at: new Date(),
          },
        },
      }
    );
    logger.warn(`Payment failed -> order ${order.orderNumber}`);
  }
  return payment;
};

export const handlePaymentProcessing = async (intent) => {
  const orderId = intent.metadata?.orderId;
  const order = orderId
    ? await Order.findById(orderId)
    : await Order.findOne({ stripePaymentIntentId: intent.id });
  if (!order) return null;
  const data = await paymentDataFromIntent(intent, order, PAYMENT_STATUS.PENDING);
  const payment = await saveProviderPayment({
    paymentIntentId: intent.id,
    data,
    allowFailure: true,
  });
  await Order.updateOne(
    { _id: order._id, status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.FAILED] } },
    {
      $set: { status: ORDER_STATUS.PROCESSING },
      $unset: { paymentExpiresAt: 1 },
      $push: {
        statusHistory: {
          status: ORDER_STATUS.PROCESSING,
          note: 'Payment is processing at Stripe',
          at: new Date(),
        },
      },
    }
  );
  return payment;
};

const subscriptionIdFromInvoice = (invoice) =>
  getId(invoice.subscription) ||
  getId(invoice.parent?.subscription_details?.subscription) ||
  getId(invoice.subscription_details?.subscription);

const getOrderForInvoice = async (invoice) => {
  const directOrderId = invoice.metadata?.orderId || invoice.subscription_details?.metadata?.orderId;
  if (directOrderId) return Order.findById(directOrderId).populate('customer');

  const subscriptionId = subscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return null;
  const localOrder = await Order.findOne({ stripeSubscriptionId: subscriptionId }).populate('customer');
  if (localOrder) return localOrder;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription.metadata?.orderId
    ? Order.findById(subscription.metadata.orderId).populate('customer')
    : null;
};

export const handleInvoicePaymentSucceeded = async (invoice) => {
  const order = await getOrderForInvoice(invoice);
  if (!order) return null;
  const paymentIntentId = getId(invoice.payment_intent);
  const intent = paymentIntentId
    ? (typeof invoice.payment_intent === 'object'
        ? invoice.payment_intent
        : await stripe.paymentIntents.retrieve(paymentIntentId))
    : null;
  const charge = await retrieveCharge(invoice.charge || intent?.latest_charge);
  const subscriptionId = subscriptionIdFromInvoice(invoice) || order.stripeSubscriptionId;
  const data = {
    order: order._id,
    customer: customerIdFor(order),
    amount: (invoice.amount_paid || 0) / 100,
    currency: (invoice.currency || order.currency || 'USD').toUpperCase(),
    status: charge?.amount_refunded
      ? ((charge.amount_refunded / 100) + 0.000001 >= (invoice.amount_paid || 0) / 100
          ? PAYMENT_STATUS.REFUNDED
          : PAYMENT_STATUS.PARTIALLY_REFUNDED)
      : PAYMENT_STATUS.SUCCEEDED,
    amountRefunded: (charge?.amount_refunded || 0) / 100,
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: charge?.id,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: getId(invoice.customer),
    stripeReceiptUrl: charge?.receipt_url || invoice.hosted_invoice_url,
    paidAt: new Date((invoice.status_transitions?.paid_at || Math.floor(Date.now() / 1000)) * 1000),
    metadata: { ...invoice.metadata, subscriptionId },
  };
  const payment = await saveProviderPayment({ paymentIntentId, invoiceId: invoice.id, data });
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await synchronizeSubscription(subscription);
  }
  await synchronizePaidOrder(order, payment, 'Subscription payment received');
  if (payment.amountRefunded > 0) await synchronizeOrderRefund(payment);
  return payment;
};

export const handleInvoicePaymentFailed = async (invoice) => {
  const order = await getOrderForInvoice(invoice);
  if (!order) return null;
  const paymentIntentId = getId(invoice.payment_intent);
  const subscriptionId = subscriptionIdFromInvoice(invoice) || order.stripeSubscriptionId;
  const data = {
    order: order._id,
    customer: customerIdFor(order),
    amount: (invoice.amount_due || order.total * 100) / 100,
    currency: (invoice.currency || order.currency || 'USD').toUpperCase(),
    status: PAYMENT_STATUS.FAILED,
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: paymentIntentId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: getId(invoice.customer),
    failureCode: 'invoice_payment_failed',
    failureMessage: 'Subscription invoice payment failed',
    metadata: { ...invoice.metadata, subscriptionId },
  };
  const payment = await saveProviderPayment({ paymentIntentId, invoiceId: invoice.id, data, allowFailure: true });
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await synchronizeSubscription(subscription);
  }
  if ([ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING].includes(order.status)) {
    await Order.updateOne(
      { _id: order._id, status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING] } },
      {
        $set: { status: ORDER_STATUS.FAILED },
        $push: {
          statusHistory: {
            status: ORDER_STATUS.FAILED,
            note: 'Subscription payment failed',
            at: new Date(),
          },
        },
      }
    );
  }
  return payment;
};

const synchronizeSubscription = async (subscription, deleted = false) => {
  const order = await Order.findOne({
    $or: [
      { stripeSubscriptionId: subscription.id },
      ...(subscription.metadata?.orderId ? [{ _id: subscription.metadata.orderId }] : []),
    ],
  });
  if (!order) return null;

  await Order.updateOne(
    { _id: order._id },
    {
      $set: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        ...(subscription.current_period_end
          ? { currentPeriodEnd: new Date(subscription.current_period_end * 1000) }
          : {}),
      },
    }
  );
  if (
    (deleted || ['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) &&
    [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.FAILED].includes(order.status)
  ) {
    order.pushStatus(ORDER_STATUS.CANCELLED, `Stripe subscription ${subscription.status}`);
    await order.save();
  }
  return order;
};

export const manageSubscription = async ({ order, cancelAtPeriodEnd, immediate = false }) => {
  if (!order.stripeSubscriptionId) throw ApiError.badRequest('Order has no subscription');
  const current = await stripe.subscriptions.retrieve(order.stripeSubscriptionId);
  if (current.metadata?.orderId && current.metadata.orderId !== order._id.toString()) {
    throw ApiError.badRequest('Subscription does not match this order');
  }
  if (immediate) {
    if (!['canceled', 'incomplete_expired'].includes(current.status)) {
      const canceled = await stripe.subscriptions.cancel(
        current.id,
        {},
        { idempotencyKey: `subscription:${current.id}:cancel-immediate` }
      );
      await synchronizeSubscription(canceled, true);
    } else {
      await synchronizeSubscription(current, true);
    }
  } else {
    if (['canceled', 'incomplete_expired'].includes(current.status)) {
      throw ApiError.conflict('A terminated subscription cannot be resumed');
    }
    const updated = await stripe.subscriptions.update(current.id, {
      cancel_at_period_end: Boolean(cancelAtPeriodEnd),
    });
    await synchronizeSubscription(updated);
  }
  return Order.findById(order._id).populate('payment');
};

const synchronizeOrderRefund = async (payment, { reason, actor, appendHistory = false } = {}) => {
  const orderId = payment.order?._id || payment.order;
  if (!orderId) return null;
  const order = await Order.findById(orderId);
  if (!order) return null;
  const [totals] = await Payment.aggregate([
    { $match: { order: order._id } },
    { $group: { _id: null, refunded: { $sum: '$amountRefunded' } } },
  ]);
  const refundedAmount = totals?.refunded || 0;
  const fullyRefunded = order.paymentMode !== 'subscription' &&
    refundedAmount + 0.000001 >= order.total;
  const update = {
    $set: {
      refundedAmount,
      refundedAt: new Date(),
      ...(reason ? { refundReason: reason } : {}),
      ...(fullyRefunded ? { status: ORDER_STATUS.REFUNDED } : {}),
    },
  };
  if (appendHistory) {
    update.$push = {
      statusHistory: {
        status: fullyRefunded ? ORDER_STATUS.REFUNDED : order.status,
        note: `${fullyRefunded ? 'Full' : 'Partial'} refund; total refunded $${refundedAmount.toFixed(2)}`,
        changedBy: actor,
        at: new Date(),
      },
    };
  }
  if (fullyRefunded) update.$unset = { paymentExpiresAt: 1, paymentSetupLock: 1 };
  await Order.updateOne({ _id: orderId }, update);
  return Order.findById(orderId);
};

/** Execute a real Stripe refund, then mirror Stripe's authoritative total. */
export const refundPayment = async ({ paymentId, amount, reason, actor, refundRequestId }) => {
  if (!refundRequestId) throw ApiError.badRequest('Refund idempotency key is required');
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) throw ApiError.notFound('Payment not found');
  if (!payment.stripePaymentIntentId) throw ApiError.badRequest('No Stripe payment reference');
  const priorRefund = payment.refunds.find((entry) => entry.requestId === refundRequestId);
  if (priorRefund) {
    const providerRefund = await stripe.refunds.retrieve(priorRefund.stripeRefundId);
    await handleRefundUpdated(providerRefund);
    const repairedPayment = await Payment.findById(payment._id).populate('order');
    const repairedOrder = repairedPayment.amountRefunded > 0
      ? await synchronizeOrderRefund(repairedPayment)
      : repairedPayment.order;
    return {
      payment: repairedPayment,
      order: repairedOrder,
      refund: {
        id: providerRefund.id,
        amount: providerRefund.amount,
        status: providerRefund.status,
      },
      replayed: true,
    };
  }
  if (![PAYMENT_STATUS.SUCCEEDED, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(payment.status)) {
    throw ApiError.badRequest('Only successful payments can be refunded');
  }

  const paidCents = Math.round(payment.amount * 100);
  const alreadyRefundedCents = Math.round(payment.amountRefunded * 100);
  const remainingCents = paidCents - alreadyRefundedCents;
  const requestedCents = amount === null || amount === undefined
    ? remainingCents
    : Math.round(amount * 100);
  if (remainingCents <= 0) throw ApiError.badRequest('Nothing to refund');
  if (requestedCents <= 0 || requestedCents > remainingCents) {
    throw ApiError.badRequest(`Refund amount cannot exceed $${(remainingCents / 100).toFixed(2)}`);
  }

  const refund = await stripe.refunds.create(
    {
      payment_intent: payment.stripePaymentIntentId,
      amount: requestedCents,
      reason: toStripeRefundReason(reason),
      metadata: {
        paymentId: payment._id.toString(),
        ...(actor ? { actorId: actor.toString() } : {}),
        ...(reason ? { internalReason: reason.slice(0, 450) } : {}),
      },
    },
    {
      idempotencyKey: `refund:${refundRequestId}`,
    }
  );

  const charge = await retrieveCharge(refund.charge);
  const authoritativeCents = Number.isFinite(charge?.amount_refunded)
    ? charge.amount_refunded
    : refund.status === 'succeeded'
      ? alreadyRefundedCents + refund.amount
      : alreadyRefundedCents;
  const authoritativeAmount = authoritativeCents / 100;
  const status = authoritativeCents <= 0
    ? payment.status
    : authoritativeCents >= paidCents
      ? PAYMENT_STATUS.REFUNDED
      : PAYMENT_STATUS.PARTIALLY_REFUNDED;
  const appended = await Payment.updateOne(
    {
      _id: payment._id,
      'refunds.stripeRefundId': { $ne: refund.id },
      'refunds.requestId': { $ne: refundRequestId },
    },
    {
      $push: {
        refunds: {
          stripeRefundId: refund.id,
          requestId: refundRequestId,
          amount: refund.amount / 100,
          reason,
          status: refund.status,
          processedBy: actor,
          processedAt: new Date(),
        },
      },
    }
  );
  await Payment.updateOne(
    { _id: payment._id },
    { $set: { amountRefunded: authoritativeAmount, status } },
    { runValidators: true }
  );

  const updatedPayment = await Payment.findById(payment._id).populate('order');
  const order = updatedPayment.amountRefunded > 0
    ? await synchronizeOrderRefund(updatedPayment, {
        reason,
        actor,
        appendHistory: refund.status === 'succeeded' && appended.modifiedCount > 0,
      })
    : updatedPayment.order;
  return { payment: updatedPayment, order, refund };
};

const handleChargeRefunded = async (charge) => {
  const paymentIntentId = getId(charge.payment_intent);
  let payment = await Payment.findOne({
    $or: [
      { stripeChargeId: charge.id },
      ...(paymentIntentId ? [{ stripePaymentIntentId: paymentIntentId }] : []),
    ],
  });
  if (!payment && paymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    await handlePaymentSucceeded(intent);
    payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  }
  if (!payment) return null;

  for (const refund of charge.refunds?.data || []) {
    const existing = await Payment.updateOne(
      { _id: payment._id, 'refunds.stripeRefundId': refund.id },
      {
        $set: {
          'refunds.$.amount': refund.amount / 100,
          'refunds.$.reason': refund.metadata?.internalReason || refund.reason,
          'refunds.$.status': refund.status,
        },
      }
    );
    if (existing.matchedCount) continue;
    await Payment.updateOne(
      { _id: payment._id, 'refunds.stripeRefundId': { $ne: refund.id } },
      {
        $push: {
          refunds: {
            stripeRefundId: refund.id,
            amount: refund.amount / 100,
            reason: refund.metadata?.internalReason || refund.reason,
            status: refund.status,
            processedAt: new Date((refund.created || Math.floor(Date.now() / 1000)) * 1000),
          },
        },
      }
    );
  }
  const amountRefunded = (charge.amount_refunded || 0) / 100;
  payment.amountRefunded = amountRefunded;
  if (amountRefunded > 0) {
    payment.status = amountRefunded + 0.000001 >= payment.amount
      ? PAYMENT_STATUS.REFUNDED
      : PAYMENT_STATUS.PARTIALLY_REFUNDED;
  }
  await payment.save();
  if (amountRefunded > 0) await synchronizeOrderRefund(payment);
  return payment;
};

const handleRefundUpdated = async (refund) => {
  const paymentIntentId = getId(refund.payment_intent);
  const chargeId = getId(refund.charge);
  let payment = await Payment.findOne({
    $or: [
      { 'refunds.stripeRefundId': refund.id },
      ...(paymentIntentId ? [{ stripePaymentIntentId: paymentIntentId }] : []),
      ...(chargeId ? [{ stripeChargeId: chargeId }] : []),
    ],
  });
  if (!payment && chargeId) {
    const charge = await stripe.charges.retrieve(chargeId);
    payment = await handleChargeRefunded(charge);
  }
  if (!payment) return null;
  const updated = await Payment.updateOne(
    { _id: payment._id, 'refunds.stripeRefundId': refund.id },
    {
      $set: {
        'refunds.$.status': refund.status,
        'refunds.$.reason': refund.metadata?.internalReason || refund.reason,
      },
    }
  );
  if (!updated.matchedCount) {
    await Payment.updateOne(
      { _id: payment._id, 'refunds.stripeRefundId': { $ne: refund.id } },
      {
        $push: {
          refunds: {
            stripeRefundId: refund.id,
            amount: refund.amount / 100,
            reason: refund.metadata?.internalReason || refund.reason,
            status: refund.status,
            processedAt: new Date((refund.created || Math.floor(Date.now() / 1000)) * 1000),
          },
        },
      }
    );
  }
  if (chargeId) {
    const charge = await stripe.charges.retrieve(chargeId);
    return handleChargeRefunded(charge);
  }
  return Payment.findById(payment._id);
};

const handlePaymentCanceled = async (intent) => {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return null;
  const order = await Order.findById(orderId);
  if (!order) return null;
  const data = await paymentDataFromIntent(intent, order, PAYMENT_STATUS.FAILED);
  data.failureCode = 'payment_intent_canceled';
  data.failureMessage = intent.cancellation_reason || 'Payment was cancelled';
  const payment = await saveProviderPayment({ paymentIntentId: intent.id, data, allowFailure: true });
  const changed = await Order.updateOne(
    { _id: order._id, status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING] } },
    {
      $set: { status: ORDER_STATUS.FAILED },
      $push: {
        statusHistory: {
          status: ORDER_STATUS.FAILED,
          note: 'Payment intent cancelled',
          at: new Date(),
        },
      },
    }
  );
  if (changed.modifiedCount) await releaseCouponReservation(order);
  return payment;
};

const handleDispute = async (dispute, closed = false) => {
  const chargeId = getId(dispute.charge);
  const payment = await Payment.findOne({ stripeChargeId: chargeId });
  if (!payment) return null;
  const notifyClaim = await Payment.findOneAndUpdate(
    { _id: payment._id, 'dispute.lastNotifiedStatus': { $ne: dispute.status } },
    {
      $set: {
        dispute: {
          stripeDisputeId: dispute.id,
          status: dispute.status,
          amount: dispute.amount / 100,
          reason: dispute.reason,
          openedAt: payment.dispute?.openedAt || new Date((dispute.created || Date.now() / 1000) * 1000),
          ...(closed ? { closedAt: new Date() } : {}),
          lastNotifiedStatus: dispute.status,
        },
      },
    },
    { new: true }
  );
  if (!notifyClaim) return payment;
  const title = closed ? `Payment dispute ${dispute.status}` : 'Payment dispute opened';
  const message = `A $${(dispute.amount / 100).toFixed(2)} payment dispute is ${dispute.status}.`;
  notifyAdmins({
    type: 'payment',
    title,
    message,
    resourceType: 'payment',
    resourceId: payment._id,
    actionUrl: `/payments/${payment._id}`,
    priority: 'high',
  }).catch(() => {});
  notify({
    recipient: payment.customer,
    type: 'payment',
    title,
    message,
    resourceType: 'payment',
    resourceId: payment._id,
    actionUrl: `/dashboard/payments/${payment._id}`,
    priority: 'high',
  }).catch(() => {});
  return notifyClaim;
};

/** Authoritative synchronous fallback used after Stripe.js confirmation. */
export const confirmAndSyncPayment = async (order) => {
  if (order.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(order.stripeSubscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    });
    await synchronizeSubscription(subscription);
    const invoice = typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
    if (invoice?.status === 'paid') await handleInvoicePaymentSucceeded(invoice);
    return Order.findById(order._id)
      .populate('payment')
      .populate('customer', 'firstName lastName email phone');
  }
  if (!order.stripePaymentIntentId) return order;

  const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
  if (intent.metadata?.orderId !== order._id.toString()) {
    throw ApiError.badRequest('Payment intent does not match this order');
  }
  if (intent.status === 'succeeded') await handlePaymentSucceeded(intent);
  else if (['processing', 'requires_capture'].includes(intent.status)) {
    await handlePaymentProcessing(intent);
  }
  else if (intent.status === 'requires_payment_method' && intent.last_payment_error) {
    await handlePaymentFailed(intent);
  }
  return Order.findById(order._id)
    .populate('payment')
    .populate('customer', 'firstName lastName email phone');
};

const paymentDetailsFromSubscription = async (subscription) => {
  const invoice = typeof subscription.latest_invoice === 'object'
    ? subscription.latest_invoice
    : subscription.latest_invoice
      ? await stripe.invoices.retrieve(subscription.latest_invoice, {
          expand: ['payment_intent'],
        })
      : null;
  const intent = invoice && typeof invoice.payment_intent === 'object'
    ? invoice.payment_intent
    : null;
  return {
    clientSecret: intent?.client_secret || null,
    intentStatus: intent?.status || null,
    paymentIntentId: getId(invoice?.payment_intent) || null,
    subscriptionId: subscription.id,
    paymentMode: 'subscription',
  };
};

const retireExistingProviderReference = async ({ orderId, providerType, providerId }) => {
  const providerField = providerType === 'subscription'
    ? 'stripeSubscriptionId'
    : 'stripePaymentIntentId';
  const result = await Order.updateOne(
    { _id: orderId, [providerField]: providerId },
    {
      $inc: { paymentAttempt: 1 },
      $unset: {
        [providerField]: 1,
        paymentRecovery: 1,
        paymentSetupLock: 1,
        ...(providerType === 'subscription'
          ? { stripePaymentIntentId: 1, subscriptionStatus: 1 }
          : {}),
      },
    }
  );
  if (result.modifiedCount === 1) return;
  const current = await Order.findById(orderId);
  if (!current || current[providerField] !== providerId) return;
  throw ApiError.conflict('Payment state is being reconciled; retry shortly');
};

/** Resume an owned pending/failed checkout without creating duplicate intents. */
export const resumeOrderPayment = async (order, user) => {
  if (TERMINAL_ORDER_STATUSES.has(order.status)) {
    throw ApiError.conflict('This order is not eligible for payment');
  }

  if (order.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(order.stripeSubscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    });
    if (['active', 'trialing'].includes(subscription.status)) {
      await synchronizeSubscription(subscription);
      const invoice = typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
      if (invoice?.status === 'paid') await handleInvoicePaymentSucceeded(invoice);
      throw ApiError.conflict('This order has already been paid');
    }
    if (!['canceled', 'incomplete_expired'].includes(subscription.status)) {
      const details = await paymentDetailsFromSubscription(subscription);
      if (details.clientSecret) {
        if (['processing', 'requires_capture'].includes(details.intentStatus)) {
          await handlePaymentProcessing(
            typeof subscription.latest_invoice?.payment_intent === 'object'
              ? subscription.latest_invoice.payment_intent
              : await stripe.paymentIntents.retrieve(details.paymentIntentId)
          );
          throw ApiError.conflict('Payment is still processing; no further action is required');
        }
        await Order.updateOne(
          { _id: order._id, stripeSubscriptionId: subscription.id },
          { $unset: { paymentRecovery: 1 } }
        );
        return details;
      }
      await stripe.subscriptions.cancel(
        subscription.id,
        {},
        { idempotencyKey: `order:${order._id}:replace-subscription:${subscription.id}` }
      );
    }
    await retireExistingProviderReference({
      orderId: order._id,
      providerType: 'subscription',
      providerId: subscription.id,
    });
    const refreshed = await Order.findById(order._id);
    return createPaymentIntent(refreshed, user);
  }

  if (order.stripePaymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (intent.metadata?.orderId !== order._id.toString()) {
      throw ApiError.badRequest('Payment intent does not match this order');
    }
    if (intent.status === 'succeeded') {
      await handlePaymentSucceeded(intent);
      throw ApiError.conflict('This order has already been paid');
    }
    if (['processing', 'requires_capture'].includes(intent.status)) {
      await handlePaymentProcessing(intent);
      throw ApiError.conflict('Payment is still processing; no further action is required');
    }
    if (intent.status !== 'canceled' && intent.client_secret) {
      if (order.status === ORDER_STATUS.FAILED) {
        await Order.updateOne(
          { _id: order._id, status: ORDER_STATUS.FAILED },
          {
            $set: { status: ORDER_STATUS.PENDING },
            $push: {
              statusHistory: {
                status: ORDER_STATUS.PENDING,
                note: 'Payment retry started',
                changedBy: user._id,
                at: new Date(),
              },
            },
          }
        );
      }
      await Order.updateOne(
        { _id: order._id, stripePaymentIntentId: intent.id },
        { $unset: { paymentRecovery: 1 } }
      );
      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        paymentMode: 'one_time',
      };
    }
    if (intent.status !== 'canceled') {
      await stripe.paymentIntents.cancel(
        intent.id,
        {},
        { idempotencyKey: `order:${order._id}:replace-payment-intent:${intent.id}` }
      );
    }
    await retireExistingProviderReference({
      orderId: order._id,
      providerType: 'payment_intent',
      providerId: intent.id,
    });
  }

  const refreshed = await Order.findById(order._id);
  return createPaymentIntent(refreshed, user);
};

/** Cancel only an unpaid provider object; paid orders require the refund flow. */
export const cancelOrderPayment = async (order) => {
  if (order.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(order.stripeSubscriptionId);
    if (['active', 'trialing'].includes(subscription.status)) {
      throw ApiError.conflict('Paid subscriptions must be cancelled by an administrator');
    }
    if (!['canceled', 'incomplete_expired'].includes(subscription.status)) {
      await stripe.subscriptions.cancel(
        subscription.id,
        {},
        { idempotencyKey: `order:${order._id}:cancel-subscription:${subscription.id}` }
      );
    }
  } else if (order.stripePaymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (intent.status === 'succeeded') {
      await handlePaymentSucceeded(intent);
      throw ApiError.conflict('Paid orders must be refunded instead of cancelled');
    }
    if (intent.status !== 'canceled') {
      await stripe.paymentIntents.cancel(
        intent.id,
        {},
        { idempotencyKey: `order:${order._id}:cancel-payment-intent:${intent.id}` }
      );
    }
  }
};

/** Verify webhook signature and route subscription and one-time state changes. */
export const handleWebhookEvent = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch (error) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${error.message}`);
  }

  logger.info(`Stripe event: ${event.type}`);
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'payment_intent.processing':
      await handlePaymentProcessing(event.data.object);
      break;
    case 'payment_intent.canceled':
      await handlePaymentCanceled(event.data.object);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(await stripe.charges.retrieve(event.data.object.id));
      break;
    case 'refund.updated':
    case 'refund.failed':
      await handleRefundUpdated(await stripe.refunds.retrieve(event.data.object.id));
      break;
    case 'charge.dispute.created':
      await handleDispute(event.data.object);
      break;
    case 'charge.dispute.closed':
      await handleDispute(event.data.object, true);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.updated':
      await synchronizeSubscription(await stripe.subscriptions.retrieve(event.data.object.id));
      break;
    case 'customer.subscription.deleted':
      try {
        await synchronizeSubscription(await stripe.subscriptions.retrieve(event.data.object.id), true);
      } catch (error) {
        if (error.statusCode !== 404) throw error;
        await synchronizeSubscription(event.data.object, true);
      }
      break;
    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }
  return { received: true, type: event.type };
};
