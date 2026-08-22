import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Check, ChevronDown, ChevronRight, Star, ShoppingBag, X, DollarSign,
  Search, Compass, Hammer, Rocket, BarChart3, RefreshCw, TrendingUp,
  Crosshair, MousePointerClick, CheckCircle2, Megaphone, LayoutTemplate, Gift, Send, Users,
  Eye, UserCheck, Globe, ShieldCheck, Layers, Route,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { QueryError, Spinner } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { contentApi } from '@/api/index.js';
import PricingEnquiryModal from '@/components/sections/PricingEnquiryModal.jsx';
import { addItem } from '@/store/index.js';
import { billingCycleLabel } from '@/utils/commerce.js';
import { cn, formatMoney } from '@/utils/format.js';

const ADS_SLUG = 'pay-per-click-ppc-advertising';
const DIAGNOSTIC_SLUG = 'metlifedm-paid-growth-diagnostic';

const formatPlanFee = (plan) => {
  if (!plan) return 'Contact us';
  const cadence = plan.billingCycle === 'one_time' ? ' one-time' : `/${billingCycleLabel(plan.billingCycle)}`;
  return `${formatMoney(plan.price, plan.currency || 'USD')}${cadence}`;
};

/* ---- Hero — the paid-growth journey, at a glance ---- */
const HERO_CHAIN = [
  { icon: Search, label: 'Demand' },
  { icon: Crosshair, label: 'Target' },
  { icon: MousePointerClick, label: 'Click' },
  { icon: CheckCircle2, label: 'Convert' },
  { icon: BarChart3, label: 'Measure' },
  { icon: RefreshCw, label: 'Optimize' },
  { icon: TrendingUp, label: 'Scale' },
];

/* ---- The problem — the ad is only one part of the system ---- */
const PROBLEM_CHAIN = [
  { icon: Megaphone, label: 'Ad' },
  { icon: Crosshair, label: 'Search intent' },
  { icon: LayoutTemplate, label: 'Landing page' },
  { icon: Gift, label: 'Offer' },
  { icon: MousePointerClick, label: 'Conversion' },
  { icon: Star, label: 'Lead quality' },
  { icon: Send, label: 'Follow-up' },
  { icon: Users, label: 'Customer' },
];

/* ---- MetlifeDM Paid Growth System ---- */
const PAID_GROWTH_SYSTEM = [
  { num: '01', icon: Search, title: 'Discover', desc: 'Understand demand, search behaviour, customer intent, competitors, offers, and geographic opportunity.' },
  { num: '02', icon: Compass, title: 'Strategize', desc: 'Build campaign architecture, keyword strategy, audience strategy, budget allocation, offer strategy, and conversion strategy.' },
  { num: '03', icon: Hammer, title: 'Build', desc: 'Create search campaigns, Performance Max and display/remarketing where appropriate, conversion tracking, landing pages, ad creative, and audience signals.' },
  { num: '04', icon: Rocket, title: 'Launch', desc: 'Controlled budgets → Clean tracking → Clear objectives.' },
  { num: '05', icon: BarChart3, title: 'Optimize', desc: 'Continuously examine search terms, CTR, CPC, conversion rate, cost per lead, lead quality, cost per acquisition, and revenue.' },
  { num: '06', icon: TrendingUp, title: 'Scale', desc: "Don't simply increase the budget. Scale what proves it can work." },
];

/* ---- Page-level narrative content, keyed by plan name ---- */
const BEST_FOR = {
  'Ads Foundation': 'Businesses starting Google Ads or businesses whose existing campaigns need structure.',
  'Ads Growth': 'Businesses already investing in Google Ads that want better lead quality, conversion rates and acquisition efficiency.',
  'Ads Partnership': 'Established businesses where Google Ads is a major customer-acquisition channel.',
  'Paid Growth Enterprise': 'Companies spending significantly on paid acquisition or operating across multiple markets.',
};

