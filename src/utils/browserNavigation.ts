// Tarayıcı Geri / İleri (History API - popstate / pushState) Senkronizasyon Yöneticisi

export interface MuavinHistoryState {
  muavinNav: true;
  stepIndex: number;
  tab: string;
  financeSubTab?: string;
  selectedConstructionProjectId?: string | null;
  isQuickAddOpen?: boolean;
  activeCompanyId?: string;
  detailStack?: string[];
  subTabMap?: Record<string, string>;
}

type NavSyncSnapshot = {
  canGoBack: boolean;
  canGoForward: boolean;
  stepIndex: number;
  maxStepIndex: number;
};

let currentStepIndex = 0;
let maxStepIndex = 0;
let isHandlingPopState = false;

const detailBackHandlers = new Map<string, () => void>();
const closedByPopStateIds = new Set<string>();
const navSubscribers = new Set<(snap: NavSyncSnapshot) => void>();

function notifyNavSubscribers() {
  const snap: NavSyncSnapshot = {
    canGoBack: currentStepIndex > 0 || detailBackHandlers.size > 0,
    canGoForward: currentStepIndex < maxStepIndex,
    stepIndex: currentStepIndex,
    maxStepIndex,
  };
  navSubscribers.forEach((cb) => {
    try {
      cb(snap);
    } catch {
      // ignore listener errors
    }
  });
}

export function getBrowserNavSnapshot(): NavSyncSnapshot {
  return {
    canGoBack: currentStepIndex > 0 || detailBackHandlers.size > 0,
    canGoForward: currentStepIndex < maxStepIndex,
    stepIndex: currentStepIndex,
    maxStepIndex,
  };
}

export function subscribeBrowserNav(cb: (snap: NavSyncSnapshot) => void): () => void {
  navSubscribers.add(cb);
  cb(getBrowserNavSnapshot());
  return () => {
    navSubscribers.delete(cb);
  };
}

export function isPopStateInProgress(): boolean {
  return isHandlingPopState;
}

export function setPopStateInProgress(val: boolean): void {
  isHandlingPopState = val;
}

export function getCurrentHistoryState(): MuavinHistoryState | null {
  if (typeof window === "undefined") return null;
  const st = window.history.state;
  if (st && typeof st === "object" && st.muavinNav) {
    return st as MuavinHistoryState;
  }
  return null;
}

export function buildHashForState(tab: string, financeSubTab?: string): string {
  if (!tab) return "#dashboard";
  if (tab === "accounts" && financeSubTab) {
    return `#accounts/${financeSubTab}`;
  }
  return `#${tab}`;
}

export function parseInitialHashTab(): { tab?: string; financeSubTab?: string } {
  if (typeof window === "undefined") return {};
  const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
  if (!rawHash) return {};
  const parts = rawHash.split("/");
  const tab = parts[0]?.trim();
  const financeSubTab = parts[1]?.trim();
  return {
    tab: tab || undefined,
    financeSubTab: financeSubTab || undefined,
  };
}

export function initBrowserHistoryState(initial: Omit<MuavinHistoryState, "muavinNav" | "stepIndex">) {
  if (typeof window === "undefined") return;
  const existing = getCurrentHistoryState();
  if (existing) {
    currentStepIndex = typeof existing.stepIndex === "number" ? existing.stepIndex : 0;
    if (currentStepIndex > maxStepIndex) {
      maxStepIndex = currentStepIndex;
    }
    notifyNavSubscribers();
    return;
  }

  const state: MuavinHistoryState = {
    muavinNav: true,
    stepIndex: 0,
    ...initial,
    detailStack: initial.detailStack || [],
    subTabMap: initial.subTabMap || {},
  };
  currentStepIndex = 0;
  maxStepIndex = 0;
  try {
    window.history.replaceState(state, "", buildHashForState(state.tab, state.financeSubTab));
  } catch {
    // ignore history replace errors in restricted environments
  }
  notifyNavSubscribers();
}

