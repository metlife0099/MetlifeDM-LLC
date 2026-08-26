import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/index.jsx';
import { Input, Checkbox, ImageUpload } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { settingsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';

/**
 * Signatories + company seal for issued documents/certificates. Kept as its
 * own self-contained section (own query, own save) rather than folded into
 * SettingsPage.jsx's single form — that form's field paths don't match the
 * real Settings schema, and a repeatable signatories list needs its own
 * useFieldArray. Every save sends the *whole* business object (spread +
 * overrides) since the backend does a shallow Object.assign on PATCH, and a
 * partial { business: {...} } payload would otherwise wipe sibling fields
 * like registeredName/ein.
 */
export default function DocumentSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => settingsApi.get(),
  });

  const { register, control, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: { signatories: [], sealImage: null },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'signatories' });

  useEffect(() => {
    if (settings) {
      reset({
        signatories: settings.business?.signatories || [],
        sealImage: settings.business?.sealImage || null,
      });
    }
  }, [settings, reset]);

  const save = useMutation({
    mutationFn: (data) =>
      settingsApi.update({
        business: {
          ...settings.business,
          signatories: data.signatories,
          sealImage: data.sealImage,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Document settings saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading || !settings) return null;

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))} className="mt-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-eyebrow">06 / Documents & Certificates</div>
          <Button type="submit" size="sm" icon={Save} loading={save.isPending} disabled={!isDirty}>Save</Button>
        </div>
        <p className="text-slate text-sm mb-6">
          Authorized signatories and the company seal used on issued documents. A document snapshots the
          resolved name/title/signature at issue time, so editing this list never changes an already-issued document.
        </p>

        <div className="mb-6">
          <Controller
            name="sealImage"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Company seal / stamp"
                value={field.value}
                onChange={(v) => field.onChange(v)}
                folder="certificates"
                hint="Uploads immediately"
              />
            )}
          />
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-hairline p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Name" {...register(`signatories.${index}.name`)} />
                <Input label="Title" {...register(`signatories.${index}.title`)} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <Checkbox label="Default signatory" {...register(`signatories.${index}.isDefault`)} />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-slate hover:text-danger p-1"
                  aria-label="Remove signatory"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={Plus}
          className="mt-4"
          onClick={() => append({ name: '', title: '', isDefault: fields.length === 0 })}
        >
          Add signatory
        </Button>
      </Card>
    </form>
  );
}
