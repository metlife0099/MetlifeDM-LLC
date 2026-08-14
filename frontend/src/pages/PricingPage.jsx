import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Check, ShoppingBag, Star, ArrowUpRight, ShieldCheck, Sparkles, Ban, ChevronDown,
  Headphones, Puzzle,
  MessageCircle, Send, CalendarCheck, MessageSquareText, Mail, Repeat, Database, Settings2,
  Globe, RefreshCw, LayoutTemplate, Search, MapPin, Palette, Target, Megaphone, Gauge, Wand2,
  Eye, MousePointerClick, Route,
  Users, Cpu,
  Heart, Info, Award,
  TrendingUp, ChevronRight,
} from 'lucide-react';
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

/* Customer Service, Projects, and the Diagnostic are all important — and
 * different — enough to get their own full sections below (07 / 08 / 09).
 * Add-ons is the one entry point still compact. */
const ADDONS_SOLUTION = {
  icon: Puzzle,
  name: 'Add-ons',
  price: 'Custom',
  tagline: 'Add exactly what your business needs.',
  tags: ['SEO', 'Ads', 'Content', 'Automation', 'CRM', 'SYSTOLAB', 'Development'],
  ctaLabel: 'Explore Add-ons',
  href: '/services',
};

/* ---- 09 · The MetlifeDM Diagnostic (full section) ---- */
const DIAGNOSTIC_STAGES = [
  { icon: Eye, label: 'Visibility' },
  { icon: Target, label: 'Positioning' },
  { icon: ShieldCheck, label: 'Trust' },
  { icon: Globe, label: 'Website' },
  { icon: MousePointerClick, label: 'Conversion' },
  { icon: Route, label: 'Customer Journey' },
  { icon: Repeat, label: 'Retention' },
];

/* ---- 07 · Customer Service (full section, not just a card) ---- */
const CUSTOMER_SERVICE_ITEMS = [
  { icon: MessageCircle, label: 'WhatsApp Management' },
  { icon: Send, label: 'Lead Follow-Up' },
  { icon: CalendarCheck, label: 'Appointment & Booking Support' },
  { icon: MessageSquareText, label: 'Customer Feedback' },
  { icon: Star, label: 'Review Management' },
  { icon: Mail, label: 'After-Sales Communication' },
  { icon: Repeat, label: 'Customer Retention' },
  { icon: Database, label: 'CRM & Lead Organization' },
  { icon: Headphones, label: 'Dedicated Customer Support' },
  { icon: Settings2, label: 'Custom Operations' },
];

/* ---- 08 · Projects (full section, not just a card) ---- */
const PROJECT_CATEGORIES = [
  { icon: Globe, label: 'Website Development' },
  { icon: RefreshCw, label: 'Website Redesign' },
  { icon: LayoutTemplate, label: 'Landing Pages' },
  { icon: Search, label: 'SEO Setup' },
  { icon: MapPin, label: 'Google Business Setup' },
  { icon: Palette, label: 'Brand Strategy' },
  { icon: Target, label: 'Marketing Strategy' },
  { icon: Megaphone, label: 'Campaign Development' },
  { icon: Gauge, label: 'SYSTOLAB Implementation' },
  { icon: Wand2, label: 'Custom Digital Solutions' },
];

/* ---- 10 · White Label Partnership (full section) ---- */
const WHITE_LABEL_PILLARS = [
  { icon: Palette, name: 'Your Brand', desc: 'Your identity, domain and customer-facing experience.' },
  { icon: Users, name: 'Your Clients', desc: 'You own the customer relationship.' },
  { icon: Cpu, name: 'Our Engine', desc: 'MetlifeDM provides the infrastructure, technology and expertise.' },
  { icon: Headphones, name: 'Our Support', desc: 'We operate behind the scenes.' },
];

