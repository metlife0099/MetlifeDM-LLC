import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, Star, ArrowUpRight, ShieldCheck, Sparkles, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner, FaqAccordion } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { addItem } from '@/store/index.js';
import { formatMoney } from '@/utils/format.js';
import { SERVICE_CATEGORIES } from '@/utils/constants.js';
import { cn } from '@/utils/format.js';

const TRUST_POINTS = [
  { icon: Ban, label: 'No lock-in contracts' },
  { icon: ShieldCheck, label: 'Transparent, itemized pricing' },
  { icon: Sparkles, label: 'Senior strategist on every plan' },
];

export default function PricingPage() {
  const dispatch = useDispatch();
  const [category, setCategory] = useState('');
  const [billing, setBilling] = useState('monthly');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', 'pricing', category],
    queryFn: () =>
      contentApi
        .listServices({ category: category || undefined, hasPricing: 'true', limit: 30, sortBy: 'order', sortOrder: 'asc' })
        .then((r) => r.data),
  });

  const handleAddToCart = (service, plan = null) => {
    dispatch(addItem({ service, plan, quantity: 1 }));
    toast.success(`${plan?.name || service.title} added to cart`);
  };

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs', 'pricing'],
    // "pricing" alone is too thin a category to fill out the section nicely —
    // pull in payment/billing and services questions too, which are the next
    // most relevant things someone reads this page wondering about.
    queryFn: () => contentApi.listFaqs({ category: 'pricing,payment,services', limit: 6 }),
  });

  return (
    <>
      <Seo
        title="Pricing"
        description="Transparent pricing across all MetlifeDM marketing services. Monthly, quarterly, and annual plans available."
        jsonLd={
          services.length > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: services.map((service, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  item: {
                    '@type': 'Service',
                    name: service.title,
                    description: service.shortDescription,
                    url: `https://metlifedm.com/services/${service.slug}`,
                    provider: { '@type': 'Organization', name: 'MetlifeDM LLC' },
                    offers: (service.pricingPlans?.length > 0 ? service.pricingPlans : [{ price: service.startingPrice }]).map(
                      (plan) => ({
                        '@type': 'Offer',
                        name: plan.name || service.title,
                        price: plan.price ?? service.startingPrice,
                        priceCurrency: plan.currency || 'USD',
                        url: `https://metlifedm.com/services/${service.slug}`,
                      })
                    ),
                  },
                })),
              }
            : undefined
        }
      />

      {/* Hero */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1920&q=80&auto=format&fit=crop"
          alt="Investment growing"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Pricing / Transparent by default</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Pricing you can<br />
            <span className="text-italic-fraunces text-ultra-soft">verify in a spreadsheet.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            No lock-ins. No hidden fees. Cancel any time. Every plan includes a senior strategist, monthly review, and full dashboard access.
          </p>

          {/* Billing toggle */}
          <div className="mt-12 inline-flex items-center border border-ivory/25 p-1">
            {['monthly', 'yearly'].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'px-6 py-2 text-mono text-xs uppercase tracking-widest transition-colors',
                  billing === b ? 'bg-ivory text-ink' : 'text-ivory/70 hover:text-ivory'
                )}
              >
                {b}
                {b === 'yearly' && <span className="text-ultra ml-2">−15%</span>}
              </button>
            ))}
          </div>

          {/* Trust points */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-ivory/70 text-sm">
                <Icon size={15} strokeWidth={1.5} className="text-ultra-soft shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Category filter */}
      <div className="sticky top-20 z-30 bg-ivory/90 backdrop-blur-xl border-y border-hairline shadow-[0_1px_0_0_rgba(10,23,48,0.04),0_12px_24px_-16px_rgba(10,23,48,0.1)]">
        <Container>
          <ScrollTabs trackClassName="py-4">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-5 py-2.5 rounded-full text-mono text-xs uppercase tracking-widest border transition-all duration-300 whitespace-nowrap',
                !category
                  ? 'bg-ink text-ivory border-ink shadow-[0_8px_20px_-8px_rgba(10,23,48,0.5)]'
                  : 'border-hairline hover:border-ink hover:-translate-y-0.5'
              )}
            >
              All services
            </button>
            {SERVICE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  'px-5 py-2.5 rounded-full text-mono text-xs uppercase tracking-widest border transition-all duration-300 flex items-center gap-2 whitespace-nowrap',
                  category === c.value
                    ? 'bg-ultra text-ivory border-ultra shadow-[0_8px_20px_-8px_rgba(21,71,255,0.5)]'
                    : 'border-hairline hover:border-ink hover:-translate-y-0.5'
                )}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </ScrollTabs>
        </Container>
      </div>

      {/* Pricing tiers */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size={28} className="text-ultra" />
            </div>
          ) : services.length ? (
            <div className="space-y-10">
              {services.map((service, si) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: (si % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="group border border-hairline hover:border-ink transition-colors duration-500 p-6 md:p-10 hover-lift"
                >
                  <div className="flex items-start justify-between mb-10 gap-6 flex-wrap">
                    <div className="flex items-start gap-5">
                      {service.icon && (
                        <div className="w-14 h-14 shrink-0 rounded-full grid place-items-center bg-ink text-ivory text-2xl group-hover:bg-ultra transition-colors duration-500">
                          {service.icon}
                        </div>
                      )}
                      <div>
                        <div className="text-eyebrow mb-2">
                          {service.category?.replace(/_/g, ' ')}
                        </div>
                        <h2 className="text-display-md">{service.title}</h2>
                        <p className="text-slate text-sm mt-3 max-w-xl leading-relaxed">{service.shortDescription}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <Button to={`/services/${service.slug}`} size="sm">
                        Read more
                        <ArrowUpRight size={14} strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>

                  {service.pricingPlans?.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {service.pricingPlans.map((plan) => {
                        const price = billing === 'yearly' ? plan.price * 12 * 0.85 : plan.price;
                        return (
                          <div
                            key={plan._id}
                            className={cn(
                              'relative p-8 flex flex-col border transition-all duration-500',
                              plan.isPopular
                                ? 'bg-ink text-ivory border-ink shadow-[0_32px_64px_-24px_rgba(10,23,48,0.5)] md:-translate-y-3 hover:-translate-y-4'
                                : 'bg-ivory border-hairline hover:border-ink hover-lift'
                            )}
                          >
                            {plan.isPopular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-ultra text-ivory text-mono text-[0.65rem] uppercase tracking-widest px-3 py-1.5">
                                <Star size={11} strokeWidth={0} className="fill-current" />
                                Most popular
                              </div>
                            )}
                            <h3 className={cn('text-display-sm', plan.isPopular ? 'text-ivory' : 'text-ink')}>
                              {plan.name}
                            </h3>
                            {plan.tagline && (
                              <p className={cn('text-xs mt-2 leading-relaxed', plan.isPopular ? 'text-ivory/60' : 'text-slate')}>
                                {plan.tagline}
                              </p>
                            )}
                            <div className="mt-6 flex items-baseline gap-2">
                              <span className={cn('text-display-md num-plate', plan.isPopular ? 'text-ivory' : 'text-ink')}>
                                {formatMoney(price)}
                              </span>
                              <span className={cn('text-mono text-xs uppercase', plan.isPopular ? 'text-ivory/60' : 'text-slate')}>
                                / {billing === 'yearly' ? 'year' : 'mo'}
                              </span>
                            </div>
                            <ul className={cn('mt-6 space-y-2 flex-1 text-sm', plan.isPopular ? 'text-ivory/80' : 'text-ink')}>
                              {(plan.features || []).map((f, j) => (
                                <li key={j} className="flex items-start gap-2">
                                  <Check size={14} className={plan.isPopular ? 'text-ultra-soft mt-0.5 shrink-0' : 'text-success mt-0.5 shrink-0'} strokeWidth={2} />
                                  <span>{f.label}</span>
                                </li>
                              ))}
                            </ul>
                            <Button
                              onClick={() => handleAddToCart(service, plan)}
                              variant={plan.isPopular ? 'inverse' : 'primary'}
                              className="mt-8 w-full"
                              size="md"
                            >
                              <ShoppingBag size={14} strokeWidth={1.5} />
                              {plan.ctaLabel || 'Add to cart'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-hairline bg-ivory-soft hover:border-ink transition-colors duration-500 p-8 flex items-center justify-between gap-6 flex-wrap">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 shrink-0 rounded-full grid place-items-center bg-sand text-ink">
                          <Sparkles size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="text-mono text-xs uppercase tracking-widest text-slate mb-2">Custom pricing</div>
                          <div className="text-display-sm">Starting at {formatMoney(service.startingPrice)}/mo</div>
                        </div>
                      </div>
                      <Button to="/consultation" size="md">
                        Get a quote <ArrowUpRight size={14} strokeWidth={1.5} />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 text-slate">
              No services with pricing in this category.{' '}
              <button className="link-underline text-ink" onClick={() => setCategory('')}>
                Reset filter
              </button>
              .
            </div>
          )}
        </Container>
      </Section>

      {/* Image band */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden img-zoom">
        <motion.img
          initial={{ scale: 1.15, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80&auto=format&fit=crop"
          alt="Team reviewing pricing and ROI numbers"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-lg"
            >
              <Eyebrow className="text-ivory/60">No surprises</Eyebrow>
              <p className="text-ivory text-2xl md:text-4xl mt-6 leading-tight text-italic-fraunces">
                Every dollar mapped to a deliverable.
              </p>
              <p className="text-ivory/70 mt-6 max-w-md leading-relaxed">
                You'll always know exactly what you're paying for and what it produced.
              </p>
            </motion.div>
          </Container>
        </div>
      </div>

      {faqs.length > 0 && (
        <FaqAccordion
          items={faqs}
          eyebrow="Pricing FAQ"
          image="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=80&auto=format&fit=crop"
        />
      )}

      <CtaBanner
        title="Custom scope?"
        subtitle="If your needs don't fit a standard plan, book a call and we'll build a tailored quote in under 48 hours."
      />
    </>
  );
}
