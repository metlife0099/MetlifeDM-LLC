import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, MailCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button.jsx';
import { Spinner } from '@/components/ui/index.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { authApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';

export default function VerifyEmailPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = search.get('token');
  const email = search.get('email') || '';
  const [state, setState] = useState(token ? 'verifying' : 'awaiting');

  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(email),
    onSuccess: () => toast.success('Verification email sent'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => {
        setState('success');
        setTimeout(() => navigate('/login'), 2500);
      })
      .catch(() => setState('error'));
  }, [token, navigate]);

  return (
    <>
      <Seo title="Verify email" noindex />

      {state === 'verifying' && (
        <div className="text-center py-10">
          <Spinner size={32} className="text-ultra mx-auto mb-6" />
          <div className="text-eyebrow">Verifying your email…</div>
        </div>
      )}

      {state === 'success' && (
        <div className="text-center py-10">
          <div className="w-16 h-16 grid place-items-center bg-success/10 rounded-full mx-auto mb-6">
            <CheckCircle2 size={28} strokeWidth={1.5} className="text-success" />
          </div>
          <div className="text-eyebrow mb-4">Verified</div>
          <h1 className="text-display-md mb-4">
            Email confirmed.<br />
            <span className="text-italic-fraunces text-ultra">Redirecting…</span>
          </h1>
          <p className="text-slate">You&apos;ll be logged in momentarily.</p>
        </div>
      )}

      {state === 'error' && (
        <div className="text-center py-10">
          <div className="w-16 h-16 grid place-items-center bg-danger/10 rounded-full mx-auto mb-6">
            <AlertCircle size={28} strokeWidth={1.5} className="text-danger" />
          </div>
          <div className="text-eyebrow mb-4">Verification failed</div>
          <h1 className="text-display-md mb-4">Link expired or invalid.</h1>
          <p className="text-slate mb-8">Request a new verification email below.</p>
          <Button
            onClick={() => resend.mutate()}
            disabled={resend.isPending || !email}
            className="mx-auto"
          >
            {resend.isPending ? 'Sending…' : 'Resend email'}
          </Button>
        </div>
      )}

      {state === 'awaiting' && (
        <div className="text-center py-10">
          <div className="w-16 h-16 grid place-items-center bg-ultra-tint rounded-full mx-auto mb-6">
            <MailCheck size={28} strokeWidth={1.5} className="text-ultra" />
          </div>
          <div className="text-eyebrow mb-4">Check your inbox</div>
          <h1 className="text-display-md mb-4">
            Confirm your<br />
            <span className="text-italic-fraunces text-ultra">email address.</span>
          </h1>
          <p className="text-slate mb-8">
            We sent a confirmation link to <strong className="text-ink">{email || 'your email'}</strong>. Click it to activate your account.
          </p>
          {email && (
            <Button
              variant="ghost"
              onClick={() => resend.mutate()}
              disabled={resend.isPending}
              className="mx-auto"
            >
              {resend.isPending ? 'Sending…' : 'Resend email'}
            </Button>
          )}
          <p className="text-mono text-xs text-slate mt-10">
            <Link to="/login" className="link-underline text-ink">← Back to login</Link>
          </p>
        </div>
      )}
    </>
  );
}
