import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, Quote, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge } from '@/components/ui/index.jsx';
import { Modal, ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Input, Textarea, Select, Switch, SearchInput, ImageUpload } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { testimonialsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { truncate } from '@/utils/format.js';

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editOpen, setEditOpen] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const debounced = useDebounce(search, 300);

  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'testimonials', { page, debounced, status }],
    queryFn: () => testimonialsApi.list({ page, search: debounced, status, limit: 25 }),
  });

  const save = useMutation({
    mutationFn: (d) => editOpen?._id ? testimonialsApi.update(editOpen._id, d) : testimonialsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
      toast.success('Testimonial saved');
      setEditOpen(null);
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => testimonialsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
      toast.success('Testimonial deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openEdit = (t) => {
    setEditOpen(t || {});
    setAvatar(t?.avatar || null);
    setCompanyLogo(t?.companyLogo || null);
    reset(t || { quote: '', name: '', role: '', company: '', rating: 5, isPublished: true, isFeatured: false });
  };

  useEffect(() => {
    if (editOpen && editOpen._id) {
      reset({ ...editOpen });
      setAvatar(editOpen.avatar || null);
      setCompanyLogo(editOpen.companyLogo || null);
    }
  }, [editOpen, reset]);

  const columns = [
    {
      key: 'quote', label: 'Quote',
      render: (r) => (
        <div className="max-w-md">
          <div className="text-italic-fraunces text-sm text-ink line-clamp-2">"{truncate(r.quote || r.content, 90)}"</div>
        </div>
      ),
    },
    {
      key: 'author', label: 'Author',
      render: (r) => (
        <div>
          <div className="text-sm">{r.name}</div>
          <div className="text-mono text-xs text-slate mt-0.5">
            {r.role}
            {r.company && ` · ${r.company}`}
          </div>
        </div>
      ),
    },
    {
      key: 'rating', label: 'Rating',
      render: (r) => (
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} strokeWidth={1.5} className={i < (r.rating || 0) ? 'fill-ultra text-ultra' : 'text-slate/30'} />
          ))}
        </div>
      ),
    },
    { key: 'featured', label: '', render: (r) => r.isFeatured && <Badge tone="ultra">Featured</Badge> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.isPublished ? 'published' : 'draft'} /> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></button>
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content / Testimonials"
        title={<>Client <span className="text-italic-fraunces text-ultra">testimonials</span></>}
        subtitle="Real quotes from real customers — shown on /testimonials and home."
        actions={<Button onClick={() => openEdit(null)} icon={Plus}>New testimonial</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search testimonials…" className="w-64" />
        <Select className="w-32" options={[{ value: '', label: 'All' }, { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]} value={status} onChange={(e) => setStatus(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={Quote} emptyTitle="No testimonials yet"
        emptyAction={<Button onClick={() => openEdit(null)} icon={Plus}>New testimonial</Button>}
      />

      <Modal
        open={editOpen !== null}
        onClose={() => { setEditOpen(null); reset(); }}
        title={editOpen?._id ? 'Edit testimonial' : 'New testimonial'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setEditOpen(null); reset(); }}>Cancel</Button>
            <Button onClick={handleSubmit((d) => {
              const payload = {
                ...d,
                rating: Number(d.rating),
                avatar: avatar || null,
                companyLogo: companyLogo || null,
              };
              save.mutate(payload);
            })} loading={save.isPending}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea label="Quote" required rows={4} {...register('quote')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Name" required {...register('name', { required: true })} />
            <Input label="Role" {...register('role')} />
            <Input label="Company" {...register('company')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUpload label="Avatar" value={avatar} onChange={setAvatar} folder="testimonials" />
            <ImageUpload label="Company logo" value={companyLogo} onChange={setCompanyLogo} folder="testimonials" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 items-end">
            <Select label="Rating" options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n} ★` }))} {...register('rating')} />
            <div className="pt-2">
              <Switch label="Published" {...register('isPublished')} />
            </div>
            <div className="pt-2">
              <Switch label="Featured" {...register('isFeatured')} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this testimonial?" confirmLabel="Delete" variant="danger" />
    </>
  );
}
