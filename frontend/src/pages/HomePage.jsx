import { Link } from 'react-router-dom';
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
import { BrandStory, HowWeWork, SolutionsNotServices, PlatformShowcase, BuilderFeatures, WhyUsTimeline } from '@/components/home/index.jsx';
import { contentApi } from '@/api/index.js';

export default function HomePage() {
  const { data: featuredServices = [] } = useQuery({
    queryKey: ['services', 'home'],
    // Show the top services by display order — not gated behind the separate
    // "Featured" toggle, so newly added services show up here immediately.
    queryFn: () =>
      contentApi
        .listServices({ limit: 5, sortBy: 'order', sortOrder: 'asc' })
        .then((r) => r.data),
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
        description="MetlifeDM helps US businesses across a range of industries grow through SEO, PPC, content, and AI-powered marketing. Measurable ROI, transparent pricing, senior strategists."
        keywords="digital marketing agency, digital marketing agency USA, SEO agency, PPC management agency, social media marketing agency, growth marketing agency, business growth agency, US digital marketing company, full service marketing agency"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': 'https://metlifedm.com/#organization',
          name: 'MetlifeDM LLC',
          // Google surfaces this as the brand icon in search results and
          // knowledge panels — it must be the actual logo, not a stock photo.
          logo: 'https://metlifedm.com/icons/icon-512.png',
          image: 'https://metlifedm.com/og/default.jpg',
          description:
            'MetlifeDM is a US-based digital marketing agency helping US businesses across a range of industries grow through SEO, PPC, content, and AI-powered marketing.',
          url: 'https://metlifedm.com',
          email: 'metlifedm4u@gmail.com',
          priceRange: '$$',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '#571',
            addressLocality: 'Nassau',
            addressRegion: 'DE',
            postalCode: '19969',
            addressCountry: 'US',
          },
          areaServed: 'US',
          foundingDate: '2024',
          numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 10 },
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
                We don&apos;t sell marketing services.
                <br />
                We solve <span className="text-italic-fraunces text-ultra-soft">growth bottlenecks.</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="mt-6 text-sm uppercase tracking-[0.2em] font-medium text-ultra-soft"
              >
                Diagnose first. Optimize second. Measure always.
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="mt-8 max-w-xl text-lg text-ivory/75 leading-relaxed"
              >
                MetlifeDM is a lean, senior-only team that diagnoses what&apos;s actually stopping a business from
                growing — then builds the exact SEO, paid media, content, or AI-powered systems needed to fix it.
                No generic packages, no guesswork.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-12 flex flex-wrap gap-4"
              >
                <Button to="/consultation" size="lg" variant="inverse">
                  Find My Growth Path <ArrowUpRight size={16} strokeWidth={1.5} />
                </Button>
                <Button to="/case-studies" variant="ghost" size="lg" className="border-ivory/30 text-ivory hover:bg-ivory hover:text-ink">
                  See how we work
                </Button>
              </motion.div>
            </div>

            {/* Right: evidence card — a real client, not a fabricated benchmark */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="border border-hairline p-8 md:p-10 bg-ivory-soft shadow-[0_32px_64px_-24px_rgba(0,0,0,0.5)]">
                <div className="text-eyebrow mb-4">Real client · Construction</div>
                <div className="text-display-sm leading-snug text-ink">
                  Buildcare Interiors
                </div>
                <p className="text-slate text-sm mt-2">From manual referrals to a real digital lead pipeline.</p>
                <div className="mt-8 space-y-3">
                  {[
                    ['Website', 'No presence → Modern business site'],
                    ['Leads', 'Manual referrals → Online inquiry system'],
                    ['Visibility', 'Local referrals → Strong online presence'],
                    ['Mobile', 'Not optimized → Fully responsive'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 text-mono text-xs border-b border-hairline pb-2">
                      <span className="text-slate shrink-0">{k}</span>
                      <span className="text-ink text-right">{v}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/case-studies/building-a-digital-presence-that-generates-qualified-construction-leads"
                  className="mt-8 pt-6 border-t border-hairline text-xs text-ultra hover:text-ink transition-colors flex items-center gap-2 link-underline w-fit"
                >
                  Read the full case study <ArrowUpRight size={12} strokeWidth={1.5} />
                </Link>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Solutions, not services — outcome-led, industry-specific positioning */}
      <SolutionsNotServices />

      {/* Brand story */}
      <BrandStory />

      {/* How we work — Problem → Diagnosis → Evidence → Strategy → Solution → Outcome */}
      <HowWeWork />

      {/* Services */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="flex items-end justify-between mb-14 gap-8 flex-wrap">
            <div>
              <Eyebrow number="04">Services</Eyebrow>
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