const FOCUS = {
  'Ads Foundation': ['Structure', 'Relevance', 'Control'],
  'Ads Growth': ['Traffic', 'Leads', 'Qualified Opportunities', 'Customers'],
  'Ads Partnership': ['Acquire', 'Convert', 'Learn', 'Scale', 'Compound'],
};

const AD_SPEND = {
  'Ads Foundation': '$500–$2,500/month',
  'Ads Growth': '$2,500–$10,000/month',
  'Ads Partnership': '$10,000+/month',
  'Paid Growth Enterprise': '$25,000+/month',
};

const ENTERPRISE_CARD = {
  name: 'Paid Growth Enterprise',
  tagline: 'Custom strategy. Custom infrastructure. Custom investment.',
  ctaLabel: 'Talk to Sales',
  features: [
    'Multi-country campaigns', 'Multi-location campaigns', 'Large campaign structures',
    'Complex conversion tracking', 'CRM integration', 'Offline conversion tracking',
    'Advanced attribution', 'Custom dashboards', 'Multiple business units',
    'Custom landing-page systems', 'API integrations', 'Dedicated paid-growth team',
    'Advanced experimentation', 'Custom reporting',
  ],
};

/* ---- Don't confuse activity with performance ---- */
const PERFORMANCE_CHAIN = [
  { icon: Eye, label: 'Qualified traffic' },
  { icon: MousePointerClick, label: 'Conversions' },
  { icon: Star, label: 'Qualified leads' },
  { icon: UserCheck, label: 'Customers' },
  { icon: BarChart3, label: 'Acquisition economics' },
];

/* ---- What we don't promise ---- */
const DONT_PROMISE = [
  'Guaranteed leads', 'Guaranteed ROAS', 'Guaranteed #1 position',
  "“We’ll double your sales in 30 days”", 'Unlimited campaigns for the sake of looking busy',
];

/* ---- Google Ads + SYSTOLAB ---- */
const SYSTOLAB_ADS_CHAIN = [
  { icon: Megaphone, label: 'Ad' },
  { icon: LayoutTemplate, label: 'Landing Page' },
  { icon: Globe, label: 'Website' },
  { icon: ShieldCheck, label: 'Trust' },
  { icon: MousePointerClick, label: 'Conversion' },
];

/* ---- The MetlifeDM Paid Growth Diagnostic — what it analyzes ---- */
const DIAGNOSTIC_AREAS = [
  { icon: Layers, label: 'Campaign structure' },
  { icon: Crosshair, label: 'Search intent' },
  { icon: Search, label: 'Keywords' },
  { icon: Megaphone, label: 'Ad relevance' },
  { icon: LayoutTemplate, label: 'Landing pages' },
  { icon: BarChart3, label: 'Conversion tracking' },
  { icon: Star, label: 'Lead quality' },
  { icon: Route, label: 'Customer journey' },
  { icon: Users, label: 'Competitor positioning' },
];

/* ---- The MetlifeDM difference ---- */
const THE_DIFFERENCE = [
  { them: 'How much do you want to spend on Google?', us: 'What does it cost you to acquire one customer — and can we improve that?' },
  { them: 'Your CPC decreased.', us: 'Did the quality of your customers improve?' },
  { them: 'Your campaign is running.', us: 'Is the system producing profitable opportunities?' },
];

/**
 * One Ads plan card — collapsed feature list (teaser + expand), plus the
 * "Best for", "Focus", and "Recommended ad spend" context specific to
 * paid-growth plans (ad spend is always separate from the management fee).
 */
