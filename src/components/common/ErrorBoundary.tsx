import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected interface error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="halftone-ink flex min-h-screen flex-col items-center justify-center bg-[#fff4e2] px-6 text-center text-[#5a0f14]">
          <div className="max-w-md rounded-2xl border-2 border-[#1b1b1b] bg-[#fffaf0] p-8 shadow-[6px_6px_0_0_#1b1b1b]">
            <h1 className="font-heading text-2xl font-bold text-[#5a0f14]">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-[#4a4642]">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-craft-primary mt-6 rounded-xl px-5 py-2.5 text-sm font-bold"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
