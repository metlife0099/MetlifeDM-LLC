import { motion } from 'framer-motion';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { StatsBand, CtaBanner, TestimonialsCarousel } from '@/components/sections/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/index.js';

const TEAM = [
  { name: 'Sarah Chen', role: 'Founder & CEO', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80&auto=format&fit=crop' },
  { name: 'Marcus Webb', role: 'Head of Paid Media', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop' },
  { name: 'David Torres', role: 'Director of SEO', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80&auto=format&fit=crop' },
  { name: 'Emily Hart', role: 'Head of Content', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80&auto=format&fit=crop' },
];

const VALUES = [
  { title: 'Measured, not sold', body: 'We optimize for the metrics you actually care about — pipeline, revenue, ROAS — not vanity numbers.' },
  { title: 'Senior work, only', body: 'Every account is led by a strategist with 8+ years of experience. No juniors, no offshore handoffs.' },
  { title: 'Transparent by default', body: 'Real dashboards, honest reviews, weekly briefs. You always know what we shipped and why.' },
  { title: 'Compounding wins', body: 'We build engines, not campaigns. The systems we ship keep earning long after we stop billing.' },
];

const TIMELINE = [
  { year: '2013', event: 'Founded in New York with 3 SEO strategists' },
  { year: '2015', event: 'Grew to 15 US clients, expanded into paid media' },
  { year: '2018', event: 'Named Top 10 US SEO agency by Clutch' },
  { year: '2021', event: 'Reached 100 clients; opened content & branding practice' },
  { year: '2024', event: 'Launched AI-marketing solutions; 200+ clients milestone' },
];

const TEAM_STATS = [
  { label: 'Team members across the US', value: '45', suffix: '' },
  { label: 'Certifications (Google, Meta, HubSpot)', value: '120', suffix: '+' },
  { label: 'Years combined experience', value: '380', suffix: '+' },
  { label: 'Client retention rate', value: '94', suffix: '%' },
];

export default function AboutPage() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials', 'featured'],
    queryFn: () => contentApi.listTestimonials({ featured: 'true', limit: 6 }).then((r) => r.data),
  });
  return (
    <>
      <Seo title="About" description="MetlifeDM LLC — a US-based agency of senior marketers helping 200+ brands grow since 2013." />

      {/* Hero */}
      <Section tone="ink" spacing="xl" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80&auto=format&fit=crop"
          alt="The MetlifeDM team collaborating in our studio"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>About / Est. 2013</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-5xl text-ivory">
            We&apos;re a small agency<br />
            with a <span className="text-italic-fraunces text-ultra-soft">strong opinion</span> about growth.
          </h1>
          <div className="grid gap-8 lg:grid-cols-2 mt-16 max-w-6xl">
            <p className="text-lg text-ivory/75 leading-relaxed">
              MetlifeDM started in a Manhattan coworking space in 2013 with a simple thesis: US businesses were being sold campaigns when they needed systems. A decade later, we&apos;ve grown into a 45-person team across the US, but the thesis hasn&apos;t changed.
            </p>
            <p className="text-lg text-ivory/75 leading-relaxed">
              We take on around 15 new clients a year — brands that value senior strategy, transparent reporting, and results that compound. If that sounds like you, we&apos;d love to meet.
            </p>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <StatsBand stats={TEAM_STATS} />

      {/* Values */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <Eyebrow number="01">Values</Eyebrow>
          <h2 className="text-display-lg mt-4 mb-14">
            Four beliefs<br />that shape the work.
          </h2>
          <div className="grid gap-px bg-hairline border border-hairline">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-ivory p-8 md:p-10 md:grid md:grid-cols-[auto_1fr] md:gap-8">
                <div className="num-plate text-slate text-sm mb-3 md:mb-0">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h3 className="text-display-sm mb-3">{v.title}</h3>
                  <p className="text-slate leading-relaxed max-w-xl">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section tone="ivorySoft" spacing="lg">
        <Container>
          <Eyebrow number="02">The people</Eyebrow>
          <h2 className="text-display-lg mt-4 mb-14 max-w-2xl">
            Senior strategists,<br /><span className="text-italic-fraunces text-ultra">not account managers.</span>
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group"
              >
                <div className="img-zoom aspect-4/5 bg-sand overflow-hidden hover-glow">
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale-15 group-hover:grayscale-0 transition-[filter] duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="mt-4">
                  <div className="text-sm text-ink">{member.name}</div>
                  <div className="text-mono text-xs text-slate mt-1">{member.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Timeline */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="text-eyebrow text-ivory/50 mb-4">03 / History</div>
              <h2 className="text-display-lg text-ivory">Twelve years,<br /><span className="text-italic-fraunces text-ultra-soft">one thesis.</span></h2>
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
