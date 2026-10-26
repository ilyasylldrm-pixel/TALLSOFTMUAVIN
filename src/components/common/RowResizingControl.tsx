import React, { useEffect, useState } from "react";
import { MoveVertical, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { applyGlobalRowHeight } from "../../hooks/useDataGridRowResizing";

interface RowResizingControlProps {
  className?: string;
  showHints?: boolean;
}

/**
 * RowResizingControl
 * 
 * Klavye ve etkileşimli kontroller ile satır yüksekliğinin hassas bir şekilde
 * artırılıp azaltılmasını, tüm tabloya uygulanmasını veya varsayılana sıfırlanmasını sağlar.
 * Seçili satır varsa ok tuşları (Sağ/Sol: artır/azalt) ile hassas boyutlandırma yapar.
 */
export const RowResizingControl: React.FC<RowResizingControlProps> = ({
  className = "",
  showHints = true,
}) => {
  const [selectedRowHeight, setSelectedRowHeight] = useState<number | null>(null);
  const [hasSelectedRow, setHasSelectedRow] = useState(false);

  useEffect(() => {
    const updateSelectedRowInfo = () => {
      const activeRow = document.querySelector(
        "tbody tr[data-row-clicked='true'], [role='row'][data-row-clicked='true'], .data-grid-row[data-row-clicked='true']"
      ) as HTMLElement | null;

      if (activeRow) {
        setHasSelectedRow(true);
        const customH = activeRow.dataset.customHeight;
        if (customH) {
          setSelectedRowHeight(parseInt(customH, 10));
        } else {
          setSelectedRowHeight(Math.round(activeRow.getBoundingClientRect().height));
        }
      } else {
        setHasSelectedRow(false);
        const saved = sessionStorage.getItem("muavin_table_row_height");
        setSelectedRowHeight(saved ? parseInt(saved, 10) : null);
      }
    };

    updateSelectedRowInfo();
    const interval = setInterval(updateSelectedRowInfo, 400);

    const onRowHeightChange = (e: any) => {
      if (e.detail?.height) {
        setSelectedRowHeight(e.detail.height);
      }
    };

    window.addEventListener("muavin:row-height-change", onRowHeightChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("muavin:row-height-change", onRowHeightChange);
    };
  }, []);

  const handleAdjust = (delta: number) => {
    const activeRow = document.querySelector(
      "tbody tr[data-row-clicked='true'], [role='row'][data-row-clicked='true'], .data-grid-row[data-row-clicked='true']"
    ) as HTMLElement | null;

    if (activeRow) {
      // Dispatch keyboard arrow event to trigger resize
      const key = delta > 0 ? "ArrowRight" : "ArrowLeft";
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
        })
      );
    } else {
      // Adjust global row height
      const current = selectedRowHeight || 44;
      const next = Math.max(26, Math.min(350, current + delta));
      applyGlobalRowHeight(next);
      setSelectedRowHeight(next);
    }
  };

  const handleReset = () => {
    const activeRow = document.querySelector(
      "tbody tr[data-row-clicked='true'], [role='row'][data-row-clicked='true'], .data-grid-row[data-row-clicked='true']"
    ) as HTMLElement | null;

    if (activeRow) {
      activeRow.style.height = "";
      activeRow.style.minHeight = "";
      delete activeRow.dataset.customHeight;
      activeRow.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
        td.style.height = "";
      });
      setSelectedRowHeight(Math.round(activeRow.getBoundingClientRect().height));
    } else {
      applyGlobalRowHeight(null);
      setSelectedRowHeight(null);
    }
  };

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Satır Yüksekliği Ayar Kontrolü"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          handleAdjust(-2);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          handleAdjust(2);
        }
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${className}`}
      title={
        hasSelectedRow
          ? "Seçili satır boyutunu Sağ/Sol ok tuşları ile hassas ayarlayabilirsiniz (Shift: Tüm tablo)"
          : "Bir satıra tıklayarak seçebilir, ardından Sağ/Sol ok tuşları ile boyutunu ayarlayabilirsiniz"
      }
    >
      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
        <MoveVertical className="w-3.5 h-3.5" />
        <span className="font-mono text-[11px]">
          {selectedRowHeight ? `${selectedRowHeight}px` : "Oto"}
        </span>
      </div>

      <div className="flex items-center gap-0.5 ml-1">
        <button
          type="button"
          onClick={() => handleAdjust(-2)}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
          title="Satır boyutunu azalt (Sol Ok tuşu / ←)"
        >
          <ArrowLeft className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => handleAdjust(2)}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
          title="Satır boyutunu artır (Sağ Ok tuşu / →)"
        >
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
          title="Satır boyutunu sıfırla (Çift tık / Shift+Çift tık)"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {showHints && (
        <span className="hidden sm:inline-block text-[10px] text-slate-600 dark:text-slate-300 pl-1 border-l border-slate-200 dark:border-slate-700">
          {hasSelectedRow ? "← / → tuşları" : "Satır seçip ← / →"}
        </span>
      )}
    </div>
  );
};

export default RowResizingControl;
