import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          background: 'var(--bg-app)',
          color: 'var(--text-primary)'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--danger)' }}>
            Hay aksi! Bir şeyler ters gitti.
          </h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Uygulama beklelenmedik bir hata ile karşılaştı. Lütfen sayfayı yenilemeyi deneyin.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px' }}
          >
            SAYFAYI YENİLE
          </button>
          {import.meta.env.DEV && (
            <pre style={{
              marginTop: '2rem',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '8px',
              maxWidth: '100%',
              overflowX: 'auto',
              textAlign: 'left',
              fontSize: '12px',
              color: '#d63384'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
