import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, File, Edit3, Trash2, ArrowLeft, Save, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader } from '@/components/ui/index.jsx';
import { Input, Textarea, Select, Switch, SearchInput } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { pagesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, slugify } from '@/utils/format.js';

export function PagesListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pages', { page, debounced, status }],
    queryFn: () => pagesApi.list({ page, search: debounced || undefined, status: status || undefined, limit: 25 }),
  });

  const remove = useMutation({
    mutationFn: (id) => pagesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
      toast.success('Page deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'title', label: 'Page',
      render: (r) => (
        <div>
          <Link to={`/content/pages/${r._id}`} className="text-sm text-ink hover:text-ultra">{r.title}</Link>
          <div className="text-mono text-xs text-slate mt-0.5">/{r.slug}</div>
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.isPublished ? 'published' : 'draft'} /> },
    { key: 'updatedAt', label: 'Updated', render: (r) => <span className="text-mono text-xs text-slate">{formatDate(r.updatedAt, 'short')}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/content/pages/${row._id}`} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></Link>
          <a href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/${row.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate hover:text-ink"><ExternalLink size={13} /></a>
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content / Pages"
        title={<>CMS <span className="text-italic-fraunces text-ultra">pages</span></>}
        subtitle="Privacy, terms, cookies, and any other custom pages."
        actions={<Button to="/content/pages/new" icon={Plus}>New page</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search pages…" className="w-64" />
        <Select
          className="w-32"
          options={[{ value: '', label: 'All statuses' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={File} emptyTitle="No custom pages yet" emptySubtitle="Create pages like Privacy, Terms, or Cookies."
        emptyAction={<Button to="/content/pages/new" icon={Plus}>New page</Button>}
      />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this page?" confirmLabel="Delete" variant="danger" />
    </>
  );
}

export function PageEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [content, setContent] = useState('');

  const { data: page, isLoading } = useQuery({
    queryKey: ['admin', 'page', id],
    queryFn: () => pagesApi.get(id),
    enabled: !isNew,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { title: '', slug: '', isPublished: true },
  });

  useEffect(() => {
    if (page && !isNew) {
      reset(page);
      setContent(page.content || '');
    }
  }, [page, isNew, reset]);

  const title = watch('title');
  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = { ...payload, content };
      return isNew ? pagesApi.create(clean) : pagesApi.update(id, clean);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] });
      toast.success(isNew ? 'Page created' : 'Page updated');
      if (isNew) navigate(`/content/pages/${data._id || data.page?._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading page" />;

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))}>
      <Breadcrumbs items={[
        { label: 'Content', href: '/content/pages' },
        { label: 'Pages', href: '/content/pages' },
        { label: isNew ? 'New' : page?.title || 'Edit' },
      ]} />
      <PageHeader
        eyebrow={isNew ? 'Create · Page' : `Editing · /${page?.slug || ''}`}
        title={isNew ? 'New page' : page?.title || 'Edit page'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/content/pages" icon={ArrowLeft}>Back</Button>
            {!isNew && page?.slug && (
              <Button type="button" variant="ghost" href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/${page.slug}`} target="_blank" iconRight={ExternalLink}>View live</Button>
            )}
            <Button type="submit" icon={Save} loading={save.isPending}>Save</Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">01 / Basics</div>
            <div className="space-y-4">
              <Input label="Title" required {...register('title', { required: 'Required' })} error={errors.title?.message} />
              <Input label="Slug" required prefix="/" {...register('slug', { required: 'Required' })} error={errors.slug?.message} />
              <Textarea label="Excerpt" rows={2} hint="Short intro shown at the top" {...register('excerpt')} />
            </div>
          </Card>
          <Card>
            <div className="text-eyebrow mb-4">02 / Content</div>
            <RichEditor value={content} onChange={setContent} placeholder="Write the page content…" minHeight={480} />
          </Card>
        </div>
        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <Switch label="Published" {...register('isPublished')} />
          </Card>
          <Card>
            <div className="text-eyebrow mb-4">SEO</div>
            <div className="space-y-4">
              <Input label="Meta title" {...register('seo.metaTitle')} />
              <Textarea label="Meta description" rows={3} {...register('seo.metaDescription')} />
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
