import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
  CheckCircle,
} from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Input, Textarea, Select } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';

const PHONE_US = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

/* ============================================================
 * Brand palette for this page only — a deliberately more corporate,
 * enterprise-facing navy/blue system, distinct from the site's default
 * editorial ink/ultra tokens. Used as literal hex values because this
 * section's audience (agency owners evaluating a fulfillment partner)
 * and tone call for a slightly different visual register — ACCENT matches
 * the site's own --color-ultra so it still reads as "on-brand".
 * ============================================================ */
const NAVY = '#0A2342';
const NAVY_SOFT = '#123059';
const ACCENT = '#1547FF';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

/* In-page sub-navigation — clicking scrolls to the matching section */
const SUB_NAV = [
  { id: 'problem', label: 'The Problem' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'trust-factors', label: 'Why Partner With Us' },
  { id: 'systolab', label: 'SYSTOLAB™' },
  { id: 'apply', label: 'Apply Now' },
];

/* ------------------------------------------------------------------ */
/* Application form                                                    */
/* ------------------------------------------------------------------ */
const AGENCY_TYPES = [
  { value: '', label: 'Select agency type…' },
  { value: 'marketing_agency', label: 'Digital Marketing Agency' },
  { value: 'web_design_agency', label: 'Web Design Agency' },
  { value: 'seo_agency', label: 'SEO Agency' },
  { value: 'branding_agency', label: 'Branding Agency' },
  { value: 'software_company', label: 'Software Company' },
  { value: 'other', label: 'Other' },
];
const VOLUME_OPTIONS = [
  { value: '', label: 'Select volume…' },
  { value: '1-2', label: '1–2 projects / month' },
  { value: '3-5', label: '3–5 projects / month' },
  { value: '6-10', label: '6–10 projects / month' },
  { value: '10+', label: '10+ projects / month' },
];
const SERVICES_NEEDED_OPTIONS = [
  { value: 'websites', label: 'Websites' },
  { value: 'seo', label: 'SEO' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'branding', label: 'Branding' },
  { value: 'other', label: 'Other' },
];