export function pushBrowserHistoryState(
  next: Omit<MuavinHistoryState, "muavinNav" | "stepIndex">
): void {
  if (typeof window === "undefined" || isHandlingPopState) return;

  const current = getCurrentHistoryState();
  const nextDetailStack = next.detailStack ?? [];
  const currentDetailStack = current?.detailStack ?? [];
  const nextSubTabMap = next.subTabMap ?? current?.subTabMap ?? {};

  // Avoid pushing duplicate consecutive state
  if (
    current &&
    current.tab === next.tab &&
    current.financeSubTab === next.financeSubTab &&
    current.selectedConstructionProjectId === next.selectedConstructionProjectId &&
    Boolean(current.isQuickAddOpen) === Boolean(next.isQuickAddOpen) &&
    current.activeCompanyId === next.activeCompanyId &&
    JSON.stringify(currentDetailStack) === JSON.stringify(nextDetailStack) &&
    JSON.stringify(current.subTabMap || {}) === JSON.stringify(nextSubTabMap)
  ) {
    return;
  }

  currentStepIndex += 1;
  maxStepIndex = currentStepIndex;

  const stateToPush: MuavinHistoryState = {
    muavinNav: true,
    stepIndex: currentStepIndex,
    tab: next.tab,
    financeSubTab: next.financeSubTab,
    selectedConstructionProjectId: next.selectedConstructionProjectId,
    isQuickAddOpen: next.isQuickAddOpen,
    activeCompanyId: next.activeCompanyId,
    detailStack: nextDetailStack,
    subTabMap: nextSubTabMap,
  };

  try {
    window.history.pushState(
      stateToPush,
      "",
      buildHashForState(stateToPush.tab, stateToPush.financeSubTab)
    );
  } catch {
    // ignore pushState errors
  }
  notifyNavSubscribers();
}

export function pushSubTabHistoryState(moduleKey: string, subTabValue: string): void {
  if (typeof window === "undefined" || isHandlingPopState) return;
  const current = getCurrentHistoryState();
  if (!current) return;
  const existingSubTab = current.subTabMap?.[moduleKey];
  if (existingSubTab === subTabValue) return;

  pushBrowserHistoryState({
    tab: current.tab,
    financeSubTab: current.financeSubTab,
    selectedConstructionProjectId: current.selectedConstructionProjectId,
    isQuickAddOpen: current.isQuickAddOpen,
    activeCompanyId: current.activeCompanyId,
    detailStack: current.detailStack || [],
    subTabMap: {
      ...(current.subTabMap || {}),
      [moduleKey]: subTabValue,
    },
  });
}

export function registerDetailHistoryEntry(detailId: string, onBack: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  detailBackHandlers.set(detailId, onBack);

  const current = getCurrentHistoryState();
  if (!isHandlingPopState && current) {
    const stack = Array.isArray(current.detailStack) ? [...current.detailStack] : [];
    if (!stack.includes(detailId)) {
      stack.push(detailId);
      currentStepIndex += 1;
      maxStepIndex = currentStepIndex;
      const nextState: MuavinHistoryState = {
        ...current,
        muavinNav: true,
        stepIndex: currentStepIndex,
        detailStack: stack,
      };
      try {
        window.history.pushState(
          nextState,
          "",
          buildHashForState(nextState.tab, nextState.financeSubTab)
        );
      } catch {
        // ignore
      }
    }
  }

  notifyNavSubscribers();

  return () => {
    detailBackHandlers.delete(detailId);
    const wasClosedByPopState = closedByPopStateIds.has(detailId);
    closedByPopStateIds.delete(detailId);

    // If unmounted directly by in-app button (not browser Back/Forward), clean detailId from current state
    if (!wasClosedByPopState && !isHandlingPopState) {
      const latest = getCurrentHistoryState();
      if (latest && Array.isArray(latest.detailStack) && latest.detailStack.includes(detailId)) {
        const cleanedStack = latest.detailStack.filter((id) => id !== detailId);
        const updatedState: MuavinHistoryState = {
          ...latest,
          detailStack: cleanedStack,
        };
        try {
          window.history.replaceState(
            updatedState,
            "",
            buildHashForState(updatedState.tab, updatedState.financeSubTab)
          );
        } catch {
          // ignore
        }
      }
    }
    notifyNavSubscribers();
  };
}

