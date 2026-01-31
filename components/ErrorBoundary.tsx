import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    if (window.confirm("This will clear all local data to fix the crash. Are you sure?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-navy-800 p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
            <AlertTriangle className="mx-auto text-coral-500 mb-6" size={48} />
            <h1 className="text-2xl font-serif font-bold mb-4">Something went wrong.</h1>
            <p className="text-gray-400 mb-8">
              Glimmer encountered an unexpected error. Usually, a simple reload fixes this.
            </p>
            
            <div className="space-y-4">
                <button 
                    onClick={this.handleReload}
                    className="w-full bg-coral-500 hover:bg-coral-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <RefreshCw size={20} /> Reload App
                </button>

                <button 
                    onClick={this.handleHardReset}
                    className="w-full bg-navy-900 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Trash2 size={20} /> Reset Data (Emergency)
                </button>
            </div>
            
            {this.state.error && (
                <div className="mt-8 p-4 bg-black/30 rounded-lg text-left overflow-auto max-h-32">
                    <code className="text-xs text-red-300 font-mono">
                        {this.state.error.toString()}
                    </code>
                </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}