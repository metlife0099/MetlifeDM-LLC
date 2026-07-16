import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import {
  TestimonialsCarousel,
  CtaBanner,
  FaqAccordion,
  ServicesGrid,
} from '@/components/sections/index.jsx';
import { BrandStory, PlatformShowcase, BuilderFeatures, WhyUsTimeline } from '@/components/home/index.jsx';
import { contentApi } from '@/api/index.js';

export default function HomePage() {
  const { data: featuredServices = [] } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: () => contentApi.listServices({ featured: 'true', limit: 5 }).then((r) => r.data),
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials', 'featured'],
    queryFn: () => contentApi.listTestimonials({ featured: 'true', limit: 6 }).then((r) => r.data),
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs', 'featured'],
    queryFn: () => contentApi.listFaqs({ featured: 'true', limit: 6 }),
  });

  return (
    <>
      <Seo
        title="Digital marketing excellence for USA businesses"
        description="MetlifeDM helps 200+ US businesses grow through SEO, PPC, content, and AI-powered marketing. Measurable ROI, transparent pricing, senior strategists."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': 'https://metlifedm.com/#organization',
          name: 'MetlifeDM LLC',
          image: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1200&q=80&auto=format&fit=crop',
          description:
            'MetlifeDM is a Miami, FL-based digital marketing agency helping 200+ US businesses grow through SEO, PPC, content, and AI-powered marketing.',
          url: 'https://metlifedm.com',
          telephone: '+1-800-555-0199',
          priceRange: '$$',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Miami',
            addressRegion: 'FL',
            addressCountry: 'US',
          },
          areaServed: 'US',
          foundingDate: '2024',
          sameAs: [],
        }}
      />

      {/* ============ HERO ============ */}
      <Section tone="ink" spacing="xl" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80&auto=format&fit=crop"
          alt="Strategists collaborating around a laptop"
        />
        <Container className="relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <Eyebrow number="00" light>Digital marketing / Est. 2024</Eyebrow>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-display-hero mt-8 text-ivory"
              >
                Growth is a{' '}
                <span className="text-italic-fraunces text-ultra-soft">discipline,</span>
                <br />
                not a lottery.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="mt-8 max-w-xl text-lg text-ivory/75 leading-relaxed"
              >
                We&apos;re a US-based agency of senior strategists helping <strong className="text-ivory">200+
                brands</strong> compound revenue through SEO, paid media, content, and AI-powered marketing —
                with measurable results in the first 90 days.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-12 flex flex-wrap gap-4"
              >
                <Button to="/consultation" size="lg" variant="inverse">
                  Book a strategy call <ArrowUpRight size={16} strokeWidth={1.5} />
                </Button>
                <Button to="/case-studies" variant="ghost" size="lg" className="border-ivory/30 text-ivory hover:bg-ivory hover:text-ink">
                  See how we work
                </Button>
              </motion.div>
            </div>

            {/* Right: metric card — the signature moment */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="border border-hairline p-8 md:p-10 bg-ivory-soft shadow-[0_32px_64px_-24px_rgba(0,0,0,0.5)]">
                <div className="text-eyebrow mb-4">Live · Q3 2025 client benchmark</div>
                <div className="text-mono text-xs text-slate mb-2">Organic revenue, YoY</div>
                <div className="text-display-hero num-plate leading-none text-ink">
                  +487<span className="text-ultra">%</span>
                </div>
                <div className="mt-8 space-y-3">
                  {[
                    ['Impressions', '+1,240%'],
                    ['Ranked keywords', '3 → 218'],
                    ['Cost per lead', '−62%'],
                    ['ROAS', '2.1x → 6.4x'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-mono text-sm border-b border-hairline pb-2">
                      <span className="text-slate">{k}</span>
                      <span className="text-ink">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-hairline text-xs text-slate">
                  Wellness D2C brand · Q1–Q3 2025
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Brand story */}
      <BrandStory />

      {/* Services */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="flex items-end justify-between mb-14 gap-8 flex-wrap">
            <div>
              <Eyebrow number="02">Services</Eyebrow>
              <h2 className="text-display-lg mt-4 max-w-3xl">
                Full-stack marketing<br />
                built for <span className="text-italic-fraunces text-ultra">compounding.</span>
              </h2>
            </div>
            <Button to="/services" variant="underline" size="md">
              All services <ArrowRight size={14} strokeWidth={1.5} />
            </Button>
          </div>
          {featuredServices.length > 0 ? (
            <ServicesGrid services={featuredServices} />
          ) : (
            <div className="text-slate text-sm">Loading services…</div>
          )}
        </Container>
      </Section>

      {/* Platform showcase */}
      <PlatformShowcase />

      {/* Website builder features */}
      <BuilderFeatures />

      {/* Image band — results in the wild */}
      <div className="relative h-[55vh] md:h-[65vh] overflow-hidden img-zoom">
        <motion.img
          initial={{ scale: 1.15, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80&auto=format&fit=crop"
          alt="A client and strategist celebrating a campaign win"
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
              <Eyebrow className="text-ivory/60">Real results</Eyebrow>
              <p className="text-ivory text-2xl md:text-4xl mt-6 leading-tight text-italic-fraunces">
                Clients don&apos;t hire us twice by accident.
              </p>
              <p className="text-ivory/70 mt-6 max-w-md leading-relaxed">
                94% client retention. Senior strategists who stay on your account for years, not months.
              </p>
            </motion.div>
          </Container>
        </div>
      </div>

      {/* Why us — timeline */}
      <WhyUsTimeline />

      {/* Testimonials */}
      {testimonials.length > 0 && <TestimonialsCarousel testimonials={testimonials} />}

      {/* FAQ */}
      {faqs.length > 0 && <FaqAccordion items={faqs} />}

      {/* Final CTA */}
      <CtaBanner />
    </>
  );
}
