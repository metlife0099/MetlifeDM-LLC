import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { Heart, MessageCircle, Clock, Share2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner, Badge, Textarea, Input } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { CtaBanner } from '@/components/sections/index.jsx';
import { contentApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { formatDate, timeAgo, initials } from '@/utils/format.js';

export default function BlogDetailsPage() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const user = useSelector((s) => s.auth.user);

  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => contentApi.getPostBySlug(slug),
    enabled: !!slug,
  });

  const like = useMutation({
    mutationFn: (id) => contentApi.likePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog', slug] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const comment = useMutation({
    mutationFn: (payload) => contentApi.commentOnPost(data.post._id, payload),
    onSuccess: () => {
      toast.success('Comment submitted for review');
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) {
    return <div className="grid place-items-center min-h-[60vh]"><Spinner size={32} className="text-ultra" /></div>;
  }
  if (error || !data?.post) {
    return (
      <Section spacing="xl">
        <Container>
          <Eyebrow>404 / Not found</Eyebrow>
          <h1 className="text-display-lg mt-4">Post not found</h1>
          <Link to="/blog" className="mt-8 inline-block link-underline text-ink">← All posts</Link>
        </Container>
      </Section>
    );
  }

  const post = data.post;
  const related = data.related || [];
  const comments = data.comments || post.comments || [];

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied');
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt || post.seo?.metaDescription}
        image={post.coverImage?.url}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage?.url,
          datePublished: post.publishedAt,
          author: { '@type': 'Person', name: post.author?.firstName || 'MetlifeDM' },
        }}
      />

      {/* Hero */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container className="max-w-4xl">
          <Link to="/blog" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
            ← All posts
          </Link>
          <div className="mt-8 flex items-center gap-3 flex-wrap">
            {post.category && (
              <Badge tone="outline">
                {post.category.name || post.category}
              </Badge>
            )}
            {post.readingTime && (
              <div className="text-mono text-xs uppercase tracking-widest text-slate inline-flex items-center gap-1">
                <Clock size={10} strokeWidth={1.5} />
                {post.readingTime} min read
              </div>
            )}
          </div>
          <h1 className="text-display-hero mt-8">{post.title}</h1>
          {post.excerpt && (
            <p className="text-slate text-lg mt-8 leading-relaxed max-w-3xl">{post.excerpt}</p>
          )}

          {/* Author + date */}
          <div className="mt-10 pt-8 border-t border-hairline flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 grid place-items-center bg-ink text-ivory text-mono text-xs">
                {post.author?.avatar?.url ? (
                  <img src={post.author.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(`${post.author?.firstName || 'M D'}`)
                )}
              </div>
              <div>
                <div className="text-sm">{post.author?.firstName} {post.author?.lastName}</div>
                <div className="text-mono text-xs text-slate">
                  {formatDate(post.publishedAt || post.createdAt, 'medium')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => like.mutate(post._id)}
                className="inline-flex items-center gap-2 border border-hairline hover:border-ink px-4 py-2 text-mono text-xs uppercase tracking-widest transition-colors"
              >
                <Heart size={12} strokeWidth={1.5} />
                {post.likes || 0}
              </button>
              <button
                onClick={share}
                className="inline-flex items-center gap-2 border border-hairline hover:border-ink px-4 py-2 text-mono text-xs uppercase tracking-widest transition-colors"
              >
                <Share2 size={12} strokeWidth={1.5} />
                Share
              </button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Cover */}
      {post.coverImage?.url && (
        <Container className="max-w-6xl">
          <div className="aspect-[16/9] bg-sand overflow-hidden">
            <img src={post.coverImage.url} alt={post.title} className="h-full w-full object-cover" />
          </div>
        </Container>
      )}

      {/* Content */}
      <Section tone="ivory" spacing="lg">
        <Container className="max-w-3xl">
          <article
            className="prose prose-lg max-w-none text-ink"
            style={{
              fontFamily: 'var(--font-body)',
              lineHeight: 1.75,
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-14 pt-8 border-t border-hairline flex items-center gap-3 flex-wrap">
              <span className="text-mono text-xs uppercase tracking-widest text-slate">Tagged</span>
              {post.tags.map((t) => (
                <Badge key={t} tone="outline">#{t}</Badge>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Comments */}
      <Section tone="ivory" spacing="lg">
        <Container className="max-w-3xl">
          <Eyebrow number="02">
            <MessageCircle size={12} strokeWidth={1.5} className="inline mr-1" />
            {comments.length} Comment{comments.length !== 1 && 's'}
          </Eyebrow>
          <h2 className="text-display-md mt-4 mb-10">Join the conversation.</h2>

          {/* Form */}
          <form onSubmit={handleSubmit(comment.mutate)} className="space-y-6 mb-14">
            {!user && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <Input label="Name *" {...register('name', { required: 'Required' })} error={errors.name?.message} />
                  <Input label="Email *" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
                </div>
              </>
            )}
            <Textarea
              label="Comment *"
              rows={4}
              placeholder="What did you think?"
              {...register('content', { required: 'Required', minLength: { value: 3, message: 'Too short' } })}
              error={errors.content?.message}
            />
            <p className="text-mono text-xs text-slate">Comments are moderated and appear after approval.</p>
            <Button type="submit" disabled={comment.isPending}>
              {comment.isPending ? 'Submitting…' : 'Post comment'}
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </Button>
          </form>

          {/* Comment list */}
          {comments.length > 0 && (
            <div className="divide-editorial border-t border-hairline">
              {comments.map((c, i) => (
                <div key={i} className="py-6 flex gap-4">
                  <div className="w-9 h-9 grid place-items-center bg-ink text-ivory text-mono text-xs shrink-0">
                    {initials(c.name || c.author?.firstName || 'A')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{c.name || c.author?.firstName}</span>
                      <span className="text-mono text-xs text-slate">· {timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-slate leading-relaxed mt-2">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Related */}
      {related.length > 0 && (
        <Section tone="ivory" spacing="lg">
          <Container>
            <Eyebrow number="03">Related</Eyebrow>
            <h2 className="text-display-md mt-4 mb-10">Keep reading.</h2>
            <div className="grid gap-10 md:grid-cols-3">
              {related.slice(0, 3).map((r) => (
                <Link key={r._id} to={`/blog/${r.slug}`} className="group">
                  {r.coverImage?.url && (
                    <div className="aspect-[4/3] bg-sand overflow-hidden">
                      <img
                        src={r.coverImage.url}
                        alt={r.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <h3 className="text-display-sm mt-5 group-hover:text-ultra transition-colors">{r.title}</h3>
                  <div className="mt-2 text-mono text-xs uppercase tracking-widest text-slate">
                    {timeAgo(r.publishedAt || r.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner />
    </>
  );
}
