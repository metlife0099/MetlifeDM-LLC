import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { authApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: ({ email }) => authApi.forgotPassword(email),
    onSuccess: (_, vars) => {
      setEmail(vars.email);
      setSent(true);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (sent) {
    return (
      <>
        <Seo title="Reset password" noindex />
        <div className="text-center py-10">
          <div className="w-16 h-16 grid place-items-center bg-ultra-tint rounded-full mx-auto mb-6">
            <MailCheck size={28} strokeWidth={1.5} className="text-ultra" />
          </div>
          <div className="text-eyebrow mb-4">Check your inbox</div>
          <h1 className="text-display-md mb-4">
            Reset link<br />
            <span className="text-italic-fraunces text-ultra">on its way.</span>
          </h1>
          <p className="text-slate mb-8 max-w-sm mx-auto leading-relaxed">
            If an account exists for <strong className="text-ink">{email}</strong>, you&apos;ll get an email with reset instructions within a minute.
          </p>
          <Link to="/login" className="link-underline text-ink text-sm">← Back to login</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo title="Forgot password" noindex />
      <div className="text-eyebrow mb-4">01 / Reset</div>
      <h1 className="text-display-lg">
        Forgot your<br />
        <span className="text-italic-fraunces text-ultra">password?</span>
      </h1>
      <p className="text-slate mt-6 mb-10">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          error={errors.email?.message}
        />
        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Sending…' : 'Send reset link'}
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </Button>
      </form>

      <p className="text-mono text-xs text-slate mt-10 text-center">
        Remembered it? <Link to="/login" className="link-underline text-ink">Log in</Link>
      </p>
    </>
  );
}
