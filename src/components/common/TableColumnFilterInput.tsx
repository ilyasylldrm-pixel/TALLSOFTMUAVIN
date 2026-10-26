import React from "react";
import { Search, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export interface TableColumnFilterInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "text" | "select";
  options?: { label: string; value: string }[];
  className?: string;
  id?: string;
}

export const TableColumnFilterInput: React.FC<TableColumnFilterInputProps> = ({
  value = "",
  onChange,
  placeholder = "Filtrele...",
  type = "text",
  options = [],
  className = "",
  id,
}) => {
  const { theme } = useTheme();
  const safeValue = typeof value === "string" ? value : "";
  const hasValue = Boolean(safeValue.trim() !== "");

  if (type === "select") {
    return (
      <div className={`relative w-full ${className}`} onClick={(e) => e.stopPropagation()}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full py-1 pl-2 pr-5 text-[11px] rounded-lg border font-normal transition-all appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500 ${
            hasValue
              ? "bg-purple-50/80 border-purple-300 text-purple-900 font-semibold ring-1 ring-purple-200"
              : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          }`}
          style={{
            borderColor: hasValue ? undefined : theme.cardBorder,
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasValue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 p-0.5 rounded cursor-pointer"
            title="Filtreyi temizle"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} onClick={(e) => e.stopPropagation()}>
      <Search
        className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
          hasValue ? "text-purple-600" : "text-slate-400"
        }`}
      />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full py-1 pl-6 pr-5 text-[11px] rounded-lg border font-normal transition-all focus:outline-none focus:ring-1 focus:ring-purple-500 ${
          hasValue
            ? "bg-purple-50/70 border-purple-300 text-purple-950 font-medium placeholder-purple-400 ring-1 ring-purple-200"
            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400"
        }`}
        style={{
          borderColor: hasValue ? undefined : theme.cardBorder,
        }}
      />
      {hasValue && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-900 p-0.5 rounded cursor-pointer transition-colors"
          title="Filtreyi temizle"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
