import { useState, useEffect, useCallback } from "react";

export type ViewMode = "list" | "create" | "edit" | "detail" | "preview" | "transfer" | "receipt";

export interface DetailNavigationOptions<T = unknown> {
  moduleKey: string;
  initialMode?: ViewMode;
  initialItem?: T | null;
}

export function useDetailNavigation<T = unknown>({
  moduleKey,
  initialMode = "list",
  initialItem = null,
}: DetailNavigationOptions<T>) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [activeItem, setActiveItem] = useState<T | null>(initialItem);

  // Transition to create view
  const openCreate = useCallback(() => {
    setActiveItem(null);
    setMode("create");
    window.history.pushState({ module: moduleKey, mode: "create" }, "", `#${moduleKey}/new`);
  }, [moduleKey]);

  // Transition to edit view
  const openEdit = useCallback(
    (item: T, id?: string) => {
      setActiveItem(item);
      setMode("edit");
      const urlHash = id ? `#${moduleKey}/edit/${id}` : `#${moduleKey}/edit`;
      window.history.pushState({ module: moduleKey, mode: "edit", id }, "", urlHash);
    },
    [moduleKey]
  );

  // Transition to detail view
  const openDetail = useCallback(
    (item: T, id?: string) => {
      setActiveItem(item);
      setMode("detail");
      const urlHash = id ? `#${moduleKey}/view/${id}` : `#${moduleKey}/view`;
      window.history.pushState({ module: moduleKey, mode: "detail", id }, "", urlHash);
    },
    [moduleKey]
  );

  // Transition to transfer view
  const openTransfer = useCallback(
    (item?: T | null, id?: string) => {
      if (item !== undefined) setActiveItem(item);
      setMode("transfer");
      const urlHash = id ? `#${moduleKey}/transfer/${id}` : `#${moduleKey}/transfer`;
      window.history.pushState({ module: moduleKey, mode: "transfer", id }, "", urlHash);
    },
    [moduleKey]
  );

  // Transition to receipt view
  const openReceipt = useCallback(
    (item?: T | null, id?: string) => {
      if (item !== undefined) setActiveItem(item);
      setMode("receipt");
      const urlHash = id ? `#${moduleKey}/receipt/${id}` : `#${moduleKey}/receipt`;
      window.history.pushState({ module: moduleKey, mode: "receipt", id }, "", urlHash);
    },
    [moduleKey]
  );

  // Close detail/create and return cleanly to list
  const backToList = useCallback(() => {
    setMode("list");
    setActiveItem(null);
    if (window.location.hash.startsWith(`#${moduleKey}`)) {
      window.history.pushState({ module: moduleKey, mode: "list" }, "", window.location.pathname + window.location.search);
    }
  }, [moduleKey]);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (!state || state.module !== moduleKey || state.mode === "list") {
        setMode("list");
        setActiveItem(null);
      } else if (state.mode && state.module === moduleKey) {
        setMode(state.mode as ViewMode);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [moduleKey]);

  // Keyboard shortcut: ESC to go back to list
  useEffect(() => {
    if (mode === "list") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
          return;
        }
        backToList();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, backToList]);

  return {
    mode,
    setMode,
    activeItem,
    setActiveItem,
    isDetailView: mode !== "list",
    openCreate,
    openEdit,
    openDetail,
    openTransfer,
    openReceipt,
    backToList,
  };
}
