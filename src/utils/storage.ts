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

export const DELETED_COMPANIES_STORAGE_KEY = "muavin_deleted_companies_registry_v3";
export const DELETED_USERS_STORAGE_KEY = "muavin_deleted_users_registry_v3";

export const PROTECTED_COMPANY_IDS = new Set<string>([
  DEFAULT_COMPANY.id,
  DEFAULT_CORPORATE_COMPANY.id,
  DEFAULT_INDIVIDUAL_COMPANY.id,
]);

export const PROTECTED_USER_KEYS = new Set<string>([
  "usr_admin_001",
  "admin",
  "main_admin",
  "ilyasylldrm@gmail.com",
  "ilyasyildirim@outlook.com.tr",
  "admin@sirket.com",
  "admin@bilisim.com",
  "admin@tallsoft.com.tr",
  "test",
  "test@muavin.com",
  "usr_test",
  "usr_comp_comp_default",
  "anadolu_yonetici",
  "muhasebe@anadoluteknoloji.com.tr",
  "usr_anadolu_yonetici",
  "usr_comp_comp_kurumsal_default",
  "ahmet_yilmaz",
  "ahmet@yilmazticaret.com",
  "usr_ahmet_yilmaz",
  "usr_comp_comp_sahis_default",
]);

export function isProtectedCompanyId(companyId?: string | null): boolean {
  if (!companyId) return false;
  return PROTECTED_COMPANY_IDS.has(String(companyId).trim());
}

export function isProtectedUserIdentifier(
  user?: { userId?: string; id?: string; email?: string; username?: string } | null
): boolean {
  if (!user) return false;
  const uid = (user.userId || user.id || "").trim().toLowerCase();
  const email = (user.email || "").trim().toLowerCase();
  const uname = (user.username || "").trim().toLowerCase();
  if (uid && PROTECTED_USER_KEYS.has(uid)) return true;
  if (email && PROTECTED_USER_KEYS.has(email)) return true;
  if (uname && (PROTECTED_USER_KEYS.has(uname) || PROTECTED_USER_KEYS.has(`usr_${uname}`))) return true;
  return false;
}

export function getDeletedCompanyIds(): string[] {
  try {
    // Clean up legacy v1/v2 keys so no existing company remains hidden from earlier sessions
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem("muavin_deleted_companies_registry_v1");
        window.localStorage?.removeItem("muavin_deleted_companies_registry_v2");
      }
    } catch {}
    const raw = safeGetStorageItem(DELETED_COMPANIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (x) =>
            typeof x === "string" &&
            x.trim().length > 0 &&
            !PROTECTED_COMPANY_IDS.has(x.trim())
        )
      : [];
  } catch {
    return [];
  }
}

export function saveDeletedCompanyIds(ids: string[]): void {
  const unique = Array.from(
    new Set(
      ids
        .map((x) => String(x || "").trim())
        .filter((x) => Boolean(x) && !PROTECTED_COMPANY_IDS.has(x))
    )
  );
  safeSetStorageItem(DELETED_COMPANIES_STORAGE_KEY, JSON.stringify(unique));
}

export function isCompanyMarkedDeleted(companyId?: string | null): boolean {
  if (!companyId) return false;
  const cleanId = String(companyId).trim();
  if (!cleanId || PROTECTED_COMPANY_IDS.has(cleanId)) return false;
  return getDeletedCompanyIds().includes(cleanId);
}

export function getDeletedUserKeys(): string[] {
  try {
    // Clean up legacy v1/v2 keys so no existing user remains hidden from earlier sessions
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem("muavin_deleted_users_registry_v1");
        window.localStorage?.removeItem("muavin_deleted_users_registry_v2");
      }
    } catch {}
    const raw = safeGetStorageItem(DELETED_USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map((x) => String(x || "").trim().toLowerCase())
          .filter((x) => Boolean(x) && !PROTECTED_USER_KEYS.has(x))
      : [];
  } catch {
    return [];
  }
}

export function saveDeletedUserKeys(keys: string[]): void {
  const unique = Array.from(
    new Set(
      keys
        .map((x) => String(x || "").trim().toLowerCase())
        .filter((x) => Boolean(x) && !PROTECTED_USER_KEYS.has(x))
    )
  );
  safeSetStorageItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(unique));
}

export function isUserMarkedDeleted(
  user?: { userId?: string; id?: string; email?: string; username?: string } | null
): boolean {
  if (!user) return false;
  if (isProtectedUserIdentifier(user)) return false;
  const deletedSet = new Set(getDeletedUserKeys());
  if (deletedSet.size === 0) return false;
  const uid = (user.userId || user.id || "").trim().toLowerCase();
  const email = (user.email || "").trim().toLowerCase();
  const uname = (user.username || "").trim().toLowerCase();
  if (uid && deletedSet.has(uid)) return true;
  if (email && deletedSet.has(email)) return true;
  if (uname && (deletedSet.has(uname) || deletedSet.has(`usr_${uname}`))) return true;
  return false;
}

export function markUserAsDeleted(identifiers: {
  userId?: string;
  email?: string;
  username?: string;
  companyId?: string;
}): void {
  if (isProtectedUserIdentifier(identifiers)) return;
  const keys = new Set(getDeletedUserKeys());
  const uid = (identifiers.userId || "").trim().toLowerCase();
  const email = (identifiers.email || "").trim().toLowerCase();
  const uname = (identifiers.username || "").trim().toLowerCase();
  if (uid && !PROTECTED_USER_KEYS.has(uid)) keys.add(uid);
  if (email && !PROTECTED_USER_KEYS.has(email)) keys.add(email);
  if (uname && !PROTECTED_USER_KEYS.has(uname)) {
    keys.add(uname);
    keys.add(`usr_${uname}`);
  }
  saveDeletedUserKeys(Array.from(keys));
}

