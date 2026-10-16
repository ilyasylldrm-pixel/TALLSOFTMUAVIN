import { Contact, Invoice, Account, Transaction, Product, Quote, Order, Waybill, CompanySettings, CompanyItem, Cheque, PromissoryNote, Branch, Warehouse, Employee, LeaveRequest, AdvanceRequest, LegalDeduction, CostProject, AssetCustody, BillOfMaterials, Workstation, Routing, WorkOrder, SubcontractOrder, AutoServiceRecord, ItServiceRecord, ApplianceServiceRecord, IndustrySector, FoodRecipe, FoodMenuPlan, FoodProductionOrder, FoodDispatchDelivery, FoodWitnessSample, ConstructionProject, getContactAccountCode, FixedAsset, AssetMaintenanceRecord, AssetDisposalRecord } from "../types";
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
  PAYROLL_CUSTOMIZATIONS: "muavin_payroll_customizations",
  COMPANIES_LIST: "muavin_companies_list",
  ACTIVE_COMPANY_ID: "muavin_active_company_id",
};

export const DEFAULT_COMPANY: CompanyItem = {
  id: "comp_default",
  companyName: "MUAVİN BİLİŞİM TEKN.DAN.A.Ş. (TEST)",
  companyTitle: "MUAVİN BİLİŞİM TEKNOLOJİLERİ VE DANIŞMANLIK A.Ş.",
  taxOffice: "Mecidiyeköy",
  taxNumber: "6220542314",
  vkn: "6220542314",
  tckn: "",
  mysoftMatchedType: "vkn",
  tenantIdentifierNumber: "6220542314",
  mysoftStatus: "verified",
  eFaturaPrefix: "GIB",
  eFaturaNextNumber: "GIB2026000000001",
  eArsivPrefix: "EAR",
  eArsivNextNumber: "EAR2026000000001",
  companyType: "anonim",
  loginUsername: "muavin_test",
  loginPasswordPlain: "Muavin2026!",
  loginEmail: "test@muavin.com",
  loginFullName: "Muavin Test Yöneticisi",
  loginRole: "Firma Yöneticisi",
  isDefault: true,
  createdAt: "2024-01-01T00:00:00.000Z",
};

export const DEFAULT_CORPORATE_COMPANY: CompanyItem = {
  id: "comp_sirket",
  companyName: "ANADOLU KURUMSAL TİCARET LTD. ŞTİ.",
  companyTitle: "ANADOLU KURUMSAL İÇ VE DIŞ TİCARET LİMİTED ŞİRKETİ",
  taxOffice: "Kadıköy",
  taxNumber: "1450892310",
  vkn: "1450892310",
  tckn: "",
  mysoftMatchedType: "vkn",
  tenantIdentifierNumber: "1450892310",
  mysoftStatus: "verified",
  eFaturaPrefix: "AKT",
  eFaturaNextNumber: "AKT2026000000001",
  eArsivPrefix: "AKE",
  eArsivNextNumber: "AKE2026000000001",
  companyType: "limited",
  city: "İstanbul",
  district: "Kadıköy",
  loginUsername: "anadolu_kurumsal",
  loginPasswordPlain: "Anadolu2026!",
  loginEmail: "yonetici@anadolukurumsal.com",
  loginFullName: "Anadolu Kurumsal Yöneticisi",
  loginRole: "Firma Yöneticisi",
  createdAt: "2025-01-10T00:00:00.000Z",
};

export const DEFAULT_INDIVIDUAL_COMPANY: CompanyItem = {
  id: "comp_sahis",
  companyName: "AHMET YILMAZ TİCARETHANESİ (ŞAHIS)",
  companyTitle: "AHMET YILMAZ - YILMAZ TİCARET VE MÜHENDİSLİK ŞAHIS İŞLETMESİ",
  taxOffice: "Çankaya",
  taxNumber: "28491038472",
  vkn: "",
  tckn: "28491038472",
  mysoftMatchedType: "tckn",
  tenantIdentifierNumber: "28491038472",
  mysoftStatus: "verified",
  eFaturaPrefix: "AYT",
  eFaturaNextNumber: "AYT2026000000001",
  eArsivPrefix: "AYE",
  eArsivNextNumber: "AYE2026000000001",
  companyType: "sahis",
  city: "Ankara",
  district: "Çankaya",
  loginUsername: "ahmet_yilmaz",
  loginPasswordPlain: "Yilmaz2026!",
  loginEmail: "ahmet@yilmazticaret.com",
  loginFullName: "Ahmet Yılmaz",
  loginRole: "İşletme Sahibi",
  createdAt: "2025-01-15T00:00:00.000Z",
};

