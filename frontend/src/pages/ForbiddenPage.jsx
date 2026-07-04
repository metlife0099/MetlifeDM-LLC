import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowUpRight, Home } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';

export default function ForbiddenPage() {
  return (
    <>
      <Seo title="403 — Forbidden" noindex />
      <Section tone="ivory" spacing="xl" divider={false}>
        <Container className="max-w-3xl text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 grid place-items-center bg-ultra-tint rounded-full mx-auto mb-8"
          >
            <ShieldAlert size={36} strokeWidth={1.25} className="text-ultra" />
          </motion.div>

          <Eyebrow>Error / 403</Eyebrow>
          <h1 className="text-display-hero mt-6">
            Access <span className="text-italic-fraunces text-ultra">denied.</span>
          </h1>
          <p className="text-slate text-lg mt-8 max-w-xl mx-auto leading-relaxed">
            You&apos;re signed in, but this area requires additional permissions. If you think this is a mistake, get in touch with your account admin — or us.
          </p>

          <div className="mt-12 flex gap-3 justify-center flex-wrap">
            <Button to="/dashboard" size="lg">
              <Home size={16} strokeWidth={1.5} />
              Go to dashboard
            </Button>
            <Button to="/contact" variant="ghost" size="lg">
              Contact us <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
