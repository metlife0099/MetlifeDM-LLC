import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Plus, Trash2, ArrowLeft, Save, TestTube2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader } from '@/components/ui/index.jsx';
import { ConfirmDialog, Modal } from '@/components/ui/Modal.jsx';
import { Select, SearchInput, Input } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import Button from '@/components/ui/Button.jsx';
import { campaignsApi, leadsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { useAuth } from '@/hooks/useAuth.js';
import { timeAgo } from '@/utils/format.js';
import { CAMPAIGN_AUDIENCES } from '@/utils/constants.js';

/* ============================================================
 * LIST
 * ============================================================ */
export function CampaignsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'campaigns', { page, debounced }],
    queryFn: () => campaignsApi.list({ page, search: debounced, limit: 20 }),
    refetchInterval: (q) => ((q.state.data?.data || []).some((c) => c.status === 'sending') ? 4000 : false),
  });

  const remove = useMutation({
    mutationFn: (id) => campaignsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      toast.success('Campaign deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'name', label: 'Campaign',
      render: (r) => (
        <div>
          <div className="text-sm hover:text-ultra">{r.name}</div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.subject}</div>
        </div>
      ),
    },
    {
      key: 'targetType', label: 'Audience',
      render: (r) => (
        <span className="text-sm capitalize">
          {r.targetType}
          {r.targetType === 'selected' ? ` (${r.recipients?.length || 0})` : ''}
        </span>
      ),
    },
    {
      key: 'stats', label: 'Sent / Total',
      render: (r) => (
        <span className="text-mono text-xs text-slate">
          {r.stats?.sentCount || 0} / {r.stats?.totalRecipients || 0}
          {r.stats?.failedCount > 0 && <span className="text-danger"> · {r.stats.failedCount} failed</span>}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'createdAt', label: 'Created', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteId(row._id); }}
          disabled={row.status === 'sending'}
          className="p-1.5 text-slate hover:text-danger disabled:opacity-30"
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Leads / Campaigns"
        title={<>Email <span className="text-italic-fraunces text-ultra">campaigns</span></>}
        subtitle="Compose and send marketing updates to your newsletter subscribers."
        actions={<Button onClick={() => navigate('/leads/campaigns/new')} icon={Plus}>New campaign</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search campaigns…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(r) => navigate(`/leads/campaigns/${r._id}`)}
        emptyIcon={Send} emptyTitle="No campaigns yet" emptySubtitle="Create your first campaign to email your subscribers."
      />
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)}
        loading={remove.isPending} title="Delete this campaign?" confirmLabel="Delete" variant="danger"
      />
    </>
  );
}

/* ============================================================
 * EDITOR — create / edit / send
 * ============================================================ */
