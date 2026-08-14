import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Globe, RefreshCw, LayoutTemplate, Search, MapPin, Palette, Target, Megaphone, Gauge, Cpu, Code2,
  Compass, ClipboardList, Hammer, Rocket, TrendingUp,
} from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';

/* ---- Projects ---- */
const PROJECT_TYPES = [
  { icon: Globe, label: 'Websites' },
  { icon: RefreshCw, label: 'Website Redesign' },
  { icon: LayoutTemplate, label: 'Landing Pages' },
  { icon: Search, label: 'SEO Setup' },
  { icon: MapPin, label: 'Google Business' },
  { icon: Palette, label: 'Branding' },
  { icon: Target, label: 'Marketing Strategy' },
  { icon: Megaphone, label: 'Campaigns' },
  { icon: Gauge, label: 'SYSTOLAB Implementation' },
  { icon: Cpu, label: 'Custom Technology' },
  { icon: Code2, label: 'Custom Software' },
];

/* ---- Project Process ---- */
const PROCESS_STAGES = [
  { icon: Compass, label: 'Discover' },
  { icon: ClipboardList, label: 'Plan' },
  { icon: Hammer, label: 'Build' },
  { icon: Rocket, label: 'Launch' },
  { icon: TrendingUp, label: 'Optimize' },
];

export default function ProjectsPage() {
  return (
    <>
      <Seo
        title="Projects — Build It Once. Build It Right."
        description="MetlifeDM Projects — websites, redesigns, landing pages, SEO setup, branding, marketing strategy, campaigns, and custom technology, built through a discover-plan-build-launch-optimize process. Custom quote."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Projects',
          serviceType: 'Digital project development',
          description: 'Custom-scoped digital projects — websites, redesigns, landing pages, SEO setup, branding, marketing strategy, campaigns, and custom technology.',
          provider: { '@type': 'Organization', name: 'MetlifeDM LLC', url: 'https://metlifedm.com' },
          areaServed: 'US',
        }}
      />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80&auto=format&fit=crop"
          alt="A project built with intention, from the ground up"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Projects</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Build it once. <span className="text-italic-fraunces text-ultra-soft">Build it right.</span>
          </h1>
          <Button to="/consultation" size="lg" variant="inverse" className="mt-10">
            Discuss a Project <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PROJECTS                                                      */}
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
            <Eyebrow className="justify-center">Projects</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Whatever you need <span className="text-italic-fraunces text-ultra">built properly.</span>
            </h2>
          </motion.div>

          <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {PROJECT_TYPES.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="bg-ivory p-7 flex items-center gap-4"
              >
                <div className="w-11 h-11 shrink-0 grid place-items-center bg-ink text-ivory">
                  <p.icon size={18} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium">{p.label}</span>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PROJECT PROCESS                                               */}
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
            <Eyebrow light className="justify-center">Project process</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              Five stages. <span className="text-italic-fraunces text-ultra-soft">No surprises.</span>
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
      {/* PRICING + CTA                                                 */}
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
            <div className="text-mono text-xs uppercase tracking-widest text-slate">Pricing</div>
            <h2 className="text-display-lg mt-4">Custom quote.</h2>
            <p className="text-slate text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              Every project is scoped around what it actually needs — not a template.
            </p>
            <Button to="/consultation" size="lg" className="mt-10">
              Discuss a Project <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
