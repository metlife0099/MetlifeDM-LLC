import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Trash2, ArrowUpRight, ArrowLeft, Tag, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { removeItem, updateQuantity, setCoupon, clearCart } from '@/store/index.js';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartDiscount,
  selectCartTotal,
} from '@/store/selectors.js';
import { commerceApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Card, Input, Spinner } from '@/components/ui/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney } from '@/utils/format.js';

export default function CartPage() {
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const discount = useSelector(selectCartDiscount);
  const total = useSelector(selectCartTotal);
  const coupon = useSelector((s) => s.cart.coupon);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const validateCoupon = useMutation({
    mutationFn: ({ code, subtotal }) => commerceApi.validateCoupon(code, subtotal),
    onSuccess: (r) => {
      dispatch(setCoupon({ code: r.code, discount: r.discount, description: r.description }));
      toast.success(`Coupon applied: −${formatMoney(r.discount)}`);
      setCouponCode('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (items.length === 0) {
    return (
      <>
        <Seo title="Cart" noindex />
        <Section spacing="xl">
          <Container className="max-w-2xl text-center">
            <Eyebrow number="00">Cart / Empty</Eyebrow>
            <h1 className="text-display-hero mt-8">
              Your cart is<br />
              <span className="text-italic-fraunces text-ultra">empty.</span>
            </h1>
            <p className="text-slate text-lg mt-6 leading-relaxed">
              Add a service to get started.
            </p>
            <div className="mt-10 flex gap-3 justify-center">
              <Button to="/services" size="lg">
                Browse services <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <Button to="/consultation" variant="ghost" size="lg">
                Book a call
              </Button>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  return (
    <>
      <Seo title="Cart" noindex />
      <Section spacing="lg" divider={false}>
        <Container>
          <Link to="/services" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline inline-flex items-center gap-2">
            <ArrowLeft size={12} strokeWidth={1.5} /> Continue shopping
          </Link>
          <div className="mt-8 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <Eyebrow number="00">Cart / {items.length} item{items.length !== 1 && 's'}</Eyebrow>
              <h1 className="text-display-hero mt-6">
                Review your <span className="text-italic-fraunces text-ultra">order.</span>
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 size={14} strokeWidth={1.5} /> Clear cart
            </Button>
          </div>
        </Container>
      </Section>

      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          dispatch(clearCart());
          setShowClearConfirm(false);
        }}
        title="Clear cart?"
        description="This will remove all items from your cart. This can't be undone."
        confirmLabel="Clear cart"
        variant="ultra"
      />

      <Section spacing="lg">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[2fr_1fr]">
            {/* Items */}
            <div className="divide-editorial border-t border-hairline">
              {items.map((item, i) => (
                <div key={i} className="py-6 grid grid-cols-[auto_1fr_auto] gap-6 items-start">
                  <div className="text-4xl">{item.icon || '📦'}</div>
                  <div className="min-w-0">
                    <div className="text-mono text-xs uppercase tracking-widest text-slate">{item.planName}</div>
                    <Link to={`/services/${item.slug}`} className="text-display-sm block mt-1 hover:text-ultra transition-colors truncate">
                      {item.serviceName}
                    </Link>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center border border-hairline">
                        <button
                          onClick={() => dispatch(updateQuantity({ index: i, quantity: Math.max(1, item.quantity - 1) }))}
                          className="w-9 h-9 grid place-items-center hover:bg-sand transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus size={14} strokeWidth={1.5} />
                        </button>
                        <span className="px-4 text-mono text-sm">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ index: i, quantity: item.quantity + 1 }))}
                          className="w-9 h-9 grid place-items-center hover:bg-sand transition-colors"
                          aria-label="Increase"
                        >
                          <Plus size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        onClick={() => dispatch(removeItem(i))}
                        className="text-slate hover:text-danger transition-colors text-mono text-xs uppercase tracking-widest link-underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-mono text-sm">{formatMoney(item.unitPrice * item.quantity)}</div>
                    <div className="text-mono text-xs text-slate mt-1">{formatMoney(item.unitPrice)} × {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Card>
                <div className="text-eyebrow mb-6">Order summary</div>
                <dl className="space-y-3 text-mono text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate">Subtotal</dt>
                    <dd>{formatMoney(subtotal)}</dd>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-ultra">
                      <dt>Discount ({coupon.code})</dt>
                      <dd>−{formatMoney(discount)}</dd>
                    </div>
                  )}
                  <div className="border-t border-hairline pt-3 flex justify-between text-base">
                    <dt>Total</dt>
                    <dd className="num-plate">{formatMoney(total)}</dd>
                  </div>
                </dl>

                {/* Coupon */}
                <div className="mt-8 pt-6 border-t border-hairline">
                  {coupon ? (
                    <div className="border border-ultra bg-ultra-tint p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-mono text-xs">
                        <Tag size={12} strokeWidth={1.5} className="text-ultra" />
                        <span className="text-ultra font-medium">{coupon.code}</span>
                      </div>
                      <button
                        onClick={() => dispatch(setCoupon(null))}
                        className="text-mono text-xs text-slate hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="flex-1 border-b border-ink/25 pb-2 text-sm placeholder:text-slate focus:border-ultra focus:outline-none bg-transparent"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => couponCode && validateCoupon.mutate({ code: couponCode, subtotal })}
                        disabled={!couponCode || validateCoupon.isPending}
                      >
                        {validateCoupon.isPending ? <Spinner size={12} /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-8"
                  size="lg"
                  onClick={() => navigate('/checkout')}
                >
                  Checkout <ArrowUpRight size={16} strokeWidth={1.5} />
                </Button>
                <p className="text-mono text-xs text-slate mt-4 text-center">
                  Secure checkout via Stripe
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
