import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import { Card, PageLoader } from '@/components/ui/index.jsx';
import { Input, Textarea, Select, Switch, ImageUpload } from '@/components/form/index.jsx';
import RichEditor from '@/components/ui/RichEditor.jsx';
import Button from '@/components/ui/Button.jsx';
import { servicesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { slugify } from '@/utils/format.js';
import { SERVICE_CATEGORIES } from '@/utils/constants.js';

const BILLING_CYCLES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

const planSchema = z.object({
  name: z.string().min(1, 'Required'),
  tagline: z.string().optional(),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().optional(),
  currency: z.string().optional(),
  billingCycle: z.string().optional(),
  ctaLabel: z.string().optional(),
  deliveryTimeDays: z.coerce.number().optional(),
  revisions: z.coerce.number().optional(),
  isPopular: z.boolean().optional(),
});

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string().min(1, 'Category is required'),
  icon: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  startingPrice: z.coerce.number().min(0).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.string().optional(),
  }).optional(),
  features: z.array(z.object({ title: z.string().min(1, 'Required'), description: z.string().optional(), icon: z.string().optional() })).optional(),
  benefits: z.array(z.object({ title: z.string().min(1, 'Required'), description: z.string().optional(), icon: z.string().optional() })).optional(),
  process: z.array(z.object({ title: z.string(), description: z.string().optional(), icon: z.string().optional(), duration: z.string().optional() })).optional(),
  pricingPlans: z.array(planSchema).optional(),
});

