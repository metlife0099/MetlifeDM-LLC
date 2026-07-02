import stripe from '../config/stripe.js';
import { config } from '../config/index.js';
import { Order, Payment, User, Coupon } from '../models/index.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../utils/constants.js';
import emailService from './email.service.js';
import { notify } from '../controllers/notification.controller.js';
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get or create a Stripe customer for a user.
 */
export const getOrCreateStripeCustomer = async (user) => {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    phone: user.phone,
    metadata: { userId: user._id.toString() },
  });
  await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
  return customer.id;
};

/**
 * Create a Payment Intent for an order.
 */
export const createPaymentIntent = async (order, user) => {
  const customerId = await getOrCreateStripeCustomer(user);

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100), // cents
    currency: (order.currency || 'USD').toLowerCase(),
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    receipt_email: user.email,
    description: `Order ${order.orderNumber}`,
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: user._id.toString(),
    },
  });

  await Order.findByIdAndUpdate(order._id, {
    stripePaymentIntentId: intent.id,
    stripeCustomerId: customerId,
  });

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
};

/**
 * Refund a payment (full or partial).
 */
export const refundPayment = async ({ paymentId, amount, reason, actor }) => {
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) throw ApiError.notFound('Payment not found');
  if (!payment.stripePaymentIntentId) throw ApiError.badRequest('No Stripe reference');

  const refundAmount = amount || payment.amount - payment.amountRefunded;
  if (refundAmount <= 0) throw ApiError.badRequest('Nothing to refund');

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    amount: Math.round(refundAmount * 100),
    reason: reason || 'requested_by_customer',
    metadata: { paymentId: payment._id.toString(), actorId: actor?.toString() },
  });

  payment.refunds.push({
    stripeRefundId: refund.id,
    amount: refundAmount,
    reason,
    status: refund.status,
    processedBy: actor,
  });
  payment.amountRefunded += refundAmount;
  payment.status =
    payment.amountRefunded >= payment.amount ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED;
  await payment.save();

  if (payment.order) {
    await Order.findByIdAndUpdate(payment.order._id, {
      status: payment.amountRefunded >= payment.amount ? ORDER_STATUS.REFUNDED : payment.order.status,
      $push: {
        statusHistory: {
          status: payment.amountRefunded >= payment.amount ? ORDER_STATUS.REFUNDED : payment.order.status,
          note: `Refund of $${refundAmount} processed`,
          changedBy: actor,
        },
      },
    });
  }
  return { payment, refund };
};

/* ==============================================================
 * Webhook event router
 * ============================================================ */

const handlePaymentSucceeded = async (intent) => {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;
  const order = await Order.findById(orderId).populate('customer');
  if (!order) return;

  const charge = intent.latest_charge
    ? await stripe.charges.retrieve(intent.latest_charge)
    : null;

  const payment = await Payment.create({
    order: order._id,
    customer: order.customer._id,
    amount: intent.amount / 100,
    currency: intent.currency.toUpperCase(),
    status: PAYMENT_STATUS.SUCCEEDED,
    stripePaymentIntentId: intent.id,
    stripeChargeId: charge?.id,
    stripeCustomerId: intent.customer,
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
    paidAt: new Date(),
    metadata: intent.metadata,
  });

  order.payment = payment._id;
  order.pushStatus(ORDER_STATUS.PAID, 'Payment received');
  await order.save();

  // Increment coupon usage
  if (order.coupon?.code) {
    await Coupon.updateOne(
      { code: order.coupon.code },
      { $inc: { usedCount: 1 }, $push: { usedBy: { user: order.customer._id, order: order._id } } }
    );
  }

  emailService.paymentReceipt(order.customer, payment, order).catch(() => {});
  emailService.orderConfirmation(order.customer, order).catch(() => {});
  notify({
    recipient: order.customer._id,
    type: 'payment',
    title: 'Payment received',
    message: `Your payment of $${payment.amount} for ${order.orderNumber} was successful.`,
    resourceType: 'order',
    resourceId: order._id,
    actionUrl: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

  logger.info(`💳  Payment succeeded → order ${order.orderNumber}`);
};

const handlePaymentFailed = async (intent) => {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;
  const order = await Order.findById(orderId);
  if (!order) return;
  order.pushStatus(ORDER_STATUS.FAILED, intent.last_payment_error?.message || 'Payment failed');
  await order.save();

  await Payment.create({
    order: order._id,
    customer: order.customer,
    amount: intent.amount / 100,
    currency: intent.currency.toUpperCase(),
    status: PAYMENT_STATUS.FAILED,
    stripePaymentIntentId: intent.id,
    failureCode: intent.last_payment_error?.code,
    failureMessage: intent.last_payment_error?.message,
  });
  logger.warn(`⚠️  Payment failed → order ${order.orderNumber}`);
};

const handleChargeRefunded = async (charge) => {
  const payment = await Payment.findOne({ stripeChargeId: charge.id });
  if (!payment) return;
  payment.amountRefunded = charge.amount_refunded / 100;
  payment.status =
    payment.amountRefunded >= payment.amount ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED;
  await payment.save();
};

/**
 * Verify webhook signature and route the event.
 */
export const handleWebhookEvent = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch (err) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
  }

  logger.info(`🎫  Stripe event: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;
    case 'invoice.payment_succeeded':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // extend later for subscriptions
      break;
    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }
  return { received: true, type: event.type };
};
