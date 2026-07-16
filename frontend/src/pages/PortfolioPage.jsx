import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

export default function PortfolioPage() {
  const [industry, setIndustry] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['portfolio', 'list', industry],
    queryFn: () =>
      contentApi.listPortfolio({ industry: industry || undefined, limit: 24 }).then((r) => r.data),
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries', 'list'],
    queryFn: () => contentApi.listIndustries({ limit: 20 }).then((r) => r.data),
  });

  return (
    <>
      <Seo title="Portfolio" description="Selected work from MetlifeDM — websites, campaigns, and brand systems for US businesses." />

      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1920&q=80&auto=format&fit=crop"
          alt="Creative work in progress"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Portfolio / Selected work</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Work<br />
            <span className="text-italic-fraunces text-ultra-soft">worth the receipt.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            A cross-section of websites, ad creative, and full brand systems we&apos;ve shipped since day one. Every one has real KPIs attached.
          </p>
        </Container>
      </Section>

      {/* Industry filter */}
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
              No portfolio items in this filter.{' '}
              <button className="link-underline text-ink" onClick={() => setIndustry('')}>Reset</button>.
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {items.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.1 }}
                  viewport={{ once: true, margin: '-100px' }}
                >
                  <Link to={`/portfolio/${item.slug}`} className="group block">
                    <div className="relative aspect-[4/3] bg-sand overflow-hidden">
                      {item.coverImage?.url ? (
                        <img
                          src={item.coverImage.url}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full grid place-items-center text-display-lg text-ink/20">
                          {item.title.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/60 transition-colors duration-500 flex items-end p-6">
                        <ArrowUpRight
                          size={28}
                          strokeWidth={1.25}
                          className="text-ivory opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-45"
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-3 text-eyebrow text-slate">
                      {item.client && <span>{item.client}</span>}
                      {item.year && (
                        <>
                          <span className="opacity-40">·</span>
                          <span>{item.year}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-display-sm mt-2 group-hover:text-ultra transition-colors">
                      {item.title}
                    </h3>
                    {item.tagline && (
                      <p className="text-slate text-sm mt-2 leading-relaxed">{item.tagline}</p>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <CtaBanner
        title="Have a project?"
        subtitle="From launches to full rebrands — book a call to talk scope, timelines, and pricing."
      />
    </>
  );
}
