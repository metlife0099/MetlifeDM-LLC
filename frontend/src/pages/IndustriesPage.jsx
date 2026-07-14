import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';

export default function IndustriesPage() {
  const { data: industries = [], isLoading } = useQuery({
    queryKey: ['industries', 'list'],
    queryFn: () => contentApi.listIndustries({ limit: 30 }).then((r) => r.data),
  });

  return (
    <>
      <Seo title="Industries" description="Specialized digital marketing for e-commerce, SaaS, healthcare, real estate, legal, and financial services." />

      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80&auto=format&fit=crop"
          alt="Industry benchmark analytics"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Industries / Specialized playbooks</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            We speak<br />
            <span className="text-italic-fraunces text-ultra-soft">your industry.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Every industry has its own buyers, compliance, and competitive dynamics. We&apos;ve built dedicated playbooks for the ones we know best.
          </p>
        </Container>
      </Section>

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
          ) : industries.length === 0 ? (
            <div className="text-center py-24 text-slate">No industries yet.</div>
          ) : (
            <div className="grid gap-px bg-hairline border border-hairline md:grid-cols-2 lg:grid-cols-3">
              {industries.map((i, idx) => (
                <motion.div
                  key={i._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (idx % 6) * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={`/industries/${i.slug}`}
                    className="block bg-ivory p-8 md:p-10 group hover:bg-ink hover:text-ivory transition-colors duration-500 h-full"
                  >
                    <div className="text-3xl mb-6">{i.icon}</div>
                    <div className="num-plate text-slate text-xs group-hover:text-ivory/50 mb-3 transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <h3 className="text-display-sm mb-3">{i.name}</h3>
                    <p className="text-sm text-slate group-hover:text-ivory/70 leading-relaxed transition-colors">
                      {i.shortDescription}
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-mono text-xs uppercase tracking-widest">
                      Learn more
                      <ArrowUpRight
                        size={14}
                        strokeWidth={1.5}
                        className="group-hover:rotate-45 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <CtaBanner
        title="Don't see your industry?"
        subtitle="We work across most B2B and B2C verticals. Book a call to check if we're the right fit."
      />
    </>
  );
}
