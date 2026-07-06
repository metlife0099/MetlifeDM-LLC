import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '@/api/index.js';
import { updateUser } from '@/store/index.js';
import { getErrorMessage } from '@/api/client.js';
import { DashHeader } from '@/components/dashboard/DashHeader.jsx';
import { Input, Card } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { initials } from '@/utils/format.js';

export default function ProfilePage() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const fileRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      company: { name: user?.company?.name || '', website: user?.company?.website || '' },
      address: {
        line1: user?.address?.line1 || '',
        line2: user?.address?.line2 || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zip: user?.address?.zip || '',
        country: user?.address?.country || 'US',
      },
    },
  });

  const update = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (r) => {
      dispatch(updateUser(r.user));
      reset(r.user);
      toast.success('Profile updated.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return userApi.uploadAvatar(fd);
    },
    onSuccess: (r) => {
      dispatch(updateUser({ avatar: r.avatar }));
      toast.success('Avatar updated.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <Seo title="Profile" noindex />
      <DashHeader
        eyebrow="Settings / Profile"
        title={<>Your <span className="text-italic-fraunces text-ultra">details.</span></>}
        subtitle="Keep your contact info up to date so we can reach you fast."
      />

      {/* Avatar card */}
      <Card className="mb-10 flex items-center gap-6">
        <div className="w-20 h-20 grid place-items-center bg-ink text-ivory overflow-hidden">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-mono text-lg">{initials(`${user?.firstName || ''} ${user?.lastName || ''}`)}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-eyebrow mb-2">Avatar</div>
          <div className="text-sm text-slate mb-3">Square image, at least 400×400 px.</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadAvatar.mutate(e.target.files[0])}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadAvatar.isPending}
          >
            <Camera size={14} strokeWidth={1.5} />
            {uploadAvatar.isPending ? 'Uploading…' : 'Change avatar'}
          </Button>
        </div>
      </Card>

      {/* Profile form */}
      <form onSubmit={handleSubmit(update.mutate)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="First name" {...register('firstName', { required: 'Required' })} error={errors.firstName?.message} />
          <Input label="Last name" {...register('lastName', { required: 'Required' })} error={errors.lastName?.message} />
        </div>
        <Input label="Email" type="email" value={user?.email} disabled />
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="Phone" type="tel" {...register('phone')} />
          <Input label="Company" {...register('company.name')} />
        </div>
        <Input label="Website" type="url" placeholder="https://yourcompany.com" {...register('company.website')} />

        <div className="pt-2">
          <div className="text-eyebrow mb-4">Address</div>
          <div className="space-y-4">
            <Input label="Address line 1" {...register('address.line1')} />
            <Input label="Address line 2" {...register('address.line2')} />
            <div className="grid gap-6 md:grid-cols-4">
              <Input label="City" {...register('address.city')} />
              <Input label="State" {...register('address.state')} />
              <Input label="ZIP" {...register('address.zip')} />
              <Input label="Country" {...register('address.country')} />
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={!isDirty || update.isPending}
          >
            {update.isPending ? 'Saving…' : 'Save changes'}
            <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => reset()}
            >
              Discard
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
