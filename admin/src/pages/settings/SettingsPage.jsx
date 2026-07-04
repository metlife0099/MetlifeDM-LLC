import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { Card, PageLoader } from '@/components/ui/index.jsx';
import { Input, Textarea } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { settingsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';

export default function SettingsPage() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => settingsApi.get(),
  });

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const save = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Settings saved');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <PageLoader label="Loading settings" />;

  return (
    <form onSubmit={handleSubmit((d) => save.mutate(d))}>
      <PageHeader
        eyebrow="System / Settings"
        title={<>General <span className="text-italic-fraunces text-ultra">settings</span></>}
        subtitle="Site info, contact details, and integrations."
        actions={<Button type="submit" icon={Save} loading={save.isPending} disabled={!isDirty}>Save changes</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site info */}
        <Card>
          <div className="text-eyebrow mb-4">01 / Site info</div>
          <div className="space-y-4">
            <Input label="Site name" {...register('siteName')} />
            <Textarea label="Tagline" rows={2} {...register('tagline')} />
            <Textarea label="Site description" rows={3} hint="Used as default meta description" {...register('description')} />
          </div>
        </Card>

        {/* Contact info */}
        <Card>
          <div className="text-eyebrow mb-4">02 / Contact</div>
          <div className="space-y-4">
            <Input label="Contact email" type="email" {...register('contact.email')} />
            <Input label="Contact phone" {...register('contact.phone')} />
            <Textarea label="Address" rows={3} {...register('contact.address')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" {...register('contact.city')} />
              <Input label="State" {...register('contact.state')} />
            </div>
          </div>
        </Card>

        {/* Social */}
        <Card>
          <div className="text-eyebrow mb-4">03 / Social links</div>
          <div className="space-y-4">
            <Input label="LinkedIn URL" {...register('social.linkedIn')} />
            <Input label="Twitter / X URL" {...register('social.twitter')} />
            <Input label="Instagram URL" {...register('social.instagram')} />
            <Input label="Facebook URL" {...register('social.facebook')} />
            <Input label="YouTube URL" {...register('social.youtube')} />
          </div>
        </Card>

        {/* SEO defaults */}
        <Card>
          <div className="text-eyebrow mb-4">04 / SEO defaults</div>
          <div className="space-y-4">
            <Input label="Default meta title" {...register('seo.title')} />
            <Textarea label="Default meta description" rows={3} {...register('seo.description')} />
            <Input label="Default meta keywords" hint="Comma-separated" {...register('seo.keywords')} />
            <Input label="OG image URL" {...register('seo.ogImage')} />
          </div>
        </Card>

        {/* Integrations */}
        <Card className="lg:col-span-2">
          <div className="text-eyebrow mb-4">05 / Integrations</div>
          <p className="text-slate text-sm mb-4">Public/client-side keys only — server-side secrets stay in the backend env.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Google Analytics ID" placeholder="G-XXXXXXX" {...register('integrations.googleAnalyticsId')} />
            <Input label="Google Tag Manager ID" placeholder="GTM-XXXXXXX" {...register('integrations.gtmId')} />
            <Input label="Meta Pixel ID" {...register('integrations.metaPixelId')} />
            <Input label="Intercom App ID" {...register('integrations.intercomAppId')} />
            <Input label="Hotjar Site ID" {...register('integrations.hotjarSiteId')} />
            <Input label="Sentry DSN (public)" {...register('integrations.sentryDsnPublic')} />
          </div>
        </Card>
      </div>
    </form>
  );
}
