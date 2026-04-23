import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Keep a console signal for debugging in devtools.
    console.error('App crashed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || String(this.state.error || 'Unknown error');
    const stack = this.state.error?.stack || '';
    const componentStack = this.state.info?.componentStack || '';

    return (
      <div className="min-h-screen w-full bg-white text-black p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Something crashed while initializing.</h1>
          <p className="mt-2 text-sm opacity-80">
            This screen replaces the blank white page so we can see the exact error.
          </p>

          <div className="mt-5 rounded-lg border border-black/15 bg-black/5 p-4">
            <div className="font-mono text-sm whitespace-pre-wrap break-words">{message}</div>
          </div>

          {(stack || componentStack) ? (
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">Stack trace</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap break-words bg-black text-white p-4 rounded-lg overflow-auto">
                {stack}
                {componentStack ? `\n\nReact component stack:\n${componentStack}` : ''}
              </pre>
            </details>
          ) : null}

          <button
            className="mt-6 px-4 py-2 rounded-md border border-black/20 hover:bg-black/5"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

