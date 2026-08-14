import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  MessageCircle, MessageSquareText, Send, CalendarCheck, Star, ClipboardList, Mail, Repeat, Database, Headphones,
  Search, Palette, Hammer, ServerCog, RefreshCw,
} from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney } from '@/utils/format.js';

/* ---- Customer Operations ---- */
const OPERATIONS = [
  { icon: MessageCircle, label: 'WhatsApp Management' },
  { icon: MessageSquareText, label: 'Customer Enquiries' },
  { icon: Send, label: 'Lead Follow-Up' },
  { icon: CalendarCheck, label: 'Appointment & Booking' },
  { icon: Star, label: 'Reviews' },
  { icon: ClipboardList, label: 'Feedback' },
  { icon: Mail, label: 'After-Sales' },
  { icon: Repeat, label: 'Retention' },
  { icon: Database, label: 'CRM' },
  { icon: Headphones, label: 'Customer Support' },
];

/* ---- How We Build It ---- */
const BUILD_STAGES = [
  { icon: Search, label: 'Understand' },
  { icon: Palette, label: 'Design' },
  { icon: Hammer, label: 'Implement' },
  { icon: ServerCog, label: 'Operate' },
  { icon: RefreshCw, label: 'Improve' },
];

/* ---- Pricing factors ---- */
const PRICING_FACTORS = [
  'Conversation volume', 'Agents', 'Working hours', 'Platforms',
  'Response requirements', 'CRM', 'Follow-up volume', 'After-sales requirements',
];

export default function CustomerServicePage() {
  return (
    <>
      <Seo
        title="Customer Service — Built Around Your Business"
        description="MetlifeDM designs and runs the customer service operation your business needs — WhatsApp, enquiries, follow-up, booking, reviews, retention, and CRM — starting from $199/month."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Customer Service',
          serviceType: 'Customer service operations',
          description: 'A custom-built customer service operation covering WhatsApp management, enquiries, follow-up, booking, reviews, retention, and CRM.',
          provider: { '@type': 'Organization', name: 'MetlifeDM LLC', url: 'https://metlifedm.com' },
          areaServed: 'US',
          offers: { '@type': 'Offer', price: 199, priceCurrency: 'USD' },
        }}
      />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80&auto=format&fit=crop"
          alt="A customer service operation running smoothly"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Customer Service</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Built around <span className="text-italic-fraunces text-ultra-soft">your business.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Your customers. Your requirements. Your system. We design and run the exact customer service operation
            your business needs — so no lead goes cold waiting on a reply.
          </p>
          <Button to="/consultation" size="lg" variant="inverse" className="mt-10">
            Design My Customer Service <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* CUSTOMER OPERATIONS                                           */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <Eyebrow className="justify-center">Customer operations</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Every touchpoint, <span className="text-italic-fraunces text-ultra">covered.</span>
            </h2>
          </motion.div>

          <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2 lg:grid-cols-5">
            {OPERATIONS.map((o, i) => (
              <motion.div
                key={o.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="bg-ivory p-6 flex flex-col items-center text-center gap-3"
              >
                <div className="w-10 h-10 grid place-items-center bg-ink text-ivory">
                  <o.icon size={16} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium leading-snug">{o.label}</span>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* HOW WE BUILD IT                                               */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <Eyebrow light className="justify-center">How we build it</Eyebrow>
            <h2 className="text-display-lg mt-4 text-ivory">
              A system, <span className="text-italic-fraunces text-ultra-soft">not a bolt-on.</span>
            </h2>
          </motion.div>

          <div className="mt-16 max-w-md mx-auto">
            {BUILD_STAGES.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="flex items-center gap-5 py-4">
                  <div className="w-11 h-11 shrink-0 grid place-items-center rounded-full bg-ivory/5 border border-ivory/15 text-ultra-soft">
                    <stage.icon size={18} strokeWidth={1.5} />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="num-plate text-ivory/30 text-xs">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-ivory text-lg">{stage.label}</span>
                  </div>
                </div>
                {i < BUILD_STAGES.length - 1 && (
                  <div className="pl-[1.375rem]">
                    <div className="w-px h-6 bg-ivory/15" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* PRICING                                                       */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl mx-auto text-center"
          >
            <Eyebrow className="justify-center">Pricing</Eyebrow>
            <div className="mt-6 flex items-baseline justify-center gap-2">
              <span className="text-display-md num-plate">{formatMoney(199)}</span>
              <span className="text-mono text-xs uppercase text-slate">/ month, starting from</span>
            </div>
            <div className="mt-8 pt-8 border-t border-hairline">
              <div className="text-mono text-xs uppercase tracking-widest text-slate mb-4">Custom based on</div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {PRICING_FACTORS.map((f) => (
                  <span key={f} className="px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-slate border border-hairline">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* CTA                                                           */}
      {/* ============================================================ */}
      <Section tone="ink" spacing="lg" divider={false}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="border border-ivory/15 bg-ivory/5 p-10 md:p-16 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-display-lg text-ivory">
              Design my <span className="text-italic-fraunces text-ultra-soft">customer service.</span>
            </h2>
            <p className="text-ivory/65 text-lg mt-6 max-w-lg mx-auto leading-relaxed">
              Tell us how your customers actually reach you — we&apos;ll design the system around it.
            </p>
            <Button to="/consultation" size="lg" variant="inverse" className="mt-10">
              Design My Customer Service <ArrowUpRight size={16} strokeWidth={1.5} />
            </Button>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
