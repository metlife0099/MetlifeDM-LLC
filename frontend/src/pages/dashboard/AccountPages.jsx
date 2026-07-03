import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { Heart, Trash2, ArrowUpRight, Bell, Check, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi, notificationApi, authApi } from '@/api/index.js';
import { addItem } from '@/store/index.js';
import { getErrorMessage } from '@/api/client.js';
import { DashHeader, DashEmpty } from '@/components/dashboard/DashHeader.jsx';
import { Spinner, Card, Input, Badge } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney, timeAgo, cn } from '@/utils/format.js';

/* ================= WISHLIST ================= */
export const WishlistPage = () => {
  const qc = useQueryClient();
  const dispatch = useDispatch();
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => userApi.getWishlist(),
  });
  const items = data?.wishlist || [];

  const remove = useMutation({
    mutationFn: userApi.removeFromWishlist,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <Seo title="Wishlist" noindex />
      <DashHeader
        eyebrow="Wishlist"
        title={<>Saved for <span className="text-italic-fraunces text-ultra">later.</span></>}
        subtitle="Services you're considering but haven't ordered yet."
      />

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
      ) : items.length === 0 ? (
        <DashEmpty
          title="Nothing saved yet"
          subtitle="Tap the heart icon on any service to save it here."
          action={<Button to="/services">Browse services <ArrowUpRight size={14} strokeWidth={1.5} /></Button>}
        />
      ) : (
        <div className="grid gap-px bg-hairline border border-hairline md:grid-cols-2">
          {items.map((service) => (
            <div key={service._id} className="bg-ivory p-6 flex items-start gap-4">
              <div className="text-3xl">{service.icon || '📦'}</div>
              <div className="flex-1 min-w-0">
                <Link to={`/services/${service.slug}`} className="text-display-sm block hover:text-ultra transition-colors truncate">
                  {service.title}
                </Link>
                <p className="text-slate text-sm mt-2 line-clamp-2">{service.shortDescription}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-mono text-xs">from {formatMoney(service.startingPrice)}</div>
                  <Button
                    onClick={() => {
                      dispatch(addItem({ service }));
                      toast.success('Added to cart');
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Add to cart
                  </Button>
                </div>
              </div>
              <button
                onClick={() => remove.mutate(service._id)}
                className="text-slate hover:text-danger transition-colors p-1"
                aria-label="Remove"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/* ================= NOTIFICATIONS ================= */
export const NotificationsPage = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list({ limit: 50 }),
  });
  const items = data?.data || [];

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    },
  });

  return (
    <>
      <Seo title="Notifications" noindex />
      <DashHeader
        eyebrow="Alerts"
        title={<>Your <span className="text-italic-fraunces text-ultra">inbox.</span></>}
        subtitle="Updates about your orders, tickets, and account."
        actions={
          items.length > 0 && (
            <Button variant="ghost" size="md" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <Check size={14} strokeWidth={1.5} />
              Mark all read
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
      ) : items.length === 0 ? (
        <DashEmpty title="No notifications" subtitle="You're all caught up." />
      ) : (
        <div className="divide-editorial border-t border-hairline">
          {items.map((n) => {
            const Wrapper = n.link ? Link : 'div';
            return (
              <Wrapper
                key={n._id}
                {...(n.link ? { to: n.link } : {})}
                onClick={() => !n.isRead && markRead.mutate(n._id)}
                className={cn(
                  'py-5 flex items-start gap-4 group',
                  n.link && 'cursor-pointer'
                )}
              >
                <div className={cn('w-9 h-9 grid place-items-center shrink-0', n.isRead ? 'bg-sand' : 'bg-ultra-tint')}>
                  <Bell size={14} strokeWidth={1.5} className={n.isRead ? 'text-slate' : 'text-ultra'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-sm', !n.isRead && 'font-medium')}>{n.title}</span>
                    {!n.isRead && <span className="w-1.5 h-1.5 bg-ultra rounded-full" />}
                  </div>
                  {n.message && <p className="text-slate text-sm leading-relaxed">{n.message}</p>}
                  <div className="text-mono text-xs text-slate mt-1">{timeAgo(n.createdAt)}</div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ================= SECURITY ================= */
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include uppercase')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const SecurityPage = () => {
  const [step2FA, setStep2FA] = useState('idle');
  const [qrData, setQrData] = useState(null);
  const [otp, setOtp] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const changePassword = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password updated');
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const logoutAll = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => toast.success('Signed out of all devices'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <>
      <Seo title="Security" noindex />
      <DashHeader
        eyebrow="Settings / Security"
        title={<>Protect your <span className="text-italic-fraunces text-ultra">account.</span></>}
        subtitle="Password, two-factor authentication, and session management."
      />

      <div className="space-y-10">
        {/* Change password */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <KeyRound size={16} strokeWidth={1.5} className="text-ultra" />
            <div className="text-eyebrow">Password</div>
          </div>
          <form onSubmit={handleSubmit(changePassword.mutate)} className="space-y-6 max-w-md">
            <Input type="password" label="Current password" {...register('currentPassword')} error={errors.currentPassword?.message} />
            <Input type="password" label="New password" {...register('newPassword')} error={errors.newPassword?.message} />
            <Input type="password" label="Confirm new password" {...register('confirmPassword')} error={errors.confirmPassword?.message} />
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Card>

        {/* 2FA */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} strokeWidth={1.5} className="text-ultra" />
              <div className="text-eyebrow">Two-factor authentication</div>
            </div>
            <Badge tone="default">Optional</Badge>
          </div>
          <p className="text-slate text-sm leading-relaxed max-w-lg mb-6">
            Add an extra layer of security using an authenticator app like Google Authenticator, 1Password, or Authy.
          </p>

          {step2FA === 'idle' && (
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  const { qrCode, secret } = await authApi.setup2FA();
                  setQrData({ qrCode, secret });
                  setStep2FA('setup');
                } catch (e) {
                  toast.error(getErrorMessage(e));
                }
              }}
            >
              Enable 2FA
            </Button>
          )}

          {step2FA === 'setup' && qrData && (
            <div className="space-y-4 max-w-md">
              {qrData.qrCode && (
                <img src={qrData.qrCode} alt="2FA QR code" className="w-48 h-48 border border-hairline" />
              )}
              {qrData.secret && (
                <div className="text-mono text-xs text-slate">
                  Or enter this code manually:{' '}
                  <span className="text-ink">{qrData.secret}</span>
                </div>
              )}
              <Input
                label="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
              />
              <Button
                onClick={async () => {
                  try {
                    await authApi.enable2FA({ token: otp });
                    toast.success('2FA enabled');
                    setStep2FA('enabled');
                  } catch (e) {
                    toast.error(getErrorMessage(e));
                  }
                }}
              >
                Verify & enable
              </Button>
            </div>
          )}

          {step2FA === 'enabled' && (
            <div className="border border-success/30 bg-success/5 p-4 text-sm text-success flex items-center gap-2">
              <Check size={16} strokeWidth={2} />
              Two-factor authentication is enabled on your account.
            </div>
          )}
        </Card>

        {/* Sessions */}
        <Card>
          <div className="text-eyebrow mb-6">Active sessions</div>
          <p className="text-slate text-sm leading-relaxed mb-6 max-w-lg">
            If you suspect suspicious activity, sign out of all devices immediately. You&apos;ll need to log in again everywhere.
          </p>
          <Button
            variant="ghost"
            onClick={() => confirm('Sign out of all devices?') && logoutAll.mutate()}
            disabled={logoutAll.isPending}
          >
            {logoutAll.isPending ? 'Signing out…' : 'Sign out of all devices'}
          </Button>
        </Card>
      </div>
    </>
  );
};

export default WishlistPage;