function ensureCompanyCredentials(comp: CompanyItem): { comp: CompanyItem; changed: boolean } {
  let changed = false;
  const copy = { ...comp };

  if (copy.id === DEFAULT_COMPANY.id) {
    if (!copy.loginUsername) { copy.loginUsername = DEFAULT_COMPANY.loginUsername; changed = true; }
    if (!copy.loginPasswordPlain) { copy.loginPasswordPlain = DEFAULT_COMPANY.loginPasswordPlain; changed = true; }
    if (!copy.loginEmail) { copy.loginEmail = DEFAULT_COMPANY.loginEmail; changed = true; }
    if (!copy.loginFullName) { copy.loginFullName = DEFAULT_COMPANY.loginFullName; changed = true; }
    if (!copy.loginRole) { copy.loginRole = DEFAULT_COMPANY.loginRole; changed = true; }
  } else if (copy.id === DEFAULT_CORPORATE_COMPANY.id) {
    if (!copy.loginUsername) { copy.loginUsername = DEFAULT_CORPORATE_COMPANY.loginUsername; changed = true; }
    if (!copy.loginPasswordPlain) { copy.loginPasswordPlain = DEFAULT_CORPORATE_COMPANY.loginPasswordPlain; changed = true; }
    if (!copy.loginEmail) { copy.loginEmail = DEFAULT_CORPORATE_COMPANY.loginEmail; changed = true; }
    if (!copy.loginFullName) { copy.loginFullName = DEFAULT_CORPORATE_COMPANY.loginFullName; changed = true; }
    if (!copy.loginRole) { copy.loginRole = DEFAULT_CORPORATE_COMPANY.loginRole; changed = true; }
  } else if (copy.id === DEFAULT_INDIVIDUAL_COMPANY.id) {
    if (!copy.loginUsername) { copy.loginUsername = DEFAULT_INDIVIDUAL_COMPANY.loginUsername; changed = true; }
    if (!copy.loginPasswordPlain) { copy.loginPasswordPlain = DEFAULT_INDIVIDUAL_COMPANY.loginPasswordPlain; changed = true; }
    if (!copy.loginEmail) { copy.loginEmail = DEFAULT_INDIVIDUAL_COMPANY.loginEmail; changed = true; }
    if (!copy.loginFullName) { copy.loginFullName = DEFAULT_INDIVIDUAL_COMPANY.loginFullName; changed = true; }
    if (!copy.loginRole) { copy.loginRole = DEFAULT_INDIVIDUAL_COMPANY.loginRole; changed = true; }
  } else {
    if (!copy.loginUsername) {
      const trMap: Record<string, string> = {
        ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
        ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
      };
      const slug = (copy.companyName || "sirket")
        .split("")
        .map((ch) => trMap[ch] || ch)
        .join("")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 20);
      copy.loginUsername = `${slug || "firma"}_yonetici`;
      changed = true;
    }
    if (!copy.loginPasswordPlain) {
      copy.loginPasswordPlain = "Muavin2026!";
      changed = true;
    }
    if (!copy.loginEmail) {
      copy.loginEmail = copy.email || `${copy.loginUsername}@muavin.com`;
      changed = true;
    }
    if (!copy.loginFullName) {
      copy.loginFullName = `${copy.companyName} Yöneticisi`;
      changed = true;
    }
    if (!copy.loginRole) {
      copy.loginRole = "Firma Yöneticisi";
      changed = true;
    }
  }
  return { comp: copy, changed };
}

export function getCompaniesList(): CompanyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANIES_LIST);
    const seededFlag = localStorage.getItem("muavin_companies_seeded_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let updated = false;
        let list = [...parsed];
        if (!seededFlag) {
          if (!list.some((c) => c.id === DEFAULT_COMPANY.id)) {
            list.unshift(DEFAULT_COMPANY);
            updated = true;
          }
          if (!list.some((c) => c.id === DEFAULT_CORPORATE_COMPANY.id || (c.id !== DEFAULT_COMPANY.id && (c.companyType === "limited" || c.companyType === "anonim")))) {
            list.push(DEFAULT_CORPORATE_COMPANY);
            updated = true;
          }
          if (!list.some((c) => c.id === DEFAULT_INDIVIDUAL_COMPANY.id || c.companyType === "sahis")) {
            list.push(DEFAULT_INDIVIDUAL_COMPANY);
            updated = true;
          }
          safeSetStorageItem("muavin_companies_seeded_v2", "1");
        }
        list = list.map((item) => {
          const res = ensureCompanyCredentials(item);
          if (res.changed) updated = true;
          return res.comp;
        });
        if (updated) {
          safeSetStorageItem(STORAGE_KEYS.COMPANIES_LIST, JSON.stringify(list));
        }
        return list;
      }
      if (Array.isArray(parsed) && parsed.length === 0 && seededFlag) {
        return [];
      }
    }
  } catch (e) {
    console.error("Error reading companies list", e);
  }
  const defaultList = [DEFAULT_COMPANY, DEFAULT_CORPORATE_COMPANY, DEFAULT_INDIVIDUAL_COMPANY];
  safeSetStorageItem("muavin_companies_seeded_v2", "1");
  safeSetStorageItem(STORAGE_KEYS.COMPANIES_LIST, JSON.stringify(defaultList));
  return defaultList;
}

