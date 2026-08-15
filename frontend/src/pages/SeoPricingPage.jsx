import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Check, ChevronDown, ChevronRight, Star, ShoppingBag, Info, X,
  Search, Compass, Hammer, BarChart3, RefreshCw, TrendingUp, Stethoscope, ListOrdered,
  Gauge, Eye, Crosshair, FileSearch, MapPin, Users, Award, MousePointerClick, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { contentApi } from '@/api/index.js';
import PricingEnquiryModal from '@/components/sections/PricingEnquiryModal.jsx';
import { addItem } from '@/store/index.js';
import { formatMoney } from '@/utils/format.js';
import { cn } from '@/utils/format.js';

const SEO_SLUG = 'search-engine-optimization-seo';
const DIAGNOSTIC_SLUG = 'metlifedm-seo-diagnostic';

/* ---- Page-level narrative content, keyed by plan name — the plan's price/
 * features/tagline live in the database (admin-editable); "best for" and
 * "focus" are fixed presentational structure for this specific page. ---- */
const BEST_FOR = {
  'Search Foundation': 'Local businesses, startups and smaller businesses that need to establish or repair their organic search foundation.',
  'Search Growth': 'Businesses that already have a digital presence but want more qualified organic traffic, enquiries and customers.',
  'Search Partnership': 'Established businesses, competitive industries, multi-location businesses and companies that want SEO to become a significant long-term acquisition channel.',
  'Search Enterprise': 'Businesses with serious scale — national, international, multi-location, e-commerce or SaaS.',
};

const FOCUS = {
  'Search Foundation': ['Discover', 'Fix', 'Establish'],
  'Search Growth': ['Visibility', 'Authority', 'Traffic', 'Leads'],
  'Search Partnership': ['Authority', 'Demand', 'Conversion', 'Compounding Growth'],
};

const ENTERPRISE_CARD = {
  name: 'Search Enterprise',
  tagline: 'Custom strategy. Custom infrastructure. Custom investment.',
  startingFrom: 2500,
  ctaLabel: 'Talk to Sales',
  features: [
    'National SEO', 'International SEO', 'Multi-location SEO', 'E-commerce SEO', 'SaaS SEO',
    'Large websites', 'Enterprise technical SEO', 'Programmatic SEO', 'International website architecture',
    'Large-scale content systems', 'Advanced analytics', 'Custom integrations', 'SYSTOLAB integrations',
    'Dedicated SEO team', 'Custom reporting', 'Custom workflows',
  ],
};

/* ---- The differentiator ---- */
const DIFFERENTIATOR_CHAIN = [
  { icon: Search, label: 'Opportunity' },
  { icon: Compass, label: 'Strategy' },
  { icon: Hammer, label: 'Execution' },
  { icon: BarChart3, label: 'Measurement' },
  { icon: TrendingUp, label: 'Improvement' },
];

/* ---- Which one is right for me? ---- */
const SELF_SELECTION = [
  { situation: "My website exists, but I'm not really being found.", plan: 'Search Foundation', price: '$399', href: '#pricing' },
  { situation: "We're getting some visibility, but we need more qualified traffic and enquiries.", plan: 'Search Growth', price: '$699', href: '#pricing', popular: true },
  { situation: 'Organic search is strategically important to our business and we want a serious long-term system.', plan: 'Search Partnership', price: '$1,299', href: '#pricing' },
  { situation: 'We’re operating across multiple markets, locations or a large website.', plan: 'Search Enterprise', price: 'Custom', href: '#pricing' },
];

/* ---- The MetlifeDM SEO Diagnostic — what it analyzes ---- */
const DIAGNOSTIC_AREAS = [
  { icon: Gauge, label: 'Technical Health' },
  { icon: Eye, label: 'Search Visibility' },
  { icon: Crosshair, label: 'Search Intent' },
  { icon: FileSearch, label: 'Content Coverage' },
  { icon: MapPin, label: 'Local Presence' },
  { icon: Users, label: 'Competitor Gaps' },
  { icon: Award, label: 'Authority' },
  { icon: MousePointerClick, label: 'Conversion Readiness' },
];

