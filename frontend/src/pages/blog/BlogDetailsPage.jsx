import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Heart, MessageCircle, Clock, Share2, ArrowUpRight, Reply, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Section, Eyebrow } from '@/components/ui/Layout.jsx';
import { Spinner, Badge, Textarea } from '@/components/ui/index.jsx';
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

  const [replyTo, setReplyTo] = useState(null); // { id, name } | null
  const formRef = useRef(null);

  const comment = useMutation({
    mutationFn: (payload) => contentApi.commentOnPost(data.post._id, payload),
    onSuccess: () => {
      toast.success('Comment submitted for review');
      reset();
      setReplyTo(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const onSubmitComment = (values) => {
    comment.mutate({ content: values.content, parent: replyTo?.id });
  };

  const likeComment = useMutation({
    mutationFn: (commentId) => contentApi.likeComment(data.post._id, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog', slug] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleReply = (c, name) => {
    if (!user) {
      toast.error('Sign in to reply');
    } else {
      setReplyTo({ id: c._id, name });
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleLikeComment = (c) => {
    if (!user) {
      toast.error('Sign in to like comments');
      return;
    }
    likeComment.mutate(c._id);
  };

  // Reading progress bar — tracks whole-page scroll (no target ref needed).
  const { scrollYProgress } = useScroll();
  const progressWidth = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

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
  const topLevelComments = comments.filter((c) => !c.parent);
  const getReplies = (id) => comments.filter((c) => c.parent && String(c.parent) === String(id));

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

      {/* Reading progress */}
      <motion.div
        style={{ scaleX: progressWidth }}
        className="fixed top-0 left-0 right-0 h-0.75 bg-ultra origin-left z-50"
      />

      {/* Hero */}
      <Section tone="ivory" spacing="lg" divider={false}>
        <Container className="max-w-4xl">
          <Link to="/blog" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
            ← All posts
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex items-center gap-3 flex-wrap"
          >
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
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-display-hero mt-8"
          >
            {post.title}
          </motion.h1>
          {post.excerpt && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-slate text-lg mt-8 leading-relaxed max-w-3xl"
            >
              {post.excerpt}
            </motion.p>
          )}

          {/* Author + date */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 pt-8 border-t border-hairline flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full grid place-items-center bg-ink text-ivory text-mono text-xs overflow-hidden shrink-0">
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
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => like.mutate(post._id)}
                className="inline-flex items-center gap-2 border border-hairline hover:border-ink hover:bg-ink hover:text-ivory px-4 py-2 text-mono text-xs uppercase tracking-widest transition-colors duration-300"
              >
                <Heart size={12} strokeWidth={1.5} className={post.likes ? 'fill-current' : ''} />
                {post.likes || 0}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={share}
                className="inline-flex items-center gap-2 border border-hairline hover:border-ink hover:bg-ink hover:text-ivory px-4 py-2 text-mono text-xs uppercase tracking-widest transition-colors duration-300"
              >
                <Share2 size={12} strokeWidth={1.5} />
                Share
              </motion.button>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Cover */}
      {post.coverImage?.url && (
        <Container className="max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="aspect-video bg-sand overflow-hidden"
          >
            <img src={post.coverImage.url} alt={post.title} className="h-full w-full object-cover" />
          </motion.div>
        </Container>
      )}

      {/* Content */}
      <Section tone="ivory" spacing="lg">
        <Container className="max-w-3xl">
          <article
            className="prose prose-lg max-w-none"
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
          <div ref={formRef}>
            {user ? (
              <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-6 mb-14">
                {replyTo && (
                  <div className="flex items-center justify-between gap-3 bg-sand/60 border border-hairline px-4 py-2.5 text-mono text-xs uppercase tracking-widest text-slate">
                    <span>Replying to {replyTo.name}</span>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="cursor-pointer hover:text-ink transition-colors duration-200"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
                <Textarea
                  label="Comment *"
                  rows={4}
                  placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'What did you think?'}
                  {...register('content', { required: 'Required', minLength: { value: 3, message: 'Too short' } })}
                  error={errors.content?.message}
                />
                <p className="text-mono text-xs text-slate">Comments are moderated and appear after approval.</p>
                <Button type="submit" disabled={comment.isPending}>
                  {comment.isPending ? 'Submitting…' : replyTo ? 'Post reply' : 'Post comment'}
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </Button>
              </form>
            ) : (
              <div className="mb-14 border border-hairline px-6 py-10 text-center">
                <p className="text-slate">Sign in to join the conversation and leave a comment.</p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/blog/${slug}`)}`}
                  className="mt-5 inline-flex items-center gap-2 border border-hairline hover:border-ink hover:bg-ink hover:text-ivory px-5 py-2.5 text-mono text-xs uppercase tracking-widest transition-colors duration-300 cursor-pointer"
                >
                  Sign in to comment
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            )}
          </div>

          {/* Comment list */}
          {topLevelComments.length > 0 && (
            <div className="divide-editorial border-t border-hairline">
              {topLevelComments.map((c, i) => (
                <CommentRow
                  key={c._id}
                  comment={c}
                  index={i}
                  replies={getReplies(c._id)}
                  onReply={handleReply}
                  onLike={handleLikeComment}
                />
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
              {related.slice(0, 3).map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link to={`/blog/${r.slug}`} className="group block">
                    {r.coverImage?.url && (
                      <div className="aspect-4/3 bg-sand overflow-hidden img-zoom">
                        <img
                          src={r.coverImage.url}
                          alt={r.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h3 className="text-display-sm mt-5 group-hover:text-ultra transition-colors duration-300">{r.title}</h3>
                    <div className="mt-2 text-mono text-xs uppercase tracking-widest text-slate">
                      {timeAgo(r.publishedAt || r.createdAt)}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner />
    </>
  );
}

function CommentRow({ comment: c, index, replies, onReply, onLike, isReply = false }) {
  const displayName =
    [c.author?.firstName, c.author?.lastName].filter(Boolean).join(' ') || c.guestName || 'Anonymous';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.05 }}
      className={isReply ? 'flex gap-4 mt-6' : 'py-6 flex gap-4'}
    >
      <div className="w-9 h-9 rounded-full grid place-items-center bg-ink text-ivory text-mono text-xs shrink-0 overflow-hidden">
        {c.author?.avatar?.url ? (
          <img src={c.author.avatar.url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials(displayName)
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{displayName}</span>
          <span className="text-mono text-xs text-slate">· {timeAgo(c.at)}</span>
        </div>
        <p className="text-slate leading-relaxed mt-2">{c.content}</p>
        <div className="flex items-center gap-5 mt-3">
          <button
            type="button"
            onClick={() => onLike(c)}
            className="inline-flex items-center gap-1.5 text-mono text-xs uppercase tracking-widest text-slate hover:text-ink cursor-pointer transition-colors duration-200"
          >
            <Heart size={12} strokeWidth={1.5} className={c.likedByMe ? 'fill-current text-ultra' : ''} />
            {c.likesCount || 0}
          </button>
          {!isReply && (
            <button
              type="button"
              onClick={() => onReply(c, displayName)}
              className="inline-flex items-center gap-1.5 text-mono text-xs uppercase tracking-widest text-slate hover:text-ink cursor-pointer transition-colors duration-200"
            >
              <Reply size={12} strokeWidth={1.5} />
              Reply
            </button>
          )}
        </div>

        {replies?.length > 0 && (
          <div className="pl-2 border-l border-hairline mt-2">
            {replies.map((r, j) => (
              <CommentRow key={r._id} comment={r} index={j} onLike={onLike} isReply />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
