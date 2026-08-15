import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Check, ChevronDown, ChevronRight, Star, ShoppingBag, X,
  Eye, BookOpen, ShieldCheck, MessageCircle, MessageSquareText, Repeat,
  Crosshair, Megaphone, MousePointerClick, BarChart3, RefreshCw,
  Heart, Award, Sparkles, Users, LayoutTemplate, Globe, Activity, TrendingUp,
  User, FileText, Wand2, Search, Route,
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

const SOCIAL_SLUG = 'social-media-marketing-advertising';
const DIAGNOSTIC_SLUG = 'metlifedm-social-growth-diagnostic';

/* ---- Hero — the journey social should actually drive ---- */
const HERO_CHAIN = [
  { icon: Eye, label: 'Discover' },
  { icon: BookOpen, label: 'Understand' },
  { icon: ShieldCheck, label: 'Trust' },
  { icon: MessageCircle, label: 'Engage' },
  { icon: MessageSquareText, label: 'Enquire' },
  { icon: ShoppingBag, label: 'Buy' },
  { icon: Repeat, label: 'Return' },
];

/* ---- MetlifeDM Social Growth System ---- */
const SOCIAL_GROWTH_SYSTEM = [
  { num: '01', icon: Crosshair, title: 'Position', desc: 'Who are you? Who should care? Why should they choose you?' },
  { num: '02', icon: Megaphone, title: 'Attract', desc: 'Create content designed to reach the right audience — reels, short-form video, educational content, thought leadership, and creative campaigns.' },
  { num: '03', icon: MessageCircle, title: 'Connect', desc: 'Turn attention into relationships — community, comments, DMs, stories, engagement, conversation.' },
  { num: '04', icon: ShieldCheck, title: 'Build Trust', desc: 'Show people why they should believe you — proof, reviews, testimonials, behind-the-scenes, expertise, customer stories.' },
  { num: '05', icon: MousePointerClick, title: 'Convert', desc: 'Give attention somewhere to go — WhatsApp, website, landing pages, lead forms, bookings, enquiries.' },
  { num: '06', icon: BarChart3, title: 'Learn', desc: 'Measure what people actually respond to — reach, engagement, profile visits, clicks, leads, conversions.' },
  { num: '07', icon: RefreshCw, title: 'Compound', desc: 'Test → Learn → Improve → Repeat. Create more of what works.' },
];

/* ---- Page-level narrative content, keyed by plan name ---- */
const BEST_FOR = {
  'Social Foundation': 'Businesses starting from scratch or businesses whose social presence lacks consistency and direction.',
  'Social Growth': 'Businesses that already have a social presence but want stronger reach, engagement and enquiries.',
  'Social Partnership': 'Established brands that want social media to become a serious customer-acquisition and brand-building channel.',
  'Social Enterprise': 'Brands requiring a larger social infrastructure — multiple brands, countries, or platforms.',
};

const FOCUS = {
  'Social Foundation': ['Presence', 'Consistency', 'Credibility'],
  'Social Growth': ['Attention', 'Engagement', 'Trust', 'Enquiries'],
  'Social Partnership': ['Brand', 'Community', 'Demand', 'Conversion', 'Loyalty'],
};

const ENTERPRISE_CARD = {
  name: 'Social Enterprise',
  tagline: 'Custom strategy. Custom creative. Custom infrastructure.',
  startingFrom: 2500,
  ctaLabel: 'Talk to Sales',
  features: [
    'Multiple brands', 'Multiple countries', 'Multiple platforms', 'High-volume content',
    'Large creator campaigns', 'Influencer programs', 'UGC networks', 'Dedicated creative teams',
    'Video production', 'Social commerce', 'Advanced analytics', 'Custom reporting',
    'Large-scale community management', 'Custom workflows',
  ],
};

/* ---- Don't sell "posts" — what each piece of content is actually for ---- */
const CONTENT_PURPOSE = [
  { type: 'A post', might: 'Reach someone new.' },
  { type: 'A Reel', might: 'Educate them.' },
  { type: 'A customer story', might: 'Build trust.' },
  { type: 'A comment', might: 'Start a conversation.' },
  { type: 'A DM', might: 'Create an opportunity.' },
  { type: 'A landing page', might: 'Convert it.' },
];

