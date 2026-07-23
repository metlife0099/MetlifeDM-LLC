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
import { StatusPill, Card, PageLoader, Badge } from '@/components/ui/index.jsx';
import { Input, Textarea, Select, Switch, SearchInput, ImageUpload, MultiSelect } from '@/components/form/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { caseStudiesApi, servicesApi, industriesApi } from '@/api/index.js';
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
  const [industry, setIndustry] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' });
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data: industries = [] } = useQuery({
    queryKey: ['admin', 'industries', 'all'],
    queryFn: () => industriesApi.list({ limit: 100 }).then((r) => r.data || []),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'case-studies', 'categories'],
    queryFn: () => caseStudiesApi.listCategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'case-studies', { page, limit, debounced, industry, category, status, sort }],
    queryFn: () =>
      caseStudiesApi.list({
        page,
        limit,
        search: debounced,
        industry: industry || undefined,
        category: category || undefined,
        status: status || undefined,
        sortBy: sort.key,
        sortOrder: sort.direction,
      }),
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
    { key: 'category', label: 'Category', render: (r) => <Badge tone="outline">{r.category?.name || '—'}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.isPublished ? 'published' : 'draft'} /> },
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
        subtitle="Long-form breakdowns of the work — challenge, approach, result."
        actions={
          <>
            <Button variant="ghost" to="/content/case-studies/categories">Categories</Button>
            <Button to="/content/case-studies/new" icon={Plus}>New case study</Button>
          </>
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search case studies…" className="w-64" />
        <Select
          className="w-40"
          options={[{ value: '', label: 'All industries' }, ...industries.map((i) => ({ value: i.name, label: i.name }))]}
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
        <Select
          className="w-44"
          options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Select
          className="w-32"
          options={[{ value: '', label: 'All statuses' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
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
  client: z.string().min(1, 'Required'),
  industry: z.string().optional(),
  category: z.string().optional(),
  tagline: z.string().optional(),
  duration: z.string().optional(),
  year: z.coerce.number().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  challenge: z.string().min(1, 'Required'),
  approach: z.string().optional(),
  solution: z.string().min(1, 'Required'),
  result: z.string().min(1, 'Required'),
  services: z.array(z.string()).optional(),
  kpis: z.array(z.object({ label: z.string(), before: z.string().optional(), after: z.string().optional(), change: z.string().optional(), icon: z.string().optional() })).optional(),
  testimonial: z.object({ quote: z.string().optional(), author: z.string().optional(), role: z.string().optional() }).optional(),
  seo: z.object({ metaTitle: z.string().optional(), metaDescription: z.string().optional() }).optional(),
});

export function CaseStudyEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [heroImage, setHeroImage] = useState(null);

  const { data: cs, isLoading } = useQuery({
    queryKey: ['admin', 'case-study', id],
    queryFn: () => caseStudiesApi.get(id),
    enabled: !isNew,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['admin', 'services', 'all'],
    queryFn: () => servicesApi.list({ limit: 100 }),
  });
  const services = servicesData?.data || [];

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'case-studies', 'categories'],
    queryFn: () => caseStudiesApi.listCategories(),
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['admin', 'industries', 'all'],
    queryFn: () => industriesApi.list({ limit: 100 }).then((r) => r.data || []),
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: { title: '', slug: '', isPublished: false, services: [], kpis: [], testimonial: {}, seo: {} },
  });

  const kpisArr = useFieldArray({ control, name: 'kpis' });
  const servicesValue = watch('services') || [];

  useEffect(() => {
    if (cs && !isNew) {
      reset({
        ...cs,
        services: (cs.services || []).map((s) => (typeof s === 'string' ? s : s._id)),
      });
      setHeroImage(cs.heroImage);
    }
  }, [cs, isNew, reset]);

  const title = watch('title');
  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = { ...payload, heroImage };
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
            <Button type="submit" icon={Save} loading={save.isPending}>Save</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">01 / Basics</div>
            <div className="space-y-4">
              <Input label="Title" required {...register('title')} error={errors.title?.message} />
              <Input label="Tagline" placeholder="Short one-liner shown in listings" {...register('tagline')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Slug" required prefix="/case-studies/" {...register('slug')} error={errors.slug?.message} />
                <Input label="Client" required {...register('client')} error={errors.client?.message} />
                <Select
                  label="Industry"
                  options={[{ value: '', label: 'No industry' }, ...industries.map((i) => ({ value: i.name, label: i.name }))]}
                  {...register('industry')}
                />
                <Select
                  label="Category"
                  options={[{ value: '', label: 'No category' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]}
                  {...register('category')}
                />
                <Input label="Duration" placeholder="e.g. 6 months" {...register('duration')} />
                <Input label="Year" type="number" {...register('year')} />
              </div>
              <MultiSelect
                label="Services"
                options={services.map((s) => ({ value: s._id, label: s.title }))}
                value={servicesValue}
                onChange={(next) => setValue('services', next, { shouldDirty: true })}
              />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Cover image</div>
            <ImageUpload label="" value={heroImage} onChange={setHeroImage} />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">03 / Narrative</div>
            <div className="space-y-4">
              <Textarea label="Challenge" required rows={4} {...register('challenge')} error={errors.challenge?.message} />
              <Textarea label="Approach" rows={4} {...register('approach')} />
              <Textarea label="Solution" required rows={4} {...register('solution')} error={errors.solution?.message} />
              <Textarea label="Result" required rows={4} {...register('result')} error={errors.result?.message} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">04 / KPIs</div>
              <Button type="button" variant="ghost" size="xs" icon={Plus} onClick={() => kpisArr.append({ label: '', before: '', after: '', change: '', icon: '' })}>Add</Button>
            </div>
            {kpisArr.fields.length === 0 ? (
              <div className="text-slate text-sm">Add the measurable outcomes.</div>
            ) : (
              <div className="space-y-3">
                {kpisArr.fields.map((f, i) => (
                  <div key={f.id} className="flex gap-2 items-start p-3 border border-hairline-strong">
                    <div className="flex-1 space-y-2">
                      <input className="w-full px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none" placeholder="Label (e.g. Organic traffic)" {...register(`kpis.${i}.label`)} />
                      <div className="grid grid-cols-2 gap-2">
                        <input className="w-full px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none num-plate" placeholder="Before" {...register(`kpis.${i}.before`)} />
                        <input className="w-full px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none num-plate" placeholder="After" {...register(`kpis.${i}.after`)} />
                      </div>
                      <input className="w-full px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none" placeholder="Change (optional, e.g. +240%)" {...register(`kpis.${i}.change`)} />
                    </div>
                    <button type="button" onClick={() => kpisArr.remove(i)} className="text-slate hover:text-danger p-2"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">05 / Client quote</div>
            <div className="space-y-4">
              <Textarea label="Quote" rows={3} {...register('testimonial.quote')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Author" {...register('testimonial.author')} />
                <Input label="Role" {...register('testimonial.role')} />
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <div className="space-y-4">
              <Switch label="Published" {...register('isPublished')} />
              <Switch label="Featured" {...register('isFeatured')} />
            </div>
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
