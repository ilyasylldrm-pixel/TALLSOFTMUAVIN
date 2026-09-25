import { useState, useEffect, useCallback, useMemo } from "react";
import { safeGetStorageItem, safeSetStorageItem, safeRemoveStorageItem } from "../utils/storage";

export interface ColumnDef {
  id: string;
  label: string;
  defaultVisible?: boolean;
  alwaysVisible?: boolean; // Cannot be hidden (e.g. Actions or Main Identifier)
  lockVisible?: boolean; // Alias for alwaysVisible
}

export function useColumnVisibility(tableKey: string, initialColumns: ColumnDef[]) {
  const storageKey = `muavin_table_cols_${tableKey}`;

  // Initialize visibility state from localStorage/sessionStorage or defaultVisible
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = safeGetStorageItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          const result: Record<string, boolean> = {};
          initialColumns.forEach((col) => {
            if (col.alwaysVisible || col.lockVisible) {
              result[col.id] = true;
            } else if (typeof parsed[col.id] === "boolean") {
              result[col.id] = parsed[col.id];
            } else {
              result[col.id] = col.defaultVisible !== false;
            }
          });
          return result;
        }
      }
    } catch (e) {
      // Ignore parse or storage errors
    }

    // Default configuration
    const initial: Record<string, boolean> = {};
    initialColumns.forEach((col) => {
      initial[col.id] = col.defaultVisible !== false;
    });
    return initial;
  });

  // Save to storage whenever it changes (safely handles storage quota & fallbacks)
  useEffect(() => {
    try {
      safeSetStorageItem(storageKey, JSON.stringify(columnVisibility));
    } catch (_) {
      // Fallback silently if storage is completely unavailable
    }
  }, [columnVisibility, storageKey]);

  const isVisible = useCallback(
    (colId: string): boolean => {
      const col = initialColumns.find((c) => c.id === colId);
      if (col?.alwaysVisible || col?.lockVisible) return true;
      return columnVisibility[colId] ?? true;
    },
    [columnVisibility, initialColumns]
  );

  const toggleColumn = useCallback(
    (colId: string) => {
      const col = initialColumns.find((c) => c.id === colId);
      if (col?.alwaysVisible) return;

      setColumnVisibility((prev) => {
        const nextVal = !prev[colId];
        return {
          ...prev,
          [colId]: nextVal,
        };
      });
    },
    [initialColumns]
  );

  const setAllColumns = useCallback(
    (visible: boolean) => {
      setColumnVisibility((prev) => {
        const next: Record<string, boolean> = { ...prev };
        initialColumns.forEach((col) => {
          if (col.alwaysVisible) {
            next[col.id] = true;
          } else {
            next[col.id] = visible;
          }
        });
        return next;
      });
    },
    [initialColumns]
  );

  const resetToDefaults = useCallback(() => {
    const initial: Record<string, boolean> = {};
    initialColumns.forEach((col) => {
      initial[col.id] = col.defaultVisible !== false;
    });
    setColumnVisibility(initial);
    safeRemoveStorageItem(storageKey);
  }, [initialColumns, storageKey]);

  const hiddenCount = useMemo(() => {
    return initialColumns.filter((c) => !c.alwaysVisible && columnVisibility[c.id] === false).length;
  }, [columnVisibility, initialColumns]);

  return {
    columns: initialColumns,
    columnVisibility,
    isVisible,
    toggleColumn,
    setAllColumns,
    resetToDefaults,
    hiddenCount,
  };
}