/* ---- The MetlifeDM Content Engine — six content jobs ---- */
const CONTENT_ENGINE = [
  { icon: Eye, title: 'Discover', desc: "Reach people who don't know you." },
  { icon: BookOpen, title: 'Educate', desc: 'Give them a reason to pay attention.' },
  { icon: Heart, title: 'Relate', desc: 'Show the human side of the brand.' },
  { icon: Award, title: 'Prove', desc: 'Demonstrate credibility.' },
  { icon: MousePointerClick, title: 'Convert', desc: 'Give people a clear next step.' },
  { icon: Repeat, title: 'Retain', desc: 'Keep existing customers connected.' },
];

/* ---- Social + Google Ads ---- */
const SOCIAL_ADS_CHAIN = [
  { icon: Sparkles, label: 'Strong Content' },
  { icon: Users, label: 'Strong Audience Response' },
  { icon: Megaphone, label: 'Paid Amplification' },
  { icon: LayoutTemplate, label: 'Landing Page' },
  { icon: MousePointerClick, label: 'Conversion' },
];

/* ---- Social + SYSTOLAB ---- */
const SOCIAL_SYSTOLAB_CHAIN = [
  { icon: Users, label: 'Social' },
  { icon: Globe, label: 'Website' },
  { icon: Activity, label: 'SYSTOLAB Diagnosis' },
  { icon: MousePointerClick, label: 'Conversion Optimization' },
  { icon: TrendingUp, label: 'Growth' },
];

/* ---- The MetlifeDM Social Growth Diagnostic — what it analyzes ---- */
const DIAGNOSTIC_AREAS = [
  { icon: Crosshair, label: 'Positioning' },
  { icon: User, label: 'Profile' },
  { icon: Users, label: 'Audience' },
  { icon: FileText, label: 'Content' },
  { icon: Wand2, label: 'Creative' },
  { icon: MessageCircle, label: 'Engagement' },
  { icon: Search, label: 'Competitors' },
  { icon: Route, label: 'Conversion Pathway' },
  { icon: Star, label: 'Social Proof' },
  { icon: Globe, label: 'Website/WhatsApp Journey' },
];

/* ---- What we don't promise ---- */
const DONT_PROMISE = [
  'Viral posts on demand', 'Fake followers', 'Vanity engagement', 'Guaranteed follower numbers',
  'Posting just to “stay active”', 'Random trends that damage brand positioning',
];

/* ---- Final pricing recap ---- */
const FINAL_PRICING = [
  { plan: 'Social Foundation', fee: '$349/mo' },
  { plan: 'Social Growth', fee: '$599/mo', popular: true },
  { plan: 'Social Partnership', fee: '$1,199/mo' },
  { plan: 'Social Enterprise', fee: 'Custom — from $2,500/mo' },
  { plan: 'Social Growth Diagnostic', fee: '$149 one-time' },
];

/**
 * One Social Growth plan card — collapsed feature list (teaser + expand),
 * plus the "Best for" and "Focus" context this page's plans need.
 */
