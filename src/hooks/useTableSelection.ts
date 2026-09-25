import { useState, useCallback, useMemo } from "react";

export interface TableSelectionHook {
  selectedIds: Set<string>;
  selectedIdArray: string[];
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (currentIds: string[]) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isAllSelected: (currentIds: string[]) => boolean;
  isIndeterminate: (currentIds: string[]) => boolean;
}

export function useTableSelection(): TableSelectionHook {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedCount = selectedIds.size;

  const selectedIdArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const toggleSelectAll = useCallback((currentIds: string[]) => {
    if (currentIds.length === 0) return;
    setSelectedIds((prev) => {
      const allSelected = currentIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        // Deselect current visible items
        currentIds.forEach((id) => next.delete(id));
      } else {
        // Select all current visible items
        currentIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const isAllSelected = useCallback(
    (currentIds: string[]) => {
      if (currentIds.length === 0) return false;
      return currentIds.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  const isIndeterminate = useCallback(
    (currentIds: string[]) => {
      if (currentIds.length === 0) return false;
      const selectedCountOnPage = currentIds.filter((id) => selectedIds.has(id)).length;
      return selectedCountOnPage > 0 && selectedCountOnPage < currentIds.length;
    },
    [selectedIds]
  );

  return {
    selectedIds,
    selectedIdArray,
    selectedCount,
    isSelected,
    toggleSelect,
    toggleSelectAll,
    selectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  };
}
