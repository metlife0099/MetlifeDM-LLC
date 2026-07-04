import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Layers, MoreVertical, ExternalLink, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge } from '@/components/ui/index.jsx';
import { Select, SearchInput } from '@/components/form/index.jsx';
import { FilterBar } from '@/components/ui/PageHeader.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { servicesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatMoney, formatDate } from '@/utils/format.js';
import { SERVICE_CATEGORIES } from '@/utils/constants.js';

export default function ServicesListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'order', direction: 'asc' });
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'services', { page, limit, debounced, category, status, sort }],
    queryFn: () =>
      servicesApi.list({
        page,
        limit,
        search: debounced || undefined,
        category: category || undefined,
        sortBy: sort.key,
        sortOrder: sort.direction,
      }),
  });

  // NOTE: the backend's listAllAdmin only filters on `category`/`search` — there's no
  // server-side status filter. We filter the current page's rows client-side on
  // `isPublished` instead; this only affects what's visible on the current page, it
  // does not change pagination counts/totals from the server.
  const rows = (data?.data || []).filter((row) => {
    if (!status) return true;
    return status === 'published' ? row.isPublished : !row.isPublished;
  });

  const remove = useMutation({
    mutationFn: (id) => servicesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      toast.success('Service deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'title',
      label: 'Service',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="text-lg">{row.icon || '📦'}</span>
          <div className="min-w-0">
            <Link
              to={`/content/services/${row._id}`}
              className="text-sm text-ink hover:text-ultra transition-colors"
            >
              {row.title}
            </Link>
            <div className="text-mono text-xs text-slate mt-0.5 truncate">/services/{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Badge tone="outline">
          {SERVICE_CATEGORIES.find((c) => c.value === row.category)?.label || row.category}
        </Badge>
      ),
    },
    {
      key: 'startingPrice',
      label: 'From',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-mono text-sm num-plate">{formatMoney(row.startingPrice)}</span>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      align: 'right',
      render: (row) => (
        <span className="text-mono text-xs text-slate">{row.orderCount || 0}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill status={row.isPublished ? 'published' : 'draft'} />,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (row) => (
        <span className="text-mono text-xs text-slate">{formatDate(row.updatedAt, 'short')}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 'w-20',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/content/services/${row._id}`}
            className="p-1.5 text-slate hover:text-ink transition-colors"
            aria-label="Edit"
          >
            <Edit3 size={13} strokeWidth={1.5} />
          </Link>
          <a
            href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/services/${row.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate hover:text-ink transition-colors"
            aria-label="View live"
          >
            <ExternalLink size={13} strokeWidth={1.5} />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row._id);
            }}
            className="p-1.5 text-slate hover:text-danger transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Content / Services"
        title={<>All <span className="text-italic-fraunces text-ultra">services</span></>}
        subtitle="Manage what MetlifeDM offers, including pricing plans and process."
        actions={
          <Button to="/content/services/new" icon={Plus}>
            New service
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search services…"
          className="w-64"
        />
        <Select
          className="w-40"
          options={[
            { value: '', label: 'All categories' },
            ...SERVICE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
          ]}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Select
          className="w-32"
          options={[
            { value: '', label: 'All statuses' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        sort={sort}
        onSortChange={setSort}
        emptyTitle="No services yet"
        emptySubtitle="Create your first service to make it available on the public site."
        emptyIcon={Layers}
        emptyAction={<Button to="/content/services/new" icon={Plus}>New service</Button>}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => remove.mutate(deleteId)}
        loading={remove.isPending}
        title="Delete this service?"
        description="This will remove it from the public site. Any active orders won't be affected."
        confirmLabel="Delete service"
        variant="danger"
      />
    </>
  );
}
