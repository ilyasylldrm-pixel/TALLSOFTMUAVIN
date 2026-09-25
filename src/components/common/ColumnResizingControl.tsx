import React, { useEffect, useState } from "react";
import { MoveHorizontal, RotateCcw } from "lucide-react";
import { resetTableColumnWidths, getTableColumnWidths, getTableKey } from "../../hooks/useDataGridColumnResizing";

interface ColumnResizingControlProps {
  className?: string;
  tableKey?: string;
  showHints?: boolean;
}

/**
 * ColumnResizingControl
 * 
 * Provides quick visual status and one-click reset for custom column widths
 * configured by the user on the current data table.
 */
export const ColumnResizingControl: React.FC<ColumnResizingControlProps> = ({
  className = "",
  tableKey,
  showHints = true,
}) => {
  const [customColsCount, setCustomColsCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      let resolvedKey = tableKey;
      if (!resolvedKey) {
        const table = document.querySelector<HTMLElement>("table");
        if (table) resolvedKey = getTableKey(table);
      }

      if (resolvedKey) {
        const widths = getTableColumnWidths(resolvedKey);
        setCustomColsCount(Object.keys(widths).length);
      } else {
        setCustomColsCount(0);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 800);

    const onColWidthChange = () => {
      updateCount();
    };

    window.addEventListener("muavin:col-width-change", onColWidthChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("muavin:col-width-change", onColWidthChange);
    };
  }, [tableKey]);

  const handleReset = () => {
    let resolvedKey = tableKey;
    if (!resolvedKey) {
      const table = document.querySelector<HTMLElement>("table");
      if (table) resolvedKey = getTableKey(table);
    }
    resetTableColumnWidths(resolvedKey);
    setCustomColsCount(0);
  };

  if (customColsCount === 0 && !showHints) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Sütun Genişliği Kontrolü"
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs ${className}`}
      title="Sütun başlıklarının sağ kenarından sürükleyerek genişlikleri ayarlayabilir, çift tıklayarak sıfırlayabilirsiniz"
    >
      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
        <MoveHorizontal className="w-3.5 h-3.5" />
        <span className="font-mono text-[11px]">
          {customColsCount > 0 ? `${customColsCount} Özel Sütun` : "Sütun Boyutu"}
        </span>
      </div>

      {customColsCount > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
          title="Tüm sütun genişliklerini varsayılana sıfırla"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}

      {showHints && (
        <span className="hidden sm:inline-block text-[10px] text-slate-500 dark:text-slate-400 pl-1 border-l border-slate-200 dark:border-slate-700">
          Kenardan sürükle
        </span>
      )}
    </div>
  );
};

export default ColumnResizingControl;
