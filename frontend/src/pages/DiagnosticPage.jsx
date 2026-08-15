import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, Check,
  Eye, Target, ShieldCheck, Globe, MousePointerClick, Route, Repeat,
  Inbox, Search, Filter, ClipboardList,
} from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import PricingEnquiryModal from '@/components/sections/PricingEnquiryModal.jsx';

/* ---- What We Diagnose ---- */
const DIAGNOSE_AREAS = [
  { icon: Eye, label: 'Visibility' },
  { icon: Target, label: 'Positioning' },
  { icon: ShieldCheck, label: 'Trust' },
  { icon: Globe, label: 'Website' },
  { icon: MousePointerClick, label: 'Conversion' },
  { icon: Route, label: 'Customer Journey' },
  { icon: Repeat, label: 'Retention' },
];

/* ---- How It Works ---- */
const PROCESS_STAGES = [
  { icon: Inbox, label: 'Input' },
  { icon: Search, label: 'Analysis' },
  { icon: Filter, label: 'Bottleneck' },
  { icon: ClipboardList, label: 'Recommendation' },
];

/* ---- What You Receive ---- */
const DELIVERABLES = [
  'Diagnostic findings',
  'Priority issues',
  'Bottleneck identification',
  'Recommended actions',
  'Growth path recommendation',
];

/* ---- Example Diagnostic (clearly-labeled sample, not a real client) ---- */
const SAMPLE_FINDINGS = [
  { severity: 'Critical', area: 'Visibility', finding: 'Not appearing for 8 of 10 target local search terms.' },
  { severity: 'Critical', area: 'Website', finding: 'Mobile page load exceeds 6 seconds — most visitors leave before it loads.' },
  { severity: 'High', area: 'Trust', finding: 'No client reviews visible on primary discovery channels.' },
  { severity: 'High', area: 'Customer Journey', finding: 'Enquiry form requires 11 fields before submission.' },
  { severity: 'Medium', area: 'Conversion', finding: 'No clear call-to-action above the fold.' },
];

const SEVERITY_STYLES = {
  Critical: 'text-danger border-danger/30 bg-danger/5',
  High: 'text-warn border-warn/30 bg-warn/5',
  Medium: 'text-slate border-hairline bg-sand/40',
};

export default function DiagnosticPage() {
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  return (
    <>
      <Seo
        title="The MetlifeDM Diagnostic"
        description="Before we recommend anything, we find what's actually wrong. The MetlifeDM Diagnostic identifies the real bottleneck across visibility, positioning, trust, website, conversion, customer journey, and retention."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'The MetlifeDM Diagnostic',
          serviceType: 'Digital business diagnostic',
          description: "Identifies the real growth bottleneck across visibility, positioning, trust, website, conversion, customer journey, and retention before recommending any service.",
          provider: { '@type': 'Organization', name: 'MetlifeDM LLC', url: 'https://metlifedm.com' },
          areaServed: 'US',
        }}
      />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80&auto=format&fit=crop"
          alt="A strategist reviewing diagnostic findings"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>The MetlifeDM Diagnostic</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Before we recommend anything,
            <br />
            <span className="text-italic-fraunces text-ultra-soft">we find what&apos;s actually wrong.</span>
          </h1>
          <Button to="/consultation" size="lg" variant="inverse" className="mt-10">
            Find My Growth Bottleneck <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* WHAT WE DIAGNOSE                                              */}
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
            <Eyebrow className="justify-center">What we diagnose</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Seven places <span className="text-italic-fraunces text-ultra">the bottleneck hides.</span>
            </h2>
          </motion.div>

          <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {DIAGNOSE_AREAS.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="bg-ivory p-8 flex items-center gap-4"
              >
                <div className="w-11 h-11 shrink-0 grid place-items-center bg-ink text-ivory">
                  <a.icon size={18} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium">{a.label}</span>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                  */}
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
            <Eyebrow light className="justify-center">How it works</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              From raw input to a <span className="text-italic-fraunces text-ultra-soft">clear recommendation.</span>
            </h2>
          </motion.div>

          <div className="mt-16 max-w-md mx-auto">
            {PROCESS_STAGES.map((stage, i) => (
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
                {i < PROCESS_STAGES.length - 1 && (
                  <div className="pl-[1.375rem]">
                    <div className="w-px h-6 bg-ivory/15" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* WHAT YOU RECEIVE                                              */}
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
            <Eyebrow className="justify-center">What you receive</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Clarity, <span className="text-italic-fraunces text-ultra">not a sales pitch.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg mx-auto grid gap-4 sm:grid-cols-2"
          >
            {DELIVERABLES.map((d) => (
              <div key={d} className="flex items-center gap-3">
                <Check size={15} strokeWidth={2} className="shrink-0 text-ultra" />
                <span className="text-ink text-sm">{d}</span>
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* EXAMPLE DIAGNOSTIC                                            */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-14"
          >
            <Eyebrow light className="justify-center">Example diagnostic</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              What a real report <span className="text-italic-fraunces text-ultra-soft">looks like.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto border border-ivory/15 bg-ivory/5"
          >
            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-ivory/10">
              <div>
                <div className="text-ivory text-sm font-medium">Local Service Business</div>
                <div className="text-ivory/50 text-xs mt-1">Diagnostic summary</div>
              </div>
              <span className="px-2.5 py-1 text-[0.65rem] uppercase tracking-widest text-ultra-soft border border-ultra-soft/30 bg-ultra-soft/5">
                Sample
              </span>
            </div>

            <div className="px-6 md:px-8 py-6 space-y-3">
              {SAMPLE_FINDINGS.map((f) => (
                <div key={f.finding} className="flex items-start gap-4 py-2">
                  <span className={`shrink-0 px-2 py-0.5 text-[0.6rem] uppercase tracking-widest border rounded-full ${SEVERITY_STYLES[f.severity]}`}>
                    {f.severity}
                  </span>
                  <div>
                    <div className="text-mono text-[0.65rem] uppercase tracking-widest text-ivory/40">{f.area}</div>
                    <p className="text-ivory/80 text-sm mt-1 leading-relaxed">{f.finding}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 md:px-8 py-6 border-t border-ivory/10 grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-mono text-[0.65rem] uppercase tracking-widest text-ivory/40">Primary bottleneck</div>
                <p className="text-ivory text-sm mt-2 leading-relaxed">
                  Visibility — the business is largely invisible to the customers already searching for it.
                </p>
              </div>
              <div>
                <div className="text-mono text-[0.65rem] uppercase tracking-widest text-ivory/40">Recommended path</div>
                <p className="text-ivory text-sm mt-2 leading-relaxed">
                  Growth — visibility and conversion systems, built on a stable technical foundation.
                </p>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* CTA                                                           */}
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
              Find your <span className="text-italic-fraunces text-ultra">growth bottleneck.</span>
            </h2>
            <p className="text-slate text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              No pitch. Just a clear-eyed look at what&apos;s actually stopping your business from growing.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button to="/consultation" size="lg">
                Find My Growth Bottleneck <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <Button variant="ghost" size="lg" onClick={() => setEnquiryOpen(true)}>
                Enquire About Pricing
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>

      <PricingEnquiryModal open={enquiryOpen} onClose={() => setEnquiryOpen(false)} service="The Diagnostic" />
    </>
  );
}
