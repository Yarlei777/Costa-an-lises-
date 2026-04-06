import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
          <div className="glass-card rounded-[2rem] p-8 max-w-md w-full text-center border-red-500/30">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-black gold-text mb-4 uppercase tracking-widest">Erro no Sistema</h1>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Ocorreu um erro inesperado na aplicação. Isso pode ser devido a dados inconsistentes ou falha na conexão.
            </p>
            <div className="bg-black/40 rounded-xl p-4 mb-8 text-left overflow-auto max-h-32 border border-white/5">
              <code className="text-[10px] text-red-400 font-mono break-all">
                {this.state.error?.message || 'Erro desconhecido'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 neon-green-gradient rounded-xl text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
