import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, Send, MessageSquare } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ticketApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { DashHeader, DashEmpty } from '@/components/dashboard/DashHeader.jsx';
import { Spinner, Badge, Input, Textarea, Select, Card } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatDate, timeAgo, cn, initials } from '@/utils/format.js';

/* ================= LIST ================= */
export const TicketsListPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['tickets', 'mine'],
    queryFn: () => ticketApi.listMine(),
  });
  const tickets = data?.data || [];

  return (
    <>
      <Seo title="Support tickets" noindex />
      <DashHeader
        eyebrow="Support / Tickets"
        title={<>Get <span className="text-italic-fraunces text-ultra">unstuck.</span></>}
        subtitle="Open a ticket and a strategist will respond within one business day."
        actions={
          <Button to="/dashboard/tickets/new" size="md">
            New ticket <ArrowUpRight size={14} strokeWidth={1.5} />
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
      ) : tickets.length === 0 ? (
        <DashEmpty
          title="No tickets yet"
          subtitle="Need help with something? Open your first ticket."
          action={<Button to="/dashboard/tickets/new">Open a ticket <ArrowUpRight size={14} strokeWidth={1.5} /></Button>}
        />
      ) : (
        <div className="divide-editorial border-t border-hairline">
          {tickets.map((t) => (
            <Link
              key={t._id}
              to={`/dashboard/tickets/${t._id}`}
              className="py-5 grid gap-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center group"
            >
              <div className="num-plate text-slate text-xs">{t.ticketNumber}</div>
              <div>
                <div className="text-sm group-hover:text-ultra transition-colors">{t.subject}</div>
                <div className="text-mono text-xs text-slate mt-1">
                  {t.category} · Last updated {timeAgo(t.lastActivityAt || t.createdAt)}
                </div>
              </div>
              <Badge tone={t.priority === 'high' || t.priority === 'urgent' ? 'ultra' : 'default'}>
                {t.priority}
              </Badge>
              <Badge tone={t.status === 'resolved' ? 'success' : 'default'}>
                {t.status?.replace('_', ' ')}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

/* ================= CREATE ================= */
const createSchema = z.object({
  subject: z.string().min(4, 'Add a subject'),
  category: z.enum(['billing', 'technical', 'sales', 'general', 'complaint']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  description: z.string().min(10, 'Add more detail'),
});

export const NewTicketPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: { priority: 'medium', category: 'general' },
  });

  const mutation = useMutation({
    mutationFn: ticketApi.create,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket opened');
      navigate(`/dashboard/tickets/${r.ticket._id}`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <Seo title="Open a ticket" noindex />
      <Link to="/dashboard/tickets" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
        ← All tickets
      </Link>
      <DashHeader
        eyebrow="Support / New ticket"
        title={<>What's on your <span className="text-italic-fraunces text-ultra">mind?</span></>}
        subtitle="Tell us what's going on. We respond within one business day."
        className="mt-4"
      />

      <form onSubmit={handleSubmit(mutation.mutate)} className="max-w-2xl space-y-6">
        <Input label="Subject *" placeholder="Short summary" {...register('subject')} error={errors.subject?.message} />

        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Category *"
            {...register('category')}
            error={errors.category?.message}
            options={[
              { value: 'billing', label: 'Billing' },
              { value: 'technical', label: 'Technical' },
              { value: 'sales', label: 'Sales' },
              { value: 'general', label: 'General' },
              { value: 'complaint', label: 'Complaint' },
            ]}
          />
          <Select
            label="Priority"
            {...register('priority')}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />
        </div>

        <Textarea
          label="Describe your issue *"
          rows={6}
          placeholder="What's happening? What have you tried? Any relevant context?"
          {...register('description')}
          error={errors.description?.message}
        />

        <div className="pt-4">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? 'Opening…' : 'Open ticket'}
            <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </div>
      </form>
    </>
  );
};

/* ================= DETAILS ================= */
const replySchema = z.object({ message: z.string().min(1, 'Type a reply') });

export const TicketDetailsPage = () => {
  const { id } = useParams();
  const user = useSelector((s) => s.auth.user);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.get(id),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(replySchema) });

  const reply = useMutation({
    mutationFn: (payload) => ticketApi.reply(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket', id] });
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>;
  }
  if (error || !data?.ticket) {
    return (
      <>
        <DashHeader title="Ticket not found" />
        <Link to="/dashboard/tickets" className="link-underline text-ink">← Back</Link>
      </>
    );
  }

  const t = data.ticket;

  return (
    <>
      <Seo title={t.subject} noindex />
      <Link to="/dashboard/tickets" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
        ← All tickets
      </Link>
      <DashHeader
        eyebrow={`${t.ticketNumber} · ${t.category}`}
        title={t.subject}
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={t.priority === 'high' || t.priority === 'urgent' ? 'ultra' : 'default'}>{t.priority}</Badge>
            <Badge tone={t.status === 'resolved' ? 'success' : 'default'}>{t.status?.replace('_', ' ')}</Badge>
          </div>
        }
        className="mt-4"
      />

      {/* Thread */}
      <div className="space-y-4 mb-10">
        <MessageBubble
          author={`${user?.firstName} ${user?.lastName}`}
          initial={initials(`${user?.firstName || ''} ${user?.lastName || ''}`)}
          message={t.description}
          time={t.createdAt}
          own
        />
        {t.messages?.map((m, i) => (
          <MessageBubble
            key={i}
            author={
              m.sender?.firstName
                ? `${m.sender.firstName} ${m.sender.lastName || ''}`
                : m.senderType === 'staff'
                ? 'MetlifeDM Support'
                : 'You'
            }
            initial={
              m.sender?.firstName
                ? initials(`${m.sender.firstName} ${m.sender.lastName || ''}`)
                : m.senderType === 'staff'
                ? 'MD'
                : initials(`${user?.firstName || ''} ${user?.lastName || ''}`)
            }
            message={m.message}
            time={m.createdAt}
            own={m.senderType === 'customer'}
          />
        ))}
      </div>

      {/* Reply form */}
      {t.status !== 'closed' && (
        <Card>
          <form onSubmit={handleSubmit(reply.mutate)} className="space-y-4">
            <div className="text-eyebrow">Add reply</div>
            <Textarea
              rows={4}
              placeholder="Type your message…"
              {...register('message')}
              error={errors.message?.message}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={reply.isPending}>
                {reply.isPending ? 'Sending…' : 'Send reply'}
                <Send size={14} strokeWidth={1.5} />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
};

const MessageBubble = ({ author, initial, message, time, own }) => (
  <div className={cn('flex gap-3', own && 'flex-row-reverse')}>
    <div className={cn('w-9 h-9 grid place-items-center text-mono text-xs shrink-0', own ? 'bg-ultra text-ivory' : 'bg-ink text-ivory')}>
      {initial}
    </div>
    <div className={cn('max-w-[70%]', own && 'text-right')}>
      <div className={cn('flex items-center gap-2 text-mono text-xs uppercase tracking-widest text-slate mb-1', own && 'justify-end')}>
        <span>{author}</span>
        <span>·</span>
        <span>{timeAgo(time)}</span>
      </div>
      <div className={cn('p-4 text-sm leading-relaxed border', own ? 'bg-ink text-ivory border-ink' : 'bg-ivory-soft border-hairline')}>
        {message}
      </div>
    </div>
  </div>
);

export default TicketsListPage;
