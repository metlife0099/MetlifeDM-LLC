import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Minus } from 'lucide-react';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { useDebounce } from '@/hooks/index.js';
import { cn } from '@/utils/format.js';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'services', label: 'Services' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'account', label: 'Account' },
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

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          <Eyebrow number="00">FAQ / Straight answers</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl">
            Questions.<br />
            <span className="text-italic-fraunces text-ultra">Answered plainly.</span>
          </h1>
          <p className="text-slate text-lg mt-8 max-w-xl leading-relaxed">
            Everything we get asked most often, organized so you can find what you need in under a minute.
          </p>

          <div className="mt-12 max-w-md relative">
            <Search size={16} strokeWidth={1.5} className="absolute left-0 top-3 text-slate" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              className="w-full bg-transparent border-b border-ink/25 pl-7 pb-3 pt-3 text-base placeholder:text-slate focus:border-ultra focus:outline-none"
            />
          </div>
        </Container>
      </Section>

      <div className="sticky top-20 z-30 bg-ivory border-y border-hairline">
        <Container className="py-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setCategory(c.value);
                  setOpenIdx(null);
                }}
                className={cn(
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors',
                  category === c.value ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Container>
      </div>

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container className="max-w-4xl">
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
                  <li key={f._id || i} className="py-2">
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : i)}
                      className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                    >
                      <div className="flex items-start gap-6 flex-1">
                        <span className="num-plate text-slate text-xs shrink-0 mt-1">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={cn(
                            'text-display-sm md:text-xl transition-colors',
                            isOpen ? 'text-ink' : 'text-ink group-hover:text-ultra'
                          )}
                        >
                          {f.question}
                        </span>
                      </div>
                      <span className="shrink-0 mt-1 text-ink">
                        {isOpen ? <Minus size={20} strokeWidth={1.25} /> : <Plus size={20} strokeWidth={1.25} />}
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
                          <div className="pl-14 pb-8 pr-8 text-slate leading-relaxed whitespace-pre-line max-w-2xl">
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
        </Container>
      </Section>

      <CtaBanner
        title="Still stuck?"
        subtitle="If we didn't cover it, ping us — we reply within one business day."
      />
    </>
  );
}