export function triggerDetailBack(detailId: string, fallbackOnBack: () => void): void {
  if (typeof window !== "undefined") {
    const latest = getCurrentHistoryState();
    if (
      latest &&
      Array.isArray(latest.detailStack) &&
      latest.detailStack.includes(detailId) &&
      currentStepIndex > 0
    ) {
      window.history.back();
      return;
    }
  }
  fallbackOnBack();
}

export function updateDetailBackHandler(detailId: string, onBack: () => void): void {
  if (detailBackHandlers.has(detailId)) {
    detailBackHandlers.set(detailId, onBack);
  }
}

export function reconcileDetailStackOnPopState(incomingState: MuavinHistoryState | null): boolean {
  const targetStack = new Set(incomingState?.detailStack || []);
  let closedAnyDetail = false;

  // Iterate in reverse (LIFO) to close any open DetailPageLayout not in the popped history state
  const entries = Array.from(detailBackHandlers.entries()).reverse();
  for (const [detailId, handler] of entries) {
    if (!targetStack.has(detailId)) {
      closedByPopStateIds.add(detailId);
      detailBackHandlers.delete(detailId);
      closedAnyDetail = true;
      try {
        handler();
      } catch (err) {
        console.warn("Detail back handler error on popstate:", err);
      }
    }
  }

  if (incomingState && typeof incomingState.stepIndex === "number") {
    currentStepIndex = incomingState.stepIndex;
    if (currentStepIndex > maxStepIndex) {
      maxStepIndex = currentStepIndex;
    }
  }

  notifyNavSubscribers();
  return closedAnyDetail;
}

export function navigateBrowserBack(): void {
  if (typeof window === "undefined") return;
  window.history.back();
}

export function navigateBrowserForward(): void {
  if (typeof window === "undefined") return;
  window.history.forward();
}

export function initBrowserHistory(
  initial: Omit<MuavinHistoryState, "muavinNav" | "stepIndex">
): MuavinHistoryState {
  const hashParsed = parseInitialHashTab();
  const existing = getCurrentHistoryState();
  const mergedInitial: Omit<MuavinHistoryState, "muavinNav" | "stepIndex"> = {
    ...initial,
    tab: existing?.tab || hashParsed.tab || initial.tab,
    financeSubTab: existing?.financeSubTab || hashParsed.financeSubTab || initial.financeSubTab,
    selectedConstructionProjectId:
      existing?.selectedConstructionProjectId !== undefined
        ? existing.selectedConstructionProjectId
        : initial.selectedConstructionProjectId,
    activeCompanyId: existing?.activeCompanyId || initial.activeCompanyId,
    isQuickAddOpen: existing?.isQuickAddOpen ?? initial.isQuickAddOpen,
  };
  initBrowserHistoryState(mergedInitial);
  return (
    getCurrentHistoryState() || {
      muavinNav: true,
      stepIndex: 0,
      ...mergedInitial,
    }
  );
}

export function pushAppNavigationState(
  next: Omit<MuavinHistoryState, "muavinNav" | "stepIndex">
): void {
  pushBrowserHistoryState(next);
}

export function onBrowserPopState(
  callback: (state: MuavinHistoryState) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handlePopState = (event: PopStateEvent) => {
    setPopStateInProgress(true);
    try {
      const incoming =
        event.state && typeof event.state === "object" && event.state.muavinNav
          ? (event.state as MuavinHistoryState)
          : null;

      reconcileDetailStackOnPopState(incoming);

      if (incoming) {
        callback(incoming);
      } else {
        const hashParsed = parseInitialHashTab();
        if (hashParsed.tab) {
          callback({
            muavinNav: true,
            stepIndex: 0,
            tab: hashParsed.tab,
            financeSubTab: hashParsed.financeSubTab,
          });
        }
      }
    } finally {
      setTimeout(() => {
        setPopStateInProgress(false);
        notifyNavSubscribers();
      }, 50);
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}

