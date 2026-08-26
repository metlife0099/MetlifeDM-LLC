import { Input, Textarea, Checkbox } from '@/components/form/index.jsx';
import { PROJECT_DOCUMENT_TYPES } from '@/utils/constants.js';

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

/**
 * Shared dynamic field inputs for a Document draft — used by the create/issue
 * wizard and by the "replace" flow on the document detail page, so the
 * per-type field logic lives in exactly one place.
 */
export default function DocumentFieldsForm({ documentType, value = {}, onChange }) {
  const isProjectType = PROJECT_DOCUMENT_TYPES.includes(documentType);
  const set = (patch) => onChange?.({ ...value, ...patch });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Recipient full name"
          required
          value={value.employeeName || ''}
          onChange={(e) => set({ employeeName: e.target.value })}
        />
        <Input
          label="Employee ID"
          value={value.employeeId || ''}
          onChange={(e) => set({ employeeId: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Designation"
          value={value.designation || ''}
          onChange={(e) => set({ designation: e.target.value })}
        />
        <Input
          label="Department"
          value={value.department || ''}
          onChange={(e) => set({ department: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Joining date"
          type="date"
          value={toDateInput(value.joiningDate)}
          onChange={(e) => set({ joiningDate: e.target.value || undefined })}
        />
        <div>
          <Input
            label="End date"
            type="date"
            value={toDateInput(value.endDate)}
            disabled={!!value.isCurrentlyEmployed}
            onChange={(e) => set({ endDate: e.target.value || undefined })}
          />
          <div className="mt-2">
            <Checkbox
              label="Currently employed (Present)"
              checked={!!value.isCurrentlyEmployed}
              onChange={(e) => set({ isCurrentlyEmployed: e.target.checked, endDate: e.target.checked ? undefined : value.endDate })}
            />
          </div>
        </div>
      </div>

      {isProjectType && (
        <>
          <Input
            label="Project name"
            required
            value={value.projectName || ''}
            onChange={(e) => set({ projectName: e.target.value })}
          />
          <Textarea
            label="Project description"
            required
            rows={3}
            value={value.projectDescription || ''}
            onChange={(e) => set({ projectDescription: e.target.value })}
          />
          <Textarea
            label="Responsibilities"
            rows={4}
            hint="One responsibility per line"
            value={(value.responsibilities || []).join('\n')}
            onChange={(e) => set({ responsibilities: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
          />
          <Input
            label="Technologies"
            hint="Comma-separated"
            value={(value.technologies || []).join(', ')}
            onChange={(e) => set({ technologies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
          />
        </>
      )}

      <Textarea
        label="Additional notes"
        rows={3}
        hint="Internal context only — not shown on the certificate unless referenced by the template"
        value={value.additionalNotes || ''}
        onChange={(e) => set({ additionalNotes: e.target.value })}
      />
    </div>
  );
}
