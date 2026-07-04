import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, FileText, ExternalLink, Edit3, Trash2, ArrowLeft, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader, Badge } from '@/components/ui/index.jsx';
import { Input, Textarea, Select, Switch, SearchInput, ImageUpload, MultiSelect } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { blogApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, timeAgo, slugify } from '@/utils/format.js';
import { POST_STATUSES } from '@/utils/constants.js';

/* ============================================================
 * POSTS LIST
 * ============================================================ */
export function PostsListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'publishedAt', direction: 'desc' });
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts', { page, limit, debounced, status, sort }],
    queryFn: () => blogApi.listPosts({ page, limit, search: debounced, status, sortBy: sort.key, sortOrder: sort.direction }),
  });

  const remove = useMutation({
    mutationFn: (id) => blogApi.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      toast.success('Post deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'title', label: 'Post', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.coverImage?.url ? (
            <img src={r.coverImage.url} alt="" className="w-10 h-10 object-cover" />
          ) : (
            <div className="w-10 h-10 bg-ivory-soft border border-hairline" />
          )}
          <div className="min-w-0">
            <Link to={`/content/blog/${r._id}`} className="text-sm text-ink hover:text-ultra truncate block">{r.title}</Link>
            <div className="text-mono text-xs text-slate mt-0.5 truncate">/blog/{r.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'author', label: 'Author',
      render: (r) => <span className="text-xs">{r.author?.firstName ? `${r.author.firstName} ${r.author.lastName || ''}` : '—'}</span>,
    },
    {
      key: 'categories', label: 'Categories',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.categories || []).slice(0, 2).map((c) => (
            <Badge key={c._id || c} tone="outline">{c.name || c}</Badge>
          ))}
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    {
      key: 'publishedAt', label: 'Published', sortable: true,
      render: (r) => <span className="text-mono text-xs text-slate">{r.publishedAt ? timeAgo(r.publishedAt) : '—'}</span>,
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/content/blog/${row._id}`} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></Link>
          {row.slug && row.status === 'published' && (
            <a href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/blog/${row.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate hover:text-ink">
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content / Blog"
        title={<>Blog <span className="text-italic-fraunces text-ultra">posts</span></>}
        subtitle="Everything published on /blog, plus drafts and scheduled posts."
        actions={
          <>
            <Button variant="ghost" to="/content/blog/categories">Categories</Button>
            <Button variant="ghost" to="/content/blog/comments">Comments</Button>
            <Button to="/content/blog/new" icon={Plus}>New post</Button>
          </>
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search posts…" className="w-64" />
        <Select className="w-40" options={[{ value: '', label: 'All statuses' }, ...POST_STATUSES]} value={status} onChange={(e) => setStatus(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        sort={sort} onSortChange={setSort}
        emptyIcon={FileText} emptyTitle="No posts yet" emptySubtitle="Start writing your first post."
        emptyAction={<Button to="/content/blog/new" icon={Plus}>New post</Button>}
      />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this post?" confirmLabel="Delete" variant="danger" />
    </>
  );
}

/* ============================================================
 * POST EDIT
 * ============================================================ */
const postSchema = z.object({
  title: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  publishedAt: z.string().optional(),
  featured: z.boolean().optional(),
  tags: z.string().optional(),
  readTime: z.coerce.number().optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
});

export function PostEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [categoryIds, setCategoryIds] = useState([]);

  const { data: post, isLoading } = useQuery({
    queryKey: ['admin', 'post', id],
    queryFn: () => blogApi.getPost(id),
    enabled: !isNew,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'blog', 'categories'],
    queryFn: () => blogApi.listCategories(),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { title: '', slug: '', status: 'draft', seo: {} },
  });

  useEffect(() => {
    if (post && !isNew) {
      reset({
        ...post,
        tags: (post.tags || []).join(', '),
        publishedAt: post.publishedAt ? post.publishedAt.slice(0, 16) : '',
      });
      setContent(post.content || '');
      setCoverImage(post.coverImage);
      setCategoryIds((post.categories || []).map((c) => c._id || c));
    }
  }, [post, isNew, reset]);

  const title = watch('title');
  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = {
        ...payload,
        content,
        coverImage: coverImage instanceof File ? undefined : coverImage,
        categories: categoryIds,
        tags: (payload.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      };
      return isNew ? blogApi.createPost(clean) : blogApi.updatePost(id, clean);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
      toast.success(isNew ? 'Post created' : 'Post updated');
      if (isNew) navigate(`/content/blog/${data._id || data.post?._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const publish = useMutation({
    mutationFn: () => blogApi.publishPost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'post', id] });
      toast.success('Post published');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading post" />;

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))}>
      <Breadcrumbs items={[
        { label: 'Content', href: '/content/blog' },
        { label: 'Blog', href: '/content/blog' },
        { label: isNew ? 'New post' : post?.title || 'Edit' },
      ]} />
      <PageHeader
        eyebrow={isNew ? 'Create · Post' : `Editing · ${post?.slug || ''}`}
        title={isNew ? 'New post' : post?.title || 'Edit post'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/content/blog" icon={ArrowLeft}>Back</Button>
            {!isNew && post?.status !== 'published' && (
              <Button type="button" variant="ultra" icon={Send} onClick={() => publish.mutate()} loading={publish.isPending}>Publish now</Button>
            )}
            <Button type="submit" icon={Save} loading={save.isPending} disabled={!isDirty && !isNew}>Save</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">01 / Basics</div>
            <div className="space-y-4">
              <Input label="Title" required {...register('title')} error={errors.title?.message} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Slug" required prefix="/blog/" {...register('slug')} error={errors.slug?.message} />
                <Input label="Read time (min)" type="number" {...register('readTime')} />
              </div>
              <Textarea label="Excerpt" rows={2} hint="Shown in listings & meta description fallback" {...register('excerpt')} />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Cover image</div>
            <ImageUpload label="" value={coverImage} onChange={setCoverImage} hint="16:9, min 1200px wide" />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">03 / Content</div>
            <RichEditor value={content} onChange={setContent} placeholder="Start writing…" minHeight={480} />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <div className="space-y-4">
              <Select label="Status" options={POST_STATUSES} {...register('status')} />
              <Input label="Publish date" type="datetime-local" {...register('publishedAt')} />
              <Switch label="Featured" {...register('featured')} />
            </div>
          </Card>
          <Card>
            <div className="text-eyebrow mb-4">Categories</div>
            <MultiSelect
              label=""
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
              value={categoryIds}
              onChange={setCategoryIds}
            />
          </Card>
          <Card>
            <div className="text-eyebrow mb-4">Tags</div>
            <Input label="" hint="Comma-separated" placeholder="seo, growth" {...register('tags')} />
          </Card>
          <Card>
            <div className="text-eyebrow mb-4">SEO</div>
            <div className="space-y-4">
              <Input label="Meta title" {...register('seo.title')} />
              <Textarea label="Meta description" rows={3} {...register('seo.description')} />
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
