import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2, MessageSquare, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs, Tabs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill } from '@/components/ui/index.jsx';
import { SearchInput } from '@/components/form/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { blogApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { timeAgo, truncate } from '@/utils/format.js';

export default function CommentsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'comments', { status, page, debounced }],
    queryFn: () => blogApi.listComments({ status, page, search: debounced, limit: 25 }),
  });

  const approve = useMutation({
    mutationFn: (id) => blogApi.approveComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'comments'] });
      toast.success('Comment approved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => blogApi.deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'comments'] });
      toast.success('Comment deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'author', label: 'Author',
      render: (r) => (
        <div>
          <div className="text-sm">{r.author?.name || r.name}</div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.author?.email || r.email}</div>
        </div>
      ),
    },
    {
      key: 'content', label: 'Comment',
      render: (r) => (
        <div className="text-sm text-slate max-w-md">{truncate(r.content, 120)}</div>
      ),
    },
    {
      key: 'post', label: 'Post',
      render: (r) => (
        r.post?.slug ? (
          <a href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/blog/${r.post.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs link-underline text-ink inline-flex items-center gap-1">
            {truncate(r.post.title, 40)}
            <ExternalLink size={11} strokeWidth={1.5} />
          </a>
        ) : <span className="text-xs text-slate">—</span>
      ),
    },
    { key: 'createdAt', label: 'Received', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status !== 'approved' && (
            <button onClick={() => approve.mutate(row._id)} className="p-1.5 text-slate hover:text-success" aria-label="Approve">
              <Check size={13} />
            </button>
          )}
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Content', href: '/content/blog' }, { label: 'Blog', href: '/content/blog' }, { label: 'Comments' }]} />
      <PageHeader
        eyebrow="Content / Blog / Comments"
        title={<>Comment <span className="text-italic-fraunces text-ultra">moderation</span></>}
        subtitle="Approve or reject reader comments."
        tabs={
          <Tabs
            items={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'spam', label: 'Spam' },
              { value: '', label: 'All' },
            ]}
            active={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
          />
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search comments…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={MessageSquare} emptyTitle="No comments" emptySubtitle="Comments will appear here for moderation."
      />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this comment?" confirmLabel="Delete" variant="danger" />
    </>
  );
}
