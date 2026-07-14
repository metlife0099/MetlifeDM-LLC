import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowUpRight,
  Award,
  Search,
  Globe,
  Target,
  SlidersHorizontal,
  LayoutGrid,
  LayoutTemplate,
  ShoppingCart,
  Code2,
  Smartphone,
  ServerCog,
  Wand2,
  Check,
} from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import { cn } from '@/utils/format.js';

/* ================== 1. BRAND STORY ================== */
export const BrandStory = () => (
  <Section tone="ivory" spacing="lg">
    <Container>
      <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] items-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.06 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-4/5 overflow-hidden border border-hairline img-zoom"
        >
          <img
            src="https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1200&q=80&auto=format&fit=crop"
            alt="Miami skyline at dusk, home of the MetlifeDM team"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-ivory">
            <div className="text-mono text-xs uppercase tracking-widest text-ivory/70">Headquartered in</div>
            <div className="text-display-sm mt-1">Miami, Florida</div>
          </div>
        </motion.div>

        <div>
          <Eyebrow number="01">Our story</Eyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-display-lg mt-4 max-w-xl"
          >
            Grow your business with{' '}
            <span className="text-italic-fraunces text-ultra">data-driven</span> digital marketing.
          </motion.h2>
          <p className="text-slate text-lg mt-6 max-w-xl leading-relaxed">
            Your digital roadmap to success starts with MetlifeDM — Miami, FL&apos;s best digital marketing agency.
          </p>

          <motion.blockquote
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-8 border-l-2 border-ultra pl-6 max-w-lg"
          >
            <p className="text-xl md:text-2xl text-italic-fraunces leading-snug">
              &ldquo;I&apos;ve tried everything,&rdquo; complained one small business owner, exasperated by having
              spent time and money on web marketing campaigns that failed to deliver. &ldquo;My site is not seen.
              My ads won&apos;t convert. I just want to grow.&rdquo;
            </p>
          </motion.blockquote>

          <div className="mt-8 space-y-4 text-slate leading-relaxed max-w-lg">
            <p>
              That call wasn&apos;t made to any agency — it was made to MetlifeDM, Miami&apos;s rapidly emerging
              digital marketing agency rewriting the rules of online growth.
            </p>
            <p>
              What began as a single call evolved into a revolution — not just for one business, but for hundreds
              across Miami and beyond. Today, MetlifeDM is considered the top digital marketing agency in Miami, FL,
              built on strategy, storytelling, and data-driven execution.
            </p>
          </div>

          <Button to="/about" size="lg" className="mt-10">
            Read our full story <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </Container>
  </Section>
);

/* ================== 2. PLATFORM SHOWCASE ================== */
const PLATFORMS = [
  { key: 'wp', name: 'WordPress', desc: 'Powerful CMS solutions', icon: LayoutTemplate },
  { key: 'sh', name: 'Shopify', desc: 'E-commerce made easy', icon: ShoppingCart },
  { key: 'cmf', name: 'CMF', desc: 'Custom content frameworks', icon: Code2 },
];

