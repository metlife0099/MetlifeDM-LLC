import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MailCheck, Edit3, Send, Save, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill } from '@/components/ui/index.jsx';
import { Drawer, Modal } from '@/components/ui/Modal.jsx';
import { Input, Textarea } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import Button from '@/components/ui/Button.jsx';
import { settingsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { formatDate, humanize } from '@/utils/format.js';

export default function EmailTemplatesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [body, setBody] = useState('');
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin', 'email-templates'],
    queryFn: () => settingsApi.listEmailTemplates(),
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    if (selected) {
      reset(selected);
      setBody(selected.body || '');
    }
  }, [selected, reset]);

  const save = useMutation({
    mutationFn: (data) => settingsApi.updateEmailTemplate(selected._id, { ...data, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
      toast.success('Template saved');
      setSelected(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const sendTest = useMutation({
    mutationFn: () => settingsApi.testEmail({ templateId: selected._id, to: testEmail }),
    onSuccess: () => {
      toast.success('Test email sent');
      setTestOpen(false);
      setTestEmail('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'name', label: 'Template',
      render: (r) => (
        <button onClick={() => setSelected(r)} className="text-left">
          <div className="text-sm text-ink hover:text-ultra">{r.name || humanize(r.key || '')}</div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.key}</div>
        </button>
      ),
    },
    { key: 'subject', label: 'Subject line', render: (r) => <span className="text-sm text-slate">{r.subject || '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.enabled ? 'active' : 'draft'} /> },
    { key: 'updatedAt', label: 'Last edited', render: (r) => <span className="text-mono text-xs text-slate">{formatDate(r.updatedAt, 'medium')}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <button onClick={() => setSelected(row)} className="p-1.5 text-slate hover:text-ink">
          <Edit3 size={13} strokeWidth={1.5} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="System / Email templates"
        title={<>Transactional <span className="text-italic-fraunces text-ultra">emails</span></>}
        subtitle="Templates sent by the app — welcome, receipts, notifications, and more."
      />
      <DataTable
        columns={columns} rows={templates} loading={isLoading}
        emptyIcon={MailCheck}
        emptyTitle="No templates yet"
        emptySubtitle="Templates are seeded from the backend."
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || humanize(selected?.key || '')}
        description={`Key: ${selected?.key || ''}`}
        width="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            <Button variant="ghost" icon={TestTube} onClick={() => setTestOpen(true)}>Send test</Button>
            <Button icon={Save} onClick={handleSubmit((d) => save.mutate(d))} loading={save.isPending}>Save template</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <Input label="Subject line" required {...register('subject')} hint="Supports {{variables}}" />
            <Input label="From name" {...register('fromName')} placeholder="MetlifeDM" />
            <Input label="Reply-to email" {...register('replyTo')} placeholder="team@metlifedm.com" />
            <div>
              <div className="text-mono text-xs uppercase tracking-widest text-slate mb-2">Body (HTML)</div>
              <RichEditor value={body} onChange={setBody} placeholder="Write the email body…" minHeight={400} />
            </div>
            <Textarea
              label="Available variables"
              rows={2}
              readOnly
              value={(selected.variables || []).join(', ') || 'firstName, lastName, orderNumber, etc.'}
              hint="Use {{variable}} in subject or body"
            />
          </div>
        )}
      </Drawer>

      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Send test email"
        description="A test email will be sent with sample data."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button icon={Send} disabled={!testEmail} loading={sendTest.isPending} onClick={() => sendTest.mutate()}>
              Send
            </Button>
          </>
        }
      >
        <Input
          label="Send to"
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </Modal>
    </>
  );
}