function AdsPlanCard({ name, price, priceLabel, billingCycle, tagline, features, isPopular, ctaLabel, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const quoteOnly = billingCycle === 'custom' || price == null;
  const teaserCount = 3;
  const teaser = features.slice(0, teaserCount).join(' → ');
  const remaining = features.length - teaserCount;
  const bestFor = BEST_FOR[name];
  const focus = FOCUS[name];
  const spend = AD_SPEND[name];

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
          {quoteOnly ? priceLabel || 'Custom quote' : formatMoney(price)}
        </span>
        <span className={cn('text-mono text-xs uppercase', isPopular ? 'text-ivory/60' : 'text-slate')}>
          {quoteOnly
            ? 'management scope priced by proposal'
            : billingCycle === 'one_time' ? 'one-time management fee' : `/ ${billingCycleLabel(billingCycle)}, management`}
        </span>
      </div>

      {spend && (
        <div className={cn('mt-3 text-[0.7rem] leading-relaxed', isPopular ? 'text-ivory/50' : 'text-slate')}>
          Recommended ad spend: <span className="font-medium">{spend}</span>
        </div>
      )}

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
        {!quoteOnly && <ShoppingBag size={14} strokeWidth={1.5} />}
        {quoteOnly ? 'Get a quote' : ctaLabel || 'Add to cart'}
      </Button>
    </div>
  );
}

