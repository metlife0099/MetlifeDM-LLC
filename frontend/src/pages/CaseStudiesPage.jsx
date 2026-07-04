import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

export default function CaseStudiesPage() {
  const [industry, setIndustry] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['case-studies', 'list', industry],
    queryFn: () =>
      contentApi.listCaseStudies({ industry: industry || undefined, limit: 24 }).then((r) => r.data),
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries', 'list'],
    queryFn: () => contentApi.listIndustries({ limit: 20 }).then((r) => r.data),
  });

  return (
    <>
      <Seo title="Case Studies" description="Detailed case studies showing measurable ROI from MetlifeDM's SEO, PPC, and content campaigns for US businesses." />

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Eyebrow number="00">Case studies / Receipts, not promises</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl">
            The receipts.<br />
            <span className="text-italic-fraunces text-ultra">Numbered.</span>
          </h1>
          <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">
            Real client engagements, real KPIs, real revenue. Each case study includes the brief, the strategy, and the exact metric we moved.
          </p>
        </Container>
      </Section>

      {industries.length > 0 && (
        <div className="sticky top-20 z-30 bg-ivory border-y border-hairline">
          <Container className="py-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setIndustry('')}
                className={cn(
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors',
                  !industry ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                All industries
              </button>
              {industries.slice(0, 8).map((i) => (
                <button
                  key={i._id}
                  onClick={() => setIndustry(i._id)}
                  className={cn(
                    'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors',
                    industry === i._id ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                  )}
                >
                  {i.name}
                </button>
              ))}
            </div>
          </Container>
        </div>
      )}

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 text-slate">
              No case studies in this filter.{' '}
              <button className="link-underline text-ink" onClick={() => setIndustry('')}>Reset</button>.
            </div>
          ) : (
            <div className="divide-editorial border-t border-hairline">
              {items.map((c, i) => (
                <motion.article
                  key={c._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true, margin: '-80px' }}
                  className="py-10 md:py-14 grid gap-8 md:grid-cols-[auto_1fr_1fr] md:items-center"
                >
                  <div className="num-plate text-slate text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div className="text-eyebrow mb-3">
                      {c.industry?.name || c.industry} · {c.year || 'Recent'}
                    </div>
                    <Link
                      to={`/case-studies/${c.slug}`}
                      className="text-display-md hover:text-ultra transition-colors block max-w-2xl"
                    >
                      {c.title}
                    </Link>
                    {c.tagline && <p className="mt-4 text-slate text-sm max-w-xl leading-relaxed">{c.tagline}</p>}
                  </div>
                  <div>
                    {c.kpis?.[0] && (
                      <div className="border border-hairline p-6 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-mono text-xs uppercase tracking-widest text-slate">
                            {c.kpis[0].label || 'Key result'}
                          </div>
                          <div className="text-display-md num-plate text-ink mt-2">
                            {c.kpis[0].after}
                          </div>
                        </div>
                        <Link to={`/case-studies/${c.slug}`} aria-label="Read case study">
                          <ArrowUpRight size={24} strokeWidth={1.25} className="text-ink hover:rotate-45 transition-transform duration-300" />
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
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
