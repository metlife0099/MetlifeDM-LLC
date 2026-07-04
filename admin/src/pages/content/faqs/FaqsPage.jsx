import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge } from '@/components/ui/index.jsx';
import { Modal, ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Input, Textarea, Select, Switch, SearchInput } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { faqsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { truncate } from '@/utils/format.js';

const CATEGORIES = ['general', 'services', 'billing', 'technical', 'account'];

export default function FaqsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editOpen, setEditOpen] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'faqs', { page, debounced, category }],
    queryFn: () => faqsApi.list({ page, search: debounced, category, limit: 25 }),
  });

  const save = useMutation({
    mutationFn: (d) => editOpen?._id ? faqsApi.update(editOpen._id, d) : faqsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      toast.success('FAQ saved');
      setEditOpen(null);
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => faqsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      toast.success('FAQ deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openEdit = (f) => {
    setEditOpen(f || {});
    reset(f || { question: '', answer: '', category: 'general', displayOrder: 0, status: 'published' });
  };

  const columns = [
    {
      key: 'question', label: 'Question',
      render: (r) => (
        <div className="max-w-md">
          <div className="text-sm">{r.question}</div>
          <div className="text-xs text-slate mt-0.5 line-clamp-1">{truncate(r.answer, 90)}</div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (r) => <Badge tone="outline">{r.category}</Badge> },
    { key: 'displayOrder', label: 'Order', align: 'right', render: (r) => <span className="text-mono text-xs">{r.displayOrder || 0}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'published'} /> },
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
        eyebrow="Content / FAQs"
        title={<>Frequently asked <span className="text-italic-fraunces text-ultra">questions</span></>}
        subtitle="Answers shown on /faq — searchable + categorized."
        actions={<Button onClick={() => openEdit(null)} icon={Plus}>New FAQ</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search FAQs…" className="w-64" />
        <Select
          className="w-40"
          options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))]}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={HelpCircle} emptyTitle="No FAQs yet"
        emptyAction={<Button onClick={() => openEdit(null)} icon={Plus}>New FAQ</Button>}
      />

      <Modal
        open={editOpen !== null}
        onClose={() => { setEditOpen(null); reset(); }}
        title={editOpen?._id ? 'Edit FAQ' : 'New FAQ'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setEditOpen(null); reset(); }}>Cancel</Button>
            <Button onClick={handleSubmit((d) => save.mutate(d))} loading={save.isPending}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Question" required {...register('question')} />
          <Textarea label="Answer" required rows={6} {...register('answer')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Category" options={CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))} {...register('category')} />
            <Input label="Display order" type="number" {...register('displayOrder')} />
            <Select label="Status" options={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]} {...register('status')} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this FAQ?" confirmLabel="Delete" variant="danger" />
    </>
  );
}
