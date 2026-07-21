import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight, Clock } from 'lucide-react';
import { Container, Section, Eyebrow, HeroImage } from '@/components/ui/Layout.jsx';
import { Spinner, Badge } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, cn, timeAgo } from '@/utils/format.js';

export default function BlogPage() {
  const [search, setSearch] = useSearchParams();
  const category = search.get('category') || '';
  const [query, setQuery] = useState(search.get('q') || '');
  const debouncedQuery = useDebounce(query, 400);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog', 'list', category, debouncedQuery],
    queryFn: () =>
      contentApi
        .listPosts({
          category: category || undefined,
          search: debouncedQuery || undefined,
          status: 'published',
          limit: 30,
        })
        .then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: () => contentApi.getBlogCategories(),
  });

  const setCategory = (c) => {
    const params = {};
    if (c) params.category = c;
    if (query) params.q = query;
    setSearch(params);
  };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <>
      <Seo title="Blog" description="Growth playbooks, SEO strategy, PPC deep-dives, and marketing analytics from MetlifeDM's senior team." />

      <Section tone="ink" spacing="lg" divider={false} className="relative">
        <HeroImage
          src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1920&q=80&auto=format&fit=crop"
          alt="Writing by hand"
        />
        <Container className="relative z-10">
          <Eyebrow number="00" light>Blog / Growth playbooks</Eyebrow>
          <h1 className="text-display-hero mt-8 max-w-4xl text-ivory">
            Ideas worth<br />
            <span className="text-italic-fraunces text-ultra-soft">stealing.</span>
          </h1>
          <p className="text-ivory/75 text-lg mt-8 max-w-xl leading-relaxed">
            SEO teardowns, PPC frameworks, brand strategy, and honest post-mortems — written by senior strategists, not intern content mills.
          </p>

          {/* Search */}
          <div className="mt-12 max-w-md relative">
            <Search size={16} strokeWidth={1.5} className="absolute left-0 top-3 text-ivory/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts…"
              className="w-full bg-transparent border-b border-ivory/30 pl-7 pb-3 pt-3 text-base text-ivory placeholder:text-ivory/50 focus:border-ultra-soft focus:outline-none"
            />
          </div>
        </Container>
      </Section>

      {/* Category filter */}
      <div className="sticky top-20 z-30 bg-ivory border-y border-hairline">
        <Container>
          <ScrollTabs trackClassName="py-4">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap',
                !category ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setCategory(c.slug || c._id)}
                className={cn(
                  'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap',
                  category === (c.slug || c._id) ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
                )}
              >
                {c.icon && <span className="mr-1">{c.icon}</span>}
                {c.name}
              </button>
            ))}
          </ScrollTabs>
        </Container>
      </div>

      <Section tone="ivory" spacing="lg" divider={false}>
        <Container>
          {isLoading ? (
            <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 text-slate">
              No posts match your search.{' '}
              <button className="link-underline text-ink" onClick={() => { setCategory(''); setQuery(''); }}>Reset</button>.
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-24"
                >
                  <Link to={`/blog/${featured.slug}`} className="block group">
                    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                      <div className="aspect-4/3 bg-sand overflow-hidden order-2 lg:order-1 img-zoom relative">
                        {featured.coverImage?.url ? (
                          <img
                            src={featured.coverImage.url}
                            alt={featured.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full grid place-items-center text-display-lg text-ink/20">
                            {featured.title.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-ink/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <div className="order-1 lg:order-2">
                        <Badge tone="ultra">Featured</Badge>
                        <h2 className="text-display-lg mt-6 group-hover:text-ultra transition-colors duration-300">
                          {featured.title}
                        </h2>
                        {featured.excerpt && (
                          <p className="text-slate mt-4 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                        )}
                        <div className="mt-6 flex items-center gap-4 text-mono text-xs uppercase tracking-widest text-slate">
                          <span>{featured.author?.firstName || 'MetlifeDM'}</span>
                          <span className="opacity-40">·</span>
                          <span>{formatDate(featured.publishedAt || featured.createdAt, 'medium')}</span>
                          {featured.readingTime && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={10} strokeWidth={1.5} />
                                {featured.readingTime} min
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink">
                          Read the story
                          <ArrowUpRight
                            size={15}
                            strokeWidth={1.5}
                            className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {/* Grid */}
              <div className="grid gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: (i % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true, margin: '-60px' }}
                    className="group"
                  >
                    <Link to={`/blog/${post.slug}`} className="block">
                      <div className="aspect-4/3 bg-sand overflow-hidden img-zoom">
                        {post.coverImage?.url ? (
                          <img
                            src={post.coverImage.url}
                            alt={post.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full grid place-items-center text-display-md text-ink/20">
                            {post.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      {post.category && (
                        <div className="text-eyebrow mt-5 group-hover:text-ultra transition-colors duration-300">
                          {post.category.name || post.category}
                        </div>
                      )}
                      <h3 className="text-display-sm mt-2 group-hover:text-ultra transition-colors duration-300">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-slate text-sm mt-3 leading-relaxed line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="mt-4 flex items-center gap-3 text-mono text-xs uppercase tracking-widest text-slate">
                        <span>{timeAgo(post.publishedAt || post.createdAt)}</span>
                        {post.readingTime && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{post.readingTime} min read</span>
                          </>
                        )}
                        <ArrowUpRight
                          size={13}
                          strokeWidth={1.5}
                          className="ml-auto text-ink opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                        />
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>

      <CtaBanner
        title="Prefer to talk?"
        subtitle="Skip the reading. Book a strategy call and we'll build a plan for you."
      />
    </>
  );
}
