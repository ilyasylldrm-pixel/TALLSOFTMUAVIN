import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { triggerFormErrorNotification } from "../../context/FormErrorContext";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  key?: React.Key;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  public state: State;
  public props: Props;
  public setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
    this.setState = super.setState ? super.setState.bind(this) : () => {};
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    try {
      triggerFormErrorNotification(
        error.message || "Bileşen yüklenirken beklenmeyen bir hata oluştu.",
        this.props.fallbackTitle || "Modül Yükleme Hatası"
      );
    } catch {
      // ignore
    }
  }

  private handleRetry = () => {
    try {
      sessionStorage.removeItem("chunk_reload_lock");
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isDynamicImportError =
        this.state.error?.message?.includes("dynamically imported module") ||
        this.state.error?.message?.includes("Failed to fetch") ||
        this.state.error?.message?.includes("MIME type") ||
        this.state.error?.message?.includes("valid JavaScript");

      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-lg border border-[#c0c7d2] shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold font-serif text-[#131b2e]">
              {this.props.fallbackTitle || "Modül Yüklenirken Bir Hata Oluştu"}
            </h3>
            <p className="text-xs text-[#414750] mt-1.5 leading-relaxed">
              {isDynamicImportError
                ? "Ağ bağlantısındaki anlık kesinti veya modül güncellemesi nedeniyle ilgili sayfa yüklenemedi. Aşağıdaki butona tıklayarak yeniden deneyebilirsiniz."
                : (this.state.error?.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.")}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 bg-[#005289] hover:bg-[#0f6bae] text-white font-medium rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Yeniden Dene</span>
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 bg-[#eaedff] hover:bg-[#dae2fd] text-[#005289] font-medium rounded text-xs transition-colors cursor-pointer border border-[#c0c7d2]"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
