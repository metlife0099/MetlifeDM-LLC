import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, X, Star } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Badge, Spinner } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner, FaqAccordion, ProcessTimeline } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { addItem } from '@/store/index.js';
import { formatMoney } from '@/utils/format.js';
import toast from 'react-hot-toast';

export default function ServiceDetailsPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', slug],
    queryFn: () => contentApi.getServiceBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center min-h-[60vh]">
        <Spinner size={32} className="text-ultra" />
      </div>
    );
  }

  if (error || !data?.service) {
    return (
      <Section spacing="xl">
        <Container>
          <Eyebrow>404 / Not found</Eyebrow>
          <h1 className="text-display-lg mt-4">Service not found</h1>
          <Link to="/services" className="mt-8 inline-block link-underline text-ink">← All services</Link>
        </Container>
      </Section>
    );
  }

  const { service, reviews } = data;

  const addToCart = (plan) => {
    dispatch(addItem({ service, plan, quantity: 1 }));
    toast.success(`${plan?.name || service.title} added to cart`);
  };

  return (
    <>
      <Seo
        title={service.title}
        description={service.shortDescription}
        image={service.heroImage?.url}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description: service.shortDescription,
          provider: { '@type': 'Organization', name: 'MetlifeDM LLC' },
          areaServed: 'US',
        }}
      />

      {/* Hero */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Link to="/services" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
            ← All services
          </Link>
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] mt-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                {service.icon && <span className="text-3xl">{service.icon}</span>}
                <Badge>{service.category?.replace('_', ' ')}</Badge>
                {service.isFeatured && <Badge tone="ultra">Featured</Badge>}
              </div>
              <h1 className="text-display-hero max-w-3xl">{service.title}</h1>
              <p className="mt-8 max-w-2xl text-lg text-slate leading-relaxed">
                {service.shortDescription}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button size="lg" onClick={() => addToCart(null)}>
                  Get started <ArrowUpRight size={16} strokeWidth={1.5} />
                </Button>
                <Button to="/consultation" variant="ghost" size="lg">
                  Book a call
                </Button>
              </div>
            </div>
            {/* Right stats card */}
            <div className="border border-hairline p-8 bg-ivory-soft">
              <div className="text-eyebrow mb-6">Snapshot</div>
              <dl className="space-y-4">
                <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                  <dt className="text-slate">Starting price</dt>
                  <dd className="text-ink">{formatMoney(service.startingPrice)}</dd>
                </div>
                <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                  <dt className="text-slate">Category</dt>
                  <dd className="text-ink">{service.category?.replace('_', ' ')}</dd>
                </div>
                <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                  <dt className="text-slate">Rating</dt>
                  <dd className="text-ink flex items-center gap-1">
                    <Star size={12} className="fill-ultra text-ultra" strokeWidth={0} />
                    {reviews?.average || '—'}
                    <span className="text-slate">({reviews?.count || 0})</span>
                  </dd>
                </div>
                <div className="flex justify-between text-mono text-sm">
                  <dt className="text-slate">Views</dt>
                  <dd className="text-ink">{service.stats?.views?.toLocaleString() || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* Overview */}
      {service.description && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
              <Eyebrow number="01">Overview</Eyebrow>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-ink leading-relaxed whitespace-pre-line">{service.description}</p>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Features & Benefits */}
      {(service.features?.length || service.benefits?.length) > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="02">What you get</Eyebrow>
            <h2 className="text-display-lg mt-4 mb-14">Included in every engagement</h2>
            <div className="grid gap-px bg-hairline border border-hairline">
              {(service.features || service.benefits || []).map((f, i) => (
                <div key={i} className="bg-ivory p-8">
                  {f.icon && <div className="text-2xl mb-4">{f.icon}</div>}
                  <h3 className="text-display-sm mb-3">{f.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Process */}
      {service.process?.length > 0 && (
        <ProcessTimeline
          steps={service.process}
          eyebrow="03 / How we work"
          title={<>Our{' '}<span className="text-italic-fraunces text-ultra">process.</span></>}
        />
      )}

      {/* Pricing plans */}
      {service.pricingPlans?.length > 0 && (
        <Section tone="ink" spacing="lg" divider={false}>
          <Container>
            <div className="text-eyebrow text-ivory/50 mb-4">04 / Pricing</div>
            <h2 className="text-display-lg text-ivory mb-14">Choose your plan</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {service.pricingPlans.map((plan, i) => (
                <motion.div
                  key={plan._id || i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`bg-ivory p-8 border ${plan.isPopular ? 'border-ultra shadow-[0_20px_60px_-20px_rgba(21,71,255,0.4)]' : 'border-transparent'} flex flex-col`}
                >
                  {plan.isPopular && (
                    <div className="text-mono text-xs uppercase tracking-widest text-ultra mb-3">Most popular</div>
                  )}
                  <h3 className="text-display-sm">{plan.name}</h3>
                  {plan.tagline && <p className="text-slate text-sm mt-2">{plan.tagline}</p>}
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-display-lg num-plate">{formatMoney(plan.price, plan.currency)}</span>
                    <span className="text-mono text-xs text-slate uppercase">/ {plan.billingCycle?.replace('_', ' ')}</span>
                  </div>
                  <ul className="mt-8 space-y-3 flex-1">
                    {(plan.features || []).map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        {f.included !== false ? (
                          <Check size={16} className="text-success mt-0.5 shrink-0" strokeWidth={2} />
                        ) : (
                          <X size={16} className="text-slate/50 mt-0.5 shrink-0" strokeWidth={2} />
                        )}
                        <span className={f.included === false ? 'text-slate line-through' : 'text-ink'}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => addToCart(plan)}
                    variant={plan.isPopular ? 'ultra' : 'primary'}
                    className="mt-8 w-full"
                    size="lg"
                  >
                    {plan.ctaLabel || 'Get started'}
                  </Button>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* FAQs */}
      {service.faqs?.length > 0 && <FaqAccordion items={service.faqs} eyebrow="05 / FAQ" />}

      <CtaBanner
        title={<>Ready to grow with <span className="text-italic-fraunces text-ultra">{service.title}?</span></>}
        primary={{ label: 'Get started', href: '/consultation' }}
      />
    </>
  );
}
