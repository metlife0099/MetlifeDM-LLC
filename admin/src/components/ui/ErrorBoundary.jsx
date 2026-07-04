import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('Admin panel error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-canvas grid place-items-center p-8">
        <div className="max-w-2xl text-center">
          <div className="w-16 h-16 bg-danger-soft border border-danger/25 grid place-items-center mx-auto mb-8">
            <AlertTriangle size={24} strokeWidth={1.25} className="text-danger" />
          </div>
          <div className="text-eyebrow mb-6">Application error</div>
          <h1 className="text-display-hero">
            Something<br />
            <span className="text-italic-fraunces text-ultra">broke.</span>
          </h1>
          <p className="text-slate mt-8 max-w-md mx-auto leading-relaxed">
            The admin console hit an unexpected error. The engineering team has been notified.
            Try refreshing — most of the time that fixes it.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-6 text-left border border-hairline bg-surface p-4 max-w-md mx-auto">
              <div className="text-mono text-xs text-slate uppercase tracking-widest mb-2">Error message</div>
              <code className="text-mono text-xs text-danger break-all">
                {this.state.error.message || String(this.state.error)}
              </code>
            </div>
          )}
          <div className="mt-10">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-ink text-ivory px-6 py-3 text-mono text-xs uppercase tracking-widest hover:bg-graphite transition-colors"
            >
              <RefreshCw size={13} strokeWidth={1.5} />
              Return to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
