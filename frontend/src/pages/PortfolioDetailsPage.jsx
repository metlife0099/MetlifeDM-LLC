import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner, Badge } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';

export default function PortfolioDetailsPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', slug],
    queryFn: () => contentApi.getPortfolioBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="grid place-items-center min-h-[60vh]"><Spinner size={32} className="text-ultra" /></div>;
  }
  if (error || !data?.portfolio) {
    return (
      <Section spacing="xl">
        <Container>
          <Eyebrow>404 / Not found</Eyebrow>
          <h1 className="text-display-lg mt-4">Project not found</h1>
          <Link to="/portfolio" className="mt-8 inline-block link-underline text-ink">← All work</Link>
        </Container>
      </Section>
    );
  }

  const p = data.portfolio;

  return (
    <>
      <Seo title={p.title} description={p.tagline} image={p.coverImage?.url} />

      {/* Hero */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Link to="/portfolio" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
            ← All work
          </Link>
          <div className="mt-8 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {p.client && <Badge>{p.client}</Badge>}
                {p.year && <Badge tone="outline">{p.year}</Badge>}
                {p.category && <Badge tone="ultra">{p.category}</Badge>}
              </div>
              <h1 className="text-display-hero max-w-3xl">{p.title}</h1>
              {p.tagline && <p className="mt-8 max-w-2xl text-lg text-slate leading-relaxed">{p.tagline}</p>}
              {p.liveUrl && (
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-10 inline-flex items-center gap-2 text-mono text-xs uppercase tracking-widest link-underline text-ink"
                >
                  Visit live site <ExternalLink size={14} strokeWidth={1.5} />
                </a>
              )}
            </div>
            <div className="border border-hairline p-8 bg-ivory-soft">
              <div className="text-eyebrow mb-6">Project brief</div>
              <dl className="space-y-4">
                {p.client && (
                  <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                    <dt className="text-slate">Client</dt>
                    <dd className="text-ink">{p.client}</dd>
                  </div>
                )}
                {p.industry && (
                  <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                    <dt className="text-slate">Industry</dt>
                    <dd className="text-ink">{p.industry.name || p.industry}</dd>
                  </div>
                )}
                {p.year && (
                  <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                    <dt className="text-slate">Year</dt>
                    <dd className="text-ink">{p.year}</dd>
                  </div>
                )}
                {p.duration && (
                  <div className="flex justify-between text-mono text-sm border-b border-hairline pb-3">
                    <dt className="text-slate">Duration</dt>
                    <dd className="text-ink">{p.duration}</dd>
                  </div>
                )}
                {p.services?.length > 0 && (
                  <div className="text-mono text-sm">
                    <dt className="text-slate mb-2">Services</dt>
                    <dd className="text-ink flex flex-wrap gap-1">
                      {p.services.map((s) => (
                        <span key={s._id || s} className="border border-hairline px-2 py-1">
                          {s.title || s}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* Hero image */}
      {p.coverImage?.url && (
        <Container>
          <div className="aspect-[16/9] bg-sand overflow-hidden">
            <img src={p.coverImage.url} alt={p.title} className="h-full w-full object-cover" />
          </div>
        </Container>
      )}

      {/* Overview / Challenge / Solution */}
      {(p.overview || p.challenge || p.solution) && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
              <Eyebrow number="01">Overview</Eyebrow>
              <div className="space-y-10 max-w-3xl">
                {p.overview && (
                  <div>
                    <h3 className="text-display-sm mb-4">The brief</h3>
                    <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{p.overview}</p>
                  </div>
                )}
                {p.challenge && (
                  <div>
                    <h3 className="text-display-sm mb-4">The challenge</h3>
                    <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{p.challenge}</p>
                  </div>
                )}
                {p.solution && (
                  <div>
                    <h3 className="text-display-sm mb-4">The solution</h3>
                    <p className="text-lg text-slate leading-relaxed whitespace-pre-line">{p.solution}</p>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Results / KPIs */}
      {p.metrics?.length > 0 && (
        <Section tone="ink" spacing="lg" divider={false}>
          <Container>
            <div className="text-eyebrow text-ivory/50 mb-4">02 / Results</div>
            <h2 className="text-display-lg text-ivory mb-14">
              The <span className="text-italic-fraunces text-ultra-soft">numbers.</span>
            </h2>
            <div className="grid gap-px bg-ivory/10 border border-ivory/10 md:grid-cols-3">
              {p.metrics.map((r, i) => (
                <div key={i} className="bg-ink p-8">
                  <div className="text-mono text-xs uppercase tracking-widest text-ivory/50 mb-3">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="text-display-lg num-plate text-ivory">{r.value}</div>
                  <div className="text-sm text-ivory/70 mt-3">{r.label}</div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Gallery */}
      {p.gallery?.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="03">Gallery</Eyebrow>
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              {p.gallery.map((img, i) => (
                <div key={i} className="aspect-[4/3] bg-sand overflow-hidden">
                  <img src={img.url} alt={img.caption || `Gallery ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner
        title={<>Want work like <span className="text-italic-fraunces text-ultra">this?</span></>}
        subtitle="Book a call. We'll audit your brief and share how we'd approach it."
      />
    </>
  );
}
