import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Logo } from "../Logo";

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
  logoUrl?: string;
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
  logoUrl,
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden min-w-0 flex flex-col animate-fadeIn transition-colors ${className}`}
      style={{ backgroundColor: theme.pageBg, color: theme.pageText }}
    >
      {/* Top Sticky Header Bar adhering to Haze Layout & Spacing */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md shadow-2xs transition-colors"
        style={{ backgroundColor: `${theme.cardBg}fa`, borderColor: theme.cardBorder }}
      >
        <div className={`${fullWidth ? "px-2.5 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-2.5 sm:px-6"} py-2.5 sm:py-3`}>
          {/* Breadcrumb row & Back button & Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
            <div className="flex items-center gap-2 text-xs min-w-0 max-w-full">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer active:scale-95 shadow-2xs group border shrink-0 text-xs"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                  color: theme.pageText,
                }}
                title="Geri Dön (ESC)"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary group-hover:-translate-x-0.5 transition-all shrink-0" />
                <span>Geri Dön</span>
                <span className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 font-mono">
                  ESC
                </span>
              </button>

              {/* Logo Emblem indicator in Detail Page Header */}
              <div className="hidden md:flex items-center pl-1 shrink-0">
                <Logo
                  size="xs"
                  src={logoUrl || "/logo.svg"}
                  className="max-h-6 opacity-90"
                />
              </div>

              <div className="flex items-center gap-1.5 font-medium pl-1 overflow-x-auto custom-scrollbar no-scrollbar py-0.5 min-w-0">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />}
                      {crumb.onClick && !isLast ? (
                        <button
                          type="button"
                          onClick={crumb.onClick}
                          className="hover:text-purple-600 font-semibold transition-colors truncate max-w-[100px] sm:max-w-[160px] cursor-pointer shrink-0"
                          style={{ color: theme.pageTextMuted }}
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span
                          className="truncate max-w-[120px] sm:max-w-[220px] font-bold shrink-0"
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
            {actions && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start sm:justify-end w-full sm:w-auto shrink-0">
                {actions}
              </div>
            )}
          </div>

          {/* Main Title & Status Badge Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {headerIcon && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  {headerIcon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  <h1 className="text-sm sm:text-base md:text-xl font-editorial font-medium tracking-tight truncate" style={{ color: theme.pageText }}>
                    {title}
                  </h1>
                  {statusBadge && <div className="shrink-0">{statusBadge}</div>}
                </div>
                {subtitle && (
                  <p className="text-[11px] sm:text-xs font-medium truncate mt-0.5" style={{ color: theme.pageTextMuted }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 py-3 sm:py-6 w-full min-w-0">
        <div className={`${fullWidth ? "px-2.5 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-2.5 sm:px-6"} w-full min-w-0`}>
          {children}
        </div>
      </main>
    </div>
  );
};