export function unmarkUserAsDeleted(identifiers: {
  userId?: string;
  email?: string;
  username?: string;
}): void {
  const uid = (identifiers.userId || "").trim().toLowerCase();
  const email = (identifiers.email || "").trim().toLowerCase();
  const uname = (identifiers.username || "").trim().toLowerCase();
  const toRemove = new Set<string>();
  if (uid) toRemove.add(uid);
  if (email) toRemove.add(email);
  if (uname) {
    toRemove.add(uname);
    toRemove.add(`usr_${uname}`);
  }
  if (toRemove.size === 0) return;
  const remaining = getDeletedUserKeys().filter((k) => !toRemove.has(k));
  saveDeletedUserKeys(remaining);
}

export function markCompanyAsDeleted(companyId: string, comp?: Partial<CompanyItem> | null): void {
  const cleanId = String(companyId || "").trim();
  if (!cleanId || PROTECTED_COMPANY_IDS.has(cleanId)) return;
  const current = new Set(getDeletedCompanyIds());
  current.add(cleanId);
  saveDeletedCompanyIds(Array.from(current));

  if (comp && !PROTECTED_COMPANY_IDS.has(cleanId)) {
    const uname = (comp.loginUsername || "").trim().toLowerCase();
    const email = (comp.loginEmail || (uname ? `${uname}@muavin.com` : "")).trim().toLowerCase();
    markUserAsDeleted({
      userId: uname ? `usr_${uname}` : `usr_comp_${cleanId}`,
      username: uname || undefined,
      email: email || undefined,
      companyId: cleanId,
    });
  }
}

export function unmarkCompanyAsDeleted(companyId: string): void {
  const cleanId = String(companyId || "").trim();
  if (!cleanId) return;
  const remaining = getDeletedCompanyIds().filter((id) => id !== cleanId);
  saveDeletedCompanyIds(remaining);
}

function ensureCompanyCredentials(comp: CompanyItem): { comp: CompanyItem; changed: boolean } {
  let changed = false;
  const copy = { ...comp };

  if (PROTECTED_COMPANY_IDS.has(copy.id) && copy.loginUserDeleted) {
    copy.loginUserDeleted = false;
    changed = true;
  }

  if (copy.loginUserDeleted && !PROTECTED_COMPANY_IDS.has(copy.id)) {
    return { comp: copy, changed };
  }

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
  const deletedIds = new Set(getDeletedCompanyIds());
  try {
    const raw = safeGetStorageItem(STORAGE_KEYS.COMPANIES_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let updated = false;
        let list = parsed.filter(
          (c) => c && c.id && (PROTECTED_COMPANY_IDS.has(c.id) || !deletedIds.has(c.id))
        );
        if (list.length !== parsed.length) {
          updated = true;
        }
        // Always guarantee that existing default companies are never missing
        if (!list.some((c) => c.id === DEFAULT_COMPANY.id)) {
          list.unshift(DEFAULT_COMPANY);
          updated = true;
        }
        if (!list.some((c) => c.id === DEFAULT_CORPORATE_COMPANY.id)) {
          list.push(DEFAULT_CORPORATE_COMPANY);
          updated = true;
        }
        if (!list.some((c) => c.id === DEFAULT_INDIVIDUAL_COMPANY.id)) {
          list.push(DEFAULT_INDIVIDUAL_COMPANY);
          updated = true;
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
    }
  } catch (e) {
    console.error("Error reading companies list", e);
  }
  const defaultList = [DEFAULT_COMPANY, DEFAULT_CORPORATE_COMPANY, DEFAULT_INDIVIDUAL_COMPANY];
  safeSetStorageItem("muavin_companies_seeded_v2", "1");
  safeSetStorageItem(STORAGE_KEYS.COMPANIES_LIST, JSON.stringify(defaultList));
  return defaultList;
}

export function saveCompaniesList(list: CompanyItem[], allowRemoval = false): void {
  const deletedIds = new Set(getDeletedCompanyIds());
  const mergedMap = new Map<string, CompanyItem>();

  // Always preserve existing non-deleted companies unless allowRemoval is explicitly true
  if (!allowRemoval) {
    try {
      const rawExisting = safeGetStorageItem(STORAGE_KEYS.COMPANIES_LIST);
      if (rawExisting) {
        const parsedExisting = JSON.parse(rawExisting);
        if (Array.isArray(parsedExisting)) {
          parsedExisting.forEach((c: CompanyItem) => {
            if (c && c.id && (PROTECTED_COMPANY_IDS.has(c.id) || !deletedIds.has(c.id))) {
              mergedMap.set(c.id, ensureCompanyCredentials(c).comp);
            }
          });
        }
      }
    } catch {}
  }

  (Array.isArray(list) ? list : []).forEach((c) => {
    if (c && c.id && (PROTECTED_COMPANY_IDS.has(c.id) || !deletedIds.has(c.id))) {
      const existing = mergedMap.get(c.id);
      mergedMap.set(c.id, ensureCompanyCredentials(existing ? { ...existing, ...c } : c).comp);
    }
  });

  // Always guarantee protected default companies remain present
  if (!mergedMap.has(DEFAULT_COMPANY.id)) {
    mergedMap.set(DEFAULT_COMPANY.id, DEFAULT_COMPANY);
  }
  if (!mergedMap.has(DEFAULT_CORPORATE_COMPANY.id)) {
    mergedMap.set(DEFAULT_CORPORATE_COMPANY.id, DEFAULT_CORPORATE_COMPANY);
  }
  if (!mergedMap.has(DEFAULT_INDIVIDUAL_COMPANY.id)) {
    mergedMap.set(DEFAULT_INDIVIDUAL_COMPANY.id, DEFAULT_INDIVIDUAL_COMPANY);
  }

  const finalCompanies = Array.from(mergedMap.values());
  safeSetStorageItem("muavin_companies_seeded_v2", "1");
  safeSetStorageItem(STORAGE_KEYS.COMPANIES_LIST, JSON.stringify(finalCompanies));
}

export function getActiveCompanyId(): string {
  try {
    const active = safeGetStorageItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
    const deletedIds = new Set(getDeletedCompanyIds());
    if (active && (PROTECTED_COMPANY_IDS.has(active) || !deletedIds.has(active))) return active;
    const companies = getCompaniesList();
    if (companies.length > 0) return companies[0].id;
  } catch (e) {
    // fallback
  }
  return DEFAULT_COMPANY.id;
}

export function setActiveCompanyId(id: string): void {
  safeSetStorageItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, id);
}

