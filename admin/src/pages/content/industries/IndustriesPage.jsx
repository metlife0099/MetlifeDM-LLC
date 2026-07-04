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
import { Input, Textarea, Select, Switch, SearchInput } from '@/components/form/index.jsx';
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
  const [sort, setSort] = useState({ key: 'displayOrder', direction: 'asc' });
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
    { key: 'clientCount', label: 'Clients', align: 'right', render: (r) => <span className="text-mono text-sm">{r.clientCount || 0}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'active'} /> },
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
  tagline: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  displayOrder: z.coerce.number().optional(),
  challenges: z.array(z.object({ value: z.string() })).optional(),
  solutions: z.array(z.object({ value: z.string() })).optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
});

export function IndustryEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [description, setDescription] = useState('');

  const { data: ind, isLoading } = useQuery({
    queryKey: ['admin', 'industry', id],
    queryFn: () => industriesApi.get(id),
    enabled: !isNew,
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(industrySchema),
    defaultValues: { name: '', slug: '', status: 'active', challenges: [], solutions: [], seo: {} },
  });

  const challengesArr = useFieldArray({ control, name: 'challenges' });
  const solutionsArr = useFieldArray({ control, name: 'solutions' });

  useEffect(() => {
    if (ind && !isNew) {
      reset({
        ...ind,
        challenges: (ind.challenges || []).map((c) => ({ value: typeof c === 'string' ? c : c.value })),
        solutions: (ind.solutions || []).map((s) => ({ value: typeof s === 'string' ? s : s.value })),
      });
      setDescription(ind.description || '');
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
        challenges: (payload.challenges || []).map((c) => c.value).filter(Boolean),
        solutions: (payload.solutions || []).map((s) => s.value).filter(Boolean),
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

  const arrayField = (arr, name, placeholder) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-mono text-xs uppercase tracking-widest text-slate">{name}</div>
        <Button type="button" variant="ghost" size="xs" icon={Plus} onClick={() => arr.append({ value: '' })}>Add</Button>
      </div>
      {arr.fields.length === 0 ? (
        <div className="text-slate text-sm">None yet.</div>
      ) : (
        <div className="space-y-2">
          {arr.fields.map((f, i) => (
            <div key={f.id} className="flex gap-2 items-center">
              <input
                className="flex-1 px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                placeholder={placeholder}
                {...register(`${name === 'Challenges' ? 'challenges' : 'solutions'}.${i}.value`)}
              />
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
            <Button type="submit" icon={Save} loading={save.isPending} disabled={!isDirty && !isNew}>Save</Button>
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
              <Input label="Tagline" hint="One-line hook shown at the top of the page" {...register('tagline')} />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Description</div>
            <RichEditor value={description} onChange={setDescription} placeholder="Describe how MetlifeDM helps this industry…" />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">03 / Challenges & solutions</div>
            <div className="grid gap-6 md:grid-cols-2">
              {arrayField(challengesArr, 'Challenges', 'e.g. Low organic visibility')}
              {arrayField(solutionsArr, 'Solutions', 'e.g. Technical SEO audit')}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <div className="space-y-4">
              <Select label="Status" options={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ]} {...register('status')} />
              <Input label="Display order" type="number" {...register('displayOrder')} />
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