export function CampaignEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [content, setContent] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedMap, setSelectedMap] = useState({});
  const [pickerSearch, setPickerSearch] = useState('');
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const debouncedPicker = useDebounce(pickerSearch, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'campaign', id],
    queryFn: () => campaignsApi.get(id),
    enabled: !isNew,
    refetchInterval: (q) => (q.state.data?.campaign?.status === 'sending' ? 3000 : false),
  });
  const campaign = data?.campaign;

  useEffect(() => {
    if (!campaign) return;
    setName(campaign.name || '');
    setSubject(campaign.subject || '');
    setPreheader(campaign.preheader || '');
    setTargetType(campaign.targetType || 'all');
    setContent(campaign.htmlContent || '');
    const ids = (campaign.recipients || []).map((r) => r._id);
    setSelectedIds(ids);
    const map = {};
    (campaign.recipients || []).forEach((r) => { map[r._id] = r; });
    setSelectedMap(map);
  }, [campaign]);

  const { data: pickerData, isLoading: pickerLoading } = useQuery({
    queryKey: ['admin', 'subscribers-picker', debouncedPicker],
    queryFn: () => leadsApi.listSubscribers({ search: debouncedPicker, active: true, limit: 100 }),
    enabled: targetType === 'selected',
  });

  const { data: allCountData } = useQuery({
    queryKey: ['admin', 'subscribers-count', 'all'],
    queryFn: () => leadsApi.listSubscribers({ active: true, limit: 1 }),
    enabled: targetType === 'all',
  });
  const { data: featuredCountData } = useQuery({
    queryKey: ['admin', 'subscribers-count', 'featured'],
    queryFn: () => leadsApi.listSubscribers({ active: true, featured: true, limit: 1 }),
    enabled: targetType === 'featured',
  });

  const audienceCount =
    targetType === 'all' ? allCountData?.meta?.total
    : targetType === 'featured' ? featuredCountData?.meta?.total
    : selectedIds.length;

  const onPickerSelectionChange = (ids) => {
    setSelectedIds(ids);
    setSelectedMap((prev) => {
      const next = { ...prev };
      ids.forEach((rowId) => {
        const row = (pickerData?.data || []).find((r) => r._id === rowId);
        if (row) next[rowId] = row;
      });
      return next;
    });
  };

  const removeSelected = (rowId) => setSelectedIds((ids) => ids.filter((x) => x !== rowId));

  const isSending = campaign?.status === 'sending';

  const save = useMutation({
    mutationFn: () => {
      const payload = { name, subject, preheader, htmlContent: content, targetType, recipients: selectedIds };
      return isNew ? campaignsApi.create(payload) : campaignsApi.update(id, payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      toast.success(isNew ? 'Campaign created' : 'Campaign saved');
      if (isNew) navigate(`/leads/campaigns/${res.campaign._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const sendNow = useMutation({
    mutationFn: () => campaignsApi.send(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin', 'campaign', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      toast.success(res?.message || 'Campaign is sending…');
      setConfirmSendOpen(false);
    },
    onError: (e) => { toast.error(getErrorMessage(e)); setConfirmSendOpen(false); },
  });

  const sendTest = useMutation({
    mutationFn: () => campaignsApi.sendTest(id, testEmail.trim() || user?.email),
    onSuccess: (res) => { toast.success(res?.message || 'Test sent'); setTestOpen(false); setTestEmail(''); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading campaign" />;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Leads', href: '/leads/campaigns' },
          { label: 'Campaigns', href: '/leads/campaigns' },
          { label: isNew ? 'New' : name || 'Edit' },
        ]}
      />
      <PageHeader
        eyebrow={isNew ? 'Create · Campaign' : `Editing · ${campaign?.status || 'draft'}`}
        title={isNew ? 'New campaign' : name || 'Edit campaign'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/leads/campaigns" icon={ArrowLeft}>Back</Button>
            {!isNew && (
              <Button type="button" variant="ghost" onClick={() => setTestOpen(true)} icon={TestTube2}>
                Send test
              </Button>
            )}
            <Button type="button" onClick={() => save.mutate()} loading={save.isPending} disabled={isSending} icon={Save}>
              Save
            </Button>
            {!isNew && (
              <Button
                type="button" variant="ultra"
                onClick={() => setConfirmSendOpen(true)}
                loading={sendNow.isPending}
                disabled={isSending}
                icon={Send}
              >
                {isSending ? 'Sending…' : 'Send now'}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">01 / Basics</div>
            <div className="space-y-4">
              <Input
                label="Campaign name" required placeholder="July product update"
                hint="Internal label only — subscribers never see this"
                value={name} onChange={(e) => setName(e.target.value)} disabled={isSending}
              />
              <Input
                label="Email subject" required placeholder="Here's what's new at MetlifeDM"
                value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isSending}
              />
              <Input
                label="Preheader" placeholder="A short preview line shown next to the subject in inboxes"
                value={preheader} onChange={(e) => setPreheader(e.target.value)} disabled={isSending}
              />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Email content</div>
            <RichEditor value={content} onChange={setContent} placeholder="Write the campaign email…" minHeight={360} />
          </Card>
        </div>

        <aside className="space-y-6">
          {campaign && campaign.status !== 'draft' && (
            <Card>
              <div className="text-eyebrow mb-4">Delivery</div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate">Status</span>
                  <StatusPill status={campaign.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate">Sent</span>
                  <span className="num-plate">{campaign.stats?.sentCount || 0} / {campaign.stats?.totalRecipients || 0}</span>
                </div>
                {campaign.stats?.failedCount > 0 && (
                  <div className="flex justify-between text-sm text-danger">
                    <span>Failed</span>
                    <span className="num-plate">{campaign.stats.failedCount}</span>
                  </div>
                )}
                <div className="h-1.5 bg-sand overflow-hidden">
                  <div
                    className="h-full bg-ultra transition-all"
                    style={{
                      width: `${campaign.stats?.totalRecipients
                        ? Math.round((campaign.stats.sentCount / campaign.stats.totalRecipients) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                {campaign.failedRecipients?.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1 pt-2 border-t border-hairline">
                    {campaign.failedRecipients.slice(-10).map((f, i) => (
                      <div key={i} className="flex justify-between gap-2 text-slate">
                        <span className="truncate">{f.email}</span>
                        <span className="text-danger truncate">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
                {campaign.errorMessage && (
                  <div className="text-xs text-danger pt-2 border-t border-hairline">{campaign.errorMessage}</div>
                )}
              </div>
            </Card>
          )}

          <Card>
            <div className="text-eyebrow mb-4">Audience</div>
            <div className="space-y-4">
              <Select
                label="Send to"
                options={CAMPAIGN_AUDIENCES}
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                disabled={isSending}
              />
              {targetType !== 'selected' ? (
                <div className="text-sm text-slate">
                  This will send to <strong className="text-ink">{audienceCount ?? '…'}</strong> active subscriber{audienceCount === 1 ? '' : 's'}.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIds.map((sid) => {
                        const sub = selectedMap[sid];
                        return (
                          <span key={sid} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-ivory-soft border border-hairline text-xs">
                            {sub?.name || sub?.email || sid}
                            <button type="button" onClick={() => removeSelected(sid)} className="text-slate hover:text-danger">
                              <X size={11} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <SearchInput value={pickerSearch} onChange={setPickerSearch} placeholder="Search subscribers to add…" />
                  <DataTable
                    columns={[
                      { key: 'email', label: 'Email', render: (r) => <span className="text-sm">{r.email}</span> },
                      { key: 'name', label: 'Name', render: (r) => <span className="text-sm text-slate">{r.name || '—'}</span> },
                    ]}
                    rows={pickerData?.data || []}
                    loading={pickerLoading}
                    selectable
                    selectedIds={selectedIds}
                    onSelectionChange={onPickerSelectionChange}
                    emptyTitle="No active subscribers found"
                  />
                  <div className="text-mono text-xs text-slate">{selectedIds.length} selected</div>
                </div>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Send a test email"
        description="Sends one copy of this campaign to the address below — doesn't affect subscriber stats or counts."
      >
        <div className="space-y-4">
          <Input
            label="Email" type="email" placeholder={user?.email || 'you@metlifedm.com'}
            value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={() => sendTest.mutate()} loading={sendTest.isPending} icon={Send}>Send test</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmSendOpen}
        onClose={() => setConfirmSendOpen(false)}
        onConfirm={() => sendNow.mutate()}
        loading={sendNow.isPending}
        title="Send this campaign now?"
        description={`"${subject}" will be emailed to ${audienceCount ?? 0} subscriber${audienceCount === 1 ? '' : 's'} right away. This can't be undone.`}
        confirmLabel="Send now"
        variant="ultra"
      />
    </>
  );
}