export function saveCompaniesList(list: CompanyItem[]): void {
  safeSetStorageItem("muavin_companies_seeded_v2", "1");
  safeSetStorageItem(STORAGE_KEYS.COMPANIES_LIST, JSON.stringify(list));
}

export function getActiveCompanyId(): string {
  try {
    const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
    if (active) return active;
  } catch (e) {
    // fallback
  }
  return DEFAULT_COMPANY.id;
}

export function setActiveCompanyId(id: string): void {
  safeSetStorageItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, id);
}

export function addCompanyItem(comp: CompanyItem): CompanyItem[] {
  const current = getCompaniesList();
  const exists = current.some((c) => c.id === comp.id);
  const updated = exists ? current.map((c) => (c.id === comp.id ? comp : c)) : [...current, comp];
  saveCompaniesList(updated);
  return updated;
}

export function updateCompanyItem(comp: CompanyItem): CompanyItem[] {
  const current = getCompaniesList();
  const updated = current.map((c) => (c.id === comp.id ? comp : c));
  saveCompaniesList(updated);
  return updated;
}

export function deleteCompanyItem(id: string): CompanyItem[] {
  const current = getCompaniesList();
  const updated = current.filter((c) => c.id !== id);
  saveCompaniesList(updated);

  // Clean up isolated storage slices for the deleted company
  try {
    Object.values(STORAGE_KEYS).forEach((baseKey) => {
      if (baseKey !== STORAGE_KEYS.COMPANIES_LIST && baseKey !== STORAGE_KEYS.ACTIVE_COMPANY_ID) {
        localStorage.removeItem(`${baseKey}__${id}`);
      }
    });
  } catch (e) {
    // ignore storage cleanup errors
  }

  if (getActiveCompanyId() === id) {
    const nextActiveId = updated.length > 0 ? updated[0].id : DEFAULT_COMPANY.id;
    setActiveCompanyId(nextActiveId);
  }
  return updated;
}

export function pruneDayPuantajDetail(day: any): any {
  if (!day) return { code: "N" };
  if (typeof day === "string") return { code: day };
  const pruned: any = { code: day.code || "N" };
  if (day.overtimeHours && Number(day.overtimeHours) > 0) {
    pruned.overtimeHours = Number(day.overtimeHours);
  }
  if (day.isHolidayOvertime) {
    pruned.isHolidayOvertime = true;
  }
  if (day.leaveReason && typeof day.leaveReason === "string" && day.leaveReason.trim()) {
    pruned.leaveReason = day.leaveReason.trim();
  }
  if (day.leaveType && typeof day.leaveType === "string" && day.leaveType.trim()) {
    pruned.leaveType = day.leaveType.trim();
  }
  return pruned;
}

export function pruneAdjustmentForStorage(adj: any): any {
  if (!adj || typeof adj !== "object") return {};
  const pruned: any = {};

  const scalarKeys = [
    "month", "salaryType", "baseSalary", "bonusAmount", "allowanceAmount",
    "unpaidLeaveDays", "advanceDeduction", "icraDeduction", "alimonyDeduction",
    "otherDeductions", "isRetired", "isCustomized", "notes",
    "alimonyReason", "otherReason", "deductionReason", "customPaymentsTotal"
  ];
  scalarKeys.forEach((k) => {
    if (adj[k] !== undefined && adj[k] !== null && adj[k] !== "") {
      pruned[k] = adj[k];
    }
  });

  if (Array.isArray(adj.customPayments) && adj.customPayments.length > 0) {
    pruned.customPayments = adj.customPayments;
  }

  if (adj.puantajDays && typeof adj.puantajDays === "object") {
    const prunedDays: Record<number, any> = {};
    let hasEntries = false;
    Object.entries(adj.puantajDays).forEach(([dStr, dayVal]: [string, any]) => {
      const dNum = Number(dStr);
      if (!dNum || isNaN(dNum)) return;
      const dayPruned = pruneDayPuantajDetail(dayVal);
      prunedDays[dNum] = dayPruned;
      hasEntries = true;
    });
    if (hasEntries) {
      pruned.puantajDays = prunedDays;
    }
  }

  return pruned;
}