export function addCompanyItem(comp: CompanyItem): CompanyItem[] {
  unmarkCompanyAsDeleted(comp.id);
  if (comp.loginUsername) {
    unmarkUserAsDeleted({
      userId: `usr_${comp.loginUsername.trim().toLowerCase()}`,
      username: comp.loginUsername,
      email: comp.loginEmail,
    });
  }
  const current = getCompaniesList();
  const normalizedComp: CompanyItem = {
    ...comp,
    loginUserDeleted: false,
  };
  const exists = current.some((c) => c.id === normalizedComp.id);
  const updated = exists
    ? current.map((c) => (c.id === normalizedComp.id ? normalizedComp : c))
    : [...current, normalizedComp];
  saveCompaniesList(updated);
  return getCompaniesList();
}

export function updateCompanyItem(comp: CompanyItem): CompanyItem[] {
  unmarkCompanyAsDeleted(comp.id);
  if (comp.loginUsername) {
    unmarkUserAsDeleted({
      userId: `usr_${comp.loginUsername.trim().toLowerCase()}`,
      username: comp.loginUsername,
      email: comp.loginEmail,
    });
  }
  const current = getCompaniesList();
  const normalizedComp: CompanyItem = {
    ...comp,
    loginUserDeleted: false,
  };
  const exists = current.some((c) => c.id === normalizedComp.id);
  const updated = exists
    ? current.map((c) => (c.id === normalizedComp.id ? normalizedComp : c))
    : [...current, normalizedComp];
  saveCompaniesList(updated);
  return getCompaniesList();
}

