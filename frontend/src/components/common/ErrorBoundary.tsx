import { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 text-center bg-white/50 backdrop-blur-xl rounded-2xl border-2 border-dashed border-danger/20 animate-in zoom-in-95 duration-500">
          <div className="max-w-md flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-danger/10 text-danger flex items-center justify-center text-4xl shadow-lg shadow-danger/10">
              <FiAlertTriangle />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Sistemde Bir Aksilik Oldu</h2>
              <p className="text-sm font-bold text-slate-500 leading-relaxed px-4">
                İstenmeyen bir hata oluştu ve işlem kesintiye uğradı. <br />
                Endişelenmeyin, verileriniz güvende.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="w-full p-4 bg-slate-900 rounded-2xl text-left overflow-auto max-h-[150px]">
                <code className="text-[10px] text-rose-400 font-mono leading-tight whitespace-pre-wrap">
                  {this.state.error.stack}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full px-4 mt-2">
              <button 
                onClick={this.handleReset}
                className="flex-1 h-12 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-colors shadow-md shadow-primary/20"
              >
                <FiRefreshCw /> Sayfayı Yenile
              </button>
              <button 
                onClick={this.handleGoHome}
                className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
              >
                <FiHome /> Ana Sayfa
              </button>
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">
              ERMAY ERP GÜVENLİK PROTOKOLÜ ETKİN
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
