import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Checkbox } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { getErrorMessage } from '@/api/client.js';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Enter a valid email'),
    company: z.string().optional(),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
    agreeTerms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms' }) }),
    subscribeNewsletter: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const strengthCheck = (pwd = '') => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /[0-9]/.test(pwd),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerApi } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { subscribeNewsletter: true },
  });

  const password = watch('password') || '';
  const strength = strengthCheck(password);
  const strengthScore = Object.values(strength).filter(Boolean).length;

  const onSubmit = async (data) => {
  setSubmitting(true);

  try {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      company: data.company || '',
      phone: data.phone || '',
      newsletterSubscribed: data.subscribeNewsletter ?? false,
      acceptTerms: data.agreeTerms,
    };

    console.log("REGISTER PAYLOAD:", payload);

    await registerApi(payload);

    toast.success("Account created. Please verify your email.");

    navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
  } catch (e) {
    console.error(e);
    toast.error(getErrorMessage(e));
  } finally {
    setSubmitting(false);
  }
};

  return (
    <>
      <Seo title="Create account" noindex />
      <div className="text-eyebrow mb-4">01 / Sign up</div>
      <h1 className="text-display-lg">
        Create your<br />
        <span className="text-italic-fraunces text-ultra">account.</span>
      </h1>
      <p className="text-slate mt-6 mb-10">
        Already have one?{' '}
        <Link to="/login" className="link-underline text-ink">Log in</Link>
        .
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="First name *" autoComplete="given-name" {...register('firstName')} error={errors.firstName?.message} />
          <Input label="Last name *" autoComplete="family-name" {...register('lastName')} error={errors.lastName?.message} />
        </div>
        <Input label="Work email *" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
        <div className="grid gap-6 md:grid-cols-2">
          <Input label="Company" autoComplete="organization" {...register('company')} error={errors.company?.message} />
          <Input label="Phone" type="tel" autoComplete="tel" {...register('phone')} error={errors.phone?.message} />
        </div>

        <div className="relative">
          <Input
            label="Password *"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
          {password && (
            <div className="mt-3">
              <div className="flex gap-1 mb-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 transition-colors ${
                      i < strengthScore
                        ? strengthScore <= 2
                          ? 'bg-danger'
                          : strengthScore === 3
                          ? 'bg-warn'
                          : 'bg-success'
                        : 'bg-hairline'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 text-mono text-[0.65rem] uppercase tracking-widest">
                {Object.entries({
                  '8+ chars': strength.length,
                  Uppercase: strength.upper,
                  Lowercase: strength.lower,
                  Number: strength.number,
                }).map(([label, ok]) => (
                  <div key={label} className={`flex items-center gap-1 ${ok ? 'text-success' : 'text-slate'}`}>
                    <Check size={10} strokeWidth={ok ? 2 : 1} className={ok ? 'opacity-100' : 'opacity-30'} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm password *"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <Checkbox
          label={
            <>
              I agree to MetlifeDM&apos;s{' '}
              <Link to="/terms" className="link-underline text-ink">Terms</Link> and{' '}
              <Link to="/privacy" className="link-underline text-ink">Privacy Policy</Link>.
            </>
          }
          {...register('agreeTerms')}
          error={errors.agreeTerms?.message}
        />

        <Checkbox label="Send me the weekly Growth Playbook newsletter" {...register('subscribeNewsletter')} />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
          <ArrowUpRight size={16} strokeWidth={1.5} />
        </Button>
      </form>
    </>
  );
}
