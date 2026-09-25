import React, { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Check, RotateCcw, X, Eye, EyeOff, Lock } from "lucide-react";
import { ColumnDef } from "../../hooks/useColumnVisibility";
import { useTheme } from "../../context/ThemeContext";

interface ColumnManagementDropdownProps {
  columns: ColumnDef[];
  columnVisibility: Record<string, boolean>;
  onToggleColumn: (id: string) => void;
  onSetAllColumns: (visible: boolean) => void;
  onResetToDefaults: () => void;
  hiddenCount: number;
  buttonLabel?: string;
  size?: "sm" | "md";
}

export const ColumnManagementDropdown: React.FC<ColumnManagementDropdownProps> = ({
  columns,
  columnVisibility,
  onToggleColumn,
  onSetAllColumns,
  onResetToDefaults,
  hiddenCount,
  buttonLabel = "Kolonlar",
  size = "sm",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const configurableColumns = columns.filter((col) => !col.alwaysVisible && !col.lockVisible);
  const allConfigurableVisible = configurableColumns.every((c) => columnVisibility[c.id] !== false);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="btn-column-management-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-semibold ${
          size === "sm" ? "px-3 py-2 text-xs" : "px-3.5 py-2.5 text-sm"
        } ${
          isOpen || hiddenCount > 0
            ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs font-bold dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200"
            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
        }`}
        title="Görüntülenecek sütunları yönet"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden sm:inline">{buttonLabel}</span>
        {hiddenCount > 0 && (
          <span
            className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs"
            title={`${hiddenCount} sütun gizlendi`}
          >
            {hiddenCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          id="popover-column-management"
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl shadow-xl border z-50 animate-fadeIn overflow-hidden"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Sütun Yönetimi</h4>
                <p className="text-[10px] text-slate-500">Görünür sütunları özelleştirin</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div
            className="px-3 py-2 bg-slate-50/60 dark:bg-slate-800/40 border-b flex items-center justify-between gap-2 text-[11px]"
            style={{ borderColor: theme.cardBorder }}
          >
            <button
              type="button"
              onClick={() => onSetAllColumns(!allConfigurableVisible)}
              className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {allConfigurableVisible ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Tümünü Gizle</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Tümünü Göster</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onResetToDefaults}
              className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Varsayılan sütun görünümüne dön"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Varsayılana Sıfırla</span>
            </button>
          </div>

          {/* Columns Checklist */}
          <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar space-y-1">
            {columns.map((col) => {
              const isColVisible = col.alwaysVisible ? true : columnVisibility[col.id] !== false;

              return (
                <label
                  key={col.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    col.alwaysVisible
                      ? "opacity-60 bg-slate-50/40 dark:bg-slate-800/20 cursor-not-allowed"
                      : isColVisible
                      ? "bg-slate-50/80 hover:bg-indigo-50/60 text-slate-800 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 dark:text-slate-200 cursor-pointer"
                      : "hover:bg-slate-100/60 text-slate-400 dark:hover:bg-slate-800/40 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2.5 select-none min-w-0 pr-2">
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-white transition-all shrink-0 ${
                        col.alwaysVisible
                          ? "bg-slate-400 dark:bg-slate-600"
                          : isColVisible
                          ? "bg-indigo-600 shadow-2xs"
                          : "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {isColVisible && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className={`truncate font-medium ${isColVisible ? "text-slate-800 dark:text-slate-100" : "text-slate-400 line-through"}`}>
                      {col.label}
                    </span>
                  </div>

                  <div className="flex items-center shrink-0">
                    {col.alwaysVisible ? (
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-md">
                        <Lock className="w-2.5 h-2.5" />
                        Sabit
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isColVisible}
                        onChange={() => onToggleColumn(col.id)}
                        className="sr-only"
                      />
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Footer note */}
          <div
            className="px-3 py-2 border-t bg-slate-50/50 dark:bg-slate-800/30 text-[10px] text-slate-400 text-center"
            style={{ borderColor: theme.cardBorder }}
          >
            Seçimleriniz tarayıcınızda (localStorage) otomatik saklanır.
          </div>
        </div>
      )}
    </div>
  );
};
