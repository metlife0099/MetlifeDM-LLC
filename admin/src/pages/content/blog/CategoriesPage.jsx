import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { Modal, ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Input, Textarea, SearchInput } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { blogApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { slugify } from '@/utils/format.js';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(null); // null | {} for new | object for edit
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'blog', 'categories'],
    queryFn: () => blogApi.listCategories(),
  });

  const rows = search
    ? categories.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const save = useMutation({
    mutationFn: (data) =>
      editOpen?._id ? blogApi.updateCategory(editOpen._id, data) : blogApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog', 'categories'] });
      toast.success('Category saved');
      setEditOpen(null);
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => blogApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog', 'categories'] });
      toast.success('Category deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openEdit = (cat) => {
    setEditOpen(cat || {});
    reset(cat || { name: '', slug: '', description: '' });
  };

  const name = watch('name');
  // Auto-slug on new
  const autoSlug = () => {
    if (!editOpen?._id && name) setValue('slug', slugify(name));
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="text-sm">{r.name}</span> },
    { key: 'slug', label: 'Slug', render: (r) => <span className="text-mono text-xs text-slate">{r.slug}</span> },
    { key: 'postCount', label: 'Posts', align: 'right', render: (r) => <span className="text-mono text-sm">{r.postCount || 0}</span> },
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
      <Breadcrumbs items={[{ label: 'Content', href: '/content/blog' }, { label: 'Blog', href: '/content/blog' }, { label: 'Categories' }]} />
      <PageHeader
        eyebrow="Content / Blog / Categories"
        title={<>Blog <span className="text-italic-fraunces text-ultra">categories</span></>}
        subtitle="Group posts by topic — shown in the blog category filter."
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
          <Input label="Slug" required prefix="/blog/category/" {...register('slug')} />
          <Textarea label="Description" rows={2} {...register('description')} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending}
        title="Delete this category?"
        description="Posts in this category will be uncategorized."
        confirmLabel="Delete" variant="danger"
      />
    </>
  );
}
