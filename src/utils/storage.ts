import { Contact, Invoice, Account, Transaction, Product, Quote, Order, Waybill, CompanySettings, Cheque, PromissoryNote, Branch, Warehouse, Employee, LeaveRequest, AdvanceRequest, LegalDeduction, CostProject, AssetCustody, BillOfMaterials, Workstation, Routing, WorkOrder, SubcontractOrder, AutoServiceRecord, ItServiceRecord, ApplianceServiceRecord, IndustrySector, FoodRecipe, FoodMenuPlan, FoodProductionOrder, FoodDispatchDelivery, FoodWitnessSample, ConstructionProject, getContactAccountCode, FixedAsset, AssetMaintenanceRecord, AssetDisposalRecord } from "../types";
import {
  initialCompanySettings,
  initialContacts,
  initialAccounts,
  initialInvoices,
  initialTransactions,
  initialProducts,
  initialQuotes,
  initialOrders,
  initialWaybills,
  initialCheques,
  initialPromissoryNotes,
  initialBranches,
  initialWarehouses,
  initialEmployees,
  initialLeaveRequests,
  initialAdvanceRequests,
  initialLegalDeductions,
  initialCostProjects,
  initialAssetCustodies,
  initialBillOfMaterials,
  initialWorkstations,
  initialRoutings,
  initialWorkOrders,
  initialSubcontractOrders,
  initialAutoServices,
  initialItServices,
  initialApplianceServices,
} from "../mockData";
import {
  initialSectors,
  initialFoodRecipes,
  initialFoodMenus,
  initialFoodProductionOrders,
  initialFoodDispatches,
  initialFoodWitnessSamples,
} from "../data/productionSectorData";
import { initialConstructionProjects } from "../data/constructionCostingData";
import {
  INITIAL_FIXED_ASSETS,
  INITIAL_ASSET_MAINTENANCES,
  INITIAL_ASSET_DISPOSALS,
} from "../data/fixedAssetsData";

const STORAGE_KEYS = {
  SETTINGS: "muavin_company_settings",
  CONTACTS: "muavin_contacts",
  ACCOUNTS: "muavin_accounts",
  INVOICES: "muavin_invoices",
  TRANSACTIONS: "muavin_transactions",
  PRODUCTS: "muavin_products",
  QUOTES: "muavin_quotes",
  ORDERS: "muavin_orders",
  WAYBILLS: "muavin_waybills",
  CHEQUES: "muavin_cheques",
  PROMISSORY_NOTES: "muavin_promissory_notes",
  BRANCHES: "muavin_branches",
  WAREHOUSES: "muavin_warehouses",
  EMPLOYEES: "muavin_employees",
  LEAVE_REQUESTS: "muavin_leave_requests",
  ADVANCE_REQUESTS: "muavin_advance_requests",
  LEGAL_DEDUCTIONS: "muavin_legal_deductions",
  COST_PROJECTS: "muavin_cost_projects",
  ASSET_CUSTODIES: "muavin_asset_custodies",
  EDOCUMENTS: "muavin_e_documents",
  BOMS: "muavin_boms",
  WORKSTATIONS: "muavin_workstations",
  ROUTINGS: "muavin_routings",
  WORK_ORDERS: "muavin_work_orders",
  SUBCONTRACT_ORDERS: "muavin_subcontract_orders",
  AUTO_SERVICES: "muavin_auto_services",
  IT_SERVICES: "muavin_it_services",
  APPLIANCE_SERVICES: "muavin_appliance_services",
  CONSTRUCTION_PROJECTS: "muavin_construction_projects",
  SECTORS: "muavin_production_sectors",
  ACTIVE_SECTOR: "muavin_active_production_sector",
  FOOD_RECIPES: "muavin_food_recipes",
  FOOD_MENUS: "muavin_food_menus",
  FOOD_PRODUCTION_ORDERS: "muavin_food_production_orders",
  FOOD_DISPATCHES: "muavin_food_dispatches",
  FOOD_SAMPLES: "muavin_food_samples",
  FIXED_ASSETS: "muavin_fixed_assets",
  ASSET_MAINTENANCES: "muavin_asset_maintenances",
  ASSET_DISPOSALS: "muavin_asset_disposals",
};

