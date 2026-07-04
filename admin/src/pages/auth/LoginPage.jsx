import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Checkbox } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { getErrorMessage } from '@/api/client.js';
import { SITE } from '@/utils/constants.js';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean().optional(),
  twoFactorToken: z.string().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const redirect = search.get('redirect') || '/dashboard';
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const result = await login(data);
      if (result?.requires2FA) {
        setNeeds2FA(true);
        toast('Two-factor code required', { icon: '🔒' });
      } else {
        toast.success(`Welcome back${result?.user?.firstName ? `, ${result.user.firstName}` : ''}.`);
        navigate(redirect, { replace: true });
      }
    } catch (e) {
      toast.error(getErrorMessage(e) || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-[1.1fr_1fr]">
      {/* Left: form */}
      <div className="flex flex-col p-8 md:p-14 lg:p-20">
        <div className="text-display-sm font-medium">
          {SITE.name}
          <span className="text-ultra">.</span>
          <span className="ml-2 text-eyebrow text-slate">Admin</span>
        </div>

        <div className="flex-1 grid place-items-center py-14">
          <div className="w-full max-w-md">
            <div className="text-eyebrow mb-4">01 / Sign in</div>
            <h1 className="text-display-hero">
              Welcome<br />
              <span className="text-italic-fraunces text-ultra">back.</span>
            </h1>
            <p className="text-slate mt-6 mb-10">
              Log in to the admin console. Only staff accounts have access.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={errors.email?.message}
              />

              <div className="relative">
                <Input
                  label="Password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  error={errors.password?.message}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-slate hover:text-ink"
                      aria-label={showPassword ? 'Hide' : 'Show'}
                    >
                      {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                    </button>
                  }
                />
              </div>

              {needs2FA && (
                <div className="border border-ultra bg-ultra-tint p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={14} className="text-ultra" strokeWidth={1.5} />
                    <span className="text-mono text-xs uppercase tracking-widest text-ultra">Two-factor required</span>
                  </div>
                  <Input
                    label="Authentication code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    {...register('twoFactorToken')}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <Checkbox label="Remember me" {...register('rememberMe')} />
              </div>

              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                Sign in <ArrowRight size={14} strokeWidth={1.5} />
              </Button>

              <div className="text-mono text-xs text-slate flex items-center gap-2 pt-4">
                <Lock size={11} strokeWidth={1.5} />
                Encrypted session · 2FA available in settings
              </div>
            </form>
          </div>
        </div>

        <div className="text-mono text-xs text-slate">
          © {new Date().getFullYear()} {SITE.legalName} · Admin
        </div>
      </div>

      {/* Right: editorial panel */}
      <div className="hidden lg:flex bg-ink text-ivory p-14 lg:p-20 flex-col justify-between relative overflow-hidden">
        <div className="text-eyebrow text-ivory/50">Admin console · v1.0</div>
        <div>
          <h2 className="text-display-lg text-ivory">
            One place for<br />
            <span className="text-italic-fraunces text-ultra-soft">every operator decision.</span>
          </h2>
          <p className="mt-8 text-ivory/60 max-w-md leading-relaxed">
            Content, orders, tickets, leads, and analytics — all live, all searchable, all cross-linked. Built for the team that ships every day.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-3 text-mono text-xs uppercase tracking-widest max-w-lg">
            {[
              'Full CRUD · every content type',
              '2FA · staff-role guarded',
              'Realtime · ticket alerts',
              'Stripe · orders & refunds',
              'Cloudinary · media library',
              'Audit log · every action',
            ].map((t) => (
              <div key={t} className="text-ivory/50">
                <span className="text-ultra-soft mr-2">·</span>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="text-mono text-xs text-ivory/40 flex items-center gap-2">
          <span className="w-1 h-1 bg-ultra-soft rounded-full" />
          All systems operational
        </div>
      </div>
    </div>
  );
}
