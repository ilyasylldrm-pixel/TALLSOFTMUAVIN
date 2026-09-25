import { useEffect, useCallback } from "react";
import { safeGetStorageItem, safeSetStorageItem, safeRemoveStorageItem } from "../utils/storage";

/**
 * useDataGridColumnResizing
 * 
 * Provides an interactive column-resizing feature across ALL listed data tables in the application.
 * Persists customized column widths permanently to localStorage so that user customizations
 * are remembered across browser reloads, tab navigation, and pagination.
 * 
 * Features:
 * - Direct Mouse Drag: Hover within 7px of any table column header's (th) right edge and drag left/right.
 * - Real-time Guide Line: Full-height vertical laser line tracking across the whole table.
 * - Floating HUD Badge: Displays active column label, exact pixel width (e.g. "↔ 185 px"), and helpful hints.
 * - Double-Click Reset: Double-clicking the resize handle restores that column's default width.
 * - Shift + Double-Click: Resets ALL column widths in that table to default.
 * - LocalStorage Persistence: Saved per-table and per-column under `muavin_col_widths_{tableKey}`.
 * - Zero Conflict: Disables sorting/navigation clicks during active resize drag.
 * - MutationObserver: Automatically applies stored column widths to dynamically mounted/filtered tables.
 */

export interface ColumnWidthsMap {
  [colKey: string]: number;
}

export interface UseDataGridColumnResizingOptions {
  tableKey?: string;
  minWidth?: number;
  maxWidth?: number;
}

// Simple deterministic hash for tables without an explicit ID
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Resolves a stable unique identifier for a table element.
 */
export function getTableKey(table: HTMLElement): string {
  if (table.dataset.tableKey) return table.dataset.tableKey;
  if (table.dataset.tableId) return table.dataset.tableId;
  if (table.id) return table.id;

  // Derive stable key from the header text contents
  const headerTexts = Array.from(table.querySelectorAll("thead th"))
    .map((th) => String((th as HTMLElement).innerText || (th as HTMLElement).textContent || "").trim())
    .filter(Boolean)
    .join("|");

  if (headerTexts) {
    return `tbl_${hashString(headerTexts)}`;
  }

  // Fallback to table position in page
  return "tbl_default";
}

/**
 * Resolves a stable identifier for a column header cell.
 */
export function getColumnKey(th: HTMLElement, index: number): string {
  if (th.dataset.colKey) return th.dataset.colKey;
  if (th.dataset.colId) return th.dataset.colId;
  if (th.id) return th.id;

  const rawText = String(th.innerText || th.textContent || "").trim();
  if (rawText) {
    // Clean and slugify Turkish and special characters
    const slug = rawText
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\u00C0-\u017F]/g, "")
      .toLowerCase();
    if (slug) return slug;
  }

  return `col_${index}`;
}

/**
 * Helper to get clean human-readable column label for HUD badge
 */
function getColumnLabel(th: HTMLElement, index: number): string {
  const text = String(th.innerText || th.textContent || "").trim();
  if (text) {
    // Return first clean line or shortened text
    const clean = text.split("\n")[0].trim();
    if (clean.length > 0) return clean;
  }
  return `Sütun ${index + 1}`;
}

/**
 * Loads stored column widths for a table from localStorage/sessionStorage
 */
export function getTableColumnWidths(tableKey: string): ColumnWidthsMap {
  try {
    const raw = safeGetStorageItem(`muavin_col_widths_${tableKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as ColumnWidthsMap;
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return {};
}

/**
 * Saves column widths for a table to localStorage/sessionStorage
 */
export function saveTableColumnWidths(tableKey: string, widths: ColumnWidthsMap) {
  try {
    const key = `muavin_col_widths_${tableKey}`;
    if (Object.keys(widths).length === 0) {
      safeRemoveStorageItem(key);
    } else {
      safeSetStorageItem(key, JSON.stringify(widths));
    }
    window.dispatchEvent(
      new CustomEvent("muavin:col-width-change", {
        detail: { tableKey, widths },
      })
    );
  } catch (e) {
    console.warn(`Failed to save column widths for table ${tableKey}:`, e);
  }
}

/**
 * Resets all custom column widths for a specific table or all tables
 */
export function resetTableColumnWidths(tableKey?: string) {
  if (tableKey) {
    safeRemoveStorageItem(`muavin_col_widths_${tableKey}`);
    // Also remove custom widths from currently mounted DOM table
    const table = document.querySelector<HTMLElement>(
      `table[data-table-key="${tableKey}"], table[data-table-id="${tableKey}"], table#${tableKey}`
    );
    if (table) {
      clearTableCustomWidths(table);
    }
  } else {
    // Clear all tables matching muavin_col_widths_
    const keysToRemove: string[] = [];
    if (typeof window !== "undefined" && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("muavin_col_widths_")) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => safeRemoveStorageItem(k));
    document.querySelectorAll<HTMLElement>("table").forEach((t) => clearTableCustomWidths(t));
  }

  window.dispatchEvent(new CustomEvent("muavin:col-width-change", { detail: { tableKey, reset: true } }));
}

