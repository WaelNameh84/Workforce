import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0f172a',
          color: '#f1f5f9',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171', margin: 0 }}>
          حدث خطأ في التطبيق
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>An error occurred</p>
        <pre
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.75rem',
            color: '#fca5a5',
            maxWidth: '600px',
            overflowX: 'auto',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    );
  }
}
