import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Calendar, MailPlus, Trash2, Download, ExternalLink, Plus, UserPlus, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Tabs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, NewBadge } from '@/components/ui/index.jsx';
import { Drawer, ConfirmDialog, Modal } from '@/components/ui/Modal.jsx';
import { Select, SearchInput, Textarea, Input } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { timeAgo, formatDate, truncate } from '@/utils/format.js';
import { CONTACT_STATUSES, CONSULTATION_STATUSES } from '@/utils/constants.js';

/* ============================================================
 * CONTACTS
 * ============================================================ */
export function ContactsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('new');
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'contacts', { page, debounced, status }],
    queryFn: () => leadsApi.listContacts({ page, search: debounced, status, limit: 25 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, adminNotes }) => leadsApi.updateContact(id, { status, adminNotes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'contacts'] });
      toast.success('Contact updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => leadsApi.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'contacts'] });
      toast.success('Contact deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'name', label: 'Contact',
      render: (r) => (
        <button onClick={() => setSelected(r)} className="text-left">
          <div className="text-sm hover:text-ultra">{r.firstName} {r.lastName}</div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.email}</div>
        </button>
      ),
    },
    { key: 'company', label: 'Company', render: (r) => <span className="text-sm">{r.company || '—'}</span> },
    { key: 'subject', label: 'Subject', render: (r) => <span className="text-sm text-slate">{truncate(r.subject || r.message, 40)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'new'} /> },
    { key: 'createdAt', label: 'Received', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); setDeleteId(row._id); }} className="p-1.5 text-slate hover:text-danger">
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Leads / Contact forms"
        title={<>Contact <span className="text-italic-fraunces text-ultra">submissions</span></>}
        subtitle="Everyone who filled out the contact form."
        actions={<NewBadge resourceType="contact" />}
        tabs={
          <Tabs
            items={[
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'converted', label: 'Converted' },
              { value: '', label: 'All' },
            ]}
            active={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
          />
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search contacts…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(row) => setSelected(row)}
        emptyIcon={Mail} emptyTitle="No contact submissions yet"
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.firstName} ${selected.lastName}` : ''}
        description={selected?.email}
        width="lg"
      >
        {selected && (
          <div className="space-y-6">
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Message</div>
              <div className="text-sm whitespace-pre-line leading-relaxed">{selected.message}</div>
            </Card>
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Details</div>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Email</div><a href={`mailto:${selected.email}`} className="mt-1 block hover:text-ultra">{selected.email}</a></div>
                {selected.phone && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Phone</div><div className="mt-1">{selected.phone}</div></div>}
                {selected.company && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Company</div><div className="mt-1">{selected.company}</div></div>}
                {selected.website && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Website</div><a href={selected.website} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 hover:text-ultra">{selected.website}<ExternalLink size={11} strokeWidth={1.5} /></a></div>}
                <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Received</div><div className="mt-1">{formatDate(selected.createdAt, 'datetime')}</div></div>
              </div>
            </Card>
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Status</div>
              <Select
                options={CONTACT_STATUSES}
                value={selected.status}
                onChange={(e) => updateStatus.mutate({ id: selected._id, status: e.target.value })}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this contact?" confirmLabel="Delete" variant="danger" />
    </>
  );
}

/* ============================================================
 * CONSULTATIONS
 * ============================================================ */
export function ConsultationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('requested');
  const [selected, setSelected] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'consultations', { page, debounced, status }],
    queryFn: () => leadsApi.listConsultations({ page, search: debounced, status, limit: 25 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => leadsApi.updateConsultation(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'consultations'] });
      toast.success('Consultation updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'name', label: 'Requester',
      render: (r) => (
        <button onClick={() => setSelected(r)} className="text-left">
          <div className="text-sm hover:text-ultra">{r.firstName} {r.lastName}</div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.email}</div>
        </button>
      ),
    },
    { key: 'company', label: 'Company', render: (r) => <span className="text-sm">{r.company || '—'}</span> },
    { key: 'preferredDate', label: 'Preferred', render: (r) => <span className="text-mono text-xs">{r.preferredDate ? formatDate(r.preferredDate, 'medium') : '—'}</span> },
    { key: 'budget', label: 'Budget', render: (r) => <span className="text-mono text-xs">{r.budget || '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'requested'} /> },
    { key: 'createdAt', label: 'Received', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Leads / Consultations"
        title={<>Consultation <span className="text-italic-fraunces text-ultra">bookings</span></>}
        subtitle="Free strategy calls requested through /consultation."
        actions={<NewBadge resourceType="consultation" />}
        tabs={
          <Tabs
            items={[
              { value: 'requested', label: 'Requested' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: '', label: 'All' },
            ]}
            active={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
          />
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search consultations…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(row) => setSelected(row)}
        emptyIcon={Calendar} emptyTitle="No consultation requests yet"
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.firstName} ${selected.lastName}` : ''}
        description={selected?.email}
        width="lg"
      >
        {selected && (
          <div className="space-y-6">
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Details</div>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Email</div><a href={`mailto:${selected.email}`} className="mt-1 block hover:text-ultra">{selected.email}</a></div>
                {selected.phone && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Phone</div><div className="mt-1">{selected.phone}</div></div>}
                {selected.company && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Company</div><div className="mt-1">{selected.company}</div></div>}
                {selected.website && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Website</div><a href={selected.website} target="_blank" rel="noopener noreferrer" className="mt-1 hover:text-ultra">{selected.website}</a></div>}
                {selected.budget && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Budget</div><div className="mt-1">{selected.budget}</div></div>}
                {selected.timeline && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Timeline</div><div className="mt-1">{selected.timeline}</div></div>}
                {selected.preferredDate && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Preferred date</div><div className="mt-1">{formatDate(selected.preferredDate, 'datetime')}</div></div>}
              </div>
            </Card>
            {selected.projectDescription && (
              <Card padding={false} className="p-5">
                <div className="text-eyebrow mb-3">Project description</div>
                <div className="text-sm whitespace-pre-line leading-relaxed">{selected.projectDescription}</div>
              </Card>
            )}
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Status</div>
              <Select
                options={CONSULTATION_STATUSES}
                value={selected.status}
                onChange={(e) => updateStatus.mutate({ id: selected._id, status: e.target.value })}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================================================
 * SUBSCRIBERS
 * ============================================================ */
export function SubscribersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscribers', { page, debounced }],
    queryFn: () => leadsApi.listSubscribers({ page, search: debounced, limit: 50 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'subscribers'] });

  const remove = useMutation({
    mutationFn: (id) => leadsApi.deleteSubscriber(id),
    onSuccess: () => {
      invalidate();
      toast.success('Subscriber removed');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const exportCsv = async () => {
    try {
      const response = await leadsApi.exportSubscribers();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${formatDate(new Date(), 'iso')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns = [
    {
      key: 'name', label: 'Name',
      render: (r) => <span className="text-sm">{r.name || <span className="text-slate">—</span>}</span>,
    },
    { key: 'email', label: 'Email', render: (r) => <span className="text-sm">{r.email}</span> },
    { key: 'source', label: 'Source', render: (r) => <span className="text-mono text-xs text-slate">{r.source || 'website'}</span> },
    { key: 'createdAt', label: 'Subscribed', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.isActive ? 'active' : 'unsubscribed'} /> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger">
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Leads / Newsletter"
        title={<>Newsletter <span className="text-italic-fraunces text-ultra">subscribers</span></>}
        subtitle="Everyone opted in to updates."
        actions={
          <>
            <NewBadge resourceType="subscriber" />
            <Button variant="ghost" onClick={exportCsv} icon={Download}>Export CSV</Button>
            <Button onClick={() => setAddOpen(true)} icon={UserPlus}>Add subscribers</Button>
          </>
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search subscribers…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={MailPlus} emptyTitle="No subscribers yet"
      />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Remove this subscriber?" confirmLabel="Remove" variant="danger" />
      <AddSubscribersModal open={addOpen} onClose={() => setAddOpen(false)} onDone={invalidate} />
    </>
  );
}

/* ============================================================
 * ADD SUBSCRIBERS — single / bulk / CSV+Excel import
 * ============================================================ */
function AddSubscribersModal({ open, onClose, onDone }) {
  const [tab, setTab] = useState('single');

  // Single
  const [single, setSingle] = useState({ name: '', email: '' });

  // Bulk (repeatable rows)
  const [rows, setRows] = useState([{ name: '', email: '' }]);

  // Import
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const reset = () => {
    setSingle({ name: '', email: '' });
    setRows([{ name: '', email: '' }]);
    setFile(null);
    setImportResult(null);
    setTab('single');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addSingle = useMutation({
    mutationFn: () => leadsApi.createSubscriber(single),
    onSuccess: () => {
      toast.success('Subscriber added');
      onDone();
      handleClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const addBulk = useMutation({
    mutationFn: () => leadsApi.createSubscribersBulk(rows.filter((r) => r.email.trim())),
    onSuccess: (r) => {
      toast.success(`${r.created} added, ${r.skipped} skipped`);
      onDone();
      handleClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const importFile = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', file);
      return leadsApi.importSubscribers(fd);
    },
    onSuccess: (r) => {
      setImportResult(r);
      onDone();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add subscribers"
      description="Add one at a time, paste several, or import a CSV/Excel file."
      size="lg"
    >
      <Tabs
        items={[
          { value: 'single', label: 'Single' },
          { value: 'bulk', label: 'Multiple' },
          { value: 'import', label: 'Import file' },
        ]}
        active={tab}
        onChange={(v) => { setTab(v); setImportResult(null); }}
        className="border-b border-hairline mb-6"
      />

      {tab === 'single' && (
        <div className="space-y-4">
          <Input
            label="Full name" placeholder="Jane Doe"
            value={single.name}
            onChange={(e) => setSingle((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            label="Email" type="email" required placeholder="jane@company.com"
            value={single.email}
            onChange={(e) => setSingle((s) => ({ ...s, email: e.target.value }))}
          />
          <div className="flex justify-end pt-2">
            <Button
              icon={UserPlus}
              disabled={!single.email.trim()}
              loading={addSingle.isPending}
              onClick={() => addSingle.mutate()}
            >
              Add subscriber
            </Button>
          </div>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="space-y-4">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {rows.map((row, i) => (
              <div key={i} className="grid gap-2 grid-cols-[1fr_1fr_auto] items-center">
                <input
                  className="px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                  placeholder="Full name"
                  value={row.name}
                  onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <input
                  className="px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                  placeholder="email@company.com"
                  value={row.email}
                  onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
                />
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                  className="text-slate hover:text-danger p-2"
                  disabled={rows.length === 1}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button" variant="ghost" size="xs" icon={Plus}
            onClick={() => setRows((r) => [...r, { name: '', email: '' }])}
          >
            Add row
          </Button>
          <div className="flex justify-end pt-2 border-t border-hairline">
            <Button
              icon={UserPlus}
              disabled={!rows.some((r) => r.email.trim())}
              loading={addBulk.isPending}
              onClick={() => addBulk.mutate()}
            >
              Add {rows.filter((r) => r.email.trim()).length || ''} subscribers
            </Button>
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div className="space-y-4">
          {!importResult ? (
            <>
              <div className="border border-dashed border-hairline-strong p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  id="subscriber-import-file"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="subscriber-import-file" className="cursor-pointer">
                  <Upload size={22} strokeWidth={1.25} className="text-slate mx-auto mb-3" />
                  <div className="text-sm">
                    {file ? file.name : 'Click to choose a CSV or Excel file'}
                  </div>
                  <div className="text-mono text-xs text-slate mt-2">
                    Needs a "name"/"full name" column and an "email" column
                  </div>
                </label>
              </div>
              <div className="flex justify-end">
                <Button
                  icon={Upload}
                  disabled={!file}
                  loading={importFile.isPending}
                  onClick={() => importFile.mutate()}
                >
                  Import
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-ivory-soft border border-hairline">
                <div className="text-sm">
                  <span className="text-success font-medium">{importResult.created} added</span>
                  {' · '}
                  <span className="text-slate">{importResult.skipped} skipped</span>
                </div>
              </div>
              {importResult.skippedDetails?.length > 0 && (
                <div className="max-h-48 overflow-y-auto text-xs space-y-1">
                  {importResult.skippedDetails.map((s, i) => (
                    <div key={i} className="flex justify-between text-slate border-b border-hairline py-1">
                      <span>{s.email}</span>
                      <span>{s.reason}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