export default function ServiceEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [heroImage, setHeroImage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'service', id],
    queryFn: () => servicesApi.get(id),
    enabled: !isNew,
  });

  const service = data?.service ?? data;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      slug: '',
      category: 'seo',
      isPublished: true,
      isFeatured: false,
      order: 0,
      features: [],
      benefits: [],
      process: [],
      pricingPlans: [],
      seo: {},
    },
  });

  const featuresArr = useFieldArray({ control, name: 'features' });
  const benefitsArr = useFieldArray({ control, name: 'benefits' });
  const processArr = useFieldArray({ control, name: 'process' });
  const plansArr = useFieldArray({ control, name: 'pricingPlans' });

  useEffect(() => {
    if (service && !isNew) {
      reset({
        ...service,
        features: (service.features || []).map((f) =>
          typeof f === 'string' ? { title: f, description: '', icon: '' } : f
        ),
        benefits: (service.benefits || []).map((b) =>
          typeof b === 'string' ? { title: b, description: '', icon: '' } : b
        ),
        seo: {
          metaTitle: service.seo?.metaTitle || '',
          metaDescription: service.seo?.metaDescription || '',
          keywords: Array.isArray(service.seo?.keywords) ? service.seo.keywords.join(', ') : '',
        },
      });
      setContent(service.description || '');
      setHeroImage(service.heroImage || null);
    }
  }, [service, isNew, reset]);

  const title = watch('title');
  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const save = useMutation({
    mutationFn: (payload) => {
      const clean = {
        ...payload,
        description: content,
        heroImage,
        seo: {
          ...payload.seo,
          keywords: (payload.seo?.keywords || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        process: (payload.process || []).map((step, index) => ({
          ...step,
          order: index,
        })),
      };
      return isNew ? servicesApi.create(clean) : servicesApi.update(id, clean);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      toast.success(isNew ? 'Service created' : 'Service updated');
      if (isNew) navigate(`/content/services/${data._id || data.service?._id}`, { replace: true });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isNew && isLoading) return <PageLoader label="Loading service" />;

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))}>
      <Breadcrumbs
        items={[
          { label: 'Content', href: '/content/services' },
          { label: 'Services', href: '/content/services' },
          { label: isNew ? 'New' : service?.title || 'Edit' },
        ]}
      />
      <PageHeader
        eyebrow={isNew ? 'Create · Service' : `Editing · ${service?.slug || ''}`}
        title={isNew ? 'New service' : service?.title || 'Edit service'}
        actions={
          <>
            <Button type="button" variant="ghost" to="/content/services" icon={ArrowLeft}>
              Back
            </Button>
            {!isNew && service?.slug && (
              <Button
                type="button"
                variant="ghost"
                href={`${import.meta.env.VITE_PUBLIC_SITE_URL || ''}/services/${service.slug}`}
                target="_blank"
                iconRight={ExternalLink}
              >
                View live
              </Button>
            )}
            <Button type="submit" icon={Save} loading={save.isPending} disabled={!isDirty && !isNew}>
              Save
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Basic */}
          <Card>
            <div className="text-eyebrow mb-4">01 / Basics</div>
            <div className="space-y-4">
              <Input label="Title" required {...register('title')} error={errors.title?.message} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Slug" required prefix="/services/" {...register('slug')} error={errors.slug?.message} />
                <Input label="Icon (emoji)" placeholder="🔍" {...register('icon')} />
              </div>
              <Textarea
                label="Short description"
                rows={2}
                hint="1–2 sentences shown in listings"
                {...register('shortDescription')}
              />
            </div>
          </Card>

          {/* Hero image */}
          <Card>
            <div className="text-eyebrow mb-4">02 / Hero image</div>
            <ImageUpload
              label="Hero image"
              value={heroImage}
              onChange={setHeroImage}
              folder="services"
              hint="Shown at the top of the service page"
            />
          </Card>

          {/* Description */}
          <Card>
            <div className="text-eyebrow mb-4">03 / Long description</div>
            <RichEditor value={content} onChange={setContent} placeholder="Describe the service in detail…" />
          </Card>

          {/* Features */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">04 / Features</div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                icon={Plus}
                onClick={() => featuresArr.append({ title: '', description: '', icon: '' })}
              >
                Add feature
              </Button>
            </div>
            {featuresArr.fields.length === 0 ? (
              <div className="text-slate text-sm">No features yet.</div>
            ) : (
              <div className="space-y-4">
                {featuresArr.fields.map((f, i) => (
                  <div key={f.id} className="border border-hairline p-4 relative">
                    <div className="absolute -top-3 left-4 bg-surface px-2 num-plate text-slate text-xs">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <button
                      type="button"
                      onClick={() => featuresArr.remove(i)}
                      className="absolute top-3 right-3 text-slate hover:text-danger"
                      aria-label="Remove"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Title"
                        required
                        {...register(`features.${i}.title`)}
                        error={errors.features?.[i]?.title?.message}
                      />
                      <Input label="Icon" {...register(`features.${i}.icon`)} />
                      <div className="sm:col-span-2">
                        <Textarea label="Description" rows={2} {...register(`features.${i}.description`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Benefits */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">05 / Benefits</div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                icon={Plus}
                onClick={() => benefitsArr.append({ title: '', description: '', icon: '' })}
              >
                Add benefit
              </Button>
            </div>
            {benefitsArr.fields.length === 0 ? (
              <div className="text-slate text-sm">No benefits yet.</div>
            ) : (
              <div className="space-y-4">
                {benefitsArr.fields.map((f, i) => (
                  <div key={f.id} className="border border-hairline p-4 relative">
                    <div className="absolute -top-3 left-4 bg-surface px-2 num-plate text-slate text-xs">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <button
                      type="button"
                      onClick={() => benefitsArr.remove(i)}
                      className="absolute top-3 right-3 text-slate hover:text-danger"
                      aria-label="Remove"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Title"
                        required
                        {...register(`benefits.${i}.title`)}
                        error={errors.benefits?.[i]?.title?.message}
                      />
                      <Input label="Icon" {...register(`benefits.${i}.icon`)} />
                      <div className="sm:col-span-2">
                        <Textarea label="Description" rows={2} {...register(`benefits.${i}.description`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Process steps */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">06 / Process</div>
              <Button type="button" variant="ghost" size="xs" icon={Plus} onClick={() => processArr.append({ title: '', description: '', icon: '', duration: '' })}>
                Add step
              </Button>
            </div>
            {processArr.fields.length === 0 ? (
              <div className="text-slate text-sm">No process steps yet.</div>
            ) : (
              <div className="space-y-4">
                {processArr.fields.map((f, i) => (
                  <div key={f.id} className="border border-hairline p-4 relative">
                    <div className="absolute -top-3 left-4 bg-surface px-2 num-plate text-slate text-xs">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <button
                      type="button"
                      onClick={() => processArr.remove(i)}
                      className="absolute top-3 right-3 text-slate hover:text-danger"
                      aria-label="Remove"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Step title" {...register(`process.${i}.title`)} />
                      <Input label="Duration" placeholder="e.g. 3 days" {...register(`process.${i}.duration`)} />
                      <div className="sm:col-span-2">
                        <Textarea label="Description" rows={2} {...register(`process.${i}.description`)} />
                      </div>
                      <Input label="Icon" {...register(`process.${i}.icon`)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pricing plans */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">07 / Pricing plans</div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                icon={Plus}
                onClick={() => plansArr.append({ name: '', price: 0, billingCycle: 'monthly' })}
              >
                Add plan
              </Button>
            </div>
            {plansArr.fields.length === 0 ? (
              <div className="text-slate text-sm">No pricing plans yet.</div>
            ) : (
              <div className="space-y-4">
                {plansArr.fields.map((f, i) => (
                  <div key={f.id} className="border border-hairline p-4 relative">
                    <button
                      type="button"
                      onClick={() => plansArr.remove(i)}
                      className="absolute top-3 right-3 text-slate hover:text-danger"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Plan name" {...register(`pricingPlans.${i}.name`)} />
                      <Input label="Tagline" {...register(`pricingPlans.${i}.tagline`)} />
                      <Input label="Price" type="number" prefix="$" {...register(`pricingPlans.${i}.price`)} />
                      <Input label="Compare-at price" type="number" prefix="$" {...register(`pricingPlans.${i}.compareAtPrice`)} />
                      <Input label="Currency" placeholder="USD" {...register(`pricingPlans.${i}.currency`)} />
                      <Select
                        label="Billing cycle"
                        options={BILLING_CYCLES}
                        {...register(`pricingPlans.${i}.billingCycle`)}
                      />
                      <Input label="CTA label" placeholder="Get Started" {...register(`pricingPlans.${i}.ctaLabel`)} />
                      <Input label="Delivery time (days)" type="number" {...register(`pricingPlans.${i}.deliveryTimeDays`)} />
                      <Input label="Revisions" type="number" {...register(`pricingPlans.${i}.revisions`)} />
                      <div className="flex items-center pt-6">
                        <Switch label="Popular" {...register(`pricingPlans.${i}.isPopular`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <div className="text-eyebrow mb-4">Publish</div>
            <div className="space-y-4">
              <Switch label="Published" {...register('isPublished')} />
              <Switch label="Featured" {...register('isFeatured')} />
              <Input label="Display order" type="number" {...register('order')} />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">Category & pricing</div>
            <div className="space-y-4">
              <Select
                label="Category"
                required
                options={SERVICE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                {...register('category')}
                error={errors.category?.message}
              />
              <Input label="Starting price" type="number" prefix="$" {...register('startingPrice')} />
            </div>
          </Card>

          <Card>
            <div className="text-eyebrow mb-4">SEO</div>
            <div className="space-y-4">
              <Input label="Meta title" {...register('seo.metaTitle')} />
              <Textarea label="Meta description" rows={3} {...register('seo.metaDescription')} />
              <Input label="Keywords" hint="Comma-separated" {...register('seo.keywords')} />
            </div>
          </Card>
        </aside>
      </div>
    </form>
  );
}
