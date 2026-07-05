import { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, ArrowLeft, Send, Paperclip, UserCircle, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader, Badge, NewBadge } from '@/components/ui/index.jsx';
import { Select, SearchInput, Textarea, Switch } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { ticketsApi, usersApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, timeAgo, initials, truncate, humanize } from '@/utils/format.js';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '@/utils/constants.js';

/* ============================================================
 * LIST
 * ============================================================ */
export function TicketsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tickets', { page, debounced, status, priority }],
    queryFn: () => ticketsApi.list({ page, search: debounced, status, priority, limit: 25 }),
  });

  const priorityTone = (p) => ({ urgent: 'danger', high: 'warn', medium: 'info', low: 'default' })[p] || 'default';

  const columns = [
    {
      key: 'ticketNumber', label: 'Ticket',
      render: (r) => (
        <Link to={`/support/tickets/${r._id}`} className="text-mono text-sm num-plate text-ink hover:text-ultra">
          #{r.ticketNumber || r._id?.slice(-8).toUpperCase()}
        </Link>
      ),
    },
    {
      key: 'subject', label: 'Subject',
      render: (r) => (
        <div className="max-w-md">
          <Link to={`/support/tickets/${r._id}`} className="text-sm text-ink hover:text-ultra block truncate">
            {r.subject}
          </Link>
          <div className="text-mono text-xs text-slate mt-0.5">
            {r.customer?.email || r.customerEmail}
          </div>
        </div>
      ),
    },
    { key: 'priority', label: 'Priority', render: (r) => <Badge tone={priorityTone(r.priority)}>{humanize(r.priority || 'medium')}</Badge> },
    {
      key: 'assignedTo', label: 'Assigned',
      render: (r) => r.assignedTo ? (
        <span className="text-xs">{r.assignedTo.firstName} {r.assignedTo.lastName || ''}</span>
      ) : <span className="text-mono text-xs text-slate">Unassigned</span>,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'open'} /> },
    { key: 'updatedAt', label: 'Updated', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.updatedAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operations / Support"
        title={<>Support <span className="text-italic-fraunces text-ultra">tickets</span></>}
        subtitle="All inbound support conversations."
        actions={<NewBadge resourceType="ticket" />}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search tickets…" className="w-64" />
        <Select className="w-40" options={[{ value: '', label: 'All statuses' }, ...TICKET_STATUSES]} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Select className="w-32" options={[{ value: '', label: 'All priorities' }, ...TICKET_PRIORITIES]} value={priority} onChange={(e) => setPriority(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(row) => { window.location.assign(`/support/tickets/${row._id}`); }}
        emptyIcon={LifeBuoy} emptyTitle="No tickets yet"
      />
    </>
  );
}

/* ============================================================
 * DETAILS
 * ============================================================ */
