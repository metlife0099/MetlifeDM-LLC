import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { authApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const token = search.get('token');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: ({ password }) => authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password updated. Please log in.');
      setTimeout(() => navigate('/login'), 1500);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!token) {
    return (
      <>
        <Seo title="Reset password" noindex />
        <div className="text-center py-10">
          <div className="w-16 h-16 grid place-items-center bg-danger/10 rounded-full mx-auto mb-6">
            <AlertCircle size={28} strokeWidth={1.5} className="text-danger" />
          </div>
          <h1 className="text-display-md mb-4">Invalid link.</h1>
          <p className="text-slate mb-8">This password reset link is missing or invalid.</p>
          <Link to="/forgot-password" className="link-underline text-ink">
            Request a new one →
          </Link>
        </div>
      </>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 grid place-items-center bg-success/10 rounded-full mx-auto mb-6">
          <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" />
        </div>
        <h1 className="text-display-md">Password updated.</h1>
        <p className="text-slate mt-4">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <>
      <Seo title="Set new password" noindex />
      <div className="text-eyebrow mb-4">02 / New password</div>
      <h1 className="text-display-lg">
        Set a new<br />
        <span className="text-italic-fraunces text-ultra">password.</span>
      </h1>
      <p className="text-slate mt-6 mb-10">Choose a strong password you don&apos;t use elsewhere.</p>

      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
        <div className="relative">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            autoFocus
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-0 top-8 text-slate hover:text-ink"
            aria-label={showPassword ? 'Hide' : 'Show'}
          >
            {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
          </button>
        </div>

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Updating…' : 'Update password'}
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </Button>
      </form>
    </>
  );
}
