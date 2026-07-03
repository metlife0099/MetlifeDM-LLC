import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Checkbox } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { getErrorMessage } from '@/api/client.js';

const loginSchema = z.object({
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
  } = useForm({ resolver: zodResolver(loginSchema) });

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
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Log in" noindex />
      <div className="text-eyebrow mb-4">01 / Log in</div>
      <h1 className="text-display-lg">
        Welcome<br />
        <span className="text-italic-fraunces text-ultra">back.</span>
      </h1>
      <p className="text-slate mt-6 mb-10">
        No account yet?{' '}
        <Link to="/register" className="link-underline text-ink">
          Create one
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          error={errors.email?.message}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-0 top-8 text-slate hover:text-ink"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>
        </div>

        {needs2FA && (
          <div className="border border-ultra bg-ultra-tint p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-ultra" strokeWidth={1.5} />
              <span className="text-mono text-xs uppercase tracking-widest text-ultra">Two-factor required</span>
            </div>
            <Input
              label="Authentication code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              {...register('twoFactorToken')}
              error={errors.twoFactorToken?.message}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Checkbox label="Remember me" {...register('rememberMe')} />
          <Link to="/forgot-password" className="link-underline text-sm text-slate hover:text-ink">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </Button>
      </form>

      <p className="text-mono text-xs text-slate mt-10 text-center">
        By continuing, you agree to our{' '}
        <Link to="/terms" className="link-underline text-ink">Terms</Link> and{' '}
        <Link to="/privacy" className="link-underline text-ink">Privacy</Link>.
      </p>
    </>
  );
}
