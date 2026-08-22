import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { ServicesGrid, CtaBanner } from '@/components/sections/index.jsx';
import { QueryError, Spinner } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { contentApi } from '@/api/index.js';
import { SERVICE_CATEGORIES } from '@/utils/constants.js';
import { cn } from '@/utils/format.js';

export default function ServicesPage() {
  const [search, setSearch] = useSearchParams();
  const category = search.get('category') || '';

  const { data: services = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['services', 'list', category],
    queryFn: () =>
      contentApi
        .listServices({ category: category || undefined, limit: 30, sortBy: 'order', sortOrder: 'asc' })
        .then((r) => r.data),
  });

  const setCategory = (c) => {
    if (c) setSearch({ category: c });
    else setSearch({});
  };

  return (
    <>
      <Seo
        title="Services"
        description="SEO, PPC, content, social, web development, and AI marketing services — each one exists to solve a specific business problem, not fill a menu."
        keywords="digital marketing services, SEO PPC social media services, full service marketing agency, marketing services USA, web development services, AI marketing solutions"
      />

      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80&auto=format&fit=crop"
          alt="Live campaign analytics dashboard"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Services / Not a menu</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Every service exists<br />
            <span className="text-italic-fraunces text-ultra-soft">to fix one problem.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            We don&apos;t start with &ldquo;what service do you want?&rdquo; — we start with what&apos;s costing you
            leads. These are the tools we reach for once we know. Prefer to start with your industry instead?{' '}
            <Link to="/industries" className="link-underline text-ivory">See industry playbooks</Link>.
          </p>
        </Container>
      </Section>

      {/* Category filter */}
      <div className="sticky top-20 z-30 bg-ivory border-y border-hairline">
        <Container>
          <ScrollTabs trackClassName="py-4">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap',
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
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors flex items-center gap-2 whitespace-nowrap',
                  category === c.value ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </ScrollTabs>
        </Container>
      </div>

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
          ) : isError ? (
            <QueryError title="Services are temporarily unavailable." onRetry={refetch} />
          ) : services.length ? (
            <ServicesGrid services={services} showAll={false} />
          ) : (
            <div className="text-center py-24 text-slate">
              No services in this category yet. <button className="link-underline text-ink" onClick={() => setCategory('')}>Reset filter</button>.
            </div>
          )}
        </Container>
      </Section>

      {/* Image band */}
      <div className="relative h-[45vh] md:h-[55vh] overflow-hidden img-zoom">
        <motion.img
          initial={{ scale: 1.15, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1600&q=80&auto=format&fit=crop"
          alt="Strategist team reviewing a campaign roadmap"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-lg"
            >
              <Eyebrow className="text-ivory/60">Every engagement</Eyebrow>
              <p className="text-ivory text-2xl md:text-4xl mt-6 leading-tight text-italic-fraunces">
                One team, every channel, one dashboard.
              </p>
              <p className="text-ivory/70 mt-6 max-w-md leading-relaxed">
                Mix and match services — most clients run 2-3 in parallel under a single senior strategist.
              </p>
            </motion.div>
          </Container>
        </div>
      </div>

      <CtaBanner
        title="Not sure which service fits?"
        subtitle="Book a 30-minute call. We'll audit your funnel and recommend the right starting point — with no obligation."
      />
    </>
  );
}
