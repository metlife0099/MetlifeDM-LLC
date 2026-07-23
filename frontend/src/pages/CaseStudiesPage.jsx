import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, TrendingUp, TrendingDown, FileSearch } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Badge } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

const cardShell =
  'bg-white border border-hairline transition-all duration-500 ease-editorial hover:border-ink hover:-translate-y-1 hover:shadow-[0_32px_70px_-24px_rgba(10,23,48,0.28)]';

function CaseStudySkeleton() {
  return (
    <div className={cn(cardShell, 'grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] overflow-hidden animate-pulse')}>
      <div className="aspect-4/3 md:aspect-auto bg-sand" />
      <div className="p-8 md:p-10 space-y-4">
        <div className="h-3 w-32 bg-sand" />
        <div className="h-7 w-full bg-sand" />
        <div className="h-3 w-full bg-sand" />
        <div className="h-3 w-2/3 bg-sand" />
        <div className="h-16 w-40 bg-sand mt-6" />
      </div>
    </div>
  );
}

export default function CaseStudiesPage() {
  const [category, setCategory] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['case-studies', 'list', category],
    queryFn: () =>
      contentApi.listCaseStudies({ category: category || undefined, limit: 24 }).then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['case-studies', 'categories'],
    queryFn: () => contentApi.getCaseStudyCategories(),
  });

  return (
    <>
      <Seo title="Case Studies" description="Detailed case studies showing measurable ROI from MetlifeDM's SEO, PPC, and content campaigns for US businesses." />

      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=1920&q=80&auto=format&fit=crop"
          alt="Growth chart sketched on paper"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Case studies / Receipts, not promises</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            The receipts.<br />
            <span className="text-italic-fraunces text-ultra-soft">Numbered.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Real client engagements, real KPIs, real revenue. Each case study includes the brief, the strategy, and the exact metric we moved.
          </p>
        </Container>
      </Section>

      {categories.length > 0 && (
        <div className="sticky top-20 z-30 bg-ivory/90 backdrop-blur-md border-b border-hairline">
          <Container>
            <ScrollTabs trackClassName="py-4">
              <button
                onClick={() => setCategory('')}
                className={cn(
                  'px-4 py-2 rounded-full text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap cursor-pointer',
                  !category ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setCategory(c._id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap cursor-pointer',
                    category === c._id ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </ScrollTabs>
          </Container>
        </div>
      )}

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, i) => <CaseStudySkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-20 border border-hairline bg-white px-8">
              <div className="w-14 h-14 mx-auto grid place-items-center bg-sand text-slate">
                <FileSearch size={22} strokeWidth={1.5} />
              </div>
              <p className="text-slate mt-6">No case studies in this filter.</p>
              <button className="mt-4 inline-flex items-center gap-2 text-sm text-ink link-underline cursor-pointer" onClick={() => setCategory('')}>
                Reset filter
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {items.map((c, i) => {
                const kpi = c.kpis?.[0];
                const isNegative = String(kpi?.change).trim().startsWith('-');
                return (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true, margin: '-80px' }}
                  >
                    <Link
                      to={`/case-studies/${c.slug}`}
                      className={cn(cardShell, 'group grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] overflow-hidden')}
                    >
                      <div className="relative aspect-4/3 md:aspect-auto bg-sand overflow-hidden order-2 md:order-1">
                        {c.heroImage?.url ? (
                          <img
                            src={c.heroImage.url}
                            alt={c.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full grid place-items-center text-display-lg text-ink/20">
                            {c.title.charAt(0)}
                          </div>
                        )}
                        <div className="absolute top-5 left-5 flex items-center gap-2">
                          <span className="num-plate text-xs bg-ink text-ivory px-2.5 py-1">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                      </div>

                      <div className="p-8 md:p-10 flex flex-col justify-center order-1 md:order-2">
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                          {(c.industry?.name || c.industry) && <Badge tone="outline">{c.industry?.name || c.industry}</Badge>}
                          {c.category?.name && <Badge tone="ultra">{c.category.name}</Badge>}
                          <span className="text-mono text-xs text-slate">{c.year || 'Recent'}</span>
                        </div>
                        <h2 className="text-display-md group-hover:text-ultra transition-colors duration-300">
                          {c.title}
                        </h2>
                        {c.tagline && <p className="mt-4 text-slate leading-relaxed max-w-xl">{c.tagline}</p>}

                        <div className="mt-8 flex items-end justify-between gap-4 flex-wrap">
                          {kpi && (
                            <div className="min-w-0">
                              <div className="text-mono text-xs uppercase tracking-widest text-slate">
                                {kpi.label || 'Key result'}
                              </div>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <div className="text-lg font-medium text-ink leading-snug wrap-break-word">{kpi.after}</div>
                                {kpi.change && (
                                  <div className={cn('inline-flex items-center gap-1 text-mono text-xs px-2 py-0.5 rounded-full border shrink-0', isNegative ? 'text-danger border-danger/30 bg-danger/10' : 'text-success border-success/30 bg-success/10')}>
                                    {isNegative ? <TrendingDown size={12} strokeWidth={1.5} /> : <TrendingUp size={12} strokeWidth={1.5} />}
                                    {kpi.change}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="w-10 h-10 shrink-0 rounded-full border border-hairline group-hover:border-ink group-hover:bg-ink grid place-items-center transition-colors duration-300">
                            <ArrowUpRight size={16} strokeWidth={1.5} className="text-ink group-hover:text-ivory group-hover:rotate-45 transition-all duration-300" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Container>
      </Section>

      <CtaBanner
        title={<>Ready to be the <span className="text-italic-fraunces text-ultra">next receipt?</span></>}
      />
    </>
  );
}
