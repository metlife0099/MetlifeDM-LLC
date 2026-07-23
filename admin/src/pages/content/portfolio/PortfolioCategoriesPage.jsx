import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { Modal, ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Input, SearchInput } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { portfolioApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { slugify } from '@/utils/format.js';

export default function PortfolioCategoriesPage() {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(null); // null | {} for new | object for edit
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'portfolio', 'categories'],
    queryFn: () => portfolioApi.listCategories(),
  });

  const rows = search
    ? categories.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const save = useMutation({
    mutationFn: (data) =>
      editOpen?._id ? portfolioApi.updateCategory(editOpen._id, data) : portfolioApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'portfolio', 'categories'] });
      toast.success('Category saved');
      setEditOpen(null);
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => portfolioApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'portfolio', 'categories'] });
      toast.success('Category deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openEdit = (cat) => {
    setEditOpen(cat || {});
    reset(cat || { name: '', slug: '', color: '#1547FF' });
  };

  const name = watch('name');
  const autoSlug = () => {
    if (!editOpen?._id && name) setValue('slug', slugify(name));
  };

  const columns = [
    {
      key: 'name', label: 'Name',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color || '#1547FF' }} />
          <span className="text-sm">{r.name}</span>
        </div>
      ),
    },
    { key: 'slug', label: 'Slug', render: (r) => <span className="text-mono text-xs text-slate">{r.slug}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 text-slate hover:text-ink cursor-pointer"><Edit3 size={13} /></button>
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger cursor-pointer"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Content', href: '/content/portfolio' }, { label: 'Portfolio', href: '/content/portfolio' }, { label: 'Categories' }]} />
      <PageHeader
        eyebrow="Content / Portfolio / Categories"
        title={<>Portfolio <span className="text-italic-fraunces text-ultra">categories</span></>}
        subtitle="Shown as the category filter on the public portfolio page."
        actions={<Button onClick={() => openEdit(null)} icon={Plus}>New category</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={rows} loading={isLoading}
        emptyIcon={Tag} emptyTitle="No categories yet"
        emptyAction={<Button onClick={() => openEdit(null)} icon={Plus}>New category</Button>}
      />

      <Modal
        open={editOpen !== null}
        onClose={() => { setEditOpen(null); reset(); }}
        title={editOpen?._id ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => { setEditOpen(null); reset(); }}>Cancel</Button>
            <Button onClick={handleSubmit((d) => save.mutate(d))} loading={save.isPending}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" required {...register('name')} onBlur={autoSlug} />
          <Input label="Slug" required prefix="/portfolio?category=" {...register('slug')} />
          <Input label="Color" type="color" {...register('color')} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending}
        title="Delete this category?"
        description="Portfolio items in this category will be uncategorized."
        confirmLabel="Delete" variant="danger"
      />
    </>
  );
}
