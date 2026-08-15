import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Check, ChevronRight, ShieldAlert,
  Building2, UserMinus, UserX, EyeOff, Lock, ServerCrash, PackageX, AlertTriangle, FileWarning, Handshake,
  LifeBuoy, Search, ShieldCheck, Wrench, ArrowRightLeft, Flag,
  Boxes, UserCheck, KeyRound, Activity,
  FileCheck2, RefreshCw,
} from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import PricingEnquiryModal from '@/components/sections/PricingEnquiryModal.jsx';

/* ---- The Problem — how digital continuity breaks ---- */
const PROBLEM_TRIGGERS = [
  { icon: Building2, label: 'Agency exit' },
  { icon: UserMinus, label: 'Employee exit' },
  { icon: UserX, label: 'Freelancer exit' },
  { icon: EyeOff, label: 'Developer disappearance' },
  { icon: Lock, label: 'Account lockout' },
  { icon: ServerCrash, label: 'Website failure' },
  { icon: PackageX, label: 'Vendor failure' },
  { icon: AlertTriangle, label: 'Platform problems' },
  { icon: FileWarning, label: 'Incomplete projects' },
  { icon: Handshake, label: 'Business acquisition' },
];

/* ---- PASCO Framework ---- */
const PASCO_FRAMEWORK = [
  { icon: Lock, label: 'Secure' },
  { icon: Search, label: 'Audit' },
  { icon: LifeBuoy, label: 'Recover' },
  { icon: ShieldCheck, label: 'Stabilize' },
  { icon: Wrench, label: 'Rebuild' },
  { icon: ArrowRightLeft, label: 'Transition' },
  { icon: Flag, label: 'Move Forward' },
];

/* ---- PASCO Control Map — the 5 dimensions tracked per asset ---- */
const CONTROL_MAP = [
  { icon: Boxes, label: 'Asset' },
  { icon: UserCheck, label: 'Owner' },
  { icon: KeyRound, label: 'Access' },
  { icon: Activity, label: 'Status' },
  { icon: ShieldAlert, label: 'Risk' },
];

/* ---- PASCO Exit Report — what's inside ---- */
const EXIT_REPORT_CONTENTS = [
  'Asset inventory',
  'Ownership',
  'Access',
  'Outstanding work',
  'Risks',
  'Broken systems',
  'Recoverable assets',
  'Recommended actions',
  'Stabilization plan',
];

/* ---- PASCO Decision Framework ---- */
const DECISIONS = [
  { icon: FileCheck2, label: 'Keep', desc: "What's working stays exactly as it is." },
  { icon: LifeBuoy, label: 'Recover', desc: "What's lost or locked gets brought back under your control." },
  { icon: Wrench, label: 'Repair', desc: "What's broken gets fixed, not replaced." },
  { icon: RefreshCw, label: 'Replace', desc: "What's beyond saving gets rebuilt properly." },
];

/* ---- PASCO Engagements — sold as outcomes, never priced as hours ---- */
const ENGAGEMENTS = [
  {
    name: 'PASCO Assessment',
    scope: 'Fixed scope',
    desc: 'Know exactly what’s broken, who controls what, and what it will take to fix it.',
  },
  {
    name: 'PASCO Recovery',
    scope: 'Situation-based',
    desc: 'We regain control of what’s been lost, locked, or left behind.',
  },
  {
    name: 'PASCO Transition',
    scope: 'Custom',
    desc: 'A full handoff — stabilized, rebuilt, and transferred on your terms.',
  },
];

