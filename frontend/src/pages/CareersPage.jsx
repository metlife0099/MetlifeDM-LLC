import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Clock, ArrowUpRight, Briefcase } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner, Badge } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { leadsApi } from '@/api/index.js';
import { cn } from '@/utils/format.js';

const DEPTS = ['all', 'strategy', 'design', 'engineering', 'content', 'ops', 'sales'];

const VALUES = [
  {
    n: '01',
    title: 'Craft over volume',
    body: 'We ship fewer, better things. No content mills, no ad-spam. Every deliverable has a name attached to it.',
  },
  {
    n: '02',
    title: 'Autonomy with receipts',
    body: 'Own your work end-to-end. Bring metrics, not opinions. Everything measurable gets measured.',
  },
  {
    n: '03',
    title: 'Compounding, not sprinting',
    body: 'We build careers, not treadmills. Weekly cadences, quarterly bets, decade-long relationships.',
  },
];

export default function CareersPage() {
  const [dept, setDept] = useState('all');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['careers', 'list', dept],
    queryFn: () =>
      leadsApi
        .listCareers({ department: dept === 'all' ? undefined : dept, status: 'open', limit: 30 })
        .then((r) => r.data || r),
  });

  return (
    <>
      <Seo
        title="Careers"
        description="Join MetlifeDM. We're hiring strategists, designers, engineers, and content operators who care about craft."
      />

      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1920&q=80&auto=format&fit=crop"
          alt="Our team collaborating"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Careers / We&apos;re hiring</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Build the<br />
            <span className="text-italic-fraunces text-ultra-soft">work you want to be known for.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Remote-first (US only). Small teams. Real ownership. Every hire changes the shape of the company.
          </p>
        </Container>
      </Section>

      {/* Values */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <Eyebrow number="01">How we work</Eyebrow>
          <div className="grid gap-10 md:grid-cols-3 mt-10">
            {VALUES.map((v) => (
              <div key={v.n}>
                <div className="num-plate text-slate text-xs mb-4">{v.n}</div>
                <h3 className="text-display-sm mb-3">{v.title}</h3>
                <p className="text-slate leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Openings */}
      <Section tone="ivory" spacing="lg">
        <Container>
          <div className="flex items-end justify-between mb-8 gap-6 flex-wrap">
            <div>
              <Eyebrow number="02">Open roles</Eyebrow>
              <h2 className="text-display-lg mt-4">
                We&apos;re hiring<br />
                <span className="text-italic-fraunces text-ultra">across teams.</span>
              </h2>
            </div>
          </div>

          {/* Department filter */}
          <ScrollTabs className="mb-10" trackClassName="pb-1">
            {DEPTS.map((d) => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className={cn(
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap',
                  dept === d ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                {d}
              </button>
            ))}
          </ScrollTabs>

          {isLoading ? (
            <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24">
              <Briefcase size={32} strokeWidth={1} className="text-slate mx-auto mb-4" />
              <div className="text-display-sm mb-2">No open roles right now.</div>
              <p className="text-slate max-w-md mx-auto">
                We&apos;re always looking. Send an intro to{' '}
                <a href="mailto:careers@metlifedm.com" className="link-underline text-ink">careers@metlifedm.com</a>.
              </p>
            </div>
          ) : (
            <div className="divide-editorial border-t border-hairline">
              {jobs.map((j, i) => (
                <motion.div
                  key={j._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={`/careers/${j.slug || j._id}`}
                    className="py-8 grid gap-6 md:grid-cols-[auto_1fr_auto_auto] md:items-center group"
                  >
                    <span className="num-plate text-slate text-sm">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="text-eyebrow mb-2">{j.department}</div>
                      <h3 className="text-display-sm group-hover:text-ultra transition-colors">
                        {j.title}
                      </h3>
                      {j.shortDescription && (
                        <p className="text-slate text-sm mt-2 leading-relaxed max-w-2xl line-clamp-2">
                          {j.shortDescription}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1 text-mono text-xs uppercase tracking-widest text-slate">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} strokeWidth={1.5} />
                        {j.location || 'Remote'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} strokeWidth={1.5} />
                        {j.employmentType?.replace('_', ' ') || 'Full-time'}
                      </div>
                    </div>
                    <ArrowUpRight
                      size={20}
                      strokeWidth={1.25}
                      className="text-ink group-hover:rotate-45 transition-transform duration-300"
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <CtaBanner
        title="Don't see your role?"
        subtitle={<>Send a note to <a href="mailto:careers@metlifedm.com" className="link-underline">careers@metlifedm.com</a>. We keep every intro on file.</>}
      />
    </>
  );
}
