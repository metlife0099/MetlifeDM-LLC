import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Globe, LayoutTemplate, Server, Search, Share2, MessageCircle, Database, BarChart3,
  Megaphone, Users, TrendingUp, FileLock2, Image, Code2,
  UserCheck, KeyRound, Link2, ShieldAlert,
} from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';

/* ---- Digital Asset Intelligence ---- */
const ASSET_TYPES = [
  { icon: Globe, label: 'Domain' },
  { icon: LayoutTemplate, label: 'Website' },
  { icon: Server, label: 'Hosting' },
  { icon: Search, label: 'Google' },
  { icon: Share2, label: 'Meta' },
  { icon: MessageCircle, label: 'WhatsApp' },
  { icon: Database, label: 'CRM' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Megaphone, label: 'Advertising' },
  { icon: Users, label: 'Social' },
  { icon: TrendingUp, label: 'SEO' },
  { icon: FileLock2, label: 'Customer data' },
  { icon: Image, label: 'Creative assets' },
  { icon: Code2, label: 'Software' },
];

/* ---- The four questions Control asks of every asset ---- */
const DIMENSIONS = [
  { icon: UserCheck, label: 'Ownership', question: 'Who owns it?' },
  { icon: KeyRound, label: 'Access', question: 'Who can access it?' },
  { icon: Link2, label: 'Dependency', question: 'Who can change it?' },
  { icon: ShieldAlert, label: 'Risk', question: 'What happens if they disappear?' },
];

/* ---- Digital Independence Score — a 4-stage spectrum ---- */
const INDEPENDENCE_SCALE = [
  { label: 'Independent', tone: 'success' },
  { label: 'Managed Dependency', tone: 'ultra' },
  { label: 'High Dependency', tone: 'warn' },
  { label: 'Critical Dependency', tone: 'danger' },
];

const SCALE_STYLES = {
  success: 'bg-success/10 border-success/30 text-success',
  ultra: 'bg-ultra/10 border-ultra/30 text-ultra',
  warn: 'bg-warn/10 border-warn/30 text-warn',
  danger: 'bg-danger/10 border-danger/30 text-danger',
};

export default function ControlPage() {
  return (
    <>
      <Seo
        title="Control — Digital Asset Intelligence"
        description="Control is MetlifeDM's digital asset intelligence concept — know what your business owns, who controls it, and what happens if they disappear. Currently available through a PASCO engagement."
        keywords="digital asset management, website ownership audit, digital asset intelligence, business digital ownership, domain and account ownership audit"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Control — Digital Asset Intelligence',
          description: 'A digital ownership and dependency mapping concept from MetlifeDM, part of the PASCO continuity ecosystem.',
        }}
      />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80&auto=format&fit=crop"
          alt="Mapping ownership across a business's digital assets"
        />
        <Container className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs uppercase tracking-widest font-medium text-ultra-soft border border-ultra-soft/30 bg-ultra-soft/5">
            Preview — part of the PASCO ecosystem
          </div>
          <Eyebrow number="00" light>Control&trade;</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Know what your business owns.
            <br />
            <span className="text-italic-fraunces text-ultra-soft">Know who controls it.</span>
          </h1>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* DIGITAL ASSET INTELLIGENCE                                    */}
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
            <Eyebrow className="justify-center">Digital asset intelligence</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Every system your business <span className="text-italic-fraunces text-ultra">actually depends on.</span>
            </h2>
          </motion.div>

          <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-3 lg:grid-cols-7">
            {ASSET_TYPES.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 7) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="bg-ivory p-6 flex flex-col items-center text-center gap-3"
              >
                <div className="w-10 h-10 grid place-items-center bg-ink text-ivory">
                  <a.icon size={16} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium">{a.label}</span>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE FOUR QUESTIONS                                            */}
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
            <Eyebrow light className="justify-center">Four questions, every asset</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Most businesses can&apos;t <span className="text-italic-fraunces text-ultra-soft">answer these.</span>
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIMENSIONS.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="border border-ivory/15 bg-ivory/5 p-7 text-center"
              >
                <div className="w-11 h-11 mx-auto grid place-items-center bg-ivory/10 text-ultra-soft">
                  <d.icon size={18} strokeWidth={1.5} />
                </div>
                <h3 className="text-display-sm text-ivory mt-5">{d.label}</h3>
                <p className="text-ivory/60 text-sm mt-2 text-italic-fraunces">{d.question}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* DIGITAL INDEPENDENCE SCORE                                    */}
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
            <Eyebrow className="justify-center">Digital Independence Score&trade;</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Where does your business <span className="text-italic-fraunces text-ultra">sit on the scale?</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl mx-auto grid gap-3 sm:grid-cols-4"
          >
            {INDEPENDENCE_SCALE.map((s, i) => (
              <div key={s.label} className={`border p-6 text-center ${SCALE_STYLES[s.tone]}`}>
                <div className="num-plate text-xs opacity-60">{String(i + 1).padStart(2, '0')}</div>
                <div className="text-sm font-medium mt-3 leading-snug">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* DIGITAL PASSPORT — eventually                                 */}
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
            <div className="inline-flex items-center gap-2 mx-auto mb-6 px-4 py-1.5 text-xs uppercase tracking-widest font-medium text-ivory/50 border border-ivory/15">
              Eventually
            </div>
            <h2 className="text-display-lg text-ivory">
              The MetlifeDM<br />
              <span className="text-italic-fraunces text-ultra-soft">Digital Passport&trade;</span>
            </h2>
            <p className="text-ivory/65 text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              A single, portable record of everything your business owns and controls — where it lives today, and
              where it&apos;s going next.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* CTA — routed into PASCO, not sold as its own product yet      */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="border border-hairline p-10 md:p-16 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-display-lg">
              Control&trade; is <span className="text-italic-fraunces text-ultra">part of PASCO.</span>
            </h2>
            <p className="text-slate text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              A standalone Control&trade; product is coming. Today, asset mapping and ownership intelligence are
              delivered as part of a PASCO engagement.
            </p>
            <Button to="/pasco" size="lg" className="mt-10">
              Talk to Us About PASCO <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
