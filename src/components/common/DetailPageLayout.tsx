import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface DetailPageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  onBack: () => void;
  actions?: React.ReactNode;
  statusBadge?: React.ReactNode;
  headerIcon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs,
  onBack,
  actions,
  statusBadge,
  headerIcon,
  children,
  fullWidth = false,
  className = "",
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden min-w-0 flex flex-col animate-fadeIn transition-colors ${className}`}
      style={{ backgroundColor: theme.pageBg, color: theme.pageText }}
    >
      {/* Top Sticky Header Bar */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md shadow-2xs transition-colors"
        style={{ backgroundColor: `${theme.cardBg}fa`, borderColor: theme.cardBorder }}
      >
        <div className={`${fullWidth ? "px-4 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-4 sm:px-6"} py-3`}>
          {/* Breadcrumb row & Back button */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer active:scale-95 shadow-2xs group border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                  color: theme.pageText,
                }}
                title="Geri Dön (ESC)"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:-translate-x-0.5 transition-all" />
                <span>Geri Dön</span>
                <span className="hidden sm:inline-block text-[10px] px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700 text-slate-400 font-mono">
                  ESC
                </span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 font-medium pl-1 overflow-x-auto custom-scrollbar">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />}
                      {crumb.onClick && !isLast ? (
                        <button
                          type="button"
                          onClick={crumb.onClick}
                          className="hover:text-purple-600 font-semibold transition-colors truncate max-w-[160px] cursor-pointer"
                          style={{ color: theme.pageTextMuted }}
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span
                          className="truncate max-w-[220px] font-bold"
                          style={{ color: isLast || crumb.active ? theme.pageText : theme.pageTextMuted }}
                        >
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Top Action Buttons */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          {/* Main Title & Status Badge Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              {headerIcon && (
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  {headerIcon}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate" style={{ color: theme.pageText }}>
                    {title}
                  </h1>
                  {statusBadge && <div className="shrink-0">{statusBadge}</div>}
                </div>
                {subtitle && (
                  <p className="text-xs font-medium truncate mt-0.5" style={{ color: theme.pageTextMuted }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 py-6 w-full min-w-0">
        <div className={`${fullWidth ? "px-4 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-4 sm:px-6"} w-full min-w-0`}>
          {children}
        </div>
      </main>
    </div>
  );
};
