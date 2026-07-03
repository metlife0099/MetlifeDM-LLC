import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ArrowUpRight, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { commerceApi } from '@/api/index.js';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Card, Spinner, Badge } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney, formatDate } from '@/utils/format.js';

export default function OrderSuccessPage() {
  const [search] = useSearchParams();
  const orderId = search.get('order');

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => commerceApi.getOrder(orderId),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Poll for status update until paid
      const status = query.state.data?.order?.status;
      return status === 'paid' || status === 'completed' ? false : 3000;
    },
  });

  const order = data?.order;

  return (
    <>
      <Seo title="Order confirmed" noindex />
      <Section spacing="xl" divider={false}>
        <Container className="max-w-3xl text-center">
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 grid place-items-center bg-success/10 rounded-full mx-auto mb-8"
          >
            <CheckCircle2 size={40} strokeWidth={1.5} className="text-success" />
          </motion.div>

          <Eyebrow>Order confirmed</Eyebrow>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-display-hero mt-6"
          >
            Thanks. Your order is<br />
            <span className="text-italic-fraunces text-ultra">confirmed.</span>
          </motion.h1>
          <p className="text-slate text-lg mt-8 max-w-xl mx-auto leading-relaxed">
            We&apos;ve sent a receipt to your email. A strategist will reach out within one business day to kick off.
          </p>

          {isLoading ? (
            <div className="mt-14 flex justify-center">
              <Spinner size={28} className="text-ultra" />
            </div>
          ) : error || !order ? (
            <div className="mt-14 text-slate">Order details unavailable.</div>
          ) : (
            <Card className="mt-14 text-left">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-mono text-xs uppercase tracking-widest text-slate">Order number</div>
                  <div className="text-display-sm mt-1 num-plate">{order.orderNumber}</div>
                </div>
                <Badge tone={order.status === 'paid' || order.status === 'completed' ? 'success' : 'ultra'}>
                  {order.status}
                </Badge>
              </div>

              <div className="space-y-3 pt-6 border-t border-hairline">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div>
                      <div>{item.serviceName}</div>
                      <div className="text-mono text-xs text-slate">{item.planName} × {item.quantity}</div>
                    </div>
                    <div className="text-mono">{formatMoney(item.subtotal || item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="pt-6 mt-6 border-t border-hairline space-y-2 text-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate">Subtotal</span>
                  <span>{formatMoney(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-ultra">
                    <span>Discount</span>
                    <span>−{formatMoney(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base pt-2 border-t border-hairline">
                  <span>Total paid</span>
                  <span className="num-plate">{formatMoney(order.total)}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-hairline text-mono text-xs text-slate flex justify-between">
                <span>Placed</span>
                <span>{formatDate(order.createdAt, 'medium')}</span>
              </div>
            </Card>
          )}

          <div className="mt-12 flex gap-3 justify-center flex-wrap">
            <Button to={`/dashboard/orders/${orderId}`} size="lg">
              View order <Receipt size={14} strokeWidth={1.5} />
            </Button>
            <Button to="/dashboard" variant="ghost" size="lg">
              Go to dashboard <ArrowUpRight size={14} strokeWidth={1.5} />
            </Button>
          </div>

          <div className="mt-14 pt-10 border-t border-hairline">
            <div className="text-eyebrow mb-4">What&apos;s next</div>
            <div className="grid gap-6 md:grid-cols-3 text-left">
              {[
                { n: '01', title: 'Kickoff call', body: 'A strategist will reach out within one business day.' },
                { n: '02', title: 'Discovery', body: 'We audit your funnel and confirm the 90-day plan.' },
                { n: '03', title: 'Execution', body: 'We ship on a weekly cadence — visible in your dashboard.' },
              ].map((s) => (
                <div key={s.n}>
                  <div className="num-plate text-slate text-xs mb-2">{s.n}</div>
                  <div className="text-display-sm mb-2">{s.title}</div>
                  <p className="text-slate text-sm leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
