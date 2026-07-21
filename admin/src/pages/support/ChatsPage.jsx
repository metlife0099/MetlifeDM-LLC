import { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { MessageCircle, ArrowLeft, Send, Sparkles, UserPlus, CheckCircle2, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader, Badge, NewBadge } from '@/components/ui/index.jsx';
import { Select, SearchInput, Textarea } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { chatApi } from '@/api/index.js';
import { getAccessToken, getErrorMessage } from '@/api/client.js';
import { getSocketUrl } from '@/utils/socket.js';
import { useDebounce } from '@/hooks/index.js';
import { timeAgo, initials, truncate, humanize } from '@/utils/format.js';

const CHAT_STATUSES = [
  { value: 'bot', label: 'AI handling' },
  { value: 'queued', label: 'Needs agent' },
  { value: 'active', label: 'Active (agent)' },
  { value: 'resolved', label: 'Resolved' },
];

/* ============================================================
 * LIST
 * ============================================================ */
export function ChatsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'chats', { page, debounced, status }],
    queryFn: () => chatApi.list({ page, search: debounced, status, limit: 25 }),
    refetchInterval: 20_000,
  });

  const columns = [
    {
      key: 'customer', label: 'Conversation',
      render: (r) => (
        <div className="min-w-0">
          <Link to={`/support/chat/${r._id}`} className="text-sm text-ink hover:text-ultra flex items-center gap-2 truncate">
            <span className="truncate">{r.user ? `${r.user.firstName} ${r.user.lastName || ''}` : r.guestName || 'Guest visitor'}</span>
            {r.handoffReason?.startsWith('Customer') && (
              <Badge tone="outline" className="shrink-0">Requested human</Badge>
            )}
          </Link>
          <div className="text-mono text-xs text-slate mt-0.5 truncate max-w-md">
            {truncate(r.lastMessagePreview || r.subject || 'No messages yet', 70)}
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (r) => <Badge tone="outline">{humanize(r.category || 'general')}</Badge> },
    {
      key: 'assignedAgent', label: 'Agent',
      render: (r) => r.assignedAgent ? (
        <span className="text-xs">{r.assignedAgent.firstName} {r.assignedAgent.lastName || ''}</span>
      ) : (
        <span className="text-mono text-xs text-slate flex items-center gap-1"><Bot size={12} /> AI</span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'lastMessageAt', label: 'Last activity', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.lastMessageAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Operations / Support"
        title={<>Live <span className="text-italic-fraunces text-ultra">chat</span></>}
        subtitle="AI-handled and agent conversations, in one inbox."
        actions={<NewBadge resourceType="chat" />}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search conversations…" className="w-64" />
        <Select className="w-44" options={[{ value: '', label: 'All statuses' }, ...CHAT_STATUSES]} value={status} onChange={(e) => setStatus(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(row) => { window.location.assign(`/support/chat/${row._id}`); }}
        emptyIcon={MessageCircle} emptyTitle="No conversations yet"
      />
    </>
  );
}

/* ============================================================
 * DETAIL
 * ============================================================ */
export function ChatDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const { data: chat, isLoading } = useQuery({
    queryKey: ['admin', 'chat', id],
    queryFn: () => chatApi.get(id),
  });

  const { data: chatMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin', 'chat', id, 'messages'],
    queryFn: () => chatApi.messages(id),
  });

  const { data: suggestions, refetch: refetchSuggestions, isFetching: loadingSuggestions } = useQuery({
    queryKey: ['admin', 'chat', id, 'suggestions'],
    queryFn: () => chatApi.suggestions(id),
    enabled: false,
    select: (r) => r?.suggestions || [],
  });

  useEffect(() => {
    setMessages(chatMessages?.data || []);
  }, [chatMessages]);

  // Live updates: join this chat's room and append messages as they arrive
  // (customer messages, bot replies, or other agents replying) without
  // waiting on a poll.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('chat:join', { chatId: id });
    const onMessage = (msg) => {
      if (msg.chat === id || msg.chat?.toString?.() === id) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
    };
    socket.on('message:new', onMessage);

    return () => {
      socket.emit('chat:leave', { chatId: id });
      socket.off('message:new', onMessage);
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: (content) => chatApi.send(id, content),
    onSuccess: () => setReply(''),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const assign = useMutation({
    mutationFn: () => chatApi.assign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chat', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'chats'] });
      toast.success("You've taken over this conversation");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const resolve = useMutation({
    mutationFn: () => chatApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chat', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'chats'] });
      toast.success('Conversation resolved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading || messagesLoading) return <PageLoader label="Loading conversation" />;
  if (!chat) return null;

  const customerLabel = chat.user
    ? `${chat.user.firstName} ${chat.user.lastName || ''}`
    : chat.guestName || 'Guest visitor';

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Operations', href: '/support/chat' },
        { label: 'Live chat', href: '/support/chat' },
        { label: customerLabel },
      ]} />
      <PageHeader
        eyebrow="Live chat"
        title={customerLabel}
        actions={
          <>
            <Button variant="ghost" to="/support/chat" icon={ArrowLeft}>Back</Button>
            <Button variant="ghost" icon={UserPlus} loading={assign.isPending} onClick={() => assign.mutate()}>Take over</Button>
            <Button variant="ghost" icon={CheckCircle2} loading={resolve.isPending} onClick={() => resolve.mutate()}>Resolve</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card padding={false} className="p-6">
            <ul className="space-y-4 max-h-[55vh] overflow-y-auto">
              {messages.map((m, i) => {
                const isAgent = m.senderType === 'agent';
                const isBot = m.senderType === 'bot';
                return (
                  <li key={m._id || i} className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 grid place-items-center text-mono text-xs shrink-0 ${isAgent ? 'bg-ink text-ivory' : isBot ? 'bg-ultra-tint text-ultra' : 'bg-sand text-ink'}`}>
                      {isBot ? <Bot size={14} /> : initials(m.senderName || 'C')}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${isAgent ? 'text-right' : ''}`}>
                      <div className="text-mono text-xs text-slate uppercase tracking-widest mb-1">
                        {m.senderName || (isBot ? 'MetlifeDM AI' : 'Customer')}
                        <span className="ml-2">· {timeAgo(m.createdAt)}</span>
                      </div>
                      <div className={`inline-block text-sm whitespace-pre-line leading-relaxed p-4 border ${
                        isAgent ? 'bg-ink text-ivory border-ink' : isBot ? 'bg-ultra-tint border-ultra/25' : 'bg-ivory-soft border-hairline'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  </li>
                );
              })}
              <div ref={bottomRef} />
            </ul>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">Reply</div>
              <Button
                type="button" variant="ghost" size="xs" icon={Sparkles}
                loading={loadingSuggestions}
                onClick={() => refetchSuggestions()}
              >
                AI suggestions
              </Button>
            </div>
            {suggestions?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReply(s)}
                    className="text-left text-xs px-3 py-2 border border-hairline hover:border-ultra bg-ivory-soft max-w-xs truncate"
                    title={s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              label=""
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write your response…"
            />
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                icon={Send}
                loading={send.isPending}
                disabled={!reply.trim()}
                onClick={() => send.mutate(reply)}
              >
                Send
              </Button>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Status</div>
            <StatusPill status={chat.status} />
          </Card>
          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Contact</div>
            <div className="text-sm">{customerLabel}</div>
            {(chat.user?.email || chat.guestEmail) && (
              <div className="text-mono text-xs text-slate mt-1">{chat.user?.email || chat.guestEmail}</div>
            )}
          </Card>
          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Assigned agent</div>
            <div className="text-sm">
              {chat.assignedAgent
                ? `${chat.assignedAgent.firstName} ${chat.assignedAgent.lastName || ''}`
                : 'Unassigned — AI is responding'}
            </div>
          </Card>
          {chat.handoffReason && (
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Escalated to human</div>
              <div className="text-sm">
                {chat.handoffReason === 'Customer requested a human agent' ||
                chat.handoffReason === 'Customer chose to chat with a human agent'
                  ? 'Customer asked to switch from AI to a human agent'
                  : chat.handoffReason}
              </div>
              {chat.handoffAt && (
                <div className="text-mono text-xs text-slate mt-1">{timeAgo(chat.handoffAt)}</div>
              )}
            </Card>
          )}
          {chat.category && (
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Category</div>
              <Badge tone="outline">{humanize(chat.category)}</Badge>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
