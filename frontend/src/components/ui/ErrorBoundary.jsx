import { Component } from 'react';
import { Container } from './Layout.jsx';
import Button from './Button.jsx';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-ivory">
          <Container className="max-w-lg text-center py-24">
            <div className="text-eyebrow mb-6">Error / 500</div>
            <h1 className="text-display-md mb-4">Something broke on our end.</h1>
            <p className="text-slate text-sm mb-8">
              We&apos;ve been notified. Try reloading — if it persists, please contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()}>Reload</Button>
              <Button to="/" variant="ghost">
                Go home
              </Button>
            </div>
          </Container>
        </div>
      );
    }
    return this.props.children;
  }
}
