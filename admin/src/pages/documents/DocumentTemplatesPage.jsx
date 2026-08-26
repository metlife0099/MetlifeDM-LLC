import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, ArrowLeft, Save, LayoutTemplate, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { Card, Badge, PageLoader } from '@/components/ui/index.jsx';
import { Input, Select, Textarea, Checkbox, SearchInput } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import Button from '@/components/ui/Button.jsx';
import { documentTemplatesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { DOCUMENT_TYPES, documentTypeLabel, DOCUMENT_THEMES, documentThemeLabel } from '@/utils/constants.js';

const FIELD_TOKEN_META = [
  { key: 'employeeName', label: 'Recipient Name' },
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'projectDescription', label: 'Project Description' },
  { key: 'responsibilities', label: 'Responsibilities (bullet list)' },
  { key: 'technologies', label: 'Technologies (list)' },
  { key: 'issueDate', label: 'Issue Date' },
];

// Catches the exact mistake of typing [Employee ID]-style placeholders
// instead of clicking a token button / using {{employeeId}} — those never
// get replaced and show up literally in the issued PDF.
const BRACKET_PLACEHOLDER_RE = /\[[A-Za-z][\w\s]{1,40}\]/;

/* ============================================================
 * TEMPLATES LIST
 * ============================================================ */
export function DocumentTemplatesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'document-templates', { page, debounced }],
    queryFn: () => documentTemplatesApi.list({ page, search: debounced, limit: 25 }),
  });

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="text-sm">{r.name}</span> },
    { key: 'documentType', label: 'Document type', render: (r) => documentTypeLabel(r.documentType) },
    { key: 'theme', label: 'Theme', render: (r) => documentThemeLabel(r.theme) },
    { key: 'isDefault', label: 'Default', render: (r) => r.isDefault && <Badge tone="ultra">Default</Badge> },
    { key: 'isActive', label: 'Status', render: (r) => <Badge tone={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Documents', href: '/documents' }, { label: 'Templates' }]} />
      <PageHeader
        eyebrow="Documents / Templates"
        title={<>Document <span className="text-italic-fraunces text-ultra">templates</span></>}
        subtitle="Reusable content templates used to generate official documents."
        actions={<Button to="/documents/templates/new" icon={Plus}>New template</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search templates…" className="w-72" />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        onRowClick={(row) => window.location.assign(`/documents/templates/${row._id}`)}
        emptyIcon={LayoutTemplate} emptyTitle="No templates yet"
        emptySubtitle="Create a template for each document type before issuing documents."
      />
    </>
  );
}

/* ============================================================
 * TEMPLATE EDIT
 * ============================================================ */
export function DocumentTemplateEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bodyContent, setBodyContent] = useState('');
  const [bodyTouched, setBodyTouched] = useState(false);
  const editorRef = useRef(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ['admin', 'document-template', id],
    queryFn: () => documentTemplatesApi.get(id),
    enabled: !isNew,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { documentType: DOCUMENT_TYPES[0].value, name: '', description: '', theme: 'classic', isDefault: false, isActive: true },
  });

  useEffect(() => {
    if (template) {
      reset(template);
      setBodyContent(template.bodyContent || '');
    }
  }, [template, reset]);

  const save = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, bodyContent };
      return isNew ? documentTemplatesApi.create(payload) : documentTemplatesApi.update(id, payload);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin', 'document-templates'] });
      toast.success(isNew ? 'Template created' : 'Template updated');
      if (isNew) navigate(`/documents/templates/${result._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading template" />;

  const bodyEmpty = bodyTouched && !bodyContent.replace(/<[^>]*>/g, '').trim();
  const hasBracketPlaceholder = BRACKET_PLACEHOLDER_RE.test(bodyContent.replace(/<[^>]*>/g, ' '));

  return (
    <form onSubmit={handleSubmit((d) => { setBodyTouched(true); if (bodyContent.replace(/<[^>]*>/g, '').trim()) save.mutate(d); })}>
      <Breadcrumbs items={[{ label: 'Documents', href: '/documents' }, { label: 'Templates', href: '/documents/templates' }, { label: isNew ? 'New' : template?.name || 'Edit' }]} />
      <PageHeader
        eyebrow={isNew ? 'Create · Template' : 'Editing · Template'}
        title={isNew ? 'New template' : template?.name || 'Edit template'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/documents/templates" icon={ArrowLeft}>Back</Button>
            <Button type="submit" icon={Save} loading={save.isPending}>{isNew ? 'Create template' : 'Save changes'}</Button>
          </>
        }
      />

      <Card className="max-w-3xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" required {...register('name', { required: true })} error={errors.name && 'Name is required'} />
          <Select label="Document type" options={DOCUMENT_TYPES} {...register('documentType')} />
        </div>
        <Textarea label="Description" rows={2} {...register('description')} />

        <div>
          <div className="text-mono text-[0.65rem] uppercase tracking-widest text-slate mb-1.5">Body content</div>

          <div className="mb-2">
            <div className="text-mono text-xs text-slate mb-1.5">
              Click to insert a placeholder at your cursor — it fills in automatically when the document is issued:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FIELD_TOKEN_META.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => editorRef.current?.insertContent(`{{${t.key}}}`)}
                  className="px-2.5 py-1 text-mono text-[0.65rem] uppercase tracking-widest border border-hairline-strong bg-ivory-soft hover:border-ultra hover:text-ultra transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <RichEditor
            ref={editorRef}
            value={bodyContent}
            onChange={(html) => { setBodyContent(html); setBodyTouched(true); }}
            placeholder="This is to certify that…"
            minHeight={280}
          />
          {bodyEmpty && <div className="text-mono text-xs text-danger mt-1.5">Body content is required</div>}

          {hasBracketPlaceholder && (
            <div className="flex items-start gap-2 mt-2 p-3 border border-warn/30 bg-warn/5">
              <AlertTriangle size={14} strokeWidth={1.5} className="text-warn shrink-0 mt-0.5" />
              <p className="text-xs text-ink leading-relaxed">
                This looks like a <code>[Bracket Placeholder]</code> rather than a real token — it will NOT be
                replaced with actual data and will show up exactly as typed on the issued document. Delete it and
                click the matching button above instead (e.g. use the &quot;Employee ID&quot; button, not typing{' '}
                <code>[Employee ID]</code>).
              </p>
            </div>
          )}

          <div className="text-mono text-xs text-slate mt-2">
            {`{{responsibilities}}`} inserts a real bullet list of what was entered on the document; {`{{technologies}}`} inserts a comma-separated list.
          </div>
        </div>

        <div>
          <Select
            label="Theme"
            options={DOCUMENT_THEMES.map((t) => ({ value: t.value, label: t.label }))}
            {...register('theme')}
          />
          <p className="text-mono text-xs text-slate mt-2">
            {DOCUMENT_THEMES.map((t) => `${t.label} — ${t.description}`).join('  ·  ')}
          </p>
        </div>

        <div className="flex items-center gap-8">
          <Checkbox label="Default template for this document type" {...register('isDefault')} />
          <Checkbox label="Active" {...register('isActive')} />
        </div>
      </Card>
    </form>
  );
}
