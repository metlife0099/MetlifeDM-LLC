import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, Compass, Lightbulb, TrendingUp, TrendingDown, ArrowUpRight, Quote } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner, Badge } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { cn, initials } from '@/utils/format.js';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const STORY_STEPS = [
  { key: 'challenge', label: 'The challenge', icon: AlertCircle },
  { key: 'approach', label: 'The approach', icon: Compass },
  { key: 'solution', label: 'The solution', icon: Lightbulb },
  { key: 'result', label: 'The result', icon: TrendingUp },
];

export default function CaseStudyDetailsPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['case-study', slug],
    queryFn: () => contentApi.getCaseStudyBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="grid place-items-center min-h-[60vh]"><Spinner size={32} className="text-ultra" /></div>;
  }
  if (error || !data?.caseStudy) {
    return (
      <Section spacing="xl">
        <Container>
          <Eyebrow>404 / Not found</Eyebrow>
          <h1 className="text-display-lg mt-4">Case study not found</h1>
          <Link to="/case-studies" className="mt-8 inline-block link-underline text-ink">← All case studies</Link>
        </Container>
      </Section>
    );
  }

  const cs = data.caseStudy;
  const steps = STORY_STEPS.filter((s) => cs[s.key]);

  return (
    <>
      <Seo title={cs.title} description={cs.tagline} image={cs.heroImage?.url} />

      {/* Hero */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src={cs.heroImage?.url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80&auto=format&fit=crop'}
          alt={cs.title}
        />
        <Container className="relative z-10">
          <Link to="/case-studies" className="text-mono text-xs uppercase tracking-widest text-ivory/60 hover:text-ivory link-underline">
            ← All case studies
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              {cs.client && <Badge>{cs.client}</Badge>}
              {(cs.industry?.name || cs.industry) && <Badge tone="outline">{cs.industry?.name || cs.industry}</Badge>}
              {cs.category?.name && <Badge tone="ultra">{cs.category.name}</Badge>}
              {cs.year && <Badge tone="outline">{cs.year}</Badge>}
            </div>
            <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">{cs.title}</h1>
            {cs.tagline && <p className="mt-8 max-w-2xl text-lg text-ivory/75 leading-relaxed">{cs.tagline}</p>}
          </motion.div>
        </Container>
      </Section>

      {/* Key results grid — the money shot */}
      {cs.kpis?.length > 0 && (
        <Section tone="ink" spacing="lg" divider={false}>
          <Container>
            <motion.div {...fadeUp}>
              <div className="text-eyebrow text-ivory/50 mb-4">01 / Results</div>
              <h2 className="text-display-lg text-ivory mb-14">
                What we <span className="text-italic-fraunces text-ultra-soft">moved.</span>
              </h2>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-3">
              {cs.kpis.map((r, i) => {
                const isNegative = String(r.change).trim().startsWith('-');
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative min-w-0 border border-ivory/15 hover:border-ivory/40 bg-ivory/5 hover:bg-ivory/8 hover:-translate-y-1 transition-all duration-500 p-8 overflow-hidden"
                  >
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-ultra/20 rounded-full blur-3xl group-hover:bg-ultra/30 transition-colors duration-500 pointer-events-none" />
                    <div className="relative flex items-center justify-between mb-6 gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-full bg-ivory/10 grid place-items-center text-ivory/80 text-lg">
                        {r.icon || <span className="text-mono text-xs text-ivory/50">{String(i + 1).padStart(2, '0')}</span>}
                      </div>
                      {r.change && (
                        <div className={cn('inline-flex items-center gap-1 text-mono text-xs px-2.5 py-1 rounded-full border shrink-0', isNegative ? 'text-danger border-danger/30 bg-danger/10' : 'text-success border-success/30 bg-success/10')}>
                          {isNegative ? <TrendingDown size={11} strokeWidth={2} /> : <TrendingUp size={11} strokeWidth={2} />}
                          {r.change}
                        </div>
                      )}
                    </div>
                    <div className="relative text-display-sm text-ivory leading-snug wrap-break-word">{r.after}</div>
                    {r.before && (
                      <div className="relative text-xs text-ivory/40 mt-3">from {r.before}</div>
                    )}
                    <div className="relative text-sm text-ivory/60 mt-5 pt-5 border-t border-ivory/10 wrap-break-word">{r.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* Story */}
      {steps.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <motion.div {...fadeUp} className="grid gap-16 lg:grid-cols-[1fr_2fr]">
              <div className="lg:sticky lg:top-32 lg:self-start">
                <Eyebrow number="02">The story</Eyebrow>
              </div>
              <div className="space-y-12 max-w-3xl">
                {steps.map((s, i) => (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-5"
                  >
                    <div className="w-11 h-11 shrink-0 rounded-full border border-hairline grid place-items-center">
                      <s.icon size={18} strokeWidth={1.5} className="text-ultra" />
                    </div>
                    <div>
                      <h3 className="text-display-sm mb-3">{s.label}</h3>
                      <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{cs[s.key]}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Container>
        </Section>
      )}

      {/* Related portfolio project */}
      {cs.portfolio?.slug && (
        <Section tone="ivory" spacing="md" divider={false}>
          <Container>
            <motion.div {...fadeUp}>
              <Link
                to={`/portfolio/${cs.portfolio.slug}`}
                className="group flex items-center gap-6 border border-hairline hover:border-ink transition-colors duration-500 p-6 md:p-8"
              >
                {cs.portfolio.coverImage?.url && (
                  <div className="w-20 h-20 md:w-28 md:h-28 shrink-0 bg-sand overflow-hidden">
                    <img src={cs.portfolio.coverImage.url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-mono text-xs uppercase tracking-widest text-slate mb-2">See the live project</div>
                  <h3 className="text-display-sm group-hover:text-ultra transition-colors duration-300 truncate">{cs.portfolio.title}</h3>
                </div>
                <ArrowUpRight size={24} strokeWidth={1.25} className="shrink-0 group-hover:rotate-45 transition-transform duration-300" />
              </Link>
            </motion.div>
          </Container>
        </Section>
      )}

      {/* Testimonial quote */}
      {cs.testimonial?.quote && (
        <Section tone="sand" spacing="lg">
          <Container className="max-w-4xl">
            <motion.div {...fadeUp}>
              <Quote size={32} strokeWidth={1.25} className="text-ultra mb-8" />
              <p className="text-display-md text-ink leading-tight">
                {cs.testimonial.quote}
              </p>
              {cs.testimonial.author && (
                <div className="mt-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full grid place-items-center bg-ink text-ivory text-mono text-xs shrink-0 overflow-hidden">
                    {cs.testimonial.avatar ? (
                      <img src={cs.testimonial.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(cs.testimonial.author)
                    )}
                  </div>
                  <div className="text-mono text-xs uppercase tracking-widest text-slate">
                    {cs.testimonial.author}{cs.testimonial.role ? ` · ${cs.testimonial.role}` : ''}
                  </div>
                </div>
              )}
            </motion.div>
          </Container>
        </Section>
      )}

      {/* Services used */}
      {cs.services?.length > 0 && (
        <Section tone="ivory" spacing="md">
          <Container>
            <motion.div {...fadeUp}>
              <Eyebrow number="03">Services used</Eyebrow>
            </motion.div>
            <div className="mt-6 flex flex-wrap gap-3">
              {cs.services.map((s, i) => (
                <motion.div
                  key={s._id || s}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (i % 8) * 0.05 }}
                >
                  <Link
                    to={`/services/${s.slug}`}
                    className="border border-hairline hover:border-ink hover:bg-ink hover:text-ivory px-5 py-3 flex items-center gap-2 text-sm transition-colors duration-300"
                  >
                    {s.title || s}
                  </Link>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner
        title={<>Want results like <span className="text-italic-fraunces text-ultra">these?</span></>}
      />
    </>
  );
}