export default function PascoPage() {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  return (
    <>
      <Seo
        title="PASCO — Business Digital Continuity & Recovery"
        description="PASCO is MetlifeDM's business digital continuity and recovery framework — for when an agency, employee, freelancer, or developer disappears, an account gets locked out, or a website fails. Secure, audit, recover, stabilize, rebuild, transition, move forward."
        keywords="business continuity recovery, digital asset recovery, website recovery service, agency exit recovery, digital continuity planning, hacked website recovery, lost website access recovery"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'PASCO — Business Digital Continuity & Recovery',
          serviceType: 'Digital business continuity and recovery',
          description: 'A structured framework to secure, audit, recover, stabilize, rebuild, and transition digital business assets after a loss of control.',
          provider: { '@type': 'Organization', name: 'MetlifeDM LLC', url: 'https://metlifedm.com' },
          areaServed: 'US',
        }}
      />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80&auto=format&fit=crop"
          alt="Regaining control of business-critical systems"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>PASCO&trade;</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Business digital<br />
            <span className="text-italic-fraunces text-ultra-soft">continuity &amp; recovery.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            When your digital operation breaks down, regain control.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button to="/consultation" size="lg" variant="inverse">
              Start a PASCO Assessment <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
            <Button
              href="#framework"
              variant="ghost"
              size="lg"
              className="border-ivory/30 text-ivory hover:bg-ivory hover:text-ink"
            >
              See the framework
            </Button>
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE PROBLEM                                                   */}
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
            <Eyebrow className="justify-center">The problem</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Digital continuity breaks <span className="text-italic-fraunces text-ultra">more often than you&apos;d think.</span>
            </h2>
          </motion.div>

          <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2 lg:grid-cols-5">
            {PROBLEM_TRIGGERS.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="bg-ivory p-6 flex flex-col items-center text-center gap-3"
              >
                <div className="w-10 h-10 grid place-items-center bg-ink text-ivory">
                  <t.icon size={16} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium leading-snug">{t.label}</span>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PASCO FRAMEWORK                                               */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} id="framework">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">PASCO framework</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Seven stages back to <span className="text-italic-fraunces text-ultra-soft">full control.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 flex flex-wrap items-start justify-center gap-y-10"
          >
            {PASCO_FRAMEWORK.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="flex flex-col items-center gap-4 w-24 md:w-28 px-2">
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full grid place-items-center bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={20} strokeWidth={1.5} />
                    <span className="absolute -top-2 -right-1 num-plate text-ivory/40 text-[0.6rem]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[0.65rem] md:text-xs uppercase tracking-widest text-center font-medium text-ivory">
                    {stage.label}
                  </span>
                </div>
                {i < PASCO_FRAMEWORK.length - 1 && (
                  <ChevronRight size={18} strokeWidth={1.5} className="text-ivory/25 shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PASCO CONTROL MAP                                             */}
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
            <Eyebrow className="justify-center">PASCO Control Map&trade;</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Every asset, <span className="text-italic-fraunces text-ultra">mapped and accounted for.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 flex flex-wrap items-center justify-center gap-y-6"
          >
            {CONTROL_MAP.map((c, i) => (
              <div key={c.label} className="flex items-center">
                <div className="flex flex-col items-center gap-3 w-24 px-2">
                  <div className="w-12 h-12 grid place-items-center bg-ink text-ivory">
                    <c.icon size={18} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-center font-medium">{c.label}</span>
                </div>
                {i < CONTROL_MAP.length - 1 && (
                  <ChevronRight size={18} strokeWidth={1.5} className="text-slate shrink-0" />
                )}
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PASCO EXIT REPORT                                             */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow light>PASCO Exit Report&trade;</Eyebrow>
              <h2 className="text-display-lg mt-4 text-ivory">
                One document. <span className="text-italic-fraunces text-ultra-soft">The full picture.</span>
              </h2>
              <p className="text-ivory/70 text-lg mt-6 leading-relaxed">
                Every PASCO engagement ends with a single report — what you have, what you&apos;re missing, and
                exactly what to do next.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-x-8 gap-y-4 sm:grid-cols-2"
            >
              {EXIT_REPORT_CONTENTS.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={15} strokeWidth={2} className="shrink-0 text-ultra-soft" />
                  <span className="text-ivory/85 text-sm">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PASCO DECISION FRAMEWORK                                      */}
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
            <Eyebrow className="justify-center">PASCO decision framework</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Every asset gets <span className="text-italic-fraunces text-ultra">one of four verdicts.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DECISIONS.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="border border-hairline hover:border-ink hover-lift transition-colors duration-500 p-7 text-center"
              >
                <div className="w-11 h-11 mx-auto grid place-items-center bg-ink text-ivory">
                  <d.icon size={18} strokeWidth={1.5} />
                </div>
                <h3 className="text-display-sm mt-5">{d.label}</h3>
                <p className="text-slate text-sm mt-2 leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PASCO ENGAGEMENTS — sold as outcomes, never as a cheap monthly */}
      {/* package or a rate card                                        */}
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
            <Eyebrow light className="justify-center">PASCO engagements</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Scoped to the <span className="text-italic-fraunces text-ultra-soft">situation, not the hours.</span>
            </h2>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setEnquiryOpen(true)}
              className="mt-6 border-ivory/30 text-ivory hover:bg-ivory hover:text-ink"
            >
              Not Sure Which Engagement? Enquire About Pricing
            </Button>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
            {ENGAGEMENTS.map((e, i) => (
              <motion.div
                key={e.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="border border-ivory/15 bg-ivory/5 p-8 flex flex-col"
              >
                <h3 className="text-display-sm text-ivory">{e.name}</h3>
                <div className="text-mono text-xs uppercase tracking-widest text-ultra-soft mt-2">{e.scope}</div>
                <p className="text-ivory/70 text-sm mt-4 leading-relaxed flex-1">{e.desc}</p>
                <Button to="/consultation" variant="underline" className="mt-6 w-fit text-ivory!">
                  Talk to us <ArrowUpRight size={13} strokeWidth={1.5} />
                </Button>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* EMERGENCY CTA                                                 */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="border border-danger/30 bg-danger/5 p-10 md:p-16 text-center max-w-3xl mx-auto"
          >
            <div className="w-12 h-12 mx-auto grid place-items-center bg-danger text-ivory">
              <ShieldAlert size={22} strokeWidth={1.5} />
            </div>
            <h2 className="text-display-lg mt-6">Something went wrong?</h2>
            <p className="text-slate text-lg mt-4 max-w-md mx-auto leading-relaxed">
              Every hour you wait, more control slips away. Let&apos;s find out what you still have — and how to get
              the rest back.
            </p>
            <Button to="/consultation" size="lg" className="mt-10 bg-danger! hover:bg-ink!">
              Start a PASCO Assessment <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      <PricingEnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} service="PASCO" />
    </>
  );
}
