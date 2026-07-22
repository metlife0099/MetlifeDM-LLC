import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner, ServicesGrid } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

// Each row's node color and the card reveal are self-contained whileInView
// triggers (no shared scroll-progress state) — that keeps the animation
// reliable regardless of when this section actually mounts relative to the
// page's data-loading state.
// The rail width is a single shared constant (in both the row's icon column
// and the track's line wrapper below) so the line and every node are
// guaranteed to share the same center line — no separate pixel offsets to
// keep in sync.
const RAIL_WIDTH = 'w-14'; // 3.5rem / 56px, matches the node's own w-14 h-14

// The node uses Framer Motion's variant-propagation instead of its own
// separate whileInView/viewport trigger: two independent IntersectionObservers
// (one on the row, one on the small node) don't reliably agree on when they've
// "entered" — the node inherits the row's single hidden/visible state instead,
// so the color change is driven by the exact same trigger as the row's reveal.
const rowVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const nodeVariants = {
  hidden: { backgroundColor: '#a8b0c0' },
  visible: { backgroundColor: '#0a1730', transition: { duration: 0.5, delay: 0.2 } },
};

function ChallengeRow({ challenge: c, index: i }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={rowVariants}
      className="relative flex items-center gap-6 md:gap-8 py-6 lg:py-8"
    >
      {/* Node — centered in the same-width column the rail line runs through */}
      <div className={`relative z-10 shrink-0 ${RAIL_WIDTH} flex justify-center`}>
        <motion.div
          variants={nodeVariants}
          className="w-14 h-14 grid place-items-center text-ivory rounded-full border-4 border-ivory shadow-[0_8px_24px_-8px_rgba(10,23,48,0.35)]"
        >
          <AlertCircle size={20} strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* Content — always to the right of the line */}
      <div className="group flex-1 min-w-0">
        <div className="border border-hairline hover:border-ink hover-lift transition-colors duration-500 bg-white p-6 md:p-8">
          <div className="num-plate text-slate text-xs mb-2">{String(i + 1).padStart(2, '0')}</div>
          <h3 className="text-display-sm group-hover:text-ultra transition-colors duration-300">{c.title}</h3>
          {c.description && <p className="text-slate text-sm mt-3 leading-relaxed">{c.description}</p>}
        </div>
      </div>
    </motion.div>
  );
}

