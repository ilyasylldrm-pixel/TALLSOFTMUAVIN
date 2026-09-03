import React from "react";
import { ArrowLeft, ChevronRight, CornerDownLeft } from "lucide-react";

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
  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col animate-fadeIn ${className}`}>
      {/* Top Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className={`${fullWidth ? "px-4 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-4 sm:px-6"} py-3`}>
          {/* Breadcrumb row & Back button */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-slate-700 bg-slate-100 hover:bg-purple-100 hover:text-purple-700 border border-slate-200 transition-all cursor-pointer active:scale-95 shadow-2xs group"
                title="Geri Dön (ESC)"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-purple-700 group-hover:-translate-x-0.5 transition-transform" />
                <span>Geri Dön</span>
                <span className="hidden sm:inline-block text-[10px] bg-white/80 px-1 py-0.2 rounded border border-slate-300 text-slate-400 font-mono">
                  ESC
                </span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-slate-500 font-medium pl-1 overflow-x-auto custom-scrollbar">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                      {crumb.onClick && !isLast ? (
                        <button
                          type="button"
                          onClick={crumb.onClick}
                          className="hover:text-purple-700 font-semibold transition-colors truncate max-w-[160px] cursor-pointer"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span
                          className={`truncate max-w-[200px] ${
                            isLast || crumb.active ? "font-bold text-slate-900" : ""
                          }`}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              {headerIcon && (
                <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
                  {headerIcon}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                    {title}
                  </h1>
                  {statusBadge && <div className="shrink-0">{statusBadge}</div>}
                </div>
                {subtitle && (
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body (Full Height, Spacious Workspace) */}
      <main className="flex-1 py-6">
        <div className={fullWidth ? "px-4 sm:px-6 lg:px-8" : "max-w-7xl mx-auto px-4 sm:px-6"}>
          {children}
        </div>
      </main>
    </div>
  );
};
