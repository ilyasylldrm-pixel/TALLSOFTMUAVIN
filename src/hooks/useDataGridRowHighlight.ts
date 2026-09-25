import { useEffect } from "react";

/**
 * useDataGridRowHighlight
 * 
 * Provides an institutional highlight animation for rows in data grids when clicked,
 * complete with keyboard navigation (ArrowUp / ArrowDown, Enter, Escape) and
 * double-click drill-down actions, using the periwinkle-wash color tone from the Haze design system.
 */
export function useDataGridRowHighlight() {
  useEffect(() => {
    const isDataRow = (row: HTMLElement | null): boolean => {
      if (!row) return false;
      if (row.closest("thead") || row.closest("tfoot")) return false;
      if (row.dataset.skipRowHighlight === "true" || row.dataset.noRowHighlight === "true") return false;

      // Skip empty state placeholder rows (e.g. single cell with colSpan > 1)
      const cells = row.querySelectorAll("td, [role='gridcell']");
      if (cells.length === 1 && (cells[0].hasAttribute("colspan") || (cells[0] as HTMLTableCellElement).colSpan > 1)) {
        return false;
      }

      // Skip expanded detail container rows (usually has a single cell spanning all columns)
      if (row.classList.contains("expanded-detail-row") || (cells.length === 1 && cells[0].querySelector(".space-y-4, .space-y-6"))) {
        return false;
      }
      return true;
    };

    const activateRow = (row: HTMLElement, table: HTMLElement | null) => {
      if (table) {
        // Clear highlight on other sibling rows in this grid
        const allRows = table.querySelectorAll("tbody > tr, [role='row'], .data-grid-row");
        allRows.forEach((r) => {
          if (r !== row && ((r as HTMLElement).dataset.rowClicked === "true" || r.classList.contains("row-clicked-highlight"))) {
            r.classList.remove("row-clicked-highlight");
            (r as HTMLElement).removeAttribute("data-row-clicked");
          }
        });
      }

      // Re-trigger the periwinkle-wash highlight animation
      row.classList.remove("row-clicked-highlight");
      // Force layout reflow so the CSS animation replays cleanly on repeated clicks
      void row.offsetWidth;
      row.classList.add("row-clicked-highlight");
      row.setAttribute("data-row-clicked", "true");
    };

    const handleRowClick = (event: MouseEvent) => {
      if (
        (window as any).__isResizingRow ||
        (window as any).__isResizingCol ||
        document.body.classList.contains("row-resizing-active") ||
        document.body.classList.contains("col-resizing-active")
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const row = target.closest("tbody tr, [role='row'], .data-grid-row") as HTMLElement | null;
      if (!isDataRow(row)) return;

      const table = row!.closest("table, [role='grid'], .data-grid") as HTMLElement | null;
      activateRow(row!, table);
    };

    const handleRowDblClick = (event: MouseEvent) => {
      if (
        (window as any).__isResizingRow ||
        (window as any).__isResizingCol ||
        document.body.classList.contains("row-resizing-active") ||
        document.body.classList.contains("col-resizing-active")
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const row = target.closest("tbody tr, [role='row'], .data-grid-row") as HTMLElement | null;
      if (!isDataRow(row)) return;

      // Find expand chevron button or primary action in the row and trigger it
      const actionBtn = row!.querySelector("button[aria-expanded], button[title*='Detay'], button[title*='Aç'], button[title*='İncele'], button.cursor-pointer") as HTMLElement | null;
      if (actionBtn && actionBtn !== target && !actionBtn.contains(target)) {
        actionBtn.click();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept when user is typing in an input, textarea, or select
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.tagName === "SELECT")) {
        return;
      }

      const activeRow = document.querySelector("tbody tr[data-row-clicked='true'], .data-grid-row[data-row-clicked='true']") as HTMLElement | null;
      if (!activeRow) return;

      const table = activeRow.closest("table, [role='grid'], .data-grid") as HTMLElement | null;
      if (!table) return;

      if (event.key === "Escape") {
        activeRow.classList.remove("row-clicked-highlight");
        activeRow.removeAttribute("data-row-clicked");
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const allRows = Array.from(table.querySelectorAll("tbody > tr, [role='row'], .data-grid-row")).filter((r) => isDataRow(r as HTMLElement)) as HTMLElement[];
        const currentIndex = allRows.indexOf(activeRow);
        if (currentIndex === -1) return;

        const nextIndex = event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < allRows.length) {
          const targetRow = allRows[nextIndex];
          activateRow(targetRow, table);
          targetRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      } else if (event.key === "Enter" || event.key === " ") {
        // Toggle detail expansion or trigger primary row action
        const actionBtn = activeRow.querySelector("button[aria-expanded], button[title*='Detay'], button[title*='Aç'], button[title*='İncele'], button.cursor-pointer") as HTMLElement | null;
        if (actionBtn) {
          event.preventDefault();
          actionBtn.click();
        }
      }
    };

    document.addEventListener("click", handleRowClick, { capture: true, passive: true });
    document.addEventListener("dblclick", handleRowDblClick, { capture: true, passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleRowClick, { capture: true });
      document.removeEventListener("dblclick", handleRowDblClick, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
