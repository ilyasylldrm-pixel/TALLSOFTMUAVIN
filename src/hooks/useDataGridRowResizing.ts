import { useEffect } from "react";

/**
 * useDataGridRowResizing
 * 
 * Provides an interactive row-resizing feature across ALL listed tables and rows in the application.
 * 
 * Features:
 * - Keyboard Resizing: With a row selected/clicked, press ArrowRight / ArrowLeft to increase/decrease row height (+2px / -2px, or +6px / -6px with Alt, Shift for all table rows).
 * - Direct Mouse Drag: Hover within 6px of any row's bottom border and drag up/down to adjust row height.
 * - Shift + Drag: Automatically resizes ALL sibling data rows in that table to the same height.
 * - Double-Click Reset: Double-clicking the bottom resize zone resets the row to default (auto-fit).
 * - Shift + Double-Click: Resets ALL rows in the table.
 * - Real-time HUD Guide & Badge: Displays current pixel height (e.g. "↕ 52 px") and shortcut hints.
 * - Conflict-free: Prevents accidental row click / navigation while resizing.
 */

// Helper to check if a row is an actual data row
const isDataRow = (row: HTMLElement | null): boolean => {
  if (!row) return false;
  if (row.closest("thead") || row.closest("tfoot")) return false;
  if (row.dataset.skipRowResize === "true" || row.dataset.noRowHighlight === "true") return false;

  // Skip single-cell empty state or full-width placeholder rows
  const cells = row.querySelectorAll("td, [role='gridcell']");
  if (cells.length === 1 && (cells[0].hasAttribute("colspan") || (cells[0] as HTMLTableCellElement).colSpan > 1)) {
    return false;
  }

  // Skip expanded detail container rows
  if (row.classList.contains("expanded-detail-row") || (cells.length === 1 && cells[0].querySelector(".space-y-4, .space-y-6"))) {
    return false;
  }
  return true;
};

// Global helper to apply uniform row height across all currently visible data tables
export function applyGlobalRowHeight(heightPx: number | null) {
  const allRows = Array.from(document.querySelectorAll<HTMLElement>("tbody > tr, [role='row'], .data-grid-row")).filter(isDataRow);
  allRows.forEach((r) => {
    if (heightPx === null) {
      r.style.height = "";
      r.style.minHeight = "";
      delete r.dataset.customHeight;
      r.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
        td.style.height = "";
      });
    } else {
      r.style.height = `${heightPx}px`;
      r.style.minHeight = `${heightPx}px`;
      r.dataset.customHeight = String(heightPx);
      r.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
        td.style.height = `${heightPx}px`;
      });
    }
  });

  if (heightPx === null) {
    sessionStorage.removeItem("muavin_table_row_height");
  } else {
    sessionStorage.setItem("muavin_table_row_height", String(heightPx));
  }

  window.dispatchEvent(new CustomEvent("muavin:row-height-change", { detail: { height: heightPx } }));
}