export function sanitizePayrollCustomizations(data: any): Record<string, any> {
  if (!data || typeof data !== "object") return {};
  const cleaned: Record<string, any> = {};

  const isMonthKey = (k: string) => /^\d{4}-\d{2}$/.test(k);
  const isMonthEmpKey = (k: string) => /^\d{4}-\d{2}_.+/.test(k);

  // 1. First process month maps: e.g. "2026-07": { "emp_1": {...} }
  Object.entries(data).forEach(([key, val]) => {
    if (isMonthKey(key)) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const monthGroup: Record<string, any> = {};
        Object.entries(val).forEach(([subKey, subVal]) => {
          // Prevent recursive nesting of month keys
          if (isMonthKey(subKey) || subKey.includes("_")) return;
          if (subVal && typeof subVal === "object") {
            monthGroup[subKey] = pruneAdjustmentForStorage(subVal);
          }
        });
        cleaned[key] = monthGroup;
      }
    }
  });

  // 2. Process `${month}_${empId}` keys and root `empId` keys
  Object.entries(data).forEach(([key, val]) => {
    if (isMonthKey(key)) return;
    if (isMonthEmpKey(key)) {
      if (val && typeof val === "object") {
        cleaned[key] = pruneAdjustmentForStorage(val);
      }
    } else if (val && typeof val === "object" && (val as any).isCustomized) {
      // Direct employee ID
      cleaned[key] = pruneAdjustmentForStorage(val);
    }
  });

  return cleaned;
}

export function savePayrollCustomizationsStorage(data: Record<string, any>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const sanitized = sanitizePayrollCustomizations(data);
    const jsonStr = JSON.stringify(sanitized);

    const success = safeSetStorageItem("muavin_payroll_customizations", jsonStr);
    if (!success) {
      // If quota issue persists, retain only the 3 most recent months and retry
      const isMonthKey = (k: string) => /^\d{4}-\d{2}$/.test(k);
      const monthKeys = Object.keys(sanitized).filter(isMonthKey).sort().reverse().slice(0, 3);
      const minimal: Record<string, any> = {};
      monthKeys.forEach((m) => {
        minimal[m] = sanitized[m];
      });
      Object.entries(sanitized).forEach(([k, v]) => {
        if (monthKeys.some((m) => k.startsWith(m))) {
          minimal[k] = v;
        }
      });
      return safeSetStorageItem("muavin_payroll_customizations", JSON.stringify(minimal), false);
    }
    return true;
  } catch (err) {
    console.warn("Could not save payroll customizations to storage:", err);
    return false;
  }
}

export function loadPayrollCustomizationsStorage(): Record<string, any> {
  if (typeof window === "undefined") return {};
  try {
    const raw = safeGetStorageItem("muavin_payroll_customizations");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return sanitizePayrollCustomizations(parsed);
  } catch (err) {
    console.warn("Could not load payroll customizations:", err);
    return {};
  }
}

const memoryStorageFallback = new Map<string, string>();

export function compactEDocumentsForStorage(docs: any[], maxCount = 200): any[] {
  if (!Array.isArray(docs)) return [];
  return docs.slice(0, maxCount).map((doc) => {
    if (!doc || typeof doc !== "object") return doc;
    const { raw, lines, ...rest } = doc;
    return rest;
  });
}

