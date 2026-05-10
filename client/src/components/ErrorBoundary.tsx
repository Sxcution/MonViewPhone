import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#111',
          color: '#fff', fontFamily: 'monospace', gap: 12
        }}>
          <div style={{ fontSize: 18, color: '#f55' }}>App crashed</div>
          <pre style={{ fontSize: 12, color: '#aaa', maxWidth: 600, overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
