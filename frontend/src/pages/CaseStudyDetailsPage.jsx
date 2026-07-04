import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner, Badge } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';

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

  return (
    <>
      <Seo title={cs.title} description={cs.summary} image={cs.coverImage?.url} />

      {/* Hero */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Link to="/case-studies" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
            ← All case studies
          </Link>
          <div className="mt-8 flex items-center gap-3 flex-wrap">
            {cs.client && <Badge>{cs.client}</Badge>}
            {cs.industry?.name && <Badge tone="outline">{cs.industry.name}</Badge>}
            {cs.year && <Badge tone="ultra">{cs.year}</Badge>}
          </div>
          <h1 className="text-display-hero mt-8 max-w-4xl">{cs.title}</h1>
          {cs.summary && <p className="mt-8 max-w-2xl text-lg text-slate leading-relaxed">{cs.summary}</p>}
        </Container>
      </Section>

      {/* Key results grid — the money shot */}
      {cs.results?.length > 0 && (
        <Section tone="ink" spacing="lg" divider={false}>
          <Container>
            <div className="text-eyebrow text-ivory/50 mb-4">01 / Results</div>
            <h2 className="text-display-lg text-ivory mb-14">
              What we <span className="text-italic-fraunces text-ultra-soft">moved.</span>
            </h2>
            <div className="grid gap-px bg-ivory/10 border border-ivory/10 md:grid-cols-3">
              {cs.results.map((r, i) => (
                <div key={i} className="bg-ink p-10">
                  <div className="text-mono text-xs uppercase tracking-widest text-ivory/50 mb-3">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="text-display-hero num-plate text-ivory leading-none">
                    {r.value}
                  </div>
                  <div className="text-sm text-ivory/70 mt-5">{r.label}</div>
                  {r.timeframe && (
                    <div className="text-mono text-xs uppercase tracking-widest text-ultra-soft mt-3">
                      {r.timeframe}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Cover */}
      {cs.coverImage?.url && (
        <Container>
          <div className="aspect-[16/9] bg-sand overflow-hidden">
            <img src={cs.coverImage.url} alt={cs.title} className="h-full w-full object-cover" />
          </div>
        </Container>
      )}

      {/* Content sections */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Eyebrow number="02">The story</Eyebrow>
            </div>
            <div className="space-y-14 max-w-3xl">
              {cs.challenge && (
                <div>
                  <h3 className="text-display-sm mb-4">The challenge</h3>
                  <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{cs.challenge}</p>
                </div>
              )}
              {cs.strategy && (
                <div>
                  <h3 className="text-display-sm mb-4">The strategy</h3>
                  <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{cs.strategy}</p>
                </div>
              )}
              {cs.execution && (
                <div>
                  <h3 className="text-display-sm mb-4">The execution</h3>
                  <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{cs.execution}</p>
                </div>
              )}
              {cs.outcome && (
                <div>
                  <h3 className="text-display-sm mb-4">The outcome</h3>
                  <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{cs.outcome}</p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Testimonial quote */}
      {cs.testimonial?.quote && (
        <Section tone="sand" spacing="lg">
          <Container className="max-w-4xl">
            <div className="text-eyebrow mb-8">In their words</div>
            <p className="text-display-md text-ink leading-tight">
              <span className="text-italic-fraunces text-ultra">“</span>
              {cs.testimonial.quote}
              <span className="text-italic-fraunces text-ultra">”</span>
            </p>
            {cs.testimonial.author && (
              <div className="mt-8 text-mono text-xs uppercase tracking-widest text-slate">
                {cs.testimonial.author} · {cs.testimonial.title}
              </div>
            )}
          </Container>
        </Section>
      )}

      {/* Services used */}
      {cs.services?.length > 0 && (
        <Section tone="ivory" spacing="md">
          <Container>
            <Eyebrow number="03">Services used</Eyebrow>
            <div className="mt-6 flex flex-wrap gap-3">
              {cs.services.map((s) => (
                <Link
                  key={s._id || s}
                  to={`/services/${s.slug}`}
                  className="border border-hairline hover:border-ink px-5 py-3 flex items-center gap-2 text-sm transition-colors"
                >
                  {s.icon && <span>{s.icon}</span>}
                  {s.title || s}
                </Link>
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