export function useDataGridRowResizing() {
  useEffect(() => {
    let isResizing = false;
    let activeRow: HTMLElement | null = null;
    let activeTable: HTMLElement | null = null;
    let startY = 0;
    let startHeight = 0;
    let lastHoveredRow: HTMLElement | null = null;

    // Create or reuse HUD elements
    let guideLine = document.getElementById("row-resizing-guide-line") as HTMLDivElement | null;
    if (!guideLine) {
      guideLine = document.createElement("div");
      guideLine.id = "row-resizing-guide-line";
      guideLine.className = "row-resizing-guide-line";
      guideLine.style.display = "none";
      document.body.appendChild(guideLine);
    }

    let hudBadge = document.getElementById("row-resizing-hud-badge") as HTMLDivElement | null;
    if (!hudBadge) {
      hudBadge = document.createElement("div");
      hudBadge.id = "row-resizing-hud-badge";
      hudBadge.className = "row-resizing-hud-badge";
      hudBadge.style.display = "none";
      document.body.appendChild(hudBadge);
    }

    const showToast = (message: string) => {
      const existing = document.getElementById("row-resizing-toast");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.id = "row-resizing-toast";
      toast.className = "row-resizing-toast";
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (toast && toast.parentElement) toast.remove();
      }, 2400);
    };

    // Apply remembered row height to any newly mounted table rows
    const applySavedRowHeight = () => {
      const saved = sessionStorage.getItem("muavin_table_row_height");
      if (saved) {
        const heightNum = parseInt(saved, 10);
        if (!isNaN(heightNum) && heightNum >= 26 && heightNum <= 350) {
          const rows = Array.from(document.querySelectorAll<HTMLElement>("tbody > tr:not([data-custom-height]), [role='row']:not([data-custom-height])")).filter(isDataRow);
          rows.forEach((r) => {
            r.style.height = `${heightNum}px`;
            r.style.minHeight = `${heightNum}px`;
            r.dataset.customHeight = String(heightNum);
            r.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
              td.style.height = `${heightNum}px`;
            });
          });
        }
      }
    };

    // Run initially and observe DOM changes (e.g. module switching, pagination, filter)
    applySavedRowHeight();
    const observer = new MutationObserver(() => {
      if (!isResizing) {
        applySavedRowHeight();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Check if mouse is near bottom border of a row
    const checkNearBottom = (e: MouseEvent, row: HTMLElement): boolean => {
      const rect = row.getBoundingClientRect();
      // 7px trigger strip along the bottom edge of the row
      return e.clientY >= rect.bottom - 7 && e.clientY <= rect.bottom + 3;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && activeRow) {
        e.preventDefault();
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(26, Math.min(350, Math.round(startHeight + deltaY)));

        // Update active row
        activeRow.style.height = `${newHeight}px`;
        activeRow.style.minHeight = `${newHeight}px`;
        activeRow.dataset.customHeight = String(newHeight);
        activeRow.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
          td.style.height = `${newHeight}px`;
        });

        // If shiftKey is pressed, update all sibling rows in the same table
        const isShift = e.shiftKey;
        if (isShift && activeTable) {
          const siblingRows = Array.from(
            activeTable.querySelectorAll<HTMLElement>("tbody > tr, [role='row'], .data-grid-row")
          ).filter(isDataRow);

          siblingRows.forEach((r) => {
            r.style.height = `${newHeight}px`;
            r.style.minHeight = `${newHeight}px`;
            r.dataset.customHeight = String(newHeight);
            r.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
              td.style.height = `${newHeight}px`;
            });
          });

          if (hudBadge) {
            hudBadge.innerHTML = `
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-[#c6cdff] shadow-xs shadow-indigo-500/20 shrink-0">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/></svg>
                </div>
                <span class="text-[#c6cdff] font-mono text-sm font-black tracking-tight">↕ ${newHeight} px</span>
                <span class="text-[10px] bg-indigo-500/30 text-indigo-100 border border-indigo-400/40 px-2.5 py-0.5 rounded-full font-bold shadow-xs">Tüm Tablo (${siblingRows.length} Satır)</span>
              </div>
              <div class="text-[10px] text-slate-300/80 pl-8.5 font-medium">Shift bırakılırsa sadece bu satır değişir</div>
            `;
          }
        } else {
          if (hudBadge) {
            hudBadge.innerHTML = `
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-[#c6cdff] shadow-xs shadow-indigo-500/20 shrink-0">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/></svg>
                </div>
                <span class="text-[#c6cdff] font-mono text-sm font-black tracking-tight">↕ ${newHeight} px</span>
                <span class="text-[10px] bg-slate-800/80 text-slate-200 border border-slate-700/80 px-2 py-0.5 rounded-full font-semibold">Tek Satır</span>
              </div>
              <div class="text-[10px] text-slate-300/80 pl-8.5 font-medium">Shift basılı tutarak tüm tabloya uygulayın</div>
            `;
          }
        }

        // Position guide line across the table
        if (guideLine && activeTable) {
          const tableRect = activeTable.getBoundingClientRect();
          guideLine.style.display = "block";
          guideLine.style.left = `${tableRect.left}px`;
          guideLine.style.width = `${tableRect.width}px`;
          guideLine.style.top = `${e.clientY}px`;
        }

        // Position floating badge
        if (hudBadge) {
          hudBadge.style.display = "flex";
          const badgeLeft = Math.min(window.innerWidth - 220, e.clientX + 16);
          const badgeTop = Math.max(16, Math.min(window.innerHeight - 60, e.clientY - 20));
          hudBadge.style.left = `${badgeLeft}px`;
          hudBadge.style.top = `${badgeTop}px`;
        }

        return;
      }

      // Normal hover check
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const row = target.closest("tbody tr, [role='row'], .data-grid-row") as HTMLElement | null;
      if (row && isDataRow(row)) {
        if (checkNearBottom(e, row)) {
          if (lastHoveredRow && lastHoveredRow !== row) {
            lastHoveredRow.classList.remove("row-resize-hover");
          }
          row.classList.add("row-resize-hover");
          document.body.style.cursor = "row-resize";
          lastHoveredRow = row;
        } else {
          if (row.classList.contains("row-resize-hover")) {
            row.classList.remove("row-resize-hover");
            document.body.style.cursor = "";
          }
          if (lastHoveredRow === row) {
            lastHoveredRow = null;
          }
        }
      } else if (lastHoveredRow) {
        lastHoveredRow.classList.remove("row-resize-hover");
        document.body.style.cursor = "";
        lastHoveredRow = null;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Left mouse button only
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const row = target.closest("tbody tr, [role='row'], .data-grid-row") as HTMLElement | null;
      if (!row || !isDataRow(row)) return;

      if (checkNearBottom(e, row)) {
        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        activeRow = row;
        activeTable = row.closest("table, [role='grid'], .data-grid");
        startY = e.clientY;
        startHeight = row.getBoundingClientRect().height;

        (window as any).__isResizingRow = true;
        document.body.classList.add("row-resizing-active");

        // Display guide line & HUD
        if (guideLine && activeTable) {
          const tableRect = activeTable.getBoundingClientRect();
          guideLine.style.display = "block";
          guideLine.style.left = `${tableRect.left}px`;
          guideLine.style.width = `${tableRect.width}px`;
          guideLine.style.top = `${e.clientY}px`;
        }

        if (hudBadge) {
          hudBadge.style.display = "flex";
          hudBadge.innerHTML = `
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-[#c6cdff] shadow-xs shadow-indigo-500/20 shrink-0">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/></svg>
              </div>
              <span class="text-[#c6cdff] font-mono text-sm font-black tracking-tight">↕ ${Math.round(startHeight)} px</span>
              <span class="text-[10px] bg-indigo-600/40 text-indigo-100 border border-indigo-400/40 px-2.5 py-0.5 rounded-full font-bold shadow-xs">Boyutlandırılıyor</span>
            </div>
            <div class="text-[10px] text-slate-300/80 pl-8.5 font-medium">Yukarı / Aşağı sürükleyin · Shift: Tüm Tablo</div>
          `;
          hudBadge.style.left = `${Math.min(window.innerWidth - 220, e.clientX + 16)}px`;
          hudBadge.style.top = `${Math.max(16, e.clientY - 20)}px`;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault();
        e.stopPropagation();

        isResizing = false;
        document.body.classList.remove("row-resizing-active");
        document.body.style.cursor = "";

        if (guideLine) guideLine.style.display = "none";
        if (hudBadge) hudBadge.style.display = "none";
        if (activeRow) activeRow.classList.remove("row-resize-hover");

        // If Shift was pressed, persist this height to sessionStorage as preferred row height
        if (e.shiftKey && activeRow) {
          const finalHeight = parseInt(activeRow.dataset.customHeight || "", 10);
          if (!isNaN(finalHeight)) {
            sessionStorage.setItem("muavin_table_row_height", String(finalHeight));
            window.dispatchEvent(new CustomEvent("muavin:row-height-change", { detail: { height: finalHeight } }));
            showToast(`Tüm satırlar ${finalHeight}px olarak ayarlandı.`);
          }
        }

        activeRow = null;
        activeTable = null;

        // Keep __isResizingRow true briefly to prevent accidental click handler activation
        setTimeout(() => {
          (window as any).__isResizingRow = false;
        }, 150);
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const row = target.closest("tbody tr, [role='row'], .data-grid-row") as HTMLElement | null;
      if (!row || !isDataRow(row)) return;

      if (checkNearBottom(e, row)) {
        e.preventDefault();
        e.stopPropagation();

        const table = row.closest("table, [role='grid'], .data-grid");
        if (e.shiftKey && table) {
          // Reset all rows in this table
          const siblingRows = Array.from(
            table.querySelectorAll<HTMLElement>("tbody > tr, [role='row'], .data-grid-row")
          ).filter(isDataRow);

          siblingRows.forEach((r) => {
            r.style.height = "";
            r.style.minHeight = "";
            delete r.dataset.customHeight;
            r.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
              td.style.height = "";
            });
          });
          sessionStorage.removeItem("muavin_table_row_height");
          window.dispatchEvent(new CustomEvent("muavin:row-height-change", { detail: { height: null } }));
          showToast("Tablodaki tüm satır yükseklikleri varsayılana sıfırlandı.");
        } else {
          // Reset single row
          row.style.height = "";
          row.style.minHeight = "";
          delete row.dataset.customHeight;
          row.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
            td.style.height = "";
          });
          showToast("Satır yüksekliği varsayılana sıfırlandı.");
        }
      }
    };

    let keyHudTimeout: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form inputs, textareas, contenteditable or selects
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      // Check for ArrowLeft or ArrowRight
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
        return;
      }

      // Find currently selected/highlighted row
      const selectedRow = document.querySelector<HTMLElement>(
        "tbody tr[data-row-clicked='true'], [role='row'][data-row-clicked='true'], .data-grid-row[data-row-clicked='true']"
      );
      if (!selectedRow || !isDataRow(selectedRow)) return;

      const table = selectedRow.closest("table, [role='grid'], .data-grid") as HTMLElement | null;
      if (!table) return;

      e.preventDefault();

      // Step: Normal 2px (fine-tuning), Alt key: 6px (faster step)
      const step = e.altKey ? 6 : 2;
      const delta = e.key === "ArrowRight" ? step : -step;

      // Current height calculation
      let currentHeight: number;
      if (selectedRow.dataset.customHeight) {
        currentHeight = parseInt(selectedRow.dataset.customHeight, 10);
      } else {
        currentHeight = Math.round(selectedRow.getBoundingClientRect().height);
      }

      const newHeight = Math.max(26, Math.min(350, currentHeight + delta));
      const isShift = e.shiftKey;

      if (isShift) {
        // Shift + Arrow: Apply to ALL sibling rows in this table
        const siblingRows = Array.from(
          table.querySelectorAll<HTMLElement>("tbody > tr, [role='row'], .data-grid-row")
        ).filter(isDataRow);

        siblingRows.forEach((r) => {
          r.style.height = `${newHeight}px`;
          r.style.minHeight = `${newHeight}px`;
          r.dataset.customHeight = String(newHeight);
          r.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
            td.style.height = `${newHeight}px`;
          });
        });

        sessionStorage.setItem("muavin_table_row_height", String(newHeight));
        window.dispatchEvent(new CustomEvent("muavin:row-height-change", { detail: { height: newHeight } }));

        if (hudBadge) {
          hudBadge.style.display = "flex";
          const rowRect = selectedRow.getBoundingClientRect();
          hudBadge.innerHTML = `
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-[#c6cdff] shadow-xs shadow-indigo-500/20 shrink-0">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/></svg>
              </div>
              <span class="text-[#c6cdff] font-mono text-sm font-black tracking-tight">↕ ${newHeight} px</span>
              <span class="text-[10px] bg-indigo-500/30 text-indigo-100 border border-indigo-400/40 px-2.5 py-0.5 rounded-full font-bold shadow-xs">Tüm Tablo (${siblingRows.length} Satır)</span>
            </div>
            <div class="text-[10px] text-slate-300/80 pl-8.5 font-medium">Klavye: ← / → ile boyutlandırın · Alt: Hızlı adım</div>
          `;
          hudBadge.style.left = `${Math.min(window.innerWidth - 240, Math.max(20, rowRect.right - 240))}px`;
          hudBadge.style.top = `${Math.max(16, Math.min(window.innerHeight - 70, rowRect.bottom + 8))}px`;
        }
      } else {
        // Single row resize
        selectedRow.style.height = `${newHeight}px`;
        selectedRow.style.minHeight = `${newHeight}px`;
        selectedRow.dataset.customHeight = String(newHeight);
        selectedRow.querySelectorAll<HTMLElement>("td, [role='gridcell']").forEach((td) => {
          td.style.height = `${newHeight}px`;
        });

        window.dispatchEvent(new CustomEvent("muavin:row-height-change", { detail: { height: newHeight, row: selectedRow } }));

        if (hudBadge) {
          hudBadge.style.display = "flex";
          const rowRect = selectedRow.getBoundingClientRect();
          hudBadge.innerHTML = `
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-[#c6cdff] shadow-xs shadow-indigo-500/20 shrink-0">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/></svg>
              </div>
              <span class="text-[#c6cdff] font-mono text-sm font-black tracking-tight">↕ ${newHeight} px</span>
              <span class="text-[10px] bg-slate-800/80 text-slate-200 border border-slate-700/80 px-2 py-0.5 rounded-full font-semibold">Seçili Satır</span>
            </div>
            <div class="text-[10px] text-slate-300/80 pl-8.5 font-medium">← / → Hassas boyutlandırma · Shift: Tüm Tablo</div>
          `;
          hudBadge.style.left = `${Math.min(window.innerWidth - 240, Math.max(20, rowRect.right - 240))}px`;
          hudBadge.style.top = `${Math.max(16, Math.min(window.innerHeight - 70, rowRect.bottom + 8))}px`;
        }
      }

      // Hide HUD badge after 1.8 seconds of inactivity
      if (keyHudTimeout) clearTimeout(keyHudTimeout);
      keyHudTimeout = setTimeout(() => {
        if (hudBadge && !isResizing) {
          hudBadge.style.display = "none";
        }
      }, 1800);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mousedown", handleMouseDown, { capture: true, passive: false });
    window.addEventListener("mouseup", handleMouseUp, { capture: true, passive: false });
    window.addEventListener("dblclick", handleDblClick, { capture: true, passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      observer.disconnect();
      if (keyHudTimeout) clearTimeout(keyHudTimeout);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("mouseup", handleMouseUp, { capture: true });
      window.removeEventListener("dblclick", handleDblClick, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);

      if (guideLine && guideLine.parentElement) guideLine.remove();
      if (hudBadge && hudBadge.parentElement) hudBadge.remove();
    };
  }, []);
}