export function cleanupOversizedStorage(aggressive = false) {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    const activeCompId = (() => {
      try {
        return window.localStorage?.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID) || DEFAULT_COMPANY.id;
      } catch {
        return DEFAULT_COMPANY.id;
      }
    })();

    const len = window.localStorage?.length || 0;
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
      else if (key === "muavin_cloud_branding" || key === "muavin_cloud_logo_url") {
        try {
          const val = window.localStorage.getItem(key);
          if (val && (val.length > 40000 || aggressive)) {
            keysToRemove.push(key);
          }
        } catch (_) {}
      }
      // 3.1. Compact oversized company settings if base64 logoUrl bloated them
      else if (key.startsWith("muavin_company_settings")) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw && raw.length > 60000) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && typeof parsed.logoUrl === "string" && parsed.logoUrl.length > 40000) {
              parsed.logoUrl = "/logo.svg";
              window.localStorage.setItem(key, JSON.stringify(parsed));
            }
          }
        } catch (_) {}
      }
      // 3.2. Compact oversized e-documents snapshot
      else if (key.startsWith("muavin_e_documents")) {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw && (raw.length > 150000 || aggressive)) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const compacted = compactEDocumentsForStorage(parsed, aggressive ? 60 : 180);
              window.localStorage.setItem(key, JSON.stringify(compacted));
            } else {
              keysToRemove.push(key);
            }
          }
        } catch (_) {
          keysToRemove.push(key);
        }
      }
      // 3.3. Compact oversized payroll customizations if bloated
      else if (key === "muavin_payroll_customizations") {
        try {
          const raw = window.localStorage.getItem("muavin_payroll_customizations");
          if (raw && (raw.length > 60000 || aggressive)) {
            const parsed = JSON.parse(raw);
            const sanitized = sanitizePayrollCustomizations(parsed);
            window.localStorage.setItem("muavin_payroll_customizations", JSON.stringify(sanitized));
          }
        } catch (_) {
          keysToRemove.push(key);
        }
      }
      // 4. In aggressive mode or when storage quota is exceeded, also purge non-essential transient caches
      else if (aggressive) {
        if (
          key.startsWith("muavin_col_widths_") ||
          key.startsWith("muavin_col_vis_") ||
          key.startsWith("muavin_table_row_height") ||
          key.startsWith("tradres_") ||
          key.startsWith("construction_custom_cost_groups_") ||
          key.startsWith("construction_cost_packages_") ||
          key.startsWith("construction_site_summary_") ||
          key === "muavin_local_users_backup"
        ) {
          keysToRemove.push(key);
        } else if (
          key.includes("_comp_") &&
          !key.endsWith(`_${activeCompId}`) &&
          (key.startsWith("muavin_construction_projects_") ||
            key.startsWith("muavin_food_") ||
            key.startsWith("muavin_boms_") ||
            key.startsWith("muavin_work_orders_") ||
            key.startsWith("muavin_auto_services_") ||
            key.startsWith("muavin_it_services_") ||
            key.startsWith("muavin_appliance_services_") ||
            key.startsWith("muavin_cost_projects_"))
        ) {
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

/**
 * Emergency eviction when localStorage is still full after standard aggressive cleanup:
 * evicts the largest non-critical / rebuildable slices first so critical writes (like GitHub config, invoices, settings) always succeed.
 */
function evictLargestNonCriticalKeys(protectedKey: string) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const protectedPrefixes = [
      "muavin_github_",
      "muavin_active_user",
      "muavin_companies_list",
      "muavin_active_company_id",
      "muavin_mysoft_tenant_vkn",
      "muavin_custom_app_modules",
    ];
    const entries: { key: string; size: number; priority: number }[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || k === protectedKey) continue;
      if (protectedPrefixes.some((p) => k.startsWith(p))) continue;
      const val = window.localStorage.getItem(k) || "";
      const isSecondaryMockSlice =
        k.startsWith("muavin_construction_projects") ||
        k.startsWith("muavin_food_") ||
        k.startsWith("muavin_boms") ||
        k.startsWith("muavin_work_orders") ||
        k.startsWith("muavin_subcontract_orders") ||
        k.startsWith("muavin_auto_services") ||
        k.startsWith("muavin_it_services") ||
        k.startsWith("muavin_appliance_services") ||
        k.startsWith("muavin_e_documents") ||
        k.startsWith("muavin_cost_projects") ||
        k.startsWith("muavin_fixed_assets") ||
        k.startsWith("muavin_asset_");
      entries.push({
        key: k,
        size: val.length,
        priority: isSecondaryMockSlice ? 1 : 2,
      });
    }
    // Sort by priority (1 = secondary/rebuildable first), then largest size first
    entries.sort((a, b) => a.priority - b.priority || b.size - a.size);
    let freed = 0;
    for (const item of entries) {
      try {
        // Keep in session/memory fallback before removing from localStorage
        const existingVal = window.localStorage.getItem(item.key);
        if (existingVal) {
          memoryStorageFallback.set(item.key, existingVal);
        }
        window.localStorage.removeItem(item.key);
        freed += item.size;
        if (freed > 1200000) break; // Free ~1.2MB
      } catch (_) {}
    }
  } catch (_) {}
}

// Immediately run cleanup when module loads
if (typeof window !== "undefined") {
  cleanupOversizedStorage();
}

/**
 * Safely sets an item in localStorage or sessionStorage.
 * On QuotaExceededError, aggressively purges transient caches, retries,
 * and falls back to memory/sessionStorage without crashing the application.
 */
export function safeSetStorageItem(key: string, valueString: string, preferSession = false): boolean {
  memoryStorageFallback.set(key, valueString);
  if (typeof window === "undefined") return false;

  const targetStorage = preferSession ? window.sessionStorage : window.localStorage;
  const fallbackStorage = preferSession ? window.localStorage : window.sessionStorage;

  try {
    targetStorage?.setItem(key, valueString);
    return true;
  } catch (e) {
    console.warn(`Storage quota exceeded setting ${key}, running aggressive cache cleanup:`, e);
    cleanupOversizedStorage(true);

    try {
      targetStorage?.setItem(key, valueString);
      return true;
    } catch (_retryErr) {
      evictLargestNonCriticalKeys(key);
      try {
        targetStorage?.setItem(key, valueString);
        return true;
      } catch (_secondRetryErr) {
        try {
          fallbackStorage?.setItem(key, valueString);
          return true;
        } catch (_fallbackErr) {
          console.warn(`Could not persist ${key} in local/session storage due to browser quota limits (kept in memory):`, _fallbackErr);
          return false;
        }
      }
    }
  }
}

/**
 * Safely gets an item checking localStorage first, then sessionStorage, then in-memory fallback
 */
export function safeGetStorageItem(key: string): string | null {
  if (typeof window === "undefined") return memoryStorageFallback.get(key) ?? null;
  try {
    return (
      window.localStorage?.getItem(key) ??
      window.sessionStorage?.getItem(key) ??
      memoryStorageFallback.get(key) ??
      null
    );
  } catch (_) {
    return memoryStorageFallback.get(key) ?? null;
  }
}

