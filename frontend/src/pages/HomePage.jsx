import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ChevronRight,
  Stethoscope, SlidersHorizontal, ShieldCheck, Hammer, ServerCog, TrendingUp, Maximize2,
  Activity, LifeBuoy,
  Headphones, LayoutTemplate, Cpu, Puzzle,
} from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';

/* ---- Hero ---- */
const HERO_LINES = [
  { verb: 'Diagnose', rest: 'what is holding you back.' },
  { verb: 'Recover', rest: "what's at risk." },
  { verb: 'Build', rest: 'what you need.' },
  { verb: 'Grow', rest: 'what works.' },
  { verb: 'Protect', rest: "what you've built." },
];

/* ---- The MetlifeDM Method ---- */
const METHOD_STAGES = [
  { icon: Stethoscope, label: 'Diagnose' },
  { icon: SlidersHorizontal, label: 'Control' },
  { icon: ShieldCheck, label: 'Protect' },
  { icon: Hammer, label: 'Build' },
  { icon: ServerCog, label: 'Operate' },
  { icon: TrendingUp, label: 'Grow' },
  { icon: Maximize2, label: 'Scale' },
];

/* ---- SYSTOLAB / PASCO — the two diagnostic engines ----
 * SYSTOLAB answers "what's wrong" (proactive audit); PASCO answers "what
 * happened" (reactive recovery, when a site's been hacked, access lost, or
 * a previous developer/agency has gone dark). */
const DIAGNOSTIC_ENGINES = [
  {
    icon: Activity,
    name: 'SYSTOLAB',
    question: "What's wrong?",
    desc: 'Our diagnostic engine — audits your visibility, positioning, website and customer journey to find the real bottleneck before we recommend anything.',
    href: '/diagnostic',
  },
  {
    icon: LifeBuoy,
    name: 'PASCO',
    question: 'What happened?',
    desc: "Our recovery diagnostic — for when a site's been hacked, access has been lost, or a previous developer or agency has gone dark. We find out what happened, then help you recover it.",
    href: '/pasco',
  },
];

/* ---- Specialized Solutions teaser ---- */
const SPECIALIZED_TEASER = [
  { icon: Headphones, label: 'Customer Service', href: '/customer-service' },
  { icon: LayoutTemplate, label: 'Projects', href: '/projects' },
  { icon: Cpu, label: 'Technology', href: '/growth-solutions' },
  { icon: Puzzle, label: 'White Label', href: '/partners' },
];

/* ---- Why MetlifeDM chain ---- */
const WHY_CHAIN = ['Where you are', 'Where you want to go', "What's stopping you"];

