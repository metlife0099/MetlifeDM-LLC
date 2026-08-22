import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck, ExternalLink, Mail, Linkedin, Globe, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Tabs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, NewBadge } from '@/components/ui/index.jsx';
import { Drawer } from '@/components/ui/Modal.jsx';
import { Select } from '@/components/form/index.jsx';
import { careersApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { timeAgo, formatDate } from '@/utils/format.js';
import { APPLICATION_STATUSES } from '@/utils/constants.js';

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('submitted');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'applications', { page, status }],
    queryFn: () => careersApi.listApplications({ page, status, limit: 25 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => careersApi.updateApplication(id, { status }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      setSelected((current) => current?._id === updated?._id ? { ...current, ...updated } : current);
      toast.success('Status updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const columns = [
    {
      key: 'firstName', label: 'Candidate',
      render: (r) => (
        <button type="button" onClick={() => setSelected(r)} className="text-left">
          <div className="text-sm text-ink hover:text-ultra transition-colors">
            {r.firstName} {r.lastName}
          </div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.email}</div>
        </button>
      ),
    },
    {
      key: 'career', label: 'Applied for',
      render: (r) => <span className="text-sm">{r.career?.title || r.jobTitle || '—'}</span>,
    },
    { key: 'yearsOfExperience', label: 'Experience', render: (r) => <span className="text-mono text-xs">{r.yearsOfExperience != null ? `${r.yearsOfExperience} yr` : '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status || 'submitted'} /> },
    { key: 'createdAt', label: 'Received', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Careers / Applications"
        title={<>Job <span className="text-italic-fraunces text-ultra">applications</span></>}
        subtitle="Review candidates and keep each application status current."
        actions={<NewBadge resourceType="application" />}
        tabs={
          <Tabs
            items={[
              ...APPLICATION_STATUSES,
              { value: '', label: 'All' },
            ]}
            active={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
          />
        }
      />
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
        description={selected?.career?.title || selected?.jobTitle}
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
                {selected.linkedinUrl && (
                  <a href={selected.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ultra">
                    <Linkedin size={13} strokeWidth={1.5} className="text-slate" />
                    LinkedIn
                    <ExternalLink size={11} strokeWidth={1.5} />
                  </a>
                )}
                {selected.portfolioUrl && (
                  <a href={selected.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-ultra">
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
                {selected.yearsOfExperience != null && (
                  <div>
                    <div className="text-mono text-xs text-slate uppercase tracking-widest">Experience</div>
                    <div className="mt-1">{selected.yearsOfExperience} years</div>
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
                  {selected.resume.name || 'Download resume'}
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
                value={selected.status || 'submitted'}
                onChange={(e) => updateStatus.mutate({ id: selected._id, status: e.target.value })}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </>
  );
}
