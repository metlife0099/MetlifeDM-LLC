import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Copy, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { Input } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/index.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { useCopy } from '@/hooks/index.js';

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export default function SecuritySettings() {
  const { user, logoutAll } = useAuth();
  const [setup, setSetup] = useState(null);
  const [setupCode, setSetupCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    Boolean(user?.twoFactorEnabled || user?.twoFactor?.enabled)
  );
  const [showDisable, setShowDisable] = useState(false);
  const [copied, copy] = useCopy();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changePassword = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      authApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      reset();
      toast.success('Password changed');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const beginSetup = useMutation({
    mutationFn: () => authApi.setup2FA(),
    onSuccess: (result) => {
      setSetup(result);
      setShowDisable(false);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      if (message.toLowerCase().includes('already enabled')) {
        setTwoFactorEnabled(true);
        setShowDisable(true);
      }
      toast.error(message);
    },
  });

  const enable2FA = useMutation({
    mutationFn: () => authApi.enable2FA({ code: setupCode }),
    onSuccess: (result) => {
      setBackupCodes(result?.backupCodes || []);
      setTwoFactorEnabled(true);
      setSetup(null);
      setSetupCode('');
      toast.success('Two-factor authentication enabled');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const disable2FA = useMutation({
    mutationFn: () => authApi.disable2FA({ code: disableCode }),
    onSuccess: () => {
      setTwoFactorEnabled(false);
      setShowDisable(false);
      setDisableCode('');
      setBackupCodes([]);
      toast.success('Two-factor authentication disabled');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const revokeSessions = useMutation({
    mutationFn: logoutAll,
    onSuccess: () => toast.success('Signed out on all devices'),
    onError: (error) => toast.error(`Could not revoke every session. ${getErrorMessage(error)}`),
  });

  const submitSetupCode = () => {
    if (!/^\d{6}$/.test(setupCode)) {
      toast.error('Enter the six-digit code from your authenticator app');
      return;
    }
    enable2FA.mutate();
  };

  const submitDisableCode = () => {
    if (!/^\d{6}$/.test(disableCode)) {
      toast.error('Enter the six-digit code from your authenticator app');
      return;
    }
    disable2FA.mutate();
  };

  return (
    <section className="mt-10" aria-labelledby="personal-security-title">
      <div className="mb-6">
        <div className="text-eyebrow mb-2">Account</div>
        <h2 id="personal-security-title" className="text-display-md">Personal security</h2>
        <p className="text-slate text-sm mt-2">
          These controls affect your signed-in admin account, not global site settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <KeyRound size={16} className="text-ultra" aria-hidden="true" />
            <h3 className="text-display-sm">Change password</h3>
          </div>
          <form
            className="space-y-4"
            onSubmit={handleSubmit((values) => changePassword.mutate(values))}
          >
            <Input
              label="Current password"
              type="password"
              required
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword', { required: 'Enter your current password' })}
            />
            <Input
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              hint="At least 8 characters with uppercase, lowercase, number, and special character"
              error={errors.newPassword?.message}
              {...register('newPassword', {
                required: 'Enter a new password',
                pattern: { value: STRONG_PASSWORD, message: 'Use a stronger password matching the requirements' },
              })}
            />
            <Input
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Confirm your new password',
                validate: (value) => value === watch('newPassword') || 'Passwords do not match',
              })}
            />
            <Button type="submit" loading={changePassword.isPending}>Change password</Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={16} className="text-ultra" aria-hidden="true" />
            <h3 className="text-display-sm">Two-factor authentication</h3>
          </div>

          {backupCodes.length > 0 ? (
            <div className="space-y-4">
              <div className="border border-warn/30 bg-warn-soft p-4" role="status">
                <p className="text-sm font-medium">Save these one-time backup codes now.</p>
                <p className="text-xs text-slate mt-1">They will not be shown again.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm" aria-label="Backup codes">
                {backupCodes.map((code) => <code key={code} className="bg-ivory-soft p-2">{code}</code>)}
              </div>
              <Button
                type="button"
                variant="ghost"
                icon={Copy}
                onClick={() => copy(backupCodes.join('\n'))}
              >
                {copied ? 'Copied' : 'Copy backup codes'}
              </Button>
            </div>
          ) : setup ? (
            <div className="space-y-4">
              <p className="text-sm text-slate">
                Add this account to your authenticator app with the secret below, then enter its code.
              </p>
              <div>
                <div className="text-eyebrow mb-1.5">Setup secret</div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 break-all bg-ivory-soft px-3 py-2 text-sm">{setup.secret}</code>
                  <Button type="button" size="sm" variant="ghost" onClick={() => copy(setup.secret)}>
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
              <Input
                label="Authentication code"
                value={setupCode}
                onChange={(event) => setSetupCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={submitSetupCode} loading={enable2FA.isPending}>
                  Enable 2FA
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSetup(null)}>Cancel</Button>
              </div>
            </div>
          ) : twoFactorEnabled || showDisable ? (
            <div className="space-y-4">
              <p className="text-sm text-slate">
                Two-factor authentication is enabled. Enter a current authenticator code to disable it.
              </p>
              <Input
                label="Authentication code"
                value={disableCode}
                onChange={(event) => setDisableCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
              />
              <Button
                type="button"
                variant="danger_ghost"
                onClick={submitDisableCode}
                loading={disable2FA.isPending}
              >
                Disable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate">
                Require a six-digit authenticator code in addition to your password when signing in.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => beginSetup.mutate()} loading={beginSetup.isPending}>
                  Set up 2FA
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowDisable(true)}>
                  Already enabled?
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <LogOut size={16} className="text-danger" aria-hidden="true" />
                <h3 className="text-display-sm">Active sessions</h3>
              </div>
              <p className="text-sm text-slate mt-2">
                Revoke refresh tokens for every device, including this one.
              </p>
            </div>
            <Button
              type="button"
              variant="danger_ghost"
              onClick={() => revokeSessions.mutate()}
              loading={revokeSessions.isPending}
            >
              Sign out all devices
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
