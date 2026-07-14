import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { ChevronDown, Star, ArrowUpRight, MessageCircleQuestion } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Card } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { cn, formatMoney } from '@/utils/format.js';
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
export const FaqAccordion = ({
  items = [],
  eyebrow = '04 / FAQ',
  image = 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=1200&q=80&auto=format&fit=crop',
}) => {
  const [open, setOpen] = useState(0);
  return (
    <Section tone="ivory" spacing="lg">
      <Container>
        {/* Heading row — full width, on its own */}
        <div className="flex items-end justify-between mb-14 gap-8 flex-wrap">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="text-display-lg mt-4 max-w-2xl">Frequently asked.</h2>
          </div>
          <Button to="/contact" variant="underline" size="md">
            Ask us directly <ArrowUpRight size={14} strokeWidth={1.5} />
          </Button>
        </div>

        {/* Image + Q&A, side by side */}
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] items-stretch">
          {image && (
            <div className="hidden lg:block relative min-h-[28rem] overflow-hidden border border-hairline img-zoom">
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-2 text-ivory">
                <MessageCircleQuestion size={16} strokeWidth={1.5} />
                <span className="text-mono text-xs uppercase tracking-widest">Real answers, no fluff</span>
              </div>
            </div>
          )}
          <div className="divide-editorial border-t border-hairline self-start">
            {items.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item._id || i} className="group">
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className={cn(
                      'w-full py-6 px-4 -mx-4 flex items-center justify-between gap-6 text-left cursor-pointer rounded-sm transition-colors duration-300',
                      isOpen ? 'bg-ivory-soft' : 'hover:bg-ivory-soft'
                    )}
                  >
                    <span
                      className={cn(
                        'text-display-sm transition-colors duration-300',
                        isOpen ? 'text-ultra' : 'text-ink/80 group-hover:text-ink'
                      )}
                    >
                      {item.question}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 w-9 h-9 grid place-items-center border rounded-full transition-all duration-300',
                        isOpen
                          ? 'bg-ink text-ivory border-ink rotate-180'
                          : 'border-hairline group-hover:border-ink group-hover:-translate-y-0.5'
                      )}
                    >
                      <ChevronDown size={16} strokeWidth={1.5} />
                    </span>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 px-4 -mx-4 text-slate leading-relaxed max-w-2xl">{item.answer}</p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
};

/* ================== SERVICES GRID ================== */
export const ServicesGrid = ({ services = [], showAll = true }) => {
  return (
  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
    {services.map((s, i) => (
      <motion.div
        key={s._id || i}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: (i % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="group bg-ivory border border-hairline hover-lift hover:border-ink transition-colors duration-500 flex flex-col"
      >
        <Link to={`/services/${s.slug}`} className="block img-zoom relative aspect-16/10 bg-sand overflow-hidden">
          {s.heroImage?.url ? (
            <img src={s.heroImage.url} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-linear-to-br from-ink via-ink-soft to-ultra text-6xl">
              {s.icon || '✦'}
            </div>
          )}
          {s.isFeatured && (
            <span className="absolute top-4 right-4 bg-ultra text-ivory text-mono text-[0.65rem] uppercase tracking-widest px-2.5 py-1">
              Featured
            </span>
          )}
        </Link>

        <div className="p-6 md:p-8 flex flex-col flex-1">
          {s.category && (
            <div className="text-eyebrow mb-3">{s.category.replace(/_/g, ' ')}</div>
          )}
          <Link to={`/services/${s.slug}`}>
            <h3 className="text-display-sm group-hover:text-ultra transition-colors flex items-center gap-2">
              {s.icon && <span className="text-xl">{s.icon}</span>}
              {s.title}
            </h3>
          </Link>
          <p className="text-slate text-sm mt-3 leading-relaxed line-clamp-3 flex-1">
            {s.shortDescription}
          </p>
          {s.startingPrice != null && (
            <div className="mt-5 pt-5 border-t border-hairline text-mono text-xs uppercase tracking-widest text-slate">
              Starting at <span className="text-ink">{formatMoney(s.startingPrice)}</span>/mo
            </div>
          )}
          <div className="mt-6">
            <Button to={`/services/${s.slug}`} size="sm" className="w-full">
              Read more
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </motion.div>
    ))}
    {showAll && (
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: (services.length % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          to="/services"
          className="group h-full min-h-70 flex flex-col items-center justify-center gap-4 border border-dashed border-hairline hover:border-ink hover:bg-ink hover:text-ivory transition-all duration-500 p-8 text-center"
        >
          <div className="text-display-sm">View all services</div>
          <ArrowUpRight
            size={24}
            strokeWidth={1.25}
            className="group-hover:rotate-45 transition-transform duration-300"
          />
        </Link>
      </motion.div>
    )}
  </div>
  );
};