const PLATFORM_STATS = [
  { value: '20+', label: 'Projects' },
  { value: '98%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
];

export const PlatformShowcase = () => (
  <Section tone="ink" spacing="xl" divider={false} className="relative overflow-hidden">
    <HeroImage
      src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1920&q=80&auto=format&fit=crop"
      alt="Developers building a website on multiple screens"
      overlay="darkTop"
    />
    <Container className="relative z-10">
      <div className="max-w-2xl">
        <Eyebrow number="03" light>Web platforms / Built to scale</Eyebrow>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-display-hero mt-6 text-ivory"
        >
          Empowering American brands<br />
          for <span className="text-italic-fraunces text-ultra-soft">next-level growth.</span>
        </motion.h2>
        <p className="text-ivory/75 text-lg mt-6 leading-relaxed max-w-xl">
          We build powerful websites using WordPress, Shopify, and custom CMF solutions tailored to your business
          needs.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button to="/consultation" size="lg" variant="inverse">
            Get started <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
          <Button
            to="/services"
            variant="ghost"
            size="lg"
            className="border-ivory/30 text-ivory hover:bg-ivory hover:text-ink"
          >
            Learn more
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl border-t border-ivory/15 pt-10">
        {PLATFORM_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <div className="text-display-md num-plate text-ivory">{s.value}</div>
            <div className="text-mono text-xs uppercase tracking-widest text-ivory/60 mt-2">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Platform cards */}
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {PLATFORMS.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group border border-ivory/15 p-8 hover:bg-ivory transition-colors duration-500 hover-lift"
          >
            <div className="w-12 h-12 grid place-items-center bg-ultra text-ivory group-hover:bg-ink transition-colors duration-500 mb-6">
              <p.icon size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-display-sm text-ivory group-hover:text-ink transition-colors duration-500">
              {p.name}
            </h3>
            <p className="text-ivory/60 group-hover:text-slate text-sm mt-2 transition-colors duration-500">
              {p.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </Container>
  </Section>
);

/* ================== 3. BUILDER FEATURES (bento) ================== */
const BUILDER_FEATURES = [
  { icon: LayoutTemplate, title: 'WordPress-like CMS', desc: 'Create beautiful, content-rich websites with our easy-to-use content management system.' },
  { icon: ShoppingCart, title: 'E-commerce Solutions', desc: 'Build powerful online stores with shopping carts, payment gateways, and inventory management.' },
  { icon: Code2, title: 'Custom Development', desc: 'Tailored solutions designed specifically for your unique business requirements.' },
  { icon: Smartphone, title: 'Mobile Responsive', desc: 'Fully responsive designs that look perfect on any device, from desktop to mobile.' },
  { icon: ServerCog, title: 'Hosting & Maintenance', desc: 'Reliable hosting solutions with regular updates and maintenance included.' },
  { icon: Search, title: 'SEO Optimized', desc: 'Websites built with SEO best practices to help you rank higher in search results.' },
];

const BUILDER_CHECKLIST = ['Pre-designed templates', 'Customizable components', 'Real-time preview'];

export const BuilderFeatures = () => (
  <Section tone="ivory" spacing="lg">
    <Container>
      <div className="max-w-2xl mb-14">
        <Eyebrow number="04">Website builder</Eyebrow>
        <h2 className="text-display-lg mt-4">
          Unleash a jaw-dropping<br />
          website <span className="text-italic-fraunces text-ultra">with ease.</span>
        </h2>
        <p className="text-slate text-lg mt-6 leading-relaxed">
          Our platform makes website creation as simple as WordPress and Shopify, but with the power of custom
          development.
        </p>
      </div>

      <div className="space-y-6">
        {/* Highlighted drag & drop builder card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-10 lg:grid-cols-2 items-center border border-ink bg-ink text-ivory p-8 md:p-12 hover-lift"
        >
          <div>
            <div className="w-12 h-12 grid place-items-center bg-ultra text-ivory mb-6">
              <Wand2 size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-display-sm">Drag &amp; Drop Website Builder</h3>
            <p className="text-ivory/70 text-sm mt-3 leading-relaxed max-w-sm">
              Create stunning websites without writing a single line of code. Our intuitive interface makes web
              design accessible to everyone.
            </p>
            <ul className="mt-6 space-y-2.5">
              {BUILDER_CHECKLIST.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-sm text-ivory/85">
                  <Check size={14} className="text-ultra-soft shrink-0" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock builder UI */}
          <div className="border border-ivory/15 bg-ivory/5 rounded-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-ivory/10">
              <span className="w-2 h-2 rounded-full bg-ivory/30" />
              <span className="w-2 h-2 rounded-full bg-ivory/30" />
              <span className="w-2 h-2 rounded-full bg-ivory/30" />
              <span className="ml-3 text-mono text-[0.6rem] text-ivory/40 uppercase tracking-widest">
                Website Builder Interface
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-9 bg-ivory/10 rounded-xs transition-colors duration-500 hover:bg-ultra/40',
                    i === 0 && 'col-span-4 h-5',
                    i === 5 && 'col-span-2'
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Regular feature grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BUILDER_FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: (i % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group border border-hairline hover:border-ink p-8 transition-colors duration-500 hover-lift"
            >
              <div className="w-11 h-11 grid place-items-center bg-sand group-hover:bg-ink transition-colors duration-500 mb-6">
                <f.icon size={18} strokeWidth={1.5} className="text-ink group-hover:text-ivory transition-colors duration-500" />
              </div>
              <h3 className="text-display-sm">{f.title}</h3>
              <p className="text-slate text-sm mt-3 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Container>
  </Section>
);

/* ================== 4. WHY US TIMELINE ================== */
const WHY_US_REASONS = [
  {
    icon: Award,
    title: 'Proven Track Record of Success',
    desc: "We've helped businesses across industries achieve higher conversions, increased website traffic, and stronger brand visibility through cutting-edge digital marketing strategies.",
  },
  {
    icon: Search,
    title: 'Always on the Cutting Edge of SEO',
    desc: "With 93% of search starting on search engines, it's rank or perish. Our experts employ on-page, off-page, and semantic SEO techniques to get you found for what your users are really searching for.",
  },
  {
    icon: Globe,
    title: 'Web Development That Converts',
    desc: "Your website is not a page — it's your welcoming handshake on the internet. We build blazing-fast, responsive websites for conversions, SEO, and trust.",
  },
  {
    icon: Target,
    title: 'Campaigns Built Around You',
    desc: "Whether you require leads, sales, or visibility, we don't subscribe to cookie-cutter solutions. Every campaign is built around audience behavior, market research, and your business objectives.",
  },
  {
    icon: SlidersHorizontal,
    title: 'Customized Solutions for Your Business',
    desc: "No one-size-fits-all strategies here. We tailor our services to fit your industry, audience, and goals — whether you're a small startup or an established brand.",
  },
  {
    icon: LayoutGrid,
    title: 'Full-Service Digital Marketing Under One Roof',
    desc: 'From SEO and PPC to social media, content creation, and website development — we handle everything to ensure your business thrives online.',
  },
];

const TimelineRow = ({ reason: r, index: i, total, progress }) => {
  const isEven = i % 2 === 0;
  // This node "lights up" (muted → solid black) as the scroll-progress line reaches it.
  const nodeColor = useTransform(progress, [i / total, (i + 0.6) / total], ['#a8b0c0', '#0a1730']);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col lg:flex-row items-start lg:items-center gap-5 py-6 lg:py-10"
    >
      {/* Icon node on the center line */}
      <div className="relative z-10 shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
        <motion.div
          style={{ backgroundColor: nodeColor }}
          className="w-14 h-14 grid place-items-center text-ivory rounded-full border-4 border-ivory shadow-[0_8px_24px_-8px_rgba(10,23,48,0.35)]"
        >
          <r.icon size={20} strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* Content — floats left or right of the center line on desktop */}
      <div className={cn('group w-full lg:w-[calc(50%-3rem)]', isEven ? 'lg:mr-auto' : 'lg:ml-auto')}>
        <div className="border border-hairline hover:border-ink hover-lift transition-colors duration-500 bg-ivory-soft p-6 md:p-8">
          <div className="num-plate text-slate text-xs mb-2">{String(i + 1).padStart(2, '0')}</div>
          <h3 className="text-display-sm group-hover:text-ultra transition-colors duration-300">{r.title}</h3>
          <p className="text-slate text-sm mt-3 leading-relaxed">{r.desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const WhyUsTimeline = () => {
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.75', 'end 0.4'],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <Section tone="ivory" spacing="lg">
      <Container>
        <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
          <Eyebrow number="05" className="justify-center">
            Why MetlifeDM
          </Eyebrow>
          <h2 className="text-display-lg mt-4">
            Why MetlifeDM is the <span className="text-italic-fraunces text-ultra">best</span> digital marketing
            agency in Miami.
          </h2>
          <p className="text-slate text-lg mt-6 leading-relaxed">
            At MetlifeDM, we don&apos;t just market — we drive real, measurable growth. Our data-driven strategies
            ensure your business stands out in the competitive US market.
          </p>
        </div>

        <div ref={trackRef} className="relative">
          {/* Static track */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-hairline" />
          {/* Animated progress line — draws downward as the section scrolls into view */}
          <motion.div
            style={{ height: lineHeight }}
            className="hidden lg:block absolute left-1/2 top-0 w-px -translate-x-1/2 origin-top bg-ink shadow-[0_0_10px_1px_rgba(10,23,48,0.35)]"
          />
          <div>
            {WHY_US_REASONS.map((r, i) => (
              <TimelineRow key={r.title} reason={r} index={i} total={WHY_US_REASONS.length} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
};
