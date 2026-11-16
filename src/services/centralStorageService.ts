import { CENTRAL_SYNC_POLL_MS, resolveCentralUrl } from "../config/env";

/**
 * Centralized In-Memory + Remote API Repository Layer (`centralStorageService`).
 *
 * Replaces browser-scoped Web Storage APIs across the entire
 * application so that all computers and browsers read/write against a single
 * synchronized central backend (`/api/central-store/*` + Cloud Sync / Firestore).
 */

const COMPANY_SLICE_STORAGE_MAP: Record<string, string> = {
  settings: "muavin_company_settings",
  contacts: "muavin_contacts",
  accounts: "muavin_accounts",
  invoices: "muavin_invoices",
  transactions: "muavin_transactions",
  products: "muavin_products",
  quotes: "muavin_quotes",
  orders: "muavin_orders",
  waybills: "muavin_waybills",
  cheques: "muavin_cheques",
  promissoryNotes: "muavin_promissory_notes",
  branches: "muavin_branches",
  warehouses: "muavin_warehouses",
  employees: "muavin_employees",
  leaveRequests: "muavin_leave_requests",
  advanceRequests: "muavin_advance_requests",
  legalDeductions: "muavin_legal_deductions",
  costProjects: "muavin_cost_projects",
  assetCustodies: "muavin_asset_custodies",
  boms: "muavin_boms",
  workstations: "muavin_workstations",
  routings: "muavin_routings",
  workOrders: "muavin_work_orders",
  subcontractOrders: "muavin_subcontract_orders",
  autoServices: "muavin_auto_services",
  itServices: "muavin_it_services",
  applianceServices: "muavin_appliance_services",
  constructionProjects: "muavin_construction_projects",
  foodRecipes: "muavin_food_recipes",
  foodMenus: "muavin_food_menus",
  foodProductionOrders: "muavin_food_production_orders",
  foodDispatches: "muavin_food_dispatches",
  foodWitnessSamples: "muavin_food_samples",
  fixedAssets: "muavin_fixed_assets",
  assetMaintenances: "muavin_asset_maintenances",
  assetDisposals: "muavin_asset_disposals",
};

const TRANSIENT_RUNTIME_ONLY_KEYS = new Set<string>([
  "chunk_reload_lock",
  "hook_mismatch_reload_lock",
  "muavin_firestore_write_quota_exhausted_ts",
]);

