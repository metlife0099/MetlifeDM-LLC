import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, ExternalLink, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge } from '@/components/ui/index.jsx';
import { Select, SearchInput } from '@/components/form/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { portfolioApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate } from '@/utils/format.js';

export default function PortfolioListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' });
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'portfolio', { page, limit, debounced, status, sort }],
    queryFn: () =>
      portfolioApi.list({
        page,
        limit,
        search: debounced || undefined,
        status: status || undefined,
        sortBy: sort.key,
        sortOrder: sort.direction,
      }),
  });

  const remove = useMutation({
    mutationFn: (id) => portfolioApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'portfolio'] });
      toast.success('Project deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'title',
      label: 'Project',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.coverImage?.url ? (
            <img src={row.coverImage.url} alt="" className="w-10 h-10 object-cover" />
          ) : (
            <div className="w-10 h-10 bg-ivory-soft border border-hairline" />
          )}
          <div className="min-w-0">
            <Link
              to={`/content/portfolio/${row._id}`}
              className="text-sm text-ink hover:text-ultra transition-colors truncate block"
            >
              {row.title}
            </Link>
            <div className="text-mono text-xs text-slate mt-0.5 truncate">{row.client}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (r) => <Badge tone="outline">{r.category || '—'}</Badge> },
    { key: 'year', label: 'Year', render: (r) => <span className="text-mono text-xs">{r.year || '—'}</span> },
    { key: 'isPublished', label: 'Status', render: (r) => <StatusPill status={r.isPublished ? 'published' : 'draft'} /> },
    { key: 'updatedAt', label: 'Updated', render: (r) => <span className="text-mono text-xs text-slate">{formatDate(r.updatedAt, 'short')}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link to={`/content/portfolio/${row._id}`} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></Link>
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content / Portfolio"
        title={<>Client <span className="text-italic-fraunces text-ultra">work</span></>}
        subtitle="Case briefs, hero images, and results — everything shown in /portfolio."
        actions={<Button to="/content/portfolio/new" icon={Plus}>New project</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" className="w-64" />
        <Select
          className="w-32"
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        sort={sort}
        onSortChange={setSort}
        emptyIcon={FolderOpen}
        emptyTitle="No projects yet"
        emptySubtitle="Add your first client project to build out the portfolio."
        emptyAction={<Button to="/content/portfolio/new" icon={Plus}>New project</Button>}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => remove.mutate(deleteId)}
        loading={remove.isPending}
        title="Delete this project?"
        description="It will disappear from /portfolio immediately."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
