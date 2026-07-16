import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { CtaBanner, TestimonialsCarousel } from '@/components/sections/index.jsx';
import { GrowthStory, CapabilityStrip, AboutIntroBand, WhyChooseUs } from '@/components/about/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/index.js';

const TIMELINE = [
  { year: '2024', event: 'Founded in Miami with 3 SEO strategists' },
  { year: '2024', event: 'Expanded into paid media and content marketing' },
  { year: '2025', event: 'Reached 50 US clients; opened branding practice' },
  { year: '2025', event: 'Launched AI-marketing solutions' },
  { year: '2026', event: '200+ clients milestone; 45-person team across the US' },
];

export default function AboutPage() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials', 'featured'],
    queryFn: () => contentApi.listTestimonials({ featured: 'true', limit: 6 }).then((r) => r.data),
  });
  return (
    <>
      <Seo
        title="About"
        description="MetlifeDM LLC — Miami, FL's business growth machine. Bold digital strategies, killer results, and a team obsessed with turning your brand into a powerhouse of clicks and cash."
      />

      {/* Hero */}
      <Section tone="ink" spacing="xl" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80&auto=format&fit=crop"
          alt="The MetlifeDM team celebrating a growth milestone"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Who we are</Eyebrow>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-display-hero mt-8 max-w-4xl text-ivory"
          >
            Your business<br />
            <span className="text-italic-fraunces text-ultra-soft">growth machine.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-8 max-w-xl text-lg text-ivory/75 leading-relaxed"
          >
            MetlifeDM fuses bold digital strategies with killer results, turning your brand into a powerhouse of
            clicks and cash.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-12"
          >
            <Button to="/consultation" size="lg" variant="inverse">
              Get started <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>

      {/* Origin story — problem / turn */}
      <GrowthStory />

      {/* Capabilities */}
      <CapabilityStrip />

      {/* About intro band */}
      <AboutIntroBand />

      {/* Why choose us */}
      <WhyChooseUs />

      {/* Timeline */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="text-eyebrow text-ivory/50 mb-4">05 / History</div>
              <h2 className="text-display-lg text-ivory">Since 2024,<br /><span className="text-italic-fraunces text-ultra-soft">one thesis.</span></h2>
            </div>
            <ol className="border-t border-ivory/10">
              {TIMELINE.map((t, i) => (
                <li key={i} className="border-b border-ivory/10 py-6 grid grid-cols-[auto_1fr] gap-8 items-baseline">
                  <span className="num-plate text-ultra-soft text-lg">{t.year}</span>
                  <span className="text-ivory text-lg leading-snug">{t.event}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {testimonials.length > 0 && <TestimonialsCarousel testimonials={testimonials} />}
      <CtaBanner
        title="Work with us?"
        subtitle="We take on roughly 15 clients a year. If we're not the right fit, we'll tell you upfront."
      />
    </>
  );
}