/* ---- 11 · White Label Plans ---- */
const WHITE_LABEL_PLANS = [
  {
    name: 'White Label Start',
    price: 499,
    tagline: 'For partners testing the ecosystem.',
    ctaLabel: 'Become a Partner',
  },
  {
    name: 'White Label Grow',
    price: 999,
    tagline: 'For businesses building recurring services around MetlifeDM technology.',
    ctaLabel: 'Become a Partner',
  },
  {
    name: 'White Label Enterprise',
    price: null,
    tagline: 'For organizations requiring deep integration and infrastructure.',
    tags: ['Custom domain', 'API', 'Integrations', 'Workflows', 'Large volumes', 'Infrastructure', 'Development', 'Account Management', 'SLA'],
    ctaLabel: 'Talk to Sales',
  },
];

/* ---- 13 · The MetlifeDM Client Promise ---- */
const CLIENT_PROMISE_BENEFITS = [
  'Strategic guidance',
  'Digital-growth advice',
  'Recommendations',
  'Direction when they need it',
  'Priority reactivation',
  'Future project opportunities',
  'Retained business knowledge',
  'Early access to selected opportunities',
];

const EXECUTION_EXCLUSIONS = [
  'Hands-on execution', 'Advertising management', 'SEO implementation', 'Content production',
  'Website work', 'Development', 'Customer-service operations', 'Hosting', 'Substantial consulting',
];

/* ---- 14 · MetlifeDM Client For Life (visually separate from 13) ---- */
const CLIENT_FOR_LIFE_BENEFITS = [
  'Lifetime strategic guidance',
  'Priority reactivation',
  'Preferential future-project consideration',
  'Early access to selected services',
  'Existing business knowledge retained',
  'No starting from zero when you return',
];

/* ---- 15 · Why MetlifeDM? ---- */
const WHY_METLIFEDM_STEPS = ['Where you are.', 'Where you want to go.', "What's stopping you."];