function clearTableCustomWidths(table: HTMLElement) {
  const ths = table.querySelectorAll<HTMLElement>("thead th");
  ths.forEach((th) => {
    th.style.width = "";
    th.style.minWidth = "";
    th.style.maxWidth = "";
    delete th.dataset.customWidth;
  });

  const tds = table.querySelectorAll<HTMLElement>("tbody td, [role='gridcell']");
  tds.forEach((td) => {
    td.style.width = "";
    td.style.minWidth = "";
    td.style.maxWidth = "";
  });
}

/**
 * Applies a specific width to a column at `colIndex` across header and data rows
 */
export function applyColumnWidth(table: HTMLElement, colIndex: number, widthPx: number) {
  const theadThs = table.querySelectorAll<HTMLElement>("thead tr:first-child th");
  const th = theadThs[colIndex] as HTMLElement | undefined;
  if (th) {
    th.style.width = `${widthPx}px`;
    th.style.minWidth = `${widthPx}px`;
    th.style.maxWidth = `${widthPx}px`;
    th.dataset.customWidth = String(widthPx);
  }

  // Also apply to filter row headers if present
  const filterThs = table.querySelectorAll<HTMLElement>("thead tr:not(:first-child) th");
  if (filterThs.length > 0 && filterThs[colIndex]) {
    filterThs[colIndex].style.width = `${widthPx}px`;
    filterThs[colIndex].style.minWidth = `${widthPx}px`;
  }

  // Apply to data rows (skip colspan rows like empty states and detail rows)
  const rows = table.querySelectorAll<HTMLElement>("tbody > tr");
  rows.forEach((row) => {
    if (row.dataset.skipRowResize === "true") return;
    const cells = row.children;
    if (cells.length === 1 && (cells[0].hasAttribute("colspan") || (cells[0] as HTMLTableCellElement).colSpan > 1)) {
      return;
    }
    const td = cells[colIndex] as HTMLElement | undefined;
    if (td) {
      td.style.width = `${widthPx}px`;
      td.style.minWidth = `${widthPx}px`;
      td.style.maxWidth = `${widthPx}px`;
    }
  });
}

/**
 * Scans DOM tables and restores their saved column widths from localStorage
 */
export function applySavedColumnWidths(targetTable?: HTMLElement) {
  const tables = targetTable ? [targetTable] : Array.from(document.querySelectorAll<HTMLElement>("table"));

  tables.forEach((table) => {
    if (table.dataset.skipColResize === "true") return;

    const tableKey = getTableKey(table);
    const savedWidths = getTableColumnWidths(tableKey);

    if (!savedWidths || Object.keys(savedWidths).length === 0) return;

    const ths = Array.from(table.querySelectorAll<HTMLElement>("thead tr:first-child th"));
    ths.forEach((th, idx) => {
      const colKey = getColumnKey(th, idx);
      const width = savedWidths[colKey];
      if (typeof width === "number" && width >= 40 && width <= 1500) {
        applyColumnWidth(table, idx, width);
      }
    });
  });
}

/**
 * useDataGridColumnResizing Hook
 */