export function deleteCompanyItem(id: string): CompanyItem[] {
  const current = getCompaniesList();
  if (PROTECTED_COMPANY_IDS.has(id)) {
    return current;
  }
  const targetComp = current.find((c) => c.id === id);
  markCompanyAsDeleted(id, targetComp);
  const updated = current.filter((c) => c.id !== id);
  saveCompaniesList(updated, true);

  // Clean up isolated storage slices for the deleted company
  try {
    Object.values(STORAGE_KEYS).forEach((baseKey) => {
      if (baseKey !== STORAGE_KEYS.COMPANIES_LIST && baseKey !== STORAGE_KEYS.ACTIVE_COMPANY_ID) {
        safeRemoveStorageItem(`${baseKey}__${id}`);
        safeRemoveStorageItem(`${baseKey}_${id}`);
      }
    });
  } catch (e) {
    // ignore storage cleanup errors
  }

  if (getActiveCompanyId() === id) {
    const nextActiveId = updated.length > 0 ? updated[0].id : DEFAULT_COMPANY.id;
    setActiveCompanyId(nextActiveId);
  }
  return getCompaniesList();
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
          if (raw && raw.length > 400000) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && typeof parsed.logoUrl === "string" && parsed.logoUrl.length > 350000) {
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
      // 4. In aggressive mode or when storage quota is exceeded, only purge non-essential UI layout/cache keys
      // NEVER delete any company data slices (_comp_*) so company historical data is always preserved across updates
      else if (aggressive) {
        if (
          key.startsWith("muavin_col_widths_") ||
          key.startsWith("muavin_col_vis_") ||
          key.startsWith("muavin_table_row_height") ||
          key.startsWith("tradres_")
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
 * evicts only transient UI/font/address caches and NEVER evicts any company's business data slices.
 */
function evictLargestNonCriticalKeys(protectedKey: string) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const entries: { key: string; size: number; priority: number }[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || k === protectedKey) continue;
      const isTransientCache =
        k.startsWith("tradres_") ||
        k.startsWith("muavin_font_") ||
        k.startsWith("muavin_col_widths_") ||
        k.startsWith("muavin_col_vis_") ||
        k.startsWith("muavin_table_row_height");
      if (!isTransientCache) continue;
      const val = window.localStorage.getItem(k) || "";
      entries.push({
        key: k,
        size: val.length,
        priority: 1,
      });
    }
    entries.sort((a, b) => a.priority - b.priority || b.size - a.size);
    let freed = 0;
    for (const item of entries) {
      try {
        const existingVal = window.localStorage.getItem(item.key);
        if (existingVal) {
          memoryStorageFallback.set(item.key, existingVal);
        }
        window.localStorage.removeItem(item.key);
        freed += item.size;
        if (freed > 1200000) break;
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
      defaultBankAccountName: compMeta.defaultBankAccountName || compMeta.companyTitle || compMeta.companyName || "",
      defaultBankName: compMeta.defaultBankName || initialCompanySettings.defaultBankName,
      defaultBankIban: compMeta.defaultBankIban || initialCompanySettings.defaultBankIban,
      phone: compMeta.phone || "",
      email: compMeta.email || "",
      website: compMeta.website || "",
      address: compMeta.address || "",
      city: compMeta.city || "İstanbul",
      district: compMeta.district || "",
      neighborhood: compMeta.neighborhood || "",
      street: compMeta.street || "",
      buildingNo: compMeta.buildingNo || "",
      doorNo: compMeta.doorNo || "",
      postalCode: compMeta.postalCode || "",
      addressDetails: compMeta.addressDetails,
      logoUrl: compMeta.logoUrl || "/logo.svg",
      logoScale: compMeta.logoScale ?? 1,
      mysoftCredentials: {
        tenantIdentifierNumber: compMeta.tenantIdentifierNumber || compMeta.vkn || compMeta.tckn || "",
      },
    };
    loadedSettings = get<CompanySettings>(`${STORAGE_KEYS.SETTINGS}_${activeCompId}`, initialForNewCompany);
  }

  if (compMeta) {
    loadedSettings = {
      ...loadedSettings,
      taxOffice: loadedSettings.taxOffice || compMeta.taxOffice || "Merkez",
      city: loadedSettings.city || compMeta.city || "İstanbul",
      district: loadedSettings.district || compMeta.district || "",
      neighborhood: loadedSettings.neighborhood || compMeta.neighborhood || loadedSettings.addressDetails?.neighborhood || "",
      street: loadedSettings.street || compMeta.street || loadedSettings.addressDetails?.street || "",
      buildingNo: loadedSettings.buildingNo || compMeta.buildingNo || loadedSettings.addressDetails?.buildingNo || "",
      doorNo: loadedSettings.doorNo || compMeta.doorNo || loadedSettings.addressDetails?.doorNo || "",
      postalCode: loadedSettings.postalCode || compMeta.postalCode || loadedSettings.addressDetails?.postalCode || "",
      address: loadedSettings.address || compMeta.address || loadedSettings.addressDetails?.fullAddress || "",
      defaultBankAccountName:
        loadedSettings.defaultBankAccountName ||
        compMeta.defaultBankAccountName ||
        loadedSettings.companyTitle ||
        loadedSettings.companyName ||
        "",
      defaultBankName:
        loadedSettings.defaultBankName ||
        compMeta.defaultBankName ||
        initialCompanySettings.defaultBankName ||
        "",
      defaultBankIban:
        loadedSettings.defaultBankIban ||
        compMeta.defaultBankIban ||
        initialCompanySettings.defaultBankIban ||
        "",
      logoUrl:
        compMeta.logoUrl && compMeta.logoUrl !== "/logo.svg"
          ? compMeta.logoUrl
          : loadedSettings.logoUrl || compMeta.logoUrl || "/logo.svg",
      logoScale: compMeta.logoScale ?? loadedSettings.logoScale ?? 1,
      tenantIdentifierNumber:
        loadedSettings.tenantIdentifierNumber || compMeta.tenantIdentifierNumber || compMeta.vkn || compMeta.tckn || "",
      mysoftStatus: loadedSettings.mysoftStatus || compMeta.mysoftStatus,
      eFaturaPrefix: loadedSettings.eFaturaPrefix || compMeta.eFaturaPrefix || "GIB",
      eFaturaNextNumber: loadedSettings.eFaturaNextNumber || compMeta.eFaturaNextNumber,
      eArsivPrefix: loadedSettings.eArsivPrefix || compMeta.eArsivPrefix || "EAR",
      eArsivNextNumber: loadedSettings.eArsivNextNumber || compMeta.eArsivNextNumber,
      defaultInvoicePrefix:
        loadedSettings.defaultInvoicePrefix || loadedSettings.eFaturaPrefix || compMeta.eFaturaPrefix || "GIB",
    };
  }

  const syncMainBranchWithSettings = (branchList: Branch[]): Branch[] => {
    if (!Array.isArray(branchList) || branchList.length === 0) return branchList;
    return branchList.map((br) => {
      if (!br.isMain) return br;
      const isUntouchedDemoMain =
        !br.address?.fullAddress ||
        br.address.fullAddress.includes("Büyükdere Cad. No:199") ||
        br.address.fullAddress === `${compMeta?.city || "İstanbul"} / ${compMeta?.district || "Merkez"}`;
      if (isUntouchedDemoMain && loadedSettings.address) {
        return {
          ...br,
          name:
            br.name === "Genel Merkez (Levent)" && loadedSettings.district
              ? `Genel Merkez (${loadedSettings.district})`
              : br.name,
          phone: loadedSettings.phone || br.phone,
          email: loadedSettings.email || br.email,
          address: {
            ...br.address,
            country: loadedSettings.country || br.address?.country || "Türkiye",
            city: loadedSettings.city || br.address?.city || "İstanbul",
            district: loadedSettings.district || br.address?.district || "",
            neighborhood: loadedSettings.neighborhood || br.address?.neighborhood || "",
            street: loadedSettings.street || br.address?.street || "",
            buildingNo: loadedSettings.buildingNo || br.address?.buildingNo || "",
            doorNo: loadedSettings.doorNo || br.address?.doorNo || "",
            postalCode: loadedSettings.postalCode || br.address?.postalCode || "",
            fullAddress: loadedSettings.address,
          },
        };
      }
      return br;
    });
  };

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
        const list = Array.isArray(stored) && stored.length > 0 ? stored : initialBranches;
        return syncMainBranchWithSettings(list);
      }
      const scopedKey = `${STORAGE_KEYS.BRANCHES}_${activeCompId}`;
      const existingRaw = safeGetStorageItem(scopedKey);
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed) && parsed.length > 0) return syncMainBranchWithSettings(parsed);
        } catch (_) {}
      }
      const defaultBranchForComp: Branch[] = [
        {
          id: `br_main_${activeCompId}`,
          code: "MRK-001",
          name: `${loadedSettings.companyName || compMeta.companyName || "İşletme"} - Merkez`,
          isMain: true,
          managerName: compMeta.companyType === "sahis" ? (compMeta.companyName?.split("-")[0]?.trim() || "İşletme Sahibi") : "Şube Müdürü",
          phone: loadedSettings.phone || compMeta.phone || "+90 (212) 000 00 00",
          email: loadedSettings.email || compMeta.email || "",
          status: "active",
          address: {
            country: "Türkiye",
            city: loadedSettings.city || compMeta.city || "İstanbul",
            district: loadedSettings.district || compMeta.district || "Merkez",
            neighborhood: loadedSettings.neighborhood || compMeta.neighborhood || "",
            street: loadedSettings.street || compMeta.street || "",
            buildingNo: loadedSettings.buildingNo || compMeta.buildingNo || "",
            doorNo: loadedSettings.doorNo || compMeta.doorNo || "",
            postalCode: loadedSettings.postalCode || compMeta.postalCode || "",
            fullAddress:
              loadedSettings.address ||
              compMeta.address ||
              `${loadedSettings.city || compMeta.city || "İstanbul"} / ${loadedSettings.district || compMeta.district || "Merkez"}`,
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
            neighborhood: compMeta.neighborhood || "",
            fullAddress: compMeta.address || `${compMeta.city || "İstanbul"} / ${compMeta.district || "Merkez"}`,
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
    costProjects: getCompanyScoped<CostProject[]>(STORAGE_KEYS.COST_PROJECTS, initialCostProjects, []),
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
    if (typeof data.logoUrl === "string" && data.logoUrl.startsWith("data:") && data.logoUrl.length > 350000) {
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

/**
 * Ensures that a manual or open address string starts with the selected city and district
 * followed by the open address details (e.g., "İstanbul / Kadıköy, Barbaros Mah. Çiğdem Sk. No: 14")
 * without duplicating them, and updates the city/district prefix when province or district changes.
 */
export function appendCityDistrictToAddress(
  rawAddress?: string,
  city?: string,
  district?: string,
  prevCity?: string,
  prevDistrict?: string
): string {
  const cleanCity = String(city || "").trim();
  const cleanDistrict = String(district || "").trim();
  const cleanPrevCity = String(prevCity || "").trim();
  const cleanPrevDistrict = String(prevDistrict || "").trim();
  const locationPrefix = [cleanCity, cleanDistrict].filter(Boolean).join(" / ");

  let base = String(rawAddress || "").trim();

  // Temporarily extract trailing postal code like "(PK: 34381)" so any city/district before it can be stripped cleanly
  let pkSuffix = "";
  const pkMatch = base.match(/\s*(\(PK:\s*[^)]+\))\s*$/i);
  if (pkMatch) {
    pkSuffix = pkMatch[1];
    base = base.slice(0, base.length - pkMatch[0].length).trim();
  }

  // Build candidate prefixes/suffixes to strip (from previous or current selections, in either order)
  const candidates = Array.from(
    new Set(
      [
        [cleanPrevCity, cleanPrevDistrict].filter(Boolean).join(" / "),
        [cleanPrevCity, cleanPrevDistrict].filter(Boolean).join("/"),
        [cleanPrevDistrict, cleanPrevCity].filter(Boolean).join(" / "),
        [cleanPrevDistrict, cleanPrevCity].filter(Boolean).join("/"),
        [cleanCity, cleanPrevDistrict].filter(Boolean).join(" / "),
        [cleanPrevDistrict, cleanCity].filter(Boolean).join(" / "),
        [cleanPrevCity, cleanDistrict].filter(Boolean).join(" / "),
        [cleanDistrict, cleanPrevCity].filter(Boolean).join(" / "),
        [cleanCity, cleanDistrict].filter(Boolean).join(" / "),
        [cleanCity, cleanDistrict].filter(Boolean).join("/"),
        [cleanDistrict, cleanCity].filter(Boolean).join(" / "),
        [cleanDistrict, cleanCity].filter(Boolean).join("/"),
        cleanPrevCity,
        cleanPrevDistrict,
        cleanCity,
        cleanDistrict,
      ].filter(Boolean)
    )
  ).sort((a, b) => b.length - a.length);

  let stripped = true;
  while (stripped && base) {
    stripped = false;
    const lowerBase = base.toLocaleLowerCase("tr-TR");
    for (const cand of candidates) {
      const lowerCand = cand.toLocaleLowerCase("tr-TR");
      if (lowerBase === lowerCand) {
        base = "";
        stripped = true;
        break;
      }

      // 1. Strip leading city/district prefix
      const leadPatterns = [
        `${lowerCand}, `,
        `${lowerCand} - `,
        `${lowerCand} / `,
        `${lowerCand},`,
        `${lowerCand}-`,
        ...(lowerCand.includes("/") ? [`${lowerCand} `] : []),
      ];
      let matchedLead = false;
      for (const pat of leadPatterns) {
        if (lowerBase.startsWith(pat)) {
          base = base.slice(pat.length).replace(/^[\s,\-/]+/, "").trim();
          stripped = true;
          matchedLead = true;
          break;
        }
      }
      if (matchedLead) break;

      // 2. Strip trailing city/district suffix
      const sepPatterns = [
        `, ${lowerCand}`,
        ` - ${lowerCand}`,
        ` / ${lowerCand}`,
        `,${lowerCand}`,
        ...(lowerCand.includes("/") ? [` ${lowerCand}`] : []),
      ];
      let matchedSep = false;
      for (const pat of sepPatterns) {
        if (lowerBase.endsWith(pat)) {
          base = base.slice(0, base.length - pat.length).replace(/[\s,\-/]+$/, "").trim();
          stripped = true;
          matchedSep = true;
          break;
        }
      }
      if (matchedSep) break;
    }
  }

  if (pkSuffix && base && !base.includes(pkSuffix)) {
    base = `${base} ${pkSuffix}`.trim();
  }

  if (!locationPrefix) {
    return base;
  }

  if (!base) {
    return locationPrefix;
  }

  return `${locationPrefix}, ${base}`;
}

/**
 * Formats an open address with city, district, and branch information (Şube Adı / Şube Kodu)
 * so that branch details visibly appear inside the address text without duplication.
 */
export function formatAddressWithBranch(
  rawAddress?: string,
  city?: string,
  district?: string,
  branchName?: string,
  branchCode?: string
): string {
  const baseAddr = appendCityDistrictToAddress(rawAddress, city, district);
  const cleanBranchName = String(branchName || "").trim();
  const cleanBranchCode = String(branchCode || "").trim();
  if (!cleanBranchName && !cleanBranchCode) {
    return baseAddr;
  }

  const branchLabel = cleanBranchName
    ? cleanBranchCode && !cleanBranchName.toLocaleLowerCase("tr-TR").includes(cleanBranchCode.toLocaleLowerCase("tr-TR"))
      ? `Şube: ${cleanBranchName} (${cleanBranchCode})`
      : cleanBranchName.toLocaleLowerCase("tr-TR").startsWith("şube")
      ? cleanBranchName
      : `Şube: ${cleanBranchName}`
    : `Şube Kodu: ${cleanBranchCode}`;

  if (!baseAddr) {
    return branchLabel;
  }

  const lowerAddr = baseAddr.toLocaleLowerCase("tr-TR");
  if (
    (cleanBranchName && lowerAddr.includes(cleanBranchName.toLocaleLowerCase("tr-TR"))) ||
    lowerAddr.includes(branchLabel.toLocaleLowerCase("tr-TR"))
  ) {
    return baseAddr;
  }

  return `${baseAddr} — ${branchLabel}`;
}

/**
 * Searches all companies' Cari Hesaplar (CONTACTS) and registered companies (COMPANIES_LIST)
 * for a matching VKN or TCKN, returning its saved taxOffice, city, district, neighborhood, and open address.
 */
export function findLocalTaxpayerByVknTckn(vknTckn: string): Partial<Contact> | null {
  const clean = String(vknTckn || "").replace(/\D/g, "").trim();
  if (!clean || (clean.length !== 10 && clean.length !== 11)) return null;

  try {
    const companies = getCompaniesList();
    // 1. Check all companies' CONTACTS slices (Cari Hesaplar)
    for (const comp of companies) {
      const storageKey = comp.id === DEFAULT_COMPANY.id ? STORAGE_KEYS.CONTACTS : `${STORAGE_KEYS.CONTACTS}_${comp.id}`;
      const raw = safeGetStorageItem(storageKey);
      const contactsList: Contact[] = raw ? JSON.parse(raw) : (comp.id === DEFAULT_COMPANY.id ? initialContacts : []);
      if (Array.isArray(contactsList)) {
        const matched = contactsList.find(
          (c) => c && String(c.taxNumber || "").replace(/\D/g, "").trim() === clean
        );
        if (matched) {
          return matched;
        }
      }
    }

    // 2. Check initialContacts fallback
    const initMatched = initialContacts.find(
      (c) => c && String(c.taxNumber || "").replace(/\D/g, "").trim() === clean
    );
    if (initMatched) return initMatched;

    // 3. Check registered companies list
    const compMatched = companies.find(
      (c) =>
        c &&
        (String(c.taxNumber || "").replace(/\D/g, "") === clean ||
          String(c.vkn || "").replace(/\D/g, "") === clean ||
          String(c.tckn || "").replace(/\D/g, "") === clean ||
          String(c.tenantIdentifierNumber || "").replace(/\D/g, "") === clean)
    );
    if (compMatched) {
      return {
        taxNumber: clean,
        name: compMatched.companyName,
        companyTitle: compMatched.companyTitle || compMatched.companyName,
        taxOffice: compMatched.taxOffice,
        city: compMatched.city,
        district: compMatched.district,
        neighborhood: compMatched.neighborhood,
        street: compMatched.street,
        buildingNo: compMatched.buildingNo,
        postalCode: compMatched.postalCode,
        address: compMatched.address,
        phone: compMatched.phone,
        email: compMatched.email,
      };
    }
  } catch {
    // ignore lookup error
  }
  return null;
}

/**
 * Normalizes Turkish title case for city/district/neighborhood (e.g. "İSTANBUL" -> "İstanbul", "SELÇUKLU" -> "Selçuklu")
 */
export function toTurkishTitleCase(text?: string): string {
  const raw = String(text || "").trim();
  if (!raw) return "";
  return raw
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1) : ""))
    .join(" ");
}

