import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, ExternalLink, Mail, Linkedin, Globe, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Tabs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge, Card } from '@/components/ui/index.jsx';
import { Drawer } from '@/components/ui/Modal.jsx';
import { Select, SearchInput } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { careersApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { timeAgo, formatDate } from '@/utils/format.js';
import { APPLICATION_STATUSES } from '@/utils/constants.js';

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('new');
  const [selected, setSelected] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'applications', { page, debounced, status }],
    queryFn: () => careersApi.listApplications({ page, search: debounced, status, limit: 25 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => careersApi.updateApplication(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      toast.success('Status updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'firstName', label: 'Candidate',
      render: (r) => (
        <button onClick={() => setSelected(r)} className="text-left">
          <div className="text-sm text-ink hover:text-ultra transition-colors">
            {r.firstName} {r.lastName}
          </div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.email}</div>
        </button>
      ),
    },
    {
      key: 'job', label: 'Applied for',
      render: (r) => <span className="text-sm">{r.job?.title || '—'}</span>,
    },
    { key: 'yearsExperience', label: 'Experience', render: (r) => <span className="text-mono text-xs">{r.yearsExperience ? `${r.yearsExperience} yr` : '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'new'} /> },
    { key: 'createdAt', label: 'Received', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Careers / Applications"
        title={<>Job <span className="text-italic-fraunces text-ultra">applications</span></>}
        subtitle="Review candidates. Every submission gets a decision within 5 business days."
        tabs={
          <Tabs
            items={[
              { value: 'new', label: 'New' },
              { value: 'reviewing', label: 'Reviewing' },
              { value: 'interview', label: 'Interview' },
              { value: 'offer', label: 'Offer' },
              { value: 'hired', label: 'Hired' },
              { value: 'rejected', label: 'Rejected' },
              { value: '', label: 'All' },
            ]}
            active={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
          />
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search candidates…" className="w-64" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(row) => setSelected(row)}
        emptyIcon={FileCheck} emptyTitle="No applications yet"
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.firstName} ${selected.lastName}` : ''}
        description={selected?.job?.title}
        width="lg"
      >
        {selected && (
          <div className="space-y-6">
            {/* Contact */}
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Contact</div>
              <div className="space-y-2 text-sm">
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 hover:text-ultra">
                  <Mail size={13} strokeWidth={1.5} className="text-slate" />
                  {selected.email}
                </a>
                {selected.phone && (
                  <div className="flex items-center gap-2 text-slate">
                    <span className="text-mono text-xs">☎</span>
                    {selected.phone}
                  </div>
                )}
                {selected.linkedIn && (
                  <a href={selected.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ultra">
                    <Linkedin size={13} strokeWidth={1.5} className="text-slate" />
                    LinkedIn
                    <ExternalLink size={11} strokeWidth={1.5} />
                  </a>
                )}
                {selected.portfolio && (
                  <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ultra">
                    <Globe size={13} strokeWidth={1.5} className="text-slate" />
                    Portfolio
                    <ExternalLink size={11} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            </Card>

            {/* Details */}
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Details</div>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                {selected.yearsExperience && (
                  <div>
                    <div className="text-mono text-xs text-slate uppercase tracking-widest">Experience</div>
                    <div className="mt-1">{selected.yearsExperience} years</div>
                  </div>
                )}
                {selected.currentCompany && (
                  <div>
                    <div className="text-mono text-xs text-slate uppercase tracking-widest">Current company</div>
                    <div className="mt-1">{selected.currentCompany}</div>
                  </div>
                )}
                <div>
                  <div className="text-mono text-xs text-slate uppercase tracking-widest">Submitted</div>
                  <div className="mt-1">{formatDate(selected.createdAt, 'datetime')}</div>
                </div>
              </div>
            </Card>

            {selected.resume?.url && (
              <Card padding={false} className="p-5">
                <div className="text-eyebrow mb-3">Resume</div>
                <a
                  href={selected.resume.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:text-ultra"
                >
                  <Download size={13} strokeWidth={1.5} />
                  {selected.resume.filename || 'Download resume'}
                </a>
              </Card>
            )}

            {selected.coverLetter && (
              <Card padding={false} className="p-5">
                <div className="text-eyebrow mb-3">Cover letter</div>
                <div className="text-sm text-slate whitespace-pre-line leading-relaxed">
                  {selected.coverLetter}
                </div>
              </Card>
            )}

            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Move to status</div>
              <Select
                options={APPLICATION_STATUSES}
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
