import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock3, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { commerceApi } from '@/api/index.js';
import { clearCart } from '@/store/index.js';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Card, Spinner, Badge } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney, formatDate } from '@/utils/format.js';
import { clearCheckoutIdempotencyKey } from '@/utils/idempotency.js';
import {
  isPaidLikeOrderStatus,
  isRetryablePaymentStatus,
  shouldPollOrderStatus,
} from '@/utils/orderStatus.js';

const statusContent = (status, pollingExpired = false) => {
  if (status === 'paid' || status === 'in_progress' || status === 'completed') {
    return {
      tone: 'success',
      eyebrow: 'Payment confirmed',
      title: 'Thanks. Your payment is confirmed.',
      body: 'Your receipt and order details are available in your dashboard.',
      Icon: CheckCircle2,
    };
  }
  if (status === 'processing') {
    return {
      tone: 'ultra',
      eyebrow: 'Payment processing',
      title: 'Your payment is still processing.',
      body: pollingExpired
        ? 'This payment is taking longer than usual. The order page will show the authoritative status, and you can safely return later.'
        : 'Some payment methods need extra time. This page will update automatically for a short period.',
      Icon: Clock3,
    };
  }
  if (status === 'pending') {
    return {
      tone: 'ultra',
      eyebrow: 'Payment pending',
      title: 'Your order is saved, but it is not paid yet.',
      body: 'Complete payment to confirm the order. You will not be charged twice for returning to this order.',
      Icon: Clock3,
    };
  }
  if (status === 'failed') {
    return {
      tone: 'default',
      eyebrow: 'Payment needs attention',
      title: 'Your payment was not completed.',
      body: 'No successful charge was confirmed. You can safely return to the order and try payment again.',
      Icon: AlertCircle,
    };
  }
  return {
    tone: 'default',
    eyebrow: 'Payment not completed',
    title: status === 'refunded' ? 'This payment was refunded.' : 'Your payment was not completed.',
    body: 'Review the order in your dashboard or contact support if you need help.',
    Icon: AlertCircle,
  };
};

