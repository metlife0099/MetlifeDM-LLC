import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import { Card, PageLoader } from '@/components/ui/index.jsx';
import { Input, Textarea, Switch, ImageUpload, MultiSelect, Select } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import Button from '@/components/ui/Button.jsx';
import { portfolioApi, servicesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { slugify } from '@/utils/format.js';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  slug: z.string().min(1, 'Required'),
  tagline: z.string().optional(),
  client: z.string().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  year: z.coerce.number().optional(),
  shortDescription: z.string().optional(),
  overview: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  liveUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  }).optional(),
});

export default function PortfolioEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [serviceIds, setServiceIds] = useState([]);

  const { data: project, isLoading } = useQuery({
    queryKey: ['admin', 'portfolio', id],
    queryFn: () => portfolioApi.get(id),
    enabled: !isNew,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['admin', 'services', 'all'],
    queryFn: () => servicesApi.list({ limit: 100 }),
  });
  const services = servicesData?.data || [];

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'portfolio', 'categories'],
    queryFn: () => portfolioApi.listCategories(),
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', slug: '', isPublished: false, isFeatured: false, metrics: [], seo: {} },
  });

  const metricsArr = useFieldArray({ control, name: 'metrics' });

  useEffect(() => {
    if (project && !isNew) {
      reset({
        ...project,
        metrics: (project.metrics || []).map((m) => ({ label: m.label || '', value: m.value || '' })),
      });
      setDescription(project.description || '');
      setCoverImage(project.coverImage);
      setServiceIds((project.services || []).map((s) => (typeof s === 'string' ? s : s._id)));
    }
  }, [project, isNew, reset]);

  const title = watch('title');
  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = {
        ...payload,
        description,
        coverImage,
        services: serviceIds,
      };
      return isNew ? portfolioApi.create(clean) : portfolioApi.update(id, clean);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'portfolio'] });
      toast.success(isNew ? 'Project created' : 'Project updated');
      if (isNew) navigate(`/content/portfolio/${data._id || data.project?._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading project" />;

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))}>
      <Breadcrumbs items={[
        { label: 'Content', href: '/content/portfolio' },
        { label: 'Portfolio', href: '/content/portfolio' },
        { label: isNew ? 'New' : project?.title || 'Edit' },
      ]} />
      <PageHeader
        eyebrow={isNew ? 'Create · Project' : `Editing · ${project?.slug || ''}`}
        title={isNew ? 'New project' : project?.title || 'Edit project'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/content/portfolio" icon={ArrowLeft}>Back</Button>
            {!isNew && project?.slug && (
              <Button type="button" variant="ghost" href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/portfolio/${project.slug}`} target="_blank" iconRight={ExternalLink}>
                View live
              </Button>
            )}
            <Button type="submit" icon={Save} loading={save.isPending}>Save</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">01 / Basics</div>
            <div className="space-y-4">
              <Input label="Title" required {...register('title')} error={errors.title?.message} />
              <Textarea label="Tagline" rows={2} hint="Short one-liner shown in the hero" {...register('tagline')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Slug" required prefix="/portfolio/" {...register('slug')} error={errors.slug?.message} />
                <Input label="Client" {...register('client')} />
                <Select
                  label="Category"
                  options={[{ value: '', label: 'No category' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]}
                  {...register('category')}
                />
                <Input label="Industry" placeholder="e.g. Healthcare" {...register('industry')} />
                <Input label="Year" type="number" {...register('year')} />
              </div>
              <Textarea label="Short description" rows={2} hint="1–2 sentences shown in listings" {...register('shortDescription')} />
              <Input label="Live URL" type="url" placeholder="https://" {...register('liveUrl')} error={errors.liveUrl?.message} />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">02 / Cover image</div>
            <ImageUpload label="" value={coverImage} onChange={setCoverImage} hint="16:9 recommended, JPG/PNG/WebP" />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">03 / Description</div>
            <RichEditor value={description} onChange={setDescription} placeholder="The story of the project…" />
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">04 / Case narrative</div>
            <div className="space-y-4">
              <Textarea label="Overview" rows={4} hint="The brief — what the client needed" {...register('overview')} />
              <Textarea label="Challenge" rows={4} hint="The problem to solve" {...register('challenge')} />
              <Textarea label="Solution" rows={4} hint="How it was solved" {...register('solution')} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">05 / Services used</div>
            </div>
            <MultiSelect
              label=""
              options={services.map((s) => ({ value: s._id, label: s.title }))}
              value={serviceIds}
              onChange={setServiceIds}
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">06 / Results</div>
              <Button type="button" variant="ghost" size="xs" icon={Plus} onClick={() => metricsArr.append({ label: '', value: '' })}>Add</Button>
            </div>
            {metricsArr.fields.length === 0 ? (
              <div className="text-slate text-sm">Add measurable outcomes.</div>
            ) : (
              <div className="space-y-2">
                {metricsArr.fields.map((f, i) => (
                  <div key={f.id} className="grid gap-2 grid-cols-[1fr_1fr_auto] items-center">
                    <input
                      className="px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none"
                      placeholder="Metric (e.g. Organic traffic)"
                      {...register(`metrics.${i}.label`)}
                    />
                    <input
                      className="px-3 py-2 text-sm bg-surface border border-hairline-strong focus:border-ultra focus:outline-none num-plate"
                      placeholder="Value (e.g. +240%)"
                      {...register(`metrics.${i}.value`)}
                    />
                    <button type="button" onClick={() => metricsArr.remove(i)} className="text-slate hover:text-danger p-2">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <div className="space-y-4">
              <Switch label="Published" {...register('isPublished')} />
              <Switch label="Featured" {...register('isFeatured')} />
            </div>
          </Card>
          <Card>
            <div className="text-eyebrow mb-4">SEO</div>
            <div className="space-y-4">
              <Input label="Meta title" {...register('seo.metaTitle')} />
              <Textarea label="Meta description" rows={3} {...register('seo.metaDescription')} />
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