/* ---- SYSTOLAB + SEO ---- */
const SYSTOLAB_CHAIN = [
  { icon: Activity, label: 'SYSTOLAB' },
  { icon: Search, label: 'Identifies Opportunities' },
  { icon: Compass, label: 'MetlifeDM Search Strategy' },
  { icon: Hammer, label: 'SEO Execution' },
  { icon: BarChart3, label: 'Measurement' },
  { icon: RefreshCw, label: 'Optimization' },
  { icon: TrendingUp, label: 'Growth' },
];

/* ---- What is NOT included ---- */
const NOT_INCLUDED = [
  'Website development', 'Custom software development', 'Paid advertising spend',
  'Professional photography/video', 'Unlimited content production', 'Major website migrations',
  'Large-scale development', 'Custom integrations', 'Dedicated customer-service operations',
  'Third-party software costs', 'Premium tools/platform fees',
];

/* ---- The MetlifeDM SEO Guarantee ---- */
const GUARANTEE_CHAIN = [
  { icon: Stethoscope, label: 'Diagnose' },
  { icon: ListOrdered, label: 'Prioritize' },
  { icon: Hammer, label: 'Execute' },
  { icon: BarChart3, label: 'Measure' },
  { icon: RefreshCw, label: 'Improve' },
];

/* ---- SEO Agency vs MetlifeDM ---- */
const AGENCY_COMPARISON = [
  { them: 'How many keywords?', us: 'What search opportunity are we missing?' },
  { them: 'Rankings', us: 'Business outcomes' },
  { them: 'Monthly checklist', us: 'Continuous growth system' },
  { them: 'More content', us: 'Content with intent' },
  { them: 'More backlinks', us: 'Relevant authority' },
  { them: 'Traffic', us: 'Qualified demand' },
  { them: 'SEO in isolation', us: 'SEO + website + conversion + customer journey' },
  { them: 'Generic reports', us: 'Actionable intelligence' },
  { them: 'One-size-fits-all', us: 'Diagnose → Prioritize → Execute' },
  { them: 'Promise rankings', us: 'Build sustainable search capability' },
];

/**
 * One SEO plan card — collapsed feature list (teaser + expand), matching
 * the pattern established across the site's other pricing cards, plus the
 * "Best for" and "Focus" context this page's plans specifically need.
 */
