import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { ServicesGrid, CtaBanner } from '@/components/sections/index.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { contentApi } from '@/api/index.js';
import { SERVICE_CATEGORIES } from '@/utils/constants.js';
import { cn } from '@/utils/format.js';

export default function ServicesPage() {
  const [search, setSearch] = useSearchParams();
  const category = search.get('category') || '';

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', 'list', category],
    queryFn: () =>
      contentApi.listServices({ category: category || undefined, limit: 30 }).then((r) => r.data),
  });

  const setCategory = (c) => {
    if (c) setSearch({ category: c });
    else setSearch({});
  };

  return (
    <>
      <Seo
        title="Services"
        description="SEO, PPC, content, social, web development, and AI marketing services for USA businesses."
      />

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Eyebrow number="00">Services / All disciplines</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl">
            Marketing services,<br />
            <span className="text-italic-fraunces text-ultra">built to compound.</span>
          </h1>
          <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">
            Every service ships with quantified KPIs, a senior strategist, and monthly ROI reporting. Explore what fits your growth stage.
          </p>
        </Container>
      </Section>

      {/* Image band */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden img-zoom">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop"
          alt="Live campaign analytics dashboard"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/30" />
      </div>

      {/* Category filter */}
      <div className="sticky top-20 z-30 bg-ivory border-y border-hairline">
        <Container className="py-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors',
                !category ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
              )}
            >
              All
            </button>
            {SERVICE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors flex items-center gap-2',
                  category === c.value ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </Container>
      </div>

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
          ) : services.length ? (
            <ServicesGrid services={services} showAll={false} />
          ) : (
            <div className="text-center py-24 text-slate">
              No services in this category yet. <button className="link-underline text-ink" onClick={() => setCategory('')}>Reset filter</button>.
            </div>
          )}
        </Container>
      </Section>

      <CtaBanner
        title="Not sure which service fits?"
        subtitle="Book a 30-minute call. We'll audit your funnel and recommend the right starting point — with no obligation."
      />
    </>
  );
}
