import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Card, Checkbox, Input, PageLoader, Select, Spinner, Textarea } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney } from '@/utils/format.js';
import { useAuth } from '@/hooks/useAuth.js';
import { billingCycleLabel, buildOrderItems, orderTotalDiffers } from '@/utils/commerce.js';
import {
  clearCheckoutIdempotencyKey,
  getCheckoutAttempt,
  getOrCreateCheckoutIdempotencyKey,
  rememberCheckoutOrder,
} from '@/utils/idempotency.js';

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
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/order-success?order=${orderId}`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (paymentIntent?.status === 'succeeded') {
        await commerceApi.confirmPayment(orderId).catch(() => {});
        dispatch(clearCart());
      }
      if (paymentIntent) {
        navigate(`/order-success?order=${orderId}&payment_intent=${paymentIntent.id}&redirect_status=${paymentIntent.status}`);
      } else {
        toast.error('Stripe did not return a payment status. Please try again.');
      }
    } catch (paymentError) {
      toast.error(paymentError?.message || 'Payment could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
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
const emptyAddress = { line1: '', line2: '', city: '', state: '', zip: '', country: 'US' };

export default function CheckoutPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const queryOrderId = search.get('order');
  const [recoveredOrderId] = useState(() => (
    queryOrderId ? null : getCheckoutAttempt().orderId
  ));
  const resumeOrderId = queryOrderId || recoveredOrderId;
  const resumeAttempt = useRef(null);
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const discount = useSelector(selectCartDiscount);
  const total = useSelector(selectCartTotal);
  const coupon = useSelector((s) => s.cart.coupon);

  const [clientSecret, setClientSecret] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [serverOrder, setServerOrder] = useState(null);
  const [priceNotice, setPriceNotice] = useState(false);
  const [step, setStep] = useState('review');
  const [contactInfo, setContactInfo] = useState({ fullName: '', email: '', phone: '', website: '', notes: '', address: emptyAddress });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState(null);
  const summaryItems = serverOrder?.items || items;
  const recurringCycle = summaryItems.find((item) => !['one_time', 'custom'].includes(item.billingCycle))?.billingCycle;
  const hasQuoteOnlyItem = items.some((item) => item.billingCycle === 'custom');

  useEffect(() => {
    if (!queryOrderId && recoveredOrderId) {
      setSearch({ order: recoveredOrderId }, { replace: true });
    }
  }, [queryOrderId, recoveredOrderId, setSearch]);

  // Prefill contact & delivery details from the customer's saved profile —
  // only fills fields the customer hasn't already typed into, so it never
  // clobbers an in-progress edit if the profile loads a moment late.
  useEffect(() => {
    if (!user) return;
    setContactInfo((c) => ({
      fullName: c.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: c.email || user.email || '',
      phone: c.phone || user.phone || '',
      website: c.website || user.company?.website || '',
      notes: c.notes,
      address: {
        line1: c.address.line1 || user.address?.line1 || '',
        line2: c.address.line2 || user.address?.line2 || '',
        city: c.address.city || user.address?.city || '',
        state: c.address.state || user.address?.state || '',
        zip: c.address.zip || user.address?.zip || '',
        country: c.address.country || user.address?.country || 'US',
      },
    }));
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !resumeOrderId || resumeAttempt.current === resumeOrderId) return;
    resumeAttempt.current = resumeOrderId;
    setError(null);
    setStep('creating');

    commerceApi.resumeOrderPayment(resumeOrderId)
      .then(({ order, clientSecret: secret }) => {
        if (!order) throw new Error('The payment session could not be reopened.');
        if (['paid', 'in_progress', 'completed'].includes(order.status)) {
          dispatch(clearCart());
          navigate(`/order-success?order=${order._id}`, { replace: true });
          return;
        }
        if (['cancelled', 'refunded'].includes(order.status)) {
          clearCheckoutIdempotencyKey(order._id);
          throw new Error(`This order is ${order.status} and cannot accept another payment.`);
        }
        if (!secret) throw new Error('The payment session could not be reopened.');
        setOrderId(order._id);
        setServerOrder(order);
        setClientSecret(secret);
        setStep('pay');
      })
      .catch(async (resumeError) => {
        try {
          const result = await commerceApi.getOrder(resumeOrderId);
          const existingOrder = result?.order;
          setServerOrder(existingOrder || null);
          setOrderId(existingOrder?._id || resumeOrderId);
          if (['paid', 'in_progress', 'completed'].includes(existingOrder?.status)) {
            dispatch(clearCart());
            navigate(`/order-success?order=${resumeOrderId}`, { replace: true });
            return;
          }
          if (['cancelled', 'refunded'].includes(existingOrder?.status)) {
            clearCheckoutIdempotencyKey(existingOrder._id);
          }
          if (existingOrder && !['pending', 'failed'].includes(existingOrder.status)) {
            setError(`This order is ${existingOrder.status} and cannot accept another payment.`);
          } else {
            setError(getErrorMessage(resumeError));
          }
        } catch (orderError) {
          setError(getErrorMessage(orderError));
        }
        setStep('resume-error');
      });
  }, [dispatch, isAuthenticated, navigate, resumeOrderId]);

  const setField = (key, value) => setContactInfo((c) => ({ ...c, [key]: value }));
  const setAddressField = (key, value) => setContactInfo((c) => ({ ...c, address: { ...c.address, [key]: value } }));

  const isContactValid = Boolean(
    contactInfo.fullName.trim() &&
    contactInfo.email.trim() &&
    contactInfo.phone.trim() &&
    contactInfo.address.line1.trim() &&
    contactInfo.address.city.trim() &&
    contactInfo.address.state.trim() &&
    contactInfo.address.zip.trim()
  );

  const startCheckout = async () => {
    if (hasQuoteOnlyItem) {
      setError('A quote-only plan cannot be purchased online. Remove it from the cart and request a proposal instead.');
      return;
    }
    if (!isContactValid) {
      setError('Please fill in your full name, email, phone, and complete address to continue.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the purchase terms and refund and cancellation policies to continue.');
      return;
    }
    setError(null);
    setStep('creating');
    try {
      const payload = {
        items: buildOrderItems(items),
        couponCode: coupon?.code,
        notes: contactInfo.notes,
        customerName: contactInfo.fullName,
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        customerWebsite: contactInfo.website,
        billingAddress: contactInfo.address,
        acceptTerms: true,
      };
      const idempotencyKey = getOrCreateCheckoutIdempotencyKey();
      const { order, clientSecret: secret } = await commerceApi.createOrder(payload, idempotencyKey);
      if (!order?._id) throw new Error('The server did not return an order.');
      rememberCheckoutOrder(order._id);
      setPriceNotice(orderTotalDiffers(order, total));
      setOrderId(order._id);
      setServerOrder(order);
      resumeAttempt.current = order._id;
      setSearch({ order: order._id }, { replace: true });
      if (['paid', 'in_progress', 'completed'].includes(order.status) && !secret) {
        dispatch(clearCart());
        navigate(`/order-success?order=${order._id}`, { replace: true });
        return;
      }
      if (!secret) {
        setError('The order was saved, but the secure payment session is not ready. Return to the order or contact support.');
        setStep('resume-error');
        return;
      }
      setClientSecret(secret);
      setStep('pay');
    } catch (e) {
      setError(getErrorMessage(e));
      setStep('review');
    }
  };

  if (authLoading) {
    return <PageLoader label="Verifying" />;
  }

  if (!isAuthenticated) {
    return (
      <Section spacing="xl">
        <Container className="max-w-lg text-center">
          <Eyebrow>Checkout</Eyebrow>
          <h1 className="text-display-lg mt-8">Log in to continue.</h1>
          <p className="text-slate mt-6">You&apos;ll need an account to complete checkout.</p>
          <div className="mt-10 flex gap-3 justify-center">
            <Button to={`/login?redirect=${encodeURIComponent(`/checkout${resumeOrderId ? `?order=${resumeOrderId}` : ''}`)}`} size="lg">Log in</Button>
            <Button to="/register" variant="ghost" size="lg">Create account</Button>
          </div>
        </Container>
      </Section>
    );
  }

  if (items.length === 0 && !resumeOrderId && !clientSecret) {
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
          <Link to={resumeOrderId ? `/dashboard/orders/${resumeOrderId}` : '/cart'} className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline inline-flex items-center gap-2">
            <ArrowLeft size={12} strokeWidth={1.5} /> {resumeOrderId ? 'Back to order' : 'Back to cart'}
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
              {/* Contact & delivery details */}
              {step === 'review' && (
                <div>
                  <Eyebrow number="01">Contact &amp; delivery details</Eyebrow>
                  <div className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Full name" required placeholder="Jane Doe"
                        value={contactInfo.fullName} onChange={(e) => setField('fullName', e.target.value)}
                      />
                      <Input
                        label="Account email" type="email" required readOnly
                        value={contactInfo.email}
                        aria-describedby="checkout-email-note"
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Phone" type="tel" required placeholder="+1 (555) 000-0000"
                        value={contactInfo.phone} onChange={(e) => setField('phone', e.target.value)}
                      />
                      <Input
                        label="Website (optional)" type="url" placeholder="https://yourcompany.com"
                        value={contactInfo.website} onChange={(e) => setField('website', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Address line 1" required placeholder="123 Main St"
                      value={contactInfo.address.line1} onChange={(e) => setAddressField('line1', e.target.value)}
                    />
                    <Input
                      label="Address line 2 (optional)" placeholder="Suite, unit, floor…"
                      value={contactInfo.address.line2} onChange={(e) => setAddressField('line2', e.target.value)}
                    />
                    <div className="grid gap-5 sm:grid-cols-4">
                      <Input
                        label="City" required
                        value={contactInfo.address.city} onChange={(e) => setAddressField('city', e.target.value)}
                      />
                      <Input
                        label="State" required
                        value={contactInfo.address.state} onChange={(e) => setAddressField('state', e.target.value)}
                      />
                      <Input
                        label="ZIP" required
                        value={contactInfo.address.zip} onChange={(e) => setAddressField('zip', e.target.value)}
                      />
                      <Select
                        label="Country" required
                        options={[{ value: 'US', label: 'United States (US)' }]}
                        value={contactInfo.address.country} onChange={(e) => setAddressField('country', e.target.value)}
                      />
                    </div>
                    <p id="checkout-email-note" className="text-mono text-xs text-slate">
                      Payment receipts and order updates use the verified email on your account.
                    </p>
                    <Textarea
                      label="Notes (optional)"
                      rows={4}
                      value={contactInfo.notes}
                      onChange={(e) => setField('notes', e.target.value)}
                      placeholder="Anything a strategist should know before we kick off?"
                    />
                    <Checkbox
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      label={
                        <>
                          I agree to the{' '}
                          <Link to="/terms" className="link-underline text-ink">Terms</Link>,{' '}
                          <Link to="/privacy" className="link-underline text-ink">Privacy Policy</Link>,{' '}
                          <Link to="/terms#subscriptions-retainers" className="link-underline text-ink">cancellation policy</Link>, and{' '}
                          <Link to="/terms#refund-policy" className="link-underline text-ink">refund policy</Link>.
                        </>
                      }
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
                    <Button size="lg" onClick={startCheckout} disabled={!isContactValid || !acceptedTerms || hasQuoteOnlyItem}>
                      Continue to payment <ArrowUpRight size={16} strokeWidth={1.5} />
                    </Button>
                    <p className="text-mono text-xs text-slate mt-4">
                      {isContactValid && acceptedTerms
                        ? "You'll enter card details on the next step. No charge until you confirm."
                        : 'Complete the required contact details and accept the purchase policies above to continue.'}
                    </p>
                  </div>
                )}

                {step === 'creating' && (
                  <div className="mt-6 flex items-center gap-3 text-slate">
                    <Spinner size={16} className="text-ultra" />
                    <span className="text-sm">Preparing secure checkout…</span>
                  </div>
                )}

                {step === 'resume-error' && (
                  <div role="alert" className="mt-6 border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                    <p>{error || 'This payment session is unavailable.'}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {['pending', 'failed'].includes(serverOrder?.status) && (
                        <Button to={`/dashboard/orders/${serverOrder._id}`} size="sm" variant="ghost">View pending order</Button>
                      )}
                      <Button to="/contact" size="sm" variant="ghost">Contact support</Button>
                    </div>
                  </div>
                )}

                {step === 'pay' && stripePromise && clientSecret && (
                  <div className="mt-6">
                    <div role="status" className={`mb-6 border p-4 text-sm ${priceNotice ? 'border-warn/30 bg-warn/5' : 'border-success/30 bg-success/5'}`}>
                      {priceNotice
                        ? `Current pricing changed while this item was in your cart. Review the server-verified total of ${formatMoney(serverOrder?.total)} before paying.`
                        : `Server-verified total: ${formatMoney(serverOrder?.total)}.`}
                    </div>
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
                {summaryItems.map((item, i) => (
                  <div key={i} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.serviceName}</div>
                      <div className="text-mono text-xs text-slate">
                        {item.planName} · {billingCycleLabel(item.billingCycle)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-mono">{formatMoney(item.subtotal ?? item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-hairline space-y-3 text-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-slate">Subtotal</span>
                  <span>{formatMoney(serverOrder?.subtotal ?? subtotal)}</span>
                </div>
                {(serverOrder?.discount > 0 || coupon) && (
                  <div className="flex justify-between text-ultra">
                    <span>{serverOrder?.coupon?.code || coupon?.code || 'Discount'}</span>
                    <span>−{formatMoney(serverOrder?.discount ?? discount)}</span>
                  </div>
                )}
                <div className="border-t border-hairline pt-3 flex justify-between text-base">
                  <span>Total due now</span>
                  <span className="num-plate">{formatMoney(serverOrder?.total ?? total)}</span>
                </div>
              </div>
              {recurringCycle && (
                <p className="mt-5 border border-ultra/20 bg-ultra/5 p-3 text-sm leading-relaxed text-slate">
                  This is a recurring subscription. It renews every {billingCycleLabel(recurringCycle)} until canceled
                  under the applicable terms. Future invoice amounts follow the plan and coupon terms shown in your order.
                </p>
              )}
              <div className="mt-8 pt-6 border-t border-hairline flex items-start gap-2 text-mono text-xs text-slate">
                <ShieldCheck size={12} strokeWidth={1.5} className="text-ultra mt-0.5 shrink-0" />
                <span>Card details are encrypted in transit and handled directly by Stripe.</span>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
