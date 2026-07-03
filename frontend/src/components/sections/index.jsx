import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { ChevronDown, Star, ArrowUpRight } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Card } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { cn } from '@/utils/format.js';
import { useInView } from '@/hooks/index.js';
import 'swiper/css';

/* ================== STATS ================== */
export const StatsBand = ({ stats }) => (
  <Section tone="ivory" spacing="md" divider>
    <Container>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-hairline">
        {stats.map((s, i) => (
          <StatCard key={i} stat={s} index={i} />
        ))}
      </div>
    </Container>
  </Section>
);

const StatCard = ({ stat, index }) => {
  const [ref, visible] = useInView({ threshold: 0.3 });
  return (
    <div ref={ref} className="px-6 first:pl-0 last:pr-0 py-8 fade-up">
      <div className="text-eyebrow mb-3">{String(index + 1).padStart(2, '0')} / METRIC</div>
      <div className="text-display-lg text-ink num-plate leading-none">
        {stat.value}
        <span className="text-ultra">{stat.suffix}</span>
      </div>
      <div className="mt-3 text-sm text-slate">{stat.label}</div>
    </div>
  );
};

/* ================== TRUSTED BY ================== */
export const TrustedByStrip = ({ logos, title = 'Trusted by teams at' }) => (
  <div className="border-y border-hairline bg-ivory">
    <Container className="py-10">
      <div className="grid gap-6 md:grid-cols-6 md:items-center">
        <div className="md:col-span-2 text-eyebrow">{title}</div>
        <div className="md:col-span-4 flex items-center gap-8 md:gap-14 flex-wrap opacity-60">
          {logos.slice(0, 6).map((l, i) => (
            <span key={i} className="text-display-sm text-ink/50">
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </Container>
  </div>
);

/* ================== PROCESS TIMELINE ================== */
export const ProcessTimeline = ({ steps, eyebrow = '02 / Process', title, subtitle }) => (
  <Section tone="ivory" spacing="lg">
    <Container>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="text-display-lg mt-4">{title}</h2>
          {subtitle && <p className="text-slate text-lg mt-6 max-w-md leading-relaxed">{subtitle}</p>}
        </div>
        <ol className="divide-editorial border-t border-hairline">
          {steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr] gap-6 py-8">
              <span className="num-plate text-slate text-sm w-10">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="text-display-sm mb-2">{s.title}</h3>
                <p className="text-slate text-sm leading-relaxed max-w-lg">{s.description}</p>
                {s.duration && (
                  <div className="mt-3 text-mono text-xs uppercase tracking-widest text-ultra">
                    {s.duration}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Container>
  </Section>
);

/* ================== TESTIMONIALS CAROUSEL ================== */
export const TestimonialsCarousel = ({ testimonials = [], eyebrow = '03 / What clients say' }) => {
  if (!testimonials.length) return null;
  return (
    <Section tone="ink" spacing="lg" divider={false}>
      <Container>
        <div className="mb-14 flex items-end justify-between">
          <div>
            <div className="text-eyebrow text-ivory/50 mb-4">{eyebrow}</div>
            <h2 className="text-display-lg text-ivory">
              Numbers move.<br />
              <span className="text-italic-fraunces text-ultra-soft">People stay.</span>
            </h2>
          </div>
        </div>
        <Swiper
          modules={[Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          autoplay={{ delay: 5500, disableOnInteraction: false }}
          loop
          breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        >
          {testimonials.map((t, i) => (
            <SwiperSlide key={t._id || i}>
              <div className="border border-ivory/15 p-8 h-full flex flex-col">
                <div className="flex gap-0.5 mb-6">
                  {Array.from({ length: t.rating || 5 }).map((_, k) => (
                    <Star key={k} size={12} strokeWidth={0} className="fill-ultra-soft text-ultra-soft" />
                  ))}
                </div>
                <p className="text-ivory text-lg leading-relaxed flex-1">
                  <span className="text-italic-fraunces text-2xl leading-none">“</span>
                  {t.quote}
                  <span className="text-italic-fraunces text-2xl leading-none">”</span>
                </p>
                <div className="mt-8 pt-6 border-t border-ivory/10">
                  <div className="text-sm text-ivory">{t.authorName}</div>
                  <div className="text-mono text-xs uppercase tracking-widest text-ivory/50 mt-1">
                    {t.authorTitle} · {t.authorCompany}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </Section>
  );
};

/* ================== CTA BANNER ================== */
export const CtaBanner = ({
  eyebrow = 'Ready when you are',
  title = "Let's make your growth measurable.",
  subtitle = 'Book a free 30-minute strategy call. No pitch. Just a plan.',
  primary = { label: 'Book a call', href: '/consultation' },
  secondary = { label: 'View case studies', href: '/case-studies' },
}) => (
  <Section tone="ivory" spacing="lg">
    <Container>
      <div className="border border-ink p-10 md:p-16 lg:p-24 relative overflow-hidden">
        <div className="text-eyebrow mb-6">{eyebrow}</div>
        <h2 className="text-display-hero max-w-4xl">{title}</h2>
        <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">{subtitle}</p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button to={primary.href} size="lg">
            {primary.label} <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
          <Button to={secondary.href} variant="ghost" size="lg">
            {secondary.label}
          </Button>
        </div>
      </div>
    </Container>
  </Section>
);

/* ================== FAQ ACCORDION ================== */
export const FaqAccordion = ({ items = [], eyebrow = '04 / FAQ' }) => {
  const [open, setOpen] = useState(0);
  return (
    <Section tone="ivory" spacing="lg">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="text-display-lg mt-4">Frequently<br />asked.</h2>
            <p className="text-slate text-sm mt-6 max-w-sm leading-relaxed">
              Can&apos;t find your answer?{' '}
              <Link to="/contact" className="link-underline text-ink">
                Ask us directly
              </Link>
              .
            </p>
          </div>
          <div className="divide-editorial border-t border-hairline">
            {items.map((item, i) => (
              <div key={item._id || i}>
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="w-full py-6 flex items-center justify-between gap-6 text-left group"
                >
                  <span className={cn('text-display-sm transition-colors', open === i ? 'text-ink' : 'text-ink/80')}>
                    {item.question}
                  </span>
                  <ChevronDown
                    size={20}
                    strokeWidth={1.5}
                    className={cn('shrink-0 transition-transform duration-500', open === i && 'rotate-180')}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 text-slate leading-relaxed max-w-2xl">{item.answer}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
};

/* ================== SERVICES GRID ================== */
export const ServicesGrid = ({ services = [], showAll = true }) => (
  <div className="grid gap-px bg-hairline border border-hairline">
    {services.map((s, i) => (
      <Link
        key={s._id || i}
        to={`/services/${s.slug}`}
        className="bg-ivory p-8 md:p-10 group transition-colors duration-500 hover:bg-ink hover:text-ivory md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8"
      >
        <div className="num-plate text-slate text-sm group-hover:text-ivory/50 transition-colors mb-4 md:mb-0">
          {String(i + 1).padStart(2, '0')}
        </div>
        <div>
          <h3 className="text-display-sm mb-2 flex items-center gap-3">
            {s.icon && <span className="text-2xl">{s.icon}</span>}
            {s.title}
          </h3>
          <p className="text-sm max-w-xl group-hover:text-ivory/70 text-slate leading-relaxed">
            {s.shortDescription}
          </p>
        </div>
        <div className="flex items-center gap-4 mt-6 md:mt-0">
          {s.startingPrice && (
            <div className="text-mono text-xs uppercase tracking-widest">
              from ${s.startingPrice.toLocaleString()}
            </div>
          )}
          <ArrowUpRight
            size={20}
            strokeWidth={1.25}
            className="transition-transform duration-300 group-hover:rotate-45"
          />
        </div>
      </Link>
    ))}
    {showAll && (
      <Link
        to="/services"
        className="bg-ivory p-8 md:p-10 flex items-center justify-between group hover:bg-ultra hover:text-ivory transition-colors"
      >
        <div className="text-display-sm">View all services</div>
        <ArrowUpRight
          size={20}
          strokeWidth={1.25}
          className="group-hover:rotate-45 transition-transform duration-300"
        />
      </Link>
    )}
  </div>
);
