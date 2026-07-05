import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, Lock, ArrowUpRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
} from '@/store/selectors.js';
import { clearCart } from '@/store/index.js';
import { commerceApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Card, Input, Spinner } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney } from '@/utils/format.js';
import { useAuth } from '@/hooks/useAuth.js';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

/* ================= Payment form ================= */
const PaymentForm = ({ orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/order-success?order=${orderId}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
    } else if (paymentIntent?.status === 'succeeded') {
      // Sync the order to "paid" ourselves rather than waiting on the
      // webhook — it may be slow, misconfigured, or (in local dev) not
      // reachable at all. Non-fatal: the webhook is still the durable
      // fallback if this call fails for some reason.
      await commerceApi.confirmPayment(orderId).catch(() => {});
      dispatch(clearCart());
      navigate(`/order-success?order=${orderId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting}>
        <Lock size={14} strokeWidth={1.5} />
        {submitting ? 'Processing…' : 'Pay now'}
        <ArrowUpRight size={16} strokeWidth={1.5} />
      </Button>
    </form>
  );
};

/* ================= Main checkout ================= */
export default function CheckoutPage() {
  const { isAuthenticated } = useAuth();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const discount = useSelector(selectCartDiscount);
  const total = useSelector(selectCartTotal);
  const coupon = useSelector((s) => s.cart.coupon);

  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [step, setStep] = useState('review');
  const [contactInfo, setContactInfo] = useState({ notes: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (items.length === 0 && !clientSecret) {
      // will show empty state below
    }
  }, [items, clientSecret]);

  const startCheckout = async () => {
    setError(null);
    setStep('creating');
    try {
      const payload = {
        items: items.map((i) => ({
          service: i.serviceId,
          plan: i.planId,
          quantity: i.quantity,
        })),
        couponCode: coupon?.code,
        notes: contactInfo.notes,
      };
      const { order, clientSecret: secret } = await commerceApi.createOrder(payload);
      setOrderId(order._id);
      setClientSecret(secret);
      setStep('pay');
    } catch (e) {
      setError(getErrorMessage(e));
      setStep('review');
    }
  };

  if (!isAuthenticated) {
    return (
      <Section spacing="xl">
        <Container className="max-w-lg text-center">
          <Eyebrow>Checkout</Eyebrow>
          <h1 className="text-display-lg mt-8">Log in to continue.</h1>
          <p className="text-slate mt-6">You&apos;ll need an account to complete checkout.</p>
          <div className="mt-10 flex gap-3 justify-center">
            <Button to="/login?redirect=/checkout" size="lg">Log in</Button>
            <Button to="/register" variant="ghost" size="lg">Create account</Button>
          </div>
        </Container>
      </Section>
    );
  }

  if (items.length === 0 && !clientSecret) {
    return (
      <Section spacing="xl">
        <Container className="max-w-lg text-center">
          <Eyebrow>Checkout / Empty</Eyebrow>
          <h1 className="text-display-lg mt-8">Your cart is empty.</h1>
          <Button to="/services" className="mt-8">Browse services <ArrowUpRight size={16} strokeWidth={1.5} /></Button>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <Seo title="Checkout" noindex />
      <Section spacing="lg" divider={false}>
        <Container>
          <Link to="/cart" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline inline-flex items-center gap-2">
            <ArrowLeft size={12} strokeWidth={1.5} /> Back to cart
          </Link>
          <Eyebrow number="00" className="mt-8">Checkout / Secure payment</Eyebrow>
          <h1 className="text-display-hero mt-6">
            Complete your <span className="text-italic-fraunces text-ultra">order.</span>
          </h1>
        </Container>
      </Section>

      <Section spacing="lg">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-10">
              {/* Notes */}
              {step === 'review' && (
                <div>
                  <Eyebrow number="01">Additional details</Eyebrow>
                  <div className="mt-6">
                    <textarea
                      rows={4}
                      value={contactInfo.notes}
                      onChange={(e) => setContactInfo({ notes: e.target.value })}
                      placeholder="Anything a strategist should know before we kick off? (optional)"
                      className="w-full bg-transparent border-b border-ink/25 pb-2 pt-4 text-sm placeholder:text-slate focus:border-ultra focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Payment */}
              <div>
                <Eyebrow number="02">Payment</Eyebrow>
                {step === 'review' && (
                  <div className="mt-6">
                    {error && (
                      <div className="mb-6 border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                        {error}
                      </div>
                    )}
                    <Button size="lg" onClick={startCheckout}>
                      Continue to payment <ArrowUpRight size={16} strokeWidth={1.5} />
                    </Button>
                    <p className="text-mono text-xs text-slate mt-4">
                      You&apos;ll enter card details on the next step. No charge until you confirm.
                    </p>
                  </div>
                )}

                {step === 'creating' && (
                  <div className="mt-6 flex items-center gap-3 text-slate">
                    <Spinner size={16} className="text-ultra" />
                    <span className="text-sm">Preparing secure checkout…</span>
                  </div>
                )}

                {step === 'pay' && stripePromise && clientSecret && (
                  <div className="mt-6">
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'flat',
                          variables: {
                            fontFamily: 'Inter, sans-serif',
                            colorPrimary: '#1547FF',
                            colorText: '#0A1730',
                            colorBackground: '#FAF7F0',
                            borderRadius: '4px',
                          },
                        },
                      }}
                    >
                      <PaymentForm orderId={orderId} />
                    </Elements>
                  </div>
                )}

                {step === 'pay' && !stripePromise && (
                  <div className="mt-6 border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                    Stripe is not configured. Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your environment.
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <Card className="lg:sticky lg:top-32 lg:self-start">
              <div className="text-eyebrow mb-6">Your order</div>
              <div className="space-y-4">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.serviceName}</div>
                      <div className="text-mono text-xs text-slate">{item.planName} × {item.quantity}</div>
                    </div>
                    <div className="text-mono">{formatMoney(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-hairline space-y-3 text-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate">Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-ultra">
                    <span>{coupon.code}</span>
                    <span>−{formatMoney(discount)}</span>
                  </div>
                )}
                <div className="border-t border-hairline pt-3 flex justify-between text-base">
                  <span>Total</span>
                  <span className="num-plate">{formatMoney(total)}</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-hairline flex items-start gap-2 text-mono text-xs text-slate">
                <ShieldCheck size={12} strokeWidth={1.5} className="text-ultra mt-0.5 shrink-0" />
                <span>256-bit SSL encryption · PCI-DSS compliant · handled by Stripe</span>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