export function TicketDetailsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [note, setNote] = useState('');
  const bottomRef = useRef(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['admin', 'ticket', id],
    queryFn: () => ticketsApi.get(id),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: () => usersApi.list({ roles: 'admin,staff,support', limit: 100 }),
    select: (r) => r.data,
  });

  const sendReply = useMutation({
    mutationFn: (payload) => ticketsApi.reply(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ticket', id] });
      toast.success('Reply sent');
      setReply('');
      setIsInternal(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateStatus = useMutation({
    mutationFn: (status) => ticketsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ticket', id] });
      toast.success('Status updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const assign = useMutation({
    mutationFn: (assigneeId) => ticketsApi.assign(id, assigneeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ticket', id] });
      toast.success('Ticket assigned');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const addNote = useMutation({
    mutationFn: (n) => ticketsApi.addNote(id, n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ticket', id] });
      toast.success('Note added');
      setNote('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  useEffect(() => {
    if (ticket) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length]);

  if (isLoading) return <PageLoader label="Loading ticket" />;
  if (!ticket) return null;

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Operations', href: '/support/tickets' },
        { label: 'Support', href: '/support/tickets' },
        { label: `#${ticket.ticketNumber || ticket._id?.slice(-8).toUpperCase()}` },
      ]} />
      <PageHeader
        eyebrow={`Opened ${formatDate(ticket.createdAt, 'datetime')}`}
        title={ticket.subject}
        subtitle={<>From <span className="text-ink">{ticket.customer?.email || ticket.customerEmail}</span> · <StatusPill status={ticket.status} /></>}
        actions={
          <>
            <Button variant="ghost" to="/support/tickets" icon={ArrowLeft}>Back</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Conversation */}
        <div className="space-y-6">
          <Card padding={false} className="p-6">
            <div className="text-eyebrow mb-4">Conversation</div>
            <ul className="space-y-4">
              {(ticket.messages || []).map((m, i) => {
                const staff = m.author?.role && m.author.role !== 'customer';
                return (
                  <li key={m._id || i} className={`flex gap-3 ${staff ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 grid place-items-center text-mono text-xs shrink-0 ${staff ? 'bg-ink text-ivory' : 'bg-sand text-ink'}`}>
                      {initials(m.author?.firstName ? `${m.author.firstName} ${m.author.lastName || ''}` : (m.author?.email || 'C'))}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${staff ? 'text-right' : ''}`}>
                      <div className="text-mono text-xs text-slate uppercase tracking-widest mb-1">
                        {m.author?.firstName ? `${m.author.firstName} ${m.author.lastName || ''}` : m.author?.email || 'Customer'}
                        {m.isInternal && <Badge tone="warn" className="ml-2">Internal</Badge>}
                        <span className="ml-2">· {timeAgo(m.createdAt)}</span>
                      </div>
                      <div className={`inline-block text-sm whitespace-pre-line leading-relaxed p-4 border ${
                        m.isInternal ? 'bg-warn-soft border-warn/30' : staff ? 'bg-ink text-ivory border-ink' : 'bg-ivory-soft border-hairline'
                      }`}>
                        {m.content || m.body}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div ref={bottomRef} />
          </Card>

          {/* Reply */}
          <Card>
            <div className="text-eyebrow mb-4">Send a reply</div>
            <Textarea
              label=""
              rows={5}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write your response…"
            />
            <div className="mt-4 flex items-center justify-between gap-4">
              <Switch
                label="Internal note (not visible to customer)"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              <Button
                type="button"
                icon={Send}
                loading={sendReply.isPending}
                disabled={!reply.trim()}
                onClick={() => sendReply.mutate({ content: reply, isInternal })}
              >
                Send
              </Button>
            </div>
          </Card>

          {/* Internal notes */}
          {ticket.notes?.length > 0 && (
            <Card padding={false} className="p-6">
              <div className="text-eyebrow mb-4">Internal notes</div>
              <ul className="divide-editorial">
                {ticket.notes.map((n, i) => (
                  <li key={i} className="py-3">
                    <div className="text-sm whitespace-pre-line">{n.content || n.note}</div>
                    <div className="text-mono text-xs text-slate uppercase tracking-widest mt-2">
                      {n.author?.firstName ? `${n.author.firstName} ${n.author.lastName || ''}` : 'Staff'} · {timeAgo(n.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Customer</div>
            <div className="text-sm">{ticket.customer?.firstName ? `${ticket.customer.firstName} ${ticket.customer.lastName || ''}` : '—'}</div>
            <div className="text-mono text-xs text-slate mt-1">{ticket.customer?.email || ticket.customerEmail}</div>
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Status</div>
            <Select
              options={TICKET_STATUSES}
              value={ticket.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
            />
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Assign to</div>
            <Select
              options={[
                { value: '', label: 'Unassigned' },
                ...staff.map((u) => ({ value: u._id, label: `${u.firstName} ${u.lastName || ''}` })),
              ]}
              value={ticket.assignedTo?._id || ''}
              onChange={(e) => assign.mutate(e.target.value)}
            />
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Add note</div>
            <Textarea
              label=""
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note…"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-3 w-full"
              icon={Bookmark}
              disabled={!note.trim()}
              loading={addNote.isPending}
              onClick={() => addNote.mutate(note)}
            >
              Save note
            </Button>
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Details</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate">Priority</span><span>{humanize(ticket.priority || 'medium')}</span></div>
              {ticket.category && <div className="flex justify-between"><span className="text-slate">Category</span><span>{humanize(ticket.category)}</span></div>}
              <div className="flex justify-between"><span className="text-slate">Opened</span><span className="text-mono text-xs">{formatDate(ticket.createdAt, 'medium')}</span></div>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
