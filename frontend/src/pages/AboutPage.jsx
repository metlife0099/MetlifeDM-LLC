import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { StatsBand, CtaBanner, TestimonialsCarousel } from '@/components/sections/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/api/index.js';

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
      <Section tone="ivory" spacing="xl" divider={false}>
        <Container>
          <Eyebrow number="00">About / Est. 2013</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-5xl">
            We&apos;re a small agency<br />
            with a <span className="text-italic-fraunces text-ultra">strong opinion</span> about growth.
          </h1>
          <div className="grid gap-8 lg:grid-cols-2 mt-16 max-w-6xl">
            <p className="text-lg text-slate leading-relaxed">
              MetlifeDM started in a Manhattan coworking space in 2013 with a simple thesis: US businesses were being sold campaigns when they needed systems. A decade later, we&apos;ve grown into a 45-person team across the US, but the thesis hasn&apos;t changed.
            </p>
            <p className="text-lg text-slate leading-relaxed">
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

      {/* Timeline */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="text-eyebrow text-ivory/50 mb-4">02 / History</div>
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
