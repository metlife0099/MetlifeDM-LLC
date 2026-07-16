import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Star, ShoppingBag } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
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
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: service.title,
            description: service.shortDescription,
            provider: { '@type': 'Organization', name: 'MetlifeDM LLC' },
            areaServed: 'US',
          },
          ...(service.process?.length > 0
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'HowTo',
                  name: `How our ${service.title} process works`,
                  description: service.shortDescription,
                  step: service.process.map((s, i) => ({
                    '@type': 'HowToStep',
                    position: i + 1,
                    name: s.title,
                    text: s.description,
                  })),
                },
              ]
            : []),
        ]}
      />

      {/* Hero */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src={service.heroImage?.url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80&auto=format&fit=crop'}
          alt={service.title}
        />
        <Container className="relative z-10">
          <Link to="/services" className="text-mono text-xs uppercase tracking-widest text-ivory/60 hover:text-ivory link-underline">
            ← All services
          </Link>
          <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] mt-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                {service.icon && <span className="text-3xl">{service.icon}</span>}
                <Badge>{service.category?.replace(/_/g, ' ')}</Badge>
                {service.isFeatured && <Badge tone="ultra">Featured</Badge>}
              </div>
              <h1 className="text-display-hero max-w-3xl text-ivory">{service.title}</h1>
              <p className="mt-8 max-w-2xl text-lg text-ivory/75 leading-relaxed">
                {service.shortDescription}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {service.pricingPlans?.length > 0 ? (
                  <Button size="lg" variant="inverse" to="/pricing">
                    View pricing <ArrowUpRight size={16} strokeWidth={1.5} />
                  </Button>
                ) : (
                  <Button size="lg" variant="inverse" onClick={() => addToCart(null)}>
                    <ShoppingBag size={16} strokeWidth={1.5} /> Add to cart
                  </Button>
                )}
                <Button to="/consultation" variant="ghost" size="lg" className="border-ivory/30 text-ivory hover:bg-ivory hover:text-ink">
                  Book a call
                </Button>
              </div>
            </div>
            {/* Right stats card */}
            <div className="border border-hairline p-8 bg-ivory-soft shadow-[0_32px_64px_-24px_rgba(0,0,0,0.5)] hover-glow">
              <div className="text-eyebrow mb-6">Snapshot</div>
              <dl className="space-y-4">
                <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                  <dt className="text-slate">Starting price</dt>
                  <dd className="text-ink">{formatMoney(service.startingPrice)}</dd>
                </div>
                <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                  <dt className="text-slate">Category</dt>
                  <dd className="text-ink">{service.category?.replace(/_/g, ' ')}</dd>
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
              <div
                className="prose prose-lg max-w-none text-lg text-ink leading-relaxed"
                dangerouslySetInnerHTML={{ __html: service.description }}
              />
            </div>
          </Container>
        </Section>
      )}

      {/* Features */}
      {service.features?.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="02">What you get</Eyebrow>
            <h2 className="text-display-lg mt-4 mb-14">Included in every engagement</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {service.features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: (i % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group bg-ivory border border-hairline hover:border-ink hover-lift transition-colors duration-500 p-8"
                >
                  {f.icon && (
                    <div className="w-12 h-12 grid place-items-center bg-ink text-ivory text-xl mb-6 group-hover:bg-ultra transition-colors duration-500">
                      {f.icon}
                    </div>
                  )}
                  <h3 className="text-display-sm mb-3">{f.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Benefits */}
      {service.benefits?.length > 0 && (
        <Section tone="ivorySoft" spacing="lg">
          <Container>
            <div className="max-w-2xl mb-14">
              <Eyebrow number="03">Why it works</Eyebrow>
              <h2 className="text-display-lg mt-4">
                Built for <span className="text-italic-fraunces text-ultra">real outcomes.</span>
              </h2>
              <p className="text-slate text-lg mt-6 leading-relaxed">
                Beyond the deliverables — here&apos;s the actual business impact you can expect.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {service.benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: (i % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group bg-ivory border border-hairline hover:border-ink hover-lift transition-colors duration-500 p-8"
                >
                  <div className="w-12 h-12 grid place-items-center bg-sand group-hover:bg-ultra text-ink group-hover:text-ivory text-xl rounded-full mb-6 transition-colors duration-500">
                    {b.icon || <Check size={18} strokeWidth={2} />}
                  </div>
                  <h3 className="text-display-sm mb-3 group-hover:text-ultra transition-colors duration-300">{b.title}</h3>
                  <p className="text-slate text-sm leading-relaxed">{b.description}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Process */}
      {service.process?.length > 0 && (
        <ProcessTimeline
          steps={service.process}
          eyebrow="04 / How we work"
          title={<>Our{' '}<span className="text-italic-fraunces text-ultra">process.</span></>}
        />
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
