import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, ImageOff } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Badge } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

function ItemSkeleton() {
  return (
    <div className="aspect-4/3 bg-sand animate-pulse" />
  );
}

export default function PortfolioPage() {
  const [category, setCategory] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['portfolio', 'list', category],
    queryFn: () =>
      contentApi.listPortfolio({ category: category || undefined, limit: 24 }).then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['portfolio', 'categories'],
    queryFn: () => contentApi.getPortfolioCategories(),
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

      {/* Category filter */}
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
            <div className="grid gap-10 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <ItemSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-20 border border-hairline bg-white px-8">
              <div className="w-14 h-14 mx-auto grid place-items-center bg-sand text-slate">
                <ImageOff size={22} strokeWidth={1.5} />
              </div>
              <p className="text-slate mt-6">No portfolio items in this filter.</p>
              <button className="mt-4 inline-flex items-center gap-2 text-sm text-ink link-underline cursor-pointer" onClick={() => setCategory('')}>
                Reset filter
              </button>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-2">
              {items.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (i % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true, margin: '-80px' }}
                >
                  <Link to={`/portfolio/${item.slug}`} className="group relative block aspect-4/3 bg-sand overflow-hidden">
                    {item.coverImage?.url ? (
                      <img
                        src={item.coverImage.url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-700 ease-editorial group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full grid place-items-center text-display-lg text-ink/20">
                        {item.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {item.isFeatured && (
                      <Badge tone="ultra" className="absolute top-5 left-5">Featured</Badge>
                    )}

                    {/* Hover reveal */}
                    <div className="absolute inset-0 bg-linear-to-t from-ink/95 via-ink/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-editorial">
                      <div className="flex items-center gap-3 text-eyebrow text-ivory/60">
                        {item.client && <span className="truncate">{item.client}</span>}
                        {item.year && (
                          <>
                            <span className="opacity-40 shrink-0">·</span>
                            <span className="shrink-0">{item.year}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-end justify-between gap-4 mt-2">
                        <div className="min-w-0">
                          <h3 className="text-display-sm text-ivory">{item.title}</h3>
                          {item.tagline && (
                            <p className="text-ivory/70 text-sm mt-2 leading-relaxed line-clamp-2">{item.tagline}</p>
                          )}
                        </div>
                        <div className="w-10 h-10 shrink-0 rounded-full border border-ivory/30 grid place-items-center">
                          <ArrowUpRight size={16} strokeWidth={1.5} className="text-ivory group-hover:rotate-45 transition-transform duration-500" />
                        </div>
                      </div>
                    </div>
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