class CentralStorageRepository {
  private store = new Map<string, string>();
  private pendingMutations = new Map<string, string | null>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private clientSessionId: string | null = null;
  private lastKnownVersion = 0;

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.clientSessionId) {
      headers["x-client-session-id"] = this.clientSessionId;
    }
    return headers;
  }

  private hydrateFromBootstrapPayload(payload: any, preservePending = true): boolean {
    if (!payload || typeof payload !== "object") return false;
    let mutated = false;

    if (typeof payload.sessionId === "string" && payload.sessionId) {
      this.clientSessionId = payload.sessionId;
    }
    if (typeof payload.version === "number" && payload.version > 0) {
      this.lastKnownVersion = payload.version;
    }

    const applyEntry = (key: string, val: string) => {
      if (preservePending && this.pendingMutations.has(key)) return;
      if (this.store.get(key) !== val) {
        this.store.set(key, val);
        mutated = true;
      }
    };

    if (Array.isArray(payload.deletedCompanyIds)) {
      applyEntry("muavin_deleted_companies_registry_v3", JSON.stringify(payload.deletedCompanyIds));
    }
    if (Array.isArray(payload.deletedUserKeys)) {
      applyEntry("muavin_deleted_users_registry_v3", JSON.stringify(payload.deletedUserKeys));
    }
    if (Array.isArray(payload.companiesRegistry) && payload.companiesRegistry.length > 0) {
      applyEntry("muavin_companies_seeded_v2", "1");
      applyEntry("muavin_companies_list", JSON.stringify(payload.companiesRegistry));
    }
    if (Array.isArray(payload.usersRegistry) && payload.usersRegistry.length > 0) {
      applyEntry("muavin_users_local_backup", JSON.stringify(payload.usersRegistry));
    }

    // Hydrate company data slices into canonical keys
    const companiesData = payload.companiesData || payload.allCompaniesData;
    if (companiesData && typeof companiesData === "object") {
      for (const [cid, rawEntry] of Object.entries<any>(companiesData)) {
        const sliceData = rawEntry?.data;
        if (!cid || !sliceData || typeof sliceData !== "object") continue;
        const isDefault = cid === "comp_default";

        for (const [sliceKey, storageBase] of Object.entries(COMPANY_SLICE_STORAGE_MAP)) {
          if (sliceData[sliceKey] !== undefined && sliceData[sliceKey] !== null) {
            const targetKey = isDefault ? storageBase : `${storageBase}_${cid}`;
            applyEntry(targetKey, JSON.stringify(sliceData[sliceKey]));
          }
        }

        if (Array.isArray(sliceData.ecommerceStores)) {
          applyEntry(`muavin_ecommerce_v2_${cid}_stores`, JSON.stringify(sliceData.ecommerceStores));
        }
        if (sliceData.deletedEcommerceStores && typeof sliceData.deletedEcommerceStores === "object") {
          applyEntry(
            `muavin_ecommerce_v2_${cid}_deleted_stores`,
            JSON.stringify(sliceData.deletedEcommerceStores)
          );
        }
        if (Array.isArray(sliceData.ecommerceOrders)) {
          applyEntry(`muavin_ecommerce_v2_${cid}_orders`, JSON.stringify(sliceData.ecommerceOrders));
        }
        if (sliceData.ecommerceMarkups && typeof sliceData.ecommerceMarkups === "object") {
          applyEntry(`muavin_ecommerce_v2_${cid}_markups`, JSON.stringify(sliceData.ecommerceMarkups));
        }
        if (rawEntry?.updatedAt) {
          applyEntry(`muavin_company_updated_at_${cid}`, String(rawEntry.updatedAt));
        }
      }
    }

    // Hydrate shared central KV entries (UI layout, theme, custom modules, feasibility, etc.)
    if (payload.centralKeyValueStore && typeof payload.centralKeyValueStore === "object") {
      for (const [key, val] of Object.entries(payload.centralKeyValueStore)) {
        if (typeof key === "string" && typeof val === "string") {
          applyEntry(key, val);
        }
      }
    }

    // Hydrate browser-scoped session user & active company
    if (payload.sessionData && typeof payload.sessionData === "object") {
      if (typeof payload.sessionData.activeUser === "string" && payload.sessionData.activeUser) {
        applyEntry("muavin_active_user", payload.sessionData.activeUser);
      }
      if (
        typeof payload.sessionData.activeCompanyId === "string" &&
        payload.sessionData.activeCompanyId
      ) {
        applyEntry("muavin_active_company_id", payload.sessionData.activeCompanyId);
      }
    }

    return mutated;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (typeof window === "undefined") {
        this.initialized = true;
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);
      try {
        const res = await fetch(resolveCentralUrl("api/central-store/bootstrap"), {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: this.buildHeaders(),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          this.hydrateFromBootstrapPayload(data, false);
        }
      } catch {
        // Continues cleanly in memory until central API reconnects
      } finally {
        clearTimeout(timeoutId);
      }

      this.setupLifecycleListeners();
      this.initialized = true;
    })();

    return this.initPromise;
  }

  private setupLifecycleListeners(): void {
    if (typeof window === "undefined") return;

    const flushOnHide = () => {
      if (document.visibilityState === "hidden") {
        void this.flush(true);
      } else if (document.visibilityState === "visible") {
        void this.pullRemoteUpdates();
      }
    };

    window.addEventListener("pagehide", () => {
      void this.flush(true);
    });
    document.addEventListener("visibilitychange", flushOnHide);

    if (!this.pollTimer) {
      this.pollTimer = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          void this.pullRemoteUpdates();
        }
      }, CENTRAL_SYNC_POLL_MS);
    }
  }

  public async pullRemoteUpdates(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    try {
      const res = await fetch(resolveCentralUrl("api/central-store/bootstrap"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: this.buildHeaders(),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const incomingVersion = Number(data?.version) || 0;
      const isNewer = incomingVersion > 0 && incomingVersion !== this.lastKnownVersion;
      const changed = this.hydrateFromBootstrapPayload(data, true);
      if (isNewer && changed) {
        window.dispatchEvent(
          new CustomEvent("muavin:central-sync-broadcast", {
            detail: { type: "central_kv_sync", version: incomingVersion },
          })
        );
      }
      return changed;
    } catch {
      return false;
    }
  }

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public setItem(key: string, value: string): boolean {
    const strVal = String(value);
    const prev = this.store.get(key);
    this.store.set(key, strVal);

    if (TRANSIENT_RUNTIME_ONLY_KEYS.has(key)) {
      return true;
    }

    if (prev !== strVal) {
      this.pendingMutations.set(key, strVal);
      if (key === "muavin_active_user" || key === "muavin_active_company_id") {
        void this.flush(true);
      } else {
        this.scheduleFlush();
      }
    }
    return true;
  }

  public removeItem(key: string): void {
    const existed = this.store.has(key);
    this.store.delete(key);

    if (TRANSIENT_RUNTIME_ONLY_KEYS.has(key)) {
      return;
    }

    if (existed || key === "muavin_active_user" || key === "muavin_active_company_id") {
      this.pendingMutations.set(key, null);
      if (key === "muavin_active_user" || key === "muavin_active_company_id") {
        void this.flush(true);
      } else {
        this.scheduleFlush();
      }
    }
  }

  public keys(): string[] {
    return Array.from(this.store.keys());
  }

  public getActiveUserRaw(): string | null {
    return this.store.get("muavin_active_user") ?? null;
  }

  public getActiveUser<T = any>(): T | null {
    const raw = this.getActiveUserRaw();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public setActiveUser(user: unknown | null): void {
    if (user === null || user === undefined) {
      this.removeItem("muavin_active_user");
      return;
    }
    const serialized = typeof user === "string" ? user : JSON.stringify(user);
    this.setItem("muavin_active_user", serialized);
  }

  private scheduleFlush(): void {
    if (typeof window === "undefined") return;
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush(false);
    }, 150);
  }

  public async flush(keepalive = false): Promise<void> {
    if (typeof window === "undefined" || this.pendingMutations.size === 0) return;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const entries: Record<string, string | null> = {};
    for (const [k, v] of this.pendingMutations.entries()) {
      entries[k] = v;
    }
    this.pendingMutations.clear();

    try {
      const res = await fetch(resolveCentralUrl("api/central-store/kv"), {
        method: "PUT",
        credentials: "include",
        keepalive,
        headers: this.buildHeaders(),
        body: JSON.stringify({ entries }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.sessionId) this.clientSessionId = json.sessionId;
        if (typeof json?.version === "number" && json.version > 0) {
          this.lastKnownVersion = json.version;
        }
      }
    } catch {
      // Re-queue unsent entries if network was momentarily unavailable
      for (const [k, v] of Object.entries(entries)) {
        if (!this.pendingMutations.has(k)) {
          this.pendingMutations.set(k, v);
        }
      }
    }
  }
}

export const centralStorageService = new CentralStorageRepository();