export default function HomePage() {
  return (
    <>
      <Seo
        title="Digital marketing excellence for USA businesses"
        description="MetlifeDM is the infrastructure behind digital business growth — we diagnose what's holding a business back, then build, operate, and protect the exact systems it needs to grow."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': 'https://metlifedm.com/#organization',
          name: 'MetlifeDM LLC',
          logo: 'https://metlifedm.com/icons/icon-512.png',
          image: 'https://metlifedm.com/og/default.jpg',
          description:
            'MetlifeDM is a US-based digital marketing agency helping businesses across a range of industries grow through SEO, PPC, content, and AI-powered marketing.',
          url: 'https://metlifedm.com',
          email: 'metlifedm4u@gmail.com',
          priceRange: '$$',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '#571',
            addressLocality: 'Nassau',
            addressRegion: 'DE',
            postalCode: '19969',
            addressCountry: 'US',
          },
          areaServed: 'US',
          foundingDate: '2024',
          numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 10 },
          sameAs: [],
        }}
      />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="xl" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80&auto=format&fit=crop"
          alt="Infrastructure powering a growing digital business"
        />
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <Eyebrow number="00" light>MetlifeDM</Eyebrow>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="text-display-hero mt-8 text-ivory"
            >
              The infrastructure behind
              <br />
              <span className="text-italic-fraunces text-ultra-soft">digital business growth.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-10 space-y-2"
            >
              {HERO_LINES.map((l) => (
                <p key={l.verb} className="text-ivory/75 text-lg">
                  <span className="text-ivory font-medium">{l.verb}</span> {l.rest}
                </p>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-12 flex flex-wrap gap-4"
            >
              <Button to="/consultation" size="lg" variant="inverse">
                Find My Growth Path <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <Button
                to="/pasco"
                variant="ghost"
                size="lg"
                className="border-ivory/30 text-ivory hover:bg-ivory hover:text-ink"
              >
                Something Went Wrong? <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE PROBLEM                                                   */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="md">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow className="justify-center">The problem</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Digital business infrastructure is <span className="text-italic-fraunces text-ultra">complicated.</span>
            </h2>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE METLIFEDM METHOD                                          */}
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
              One method. <span className="text-italic-fraunces text-ultra">Every engagement.</span>
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
      {/* SYSTOLAB / PASCO — the two diagnostic engines                 */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} id="diagnostics">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">Two diagnostic engines</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Before we touch anything, <span className="text-italic-fraunces text-ultra-soft">we find out why.</span>
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {DIAGNOSTIC_ENGINES.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="border border-ivory/15 bg-ivory/5 p-8 md:p-10"
              >
                <div className="w-12 h-12 grid place-items-center bg-ivory/10 text-ultra-soft">
                  <d.icon size={20} strokeWidth={1.5} />
                </div>
                <div className="mt-6 flex items-baseline gap-3">
                  <h3 className="text-display-sm text-ivory">{d.name}</h3>
                  <span className="text-ivory/50 text-sm text-italic-fraunces">{d.question}</span>
                </div>
                <p className="text-ivory/65 text-sm mt-4 leading-relaxed">{d.desc}</p>
                <Button to={d.href} variant="underline" className="mt-6 w-fit text-ivory!">
                  Learn more <ArrowUpRight size={13} strokeWidth={1.5} />
                </Button>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* GROWTH SOLUTIONS TEASER                                       */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            className="border border-hairline hover:border-ink transition-colors duration-500 p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8"
          >
            <div className="flex-1">
              <Eyebrow>Growth Solutions</Eyebrow>
              <h2 className="text-display-lg mt-4">
                What should <span className="text-italic-fraunces text-ultra">happen next?</span>
              </h2>
              <p className="text-slate text-lg mt-4 max-w-lg leading-relaxed">
                Once we know what&apos;s wrong, we recommend the path built around your business — not a fixed
                service list.
              </p>
            </div>
            <Button to="/growth-solutions" size="lg" className="shrink-0 w-fit">
              Explore Growth Solutions <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* SPECIALIZED SOLUTIONS TEASER                                  */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="md">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow className="justify-center mb-10 md:justify-start">Specialized solutions</Eyebrow>
            <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2 lg:grid-cols-4">
              {SPECIALIZED_TEASER.map((s) => (
                <Link
                  key={s.label}
                  to={s.href}
                  className="group bg-ivory hover:bg-ink p-8 transition-colors duration-500 flex items-center gap-4"
                >
                  <div className="w-11 h-11 shrink-0 grid place-items-center bg-sand group-hover:bg-ivory/10 transition-colors duration-500">
                    <s.icon size={18} strokeWidth={1.5} className="text-ink group-hover:text-ultra-soft transition-colors duration-500" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-ivory transition-colors duration-500">{s.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* WHY METLIFEDM?                                                */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="md" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">Why MetlifeDM?</Eyebrow>
            <p className="text-ivory text-xl md:text-2xl text-italic-fraunces mt-6 leading-snug">
              {WHY_CHAIN.join(' → ')}
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* ECOSYSTEM TEASER                                              */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="md">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow className="justify-center">The MetlifeDM ecosystem</Eyebrow>
            <p className="text-lg mt-4 max-w-xl mx-auto leading-relaxed text-slate">
              Strategy, marketing, technology, customer service, white label, growth — one partner, evolving with
              your business.
            </p>
            <Button to="/pricing" variant="underline" className="mt-6">
              Explore the ecosystem <ArrowUpRight size={13} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* CLIENT FOR LIFE TEASER                                        */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="md" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">Client for life</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Your subscription can end.<br />
              <span className="text-italic-fraunces text-ultra-soft">Our relationship doesn&apos;t have to.</span>
            </h2>
            <Button to="/growth-solutions#client-for-life" variant="underline" className="mt-6 text-ivory!">
              Learn how <ArrowUpRight size={13} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* 15-MINUTE CLARITY CONVERSATION                                */}
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
            <Eyebrow className="justify-center">15-minute clarity conversation</Eyebrow>
            <h2 className="text-display-lg mt-4">
              No pitch. No pressure. <span className="text-italic-fraunces text-ultra">Just clarity.</span>
            </h2>
            <p className="text-slate text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              Fifteen minutes to figure out where the actual bottleneck is — and whether we&apos;re even the right
              fit to fix it.
            </p>
            <Button to="/consultation" size="lg" className="mt-10">
              Book Your 15 Minutes <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* FINAL CTA (kept extremely minimal, on purpose)                 */}
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
            <p className="text-ivory text-xl md:text-2xl text-italic-fraunces leading-snug">
              Let&apos;s start with the business — not the service.
            </p>
            <Button to="/consultation" size="lg" variant="inverse" className="mt-10">
              Start a Conversation <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
