import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Briefcase,
  PackageCheck,
  TrendingUp,
  Clock,
  ShieldAlert,
  TrendingDown,
  AlertTriangle,
  Search,
  Tags,
  Lock,
  UserCheck,
  MessageSquareText,
  Zap,
  Users,
  BadgeCheck,
  Landmark,
  Gauge,
  ShieldCheck,
  Accessibility,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';

/* ============================================================
 * Brand palette for this page only — a deliberately more corporate,
 * enterprise-facing navy/gold system, distinct from the site's default
 * editorial blue accent. Used as literal hex values (not the shared design
 * tokens) because this section's audience (agency owners evaluating a
 * fulfillment partner) and tone call for a different visual register.
 * ============================================================ */
const NAVY = '#0A2342';
const NAVY_SOFT = '#123059';
const GOLD = '#D4AF37';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

/* ------------------------------------------------------------------ */
/* The problem — icon-led pain points agencies actually recognize      */
/* ------------------------------------------------------------------ */
const PROBLEMS = [
  {
    icon: Clock,
    title: 'You win the client — the deadline slips.',
    desc: 'Your sales team closes the deal. Then delivery takes twice as long as promised, and the client relationship absorbs the damage.',
  },
  {
    icon: ShieldAlert,
    title: 'You hire a freelancer — the quality is a gamble.',
    desc: 'Every new contractor is a fresh unknown. Inconsistent code, inconsistent communication, inconsistent results — on your brand, not theirs.',
  },
  {
    icon: TrendingDown,
    title: 'You staff up for one project — then pay idle salaries.',
    desc: 'Hiring full-time for peak demand means carrying that headcount through every slow month that follows.',
  },
  {
    icon: AlertTriangle,
    title: 'Overflow work becomes a support burden.',
    desc: 'What should be a profit center — extra client work — quietly turns into hours of your own time spent managing instead of selling.',
  },
];

/* ------------------------------------------------------------------ */
/* Strategy — the actual workflow                                     */
/* ------------------------------------------------------------------ */
const WORKFLOW = [
  {
    icon: Briefcase,
    step: '01',
    title: 'Agency wins client',
    desc: 'You handle the relationship, the sale, and the brand. Your client never needs to know who’s behind the build.',
  },
  {
    icon: PackageCheck,
    step: '02',
    title: 'MetlifeDM delivers',
    desc: 'Our senior team builds, ships, and QA’s the work under NDA — websites, SEO, maintenance, and digital solutions — reporting to you, not your client.',
  },
  {
    icon: TrendingUp,
    step: '03',
    title: 'Agency grows',
    desc: 'You take on more clients and bigger scopes without adding headcount, training time, or management overhead.',
  },
];

/* ------------------------------------------------------------------ */
/* Solution — trust factors                                           */
/* ------------------------------------------------------------------ */
const TRUST_FACTORS = [
  { icon: Tags, title: 'White-Label Delivery', desc: 'Every deliverable, every report, every touchpoint — under your brand, never ours.' },
  { icon: Lock, title: 'NDA Protection', desc: 'Signed before a single file is shared. Your client relationships stay entirely yours.' },
  { icon: UserCheck, title: 'Dedicated Project Manager', desc: 'One point of contact who knows your account — not a rotating queue of strangers.' },
  { icon: MessageSquareText, title: 'Transparent Communication', desc: 'Real-time status, no black boxes. You always know exactly where a project stands.' },
  { icon: Zap, title: 'Fast Turnaround', desc: 'Built for agency timelines — clear SLAs, not "we’ll get to it eventually."' },
  { icon: Users, title: 'Scalable Team', desc: 'Take on one project or twenty. Our capacity flexes with your pipeline, not the other way around.' },
  { icon: BadgeCheck, title: 'Quality Assurance', desc: 'Every project is reviewed by SYSTOLAB™ before handoff — see below.' },
  { icon: Landmark, title: 'US Registered Company', desc: 'MetlifeDM LLC is a registered US business — a real, accountable legal entity, not an offshore unknown.' },
];

