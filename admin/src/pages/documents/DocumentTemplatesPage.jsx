import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, ArrowLeft, Save, LayoutTemplate } from 'lucide-react';
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

const FIELD_TOKENS = ['employeeName', 'employeeId', 'designation', 'department', 'joiningDate', 'endDate', 'projectName', 'projectDescription', 'responsibilities', 'technologies', 'issueDate'];

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
          <RichEditor
            value={bodyContent}
            onChange={(html) => { setBodyContent(html); setBodyTouched(true); }}
            placeholder="This is to certify that {{employeeName}}…"
            minHeight={280}
          />
          {bodyEmpty && <div className="text-mono text-xs text-danger mt-1.5">Body content is required</div>}
          <div className="text-mono text-xs text-slate mt-2">
            Use {`{{token}}`} placeholders — available: {FIELD_TOKENS.map((t) => `{{${t}}}`).join(', ')}.
            {' '}{`{{responsibilities}}`} inserts a real bullet list; {`{{technologies}}`} inserts a comma-separated list.
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
