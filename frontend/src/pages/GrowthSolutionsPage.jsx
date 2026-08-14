import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Check, ChevronDown, ChevronRight, Star, ShoppingBag,
  Stethoscope, Compass, Hammer, Rocket, BarChart3, RefreshCw,
  Headphones, LayoutTemplate, Activity, Puzzle, Cpu,
  Heart, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { addItem } from '@/store/index.js';
import { formatMoney } from '@/utils/format.js';
import { cn } from '@/utils/format.js';

const GROWTH_PATHS_SLUG = 'professional-website-development-services';

/* ---- 02 · The MetlifeDM Method ---- */
const METHOD_STAGES = [
  { icon: Stethoscope, label: 'Diagnose' },
  { icon: Compass, label: 'Strategize' },
  { icon: Hammer, label: 'Build' },
  { icon: Rocket, label: 'Activate' },
  { icon: BarChart3, label: 'Measure' },
  { icon: RefreshCw, label: 'Optimize' },
];

/* ---- 06 · Specialized Solutions ---- */
const SPECIALIZED_SOLUTIONS = [
  {
    icon: Headphones,
    name: 'Customer Service',
    price: 'From $199/month',
    tagline: 'Your customers. Your requirements. Your system.',
    tags: ['WhatsApp', 'Enquiries', 'Follow-up', 'Booking', 'Reviews', 'CRM'],
    ctaLabel: 'Build Customer Service',
    href: '/consultation',
  },
  {
    icon: LayoutTemplate,
    name: 'Projects',
    price: 'Custom',
    tagline: 'Build it once. Build it right.',
    tags: ['Websites', 'Landing Pages', 'SEO Setup', 'Branding', 'Campaigns'],
    ctaLabel: 'Discuss a Project',
    href: '/consultation',
  },
  {
    icon: Activity,
    name: 'Diagnostic',
    price: 'Custom / Engagement Credit',
    tagline: "Before we recommend anything, we find what's actually wrong.",
    tags: ['Visibility', 'Positioning', 'Trust', 'Website', 'Conversion'],
    tagStyle: 'chain',
    ctaLabel: 'Get Diagnosed',
    href: '/diagnostic',
  },
  {
    icon: Puzzle,
    name: 'Add-ons',
    price: 'Custom',
    tagline: 'Add exactly what your business needs.',
    tags: ['SEO', 'Ads', 'Content', 'Automation', 'CRM'],
    ctaLabel: 'Explore Add-ons',
    href: '/services',
  },
  {
    icon: Cpu,
    name: 'Technology',
    price: 'Custom',
    tagline: 'The systems running quietly behind the growth.',
    tags: ['Custom Software', 'Integrations', 'Automation', 'APIs', 'Dashboards'],
    ctaLabel: 'Explore Technology',
    href: '/consultation',
  },
];

/* ---- 07 · Client for Life ---- */
const CLIENT_FOR_LIFE_BENEFITS = [
  'Strategic guidance',
  'Priority reactivation',
  'Preferential future-project consideration',
  'Early access to selected services',
  'Existing business knowledge retained',
  'No starting from zero when you return',
];

const EXECUTION_EXCLUSIONS = [
  'Hands-on execution', 'Advertising management', 'SEO implementation', 'Content production',
  'Website work', 'Development', 'Customer-service operations', 'Hosting', 'Substantial consulting',
];

/**
 * Full itemized capability list for a plan — collapsed to a teaser by
 * default (matching the pattern established on /pricing), expands to the
 * complete checklist. This is where the detailed checkboxes live; the
 * Growth Paths and Compare sections above stay deliberately lean.
 */