const partnerFormSchema = z.object({
  firstName: z.string().trim().min(2, 'At least 2 characters'),
  lastName: z.string().trim().min(2, 'At least 2 characters'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().regex(PHONE_US, 'Enter a valid US phone number').optional().or(z.literal('')),
  company: z.string().trim().min(2, 'Agency / company name is required'),
  website: z.string().optional().or(z.literal('')),
  agencyType: z.string().min(1, 'Please select an agency type'),
  monthlyProjectVolume: z.string().optional(),
  servicesNeeded: z.array(z.string()).optional(),
  message: z.string().max(3000).optional().or(z.literal('')),
});

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
  const [activeSection, setActiveSection] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: { servicesNeeded: [] },
  });
  const servicesNeeded = watch('servicesNeeded') || [];

  const mutation = useMutation({
    mutationFn: leadsApi.submitPartnerInquiry,
    onSuccess: () => {
      toast.success("Application received — we'll review it and reply within 1-2 business days.");
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const onSubmit = (data) => {
    const payload = { ...data };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') delete payload[key];
    });
    mutation.mutate(payload);
  };

  const toggleServiceNeeded = (val) => {
    const next = servicesNeeded.includes(val)
      ? servicesNeeded.filter((s) => s !== val)
      : [...servicesNeeded, val];
    setValue('servicesNeeded', next);
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll-spy — highlights whichever sub-nav section is currently in view.
  useEffect(() => {
    const sections = SUB_NAV.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
      <section className="relative" style={{ backgroundColor: NAVY }}>
        {/* Background photo — bleeds up behind the floating header (same
            -top-20 technique the shared HeroImage component uses elsewhere),
            dimmed and tinted navy so text stays legible. */}
        <div className="absolute -top-20 inset-x-0 bottom-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=1920&q=80&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 h-full w-full object-cover "
          />
          <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, ${NAVY} 40%, ${NAVY}cc 65%, ${NAVY}66 100%)` }} />
        </div>

        {/* IN-PAGE SUB-NAV — lives inside the hero (so it never has to sit as
            a solid block directly under the transparent floating header),
            sticky so it's visible immediately and then pins in place once
            scrolled past. Solid navy always, so it reads equally well once
            it's stuck over the lighter sections further down the page. */}
        <div className="sticky top-20 z-40" style={{ background: NAVY, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Container>
            <nav className="flex items-center gap-1 overflow-x-auto py-3 no-scrollbar">
              {SUB_NAV.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className="relative shrink-0 px-4 py-2 text-xs font-medium uppercase tracking-widest rounded-full transition-colors duration-300 whitespace-nowrap"
                  style={
                    activeSection === s.id
                      ? { background: 'rgba(21,71,255,0.15)', color: ACCENT }
                      : { color: 'rgba(255,255,255,0.55)' }
                  }
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </Container>
        </div>

        <Container className="relative z-10 pt-14 pb-24 md:pt-16 md:pb-28">
          <div className="grid gap-16 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-widest font-medium backdrop-blur-md"
                style={{ background: 'rgba(21,71,255,0.1)', border: `1px solid ${ACCENT}55`, color: ACCENT }}
              >
                For agencies · White-label delivery partner
              </div>

              <h1 className="mt-8 text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-[4.5rem] font-semibold tracking-tight text-white">
                Scale your agency.
                <br />
                <span style={{ color: ACCENT }}>Not your payroll.</span>
              </h1>

              <p className="mt-8 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
                MetlifeDM delivers websites, SEO, maintenance, and digital solutions under <em className="not-italic text-white">your</em> brand
                — so you can say yes to more clients without hiring, training, or managing an in-house production team.
              </p>

              <div className="mt-6 text-sm uppercase tracking-[0.2em] font-medium" style={{ color: ACCENT }}>
                Evidence. Strategy. Sustainable Growth.
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-5">
                <Button
                  to="/consultation"
                  size="lg"
                  className="text-white! hover:-translate-y-0.5!"
                  style={{ background: ACCENT }}
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
                <span className="flex items-center gap-2"><Lock size={14} strokeWidth={1.5} style={{ color: ACCENT }} /> NDA-protected</span>
                <span className="flex items-center gap-2"><Landmark size={14} strokeWidth={1.5} style={{ color: ACCENT }} /> US-registered company</span>
                <span className="flex items-center gap-2"><Tags size={14} strokeWidth={1.5} style={{ color: ACCENT }} /> Always white-label</span>
              </div>
            </motion.div>

            {/* Right: glass "delivery pipeline" preview — balances the hero and
                previews the workflow explained in full further down the page. */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              <div
                className="rounded-lg p-8"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xs uppercase tracking-widest text-white/50">Your delivery pipeline</span>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: ACCENT }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} /> Live
                  </span>
                </div>
                <div className="space-y-0">
                  {WORKFLOW.map((w, i) => (
                    <div key={w.step} className="relative flex gap-4 pb-8 last:pb-0">
                      {i < WORKFLOW.length - 1 && (
                        <div className="absolute left-[1.375rem] top-11 bottom-0 w-px bg-white/15" />
                      )}
                      <div className="relative z-10 w-11 h-11 shrink-0 rounded-full grid place-items-center" style={{ background: 'rgba(21,71,255,0.15)', border: `1px solid ${ACCENT}44` }}>
                        <w.icon size={18} strokeWidth={1.5} style={{ color: ACCENT }} />
                      </div>
                      <div className="pt-1.5">
                        <div className="text-white text-sm font-medium">{w.title}</div>
                        <div className="text-white/50 text-xs mt-1 max-w-[15rem] leading-relaxed">{w.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
                  {[['0', 'New hires'], ['100%', 'White-label'], ['1-2d', 'Response time']].map(([v, l]) => (
                    <div key={l}>
                      <div className="text-lg font-semibold text-white">{v}</div>
                      <div className="text-[0.65rem] uppercase tracking-wider text-white/40 mt-1">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
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
      <Section tone="ivory" spacing="lg" id="problem">
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
                  <p.icon size={20} strokeWidth={1.5} style={{ color: ACCENT }} />
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
              <Quote size={28} style={{ color: ACCENT }} />
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
                  className="relative z-10 mx-auto w-18 h-18 rounded-full grid place-items-center shadow-[0_16px_32px_-12px_rgba(10,35,66,0.35)]"
                  style={{ background: NAVY }}
                >
                  <w.icon size={26} strokeWidth={1.5} style={{ color: ACCENT }} />
                </div>
                <div className="num-plate text-slate text-xs mt-6">{w.step}</div>
                <h3 className="text-display-sm mt-2">{w.title}</h3>
                <p className="text-slate text-sm mt-3 max-w-xs mx-auto leading-relaxed">{w.desc}</p>
                {i < WORKFLOW.length - 1 && (
                  <ArrowUpRight
                    size={18}
                    strokeWidth={1.5}
                    className="hidden md:block absolute top-7 -right-4 rotate-45"
                    style={{ color: ACCENT }}
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
      <Section tone="ivory" spacing="lg" id="trust-factors">
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
                <t.icon size={22} strokeWidth={1.5} className="text-ink group-hover:text-[#1547FF] transition-colors duration-500" />
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
      <section id="systolab" className="relative overflow-hidden" style={{ backgroundColor: NAVY }}>
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-200 h-200 rounded-full opacity-[0.08] blur-3xl" style={{ background: ACCENT }} />
        <Section tone="ink" spacing="lg" divider={false} className="bg-transparent! relative z-10">
          <Container>
            <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-medium backdrop-blur-md mx-auto"
                style={{ background: 'rgba(21,71,255,0.1)', border: `1px solid ${ACCENT}55`, color: ACCENT }}
              >
                Proprietary quality engine
              </div>
              <h2 className="text-display-lg mt-6 text-white">
                Every project passes through <span style={{ color: ACCENT }}>SYSTOLAB™</span> before it reaches your client.
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
                  <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: 'rgba(21,71,255,0.15)' }}>
                    <c.icon size={18} strokeWidth={1.5} style={{ color: ACCENT }} />
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
              style={{ color: ACCENT }}
            >
              <CheckCircle2 size={16} strokeWidth={1.5} />
              Nothing ships to your client without a passing SYSTOLAB review.
            </motion.div>
          </Container>
        </Section>
      </section>

      {/* ============================================================ */}
      {/* OUTCOME — final CTA + application form                        */}
      {/* ============================================================ */}
      <section id="apply" className="relative overflow-hidden py-20 md:py-32" style={{ backgroundColor: NAVY_SOFT }}>
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: ACCENT }} />
        <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#FFFFFF' }} />
        <Container className="relative z-10">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            {/* Messaging */}
            <motion.div {...fadeUp}>
              <Eyebrow number="05" light>The outcome</Eyebrow>
              <h2 className="text-display-hero mt-6 text-white">
                Stop outsourcing.<br />
                <span style={{ color: ACCENT }}>Start partnering.</span>
              </h2>
              <p className="text-white/70 text-lg mt-8 max-w-lg leading-relaxed">
                A vendor delivers a project and disappears. A partner grows with you — same team, same standards,
                every time you say yes to a new client. That&apos;s the relationship we&apos;re built for.
              </p>
              <div className="mt-10 space-y-4">
                {['No cost to apply — we review every request personally', 'NDA sent before any details are shared', 'Reply within 1-2 business days'].map((t) => (
                  <div key={t} className="flex items-center gap-3 text-white/80 text-sm">
                    <CheckCircle size={16} strokeWidth={1.5} style={{ color: ACCENT }} className="shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
              <p className="text-white/50 text-sm mt-10 hidden lg:block">
                Prefer to talk it through first?{' '}
                <Button to="/consultation" variant="underline" className="text-white!" style={{ padding: 0 }}>
                  Book a call instead
                </Button>
              </p>
            </motion.div>

            {/* Application form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/95 backdrop-blur-xl rounded-lg p-6 md:p-10 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.5)]"
            >
              <div className="text-eyebrow mb-1">Become a delivery partner</div>
              <h3 className="text-display-sm text-ink mb-6">Apply in under 2 minutes.</h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="First name *" {...register('firstName')} error={errors.firstName?.message} />
                  <Input label="Last name *" {...register('lastName')} error={errors.lastName?.message} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Work email *" type="email" {...register('email')} error={errors.email?.message} />
                  <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Agency / company name *" {...register('company')} error={errors.company?.message} />
                  <Input label="Website" type="url" placeholder="https://" {...register('website')} error={errors.website?.message} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Select label="Agency type *" options={AGENCY_TYPES} {...register('agencyType')} error={errors.agencyType?.message} />
                  <Select label="Est. monthly project volume" options={VOLUME_OPTIONS} {...register('monthlyProjectVolume')} />
                </div>

                <div>
                  <span className="text-eyebrow block mb-3">Services you&apos;d white-label</span>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES_NEEDED_OPTIONS.map((s) => {
                      const active = servicesNeeded.includes(s.value);
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => toggleServiceNeeded(s.value)}
                          className="px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors"
                          style={active ? { background: NAVY, color: ACCENT, borderColor: NAVY } : { borderColor: '#e5e1d8' }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Textarea
                  label="Tell us about your agency (optional)"
                  rows={3}
                  placeholder="What kind of client work are you looking to delegate?"
                  {...register('message')}
                  error={errors.message?.message}
                />

                <Button
                  type="submit"
                  size="lg"
                  disabled={mutation.isPending}
                  className="w-full text-white! justify-center"
                  style={{ background: ACCENT }}
                >
                  {mutation.isPending ? 'Submitting…' : 'Submit application'}
                  <ArrowUpRight size={16} strokeWidth={1.5} />
                </Button>
                <p className="text-slate text-xs text-center leading-relaxed">
                  By submitting, you agree to be contacted about your application. We never share your info.
                </p>
              </form>
            </motion.div>
          </div>
        </Container>
      </section>
    </>
  );
}
