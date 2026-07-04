import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, ArrowUpRight } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner, FaqAccordion } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { formatMoney } from '@/utils/format.js';
import { SERVICE_CATEGORIES } from '@/utils/constants.js';
import { cn } from '@/utils/format.js';

export default function PricingPage() {
  const [category, setCategory] = useState('');
  const [billing, setBilling] = useState('monthly');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', 'pricing', category],
    queryFn: () =>
      contentApi.listServices({ category: category || undefined, hasPricing: 'true', limit: 30 }).then((r) => r.data),
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs', 'pricing'],
    queryFn: () => contentApi.listFaqs({ category: 'billing', limit: 6 }),
  });

  return (
    <>
      <Seo title="Pricing" description="Transparent pricing across all MetlifeDM marketing services. Monthly, quarterly, and annual plans available." />

      {/* Hero */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Eyebrow number="00">Pricing / Transparent by default</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl">
            Pricing you can<br />
            <span className="text-italic-fraunces text-ultra">verify in a spreadsheet.</span>
          </h1>
          <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">
            No lock-ins. No hidden fees. Cancel any time. Every plan includes a senior strategist, monthly review, and full dashboard access.
          </p>

          {/* Billing toggle */}
          <div className="mt-12 inline-flex items-center border border-hairline p-1">
            {['monthly', 'yearly'].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'px-6 py-2 text-mono text-xs uppercase tracking-widest transition-colors',
                  billing === b ? 'bg-ink text-ivory' : 'text-slate hover:text-ink'
                )}
              >
                {b}
                {b === 'yearly' && <span className="text-ultra ml-2">−15%</span>}
              </button>
            ))}
          </div>
        </Container>
      </Section>

      {/* Category filter */}
      <div className="sticky top-20 z-30 bg-ivory border-y border-hairline">
        <Container className="py-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors',
                !category ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
              )}
            >
              All services
            </button>
            {SERVICE_CATEGORIES.slice(0, 8).map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors flex items-center gap-2',
                  category === c.value ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
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
            <div className="space-y-24">
              {services.map((service) => (
                <div key={service._id}>
                  <div className="flex items-end justify-between mb-8 gap-6 flex-wrap">
                    <div>
                      <div className="text-eyebrow mb-3">
                        {service.category?.replace('_', ' ')}
                      </div>
                      <h2 className="text-display-md flex items-center gap-3">
                        {service.icon && <span>{service.icon}</span>}
                        {service.title}
                      </h2>
                      <p className="text-slate text-sm mt-3 max-w-xl">{service.shortDescription}</p>
                    </div>
                    <Link
                      to={`/services/${service.slug}`}
                      className="text-mono text-xs uppercase tracking-widest link-underline text-ink"
                    >
                      Full details →
                    </Link>
                  </div>

                  {service.pricingPlans?.length > 0 ? (
                    <div className="grid gap-px bg-hairline border border-hairline md:grid-cols-3">
                      {service.pricingPlans.slice(0, 3).map((plan) => {
                        const price = billing === 'yearly' ? plan.price * 12 * 0.85 : plan.price;
                        return (
                          <div
                            key={plan._id}
                            className={cn(
                              'bg-ivory p-8 flex flex-col',
                              plan.isPopular && 'bg-ink text-ivory'
                            )}
                          >
                            {plan.isPopular && (
                              <div className="text-mono text-xs uppercase tracking-widest text-ultra-soft mb-3">
                                Most popular
                              </div>
                            )}
                            <h3 className={cn('text-display-sm', plan.isPopular ? 'text-ivory' : 'text-ink')}>
                              {plan.name}
                            </h3>
                            <div className="mt-6 flex items-baseline gap-2">
                              <span className={cn('text-display-md num-plate', plan.isPopular ? 'text-ivory' : 'text-ink')}>
                                {formatMoney(price)}
                              </span>
                              <span className={cn('text-mono text-xs uppercase', plan.isPopular ? 'text-ivory/60' : 'text-slate')}>
                                / {billing === 'yearly' ? 'year' : 'mo'}
                              </span>
                            </div>
                            <ul className={cn('mt-6 space-y-2 flex-1 text-sm', plan.isPopular ? 'text-ivory/80' : 'text-ink')}>
                              {(plan.features || []).slice(0, 6).map((f, j) => (
                                <li key={j} className="flex items-start gap-2">
                                  <Check size={14} className={plan.isPopular ? 'text-ultra-soft mt-0.5 shrink-0' : 'text-success mt-0.5 shrink-0'} strokeWidth={2} />
                                  <span>{f.label}</span>
                                </li>
                              ))}
                            </ul>
                            <Button
                              to={`/services/${service.slug}`}
                              variant={plan.isPopular ? 'inverse' : 'primary'}
                              className="mt-8"
                              size="md"
                            >
                              Choose {plan.name}
                              <ArrowUpRight size={14} strokeWidth={1.5} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-hairline p-8 flex items-center justify-between">
                      <div>
                        <div className="text-mono text-xs uppercase tracking-widest text-slate mb-2">Custom pricing</div>
                        <div className="text-display-sm">Starting at {formatMoney(service.startingPrice)}/mo</div>
                      </div>
                      <Button to="/consultation" size="md">Get a quote</Button>
                    </div>
                  )}
                </div>
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

      {faqs.length > 0 && <FaqAccordion items={faqs} eyebrow="Pricing FAQ" />}

      <CtaBanner
        title="Custom scope?"
        subtitle="If your needs don't fit a standard plan, book a call and we'll build a tailored quote in under 48 hours."
      />
    </>
  );
}