/**
 * Separates and normalizes Vergi Dairesi, İl, İlçe, Mahalle, and Açık Adres from a taxpayer lookup result.
 */
export function parseSeparateAddressFields(input: {
  taxOffice?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  doorNo?: string;
  postalCode?: string;
  address?: string;
}): {
  taxOffice: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  buildingNo: string;
  doorNo: string;
  postalCode: string;
  address: string;
} {
  const taxOffice = String(input.taxOffice || "").trim();
  const city = toTurkishTitleCase(input.city) || "İstanbul";
  const district = toTurkishTitleCase(input.district) || "";
  let neighborhood = String(input.neighborhood || "").trim();
  let street = String(input.street || "").trim();
  const buildingNo = String(input.buildingNo || "").trim();
  const doorNo = String(input.doorNo || "").trim();
  const postalCode = String(input.postalCode || "").trim();
  const rawAddress = String(input.address || "").trim();

  // If neighborhood is missing, try to extract "... Mahallesi" or "... Mah." from rawAddress or street
  if (!neighborhood) {
    const sourceText = rawAddress || street;
    const mahMatch = sourceText.match(/([A-ZÇĞİÖŞÜa-zçğıöşü0-9.\-]+(?:\s+[A-ZÇĞİÖŞÜa-zçğıöşü0-9.\-]+){0,2}\s+(?:Mahallesi|Mah\.|Mah))\b/i);
    if (mahMatch && mahMatch[1]) {
      // Remove any leading "İl / İlçe," if captured
      const candidate = mahMatch[1].replace(/^.*[,/]\s*/, "").trim();
      if (candidate) {
        neighborhood = candidate;
      }
    }
  }

  if (neighborhood && !/mah/i.test(neighborhood) && !neighborhood.includes("(")) {
    neighborhood = `${toTurkishTitleCase(neighborhood)} Mah.`;
  } else if (neighborhood && neighborhood === neighborhood.toLocaleUpperCase("tr-TR")) {
    neighborhood = toTurkishTitleCase(neighborhood);
  }

  // Build open address details if rawAddress is empty
  const detailParts = [neighborhood, street, buildingNo, doorNo].filter(Boolean);
  let baseOpenAddr = rawAddress || detailParts.join(" ");
  if (postalCode && baseOpenAddr && !baseOpenAddr.includes(postalCode)) {
    baseOpenAddr = `${baseOpenAddr} (PK: ${postalCode})`;
  }
  const fullOpenAddress = appendCityDistrictToAddress(baseOpenAddr, city, district);

  return {
    taxOffice,
    city,
    district,
    neighborhood,
    street,
    buildingNo,
    doorNo,
    postalCode,
    address: fullOpenAddress,
  };
}

