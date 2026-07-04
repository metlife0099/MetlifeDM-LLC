import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, BookOpen, ExternalLink, Edit3, Trash2, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader } from '@/components/ui/index.jsx';
import { Input, Textarea, Select, Switch, SearchInput, ImageUpload } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { caseStudiesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, slugify } from '@/utils/format.js';

/* ============================================================
 * LIST
 * ============================================================ */
export function CaseStudiesListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' });
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'case-studies', { page, limit, debounced, status, sort }],
    queryFn: () => caseStudiesApi.list({ page, limit, search: debounced, status, sortBy: sort.key, sortOrder: sort.direction }),
  });

  const remove = useMutation({
    mutationFn: (id) => caseStudiesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'case-studies'] });
      toast.success('Case study deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'title', label: 'Case study', sortable: true,
      render: (r) => (
        <div>
          <Link to={`/content/case-studies/${r._id}`} className="text-sm text-ink hover:text-ultra">{r.title}</Link>
          <div className="text-mono text-xs text-slate mt-0.5">{r.client}</div>
        </div>
      ),
    },
    { key: 'industry', label: 'Industry', render: (r) => <span className="text-xs text-slate">{r.industry || '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'updatedAt', label: 'Updated', render: (r) => <span className="text-mono text-xs text-slate">{formatDate(r.updatedAt, 'short')}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/content/case-studies/${row._id}`} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></Link>
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content / Case studies"
        title={<>Client <span className="text-italic-fraunces text-ultra">case studies</span></>}
        subtitle="Long-form breakdowns of the work — challenge, strategy, outcome."
        actions={<Button to="/content/case-studies/new" icon={Plus}>New case study</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search case studies…" className="w-64" />
        <Select className="w-32" options={[{ value: '', label: 'All statuses' }, { value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} value={status} onChange={(e) => setStatus(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        sort={sort} onSortChange={setSort}
        emptyIcon={BookOpen} emptyTitle="No case studies yet" emptySubtitle="Publish your first case study."
        emptyAction={<Button to="/content/case-studies/new" icon={Plus}>New case study</Button>}
      />
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending}
        title="Delete this case study?" confirmLabel="Delete" variant="danger"
      />
    </>
  );
}

/* ============================================================
 * EDIT
 * ============================================================ */
const editSchema = z.object({
  title: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  client: z.string().optional(),
  industry: z.string().optional(),
  duration: z.string().optional(),
  status: z.enum(['draft', 'published']),
  featured: z.boolean().optional(),
  challenge: z.string().optional(),
  strategy: z.string().optional(),
  execution: z.string().optional(),
  outcome: z.string().optional(),
  results: z.array(z.object({ metric: z.string(), value: z.string(), context: z.string().optional() })).optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
});

export function CaseStudyEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [coverImage, setCoverImage] = useState(null);

  const { data: cs, isLoading } = useQuery({
    queryKey: ['admin', 'case-study', id],
    queryFn: () => caseStudiesApi.get(id),
    enabled: !isNew,
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: { title: '', slug: '', status: 'draft', results: [], seo: {} },
  });

  const resultsArr = useFieldArray({ control, name: 'results' });

  useEffect(() => {
    if (cs && !isNew) {
      reset(cs);
      setCoverImage(cs.coverImage);
    }
  }, [cs, isNew, reset]);

  const title = watch('title');
  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = { ...payload, coverImage: coverImage instanceof File ? undefined : coverImage };
      return isNew ? caseStudiesApi.create(clean) : caseStudiesApi.update(id, clean);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'case-studies'] });
      toast.success(isNew ? 'Case study created' : 'Case study updated');
      if (isNew) navigate(`/content/case-studies/${data._id || data.caseStudy?._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading case study" />;

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))}>
      <Breadcrumbs items={[
        { label: 'Content', href: '/content/case-studies' },
        { label: 'Case studies', href: '/content/case-studies' },
        { label: isNew ? 'New' : cs?.title || 'Edit' },
      ]} />
      <PageHeader
        eyebrow={isNew ? 'Create · Case study' : `Editing · ${cs?.slug || ''}`}
        title={isNew ? 'New case study' : cs?.title || 'Edit case study'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/content/case-studies" icon={ArrowLeft}>Back</Button>
            {!isNew && cs?.slug && (
              <Button type="button" variant="ghost" href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/case-studies/${cs.slug}`} target="_blank" iconRight={ExternalLink}>View live</Button>
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
                <Input label="Slug" required prefix="/case-studies/" {...register('slug')} error={errors.slug?.message} />
                <Input label="Client" {...register('client')} />
                <Input label="Industry" {...register('industry')} />
                <Input label="Duration" placeholder="e.g. 6 months" {...register('duration')} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Cover image</div>
            <ImageUpload label="" value={coverImage} onChange={setCoverImage} />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">03 / Narrative</div>
            <div className="space-y-4">
              <Textarea label="Challenge" rows={4} {...register('challenge')} />
              <Textarea label="Strategy" rows={4} {...register('strategy')} />
              <Textarea label="Execution" rows={4} {...register('execution')} />
              <Textarea label="Outcome" rows={4} {...register('outcome')} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">04 / Results</div>
              <Button type="button" variant="ghost" size="xs" icon={Plus} onClick={() => resultsArr.append({ metric: '', value: '' })}>Add</Button>
            </div>
            {resultsArr.fields.length === 0 ? (
              <div className="text-slate text-sm">Add the measurable outcomes.</div>
            ) : (
              <div className="space-y-2">
                {resultsArr.fields.map((f, i) => (
                  <div key={f.id} className="grid gap-2 grid-cols-[1fr_1fr_1.5fr_auto] items-center">
                    <input className="px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none" placeholder="Metric" {...register(`results.${i}.metric`)} />
                    <input className="px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none num-plate" placeholder="Value" {...register(`results.${i}.value`)} />
                    <input className="px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none" placeholder="Context (optional)" {...register(`results.${i}.context`)} />
                    <button type="button" onClick={() => resultsArr.remove(i)} className="text-slate hover:text-danger p-2"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <div className="space-y-4">
              <Select label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} {...register('status')} />
              <Switch label="Featured" {...register('featured')} />
            </div>
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
