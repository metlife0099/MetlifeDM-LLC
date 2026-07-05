import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Building2, ExternalLink, Edit3, Trash2, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader } from '@/components/ui/index.jsx';
import { Input, Textarea, Switch, SearchInput, ImageUpload } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { industriesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, slugify } from '@/utils/format.js';

export function IndustriesListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'order', direction: 'asc' });
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'industries', { page, limit, debounced, sort }],
    queryFn: () => industriesApi.list({ page, limit, search: debounced, sortBy: sort.key, sortOrder: sort.direction }),
  });

  const remove = useMutation({
    mutationFn: (id) => industriesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'industries'] });
      toast.success('Industry deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'name', label: 'Industry', sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="text-lg">{r.icon || '🏢'}</span>
          <Link to={`/content/industries/${r._id}`} className="text-sm text-ink hover:text-ultra">{r.name}</Link>
        </div>
      ),
    },
    { key: 'isPublished', label: 'Status', render: (r) => <StatusPill status={r.isPublished ? 'published' : 'draft'} /> },
    { key: 'updatedAt', label: 'Updated', render: (r) => <span className="text-mono text-xs text-slate">{formatDate(r.updatedAt, 'short')}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/content/industries/${row._id}`} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></Link>
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content / Industries"
        title={<>Industries <span className="text-italic-fraunces text-ultra">served</span></>}
        subtitle="Vertical positioning — shown on /industries and the industries dropdown."
        actions={<Button to="/content/industries/new" icon={Plus}>New industry</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search industries…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        sort={sort} onSortChange={setSort}
        emptyIcon={Building2} emptyTitle="No industries yet" emptySubtitle="Add the verticals you serve."
        emptyAction={<Button to="/content/industries/new" icon={Plus}>New industry</Button>}
      />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this industry?" confirmLabel="Delete" variant="danger" />
    </>
  );
}

const industrySchema = z.object({
  name: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  icon: z.string().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().optional(),
  challenges: z.array(z.object({ title: z.string().optional(), description: z.string().optional() })).optional(),
  solutions: z.array(z.object({ title: z.string().optional(), description: z.string().optional(), icon: z.string().optional() })).optional(),
  seo: z.object({ metaTitle: z.string().optional(), metaDescription: z.string().optional() }).optional(),
});

export function IndustryEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [description, setDescription] = useState('');
  const [heroImage, setHeroImage] = useState(null);

  const { data: ind, isLoading } = useQuery({
    queryKey: ['admin', 'industry', id],
    queryFn: () => industriesApi.get(id),
    enabled: !isNew,
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(industrySchema),
    defaultValues: { name: '', slug: '', isPublished: true, isFeatured: false, challenges: [], solutions: [], seo: {} },
  });

  const challengesArr = useFieldArray({ control, name: 'challenges' });
  const solutionsArr = useFieldArray({ control, name: 'solutions' });

  useEffect(() => {
    if (ind && !isNew) {
      reset({
        ...ind,
        challenges: (ind.challenges || []).map((c) => ({ title: c.title || '', description: c.description || '' })),
        solutions: (ind.solutions || []).map((s) => ({ title: s.title || '', description: s.description || '', icon: s.icon || '' })),
      });
      setDescription(ind.description || '');
      setHeroImage(ind.heroImage || null);
    }
  }, [ind, isNew, reset]);

  const name = watch('name');
  useEffect(() => {
    if (isNew && name) setValue('slug', slugify(name));
  }, [name, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = {
        ...payload,
        description,
        heroImage,
        challenges: (payload.challenges || []).filter((c) => c.title || c.description),
        solutions: (payload.solutions || []).filter((s) => s.title || s.description || s.icon),
      };
      return isNew ? industriesApi.create(clean) : industriesApi.update(id, clean);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'industries'] });
      toast.success(isNew ? 'Industry created' : 'Industry updated');
      if (isNew) navigate(`/content/industries/${data._id || data.industry?._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading industry" />;

  const arrayField = (arr, fieldName, label, opts = {}) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-mono text-xs uppercase tracking-widest text-slate">{label}</div>
        <Button
          type="button" variant="ghost" size="xs" icon={Plus}
          onClick={() => arr.append(opts.withIcon ? { title: '', description: '', icon: '' } : { title: '', description: '' })}
        >Add</Button>
      </div>
      {arr.fields.length === 0 ? (
        <div className="text-slate text-sm">None yet.</div>
      ) : (
        <div className="space-y-3">
          {arr.fields.map((f, i) => (
            <div key={f.id} className="flex gap-2 items-start p-3 border border-hairline-strong">
              <div className="flex-1 space-y-2">
                <input
                  className="w-full px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                  placeholder="Title"
                  {...register(`${fieldName}.${i}.title`)}
                />
                <textarea
                  className="w-full px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                  placeholder="Description"
                  rows={2}
                  {...register(`${fieldName}.${i}.description`)}
                />
                {opts.withIcon && (
                  <input
                    className="w-full px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                    placeholder="Icon (optional)"
                    {...register(`${fieldName}.${i}.icon`)}
                  />
                )}
              </div>
              <button type="button" onClick={() => arr.remove(i)} className="text-slate hover:text-danger p-2"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))}>
      <Breadcrumbs items={[
        { label: 'Content', href: '/content/industries' },
        { label: 'Industries', href: '/content/industries' },
        { label: isNew ? 'New' : ind?.name || 'Edit' },
      ]} />
      <PageHeader
        eyebrow={isNew ? 'Create · Industry' : `Editing · ${ind?.slug || ''}`}
        title={isNew ? 'New industry' : ind?.name || 'Edit industry'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/content/industries" icon={ArrowLeft}>Back</Button>
            {!isNew && ind?.slug && (
              <Button type="button" variant="ghost" href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/industries/${ind.slug}`} target="_blank" iconRight={ExternalLink}>View live</Button>
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
              <Input label="Industry name" required {...register('name')} error={errors.name?.message} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Slug" required prefix="/industries/" {...register('slug')} error={errors.slug?.message} />
                <Input label="Icon (emoji)" placeholder="🏥" {...register('icon')} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Cover image</div>
            <ImageUpload label="" value={heroImage} onChange={setHeroImage} hint="16:9 recommended, JPG/PNG/WebP" />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">03 / Description</div>
            <RichEditor value={description} onChange={setDescription} placeholder="Describe how MetlifeDM helps this industry…" />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">04 / Challenges & solutions</div>
            <div className="grid gap-6 md:grid-cols-2">
              {arrayField(challengesArr, 'challenges', 'Challenges')}
              {arrayField(solutionsArr, 'solutions', 'Solutions', { withIcon: true })}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <div className="space-y-4">
              <Switch label="Published" {...register('isPublished')} />
              <Switch label="Featured" {...register('isFeatured')} />
              <Input label="Display order" type="number" {...register('order')} />
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