export function useDataGridColumnResizing(options?: UseDataGridColumnResizingOptions) {
  const minColWidth = options?.minWidth ?? 44;
  const maxColWidth = options?.maxWidth ?? 1200;

  useEffect(() => {
    let isResizing = false;
    let activeTh: HTMLElement | null = null;
    let activeTable: HTMLElement | null = null;
    let activeColIndex = -1;
    let activeTableKey = "";
    let activeColKey = "";
    let activeColLabel = "";
    let startX = 0;
    let startWidth = 0;
    let lastHoveredTh: HTMLElement | null = null;

    // Create or reuse HUD elements
    let guideLine = document.getElementById("col-resizing-guide-line") as HTMLDivElement | null;
    if (!guideLine) {
      guideLine = document.createElement("div");
      guideLine.id = "col-resizing-guide-line";
      guideLine.className = "col-resizing-guide-line";
      guideLine.style.display = "none";
      document.body.appendChild(guideLine);
    }

    let hudBadge = document.getElementById("col-resizing-hud-badge") as HTMLDivElement | null;
    if (!hudBadge) {
      hudBadge = document.createElement("div");
      hudBadge.id = "col-resizing-hud-badge";
      hudBadge.className = "col-resizing-hud-badge";
      hudBadge.style.display = "none";
      document.body.appendChild(hudBadge);
    }

    const showToast = (message: string) => {
      const existing = document.getElementById("col-resizing-toast");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.id = "col-resizing-toast";
      toast.className = "col-resizing-toast";
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (toast && toast.parentElement) toast.remove();
      }, 2400);
    };

    // Apply saved column widths on mount and when DOM mutates
    applySavedColumnWidths();

    const observer = new MutationObserver(() => {
      if (!isResizing) {
        applySavedColumnWidths();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Check if mouse is hovering within the right boundary (7px strip) of a column header
    const checkNearRightEdge = (e: MouseEvent, th: HTMLElement): boolean => {
      if (th.dataset.noColResize === "true") return false;
      const rect = th.getBoundingClientRect();
      // 8px trigger zone near the right border of the th cell
      return e.clientX >= rect.right - 7 && e.clientX <= rect.right + 4;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // If currently dragging to resize
      if (isResizing && activeTh && activeTable) {
        e.preventDefault();
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(minColWidth, Math.min(maxColWidth, Math.round(startWidth + deltaX)));

        // Live apply width to the active column
        applyColumnWidth(activeTable, activeColIndex, newWidth);

        // Update Guide Line position across the whole table
        if (guideLine) {
          const tableRect = activeTable.getBoundingClientRect();
          guideLine.style.display = "block";
          guideLine.style.left = `${e.clientX}px`;
          guideLine.style.top = `${tableRect.top}px`;
          guideLine.style.height = `${tableRect.height}px`;
        }

        // Update floating HUD Tooltip Badge
        if (hudBadge) {
          hudBadge.style.display = "flex";
          hudBadge.innerHTML = `
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-xl bg-purple-600/40 border border-purple-400/40 flex items-center justify-center text-[#d8b4fe] shadow-xs shadow-purple-500/20 shrink-0">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3-4 4 4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
              </div>
              <span class="text-[#f3e8ff] font-mono text-sm font-black tracking-tight">↔ ${newWidth} px</span>
              <span class="text-[10px] bg-purple-600/30 text-purple-100 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold shadow-xs truncate max-w-[130px]">${activeColLabel}</span>
            </div>
            <div class="text-[10px] text-slate-300/80 pl-8.5 font-medium">Genişliği ayarlamak için sürükleyin · Çift tık: Sıfırla</div>
          `;
          const badgeLeft = Math.min(window.innerWidth - 250, Math.max(16, e.clientX - 100));
          const badgeTop = Math.max(16, Math.min(window.innerHeight - 70, e.clientY - 60));
          hudBadge.style.left = `${badgeLeft}px`;
          hudBadge.style.top = `${badgeTop}px`;
        }

        return;
      }

      // Normal hover detection
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const th = target.closest("thead th, [role='columnheader']") as HTMLElement | null;
      if (th && th.closest("table")) {
        if (checkNearRightEdge(e, th)) {
          if (lastHoveredTh && lastHoveredTh !== th) {
            lastHoveredTh.classList.remove("col-resize-hover");
          }
          th.classList.add("col-resize-hover");
          document.body.style.cursor = "col-resize";
          lastHoveredTh = th;
        } else {
          if (th.classList.contains("col-resize-hover")) {
            th.classList.remove("col-resize-hover");
            document.body.style.cursor = "";
          }
          if (lastHoveredTh === th) {
            lastHoveredTh = null;
          }
        }
      } else if (lastHoveredTh) {
        lastHoveredTh.classList.remove("col-resize-hover");
        document.body.style.cursor = "";
        lastHoveredTh = null;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Left mouse button only
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const th = target.closest("thead th, [role='columnheader']") as HTMLElement | null;
      if (!th) return;

      const table = th.closest("table") as HTMLElement | null;
      if (!table || table.dataset.skipColResize === "true") return;

      if (checkNearRightEdge(e, th)) {
        e.preventDefault();
        e.stopPropagation();

        const parentRow = th.parentElement;
        const allThs = Array.from(parentRow?.children || []);
        const colIndex = allThs.indexOf(th);
        if (colIndex === -1) return;

        isResizing = true;
        activeTh = th;
        activeTable = table;
        activeColIndex = colIndex;
        activeTableKey = options?.tableKey || getTableKey(table);
        activeColKey = getColumnKey(th, colIndex);
        activeColLabel = getColumnLabel(th, colIndex);
        startX = e.clientX;
        startWidth = th.getBoundingClientRect().width;

        (window as any).__isResizingCol = true;
        document.body.classList.add("col-resizing-active");

        // Display Guide Line & HUD
        if (guideLine && activeTable) {
          const tableRect = activeTable.getBoundingClientRect();
          guideLine.style.display = "block";
          guideLine.style.left = `${e.clientX}px`;
          guideLine.style.top = `${tableRect.top}px`;
          guideLine.style.height = `${tableRect.height}px`;
        }

        if (hudBadge) {
          hudBadge.style.display = "flex";
          hudBadge.innerHTML = `
            <div class="flex items-center gap-2.5">
              <div class="w-6 h-6 rounded-xl bg-purple-600/40 border border-purple-400/40 flex items-center justify-center text-[#d8b4fe] shadow-xs shadow-purple-500/20 shrink-0">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3-4 4 4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
              </div>
              <span class="text-[#f3e8ff] font-mono text-sm font-black tracking-tight">↔ ${Math.round(startWidth)} px</span>
              <span class="text-[10px] bg-purple-600/30 text-purple-100 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold shadow-xs truncate max-w-[130px]">${activeColLabel}</span>
            </div>
            <div class="text-[10px] text-slate-300/80 pl-8.5 font-medium">Genişliği ayarlamak için sürükleyin · Çift tık: Sıfırla</div>
          `;
          hudBadge.style.left = `${Math.min(window.innerWidth - 250, Math.max(16, e.clientX - 100))}px`;
          hudBadge.style.top = `${Math.max(16, e.clientY - 60)}px`;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault();
        e.stopPropagation();

        isResizing = false;
        document.body.classList.remove("col-resizing-active");
        document.body.style.cursor = "";

        if (guideLine) guideLine.style.display = "none";
        if (hudBadge) hudBadge.style.display = "none";
        if (activeTh) activeTh.classList.remove("col-resize-hover");

        // Save customized width to localStorage
        if (activeTable && activeTh && activeTableKey && activeColKey) {
          const finalWidth = parseInt(activeTh.dataset.customWidth || "", 10);
          if (!isNaN(finalWidth) && finalWidth >= minColWidth && finalWidth <= maxColWidth) {
            const currentWidths = getTableColumnWidths(activeTableKey);
            currentWidths[activeColKey] = finalWidth;
            saveTableColumnWidths(activeTableKey, currentWidths);
            showToast(`"${activeColLabel}" sütun genişliği (${finalWidth}px) kaydedildi.`);
          }
        }

        activeTh = null;
        activeTable = null;
        activeColIndex = -1;
        activeTableKey = "";
        activeColKey = "";
        activeColLabel = "";

        // Keep __isResizingCol true briefly to prevent firing header sort click events
        setTimeout(() => {
          (window as any).__isResizingCol = false;
        }, 160);
      }
    };

    // Double-click on header boundary: reset column to default
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const th = target.closest("thead th, [role='columnheader']") as HTMLElement | null;
      if (!th) return;

      const table = th.closest("table") as HTMLElement | null;
      if (!table || table.dataset.skipColResize === "true") return;

      if (checkNearRightEdge(e, th)) {
        e.preventDefault();
        e.stopPropagation();

        const tableKey = options?.tableKey || getTableKey(table);
        const parentRow = th.parentElement;
        const allThs = Array.from(parentRow?.children || []);
        const colIndex = allThs.indexOf(th);
        const colLabel = getColumnLabel(th, colIndex);

        if (e.shiftKey) {
          // Reset ALL columns of this table
          resetTableColumnWidths(tableKey);
          showToast("Tablodaki tüm sütun genişlikleri varsayılana sıfırlandı.");
        } else {
          // Reset single column
          const colKey = getColumnKey(th, colIndex);
          const currentWidths = getTableColumnWidths(tableKey);
          delete currentWidths[colKey];
          saveTableColumnWidths(tableKey, currentWidths);

          // Clear inline width styling for this column
          th.style.width = "";
          th.style.minWidth = "";
          th.style.maxWidth = "";
          delete th.dataset.customWidth;

          // Clear for filter row and data cells
          const filterThs = table.querySelectorAll<HTMLElement>("thead tr:not(:first-child) th");
          if (filterThs[colIndex]) {
            filterThs[colIndex].style.width = "";
            filterThs[colIndex].style.minWidth = "";
          }

          const rows = table.querySelectorAll<HTMLElement>("tbody > tr");
          rows.forEach((row) => {
            const td = row.children[colIndex] as HTMLElement | undefined;
            if (td) {
              td.style.width = "";
              td.style.minWidth = "";
              td.style.maxWidth = "";
            }
          });

          showToast(`"${colLabel}" sütunu varsayılan genişliğe sıfırlandı.`);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mousedown", handleMouseDown, { capture: true, passive: false });
    window.addEventListener("mouseup", handleMouseUp, { capture: true, passive: false });
    window.addEventListener("dblclick", handleDblClick, { capture: true, passive: false });

    return () => {
      observer.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("mouseup", handleMouseUp, { capture: true });
      window.removeEventListener("dblclick", handleDblClick, { capture: true });

      if (guideLine && guideLine.parentElement) guideLine.remove();
      if (hudBadge && hudBadge.parentElement) hudBadge.remove();
    };
  }, [options?.tableKey, minColWidth, maxColWidth]);
}
