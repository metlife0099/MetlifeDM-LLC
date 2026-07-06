import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ArrowLeft, ShoppingBag, Mail, Shield, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader, Badge, NewBadge } from '@/components/ui/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Select, SearchInput } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { usersApi, ordersApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { useAuth } from '@/hooks/useAuth.js';
import { formatDate, timeAgo, initials, formatMoney } from '@/utils/format.js';
import { ROLES, ROLE_LABELS, ADMIN_ROLES } from '@/utils/constants.js';

/* ============================================================
 * LIST
 * ============================================================ */
export function UsersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { page, debounced, role, status }],
    queryFn: () => usersApi.list({ page, search: debounced, role, status, limit: 25 }),
  });

  const columns = [
    {
      key: 'name', label: 'User',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 grid place-items-center bg-ink text-ivory text-mono text-xs shrink-0">
            {initials(`${r.firstName || ''} ${r.lastName || ''}`)}
          </span>
          <div className="min-w-0">
            <Link to={`/users/${r._id}`} className="text-sm text-ink hover:text-ultra truncate block">
              {r.firstName} {r.lastName}
            </Link>
            <div className="text-mono text-xs text-slate mt-0.5 truncate">{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (r) => <Badge tone={ADMIN_ROLES.includes(r.role) ? 'ultra' : 'outline'}>{ROLE_LABELS[r.role] || r.role}</Badge> },
    { key: 'orderCount', label: 'Orders', align: 'right', render: (r) => <span className="text-mono text-sm">{r.orderCount || 0}</span> },
    { key: 'lifetimeValue', label: 'LTV', align: 'right', render: (r) => <span className="text-mono text-sm num-plate">{formatMoney(r.lifetimeValue || 0)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'active'} /> },
    { key: 'createdAt', label: 'Joined', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operations / Users"
        title={<>All <span className="text-italic-fraunces text-ultra">users</span></>}
        subtitle="Customers and staff accounts."
        actions={<NewBadge resourceType="user" />}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" className="w-72" />
        <Select className="w-40" options={[
          { value: '', label: 'All roles' },
          ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
        ]} value={role} onChange={(e) => setRole(e.target.value)} />
        <Select className="w-40" options={[
          { value: '', label: 'All statuses' },
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' },
        ]} value={status} onChange={(e) => setStatus(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(row) => { window.location.assign(`/users/${row._id}`); }}
        emptyIcon={Users} emptyTitle="No users yet"
      />
    </>
  );
}

/* ============================================================
 * DETAILS
 * ============================================================ */
export function UserDetailsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;
  const [suspendOpen, setSuspendOpen] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => usersApi.get(id),
  });

  const { data: orders } = useQuery({
    queryKey: ['admin', 'user-orders', id],
    queryFn: () => ordersApi.list({ customer: id, limit: 10 }),
    enabled: !!user,
  });

  const updateRole = useMutation({
    mutationFn: (role) => usersApi.updateRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Role updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const suspend = useMutation({
    mutationFn: () => usersApi.suspend(id, 'Suspended by admin'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user', id] });
      toast.success('User suspended');
      setSuspendOpen(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const activate = useMutation({
    mutationFn: () => usersApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'user', id] });
      toast.success('User activated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <PageLoader label="Loading user" />;
  if (!user) return null;

  const isSuspended = user.status === 'suspended';

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Operations', href: '/users' },
        { label: 'Users', href: '/users' },
        { label: `${user.firstName} ${user.lastName || ''}` },
      ]} />
      <PageHeader
        eyebrow={`Joined ${formatDate(user.createdAt, 'medium')}`}
        title={<>{user.firstName} <span className="text-italic-fraunces text-ultra">{user.lastName}</span></>}
        subtitle={user.email}
        actions={
          <>
            <Button variant="ghost" to="/users" icon={ArrowLeft}>Back</Button>
            {isSuspended ? (
              <Button variant="ghost" icon={UserCheck} onClick={() => activate.mutate()} loading={activate.isPending}>Activate</Button>
            ) : (
              <Button variant="danger_ghost" icon={UserX} onClick={() => setSuspendOpen(true)}>Suspend</Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card padding={false} className="p-6">
            <div className="text-eyebrow mb-4">Profile</div>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Email</div><a href={`mailto:${user.email}`} className="mt-1 block hover:text-ultra">{user.email}</a></div>
              {user.phone && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Phone</div><div className="mt-1">{user.phone}</div></div>}
              {user.company?.name && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Company</div><div className="mt-1">{user.company.name}</div></div>}
              {user.company?.website && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Website</div><a href={user.company.website} target="_blank" rel="noopener noreferrer" className="mt-1 block hover:text-ultra truncate">{user.company.website}</a></div>}
              {user.company?.industry && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Industry</div><div className="mt-1">{user.company.industry}</div></div>}
              {user.address?.line1 && (
                <div className="sm:col-span-2">
                  <div className="text-mono text-xs text-slate uppercase tracking-widest">Address</div>
                  <div className="mt-1">
                    {user.address.line1}{user.address.line2 ? `, ${user.address.line2}` : ''}<br />
                    {[user.address.city, user.address.state, user.address.zip].filter(Boolean).join(', ')}
                    {user.address.country ? ` · ${user.address.country}` : ''}
                  </div>
                </div>
              )}
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Email verified</div><div className="mt-1">{user.emailVerified ? 'Yes' : 'No'}</div></div>
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">2FA</div><div className="mt-1">{user.twoFactor?.enabled ? 'Enabled' : 'Disabled'}</div></div>
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Last login</div><div className="mt-1 text-mono text-xs">{user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'Never'}</div></div>
              {isSuspended && user.suspensionReason && (
                <div className="sm:col-span-2"><div className="text-mono text-xs text-slate uppercase tracking-widest">Suspension reason</div><div className="mt-1 text-danger">{user.suspensionReason}</div></div>
              )}
            </div>
          </Card>

          <Card padding={false} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">Order history</div>
              <span className="text-mono text-xs text-slate">{orders?.meta?.total || 0} total</span>
            </div>
            {!orders?.data?.length ? (
              <div className="py-6 text-center text-slate text-sm">No orders yet.</div>
            ) : (
              <ul className="divide-editorial">
                {orders.data.map((o) => (
                  <li key={o._id} className="py-3 flex items-center justify-between gap-4">
                    <Link to={`/commerce/orders/${o._id}`} className="text-mono text-sm num-plate text-ink hover:text-ultra">
                      #{o.orderNumber || o._id?.slice(-8).toUpperCase()}
                    </Link>
                    <div className="text-mono text-xs text-slate uppercase tracking-widest">{formatDate(o.createdAt, 'medium')}</div>
                    <StatusPill status={o.status} />
                    <div className="text-mono text-sm num-plate w-24 text-right">{formatMoney(o.total)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Role</div>
            <Select
              options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
              value={user.role}
              onChange={(e) => updateRole.mutate(e.target.value)}
              disabled={!isSuperAdmin}
              hint={!isSuperAdmin ? 'Only super admins can change roles' : undefined}
            />
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Metrics</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate">Orders</span>
                <span className="num-plate">{user.orderCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Lifetime value</span>
                <span className="num-plate">{formatMoney(user.lifetimeValue || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate">Status</span>
                <StatusPill status={isSuspended ? 'suspended' : 'active'} />
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={() => suspend.mutate()}
        loading={suspend.isPending}
        title="Suspend this user?"
        description="They will be unable to log in until reactivated."
        confirmLabel="Suspend"
        variant="danger"
      />
    </>
  );
}
