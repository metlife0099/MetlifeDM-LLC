import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ChevronDown, MessageCircleQuestion, Clock, ThumbsUp, Sparkles } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { useDebounce } from '@/hooks/index.js';
import { cn } from '@/utils/format.js';

const SUPPORT_STATS = [
  { icon: Clock, label: 'Avg. reply time', value: '< 4 hrs' },
  { icon: ThumbsUp, label: 'Client satisfaction', value: '98%' },
  { icon: Sparkles, label: 'Questions answered', value: '10K+' },
];

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'services', label: 'Services' },
  { value: 'process', label: 'Process' },
  { value: 'payment', label: 'Payment' },
  { value: 'support', label: 'Support' },
  { value: 'seo', label: 'SEO' },
  { value: 'ppc', label: 'PPC' },
  { value: 'ai', label: 'AI' },
];

export default function FaqPage() {
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [openIdx, setOpenIdx] = useState(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs', 'all', category, debouncedQuery],
    queryFn: () =>
      contentApi
        .listFaqs({
          category: category || undefined,
          search: debouncedQuery || undefined,
          limit: 100,
        })
        .then((r) => r.data || r),
  });

  return (
    <>
      <Seo
        title="FAQ"
        description="Answers to common questions about MetlifeDM's services, pricing, timelines, and process."
      />

      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1920&q=80&auto=format&fit=crop"
          alt="Team discussing a question"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>FAQ / Straight answers</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Questions.<br />
            <span className="text-italic-fraunces text-ultra-soft">Answered plainly.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            Everything we get asked most often, organized so you can find what you need in under a minute.
          </p>

          <div className="mt-12 max-w-md relative">
            <Search size={16} strokeWidth={1.5} className="absolute left-0 top-3 text-ivory/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              className="w-full bg-transparent border-b border-ivory/30 pl-7 pb-3 pt-3 text-base text-ivory placeholder:text-ivory/50 focus:border-ultra-soft focus:outline-none"
            />
          </div>
        </Container>
      </Section>

      <div className="sticky top-20 z-30 bg-ivory border-y border-hairline">
        <Container>
          <ScrollTabs trackClassName="py-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setCategory(c.value);
                  setOpenIdx(null);
                }}
                className={cn(
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap',
                  category === c.value ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                {c.label}
              </button>
            ))}
          </ScrollTabs>
        </Container>
      </div>

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1fr_1.7fr]">
            {/* Sidebar */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div className="relative aspect-4/5 overflow-hidden border border-hairline img-zoom">
                <img
                  src="https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=1000&q=80&auto=format&fit=crop"
                  alt="Support strategist ready to help"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center gap-2 text-ivory">
                  <MessageCircleQuestion size={16} strokeWidth={1.5} />
                  <span className="text-mono text-xs uppercase tracking-widest">Real humans, real answers</span>
                </div>
              </div>
              <div className="mt-6 border border-hairline divide-y divide-hairline">
                {SUPPORT_STATS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3 text-slate text-sm">
                      <Icon size={15} strokeWidth={1.5} className="text-ultra shrink-0" />
                      {label}
                    </div>
                    <div className="text-mono text-sm text-ink">{value}</div>
                  </div>
                ))}
              </div>
              <Button to="/contact" size="md" className="w-full mt-6">
                Still stuck? Ask us
              </Button>
            </div>

            {/* FAQ list */}
            <div>
              {isLoading ? (
                <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-24 text-slate">
                  No FAQs match your search.{' '}
                  <button className="link-underline text-ink" onClick={() => { setQuery(''); setCategory(''); }}>Reset</button>.
                </div>
              ) : (
                <ul className="divide-editorial border-t border-hairline">
                  {faqs.map((f, i) => {
                    const isOpen = openIdx === i;
                    return (
                      <li key={f._id || i} className="group">
                        <button
                          onClick={() => setOpenIdx(isOpen ? null : i)}
                          className={cn(
                            'w-full flex items-start justify-between gap-6 py-6 px-5 -mx-5 text-left rounded-sm transition-colors duration-300',
                            isOpen ? 'bg-ivory-soft' : 'hover:bg-ivory-soft'
                          )}
                        >
                          <div className="flex items-start gap-5 flex-1">
                            <span className="num-plate text-slate text-xs shrink-0 mt-1">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span
                              className={cn(
                                'text-display-sm md:text-xl transition-colors duration-300',
                                isOpen ? 'text-ultra' : 'text-ink group-hover:text-ultra'
                              )}
                            >
                              {f.question}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 mt-1 w-9 h-9 grid place-items-center border rounded-full transition-all duration-300',
                              isOpen
                                ? 'bg-ink text-ivory border-ink rotate-180'
                                : 'border-hairline group-hover:border-ink group-hover:-translate-y-0.5'
                            )}
                          >
                            <ChevronDown size={16} strokeWidth={1.5} />
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="pl-10 pb-8 pr-8 text-slate leading-relaxed whitespace-pre-line max-w-2xl">
                                {f.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </Section>

      <CtaBanner
        title="Still stuck?"
        subtitle="If we didn't cover it, ping us — we reply within one business day."
      />
    </>
  );
}
