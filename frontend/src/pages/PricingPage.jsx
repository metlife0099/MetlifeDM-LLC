import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Check, ShoppingBag, Star, ArrowUpRight, ShieldCheck, Sparkles, Ban, ChevronDown,
  Headphones, Puzzle,
  Target, Megaphone, Cpu, Stethoscope,
  TrendingUp, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner, FaqAccordion } from '@/components/sections/index.jsx';
import PricingEnquiryModal from '@/components/sections/PricingEnquiryModal.jsx';
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

/* A few priced services have a richer, dedicated sales page (compare
 * tables, diagnostics, guarantees) beyond the generic service detail page —
 * link straight there instead when one exists. */
const FLAGSHIP_PAGES = {
  'professional-website-development-services': '/growth-solutions',
  'search-engine-optimization-seo': '/seo',
  'pay-per-click-ppc-advertising': '/google-ads',
  'social-media-marketing-advertising': '/social-growth',
};

/* One-time diagnostic products are sold standalone in the database, but on
 * this page they read better as a compact add-on under the service they
 * diagnose rather than as their own full-width card competing for attention
 * next to the monthly plans — same treatment for both. */
const DIAGNOSTIC_FOR = {
  'search-engine-optimization-seo': 'metlifedm-seo-diagnostic',
  'pay-per-click-ppc-advertising': 'metlifedm-paid-growth-diagnostic',
  'social-media-marketing-advertising': 'metlifedm-social-growth-diagnostic',
};
const DIAGNOSTIC_SLUGS = new Set(Object.values(DIAGNOSTIC_FOR));

/* Customer Service, Projects, the Diagnostic, and White Label each have
 * their own dedicated page now (/customer-service, /projects, /diagnostic,
 * /partners) — this page stays focused on pricing itself, so it only keeps
 * a compact, linked-out entry point for anything not directly priced here. */
const ADDONS_SOLUTION = {
  icon: Puzzle,
  name: 'Add-ons',
  price: 'Custom',
  tagline: 'Add exactly what your business needs.',
  tags: ['SEO', 'Ads', 'Content', 'Automation', 'CRM', 'SYSTOLAB', 'Development'],
  ctaLabel: 'Explore Add-ons',
  href: '/services',
};

/* ---- The MetlifeDM Ecosystem ---- */
const ECOSYSTEM_STAGES = [
  { icon: Target, label: 'Strategy' },
  { icon: Megaphone, label: 'Marketing' },
  { icon: Cpu, label: 'Technology' },
  { icon: Headphones, label: 'Customer Service' },
  { icon: Puzzle, label: 'White Label' },
  { icon: TrendingUp, label: 'Growth' },
];

/**
 * A single pricing tier. Collapsed by default — shows just a one-line
 * teaser of the inclusions (chained with "→", matching how the plan's
 * own copy describes them) — so a plan with a long feature list doesn't
 * turn the page into a wall of checkmarks. "See what's included" expands
 * it to the full itemized list.
 */