function SeoPlanCard({ name, price, priceLabel, tagline, features, isPopular, ctaLabel, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const teaserCount = 3;
  const teaser = features.slice(0, teaserCount).join(' → ');
  const remaining = features.length - teaserCount;
  const bestFor = BEST_FOR[name];
  const focus = FOCUS[name];

  return (
    <div
      className={cn(
        'relative p-8 flex flex-col border transition-all duration-500',
        isPopular
          ? 'bg-ink text-ivory border-ink shadow-[0_32px_64px_-24px_rgba(10,23,48,0.5)] lg:-translate-y-3'
          : 'bg-ivory border-hairline hover:border-ink hover-lift'
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-ultra text-ivory text-mono text-[0.65rem] uppercase tracking-widest px-3 py-1.5">
          <Star size={11} strokeWidth={0} className="fill-current" />
          Most popular
        </div>
      )}

      <h3 className={cn('text-display-sm', isPopular ? 'text-ivory' : 'text-ink')}>{name}</h3>
      {tagline && (
        <p className={cn('text-xs mt-2 leading-relaxed', isPopular ? 'text-ivory/60' : 'text-slate')}>{tagline}</p>
      )}

      <div className="mt-6 flex items-baseline gap-2">
        <span className={cn('text-display-md num-plate', isPopular ? 'text-ivory' : 'text-ink')}>
          {price ? formatMoney(price) : priceLabel}
        </span>
        <span className={cn('text-mono text-xs uppercase', isPopular ? 'text-ivory/60' : 'text-slate')}>
          {price ? '/ month' : `starting from ${formatMoney(ENTERPRISE_CARD.startingFrom)}/mo`}
        </span>
      </div>

      {bestFor && (
        <div className={cn('mt-6 pt-6 border-t', isPopular ? 'border-ivory/10' : 'border-hairline')}>
          <div className={cn('text-mono text-[0.65rem] uppercase tracking-widest mb-2', isPopular ? 'text-ivory/50' : 'text-slate')}>
            Best for
          </div>
          <p className={cn('text-xs leading-relaxed', isPopular ? 'text-ivory/70' : 'text-slate')}>{bestFor}</p>
        </div>
      )}

      <div className="mt-6 flex-1">
        {!expanded && (
          <p className={cn('text-xs leading-relaxed', isPopular ? 'text-ivory/70' : 'text-slate')}>
            {teaser}
            {remaining > 0 && ` +${remaining} more`}
          </p>
        )}
        {expanded && (
          <ul className={cn('space-y-2 text-sm', isPopular ? 'text-ivory/80' : 'text-ink')}>
            {features.map((f, j) => (
              <li key={j} className="flex items-start gap-2">
                <Check size={14} className={isPopular ? 'text-ultra-soft mt-0.5 shrink-0' : 'text-success mt-0.5 shrink-0'} strokeWidth={2} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            'mt-3 flex items-center gap-1.5 text-mono text-xs uppercase tracking-widest link-underline',
            isPopular ? 'text-ivory/70 hover:text-ivory' : 'text-slate hover:text-ink'
          )}
        >
          {expanded ? 'Hide details' : "See what's included"}
          <ChevronDown size={13} strokeWidth={1.5} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
        </button>
      </div>

      {focus && (
        <div className={cn('mt-6 pt-6 border-t', isPopular ? 'border-ivory/10' : 'border-hairline')}>
          <div className={cn('text-mono text-[0.65rem] uppercase tracking-widest mb-2', isPopular ? 'text-ivory/50' : 'text-slate')}>
            Focus
          </div>
          <p className={cn('text-xs leading-relaxed', isPopular ? 'text-ivory/70' : 'text-slate')}>{focus.join(' → ')}</p>
        </div>
      )}

      <Button
        onClick={onAction}
        variant={isPopular ? 'inverse' : 'primary'}
        className="mt-8 w-full"
        size="md"
      >
        {price && <ShoppingBag size={14} strokeWidth={1.5} />}
        {ctaLabel}
      </Button>
    </div>
  );
}

export default function SeoPricingPage() {
  const dispatch = useDispatch();
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const { data: seoData, isLoading } = useQuery({
    queryKey: ['services', 'seo-pricing', SEO_SLUG],
    queryFn: () => contentApi.getServiceBySlug(SEO_SLUG),
  });
  const seoService = seoData?.service;
  const plans = seoService?.pricingPlans || [];
  const comparisonTable = seoService?.comparisonTable || [];

  const { data: diagData } = useQuery({
    queryKey: ['services', 'seo-diagnostic', DIAGNOSTIC_SLUG],
    queryFn: () => contentApi.getServiceBySlug(DIAGNOSTIC_SLUG),
  });
  const diagnosticService = diagData?.service;
  const diagnosticPlan = diagnosticService?.pricingPlans?.[0];

  const handleAddToCart = (service, plan) => {
    dispatch(addItem({ service, plan, quantity: 1 }));
    toast.success(`${plan.name} added to cart`);
  };

  return (
    <>
      <Seo
        title="SEO & Search Growth Pricing"
        description="SEO isn't a monthly checklist — it's a search-growth system that gets smarter over time. Search Foundation, Search Growth, and Search Partnership plans, plus a one-time SEO Diagnostic to find the bottleneck first."
        jsonLd={
          plans.length > 0
            ? {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: plans.map((plan, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  item: {
                    '@type': 'Service',
                    name: plan.name,
                    description: plan.tagline,
                    provider: { '@type': 'Organization', name: 'MetlifeDM LLC' },
                    offers: { '@type': 'Offer', price: plan.price, priceCurrency: plan.currency || 'USD' },
                  },
                })),
              }
            : undefined
        }
      />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1571677208775-fd071cdba9a8?w=1920&q=80&auto=format&fit=crop"
          alt="A search-growth strategy taking shape"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>SEO / Search Growth</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-3xl text-ivory">
            SEO isn&apos;t a monthly checklist.
          </h1>
          <p className="text-2xl md:text-3xl mt-4 max-w-2xl text-italic-fraunces text-ultra-soft leading-snug">
            It&apos;s a search-growth system that gets smarter over time.
          </p>
          <div className="mt-6 text-sm uppercase tracking-[0.2em] font-medium text-ivory/60">
            Diagnose first. Optimize second. Measure always.
          </div>
          <Button href="#pricing" size="lg" variant="inverse" className="mt-10">
            See Search Growth Plans <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PRICING TIERS                                                 */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg" divider={false} id="pricing">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow className="justify-center">Search growth plans</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Four levels of <span className="text-italic-fraunces text-ultra">search intelligence.</span>
            </h2>
            <Button variant="outline" size="md" onClick={() => setEnquiryOpen(true)} className="mt-6">
              Not sure which plan? Enquire About Pricing
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size={28} className="text-ultra" />
            </div>
          ) : (
            <div className="mt-16 grid gap-6 lg:grid-cols-4">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan._id || plan.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SeoPlanCard
                    name={plan.name}
                    price={plan.price}
                    tagline={plan.tagline}
                    features={(plan.features || []).map((f) => f.label)}
                    isPopular={plan.isPopular}
                    ctaLabel={plan.ctaLabel}
                    onAction={() => handleAddToCart(seoService, plan)}
                  />
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: plans.length * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <SeoPlanCard
                  name={ENTERPRISE_CARD.name}
                  price={null}
                  priceLabel="Custom"
                  tagline={ENTERPRISE_CARD.tagline}
                  features={ENTERPRISE_CARD.features}
                  isPopular={false}
                  ctaLabel={ENTERPRISE_CARD.ctaLabel}
                  onAction={() => (window.location.href = '/consultation')}
                />
              </motion.div>
            </div>
          )}
          <p className="text-slate text-xs text-center mt-8 max-w-lg mx-auto leading-relaxed">
            Search Enterprise is custom strategy, custom infrastructure, and custom investment — final pricing
            depends on website size, market complexity, geographic coverage, competition and execution requirements.
          </p>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE DIFFERENTIATOR                                            */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">The differentiator</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              You&apos;re not buying keywords. <span className="text-italic-fraunces text-ultra-soft">You&apos;re buying this.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 flex flex-wrap items-start justify-center gap-y-10"
          >
            {DIFFERENTIATOR_CHAIN.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-4 w-28 md:w-32 px-2">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full grid place-items-center bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.65rem] md:text-xs uppercase tracking-widest text-center font-medium text-ivory">
                    {stage.label}
                  </span>
                </div>
                {i < DIFFERENTIATOR_CHAIN.length - 1 && (
                  <ChevronRight size={18} strokeWidth={1.5} className="text-ivory/25 shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* COMPARE YOUR SEARCH GROWTH PLAN                               */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow className="justify-center">Compare your search growth plan</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Different problems. <span className="text-italic-fraunces text-ultra">Different levels of ambition.</span>
            </h2>
          </motion.div>

          {comparisonTable.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-16 overflow-x-auto"
            >
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-4 pr-4 text-mono text-xs uppercase tracking-widest text-slate font-normal align-bottom">
                      Features
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan._id || plan.name}
                        className={cn('text-center py-4 px-4 align-bottom min-w-[9rem]', plan.isPopular && 'bg-sand')}
                      >
                        <div className="text-ink text-base font-medium">{plan.name}</div>
                        <div className="text-slate text-xs mt-1">{formatMoney(plan.price)}/mo</div>
                        {plan.isPopular && (
                          <div className="inline-flex items-center gap-1 mt-1.5 text-mono text-[0.6rem] uppercase tracking-widest text-ultra">
                            <Star size={9} strokeWidth={0} className="fill-current" /> Most popular
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, ri) => (
                    <tr key={row._id || row.feature} className={cn(ri % 2 === 1 && 'bg-sand/40')}>
                      <td className="py-3.5 pr-4 text-ink text-sm border-t border-hairline">{row.feature}</td>
                      {plans.map((plan, pi) => {
                        const value = row.values?.[pi];
                        return (
                          <td
                            key={plan._id || plan.name}
                            className={cn('text-center py-3.5 px-4 border-t border-hairline', plan.isPopular && 'bg-sand')}
                          >
                            {value === '✅' ? (
                              <Check size={16} strokeWidth={2} className="mx-auto text-ultra" />
                            ) : !value || value === '—' ? (
                              <span className="text-slate/40">—</span>
                            ) : (
                              <span className="text-slate text-xs">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-5 pr-4 border-t border-ink" />
                    {[
                      ['Get discoverable.', 'FOUNDATION'],
                      ['Turn visibility into demand.', 'GROWTH'],
                      ['Turn search into a compounding growth channel.', 'PARTNERSHIP'],
                    ].map(([line, label], i) => (
                      <td key={label} className={cn('text-center py-5 px-4 border-t border-ink', plans[i]?.isPopular && 'bg-sand')}>
                        <div className="text-mono text-[0.6rem] uppercase tracking-widest text-slate mb-1.5">{label}</div>
                        <p className="text-ink text-xs italic leading-snug">{line}</p>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </motion.div>
          )}
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* WHICH ONE IS RIGHT FOR ME?                                    */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <Eyebrow light className="justify-center">Where are you right now?</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Skip the table. <span className="text-italic-fraunces text-ultra-soft">Just answer this.</span>
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto divide-y divide-ivory/10 border-y border-ivory/10">
            {SELF_SELECTION.map((s, i) => (
              <motion.a
                key={s.plan}
                href={s.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group flex items-center justify-between gap-6 py-6 hover:bg-ivory/5 transition-colors duration-300 px-2 -mx-2"
              >
                <p className="text-ivory/80 text-base md:text-lg leading-snug italic">&ldquo;{s.situation}&rdquo;</p>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1.5 justify-end text-ivory text-sm font-medium">
                    {s.plan}
                    {s.popular && <Star size={10} strokeWidth={0} className="fill-current text-ultra-soft" />}
                  </div>
                  <div className="text-ultra-soft text-xs mt-1 flex items-center gap-1 justify-end">
                    {s.price} <ArrowUpRight size={11} strokeWidth={1.5} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE METLIFEDM SEO DIAGNOSTIC                                  */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow>The MetlifeDM SEO Diagnostic</Eyebrow>
              <h2 className="text-display-lg mt-4">
                Before you invest, <span className="text-italic-fraunces text-ultra">find out what&apos;s holding you back.</span>
              </h2>
              <p className="text-slate text-lg mt-6 leading-relaxed">
                A one-time, in-depth look across eight areas of your search presence — ending in your Search Growth
                Roadmap, with the top opportunities prioritized by impact.
              </p>

              <div className="mt-10 flex items-baseline gap-2">
                <span className="text-display-md num-plate">{diagnosticPlan ? formatMoney(diagnosticPlan.price) : '$199'}</span>
                <span className="text-mono text-xs uppercase text-slate">one-time</span>
              </div>
              <p className="text-slate text-sm mt-3 max-w-md leading-relaxed">
                Move forward with a Search Growth ($699+) engagement, and your $199 diagnostic fee is credited
                toward your first month.
              </p>

              <Button
                onClick={() => diagnosticService && diagnosticPlan && handleAddToCart(diagnosticService, diagnosticPlan)}
                size="lg"
                className="mt-8"
                disabled={!diagnosticPlan}
              >
                <ShoppingBag size={14} strokeWidth={1.5} />
                Get My Diagnostic
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2"
            >
              {DIAGNOSTIC_AREAS.map((a) => (
                <div key={a.label} className="bg-ivory p-6 flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 grid place-items-center bg-ink text-ivory">
                    <a.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-ink text-sm">{a.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* SYSTOLAB + SEO                                                */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">SYSTOLAB + SEO</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Diagnose <span className="text-italic-fraunces text-ultra-soft">before you optimize.</span>
            </h2>
            <p className="text-ivory/65 text-sm mt-6 max-w-lg mx-auto leading-relaxed">
              SYSTOLAB is a diagnostic technology layer within the broader MetlifeDM methodology — it identifies
              opportunities, it doesn&apos;t decide your strategy alone.
            </p>
          </motion.div>

          <div className="mt-16 max-w-md mx-auto">
            {SYSTOLAB_CHAIN.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="flex items-center gap-5 py-3.5">
                  <div className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-ivory text-base">{stage.label}</span>
                </div>
                {i < SYSTOLAB_CHAIN.length - 1 && (
                  <div className="pl-5">
                    <div className="w-px h-5 bg-ivory/15" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* WHAT IS NOT INCLUDED                                          */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto border border-hairline p-8 md:p-10"
          >
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 shrink-0 grid place-items-center bg-sand">
                <Info size={16} strokeWidth={1.5} className="text-ink" />
              </div>
              <div>
                <h3 className="text-lg font-medium">What&apos;s not included</h3>
                <p className="text-slate text-sm mt-3 leading-relaxed">
                  Monthly SEO plans don&apos;t automatically include unlimited website development, custom software,
                  paid advertising spend, or large-scale production work. Those become Projects, Add-ons, or a
                  custom engagement.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-hairline flex flex-wrap gap-1.5">
              {NOT_INCLUDED.map((t) => (
                <span key={t} className="px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-slate border border-hairline">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE METLIFEDM SEO GUARANTEE                                   */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">The MetlifeDM SEO guarantee</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              We don&apos;t guarantee a position. <span className="text-italic-fraunces text-ultra-soft">We guarantee a process.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 flex flex-wrap items-start justify-center gap-y-10"
          >
            {GUARANTEE_CHAIN.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-4 w-24 md:w-28 px-2">
                  <div className="w-14 h-14 rounded-full grid place-items-center bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={18} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.65rem] md:text-xs uppercase tracking-widest text-center font-medium text-ivory">
                    {stage.label}
                  </span>
                </div>
                {i < GUARANTEE_CHAIN.length - 1 && (
                  <ChevronRight size={18} strokeWidth={1.5} className="text-ivory/25 shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 text-ivory/60 text-sm text-center max-w-lg mx-auto leading-relaxed"
          >
            Search engines, competitors and customer behaviour are outside anyone&apos;s complete control.
          </motion.p>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* SEO AGENCY VS METLIFEDM                                       */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <Eyebrow className="justify-center">SEO agency vs MetlifeDM</Eyebrow>
            <h2 className="text-display-lg mt-4">
              We&apos;re not competing <span className="text-italic-fraunces text-ultra">on the same thing.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto overflow-x-auto"
          >
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 pr-4 text-mono text-xs uppercase tracking-widest text-slate font-normal border-b border-hairline">
                    Traditional SEO approach
                  </th>
                  <th className="text-left py-3 pl-4 text-mono text-xs uppercase tracking-widest text-ultra font-normal border-b border-hairline">
                    MetlifeDM approach
                  </th>
                </tr>
              </thead>
              <tbody>
                {AGENCY_COMPARISON.map((row) => (
                  <tr key={row.them} className="border-b border-hairline">
                    <td className="py-3.5 pr-4 text-slate text-sm flex items-start gap-2">
                      <X size={13} strokeWidth={2} className="text-slate/40 mt-1 shrink-0" />
                      {row.them}
                    </td>
                    <td className="py-3.5 pl-4 text-ink text-sm">
                      <span className="flex items-start gap-2">
                        <Check size={13} strokeWidth={2} className="text-ultra mt-1 shrink-0" />
                        {row.us}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="border border-ink p-10 md:p-16 text-center max-w-3xl mx-auto mt-20"
          >
            <h2 className="text-display-lg">
              Don&apos;t buy SEO. <span className="text-italic-fraunces text-ultra">Build your search advantage.</span>
            </h2>
            <Button to="/consultation" size="lg" className="mt-10">
              Find My Search Bottleneck <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      <PricingEnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} service="SEO & Search Growth" />
    </>
  );
}