export default function IndustryDetailsPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['industry', slug],
    queryFn: () => contentApi.getIndustryBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="grid place-items-center min-h-[60vh]"><Spinner size={32} className="text-ultra" /></div>;
  }
  if (error || !data?.industry) {
    return (
      <Section spacing="xl">
        <Container>
          <Eyebrow>404 / Not found</Eyebrow>
          <h1 className="text-display-lg mt-4">Industry not found</h1>
          <Link to="/industries" className="mt-8 inline-block link-underline text-ink">← All industries</Link>
        </Container>
      </Section>
    );
  }

  const ind = data.industry;
  const relatedCases = data.relatedCaseStudies || [];
  const recommendedServices = data.recommendedServices || [];

  return (
    <>
      <Seo title={ind.name} description={ind.shortDescription} image={ind.heroImage?.url} />

      {/* Hero */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src={ind.heroImage?.url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80&auto=format&fit=crop'}
          alt={ind.name}
        />
        <Container className="relative z-10">
          <Link to="/industries" className="text-mono text-xs uppercase tracking-widest text-ivory/60 hover:text-ivory link-underline">
            ← All industries
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {ind.icon && (
              <div className="text-5xl mt-8 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]">{ind.icon}</div>
            )}
            <Eyebrow number="00" light className="mt-6">Industry / {ind.name}</Eyebrow>
            <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
              {ind.name}<br />
              <span className="text-italic-fraunces text-ultra-soft">marketing.</span>
            </h1>
            {ind.shortDescription && (
              <p className="text-ivory/75 text-lg mt-8 max-w-2xl leading-relaxed">{ind.shortDescription}</p>
            )}
          </motion.div>

          {/* Stats strip */}
          {ind.stats?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-14 flex flex-wrap gap-x-10 gap-y-6 border-t border-ivory/15 pt-8"
            >
              {ind.stats.map((s, i) => (
                <div key={i}>
                  <div className="text-display-md num-plate text-ivory">{s.value}</div>
                  <div className="text-mono text-xs uppercase tracking-widest text-ivory/50 mt-2">{s.label}</div>
                </div>
              ))}
            </motion.div>
          )}
        </Container>
      </Section>

      {/* Description */}
      {ind.description && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <motion.div {...fadeUp}>
              <Eyebrow number="01">Overview</Eyebrow>
              <div
                className="prose prose-lg max-w-3xl text-lg text-slate leading-relaxed mt-6"
                dangerouslySetInnerHTML={{ __html: ind.description }}
              />
            </motion.div>
          </Container>
        </Section>
      )}

      {/* Challenges — animated scroll timeline */}
      {ind.challenges?.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
              <Eyebrow number="02" className="justify-center">Challenges</Eyebrow>
              <h2 className="text-display-lg mt-4">
                What we hear<br />
                <span className="text-italic-fraunces text-ultra">most often.</span>
              </h2>
            </motion.div>

            <div className="relative">
              <div className={`absolute inset-y-0 left-0 ${RAIL_WIDTH} flex justify-center`}>
                <div className="w-px h-full bg-hairline" />
              </div>
              <motion.div
                initial={{ height: '0%' }}
                whileInView={{ height: '100%' }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                className={`absolute top-0 left-0 ${RAIL_WIDTH} flex justify-center origin-top`}
              >
                <div className="w-px h-full bg-ink shadow-[0_0_10px_1px_rgba(10,23,48,0.35)]" />
              </motion.div>
              <div>
                {ind.challenges.map((c, i) => (
                  <ChallengeRow key={i} challenge={c} index={i} />
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Solutions / Approach */}
      {ind.solutions?.length > 0 && (
        <Section tone="ink" spacing="lg" divider={false}>
          <Container>
            <motion.div {...fadeUp}>
              <div className="text-eyebrow text-ivory/50 mb-4">03 / Our approach</div>
              <h2 className="text-display-lg text-ivory mb-14">
                How we <span className="text-italic-fraunces text-ultra-soft">solve them.</span>
              </h2>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2">
              {ind.solutions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="border border-ivory/15 hover:border-ivory/40 transition-colors duration-500 p-8"
                >
                  <div className="w-8 h-8 grid place-items-center bg-ultra rounded-full mb-6 text-lg">
                    {s.icon || <Check size={16} strokeWidth={2} className="text-ivory" />}
                  </div>
                  <h3 className="text-display-sm text-ivory mb-3">{s.title}</h3>
                  {s.description && (
                    <p className="text-ivory/70 leading-relaxed">{s.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Recommended services */}
      {recommendedServices.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <motion.div {...fadeUp} className="flex items-end justify-between mb-10 gap-6 flex-wrap">
              <div>
                <Eyebrow number="04">Recommended services</Eyebrow>
                <h2 className="text-display-lg mt-4">
                  Where we start.
                </h2>
              </div>
              <Link to="/services" className="text-mono text-xs uppercase tracking-widest link-underline text-ink">
                All services →
              </Link>
            </motion.div>
            <ServicesGrid services={recommendedServices} showAll={false} />
          </Container>
        </Section>
      )}

      {/* Related case studies */}
      {relatedCases.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <motion.div {...fadeUp} className="flex items-end justify-between mb-10 gap-6 flex-wrap">
              <div>
                <Eyebrow number="05">Case studies</Eyebrow>
                <h2 className="text-display-lg mt-4">Related work.</h2>
              </div>
              <Link to="/case-studies" className="text-mono text-xs uppercase tracking-widest link-underline text-ink">
                All case studies →
              </Link>
            </motion.div>
            <div className="divide-editorial border-t border-hairline">
              {relatedCases.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
                >
                  <Link
                    to={`/case-studies/${c.slug}`}
                    className="py-8 grid grid-cols-[auto_1fr_auto] gap-6 items-center group"
                  >
                    <span className="num-plate text-slate text-sm">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-display-sm group-hover:text-ultra transition-colors">{c.title}</h3>
                      {c.summary && <p className="text-slate text-sm mt-2 max-w-xl">{c.summary}</p>}
                    </div>
                    <ArrowUpRight size={20} strokeWidth={1.25} className="group-hover:rotate-45 transition-transform duration-300" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner
        title={<>Ready to grow your <span className="text-italic-fraunces text-ultra">{ind.name}</span> business?</>}
      />
    </>
  );
}
