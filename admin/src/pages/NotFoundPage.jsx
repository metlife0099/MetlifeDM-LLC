import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-canvas grid place-items-center p-8">
      <div className="max-w-2xl text-center">
        <div className="text-eyebrow mb-6">Error 404 · Page not found</div>
        <h1 className="text-display-hero">
          Nothing<br />
          <span className="text-italic-fraunces text-ultra">lives here.</span>
        </h1>
        <p className="text-slate mt-8 max-w-md mx-auto leading-relaxed">
          The page you're looking for doesn't exist in the admin console. It may have been moved, deleted, or the link is incorrect.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Button to="/dashboard" icon={Home}>Go to dashboard</Button>
          <Button variant="ghost" to="/" icon={ArrowLeft}>Back</Button>
        </div>
      </div>
    </div>
  );
}