function PricingPlanCard({ plan, billing, onAddToCart }) {
  const [expanded, setExpanded] = useState(false);
  const price = billing === 'yearly' ? plan.price * 12 * 0.85 : plan.price;
  const features = plan.features || [];
  const teaserCount = 2;
  const teaser = features.slice(0, teaserCount).map((f) => f.label).join(' → ');
  const remaining = features.length - teaserCount;

  return (
    <div
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

      <div className="mt-6 flex-1">
        {features.length > 0 && (
          <>
            {!expanded && (
              <p className={cn('text-xs leading-relaxed', plan.isPopular ? 'text-ivory/70' : 'text-slate')}>
                {teaser}
                {remaining > 0 && ` +${remaining} more`}
              </p>
            )}
            {expanded && (
              <ul className={cn('space-y-2 text-sm', plan.isPopular ? 'text-ivory/80' : 'text-ink')}>
                {features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check size={14} className={plan.isPopular ? 'text-ultra-soft mt-0.5 shrink-0' : 'text-success mt-0.5 shrink-0'} strokeWidth={2} />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className={cn(
                'mt-3 flex items-center gap-1.5 text-mono text-xs uppercase tracking-widest link-underline',
                plan.isPopular ? 'text-ivory/70 hover:text-ivory' : 'text-slate hover:text-ink'
              )}
            >
              {expanded ? 'Hide details' : "See what's included"}
              <ChevronDown size={13} strokeWidth={1.5} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
            </button>
          </>
        )}
      </div>

      <Button
        onClick={onAddToCart}
        variant={plan.isPopular ? 'inverse' : 'primary'}
        className="mt-8 w-full"
        size="md"
      >
        <ShoppingBag size={14} strokeWidth={1.5} />
        {plan.ctaLabel || 'Add to cart'}
      </Button>
    </div>
  );
}

export default function PricingPage() {
  const dispatch = useDispatch();
  const [category, setCategory] = useState('');
  const [billing, setBilling] = useState('monthly');
  const [enquiryOpen, setEnquiryOpen] = useState(false);

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
        description="Transparent, itemized pricing across every MetlifeDM service — filter by category, compare plans, and see exactly what each dollar buys."
        keywords="digital marketing pricing, marketing agency pricing, SEO and PPC pricing, transparent marketing pricing, digital marketing packages USA, marketing agency cost, monthly marketing plans"
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

          <Button
            variant="ghost"
            size="md"
            onClick={() => setEnquiryOpen(true)}
            className="mt-8 border-ivory/30 text-ivory hover:bg-ivory hover:text-ink"
          >
            Have a Question About Pricing? Enquire
          </Button>
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
          ) : services.filter((s) => !DIAGNOSTIC_SLUGS.has(s.slug)).length ? (
            <div className="space-y-10">
              {services.filter((s) => !DIAGNOSTIC_SLUGS.has(s.slug)).map((service, si) => (
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
                      <Button to={FLAGSHIP_PAGES[service.slug] || `/services/${service.slug}`} size="sm">
                        {FLAGSHIP_PAGES[service.slug] ? 'View full plans' : 'Read more'}
                        <ArrowUpRight size={14} strokeWidth={1.5} />
                      </Button>
                    </div>
                  </div>

                  {service.pricingPlans?.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {service.pricingPlans.map((plan) => (
                        <PricingPlanCard
                          key={plan._id}
                          plan={plan}
                          billing={billing}
                          onAddToCart={() => handleAddToCart(service, plan)}
                        />
                      ))}
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

                  {(() => {
                    const diagnostic = services.find((s) => s.slug === DIAGNOSTIC_FOR[service.slug]);
                    const diagPlan = diagnostic?.pricingPlans?.[0];
                    if (!diagnostic || !diagPlan) return null;
                    return (
                      <div className="mt-6 pt-6 border-t border-hairline flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 shrink-0 grid place-items-center bg-sand text-ink">
                            <Stethoscope size={16} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{diagPlan.name} <span className="text-slate font-normal">· one-time</span></div>
                            <p className="text-slate text-xs mt-0.5 max-w-md leading-relaxed">{diagPlan.tagline}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="num-plate text-lg">{formatMoney(diagPlan.price)}</span>
                          <Button size="sm" onClick={() => handleAddToCart(diagnostic, diagPlan)}>
                            <ShoppingBag size={13} strokeWidth={1.5} /> Add
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
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

      {/* Add-ons — a compact, linked-out entry point */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="border border-hairline hover:border-ink transition-colors duration-500 p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8"
          >
            <div className="w-14 h-14 shrink-0 grid place-items-center bg-ink text-ivory">
              <ADDONS_SOLUTION.icon size={22} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="text-mono text-xs uppercase tracking-widest text-slate mb-2">{ADDONS_SOLUTION.name} · {ADDONS_SOLUTION.price}</div>
              <h3 className="text-display-sm">{ADDONS_SOLUTION.tagline}</h3>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {ADDONS_SOLUTION.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-slate border border-hairline">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <Button to={ADDONS_SOLUTION.href} size="md" className="shrink-0 w-fit">
              {ADDONS_SOLUTION.ctaLabel} <ArrowUpRight size={14} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE METLIFEDM ECOSYSTEM                                       */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="xl">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow className="justify-center">The MetlifeDM Ecosystem</Eyebrow>
            <h2 className="text-display-hero mt-4">
              One partner. <span className="text-italic-fraunces text-ultra">Multiple growth solutions.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 flex flex-wrap items-start justify-center gap-y-10"
          >
            {ECOSYSTEM_STAGES.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-4 w-28 md:w-32 px-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full grid place-items-center bg-ink text-ivory">
                    <stage.icon size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs md:text-sm uppercase tracking-widest text-center font-medium">{stage.label}</span>
                </div>
                {i < ECOSYSTEM_STAGES.length - 1 && (
                  <ChevronRight size={20} strokeWidth={1.5} className="text-slate shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 text-2xl md:text-3xl text-italic-fraunces text-center max-w-2xl mx-auto leading-snug"
          >
            Your business evolves. <span className="text-ultra">Your MetlifeDM solution evolves with it.</span>
          </motion.p>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* METLIFEDM PARTNER CIRCLE (deliberately minimal —               */}
      {/* invitation-only, not a public referral pitch)                 */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="sm" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          >
            <div>
              <div className="inline-flex items-center gap-2 text-ivory/40 text-[0.65rem] uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ivory/40" /> Invitation only
              </div>
              <p className="text-ivory/70 text-sm">
                <span className="text-ivory font-medium">MetlifeDM Partner Circle</span> — a private network for
                clients, partners and businesses connected through MetlifeDM.
              </p>
            </div>
            <Button to="/partners" variant="underline" className="text-ivory! shrink-0 w-fit">
              Become a Partner <ArrowUpRight size={13} strokeWidth={1.5} />
            </Button>
          </motion.div>
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
        eyebrow="Custom scope?"
        title="If your needs don't fit a standard plan, we'll build a quote around them."
        subtitle="Book a call and we'll scope a tailored plan in under 48 hours — no pressure, no fixed menu."
        primary={{ label: 'Book a Call', href: '/consultation' }}
      />

      <PricingEnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} service="Pricing" />
    </>
  );
}
