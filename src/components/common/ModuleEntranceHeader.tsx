import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { Sparkles } from "lucide-react";
import { GeometricHoneycombBackground } from "./GeometricHoneycombBackground";

export interface ModuleEntranceHeaderProps {
  id?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  description?: string;
  stats?: Array<{
    label: string;
    value: string | number;
    tone?: "default" | "success" | "warning" | "danger" | "info";
  }>;
  actions?: React.ReactNode;
  className?: string;
}

export const ModuleEntranceHeader: React.FC<ModuleEntranceHeaderProps> = ({
  id,
  badge,
  badgeIcon,
  title,
  description,
  stats,
  actions,
  className = "",
}) => {
  const { theme } = useTheme();

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all shadow-2xs haze-module-entrance-bg ${className}`}
      style={{
        borderColor: theme.cardBorder,
      }}
    >
      {/* Bal Peteği ve Geometrik Şekiller Arka Planı (Honeycomb & Geometric Background) */}
      <GeometricHoneycombBackground id={id ? `geom-${id}` : "entrance-geom"} />

      {/* Editorial Glowing Gradient - Ortada (Yumuşatılmış / Softened Center Glow) */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-12 w-96 sm:w-[32rem] h-64 rounded-full blur-3xl opacity-15 dark:opacity-10"
        style={{
          background: `radial-gradient(ellipse at center, ${theme.primaryColor || "#0f6bae"} 0%, rgba(56,189,248,0.1) 35%, rgba(218,226,253,0.12) 60%, transparent 80%)`,
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-14 w-72 h-44 rounded-full blur-2xl opacity-10 dark:opacity-5"
        style={{
          background: "radial-gradient(ellipse at center, #38bdf8 0%, rgba(234,237,255,0.1) 50%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      {/* Top Editorial Accent Hairline - Ortada yumuşatılmış ince gradyan */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-45"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${theme.primaryColor || "#005289"} 30%, #38bdf8 50%, #0f6bae 70%, transparent 100%)`,
        }}
      />

      {/* Content Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Centered Module Info: Badge, Title & Description */}
        <div className="space-y-2 flex-1 flex flex-col items-center text-center max-w-4xl mx-auto">
          {badge && (
            <div className="flex items-center justify-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border label-caps shadow-2xs"
                style={{
                  backgroundColor: "#eaedff",
                  color: "#005289",
                  borderColor: "#dae2fd",
                }}
              >
                {badgeIcon || <Sparkles className="w-2.5 h-2.5 text-[#0f6bae]" />}
                <span>{badge}</span>
              </span>
            </div>
          )}

          <h1
            className="text-2xl sm:text-3xl font-editorial font-semibold tracking-tight leading-tight text-center"
            style={{ color: theme.pageText }}
          >
            {title}
          </h1>

          {description && (
            <p
              className="text-xs sm:text-sm font-medium leading-relaxed text-center max-w-2xl"
              style={{ color: theme.pageTextMuted }}
            >
              {description}
            </p>
          )}

          {/* Quick Stats Pills if present */}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5">
              {stats.map((st, idx) => {
                let badgeStyle = {
                  bg: "bg-slate-50",
                  border: "border-slate-200",
                  text: "text-slate-700",
                };
                if (st.tone === "success") {
                  badgeStyle = {
                    bg: "bg-emerald-50/80",
                    border: "border-emerald-200",
                    text: "text-emerald-800",
                  };
                } else if (st.tone === "warning") {
                  badgeStyle = {
                    bg: "bg-amber-50/80",
                    border: "border-amber-200",
                    text: "text-amber-800",
                  };
                } else if (st.tone === "danger") {
                  badgeStyle = {
                    bg: "bg-rose-50/80",
                    border: "border-rose-200",
                    text: "text-rose-800",
                  };
                } else if (st.tone === "info") {
                  badgeStyle = {
                    bg: "bg-blue-50/80",
                    border: "border-blue-200",
                    text: "text-blue-800",
                  };
                }

                return (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${badgeStyle.bg} ${badgeStyle.border} shadow-2xs`}
                  >
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {st.label}:
                    </span>
                    <span className={`font-mono font-bold font-tabular-num-md ${badgeStyle.text}`}>
                      {st.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Actions Container */}
        {actions && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0 self-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