export default function OrderSuccessPage() {
  const [search] = useSearchParams();
  const orderId = search.get('order');
  const paymentIntent = search.get('payment_intent');
  const redirectStatus = search.get('redirect_status');
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const pollingStarted = useRef(Date.now());

  useEffect(() => {
    if (!orderId || !paymentIntent || redirectStatus === 'failed') return;
    commerceApi.confirmPayment(orderId)
      .catch(() => {})
      .finally(() => queryClient.invalidateQueries({ queryKey: ['order', orderId] }));
  }, [orderId, paymentIntent, queryClient, redirectStatus]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => commerceApi.getOrder(orderId),
    enabled: Boolean(orderId),
    retry: 1,
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status;
      return shouldPollOrderStatus(status, Date.now() - pollingStarted.current) ? 3000 : false;
    },
  });

  const order = data?.order;
  const paid = isPaidLikeOrderStatus(order?.status);
  const pollingExpired = Date.now() - pollingStarted.current > 90_000;
  const content = statusContent(order?.status, pollingExpired);

  useEffect(() => {
    if (paid) dispatch(clearCart());
    if (['cancelled', 'refunded'].includes(order?.status)) {
      clearCheckoutIdempotencyKey(orderId);
    }
  }, [dispatch, order?.status, orderId, paid]);

  if (!orderId) {
    return (
      <>
        <Seo title="Order status unavailable" noindex />
        <Section spacing="xl">
          <Container className="max-w-xl text-center">
            <Eyebrow>Order status</Eyebrow>
            <h1 className="text-display-lg mt-6">No order was specified.</h1>
            <p className="mt-5 text-slate">Open an order from your dashboard to check its current payment status.</p>
            <Button to="/dashboard/orders" className="mt-8">View orders</Button>
          </Container>
        </Section>
      </>
    );
  }

  return (
    <>
      <Seo title={paid ? 'Payment confirmed' : 'Order payment status'} noindex />
      <Section spacing="xl" divider={false}>
        <Container className="max-w-3xl text-center">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center" role="status">
              <Spinner size={32} className="text-ultra" />
              <span className="sr-only">Loading order status</span>
            </div>
          ) : error || !order ? (
            <div role="alert" className="mx-auto max-w-xl border border-danger/30 bg-danger/5 p-8">
              <AlertCircle size={36} strokeWidth={1.5} className="mx-auto text-danger" />
              <Eyebrow className="mt-5">Order status unavailable</Eyebrow>
              <h1 className="text-display-md mt-4">We couldn&apos;t verify this order.</h1>
              <p className="mt-4 text-sm text-slate">No confirmation has been assumed. Retry or view the order in your dashboard.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Checking…' : 'Try again'}</Button>
                <Button to={`/dashboard/orders/${orderId}`} variant="ghost">View order</Button>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full ${paid ? 'bg-success/10' : 'bg-ultra-tint'}`}
              >
                <content.Icon size={40} strokeWidth={1.5} className={paid ? 'text-success' : 'text-ultra'} />
              </motion.div>

              <Eyebrow>{content.eyebrow}</Eyebrow>
              <h1 className="text-display-hero mx-auto mt-6 max-w-3xl">{content.title}</h1>
              <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-slate">{content.body}</p>

              <Card className="mt-14 text-left" aria-live="polite">
                <div className="mb-6 flex items-center justify-between gap-5">
                  <div>
                    <div className="text-mono text-xs uppercase tracking-widest text-slate">Order number</div>
                    <div className="text-display-sm num-plate mt-1">{order.orderNumber}</div>
                  </div>
                  <Badge tone={content.tone}>{order.status}</Badge>
                </div>

                <div className="space-y-3 border-t border-hairline pt-6">
                  {order.items?.map((item, index) => (
                    <div key={item._id || index} className="flex justify-between gap-4 text-sm">
                      <div>
                        <div>{item.serviceName}</div>
                        <div className="text-mono text-xs text-slate">{item.planName} × {item.quantity}</div>
                      </div>
                      <div className="text-mono">{formatMoney(item.subtotal ?? item.unitPrice * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 border-t border-hairline pt-6 text-mono text-sm">
                  <div className="flex justify-between"><span className="text-slate">Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-ultra"><span>Discount</span><span>−{formatMoney(order.discount)}</span></div>
                  )}
                  <div className="flex justify-between border-t border-hairline pt-2 text-base">
                    <span>{paid ? 'Total paid' : 'Order total'}</span>
                    <span className="num-plate">{formatMoney(order.total)}</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-between border-t border-hairline pt-6 text-mono text-xs text-slate">
                  <span>Placed</span><span>{formatDate(order.createdAt, 'medium')}</span>
                </div>
              </Card>

              <div className="mt-12 flex flex-wrap justify-center gap-3">
                {isRetryablePaymentStatus(order.status) && (
                  <Button to={`/checkout?order=${orderId}`} size="lg">{order.status === 'failed' ? 'Retry payment' : 'Complete payment'} <Receipt size={14} strokeWidth={1.5} /></Button>
                )}
                <Button to={`/dashboard/orders/${orderId}`} size="lg" variant={isRetryablePaymentStatus(order.status) ? 'ghost' : 'primary'}>
                  View order <Receipt size={14} strokeWidth={1.5} />
                </Button>
                <Button to="/dashboard" variant="ghost" size="lg">Dashboard <ArrowUpRight size={14} strokeWidth={1.5} /></Button>
              </div>

              {paid && (
                <div className="mt-14 border-t border-hairline pt-10">
                  <div className="text-eyebrow mb-4">What happens next</div>
                  <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate">
                    The team will review the order details and contact you using the information supplied at checkout.
                    You can follow updates from the order page.
                  </p>
                </div>
              )}
            </>
          )}

          {!isLoading && !error && !paid && order?.status === 'processing' && (
            <p className="mt-6 text-mono text-xs text-slate" aria-live="polite">
              {pollingExpired ? 'This is taking longer than usual. Check the order page for updates.' : 'Checking for an update…'}
            </p>
          )}
          <Link to="/contact" className="mt-10 inline-block text-sm text-slate link-underline hover:text-ink">Need help with payment?</Link>
        </Container>
      </Section>
    </>
  );
}
