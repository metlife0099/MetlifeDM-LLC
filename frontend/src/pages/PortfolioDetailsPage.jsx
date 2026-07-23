import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner, Badge } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 grid gap-12 lg:grid-cols-[1.6fr_1fr]"
          >
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {p.client && <Badge>{p.client}</Badge>}
                {p.year && <Badge tone="outline">{p.year}</Badge>}
                {p.category?.name && <Badge tone="ultra">{p.category.name}</Badge>}
              </div>
              <h1 className="text-display-hero max-w-3xl">{p.title}</h1>
              {p.tagline && <p className="mt-8 max-w-2xl text-lg text-slate leading-relaxed">{p.tagline}</p>}
              <div className="mt-10 flex items-center gap-4 flex-wrap">
                {p.liveUrl && (
                  <Button href={p.liveUrl} target="_blank" rel="noopener noreferrer" variant="primary">
                    Visit live site
                    <ExternalLink size={14} strokeWidth={1.5} />
                  </Button>
                )}
                {p.caseStudy && (
                  <Button to={`/case-studies/${p.caseStudy.slug || p.caseStudy}`} variant="ghost">
                    Read the full case study
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                  </Button>
                )}
              </div>
              {p.tags?.length > 0 && (
                <div className="mt-8 flex items-center gap-2 flex-wrap">
                  {p.tags.map((t) => (
                    <span key={t} className="text-mono text-xs text-slate border border-hairline px-2.5 py-1">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="border border-hairline p-8 bg-white h-fit">
              {p.clientLogo?.url && (
                <img src={p.clientLogo.url} alt={p.client} className="h-8 w-auto mb-6 object-contain" />
              )}
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
          </motion.div>
        </Container>
      </Section>

      {/* Hero image */}
      {p.coverImage?.url && (
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="aspect-16/9 bg-sand overflow-hidden border border-hairline"
          >
            <img src={p.coverImage.url} alt={p.title} className="h-full w-full object-cover" />
          </motion.div>
        </Container>
      )}

      {/* Description */}
      {p.description && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <motion.div {...fadeUp} className="grid gap-16 lg:grid-cols-[1fr_2fr]">
              <Eyebrow number="01">The story</Eyebrow>
              <div
                className="prose prose-lg max-w-3xl text-lg text-slate leading-relaxed"
                dangerouslySetInnerHTML={{ __html: p.description }}
              />
            </motion.div>
          </Container>
        </Section>
      )}

      {/* Overview / Challenge / Solution */}
      {(p.overview || p.challenge || p.solution) && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <motion.div {...fadeUp} className="grid gap-16 lg:grid-cols-[1fr_2fr]">
              <Eyebrow number="02">Overview</Eyebrow>
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
            </motion.div>
          </Container>
        </Section>
      )}

      {/* Before / After */}
      {p.beforeImage?.url && p.afterImage?.url && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="03">Before &amp; after</Eyebrow>
            <h2 className="text-display-md mt-4 mb-10">The transformation.</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { label: 'Before', img: p.beforeImage },
                { label: 'After', img: p.afterImage },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <div className="aspect-4/3 bg-sand overflow-hidden border border-hairline">
                    <img src={item.img.url} alt={item.label} className="h-full w-full object-cover" />
                  </div>
                  <Badge tone={i === 0 ? 'outline' : 'ultra'} className="absolute top-4 left-4">{item.label}</Badge>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Video */}
      {p.videoUrl && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="04">Watch it live</Eyebrow>
            <h2 className="text-display-md mt-4 mb-10">See it in motion.</h2>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="aspect-16/9 bg-ink overflow-hidden border border-hairline"
            >
              <video src={p.videoUrl} controls className="h-full w-full object-cover" />
            </motion.div>
          </Container>
        </Section>
      )}

      {/* Technologies */}
      {p.technologies?.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="05">Stack</Eyebrow>
            <h2 className="text-display-md mt-4 mb-10">Built with.</h2>
            <div className="flex flex-wrap gap-4">
              {p.technologies.map((t, i) => (
                <motion.div
                  key={t.name || i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (i % 10) * 0.05 }}
                  className="flex items-center gap-3 border border-hairline bg-white px-5 py-3"
                >
                  {t.logo ? (
                    <img src={t.logo} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <div className="h-6 w-6 grid place-items-center bg-sand text-ink text-mono text-[0.6rem]">
                      {(t.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm">{t.name}</span>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Results / KPIs */}
      {p.metrics?.length > 0 && (
        <Section tone="ink" spacing="lg" divider={false}>
          <Container>
            <div className="text-eyebrow text-ivory/50 mb-4">06 / Results</div>
            <h2 className="text-display-lg text-ivory mb-14">
              The <span className="text-italic-fraunces text-ultra-soft">numbers.</span>
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {p.metrics.map((r, i) => {
                const isNegative = String(r.delta).trim().startsWith('-');
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
                      {r.delta && (
                        <div className={cn('inline-flex items-center gap-1 text-mono text-xs px-2.5 py-1 rounded-full border shrink-0', isNegative ? 'text-danger border-danger/30 bg-danger/10' : 'text-success border-success/30 bg-success/10')}>
                          {isNegative ? <TrendingDown size={11} strokeWidth={2} /> : <TrendingUp size={11} strokeWidth={2} />}
                          {r.delta}
                        </div>
                      )}
                    </div>
                    <div className="relative text-display-sm text-ivory leading-snug wrap-break-word">{r.value}</div>
                    <div className="relative text-sm text-ivory/60 mt-5 pt-5 border-t border-ivory/10 wrap-break-word">{r.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* Gallery */}
      {p.gallery?.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="07">Gallery</Eyebrow>
            <h2 className="text-display-md mt-4 mb-10">A closer look.</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {p.gallery.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group aspect-4/3 bg-sand overflow-hidden border border-hairline relative"
                >
                  <img
                    src={img.url}
                    alt={img.caption || `Gallery ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="text-ivory text-sm">{img.caption}</span>
                    </div>
                  )}
                </motion.div>
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