/**
 * Synchronizes schema, Mysoft VKN/TCKN mappings, invoice prefixes, open addresses, and settings
 * across all registered companies and their isolated storage slices WITHOUT deleting or overwriting existing company data.
 */
export function syncAllCompaniesAndUsersData(): {
  syncedCompaniesCount: number;
  companies: CompanyItem[];
} {
  try {
    const currentList = getCompaniesList();
    const updatedCompanies = currentList.map((comp) => {
      const { comp: withCreds } = ensureCompanyCredentials(comp);
      const cleanTax = String(withCreds.tenantIdentifierNumber || withCreds.vkn || withCreds.tckn || withCreds.taxNumber || "").replace(/\D/g, "");
      const isTckn = cleanTax.length === 11;
      const syncedCompAddress = withCreds.address
        ? appendCityDistrictToAddress(withCreds.address, withCreds.city, withCreds.district)
        : withCreds.address;
      const normalizedComp: CompanyItem = {
        ...withCreds,
        address: syncedCompAddress || withCreds.address,
        taxNumber: cleanTax || withCreds.taxNumber || "",
        vkn: !isTckn && cleanTax.length === 10 ? cleanTax : withCreds.vkn || "",
        tckn: isTckn ? cleanTax : withCreds.tckn || "",
        tenantIdentifierNumber: cleanTax || withCreds.tenantIdentifierNumber || "",
        mysoftMatchedType: isTckn ? "tckn" : cleanTax.length === 10 ? "vkn" : withCreds.mysoftMatchedType || "vkn",
        mysoftStatus: cleanTax ? "verified" : withCreds.mysoftStatus || "unmatched",
        eFaturaPrefix: (withCreds.eFaturaPrefix || "GIB").toUpperCase().slice(0, 3),
        eArsivPrefix: (withCreds.eArsivPrefix || "EAR").toUpperCase().slice(0, 3),
      };

      // Non-destructively sync isolated company settings, contacts, and invoices slice for each company
      try {
        const companyData = getStoredData(normalizedComp.id);
        const settingsTax = String(companyData.settings.taxNumber || "").replace(/\D/g, "");
        if (settingsTax.length === 10 || settingsTax.length === 11) {
          normalizedComp.taxNumber = settingsTax;
          if (settingsTax.length === 10) normalizedComp.vkn = settingsTax;
          if (settingsTax.length === 11) normalizedComp.tckn = settingsTax;
        }
        const resolvedLogoUrl =
          normalizedComp.logoUrl && normalizedComp.logoUrl !== "/logo.svg"
            ? normalizedComp.logoUrl
            : companyData.settings.logoUrl || normalizedComp.logoUrl || "/logo.svg";
        const resolvedLogoScale = normalizedComp.logoScale ?? companyData.settings.logoScale ?? 1;
        normalizedComp.logoUrl = resolvedLogoUrl;
        normalizedComp.logoScale = resolvedLogoScale;
        normalizedComp.companyName = companyData.settings.companyName || normalizedComp.companyName;
        normalizedComp.companyTitle = companyData.settings.companyTitle || normalizedComp.companyTitle || normalizedComp.companyName;
        normalizedComp.taxOffice = companyData.settings.taxOffice || normalizedComp.taxOffice || "Merkez";
        normalizedComp.city = companyData.settings.city || normalizedComp.city || "İstanbul";
        normalizedComp.district = companyData.settings.district || normalizedComp.district;
        normalizedComp.neighborhood = companyData.settings.neighborhood || normalizedComp.neighborhood;
        normalizedComp.address = companyData.settings.address || normalizedComp.address;
        normalizedComp.defaultBankAccountName =
          companyData.settings.defaultBankAccountName ||
          normalizedComp.defaultBankAccountName ||
          companyData.settings.companyTitle ||
          normalizedComp.companyTitle;
        normalizedComp.defaultBankName = companyData.settings.defaultBankName || normalizedComp.defaultBankName;
        normalizedComp.defaultBankIban = companyData.settings.defaultBankIban || normalizedComp.defaultBankIban;

        const mergedSettings: CompanySettings = {
          ...companyData.settings,
          companyName: companyData.settings.companyName || normalizedComp.companyName,
          companyTitle: companyData.settings.companyTitle || normalizedComp.companyTitle || normalizedComp.companyName,
          taxOffice: companyData.settings.taxOffice || normalizedComp.taxOffice || "Merkez",
          taxNumber: companyData.settings.taxNumber || normalizedComp.taxNumber,
          vkn: companyData.settings.vkn || normalizedComp.vkn,
          tckn: companyData.settings.tckn || normalizedComp.tckn,
          city: companyData.settings.city || normalizedComp.city || "İstanbul",
          district: companyData.settings.district || normalizedComp.district || "",
          neighborhood: companyData.settings.neighborhood || normalizedComp.neighborhood || "",
          address: companyData.settings.address || normalizedComp.address || "",
          tenantIdentifierNumber: companyData.settings.tenantIdentifierNumber || normalizedComp.tenantIdentifierNumber,
          mysoftMatchedType: companyData.settings.mysoftMatchedType || normalizedComp.mysoftMatchedType,
          mysoftStatus: companyData.settings.mysoftStatus || normalizedComp.mysoftStatus,
          eFaturaPrefix: companyData.settings.eFaturaPrefix || normalizedComp.eFaturaPrefix || "GIB",
          eFaturaNextNumber: companyData.settings.eFaturaNextNumber || normalizedComp.eFaturaNextNumber,
          eArsivPrefix: companyData.settings.eArsivPrefix || normalizedComp.eArsivPrefix || "EAR",
          eArsivNextNumber: companyData.settings.eArsivNextNumber || normalizedComp.eArsivNextNumber,
          defaultInvoicePrefix: companyData.settings.defaultInvoicePrefix || normalizedComp.eFaturaPrefix || "GIB",
          defaultBankAccountName:
            companyData.settings.defaultBankAccountName ||
            normalizedComp.defaultBankAccountName ||
            companyData.settings.companyTitle ||
            normalizedComp.companyTitle ||
            "",
          defaultBankName: companyData.settings.defaultBankName || normalizedComp.defaultBankName,
          defaultBankIban: companyData.settings.defaultBankIban || normalizedComp.defaultBankIban,
          logoUrl: resolvedLogoUrl,
          logoScale: resolvedLogoScale,
        };
        saveStoredData("SETTINGS", mergedSettings, normalizedComp.id);

        if (Array.isArray(companyData.contacts) && companyData.contacts.length > 0) {
          let contactsChanged = false;
          const updatedContacts = companyData.contacts.map((c) => {
            if (c.city || c.district) {
              const nextAddr = appendCityDistrictToAddress(c.address, c.city, c.district);
              if (nextAddr && nextAddr !== c.address) {
                contactsChanged = true;
                return { ...c, address: nextAddr };
              }
            }
            return c;
          });
          if (contactsChanged) {
            saveStoredData("CONTACTS", updatedContacts, normalizedComp.id);
          }
        }

        if (Array.isArray(companyData.invoices) && companyData.invoices.length > 0) {
          let invoicesChanged = false;
          const updatedInvoices = companyData.invoices.map((inv) => {
            if (inv.customerCity || inv.customerDistrict) {
              const nextAddr = appendCityDistrictToAddress(
                inv.customerAddress,
                inv.customerCity,
                inv.customerDistrict
              );
              if (nextAddr && nextAddr !== inv.customerAddress) {
                invoicesChanged = true;
                return { ...inv, customerAddress: nextAddr };
              }
            }
            return inv;
          });
          if (invoicesChanged) {
            saveStoredData("INVOICES", updatedInvoices, normalizedComp.id);
          }
        }
      } catch {
        // ignore individual slice error
      }

      return normalizedComp;
    });

    saveCompaniesList(updatedCompanies);
    return {
      syncedCompaniesCount: updatedCompanies.length,
      companies: updatedCompanies,
    };
  } catch (err) {
    console.warn("syncAllCompaniesAndUsersData warning:", err);
    const fallback = getCompaniesList();
    return {
      syncedCompaniesCount: fallback.length,
      companies: fallback,
    };
  }
}