export function cleanupOversizedStorage(aggressive = false) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    const len = window.localStorage.length;
    for (let i = 0; i < len; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      // 1. Purge massive fonts (3-5MB alone) that exceed quota
      if (key.startsWith("muavin_font_") || key.startsWith("muavin_pdf_")) {
        keysToRemove.push(key);
      }
      // 2. Purge TrAdres address caches (districts, quarters, provinces) which take megabytes
      else if (key.startsWith("muavinn_tradres_") || key.startsWith("muavin_tradres_")) {
        keysToRemove.push(key);
      }
      // 3. Purge oversized branding cache if exceeding reasonable size
      else if (key === "muavin_cloud_branding") {
        try {
          const branding = window.localStorage.getItem("muavin_cloud_branding");
          if (branding && branding.length > 50000) {
            keysToRemove.push(key);
          }
        } catch (_) {}
      }
      // 4. In aggressive mode (e.g. after a QuotaExceeded error), also purge older temporary/non-critical caches
      else if (aggressive) {
        if (key.startsWith("muavin_col_widths_") || key.startsWith("muavin_table_row_height")) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch (_) {}
    });

    try {
      window.sessionStorage?.removeItem("muavin_font_roboto_reg_v2");
      window.sessionStorage?.removeItem("muavin_font_roboto_bold_v2");
    } catch (_) {}
  } catch (e) {
    console.warn("Storage cleanup error:", e);
  }
}

// Immediately run cleanup when module loads
if (typeof window !== "undefined") {
  cleanupOversizedStorage();
}

/**
 * Safely sets an item in localStorage, falling back to sessionStorage if quota is exceeded
 * or cleaning oversized transient keys automatically.
 */
export function safeSetStorageItem(key: string, valueString: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage?.setItem(key, valueString);
    return true;
  } catch (e) {
    console.warn(`Storage quota exceeded setting ${key}, cleaning non-critical cache:`, e);
    cleanupOversizedStorage(true);
    try {
      window.localStorage?.setItem(key, valueString);
      return true;
    } catch (_retryErr) {
      try {
        window.sessionStorage?.setItem(key, valueString);
        return true;
      } catch (_) {
        return false;
      }
    }
  }
}

/**
 * Safely gets an item checking localStorage first, then sessionStorage
 */
export function safeGetStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage?.getItem(key) ?? window.sessionStorage?.getItem(key) ?? null;
  } catch (_) {
    return null;
  }
}

/**
 * Safely removes an item from both localStorage and sessionStorage
 */
export function safeRemoveStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.removeItem(key);
    window.sessionStorage?.removeItem(key);
  } catch (_) {}
}

const safeSet = (key: string, val: any) => {
  safeSetStorageItem(key, JSON.stringify(val));
};

