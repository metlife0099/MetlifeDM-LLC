import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Home } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';

export default function NotFoundPage() {
  return (
    <>
      <Seo title="404 — Not found" noindex />
      <Section tone="ivory" spacing="xl" divider={false}>
        <Container className="max-w-4xl">
          <Eyebrow number="404">Error / Page not found</Eyebrow>

          {/* Massive display 404 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 leading-none"
          >
            <div
              className="num-plate text-ink"
              style={{ fontSize: 'clamp(120px, 25vw, 340px)', lineHeight: 0.85, letterSpacing: '-0.05em' }}
            >
              404
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <h1 className="text-display-hero mt-10">
              Page not <span className="text-italic-fraunces text-ultra">found.</span>
            </h1>
            <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">
              The URL you followed doesn&apos;t exist or has moved. If you got here from a link on our site, please{' '}
              <Link to="/contact" className="link-underline text-ink">let us know</Link>.
            </p>

            <div className="mt-12 flex gap-3 flex-wrap">
              <Button to="/" size="lg">
                <Home size={16} strokeWidth={1.5} />
                Go home
              </Button>
              <Button to="/services" variant="ghost" size="lg">
                Browse services <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <Button to="/contact" variant="ghost" size="lg">
                Get help
              </Button>
            </div>

            {/* Quick links */}
            <div className="mt-20 pt-10 border-t border-hairline">
              <div className="text-eyebrow mb-6">Or try one of these</div>
              <div className="grid gap-6 md:grid-cols-4 text-mono text-xs uppercase tracking-widest">
                {[
                  { label: 'Case studies', href: '/case-studies' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'FAQ', href: '/faq' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    to={l.href}
                    className="border-t border-hairline pt-4 hover:text-ultra transition-colors group flex items-start justify-between"
                  >
                    {l.label}
                    <ArrowUpRight
                      size={12}
                      strokeWidth={1.25}
                      className="group-hover:rotate-45 transition-transform"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