function IncludedPlanCard({ plan }) {
  const [expanded, setExpanded] = useState(false);
  const features = plan.features || [];
  const teaserCount = 2;
  const teaser = features.slice(0, teaserCount).map((f) => f.label).join(' → ');
  const remaining = features.length - teaserCount;

  return (
    <div
      className={cn(
        'p-8 flex flex-col border transition-colors duration-500',
        plan.isPopular ? 'border-ink' : 'border-hairline hover:border-ink'
      )}
    >
      <h3 className="text-display-sm">{plan.name}</h3>
      <p className="text-slate text-xs mt-2">{formatMoney(plan.price)} / mo</p>
      <div className="mt-6 flex-1">
        {!expanded && (
          <p className="text-slate text-xs leading-relaxed">
            {teaser}
            {remaining > 0 && ` +${remaining} more`}
          </p>
        )}
        {expanded && (
          <ul className="space-y-2 text-sm">
            {features.map((f, j) => (
              <li key={j} className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 shrink-0" strokeWidth={2} />
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 flex items-center gap-1.5 text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline"
        >
          {expanded ? 'Hide details' : 'See full capabilities'}
          <ChevronDown size={13} strokeWidth={1.5} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
        </button>
      </div>
    </div>
  );
}

export default function GrowthSolutionsPage() {
  const dispatch = useDispatch();

  const { data, isLoading } = useQuery({
    queryKey: ['services', 'growth-paths', GROWTH_PATHS_SLUG],
    queryFn: () => contentApi.getServiceBySlug(GROWTH_PATHS_SLUG),
  });
  const growthService = data?.service;
  const plans = growthService?.pricingPlans || [];

  const handleAddToCart = (plan) => {
    dispatch(addItem({ service: growthService, plan, quantity: 1 }));
    toast.success(`${plan.name} added to cart`);
  };

  return (
    <>
      <Seo
        title="Growth Solutions"
        description="MetlifeDM's Growth Solutions — Foundation, Growth, and Growth Partnership plans built around a diagnose-first process, not a fixed service list."
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
      {/* 01 — HERO                                                     */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1920&q=80&auto=format&fit=crop"
          alt="Strategists mapping a growth plan"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Growth Solutions</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            We don&apos;t sell marketing services.
            <br />
            We solve <span className="text-italic-fraunces text-ultra-soft">growth bottlenecks.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Every plan below starts with a diagnosis, not a guess — so the path we recommend is built around your
            business, not a fixed service list.
          </p>
          <Button href="#growth-paths" size="lg" variant="inverse" className="mt-10">
            See Growth Paths <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 02 — THE METLIFEDM METHOD                                     */}
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
            <Eyebrow className="justify-center">The MetlifeDM method</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Before we build, <span className="text-italic-fraunces text-ultra">we diagnose.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 flex flex-wrap items-start justify-center gap-y-10"
          >
            {METHOD_STAGES.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-4 w-24 md:w-28 px-2">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full grid place-items-center bg-ink text-ivory">
                    <stage.icon size={20} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.65rem] md:text-xs uppercase tracking-widest text-center font-medium">
                    {stage.label}
                  </span>
                </div>
                {i < METHOD_STAGES.length - 1 && (
                  <ChevronRight size={18} strokeWidth={1.5} className="text-slate shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 03 — GROWTH PATHS                                             */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg" divider={false} id="growth-paths">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow className="justify-center">Growth paths</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Three paths. <span className="text-italic-fraunces text-ultra">One diagnosis-first process.</span>
            </h2>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size={28} className="text-ultra" />
            </div>
          ) : (
            <div className="mt-16 grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan._id || plan.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'relative p-8 flex flex-col border transition-all duration-500',
                    plan.isPopular
                      ? 'bg-ink text-ivory border-ink shadow-[0_32px_64px_-24px_rgba(10,23,48,0.5)] md:-translate-y-3'
                      : 'bg-ivory border-hairline hover:border-ink hover-lift'
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-ultra text-ivory text-mono text-[0.65rem] uppercase tracking-widest px-3 py-1.5">
                      <Star size={11} strokeWidth={0} className="fill-current" />
                      Most popular
                    </div>
                  )}
                  <h3 className={cn('text-display-sm', plan.isPopular ? 'text-ivory' : 'text-ink')}>{plan.name}</h3>
                  {plan.tagline && (
                    <p className={cn('text-xs mt-2 leading-relaxed', plan.isPopular ? 'text-ivory/60' : 'text-slate')}>
                      {plan.tagline}
                    </p>
                  )}
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className={cn('text-display-md num-plate', plan.isPopular ? 'text-ivory' : 'text-ink')}>
                      {formatMoney(plan.price)}
                    </span>
                    <span className={cn('text-mono text-xs uppercase', plan.isPopular ? 'text-ivory/60' : 'text-slate')}>
                      / month
                    </span>
                  </div>
                  <Button
                    onClick={() => handleAddToCart(plan)}
                    variant={plan.isPopular ? 'inverse' : 'primary'}
                    className="mt-8 w-full"
                    size="md"
                  >
                    <ShoppingBag size={14} strokeWidth={1.5} />
                    {plan.ctaLabel || 'Add to cart'}
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 04 — COMPARE GROWTH PATHS (strategic differences, not          */}
      {/* checkboxes)                                                    */}
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
            <Eyebrow light className="justify-center">Compare growth paths</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              The <span className="text-italic-fraunces text-ultra-soft">strategic</span> difference.
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-px bg-ivory/10 border border-ivory/10 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan._id || plan.name} className="bg-ink p-8">
                <div className="text-mono text-xs uppercase tracking-widest text-ivory/50">{plan.name}</div>
                <p className="text-ivory text-lg mt-3 leading-snug">{plan.tagline}</p>
                <p className="text-ivory/60 text-xs mt-6 pt-6 border-t border-ivory/10 leading-relaxed">
                  {(plan.features || []).map((f) => f.label).join(' → ')}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 05 — WHAT'S INCLUDED                                          */}
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
            <Eyebrow className="justify-center">What&apos;s included</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Every capability, <span className="text-italic-fraunces text-ultra">fully itemized.</span>
            </h2>
          </motion.div>
          <div className="mt-16 grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <IncludedPlanCard key={plan._id || plan.name} plan={plan} />
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 06 — SPECIALIZED SOLUTIONS                                    */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <Eyebrow className="justify-center">Specialized solutions</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Not every business needs <span className="text-italic-fraunces text-ultra">a full plan.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SPECIALIZED_SOLUTIONS.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col border border-hairline hover:border-ink hover-lift transition-colors duration-500 p-7"
              >
                <div className="w-11 h-11 grid place-items-center bg-ink text-ivory group-hover:bg-ultra transition-colors duration-500">
                  <s.icon size={18} strokeWidth={1.5} />
                </div>
                <div className="text-mono text-xs uppercase tracking-widest text-slate mt-6">{s.name}</div>
                <div className="text-display-sm mt-2">{s.price}</div>
                <p className="text-sm text-ink mt-3 leading-relaxed">{s.tagline}</p>

                <div className="mt-5 flex-1">
                  {s.tagStyle === 'chain' ? (
                    <p className="text-xs text-slate leading-relaxed">{s.tags.join(' → ')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {s.tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-slate border border-hairline">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Button to={s.href} variant="underline" className="mt-6 w-fit">
                  {s.ctaLabel} <ArrowUpRight size={13} strokeWidth={1.5} />
                </Button>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 07 — CLIENT FOR LIFE                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} id="client-for-life">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 mx-auto mb-2 text-ultra-soft">
              <Heart size={16} strokeWidth={1.5} fill="currentColor" />
              <span className="text-mono text-xs uppercase tracking-widest">Client for life</span>
            </div>
            <h2 className="text-display-lg mt-2 text-ivory">
              Your subscription can end.<br />
              <span className="text-italic-fraunces text-ultra-soft">Our relationship doesn&apos;t have to.</span>
            </h2>
            <p className="text-ivory/70 text-lg mt-6 leading-relaxed">
              Complete 6 continuous months with MetlifeDM and you&apos;re in — lifetime strategic guidance, priority
              reactivation, and no starting from zero when you come back. Membership in the relationship, not a
              discount for returning.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 max-w-2xl mx-auto grid gap-x-8 gap-y-4 sm:grid-cols-2"
          >
            {CLIENT_FOR_LIFE_BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <Check size={15} strokeWidth={2} className="shrink-0 text-ultra-soft" />
                <span className="text-ivory/85 text-sm">{b}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 max-w-2xl mx-auto border border-ivory/15 bg-ivory/5 p-8 md:p-10"
          >
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 shrink-0 grid place-items-center bg-ivory/10 text-ultra-soft">
                <Info size={16} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-ivory text-lg font-medium">Lifetime support does not mean unlimited free execution.</h3>
                <p className="text-ivory/65 text-sm mt-3 leading-relaxed">
                  Hands-on execution, advertising management, SEO implementation, content production, website work,
                  development, customer-service operations, hosting, and substantial consulting require an active
                  engagement or a separate quote.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-ivory/10 flex flex-wrap gap-1.5">
              {EXECUTION_EXCLUSIONS.map((t) => (
                <span key={t} className="px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-ivory/50 border border-ivory/15">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 08 — NOT SURE WHICH PATH?                                     */}
      {/* ============================================================ */}
      <CtaBanner
        eyebrow="Not sure which path?"
        title="You don't have to know which plan fits. That's our job."
        subtitle="Tell us where your business is today and what's not working — we'll recommend the right path, even if it isn't one of these three."
        primary={{ label: 'Find My Growth Path', href: '/consultation' }}
      />
    </>
  );
}