/* ---- 16 · The MetlifeDM Ecosystem ---- */
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

      {/* ============================================================ */}
      {/* 07 — CUSTOMER SERVICE (its own section, not just a card — this */}
      {/* is operational work, kept visually distinct from the marketing */}
      {/* retainers above)                                               */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow light>Customer Service</Eyebrow>
              <h2 className="text-display-lg mt-4 text-ivory">
                Built around <span className="text-italic-fraunces text-ultra-soft">your business.</span>
              </h2>
              <p className="text-ivory/70 text-lg mt-6 leading-relaxed">
                Every touchpoint after the sale — a WhatsApp message, a booking request, a review, a follow-up — is
                a system, not an afterthought. We build and run the exact customer service operation your business
                needs, so no lead goes cold waiting on a reply.
              </p>

              <div className="mt-10 flex items-baseline gap-2">
                <span className="text-display-md num-plate text-ivory">{formatMoney(199)}</span>
                <span className="text-mono text-xs uppercase text-ivory/50">/ month, starting from</span>
              </div>

              <div className="mt-6 pt-6 border-t border-ivory/10">
                <div className="text-mono text-xs uppercase tracking-widest text-ivory/50 mb-3">Why pricing varies</div>
                <p className="text-ivory/60 text-sm leading-relaxed max-w-md">
                  Customer Service is priced individually because it&apos;s operational work, not a marketing
                  retainer — the cost depends on your message volume, the channels you use, and how complex your
                  booking or support flow is. We quote it around how your business actually runs, not a fixed
                  template.
                </p>
              </div>

              <Button to="/consultation" size="lg" variant="inverse" className="mt-10">
                Build Customer Service <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-px bg-ivory/10 border border-ivory/10 sm:grid-cols-2"
            >
              {CUSTOMER_SERVICE_ITEMS.map((item) => (
                <div key={item.label} className="bg-ink p-6 flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 grid place-items-center bg-ivory/5 text-ultra-soft">
                    <item.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-ivory/85 text-sm">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 08 — PROJECTS (the escape valve so a fixed tier never becomes */}
      {/* a ceiling on what a client can build with us)                 */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow>Projects</Eyebrow>
              <h2 className="text-display-lg mt-4">
                Build it once. <span className="text-italic-fraunces text-ultra">Build it right.</span>
              </h2>
              <p className="text-slate text-lg mt-6 leading-relaxed">
                Not everything fits into a monthly package. Some businesses need one project, done properly, and
                nothing else — a new site, a rebrand, a single campaign. Projects are scoped and quoted
                individually, so Foundation, Growth, and Growth Partnership never become a ceiling on what you can
                build with us.
              </p>
              <Button to="/consultation" size="lg" className="mt-10">
                Custom Quote <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2"
            >
              {PROJECT_CATEGORIES.map((item) => (
                <div key={item.label} className="bg-ivory p-6 flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 grid place-items-center bg-ink text-ivory">
                    <item.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-ink text-sm">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 09 — THE METLIFEDM DIAGNOSTIC                                  */}
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
            <Eyebrow light className="justify-center">The MetlifeDM Diagnostic</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Before we recommend anything,<br />
              <span className="text-italic-fraunces text-ultra-soft">we find what&apos;s actually wrong.</span>
            </h2>
          </motion.div>

          {/* Vertical funnel — each stage narrows in on the real bottleneck */}
          <div className="mt-16 max-w-md mx-auto">
            {DIAGNOSTIC_STAGES.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="flex items-center gap-5 py-4">
                  <div className="w-11 h-11 shrink-0 grid place-items-center rounded-full bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={18} strokeWidth={1.5} />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="num-plate text-ivory/30 text-xs">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-ivory text-lg">{stage.label}</span>
                  </div>
                </div>
                {i < DIAGNOSTIC_STAGES.length - 1 && (
                  <div className="pl-[1.375rem]">
                    <div className="w-px h-6 bg-ivory/15" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl mx-auto text-center mt-16 pt-12 border-t border-ivory/10"
          >
            <p className="text-xl text-italic-fraunces text-ivory leading-snug">
              We don&apos;t recommend services simply because they&apos;re available. We identify the bottleneck first.
            </p>
            <Button to="/diagnostic" size="lg" variant="inverse" className="mt-10">
              Start a Diagnostic Conversation <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* Add-ons — the one remaining compact entry point */}
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
      {/* 10 — WHITE LABEL PARTNERSHIP                                   */}
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
            <Eyebrow light className="justify-center">White Label Partnership</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Your brand. <span className="text-italic-fraunces text-ultra-soft">Our engine.</span>
            </h2>
            <p className="text-ivory/70 text-lg mt-6 leading-relaxed">
              Offer MetlifeDM-powered technology and services under your own brand.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-px bg-ivory/10 border border-ivory/10 sm:grid-cols-2 lg:grid-cols-4">
            {WHITE_LABEL_PILLARS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="bg-ink p-8"
              >
                <div className="w-11 h-11 grid place-items-center bg-ivory/5 text-ultra-soft">
                  <p.icon size={18} strokeWidth={1.5} />
                </div>
                <div className="text-mono text-xs uppercase tracking-widest text-ivory/50 mt-6">{p.name}</div>
                <p className="text-ivory/85 text-sm mt-3 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mt-16 pt-12 border-t border-ivory/10"
          >
            <p className="text-xl md:text-2xl text-italic-fraunces text-ivory leading-snug">
              You build the relationship. We build what&apos;s behind it.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 11 — WHITE LABEL PLANS                                        */}
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
            <Eyebrow className="justify-center">White Label Plans</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Built to grow <span className="text-italic-fraunces text-ultra">with your ecosystem.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {WHITE_LABEL_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col border border-hairline hover:border-ink hover-lift transition-colors duration-500 p-8"
              >
                <div className="text-mono text-xs uppercase tracking-widest text-slate">{plan.name}</div>
                <div className="mt-4 flex items-baseline gap-2">
                  {plan.price ? (
                    <>
                      <span className="text-display-md num-plate">{formatMoney(plan.price)}</span>
                      <span className="text-mono text-xs uppercase text-slate">/ month, from</span>
                    </>
                  ) : (
                    <span className="text-display-md num-plate">Custom</span>
                  )}
                </div>
                <p className="text-slate text-sm mt-4 leading-relaxed">{plan.tagline}</p>

                {plan.tags && (
                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {plan.tags.map((t) => (
                      <span key={t} className="px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-slate border border-hairline">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <Button to="/partners" variant="underline" className="mt-8 w-fit">
                  {plan.ctaLabel} <ArrowUpRight size={13} strokeWidth={1.5} />
                </Button>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 13 — THE METLIFEDM CLIENT PROMISE                              */}
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
            <div className="inline-flex items-center gap-2 mx-auto mb-2 text-ultra-soft">
              <Heart size={16} strokeWidth={1.5} fill="currentColor" />
              <span className="text-mono text-xs uppercase tracking-widest">Client for life</span>
            </div>
            <h2 className="text-display-lg mt-2 text-ivory">
              Your subscription can end.<br />
              <span className="text-italic-fraunces text-ultra-soft">Our relationship doesn&apos;t have to.</span>
            </h2>
            <p className="text-ivory/70 text-lg mt-6 leading-relaxed">
              When an engagement ends, we don&apos;t disappear. Every client who&apos;s worked with MetlifeDM keeps a
              standing line to us — because the relationship was never just the invoice.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 max-w-2xl mx-auto grid gap-x-8 gap-y-4 sm:grid-cols-2"
          >
            {CLIENT_PROMISE_BENEFITS.map((b) => (
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
      {/* 14 — METLIFEDM CLIENT FOR LIFE (visually distinct from 13 —    */}
      {/* framed as membership, not a discount)                         */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto border border-ink p-10 md:p-14 text-center"
          >
            <div className="w-14 h-14 mx-auto grid place-items-center bg-ink text-ivory">
              <Award size={22} strokeWidth={1.5} />
            </div>
            <div className="text-mono text-xs uppercase tracking-widest text-slate mt-6">Membership status</div>
            <h2 className="text-display-lg mt-3">
              Client <span className="text-italic-fraunces text-ultra">for life.</span>
            </h2>
            <p className="text-slate text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              Complete 6 continuous months with MetlifeDM and you&apos;re in — a relationship that lasts beyond the
              engagement, not just a discount for coming back.
            </p>

            <div className="mt-10 pt-10 border-t border-hairline grid gap-x-8 gap-y-4 sm:grid-cols-2 text-left max-w-xl mx-auto">
              {CLIENT_FOR_LIFE_BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <Check size={15} strokeWidth={2} className="shrink-0 text-ultra" />
                  <span className="text-ink text-sm">{b}</span>
                </div>
              ))}
            </div>

            <p className="text-slate text-xs uppercase tracking-widest mt-10">
              Ask your strategist about Client For Life status
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 15 — WHY METLIFEDM?                                           */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="md" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">Why MetlifeDM?</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              We don&apos;t want to be <span className="text-italic-fraunces text-ultra-soft">another vendor.</span>
            </h2>
            <div className="mt-10 text-ivory/50 text-xs uppercase tracking-widest">We want to understand:</div>
            <div className="mt-4 space-y-1">
              {WHY_METLIFEDM_STEPS.map((s) => (
                <p key={s} className="text-2xl md:text-3xl text-italic-fraunces text-ivory/90 leading-snug">
                  {s}
                </p>
              ))}
            </div>
            <p className="text-ivory text-lg mt-10 pt-8 border-t border-ivory/10 max-w-lg mx-auto leading-relaxed">
              We build around the problem — not around a fixed service list.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 16 — THE METLIFEDM ECOSYSTEM                                  */}
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
      {/* 17 — METLIFEDM PARTNER CIRCLE (deliberately minimal —          */}
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

      {/* ============================================================ */}
      {/* 18 — NOT SURE WHERE TO START? (final major conversion section) */}
      {/* ============================================================ */}
      <CtaBanner
        eyebrow="Not sure where to start?"
        title="You don't have to know what you need. That's our job."
        subtitle="Tell us where your business is today, where you want to go, and what's not working. We'll help identify the bottleneck and recommend the right path — even if the answer isn't one of our standard packages."
        primary={{ label: 'Find My Growth Path', href: '/consultation' }}
        secondary={{ label: 'Book a Diagnostic Conversation', href: '/consultation' }}
      />

      {/* ============================================================ */}
      {/* 19 — FINAL CTA (kept extremely minimal, on purpose)            */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="md" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl mx-auto text-center"
          >
            <h2 className="text-display-lg text-ivory">Ready to find the bottleneck?</h2>
            <p className="text-ivory/60 text-lg mt-4">Let&apos;s start with the business — not the service.</p>
            <Button to="/consultation" size="lg" variant="inverse" className="mt-10">
              Start a Conversation <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
