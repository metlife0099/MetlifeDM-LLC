import { motion } from 'framer-motion';
import {
  Zap,
  BarChart3,
  Sparkles,
  Rocket,
  PhoneCall,
  ArrowUpRight,
  ArrowRight,
  TriangleAlert,
  Flame,
} from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';

/* ================== 1. GROWTH STORY (problem / turn split) ================== */
export const GrowthStory = () => (
  <Section tone="ink" spacing="xl" divider={false} className="relative overflow-hidden">
    {/* Background image */}
    <div className="absolute inset-0">
      <img
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-linear-to-b from-ink via-ink/95 to-ink" />
      <div className="absolute inset-0 bg-linear-to-r from-ink via-transparent to-ink" />
    </div>

    <Container className="relative z-10">
      <div className="max-w-3xl">
        <Eyebrow number="01" light>Our energy</Eyebrow>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-display-hero mt-6 text-ivory"
        >
          Electrifying <span className="text-italic-fraunces text-ultra-soft">digital growth.</span>
        </motion.h2>
        <p className="text-ivory/70 text-lg mt-6 leading-relaxed max-w-xl">
          Welcome to MetlifeDM LLC — where high energy meets high conversion, and your business growth isn&apos;t
          just a goal, it&apos;s our obsession.
        </p>
      </div>

      <div className="mt-16 grid lg:grid-cols-2 gap-px bg-ivory/10 border border-ivory/10 relative">
        {/* The problem */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-ink-soft/95 backdrop-blur-sm p-10 md:p-14 hover-lift"
        >
          <div className="w-12 h-12 grid place-items-center bg-ivory/10 text-ivory/70 mb-6">
            <TriangleAlert size={20} strokeWidth={1.5} />
          </div>
          <div className="text-mono text-xs uppercase tracking-widest text-ivory/40 mb-4">The problem</div>
          <p className="text-ivory/85 text-lg leading-relaxed">
            Tired of watching your digital presence flatline while competitors steal the spotlight?
          </p>
          <p className="text-ivory/60 mt-5 leading-relaxed">
            Frustrated by marketing efforts that drain your budget but deliver zero buzz, zero leads, and zero
            results? We get it. The pain is real — wasted time, shrinking ROI, and that sinking feeling of being
            left behind in a fast-moving digital world.
          </p>
        </motion.div>

        {/* Center connector — desktop only */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:grid absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 place-items-center bg-ivory text-ink rounded-full shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <ArrowRight size={22} strokeWidth={1.5} />
        </motion.div>

        {/* The turn */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="bg-ultra/95 backdrop-blur-sm p-10 md:p-14 relative overflow-hidden hover-glow"
        >
          <div className="w-12 h-12 grid place-items-center bg-ivory/15 text-ivory mb-6">
            <Flame size={20} strokeWidth={1.5} />
          </div>
          <div className="text-mono text-xs uppercase tracking-widest text-ivory/70 mb-4">The turn</div>
          <p className="text-ivory text-lg leading-relaxed font-medium">
            But here&apos;s the kicker: it doesn&apos;t have to be that way. We&apos;re not your typical agency —
            we&apos;re MetlifeDM.
          </p>
          <p className="text-ivory/85 mt-5 leading-relaxed">
            We&apos;re a team of relentless innovators, data-driven strategists, and creative powerhouses who live
            for one thing: solving your toughest growth challenges with solutions that hit hard and deliver fast.
          </p>
          <p className="text-ivory/85 mt-5 leading-relaxed">
            What keeps us up at night? The thrill of crafting campaigns that don&apos;t just get clicks — they
            spark conversations, ignite curiosity, and drive real, measurable results.
          </p>
        </motion.div>
      </div>
    </Container>
  </Section>
);

/* ================== 2. CAPABILITY STRIP (hover-reveal) ================== */
const CAPABILITIES = [
  { icon: Zap, title: 'High-Octane Strategies', desc: 'Cutting-edge tactics that deliver immediate impact.' },
  { icon: BarChart3, title: 'Data-Driven Results', desc: 'Metrics-focused campaigns that prove ROI.' },
  { icon: Sparkles, title: 'Creative Powerhouse', desc: 'Bold ideas that break through the noise.' },
  { icon: Rocket, title: 'Rapid Execution', desc: 'From concept to conversion at lightning speed.' },
];

export const CapabilityStrip = () => (
  <Section tone="ivory" spacing="lg">
    <Container>
      <div className="max-w-2xl mb-14">
        <Eyebrow number="02">What drives us</Eyebrow>
        <h2 className="text-display-lg mt-4">
          Four gears. <span className="text-italic-fraunces text-ultra">One machine.</span>
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden border border-hairline hover:border-ink bg-ivory-soft aspect-square p-8 flex flex-col justify-between transition-colors duration-500 hover-lift"
          >
            <div className="w-12 h-12 grid place-items-center bg-ink text-ivory group-hover:bg-ultra transition-colors duration-500">
              <c.icon size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-display-sm">{c.title}</h3>
              <p className="text-slate text-sm mt-2 leading-relaxed max-h-0 group-hover:max-h-24 overflow-hidden transition-[max-height] duration-500 ease-editorial">
                {c.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Container>
  </Section>
);

/* ================== 3. ABOUT INTRO BAND (split image card) ================== */
export const AboutIntroBand = () => (
  <Section tone="ivory" spacing="lg">
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="grid lg:grid-cols-2 border border-hairline"
      >
        <div className="p-10 md:p-14 flex flex-col justify-center">
          <Eyebrow number="03">About us</Eyebrow>
          <p className="text-slate mt-3 max-w-md leading-relaxed">
            Ignite your digital presence with our high-voltage marketing solutions.
          </p>
          <div className="mt-6 inline-flex w-fit items-center gap-2 bg-ultra-tint text-ultra text-mono text-xs uppercase tracking-widest px-4 py-2">
            Ready to dominate the digital world 🌎
          </div>
          <h2 className="text-display-lg mt-6">
            Welcome to <span className="text-italic-fraunces text-ultra">MetlifeDM LLC.</span>
          </h2>
          <p className="text-slate mt-6 leading-relaxed">
            We&apos;re MetlifeDM LLC, the digital marketing crew that&apos;s all about real results. We&apos;re the
            strategists who turn clicks into customers, the creatives who make your brand buzz, and the data
            experts who optimize until your ROI is screaming &ldquo;BOOM!&rdquo;
          </p>
          <p className="text-slate mt-4 leading-relaxed">
            We&apos;ve helped businesses just like yours — from hungry startups to established brands — go from
            invisible to unstoppable. And we&apos;ve got the receipts to prove it.
          </p>
          <p className="text-slate mt-4 leading-relaxed">
            Forget empty promises; we deliver rocket-fueled results. More traffic, bigger buzz, and conversions
            that hit hard — that&apos;s our specialty.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="tel:+18005550199" size="lg">
              <PhoneCall size={16} strokeWidth={1.5} /> Call now
            </Button>
            <Button to="/consultation" variant="ghost" size="lg">
              Get free quote <ArrowUpRight size={14} strokeWidth={1.5} />
            </Button>
          </div>
        </div>
        <div className="relative min-h-80 lg:min-h-full img-zoom">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80&auto=format&fit=crop"
            alt="MetlifeDM team celebrating a campaign win"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </motion.div>
    </Container>
  </Section>
);

/* ================== 4. WHY CHOOSE US (emoji badge cards) ================== */
const WHY_CHOOSE = [
  {
    emoji: '🛠️',
    title: 'Where Creativity Meets Impact — And We Own It!',
    desc: "We don't just love what we do — we live for it. At MetlifeDM LLC, bold ideas meet expert execution to create work that connects, converts, and dominates.",
  },
  {
    emoji: '👨‍💻',
    title: 'Obsessed With Excellence — Down to the Last Pixel',
    desc: 'Quality is our baseline. Every design is crafted with strategy, precision, and serious attention to detail — built to turn heads and drive results.',
  },
  {
    emoji: '❤️',
    title: 'Fueled by Curiosity. Driven by Innovation.',
    desc: "We never settle. At MetlifeDM LLC, we're constantly learning, evolving, and creating bold brand stories that stay ahead of the curve — and your competition.",
  },
  {
    emoji: '⚡',
    title: 'People-Powered. Future-Focused.',
    desc: 'Our team is our superpower. We empower talent to innovate, lead, and deliver digital experiences that shape the future and fuel brand growth.',
  },
];

export const WhyChooseUs = () => (
  <Section tone="ivorySoft" spacing="lg">
    <Container>
      <div className="max-w-2xl mb-14">
        <Eyebrow number="04">Why choose us</Eyebrow>
        <h2 className="text-display-lg mt-4">
          We don&apos;t just build the future — <span className="text-italic-fraunces text-ultra">we engineer it.</span>
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {WHY_CHOOSE.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group border border-hairline hover:border-ink bg-ivory p-8 md:p-10 transition-colors duration-500 hover-lift"
          >
            <div className="w-14 h-14 grid place-items-center bg-sand group-hover:bg-ink text-2xl transition-colors duration-500 mb-6">
              {r.emoji}
            </div>
            <h3 className="text-display-sm leading-snug group-hover:text-ultra transition-colors duration-300">
              {r.title}
            </h3>
            <p className="text-slate text-sm mt-3 leading-relaxed">{r.desc}</p>
          </motion.div>
        ))}
      </div>
    </Container>
  </Section>
);
