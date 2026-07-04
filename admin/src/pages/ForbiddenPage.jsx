import { ShieldOff, LogOut, Home } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { useAuth } from '@/hooks/useAuth.js';

export default function ForbiddenPage() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas grid place-items-center p-8">
      <div className="max-w-2xl text-center">
        <div className="w-16 h-16 bg-danger-soft border border-danger/25 grid place-items-center mx-auto mb-8">
          <ShieldOff size={24} strokeWidth={1.25} className="text-danger" />
        </div>
        <div className="text-eyebrow mb-6">Error 403 · Access denied</div>
        <h1 className="text-display-hero">
          You don't have<br />
          <span className="text-italic-fraunces text-ultra">access.</span>
        </h1>
        <p className="text-slate mt-8 max-w-md mx-auto leading-relaxed">
          {user
            ? `Your account (${user.email}) doesn't have permission to access this area of the admin console. Contact a super admin if you believe this is a mistake.`
            : `You need to be signed in with an admin account to access this area.`}
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          {user ? (
            <Button variant="danger_ghost" onClick={logout} icon={LogOut}>Sign out</Button>
          ) : (
            <Button to="/login" icon={Home}>Sign in</Button>
          )}
        </div>
      </div>
    </div>
  );
}
