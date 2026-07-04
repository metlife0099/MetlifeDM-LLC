import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner, StatsBand } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

const STATS = [
  { value: '4.9', label: 'Average rating', suffix: '★' },
  { value: '200+', label: 'US clients' },
  { value: '95%', label: 'Retention rate' },
  { value: '12', label: 'Years in business', suffix: 'yr' },
];

export default function TestimonialsPage() {
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials', 'all'],
    queryFn: () => contentApi.listTestimonials({ limit: 50 }).then((r) => r.data || r),
  });

  return (
    <>
      <Seo
        title="Testimonials"
        description="What US business owners say about working with MetlifeDM. Unedited quotes with real names, companies, and metrics."
      />

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Eyebrow number="00">Testimonials / Unedited quotes</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl">
            In their<br />
            <span className="text-italic-fraunces text-ultra">own words.</span>
          </h1>
          <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">
            No paraphrasing, no cropping. Every quote below comes from a real US business owner who agreed to be named — with the metric we moved for them attached.
          </p>
        </Container>
      </Section>

      <StatsBand items={STATS} />

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spinner size={28} className="text-ultra" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-24 text-slate">No testimonials yet.</div>
          ) : (
            <div className="grid gap-px bg-hairline border border-hairline md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <motion.figure
                  key={t._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
                  viewport={{ once: true }}
                  className={cn(
                    'bg-ivory p-8 md:p-10 flex flex-col',
                    t.isFeatured && 'bg-ink text-ivory md:col-span-2'
                  )}
                >
                  <div className={cn('flex items-center justify-between mb-6')}>
                    <Quote
                      size={20}
                      strokeWidth={1.25}
                      className={cn(t.isFeatured ? 'text-ultra-soft' : 'text-ultra')}
                    />
                    {t.rating > 0 && (
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            size={12}
                            strokeWidth={1.5}
                            className={cn(
                              j < t.rating
                                ? t.isFeatured
                                  ? 'fill-ultra-soft text-ultra-soft'
                                  : 'fill-ultra text-ultra'
                                : 'text-slate/30'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <blockquote
                    className={cn(
                      'text-italic-fraunces flex-1 leading-snug',
                      t.isFeatured ? 'text-display-md' : 'text-lg'
                    )}
                  >
                    “{t.quote || t.content}”
                  </blockquote>

                  <figcaption className={cn('mt-8 pt-6 border-t', t.isFeatured ? 'border-ivory/15' : 'border-hairline')}>
                    <div className={cn('font-medium text-sm', t.isFeatured ? 'text-ivory' : 'text-ink')}>
                      {t.name}
                    </div>
                    <div className={cn('text-mono text-xs uppercase tracking-widest mt-1', t.isFeatured ? 'text-ivory/60' : 'text-slate')}>
                      {t.role}
                      {t.company && (
                        <>
                          <span className="opacity-40 mx-1.5">·</span>
                          {t.company}
                        </>
                      )}
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <CtaBanner
        title={<>Want to be the <span className="text-italic-fraunces text-ultra">next quote?</span></>}
        subtitle="Book a call. We'll share what we'd do for you before you commit."
      />
    </>
  );
}