export default function GoogleAdsPricingPage() {
  const dispatch = useDispatch();
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const { data: adsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['services', 'ads-pricing', ADS_SLUG],
    queryFn: () => contentApi.getServiceBySlug(ADS_SLUG),
  });
  const adsService = adsData?.service;
  const plans = adsService?.pricingPlans || [];
  const comparisonTable = adsService?.comparisonTable || [];

  const { data: diagData } = useQuery({
    queryKey: ['services', 'ads-diagnostic', DIAGNOSTIC_SLUG],
    queryFn: () => contentApi.getServiceBySlug(DIAGNOSTIC_SLUG),
  });
  const diagnosticService = diagData?.service;
  const diagnosticPlan = diagnosticService?.pricingPlans?.[0];
  const finalPricing = [
    ...plans.map((plan) => ({
      plan: plan.name,
      fee: formatPlanFee(plan),
      spend: AD_SPEND[plan.name] || 'Discuss with a strategist',
      popular: plan.isPopular,
    })),
    ...(!plans.some((plan) => plan.name === ENTERPRISE_CARD.name)
      ? [{ plan: ENTERPRISE_CARD.name, fee: 'Custom quote', spend: AD_SPEND[ENTERPRISE_CARD.name] }]
      : []),
    ...(diagnosticPlan
      ? [{ plan: diagnosticPlan.name || 'Paid Growth Diagnostic', fee: formatPlanFee(diagnosticPlan), spend: 'Not applicable' }]
      : []),
  ];

  const handleAddToCart = (service, plan) => {
    if (plan.billingCycle === 'custom') {
      setEnquiryOpen(true);
      return;
    }
    dispatch(addItem({ service, plan, quantity: 1 }));
    toast.success(`${plan.name} added to cart`);
  };

  return (
    <>
      <Seo
        title="Google Ads & Paid Growth Pricing"
        description="Don't buy clicks. Buy better customer opportunities. MetlifeDM's Paid Growth System — Ads Foundation, Ads Growth, and Ads Partnership plans, plus a one-time Paid Growth Diagnostic to find out where the money is leaking."
        keywords="Google Ads pricing, PPC management pricing, Google Ads management cost, paid search agency, Google Ads agency pricing, PPC agency packages, paid media management, Google Ads management services"
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
          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80&auto=format&fit=crop"
          alt="A paid-growth campaign taking shape"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Google Ads / Paid Growth</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Don&apos;t buy clicks.
            <br />
            <span className="text-italic-fraunces text-ultra-soft">Buy better customer opportunities.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Google can put your business in front of thousands of people. But traffic isn&apos;t the goal — the
            goal is the right person clicking, taking action, and becoming a customer. We don&apos;t simply manage
            campaigns. We look at the complete paid-growth journey.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-12 flex flex-wrap items-center gap-y-6"
          >
            {HERO_CHAIN.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2 w-20 px-1">
                  <div className="w-10 h-10 grid place-items-center rounded-full bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={15} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.6rem] uppercase tracking-widest text-center text-ivory/70">{stage.label}</span>
                </div>
                {i < HERO_CHAIN.length - 1 && (
                  <ChevronRight size={14} strokeWidth={1.5} className="text-ivory/20 shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </motion.div>

          <Button href="#pricing" size="lg" variant="inverse" className="mt-12">
            See Ads Plans <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE PROBLEM WITH TRADITIONAL GOOGLE ADS                       */}
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
            <Eyebrow className="justify-center">The problem with traditional Google Ads</Eyebrow>
            <h2 className="text-display-lg mt-4">
              &ldquo;How much business <span className="text-italic-fraunces text-ultra">did this generate?&rdquo;</span>
            </h2>
            <p className="text-slate text-lg mt-6 leading-relaxed">
              Most agencies talk about clicks, impressions, CTR and CPC. But you can have cheap clicks and expensive
              customers, high CTR and zero meaningful leads, or lots of leads and terrible-quality enquiries.
              That&apos;s why MetlifeDM looks beyond the campaign — the ad is only one part of the system.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 flex flex-wrap items-center justify-center gap-y-6"
          >
            {PROBLEM_CHAIN.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-3 w-24 px-1">
                  <div className="w-11 h-11 grid place-items-center bg-ink text-ivory">
                    <stage.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-widest text-center font-medium">{stage.label}</span>
                </div>
                {i < PROBLEM_CHAIN.length - 1 && (
                  <ChevronRight size={16} strokeWidth={1.5} className="text-slate shrink-0" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* METLIFEDM PAID GROWTH SYSTEM                                  */}
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
            <Eyebrow light className="justify-center">The MetlifeDM Paid Growth System</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Six stages. <span className="text-italic-fraunces text-ultra-soft">One system.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PAID_GROWTH_SYSTEM.map((stage, i) => (
              <motion.div
                key={stage.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="border border-ivory/15 bg-ivory/5 p-7"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-ivory/10 text-ultra-soft">
                    <stage.icon size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="num-plate text-ivory/40 text-[0.65rem]">{stage.num}</div>
                    <h3 className="text-ivory text-base font-medium">{stage.title}</h3>
                  </div>
                </div>
                <p className="text-ivory/60 text-sm leading-relaxed">{stage.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* GOOGLE ADS PLANS                                              */}
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
            <Eyebrow className="justify-center">Google Ads plans</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Four levels of <span className="text-italic-fraunces text-ultra">paid-growth execution.</span>
            </h2>
            <Button variant="outline" size="md" onClick={() => setEnquiryOpen(true)} className="mt-6">
              Not sure which plan? Enquire About Pricing
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size={28} className="text-ultra" />
            </div>
          ) : isError ? (
            <QueryError title="Current Google Ads plans are temporarily unavailable." onRetry={refetch} />
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
                  <AdsPlanCard
                    name={plan.name}
                    price={plan.price}
                    billingCycle={plan.billingCycle}
                    tagline={plan.tagline}
                    features={(plan.features || []).map((f) => f.label)}
                    isPopular={plan.isPopular}
                    ctaLabel={plan.ctaLabel}
                    onAction={() => handleAddToCart(adsService, plan)}
                  />
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: plans.length * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <AdsPlanCard
                  name={ENTERPRISE_CARD.name}
                  price={null}
                  priceLabel="Custom quote"
                  tagline={ENTERPRISE_CARD.tagline}
                  features={ENTERPRISE_CARD.features}
                  isPopular={false}
                  ctaLabel={ENTERPRISE_CARD.ctaLabel}
                  onAction={() => (window.location.href = '/consultation')}
                />
              </motion.div>
            </div>
          )}
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* YOUR AD SPEND IS NOT OUR REVENUE                              */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center border border-ivory/15 bg-ivory/5 p-10 md:p-16"
          >
            <div className="w-12 h-12 mx-auto grid place-items-center bg-ivory/10 text-ultra-soft">
              <DollarSign size={22} strokeWidth={1.5} />
            </div>
            <h2 className="text-display-lg mt-6 text-ivory">
              Your ad spend <span className="text-italic-fraunces text-ultra-soft">is not our revenue.</span>
            </h2>
            <p className="text-ivory/70 text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              Your Google Ads budget is paid directly to Google. Your MetlifeDM fee pays for strategy, management,
              optimization and growth expertise.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* COMPARE PLANS                                                 */}
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
            <Eyebrow className="justify-center">Compare plans</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Different budgets. <span className="text-italic-fraunces text-ultra">Different levels of ambition.</span>
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
                        <div className="text-slate text-xs mt-1">{formatPlanFee(plan)}</div>
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
                      ['Control', 'FOUNDATION'],
                      ['Qualified Leads', 'GROWTH'],
                      ['Scalable Acquisition', 'PARTNERSHIP'],
                    ].map(([line, label], i) => (
                      <td key={label} className={cn('text-center py-5 px-4 border-t border-ink', plans[i]?.isPopular && 'bg-sand')}>
                        <div className="text-mono text-[0.6rem] uppercase tracking-widest text-slate mb-1.5">{label}</div>
                        <p className="text-ink text-xs italic leading-snug">Primary outcome: {line}</p>
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
      {/* DON'T CONFUSE ACTIVITY WITH PERFORMANCE                       */}
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
            <Eyebrow light className="justify-center">Activity vs performance</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              10,000 impressions that produced nothing <span className="text-italic-fraunces text-ultra-soft">is not a win.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 flex flex-wrap items-start justify-center gap-y-10"
          >
            {PERFORMANCE_CHAIN.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-4 w-28 md:w-32 px-2">
                  <div className="w-14 h-14 rounded-full grid place-items-center bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={18} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.65rem] md:text-xs uppercase tracking-widest text-center font-medium text-ivory">
                    {stage.label}
                  </span>
                </div>
                {i < PERFORMANCE_CHAIN.length - 1 && (
                  <ChevronRight size={18} strokeWidth={1.5} className="text-ivory/25 shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* WHAT WE DON'T PROMISE                                         */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-14"
          >
            <Eyebrow className="justify-center">What we don&apos;t promise</Eyebrow>
            <h2 className="text-display-lg mt-4">
              We build the system, measure what happens, <span className="text-italic-fraunces text-ultra">and improve it.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl mx-auto grid gap-3"
          >
            {DONT_PROMISE.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <X size={15} strokeWidth={2} className="shrink-0 text-danger" />
                <span className="text-ink text-sm">{p}</span>
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* GOOGLE ADS + SYSTOLAB                                         */}
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
            <Eyebrow light className="justify-center">Google Ads + SYSTOLAB</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              The ad brought them to the door.
              <br />
              <span className="text-italic-fraunces text-ultra-soft">What happens after they arrive?</span>
            </h2>
            <p className="text-ivory/65 text-sm mt-6 max-w-lg mx-auto leading-relaxed">
              Sometimes your Google Ads campaign isn&apos;t the real problem — your website is. And sometimes the
              website isn&apos;t the problem — your offer is. That&apos;s why the diagnosis comes first.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 flex flex-wrap items-center justify-center gap-y-6"
          >
            {SYSTOLAB_ADS_CHAIN.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-3 w-24 px-1">
                  <div className="w-11 h-11 grid place-items-center rounded-full bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-widest text-center font-medium text-ivory">{stage.label}</span>
                </div>
                {i < SYSTOLAB_ADS_CHAIN.length - 1 && (
                  <ChevronRight size={16} strokeWidth={1.5} className="text-ivory/25 shrink-0" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE METLIFEDM PAID GROWTH DIAGNOSTIC                          */}
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
              <Eyebrow>The MetlifeDM Paid Growth Diagnostic</Eyebrow>
              <h2 className="text-display-lg mt-4">
                Before you spend more, <span className="text-italic-fraunces text-ultra">find out where the money is leaking.</span>
              </h2>
              <p className="text-slate text-lg mt-6 leading-relaxed">
                A one-time, in-depth look across nine areas of your paid-growth funnel — ending in a Prioritized
                Paid-Growth Action Plan.
              </p>

              <div className="mt-10 flex items-baseline gap-2">
                <span className="text-display-md num-plate">
                  {diagnosticPlan ? formatMoney(diagnosticPlan.price, diagnosticPlan.currency || 'USD') : 'Current price unavailable'}
                </span>
                <span className="text-mono text-xs uppercase text-slate">one-time</span>
              </div>
              <p className="text-slate text-sm mt-3 max-w-md leading-relaxed">
                Any follow-on service credit will be stated explicitly in your written proposal; it is not assumed at checkout.
              </p>

              <Button
                onClick={() => diagnosticService && diagnosticPlan && handleAddToCart(diagnosticService, diagnosticPlan)}
                size="lg"
                className="mt-8"
                disabled={!diagnosticPlan}
              >
                <ShoppingBag size={14} strokeWidth={1.5} />
                Get My Diagnosis
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
      {/* THE METLIFEDM DIFFERENCE                                      */}
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
            <Eyebrow light className="justify-center">The MetlifeDM difference</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              We&apos;re asking a <span className="text-italic-fraunces text-ultra-soft">different question.</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {THE_DIFFERENCE.map((d, i) => (
              <motion.div
                key={d.them}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-4 sm:grid-cols-2 border border-ivory/10"
              >
                <div className="p-6 border-b sm:border-b-0 sm:border-r border-ivory/10">
                  <div className="text-mono text-[0.65rem] uppercase tracking-widest text-ivory/40 mb-2">Traditional agency</div>
                  <p className="text-ivory/60 text-base italic leading-snug">&ldquo;{d.them}&rdquo;</p>
                </div>
                <div className="p-6 bg-ivory/5">
                  <div className="text-mono text-[0.65rem] uppercase tracking-widest text-ultra-soft mb-2">MetlifeDM</div>
                  <p className="text-ivory text-base italic leading-snug">&ldquo;{d.us}&rdquo;</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* FINAL PRICING RECAP                                           */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-12"
          >
            <Eyebrow className="justify-center">Final pricing</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Every plan, <span className="text-italic-fraunces text-ultra">at a glance.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto overflow-x-auto"
          >
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 text-mono text-xs uppercase tracking-widest text-slate font-normal border-b border-hairline">Plan</th>
                  <th className="text-left py-3 px-4 text-mono text-xs uppercase tracking-widest text-slate font-normal border-b border-hairline">Management fee</th>
                  <th className="text-left py-3 text-mono text-xs uppercase tracking-widest text-slate font-normal border-b border-hairline">Suggested media budget</th>
                </tr>
              </thead>
              <tbody>
                {finalPricing.map((row) => (
                  <tr key={row.plan} className="border-b border-hairline">
                    <td className="py-3.5 text-ink text-sm flex items-center gap-1.5">
                      {row.plan}
                      {row.popular && <Star size={10} strokeWidth={0} className="fill-current text-ultra" />}
                    </td>
                    <td className="py-3.5 px-4 text-ink text-sm">{row.fee}</td>
                    <td className="py-3.5 text-slate text-sm">{row.spend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          <p className="text-slate text-xs text-center mt-6">Suggested media budgets are paid directly to Google and are separate from MetlifeDM service fees.</p>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
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
            <h2 className="text-display-lg text-ivory">
              Before you spend more on ads...
              <br />
              <span className="text-italic-fraunces text-ultra-soft">find out where your money is going.</span>
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => diagnosticService && diagnosticPlan && handleAddToCart(diagnosticService, diagnosticPlan)}
                size="lg"
                variant="inverse"
                disabled={!diagnosticPlan}
              >
                Get My Paid-Growth Diagnosis <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <Button href="#pricing" variant="ghost" size="lg" className="border-ivory/30 text-ivory hover:bg-ivory hover:text-ink">
                Explore Ads Plans
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>

      <PricingEnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} service="Google Ads & Paid Growth" />
    </>
  );
}