/* ------------------------------------------------------------------ */
/* SYSTOLAB — proprietary QA engine                                   */
/* ------------------------------------------------------------------ */
const SYSTOLAB_CHECKS = [
  { icon: Gauge, title: 'Technical Performance', desc: 'Load speed, Core Web Vitals, and code quality benchmarked before anything ships.' },
  { icon: Search, title: 'SEO Readiness', desc: 'Technical SEO, metadata, and structured data verified — every page indexable and correctly built.' },
  { icon: ShieldCheck, title: 'Security', desc: 'Dependency, auth, and vulnerability checks so you never hand your client a liability.' },
  { icon: Accessibility, title: 'Accessibility', desc: 'WCAG-aligned checks so the work holds up for every visitor, not just the average one.' },
  { icon: CheckCircle2, title: 'Delivery Quality', desc: 'A final review against the original brief — nothing reaches your client half-finished.' },
];

export default function PartnersPage() {
  return (
    <>
      <Seo
        title="White-Label Digital Delivery Partner for Agencies"
        description="MetlifeDM is the white-label delivery partner for marketing, web, SEO, and branding agencies — websites, SEO, and maintenance delivered under your brand, reviewed by our SYSTOLAB QA engine, backed by NDA."
        keywords="white label web development, white label SEO agency, white label digital marketing partner, agency fulfillment partner, outsourced web development for agencies"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'White-Label Digital Delivery Partnership',
          serviceType: 'White-label web development, SEO, and digital marketing fulfillment',
          description:
            'MetlifeDM delivers websites, SEO, maintenance, and digital solutions under partner agencies’ own brand, backed by NDA, a dedicated project manager, and the SYSTOLAB quality assurance engine.',
          provider: { '@type': 'Organization', name: 'MetlifeDM LLC', url: 'https://metlifedm.com' },
          areaServed: 'US',
          audience: {
            '@type': 'Audience',
            audienceType: 'Digital marketing agencies, web design agencies, SEO agencies, branding agencies, software companies',
          },
        }}
      />

      {/* ============================================================ */}
      {/* HERO / COVER                                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: NAVY }}>
        {/* Ambient glow accents — the glassmorphism backdrop */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-20 blur-3xl" style={{ background: GOLD }} />
        <div className="pointer-events-none absolute -bottom-52 -left-40 w-[30rem] h-[30rem] rounded-full opacity-10 blur-3xl" style={{ background: '#FFFFFF' }} />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <Container className="relative z-10 pt-36 pb-28 md:pt-44 md:pb-36">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-widest font-medium backdrop-blur-md"
              style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid ${GOLD}55`, color: GOLD }}
            >
              For agencies · White-label delivery partner
            </div>

            <h1 className="mt-8 text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white max-w-4xl">
              Scale your agency.
              <br />
              <span style={{ color: GOLD }}>Not your payroll.</span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
              MetlifeDM delivers websites, SEO, maintenance, and digital solutions under <em className="not-italic text-white">your</em> brand
              — so you can say yes to more clients without hiring, training, or managing an in-house production team.
            </p>

            <div className="mt-6 text-sm uppercase tracking-[0.2em] font-medium" style={{ color: GOLD }}>
              Evidence. Strategy. Sustainable Growth.
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-5">
              <Button
                to="/consultation"
                size="lg"
                className="!text-[#0A2342] hover:!-translate-y-0.5"
                style={{ background: GOLD }}
              >
                Become a delivery partner <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-white/80 hover:text-white transition-colors link-underline"
              >
                See how it works
              </a>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-4 pt-8 border-t border-white/10 text-white/60 text-xs uppercase tracking-widest">
              <span className="flex items-center gap-2"><Lock size={14} strokeWidth={1.5} style={{ color: GOLD }} /> NDA-protected</span>
              <span className="flex items-center gap-2"><Landmark size={14} strokeWidth={1.5} style={{ color: GOLD }} /> US-registered company</span>
              <span className="flex items-center gap-2"><Tags size={14} strokeWidth={1.5} style={{ color: GOLD }} /> Always white-label</span>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ============================================================ */}
      {/* COVER STATEMENT — the reframed question                      */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="md">
        <Container>
          <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
            <h2 className="text-display-lg">Every agency hits the same growth problem.</h2>
            <p className="text-slate text-xl mt-8 leading-relaxed">
              The right question isn&apos;t &ldquo;which freelancer should I hire next?&rdquo;
            </p>
            <p className="text-2xl md:text-3xl mt-4 text-italic-fraunces text-ink leading-snug">
              It&apos;s: &ldquo;What&apos;s actually stopping me from delivering more, without burning out my team?&rdquo;
            </p>
            <p className="text-slate text-lg mt-8 max-w-xl mx-auto leading-relaxed">
              At MetlifeDM, we diagnose the delivery bottleneck before proposing a partnership.
            </p>
          </motion.div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* THE PROBLEM                                                   */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <Eyebrow number="01">The problem</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Most agencies don&apos;t know why<br />
              <span className="text-italic-fraunces text-ultra">delivery is the bottleneck.</span>
            </h2>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2">
            {PROBLEMS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="border border-hairline hover:border-ink hover-lift transition-colors duration-500 p-8"
              >
                <div className="w-12 h-12 grid place-items-center mb-6" style={{ background: NAVY }}>
                  <p.icon size={20} strokeWidth={1.5} style={{ color: GOLD }} />
                </div>
                <h3 className="text-display-sm mb-3">{p.title}</h3>
                <p className="text-slate text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* EVIDENCE — real rigor, not fabricated testimonials            */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <motion.div {...fadeUp}>
              <Eyebrow number="02">The evidence</Eyebrow>
              <h2 className="text-display-lg mt-4">
                Most agencies aren&apos;t short on clients.<br />
                <span className="text-italic-fraunces text-ultra">They&apos;re short on capacity.</span>
              </h2>
              <p className="text-slate text-lg mt-6 leading-relaxed">
                The pattern shows up the same way across every agency we talk to: pipeline is healthy, sales are
                closing — and delivery is the constraint. A lean, senior-only team and a defined QA process solve
                a capacity problem that hiring alone can&apos;t, without the fixed cost of full-time headcount.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="border p-8 md:p-10"
              style={{ borderColor: `${NAVY}22`, background: `${NAVY}05` }}
            >
              <Quote size={28} style={{ color: GOLD }} />
              <p className="text-xl mt-6 text-italic-fraunces leading-snug text-ink">
                We built MetlifeDM to be the delivery layer agencies don&apos;t have to build themselves.
              </p>
              <div className="mt-8 pt-6 border-t border-hairline grid grid-cols-2 gap-6">
                <div>
                  <div className="text-display-sm num-plate">2–10</div>
                  <div className="text-mono text-xs uppercase tracking-widest text-slate mt-1">Senior team, no juniors</div>
                </div>
                <div>
                  <div className="text-display-sm num-plate">10+</div>
                  <div className="text-mono text-xs uppercase tracking-widest text-slate mt-1">Real projects delivered</div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* STRATEGY — the workflow                                       */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg" id="how-it-works">
        <Container>
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
            <Eyebrow number="03" className="justify-center">The strategy</Eyebrow>
            <h2 className="text-display-lg mt-4">
              How the partnership <span className="text-italic-fraunces text-ultra">actually works.</span>
            </h2>
          </motion.div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line — desktop only */}
            <div className="hidden md:block absolute top-9 left-[16.5%] right-[16.5%] h-px bg-hairline" />
            {WORKFLOW.map((w, i) => (
              <motion.div
                key={w.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative text-center"
              >
                <div
                  className="relative z-10 mx-auto w-[4.5rem] h-[4.5rem] rounded-full grid place-items-center shadow-[0_16px_32px_-12px_rgba(10,35,66,0.35)]"
                  style={{ background: NAVY }}
                >
                  <w.icon size={26} strokeWidth={1.5} style={{ color: GOLD }} />
                </div>
                <div className="num-plate text-slate text-xs mt-6">{w.step}</div>
                <h3 className="text-display-sm mt-2">{w.title}</h3>
                <p className="text-slate text-sm mt-3 max-w-xs mx-auto leading-relaxed">{w.desc}</p>
                {i < WORKFLOW.length - 1 && (
                  <ArrowUpRight
                    size={18}
                    strokeWidth={1.5}
                    className="hidden md:block absolute top-7 -right-4 rotate-45"
                    style={{ color: GOLD }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* SOLUTION — trust factors grid                                 */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <Eyebrow number="04">The solution</Eyebrow>
            <h2 className="text-display-lg mt-4">
              Everything you need to hand off<br />
              <span className="text-italic-fraunces text-ultra">with total confidence.</span>
            </h2>
          </motion.div>
          <div className="grid gap-px bg-hairline border border-hairline sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_FACTORS.map((t, i) => (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="group bg-ivory hover:bg-[#0A2342] p-8 transition-colors duration-500"
              >
                <t.icon size={22} strokeWidth={1.5} className="text-ink group-hover:text-[#D4AF37] transition-colors duration-500" />
                <h3 className="text-base font-medium mt-5 text-ink group-hover:text-white transition-colors duration-500">{t.title}</h3>
                <p className="text-slate text-sm mt-2 leading-relaxed group-hover:text-white/70 transition-colors duration-500">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============================================================ */}
      {/* SYSTOLAB INTELLIGENCE ENGINE                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: NAVY }}>
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] rounded-full opacity-[0.08] blur-3xl" style={{ background: GOLD }} />
        <Section tone="ink" spacing="lg" divider={false} className="!bg-transparent relative z-10">
          <Container>
            <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-medium backdrop-blur-md mx-auto"
                style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid ${GOLD}55`, color: GOLD }}
              >
                Proprietary quality engine
              </div>
              <h2 className="text-display-lg mt-6 text-white">
                Every project passes through <span style={{ color: GOLD }}>SYSTOLAB™</span> before it reaches your client.
              </h2>
              <p className="text-white/70 text-lg mt-6 leading-relaxed">
                SYSTOLAB is our internal quality assurance engine — a fixed checklist every deliverable is measured
                against before handoff, so &ldquo;good enough&rdquo; never becomes your client&apos;s problem.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {SYSTOLAB_CHECKS.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: (i % 5) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="p-6 backdrop-blur-md rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <c.icon size={18} strokeWidth={1.5} style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-white text-sm font-medium mt-5">{c.title}</h3>
                  <p className="text-white/60 text-xs mt-2 leading-relaxed">{c.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-14 flex items-center justify-center gap-3 text-sm"
              style={{ color: GOLD }}
            >
              <CheckCircle2 size={16} strokeWidth={1.5} />
              Nothing ships to your client without a passing SYSTOLAB review.
            </motion.div>
          </Container>
        </Section>
      </section>

      {/* ============================================================ */}
      {/* OUTCOME — final CTA                                           */}
      {/* ============================================================ */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden p-10 md:p-16 lg:p-24 text-center"
            style={{ background: NAVY_SOFT }}
          >
            <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: GOLD }} />
            <Eyebrow number="05" light className="justify-center relative z-10">The outcome</Eyebrow>
            <h2 className="text-display-hero mt-6 text-white relative z-10 max-w-3xl mx-auto">
              Stop outsourcing. <span style={{ color: GOLD }}>Start partnering.</span>
            </h2>
            <p className="text-white/70 text-lg mt-8 max-w-xl mx-auto leading-relaxed relative z-10">
              A vendor delivers a project and disappears. A partner grows with you — same team, same standards,
              every time you say yes to a new client. That&apos;s the relationship we&apos;re built for.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-4 relative z-10">
              <Button
                to="/consultation"
                size="lg"
                className="!text-[#0A2342] hover:!-translate-y-0.5"
                style={{ background: GOLD }}
              >
                Become a long-term partner <ArrowUpRight size={16} strokeWidth={1.5} />
              </Button>
              <Button to="/contact" variant="ghost" size="lg" className="!border-white/30 !text-white hover:!bg-white hover:!text-[#0A2342]">
                Ask us a question
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
