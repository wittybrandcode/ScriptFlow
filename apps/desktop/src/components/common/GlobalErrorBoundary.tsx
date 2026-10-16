import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07070E] p-6 text-white font-sans" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle size={36} />
            </div>

            <h2 className="text-xl font-bold mb-2 tracking-wide">حدث خطأ غير متوقع في واجهة التطبيق</h2>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              تم احتواء المشكلة بنجاح لمنع تعطل النظام. بياناتك وسيناريوهاتك محفوظة بأمان. يمكنك إعادة تحميل الصفحة أو العودة للشاشة الرئيسية.
            </p>

            {this.state.error && (
              <div className="w-full mb-6 rounded-xl bg-black/40 border border-white/5 p-4 text-right text-xs font-mono text-rose-300/80 overflow-x-auto max-h-36">
                <p className="font-bold text-rose-400 mb-1">تفاصيل الخطأ الفني:</p>
                <code>{this.state.error.message || String(this.state.error)}</code>
              </div>
            )}

            <div className="flex w-full flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/5"
              >
                <RefreshCw size={16} />
                <span>إعادة تحميل الصفحة</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition-all"
              >
                <Home size={16} />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