export function getStoredData() {
  cleanupOversizedStorage();
  const get = <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key) || sessionStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error loading ${key} from storage`, e);
      return fallback;
    }
  };

  const storedInvoices = get<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
  const storedProducts = get<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
  const storedCheques = get<Cheque[]>(STORAGE_KEYS.CHEQUES, initialCheques);
  const storedNotes = get<PromissoryNote[]>(STORAGE_KEYS.PROMISSORY_NOTES, initialPromissoryNotes);
  const loadedContacts = get<Contact[]>(STORAGE_KEYS.CONTACTS, initialContacts);
  const loadedTransactions = get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);

  const normalizedContacts = syncContactBalances(
    loadedContacts,
    storedInvoices,
    loadedTransactions,
    storedCheques,
    storedNotes
  );

  return {
    settings: get<CompanySettings>(STORAGE_KEYS.SETTINGS, initialCompanySettings),
    contacts: normalizedContacts,
    accounts: get<Account[]>(STORAGE_KEYS.ACCOUNTS, initialAccounts),
    invoices: storedInvoices,
    transactions: loadedTransactions,
    products: storedProducts,
    quotes: get<Quote[]>(STORAGE_KEYS.QUOTES, initialQuotes),
    orders: get<Order[]>(STORAGE_KEYS.ORDERS, initialOrders),
    waybills: get<Waybill[]>(STORAGE_KEYS.WAYBILLS, initialWaybills),
    cheques: storedCheques,
    promissoryNotes: storedNotes,
    branches: get<Branch[]>(STORAGE_KEYS.BRANCHES, initialBranches),
    warehouses: get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, initialWarehouses),
    employees: get<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees),
    leaveRequests: get<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests),
    advanceRequests: get<AdvanceRequest[]>(STORAGE_KEYS.ADVANCE_REQUESTS, initialAdvanceRequests),
    legalDeductions: get<LegalDeduction[]>(STORAGE_KEYS.LEGAL_DEDUCTIONS, initialLegalDeductions),
    costProjects: (() => {
      const stored = get<CostProject[]>(STORAGE_KEYS.COST_PROJECTS, initialCostProjects);
      const cleaned = (stored || initialCostProjects || []).map((p) => ({
        ...p,
        costItems: [],
      }));
      safeSet(STORAGE_KEYS.COST_PROJECTS, cleaned);
      return cleaned;
    })(),
    assetCustodies: get<AssetCustody[]>(STORAGE_KEYS.ASSET_CUSTODIES, initialAssetCustodies),
    boms: get<BillOfMaterials[]>(STORAGE_KEYS.BOMS, initialBillOfMaterials),
    workstations: get<Workstation[]>(STORAGE_KEYS.WORKSTATIONS, initialWorkstations),
    routings: get<Routing[]>(STORAGE_KEYS.ROUTINGS, initialRoutings),
    workOrders: get<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, initialWorkOrders),
    subcontractOrders: get<SubcontractOrder[]>(STORAGE_KEYS.SUBCONTRACT_ORDERS, initialSubcontractOrders),
    autoServices: get<AutoServiceRecord[]>(STORAGE_KEYS.AUTO_SERVICES, initialAutoServices),
    itServices: get<ItServiceRecord[]>(STORAGE_KEYS.IT_SERVICES, initialItServices),
    applianceServices: get<ApplianceServiceRecord[]>(STORAGE_KEYS.APPLIANCE_SERVICES, initialApplianceServices),
    constructionProjects: get<ConstructionProject[]>(STORAGE_KEYS.CONSTRUCTION_PROJECTS, initialConstructionProjects),
    sectors: get<IndustrySector[]>(STORAGE_KEYS.SECTORS, initialSectors),
    activeSectorId: get<string>(STORAGE_KEYS.ACTIVE_SECTOR, "catering"),
    foodRecipes: (() => {
      const stored = get<FoodRecipe[]>(STORAGE_KEYS.FOOD_RECIPES, initialFoodRecipes);
      const isMissingAnyInitial = Array.isArray(stored) && initialFoodRecipes.some(init => !stored.some(s => s.id === init.id));
      if (!Array.isArray(stored) || stored.length < initialFoodRecipes.length || isMissingAnyInitial || !stored.some(r => r.laborCostPerPortion !== undefined)) {
        const storedMap = new Map((stored || []).map((r) => [r.id, r]));
        const merged = initialFoodRecipes.map((initR) => {
          const userR = storedMap.get(initR.id);
          if (!userR) return initR;
          return {
            ...initR,
            ...userR,
            laborCostPerPortion: userR.laborCostPerPortion ?? initR.laborCostPerPortion,
            gasEnergyCostPerPortion: userR.gasEnergyCostPerPortion ?? initR.gasEnergyCostPerPortion,
            overheadCostPerPortion: userR.overheadCostPerPortion ?? initR.overheadCostPerPortion,
          };
        });
        (stored || []).forEach((r) => {
          if (!initialFoodRecipes.some((init) => init.id === r.id)) {
            merged.push(r);
          }
        });
        safeSet(STORAGE_KEYS.FOOD_RECIPES, merged);
        return merged;
      }
      return stored;
    })(),
    foodMenus: get<FoodMenuPlan[]>(STORAGE_KEYS.FOOD_MENUS, initialFoodMenus),
    foodProductionOrders: get<FoodProductionOrder[]>(STORAGE_KEYS.FOOD_PRODUCTION_ORDERS, initialFoodProductionOrders),
    foodDispatches: get<FoodDispatchDelivery[]>(STORAGE_KEYS.FOOD_DISPATCHES, initialFoodDispatches),
    foodWitnessSamples: get<FoodWitnessSample[]>(STORAGE_KEYS.FOOD_SAMPLES, initialFoodWitnessSamples),
    fixedAssets: get<FixedAsset[]>(STORAGE_KEYS.FIXED_ASSETS, INITIAL_FIXED_ASSETS),
    assetMaintenances: get<AssetMaintenanceRecord[]>(STORAGE_KEYS.ASSET_MAINTENANCES, INITIAL_ASSET_MAINTENANCES),
    assetDisposals: get<AssetDisposalRecord[]>(STORAGE_KEYS.ASSET_DISPOSALS, INITIAL_ASSET_DISPOSALS),
  };
}

export function syncContactBalances(
  contacts: Contact[],
  invoices: Invoice[],
  transactions: Transaction[],
  cheques?: Cheque[],
  promissoryNotes?: PromissoryNote[]
): Contact[] {
  const contactBalanceMap: Record<string, number> = {};

  invoices.forEach((inv) => {
    if (!inv.contactId) return;
    const current = contactBalanceMap[inv.contactId] || 0;
    if (inv.type === "sales") {
      contactBalanceMap[inv.contactId] = current + inv.grandTotal;
    } else {
      contactBalanceMap[inv.contactId] = current - inv.grandTotal;
    }
  });

  transactions.forEach((tx) => {
    if (!tx.contactId) return;
    const current = contactBalanceMap[tx.contactId] || 0;
    if (tx.type === "income" || tx.type === "collection") {
      contactBalanceMap[tx.contactId] = current - tx.amount;
    } else if (tx.type === "expense" || tx.type === "payment") {
      contactBalanceMap[tx.contactId] = current + tx.amount;
    }
  });

  if (cheques) {
    cheques.forEach((chq) => {
      if (!chq.contactId) return;
      const current = contactBalanceMap[chq.contactId] || 0;
      if (chq.type === "received") {
        contactBalanceMap[chq.contactId] = current - chq.amount;
      } else {
        contactBalanceMap[chq.contactId] = current + chq.amount;
      }
    });
  }

  if (promissoryNotes) {
    promissoryNotes.forEach((note) => {
      if (!note.contactId) return;
      const current = contactBalanceMap[note.contactId] || 0;
      if (note.type === "received") {
        contactBalanceMap[note.contactId] = current - note.amount;
      } else {
        contactBalanceMap[note.contactId] = current + note.amount;
      }
    });
  }

  return contacts.map((c) => {
    const calcBal = contactBalanceMap[c.id] ?? c.balance ?? 0;
    return {
      ...c,
      accountCode: getContactAccountCode(c),
      balance: calcBal,
      balanceType: calcBal > 0 ? ("receivable" as const) : calcBal < 0 ? ("payable" as const) : ("balanced" as const),
    };
  });
}

export function saveStoredData(key: keyof typeof STORAGE_KEYS, data: any) {
  safeSetStorageItem(STORAGE_KEYS[key], JSON.stringify(data));
}

export function resetToDemoData() {
  safeSet(STORAGE_KEYS.SETTINGS, initialCompanySettings);
  safeSet(STORAGE_KEYS.CONTACTS, initialContacts);
  safeSet(STORAGE_KEYS.ACCOUNTS, initialAccounts);
  safeSet(STORAGE_KEYS.INVOICES, initialInvoices);
  safeSet(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
  safeSet(STORAGE_KEYS.PRODUCTS, initialProducts);
  safeSet(STORAGE_KEYS.QUOTES, initialQuotes);
  safeSet(STORAGE_KEYS.ORDERS, initialOrders);
  safeSet(STORAGE_KEYS.WAYBILLS, initialWaybills);
  safeSet(STORAGE_KEYS.CHEQUES, initialCheques);
  safeSet(STORAGE_KEYS.PROMISSORY_NOTES, initialPromissoryNotes);
  safeSet(STORAGE_KEYS.BRANCHES, initialBranches);
  safeSet(STORAGE_KEYS.WAREHOUSES, initialWarehouses);
  safeSet(STORAGE_KEYS.EMPLOYEES, initialEmployees);
  safeSet(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests);
  safeSet(STORAGE_KEYS.ADVANCE_REQUESTS, initialAdvanceRequests);
  safeSet(STORAGE_KEYS.LEGAL_DEDUCTIONS, initialLegalDeductions);
  safeSet(STORAGE_KEYS.COST_PROJECTS, initialCostProjects);
  safeSet(STORAGE_KEYS.ASSET_CUSTODIES, initialAssetCustodies);
  safeSet(STORAGE_KEYS.BOMS, initialBillOfMaterials);
  safeSet(STORAGE_KEYS.WORKSTATIONS, initialWorkstations);
  safeSet(STORAGE_KEYS.ROUTINGS, initialRoutings);
  safeSet(STORAGE_KEYS.WORK_ORDERS, initialWorkOrders);
  safeSet(STORAGE_KEYS.SUBCONTRACT_ORDERS, initialSubcontractOrders);
  safeSet(STORAGE_KEYS.AUTO_SERVICES, initialAutoServices);
  safeSet(STORAGE_KEYS.IT_SERVICES, initialItServices);
  safeSet(STORAGE_KEYS.APPLIANCE_SERVICES, initialApplianceServices);
  safeSet(STORAGE_KEYS.CONSTRUCTION_PROJECTS, initialConstructionProjects);
  safeSet(STORAGE_KEYS.SECTORS, initialSectors);
  safeSet(STORAGE_KEYS.ACTIVE_SECTOR, "catering");
  safeSet(STORAGE_KEYS.FOOD_RECIPES, initialFoodRecipes);
  safeSet(STORAGE_KEYS.FOOD_MENUS, initialFoodMenus);
  safeSet(STORAGE_KEYS.FOOD_PRODUCTION_ORDERS, initialFoodProductionOrders);
  safeSet(STORAGE_KEYS.FOOD_DISPATCHES, initialFoodDispatches);
  safeSet(STORAGE_KEYS.FOOD_SAMPLES, initialFoodWitnessSamples);
  safeSet(STORAGE_KEYS.FIXED_ASSETS, INITIAL_FIXED_ASSETS);
  safeSet(STORAGE_KEYS.ASSET_MAINTENANCES, INITIAL_ASSET_MAINTENANCES);
  safeSet(STORAGE_KEYS.ASSET_DISPOSALS, INITIAL_ASSET_DISPOSALS);
  safeSet(STORAGE_KEYS.EDOCUMENTS, []);
}


export function exportBackupJSON(): string {
  const data = getStoredData();
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.contacts && parsed.invoices) {
      if (parsed.settings) saveStoredData("SETTINGS", parsed.settings);
      if (parsed.contacts) saveStoredData("CONTACTS", parsed.contacts);
      if (parsed.accounts) saveStoredData("ACCOUNTS", parsed.accounts);
      if (parsed.invoices) saveStoredData("INVOICES", parsed.invoices);
      if (parsed.transactions) saveStoredData("TRANSACTIONS", parsed.transactions);
      if (parsed.products) saveStoredData("PRODUCTS", parsed.products);
      if (parsed.quotes) saveStoredData("QUOTES", parsed.quotes);
      if (parsed.orders) saveStoredData("ORDERS", parsed.orders);
      if (parsed.waybills) saveStoredData("WAYBILLS", parsed.waybills);
      if (parsed.cheques) saveStoredData("CHEQUES", parsed.cheques);
      if (parsed.promissoryNotes) saveStoredData("PROMISSORY_NOTES", parsed.promissoryNotes);
      if (parsed.branches) saveStoredData("BRANCHES", parsed.branches);
      if (parsed.warehouses) saveStoredData("WAREHOUSES", parsed.warehouses);
      if (parsed.employees) saveStoredData("EMPLOYEES", parsed.employees);
      if (parsed.leaveRequests) saveStoredData("LEAVE_REQUESTS", parsed.leaveRequests);
      if (parsed.advanceRequests) saveStoredData("ADVANCE_REQUESTS", parsed.advanceRequests);
      if (parsed.legalDeductions) saveStoredData("LEGAL_DEDUCTIONS", parsed.legalDeductions);
      if (parsed.costProjects) saveStoredData("COST_PROJECTS", parsed.costProjects);
      if (parsed.assetCustodies) saveStoredData("ASSET_CUSTODIES", parsed.assetCustodies);
      if (parsed.boms) saveStoredData("BOMS", parsed.boms);
      if (parsed.workstations) saveStoredData("WORKSTATIONS", parsed.workstations);
      if (parsed.routings) saveStoredData("ROUTINGS", parsed.routings);
      if (parsed.workOrders) saveStoredData("WORK_ORDERS", parsed.workOrders);
      if (parsed.subcontractOrders) saveStoredData("SUBCONTRACT_ORDERS", parsed.subcontractOrders);
      if (parsed.autoServices) saveStoredData("AUTO_SERVICES", parsed.autoServices);
      if (parsed.itServices) saveStoredData("IT_SERVICES", parsed.itServices);
      if (parsed.applianceServices) saveStoredData("APPLIANCE_SERVICES", parsed.applianceServices);
      if (parsed.constructionProjects) saveStoredData("CONSTRUCTION_PROJECTS", parsed.constructionProjects);
      if (parsed.fixedAssets) saveStoredData("FIXED_ASSETS", parsed.fixedAssets);
      if (parsed.assetMaintenances) saveStoredData("ASSET_MAINTENANCES", parsed.assetMaintenances);
      if (parsed.assetDisposals) saveStoredData("ASSET_DISPOSALS", parsed.assetDisposals);
      return true;
    }
  } catch (e) {
    console.error("Failed to import JSON", e);
  }
  return false;
}