/**
 * Safely removes an item from both localStorage, sessionStorage, and memory fallback
 */
export function safeRemoveStorageItem(key: string): void {
  memoryStorageFallback.delete(key);
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.removeItem(key);
    window.sessionStorage?.removeItem(key);
  } catch (_) {}
}

const safeSet = (key: string, val: any) => {
  safeSetStorageItem(key, JSON.stringify(val));
};

export function getStoredData(targetCompanyId?: string) {
  cleanupOversizedStorage();
  const activeCompId = targetCompanyId || getActiveCompanyId();
  const isDefault = activeCompId === DEFAULT_COMPANY.id;

  const get = <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key) || sessionStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error loading ${key} from storage`, e);
      return fallback;
    }
  };

  const getCompanyScoped = <T>(baseKey: string, fallbackDefault: T, fallbackNew: T): T => {
    if (isDefault) {
      return get<T>(baseKey, fallbackDefault);
    }
    const scopedKey = `${baseKey}_${activeCompId}`;
    return get<T>(scopedKey, fallbackNew);
  };

  const storedInvoices = getCompanyScoped<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices, []);
  const storedProducts = getCompanyScoped<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts, []);
  const storedCheques = getCompanyScoped<Cheque[]>(STORAGE_KEYS.CHEQUES, initialCheques, []);
  const storedNotes = getCompanyScoped<PromissoryNote[]>(STORAGE_KEYS.PROMISSORY_NOTES, initialPromissoryNotes, []);
  const loadedContacts = getCompanyScoped<Contact[]>(STORAGE_KEYS.CONTACTS, initialContacts, []);
  const loadedTransactions = getCompanyScoped<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions, []);

  const normalizedContacts = syncContactBalances(
    loadedContacts,
    storedInvoices,
    loadedTransactions,
    storedCheques,
    storedNotes
  );

  let loadedSettings: CompanySettings;
  const compMeta = getCompaniesList().find((c) => c.id === activeCompId) || DEFAULT_COMPANY;
  if (isDefault) {
    loadedSettings = get<CompanySettings>(STORAGE_KEYS.SETTINGS, initialCompanySettings);
    if (
      loadedSettings &&
      (loadedSettings.companyTitle?.includes("Muavin Bilişim Teknolojileri") ||
       loadedSettings.companyName?.includes("Muavin Bilişim"))
    ) {
      if (loadedSettings.companyName !== "MUAVİN BİLİŞİM TEKN.DAN.A.Ş.") {
        loadedSettings.companyName = "MUAVİN BİLİŞİM TEKN.DAN.A.Ş.";
        safeSet(STORAGE_KEYS.SETTINGS, loadedSettings);
      }
    }
  } else {
    const initialForNewCompany: CompanySettings = {
      ...initialCompanySettings,
      id: compMeta.id,
      companyName: compMeta.companyName || "Yeni Şirket",
      name: compMeta.companyName || "Yeni Şirket",
      companyTitle: compMeta.companyTitle || compMeta.companyName || "Yeni Şirket",
      title: compMeta.companyTitle || compMeta.companyName || "Yeni Şirket",
      taxOffice: compMeta.taxOffice || "Merkez",
      taxNumber: compMeta.taxNumber || compMeta.vkn || compMeta.tckn || "",
      vknTckn: compMeta.taxNumber || compMeta.vkn || compMeta.tckn || "",
      vkn: compMeta.vkn || "",
      tckn: compMeta.tckn || "",
      mysoftMatchedType: compMeta.mysoftMatchedType || "vkn",
      tenantIdentifierNumber: compMeta.tenantIdentifierNumber || compMeta.vkn || compMeta.tckn || "",
      mysoftStatus: compMeta.mysoftStatus || "unmatched",
      eFaturaPrefix: compMeta.eFaturaPrefix || "GIB",
      eFaturaNextNumber: compMeta.eFaturaNextNumber || undefined,
      eArsivPrefix: compMeta.eArsivPrefix || "EAR",
      eArsivNextNumber: compMeta.eArsivNextNumber || undefined,
      defaultInvoicePrefix: compMeta.eFaturaPrefix || "GIB",
      phone: compMeta.phone || "",
      email: compMeta.email || "",
      website: compMeta.website || "",
      address: compMeta.address || "",
      city: compMeta.city || "İstanbul",
      district: compMeta.district || "",
      logoUrl: "",
      mysoftCredentials: {
        tenantIdentifierNumber: compMeta.tenantIdentifierNumber || compMeta.vkn || compMeta.tckn || "",
      },
    };
    loadedSettings = get<CompanySettings>(`${STORAGE_KEYS.SETTINGS}_${activeCompId}`, initialForNewCompany);
  }

  if (compMeta) {
    loadedSettings = {
      ...loadedSettings,
      tenantIdentifierNumber:
        compMeta.tenantIdentifierNumber || loadedSettings.tenantIdentifierNumber || compMeta.vkn || compMeta.tckn || "",
      mysoftStatus: compMeta.mysoftStatus || loadedSettings.mysoftStatus,
      eFaturaPrefix: compMeta.eFaturaPrefix || loadedSettings.eFaturaPrefix || "GIB",
      eFaturaNextNumber: compMeta.eFaturaNextNumber || loadedSettings.eFaturaNextNumber,
      eArsivPrefix: compMeta.eArsivPrefix || loadedSettings.eArsivPrefix || "EAR",
      eArsivNextNumber: compMeta.eArsivNextNumber || loadedSettings.eArsivNextNumber,
      defaultInvoicePrefix:
        compMeta.eFaturaPrefix || loadedSettings.eFaturaPrefix || loadedSettings.defaultInvoicePrefix || "GIB",
    };
  }

  return {
    settings: loadedSettings,
    contacts: normalizedContacts,
    accounts: getCompanyScoped<Account[]>(STORAGE_KEYS.ACCOUNTS, initialAccounts, []),
    invoices: storedInvoices,
    transactions: loadedTransactions,
    products: storedProducts,
    quotes: getCompanyScoped<Quote[]>(STORAGE_KEYS.QUOTES, initialQuotes, []),
    orders: getCompanyScoped<Order[]>(STORAGE_KEYS.ORDERS, initialOrders, []),
    waybills: getCompanyScoped<Waybill[]>(STORAGE_KEYS.WAYBILLS, initialWaybills, []),
    cheques: storedCheques,
    promissoryNotes: storedNotes,
    branches: (() => {
      if (isDefault) {
        const stored = get<Branch[]>(STORAGE_KEYS.BRANCHES, initialBranches);
        return Array.isArray(stored) && stored.length > 0 ? stored : initialBranches;
      }
      const scopedKey = `${STORAGE_KEYS.BRANCHES}_${activeCompId}`;
      const existingRaw = safeGetStorageItem(scopedKey);
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (_) {}
      }
      const defaultBranchForComp: Branch[] = [
        {
          id: `br_main_${activeCompId}`,
          code: "SUB-001",
          name: `${compMeta.companyName || "İşletme"} - Merkez Şube`,
          isMain: true,
          managerName: compMeta.companyType === "sahis" ? (compMeta.companyName?.split("-")[0]?.trim() || "İşletme Sahibi") : "Şube Müdürü",
          phone: compMeta.phone || "+90 (212) 000 00 00",
          email: compMeta.email || "",
          status: "active",
          address: {
            country: "Türkiye",
            city: compMeta.city || "İstanbul",
            district: compMeta.district || "Merkez",
            fullAddress: compMeta.address || `${compMeta.district || "Merkez"} / ${compMeta.city || "İstanbul"}`,
          },
          createdAt: new Date().toISOString().split("T")[0],
        },
      ];
      safeSet(scopedKey, defaultBranchForComp);
      return defaultBranchForComp;
    })(),
    warehouses: (() => {
      if (isDefault) {
        const stored = get<Warehouse[]>(STORAGE_KEYS.WAREHOUSES, initialWarehouses);
        return Array.isArray(stored) && stored.length > 0 ? stored : initialWarehouses;
      }
      const scopedKey = `${STORAGE_KEYS.WAREHOUSES}_${activeCompId}`;
      const existingRaw = safeGetStorageItem(scopedKey);
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (_) {}
      }
      const defaultWhForComp: Warehouse[] = [
        {
          id: `wh_main_${activeCompId}`,
          code: "DEP-001",
          name: `${compMeta.companyType === "sahis" ? "Şahıs İşletmesi" : "Şirket"} Merkez Ana Depo`,
          type: "main",
          capacityM2: compMeta.companyType === "sahis" ? 400 : 1500,
          managerName: compMeta.companyType === "sahis" ? "İşletme Yetkilisi" : "Depo Sorumlusu",
          phone: compMeta.phone || "+90 (212) 000 00 00",
          branchId: `br_main_${activeCompId}`,
          branchName: `${compMeta.companyName || "İşletme"} - Merkez Şube`,
          isDefault: true,
          status: "active",
          address: {
            country: "Türkiye",
            city: compMeta.city || "İstanbul",
            district: compMeta.district || "Merkez",
            fullAddress: compMeta.address || `${compMeta.district || "Merkez"} / ${compMeta.city || "İstanbul"}`,
          },
          createdAt: new Date().toISOString().split("T")[0],
        },
      ];
      safeSet(scopedKey, defaultWhForComp);
      return defaultWhForComp;
    })(),
    employees: getCompanyScoped<Employee[]>(STORAGE_KEYS.EMPLOYEES, initialEmployees, []),
    leaveRequests: getCompanyScoped<LeaveRequest[]>(STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests, []),
    advanceRequests: getCompanyScoped<AdvanceRequest[]>(STORAGE_KEYS.ADVANCE_REQUESTS, initialAdvanceRequests, []),
    legalDeductions: getCompanyScoped<LegalDeduction[]>(STORAGE_KEYS.LEGAL_DEDUCTIONS, initialLegalDeductions, []),
    costProjects: (() => {
      if (isDefault) {
        const stored = get<CostProject[]>(STORAGE_KEYS.COST_PROJECTS, initialCostProjects);
        const cleaned = (stored || initialCostProjects || []).map((p) => ({
          ...p,
          costItems: [],
        }));
        safeSet(STORAGE_KEYS.COST_PROJECTS, cleaned);
        return cleaned;
      }
      return getCompanyScoped<CostProject[]>(STORAGE_KEYS.COST_PROJECTS, [], []);
    })(),
    assetCustodies: getCompanyScoped<AssetCustody[]>(STORAGE_KEYS.ASSET_CUSTODIES, initialAssetCustodies, []),
    boms: getCompanyScoped<BillOfMaterials[]>(STORAGE_KEYS.BOMS, initialBillOfMaterials, []),
    workstations: getCompanyScoped<Workstation[]>(STORAGE_KEYS.WORKSTATIONS, initialWorkstations, []),
    routings: getCompanyScoped<Routing[]>(STORAGE_KEYS.ROUTINGS, initialRoutings, []),
    workOrders: getCompanyScoped<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, initialWorkOrders, []),
    subcontractOrders: getCompanyScoped<SubcontractOrder[]>(STORAGE_KEYS.SUBCONTRACT_ORDERS, initialSubcontractOrders, []),
    autoServices: getCompanyScoped<AutoServiceRecord[]>(STORAGE_KEYS.AUTO_SERVICES, initialAutoServices, []),
    itServices: getCompanyScoped<ItServiceRecord[]>(STORAGE_KEYS.IT_SERVICES, initialItServices, []),
    applianceServices: getCompanyScoped<ApplianceServiceRecord[]>(STORAGE_KEYS.APPLIANCE_SERVICES, initialApplianceServices, []),
    constructionProjects: getCompanyScoped<ConstructionProject[]>(STORAGE_KEYS.CONSTRUCTION_PROJECTS, initialConstructionProjects, []),
    sectors: isDefault ? get<IndustrySector[]>(STORAGE_KEYS.SECTORS, initialSectors) : [],
    activeSectorId: isDefault ? get<string>(STORAGE_KEYS.ACTIVE_SECTOR, "catering") : "catering",
    foodRecipes: isDefault
      ? (() => {
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
        })()
      : getCompanyScoped<FoodRecipe[]>(STORAGE_KEYS.FOOD_RECIPES, [], []),
    foodMenus: getCompanyScoped<FoodMenuPlan[]>(STORAGE_KEYS.FOOD_MENUS, initialFoodMenus, []),
    foodProductionOrders: getCompanyScoped<FoodProductionOrder[]>(STORAGE_KEYS.FOOD_PRODUCTION_ORDERS, initialFoodProductionOrders, []),
    foodDispatches: getCompanyScoped<FoodDispatchDelivery[]>(STORAGE_KEYS.FOOD_DISPATCHES, initialFoodDispatches, []),
    foodWitnessSamples: getCompanyScoped<FoodWitnessSample[]>(STORAGE_KEYS.FOOD_SAMPLES, initialFoodWitnessSamples, []),
    fixedAssets: getCompanyScoped<FixedAsset[]>(STORAGE_KEYS.FIXED_ASSETS, INITIAL_FIXED_ASSETS, []),
    assetMaintenances: getCompanyScoped<AssetMaintenanceRecord[]>(STORAGE_KEYS.ASSET_MAINTENANCES, INITIAL_ASSET_MAINTENANCES, []),
    assetDisposals: getCompanyScoped<AssetDisposalRecord[]>(STORAGE_KEYS.ASSET_DISPOSALS, INITIAL_ASSET_DISPOSALS, []),
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

export function saveStoredData(key: keyof typeof STORAGE_KEYS, data: any, targetCompanyId?: string) {
  const activeCompId = targetCompanyId || getActiveCompanyId();
  const isDefault = activeCompId === DEFAULT_COMPANY.id;
  const storageKey = isDefault ? STORAGE_KEYS[key] : `${STORAGE_KEYS[key]}_${activeCompId}`;

  let payloadToSave = data;
  if (key === "SETTINGS" && data && typeof data === "object") {
    if (typeof data.logoUrl === "string" && data.logoUrl.startsWith("data:") && data.logoUrl.length > 50000) {
      payloadToSave = { ...data, logoUrl: "/logo.svg" };
    }
  } else if (key === "EDOCUMENTS" && Array.isArray(data)) {
    payloadToSave = compactEDocumentsForStorage(data, 200);
  }

  safeSetStorageItem(storageKey, JSON.stringify(payloadToSave));
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