function SocialPlanCard({ name, price, priceLabel, tagline, features, isPopular, ctaLabel, onAction }) {
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

export default function SocialGrowthPage() {
  const dispatch = useDispatch();
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const { data: socialData, isLoading } = useQuery({
    queryKey: ['services', 'social-pricing', SOCIAL_SLUG],
    queryFn: () => contentApi.getServiceBySlug(SOCIAL_SLUG),
  });
  const socialService = socialData?.service;
  const plans = socialService?.pricingPlans || [];
  const comparisonTable = socialService?.comparisonTable || [];

  const { data: diagData } = useQuery({
    queryKey: ['services', 'social-diagnostic', DIAGNOSTIC_SLUG],
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
        title="Social Growth Pricing"
        description="Don't just post. Build an audience that moves. Social Foundation, Social Growth, and Social Partnership plans, plus a one-time Social Growth Diagnostic to find out what your presence is missing."
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
          src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1920&q=80&auto=format&fit=crop"
          alt="A social audience actively engaging with a brand"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Social Growth</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Don&apos;t just post.
            <br />
            <span className="text-italic-fraunces text-ultra-soft">Build an audience that moves.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Your social media shouldn&apos;t exist to fill a content calendar. It should help people discover,
            understand, trust, engage, enquire, buy, and return. We build social systems around the business — not
            just around Instagram.
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
            See Social Growth Plans <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE PROBLEM WITH SOCIAL MEDIA                                 */}
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
            <Eyebrow className="justify-center">The problem with social media</Eyebrow>
            <h2 className="text-display-lg mt-4">
              &ldquo;What should your social presence <span className="text-italic-fraunces text-ultra">actually do?&rdquo;</span>
            </h2>
            <p className="text-slate text-lg mt-6 leading-relaxed">
              Most businesses ask how many posts they&apos;ll get every month. We ask what your social presence
              should actually do for your business. 10,000 views don&apos;t necessarily mean 10 customers. 10,000
              followers don&apos;t necessarily mean demand. And posting every day doesn&apos;t automatically create
              growth. Content is an asset. Not an activity.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* METLIFEDM SOCIAL GROWTH SYSTEM                                */}
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
            <Eyebrow light className="justify-center">The MetlifeDM Social Growth System</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Seven stages. <span className="text-italic-fraunces text-ultra-soft">One system.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SOCIAL_GROWTH_SYSTEM.map((stage, i) => (
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
      {/* SOCIAL GROWTH PLANS                                           */}
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
            <Eyebrow className="justify-center">Social growth plans</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Four levels of <span className="text-italic-fraunces text-ultra">audience-growth execution.</span>
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
                  <SocialPlanCard
                    name={plan.name}
                    price={plan.price}
                    tagline={plan.tagline}
                    features={(plan.features || []).map((f) => f.label)}
                    isPopular={plan.isPopular}
                    ctaLabel={plan.ctaLabel}
                    onAction={() => handleAddToCart(socialService, plan)}
                  />
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: plans.length * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <SocialPlanCard
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
              Different presences. <span className="text-italic-fraunces text-ultra">Different levels of ambition.</span>
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
                      ['Credibility', 'FOUNDATION'],
                      ['Engagement + Leads', 'GROWTH'],
                      ['Demand + Brand + Conversion', 'PARTNERSHIP'],
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
      {/* DON'T SELL "POSTS"                                            */}
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
            <Eyebrow light className="justify-center">Don&apos;t sell &ldquo;posts&rdquo;</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              &ldquo;How many posts do you need?&rdquo; <span className="text-italic-fraunces text-ultra-soft">is the wrong question.</span>
            </h2>
            <p className="text-ivory/65 text-sm mt-6 max-w-lg mx-auto leading-relaxed">
              The better question: what does each piece of content need to accomplish? Content is one part of the
              customer journey.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 max-w-2xl mx-auto grid gap-3 sm:grid-cols-2"
          >
            {CONTENT_PURPOSE.map((c) => (
              <div key={c.type} className="flex items-baseline gap-2 border-b border-ivory/10 pb-3">
                <span className="text-ivory/50 text-sm shrink-0">{c.type} might:</span>
                <span className="text-ivory text-sm italic">{c.might}</span>
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE METLIFEDM CONTENT ENGINE                                  */}
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
            <Eyebrow className="justify-center">The MetlifeDM Content Engine</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Six content jobs, <span className="text-italic-fraunces text-ultra">not random posts.</span>
            </h2>
          </motion.div>

          <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2 lg:grid-cols-3">
            {CONTENT_ENGINE.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="bg-ivory p-7"
              >
                <div className="w-11 h-11 grid place-items-center bg-ink text-ivory">
                  <c.icon size={18} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-medium mt-5">{c.title}</h3>
                <p className="text-slate text-sm mt-2 leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* SOCIAL + GOOGLE ADS                                           */}
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
            <Eyebrow light className="justify-center">Social + Google Ads</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Organic discovers. <span className="text-italic-fraunces text-ultra-soft">Paid amplifies what proves itself.</span>
            </h2>
            <p className="text-ivory/65 text-sm mt-6 max-w-lg mx-auto leading-relaxed">
              Instead of blindly boosting posts, we identify what&apos;s already working and put budget behind it.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 flex flex-wrap items-center justify-center gap-y-6"
          >
            {SOCIAL_ADS_CHAIN.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-3 w-28 px-1">
                  <div className="w-11 h-11 grid place-items-center rounded-full bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-widest text-center font-medium text-ivory">{stage.label}</span>
                </div>
                {i < SOCIAL_ADS_CHAIN.length - 1 && (
                  <ChevronRight size={16} strokeWidth={1.5} className="text-ivory/25 shrink-0" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* SOCIAL + SYSTOLAB                                             */}
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
            <Eyebrow className="justify-center">Social + SYSTOLAB</Eyebrow>
            <h2 className="text-display-lg mt-4">
              The social team shouldn&apos;t operate <span className="text-italic-fraunces text-ultra">in isolation.</span>
            </h2>
            <p className="text-slate text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              If social sends 10,000 people to a website that converts badly, the social campaign isn&apos;t the
              only problem. The entire journey matters.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 max-w-md mx-auto"
          >
            {SOCIAL_SYSTOLAB_CHAIN.map((stage, i) => (
              <div key={stage.label} className="relative">
                <div className="flex items-center gap-5 py-3.5">
                  <div className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-sand text-ink">
                    <stage.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-ink text-base">{stage.label}</span>
                </div>
                {i < SOCIAL_SYSTOLAB_CHAIN.length - 1 && (
                  <div className="pl-5">
                    <div className="w-px h-5 bg-hairline" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE METLIFEDM SOCIAL GROWTH DIAGNOSTIC                        */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow light>The MetlifeDM Social Growth Diagnostic</Eyebrow>
              <h2 className="text-display-lg mt-4 text-ivory">
                Before you create more, <span className="text-italic-fraunces text-ultra-soft">find out what&apos;s missing.</span>
              </h2>
              <p className="text-ivory/70 text-lg mt-6 leading-relaxed">
                A one-time, in-depth look across ten areas of your social presence — ending in a Prioritized Social
                Growth Roadmap.
              </p>

              <div className="mt-10 flex items-baseline gap-2">
                <span className="text-display-md num-plate text-ivory">{diagnosticPlan ? formatMoney(diagnosticPlan.price) : '$149'}</span>
                <span className="text-mono text-xs uppercase text-ivory/50">one-time</span>
              </div>
              <p className="text-ivory/60 text-sm mt-3 max-w-md leading-relaxed">
                Move forward with a Social Growth ($599+) engagement, and your $149 diagnostic fee is credited
                toward your first month.
              </p>

              <Button
                onClick={() => diagnosticService && diagnosticPlan && handleAddToCart(diagnosticService, diagnosticPlan)}
                size="lg"
                variant="inverse"
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
              className="grid gap-px bg-ivory/10 border border-ivory/10 sm:grid-cols-2"
            >
              {DIAGNOSTIC_AREAS.map((a) => (
                <div key={a.label} className="bg-ink p-6 flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 grid place-items-center bg-ivory/5 text-ultra-soft">
                    <a.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-ivory/85 text-sm">{a.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
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
              We build attention <span className="text-italic-fraunces text-ultra">that has somewhere to go.</span>
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
      {/* FINAL PRICING RECAP                                           */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-12"
          >
            <Eyebrow light className="justify-center">Final pricing</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Every plan, <span className="text-italic-fraunces text-ultra-soft">at a glance.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl mx-auto overflow-x-auto"
          >
            <table className="w-full min-w-[360px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 text-mono text-xs uppercase tracking-widest text-ivory/50 font-normal border-b border-ivory/10">Plan</th>
                  <th className="text-left py-3 text-mono text-xs uppercase tracking-widest text-ivory/50 font-normal border-b border-ivory/10">Management</th>
                </tr>
              </thead>
              <tbody>
                {FINAL_PRICING.map((row) => (
                  <tr key={row.plan} className="border-b border-ivory/10">
                    <td className="py-3.5 text-ivory text-sm flex items-center gap-1.5">
                      {row.plan}
                      {row.popular && <Star size={10} strokeWidth={0} className="fill-current text-ultra-soft" />}
                    </td>
                    <td className="py-3.5 text-ivory/70 text-sm">{row.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          <p className="text-ivory/40 text-xs text-center mt-8 max-w-lg mx-auto leading-relaxed">
            Unlimited photography, video production, or studio shoots aren&apos;t included in these plans — those
            are Add-ons, Projects, or a custom production engagement.
          </p>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="border border-ink p-10 md:p-16 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-display-lg">
              Your social media should do more than look active.
              <br />
              <span className="text-italic-fraunces text-ultra">It should move your business forward.</span>
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => diagnosticService && diagnosticPlan && handleAddToCart(diagnosticService, diagnosticPlan)}
                size="lg"
                disabled={!diagnosticPlan}
              >
                Find My Social Growth Bottleneck <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <Button href="#pricing" variant="ghost" size="lg">
                Explore Social Growth Plans
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>

      <PricingEnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} service="Social Growth" />
    </>
  );
}
