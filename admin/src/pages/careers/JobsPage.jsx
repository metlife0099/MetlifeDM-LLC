import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Briefcase, ExternalLink, Edit3, Trash2, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge, Card, PageLoader } from '@/components/ui/index.jsx';
import { Input, Textarea, Select, Switch, SearchInput } from '@/components/form/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { careersApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, slugify, humanize } from '@/utils/format.js';

const DEPARTMENTS = ['engineering', 'marketing', 'design', 'sales', 'operations', 'content', 'seo', 'ppc', 'social', 'leadership', 'other'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary'];

export function JobsListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'jobs', { page, debounced, department, status }],
    queryFn: () => careersApi.listJobs({ page, search: debounced, department, status, limit: 25 }),
  });

  const remove = useMutation({
    mutationFn: (id) => careersApi.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      toast.success('Job deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'title', label: 'Position',
      render: (r) => (
        <div>
          <Link to={`/careers/jobs/${r._id}`} className="text-sm text-ink hover:text-ultra">{r.title}</Link>
          <div className="text-mono text-xs text-slate mt-0.5">{humanize(r.department || '')}</div>
        </div>
      ),
    },
    { key: 'location', label: 'Location', render: (r) => <span className="text-xs">{r.location || 'Remote'}</span> },
    { key: 'employmentType', label: 'Type', render: (r) => <Badge tone="outline">{humanize(r.employmentType || '')}</Badge> },
    { key: 'applicationCount', label: 'Applications', align: 'right', render: (r) => <span className="text-mono text-sm">{r.applicationCount || 0}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'open'} /> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/careers/jobs/${row._id}`} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></Link>
          {row.slug && (
            <a href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/careers/${row.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate hover:text-ink"><ExternalLink size={13} /></a>
          )}
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Careers / Job openings"
        title={<>Open <span className="text-italic-fraunces text-ultra">positions</span></>}
        subtitle="Manage what appears on /careers."
        actions={<Button to="/careers/jobs/new" icon={Plus}>New job</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search jobs…" className="w-64" />
        <Select className="w-40" options={[{ value: '', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d, label: humanize(d) }))]} value={department} onChange={(e) => setDepartment(e.target.value)} />
        <Select className="w-32" options={[{ value: '', label: 'All statuses' }, { value: 'open', label: 'Open' }, { value: 'paused', label: 'Paused' }, { value: 'closed', label: 'Closed' }]} value={status} onChange={(e) => setStatus(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={Briefcase} emptyTitle="No jobs posted yet"
        emptyAction={<Button to="/careers/jobs/new" icon={Plus}>Post a job</Button>}
      />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this job?" confirmLabel="Delete" variant="danger" />
    </>
  );
}

const jobSchema = z.object({
  title: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  department: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  employmentType: z.string().optional(),
  shortDescription: z.string().min(10, 'At least 10 characters'),
  description: z.string().min(20, 'At least 20 characters'),
  status: z.enum(['open', 'paused', 'closed']),
  salary: z.object({
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  responsibilities: z.array(z.object({ value: z.string() })).optional(),
  requirements: z.array(z.object({ value: z.string() })).optional(),
  benefits: z.array(z.object({ value: z.string() })).optional(),
});

export function JobEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['admin', 'job', id],
    queryFn: () => careersApi.getJob(id),
    enabled: !isNew,
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '', slug: '', department: 'engineering', employmentType: 'full_time',
      status: 'open', salary: { currency: 'USD' }, responsibilities: [], requirements: [], benefits: [],
    },
  });

  const respArr = useFieldArray({ control, name: 'responsibilities' });
  const reqArr = useFieldArray({ control, name: 'requirements' });
  const benArr = useFieldArray({ control, name: 'benefits' });

  useEffect(() => {
    if (job && !isNew) {
      reset({
        ...job,
        responsibilities: (job.responsibilities || []).map((v) => ({ value: v })),
        requirements: (job.requirements || []).map((v) => ({ value: v })),
        benefits: (job.benefits || []).map((v) => ({ value: v })),
      });
    }
  }, [job, isNew, reset]);

  const title = watch('title');
  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = {
        ...payload,
        responsibilities: (payload.responsibilities || []).map((r) => r.value).filter(Boolean),
        requirements: (payload.requirements || []).map((r) => r.value).filter(Boolean),
        benefits: (payload.benefits || []).map((b) => b.value).filter(Boolean),
      };
      return isNew ? careersApi.createJob(clean) : careersApi.updateJob(id, clean);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
      toast.success(isNew ? 'Job posted' : 'Job updated');
      if (isNew) navigate(`/careers/jobs/${data._id || data.job?._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading job" />;

  const arrayField = (arr, arrName, placeholder) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-mono text-xs uppercase tracking-widest text-slate">{humanize(arrName)}</div>
        <Button type="button" variant="ghost" size="xs" icon={Plus} onClick={() => arr.append({ value: '' })}>Add</Button>
      </div>
      {arr.fields.length === 0 ? (
        <div className="text-slate text-sm">None yet.</div>
      ) : (
        <div className="space-y-2">
          {arr.fields.map((f, i) => (
            <div key={f.id} className="flex gap-2 items-center">
              <span className="num-plate text-slate text-xs w-8">{String(i + 1).padStart(2, '0')}</span>
              <input
                className="flex-1 px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                placeholder={placeholder}
                {...register(`${arrName}.${i}.value`)}
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
        { label: 'Careers', href: '/careers/jobs' },
        { label: 'Jobs', href: '/careers/jobs' },
        { label: isNew ? 'New' : job?.title || 'Edit' },
      ]} />
      <PageHeader
        eyebrow={isNew ? 'Create · Job' : `Editing · ${job?.slug || ''}`}
        title={isNew ? 'New job posting' : job?.title || 'Edit job'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/careers/jobs" icon={ArrowLeft}>Back</Button>
            {!isNew && job?.slug && (
              <Button type="button" variant="ghost" href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/careers/${job.slug}`} target="_blank" iconRight={ExternalLink}>View live</Button>
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
              <Input label="Job title" required {...register('title')} error={errors.title?.message} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Slug" required prefix="/careers/" {...register('slug')} error={errors.slug?.message} />
                <Select label="Department" required options={DEPARTMENTS.map((d) => ({ value: d, label: humanize(d) }))} {...register('department')} />
                <Input label="Location" required placeholder="Remote (US)" {...register('location')} error={errors.location?.message} />
                <Select label="Employment type" options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: humanize(t) }))} {...register('employmentType')} />
              </div>
              <Textarea label="Short description" required rows={2} {...register('shortDescription')} error={errors.shortDescription?.message} />
              <Textarea label="Full description" required rows={6} {...register('description')} error={errors.description?.message} />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Role details</div>
            <div className="space-y-6">
              {arrayField(respArr, 'responsibilities', 'e.g. Own quarterly SEO strategy')}
              {arrayField(reqArr, 'requirements', 'e.g. 5+ years in B2B SaaS')}
              {arrayField(benArr, 'benefits', 'e.g. Unlimited PTO')}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <Select label="Status" options={[
              { value: 'open', label: 'Open' },
              { value: 'paused', label: 'Paused' },
              { value: 'closed', label: 'Closed' },
            ]} {...register('status')} />
          </Card>
          <Card>
            <div className="text-eyebrow mb-4">Salary range</div>
            <div className="space-y-4">
              <Input label="Minimum" type="number" prefix="$" {...register('salary.min')} />
              <Input label="Maximum" type="number" prefix="$" {...register('salary.max')} />
              <Input label="Currency" {...register('salary.currency')} />
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
