import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Sidebar, NavItem } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { AuthModal, UserProfile, BRAND_LOGOS } from "./components/AuthModal";
import { GitHubPublishModal } from "./components/GitHubPublishModal";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { triggerFormErrorNotification } from "./context/FormErrorContext";
import { UniversalPrintModal } from "./components/common/UniversalPrintModal";

// Auto-recover from Vite module preload errors on new deployments/updates
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    console.warn("vite:preloadError detected, reloading window...", event);
    window.location.reload();
  });
}

// Self-healing dynamic import wrapper with retries and auto-reload for network/chunk resilience
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  interval = 800
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then((mod) => {
            try {
              sessionStorage.removeItem("chunk_reload_lock");
            } catch {
              // ignore storage errors in iframe/sandboxed environments
            }
            resolve(mod);
          })
          .catch((error) => {
            console.warn("Failed to dynamically load module, retrying...", error);
            if (remaining <= 1) {
              const isChunkError =
                error?.message?.includes("dynamically imported module") ||
                error?.message?.includes("Failed to fetch") ||
                error?.message?.includes("MIME type") ||
                error?.message?.includes("valid JavaScript") ||
                error?.name === "ChunkLoadError";
              let reloadLock = null;
              try {
                reloadLock = sessionStorage.getItem("chunk_reload_lock");
              } catch {
                // ignore
              }
              if (isChunkError && !reloadLock) {
                try {
                  sessionStorage.setItem("chunk_reload_lock", Date.now().toString());
                } catch {
                  // ignore
                }
                window.location.reload();
                return;
              }
              reject(error);
            } else {
              setTimeout(() => attempt(remaining - 1), interval);
            }
          });
      };
      attempt(retries);
    })
  );
}

// Lazy-loaded heavy tab modules for fast initial page load and automatic code splitting
const Contacts = lazyWithRetry(() => import("./components/Contacts").then((m) => ({ default: m.Contacts })));
const Invoices = lazyWithRetry(() => import("./components/Invoices").then((m) => ({ default: m.Invoices })));
const Quotes = lazyWithRetry(() => import("./components/Quotes").then((m) => ({ default: m.Quotes })));
const Orders = lazyWithRetry(() => import("./components/Orders").then((m) => ({ default: m.Orders })));
const Waybills = lazyWithRetry(() => import("./components/Waybills").then((m) => ({ default: m.Waybills })));
const Accounts = lazyWithRetry(() => import("./components/Accounts").then((m) => ({ default: m.Accounts })));
const Transactions = lazyWithRetry(() => import("./components/Transactions").then((m) => ({ default: m.Transactions })));
const Products = lazyWithRetry(() => import("./components/Products").then((m) => ({ default: m.Products || m.default })));
const Reports = lazyWithRetry(() => import("./components/Reports").then((m) => ({ default: m.Reports })));
const Settings = lazyWithRetry(() => import("./components/Settings").then((m) => ({ default: m.Settings })));
const CompanyManagement = lazyWithRetry(() => import("./components/CompanyManagement").then((m) => ({ default: m.CompanyManagement })));
const EServices = lazyWithRetry(() => import("./components/EServices").then((m) => ({ default: m.EServices })));
const EDocuments = lazyWithRetry(() => import("./components/EDocuments"));
const HRManagement = lazyWithRetry(() => import("./components/HRManagement").then((m) => ({ default: m.default || m.HRManagement })));
const FileManager = lazyWithRetry(() => import("./components/FileManager").then((m) => ({ default: m.FileManager })));
const AdminDashboard = lazyWithRetry(() => import("./components/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const WhatsAppCenter = lazyWithRetry(() => import("./components/WhatsAppCenter").then((m) => ({ default: m.WhatsAppCenter })));
const AutoServiceModule = lazyWithRetry(() => import("./components/AutoService/AutoServiceModule").then((m) => ({ default: m.AutoServiceModule })));
const ITServiceModule = lazyWithRetry(() => import("./components/ITService/ITServiceModule").then((m) => ({ default: m.ITServiceModule })));
const ApplianceServiceModule = lazyWithRetry(() => import("./components/ApplianceService/ApplianceServiceModule").then((m) => ({ default: m.ApplianceServiceModule })));
const ConstructionCostingModule = lazyWithRetry(() => import("./components/ConstructionCosting/ConstructionCostingModule").then((m) => ({ default: m.default || m.ConstructionCostingModule })));
const FixedAssetsModule = lazyWithRetry(() => import("./components/FixedAssets/FixedAssetsModule").then((m) => ({ default: m.FixedAssetsModule })));
const ProductionModule = lazyWithRetry(() => import("./components/Production/ProductionModule").then((m) => ({ default: m.ProductionModule || (m as any).default })));
const SectorsModule = lazyWithRetry(() => import("./components/Sectors/SectorsModule").then((m) => ({ default: m.SectorsModule })));

import {
  getStoredData,
  saveStoredData,
  cleanupOversizedStorage,
  resetToDemoData,
  exportBackupJSON,
  importBackupJSON,
  getCompaniesList,
  getActiveCompanyId,
  setActiveCompanyId,
  addCompanyItem,
  updateCompanyItem,
  deleteCompanyItem,
  DEFAULT_COMPANY,
  syncAllCompaniesAndUsersData,
} from "./utils/storage";
import { verifyAndSyncAllUsersLocalDb } from "./services/systemSyncService";
import { readStoredMysoftTenantVkn, writeStoredMysoftTenantVkn } from "./utils/mysoftTenantStorage";
import { CompanyModal } from "./components/CompanyModal";

import {
  Contact,
  Invoice,
  Account,
  Transaction,
  Product,
  Quote,
  Order,
  Waybill,
  CompanySettings,
  CompanyItem,
  Cheque,
  ChequeStatus,
  PromissoryNote,
  PromissoryNoteStatus,
  Branch,
  Warehouse,
  Employee,
  LeaveRequest,
  AdvanceRequest,
  LegalDeduction,
  CostProject,
  AssetCustody,
  MysoftEDocument,
  getContactAccountCode,
  AutoServiceRecord,
  ItServiceRecord,
  ApplianceServiceRecord,
  ConstructionProject,
  FixedAsset,
  AssetMaintenanceRecord,
  AssetDisposalRecord,
  isAdminOrSysAdmin,
  isModuleOrSubModuleAllowed,
} from "./types";

import { Plus, FileText, Users, ArrowUpRight, ArrowDownLeft, X, Lock } from "lucide-react";
import { DetailPageLayout } from "./components/common/DetailPageLayout";

import { FinanceSubModule } from "./components/Accounts";
import { useDataGridRowHighlight } from "./hooks/useDataGridRowHighlight";
import { useDataGridRowResizing } from "./hooks/useDataGridRowResizing";
import { useDataGridColumnResizing } from "./hooks/useDataGridColumnResizing";
import { fetchCloudLogo, subscribeToCloudLogo } from "./services/cloudBrandingService";

const TabLoadingSkeleton = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-7 bg-slate-200 rounded-lg w-48"></div>
      <div className="h-9 bg-slate-200 rounded-xl w-32"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
      <div className="h-24 bg-slate-200 rounded-2xl"></div>
    </div>
    <div className="h-80 bg-slate-200 rounded-2xl border border-slate-200"></div>
  </div>
);

export default function App() {
  // Institutional data grid row click highlight animation (periwinkle-wash)
  useDataGridRowHighlight();
  // Interactive data grid row resizing across all tables
  useDataGridRowResizing();
  // Interactive data grid column resizing & localStorage persistence across all tables
  useDataGridColumnResizing();

  const [currentTab, setCurrentTab] = useState<NavItem>("dashboard");
  const [financeSubTab, setFinanceSubTab] = useState<FinanceSubModule>("kasa");
  const [selectedConstructionProjectId, setSelectedConstructionProjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Storage State
  const [data, setData] = useState(() => getStoredData());

  // Multi-Company State
  const [companies, setCompanies] = useState<CompanyItem[]>(() => getCompaniesList());
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => getActiveCompanyId());
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);

  const handleSelectCompany = (companyId: string, compList?: CompanyItem[]) => {
    setActiveCompanyId(companyId);
    setActiveCompanyIdState(companyId);
    const freshData = getStoredData(companyId);
    const effectiveList = compList || companies;
    const comp = effectiveList.find((c) => c.id === companyId);
    if (comp) {
      writeStoredMysoftTenantVkn(comp.tenantIdentifierNumber || comp.vkn || comp.tckn);
      freshData.settings = {
        ...freshData.settings,
        companyName: comp.companyName,
        companyTitle: comp.companyTitle || comp.companyName,
        taxOffice: comp.taxOffice || "Merkez",
        taxNumber: comp.tenantIdentifierNumber || comp.vkn || comp.tckn || freshData.settings.taxNumber,
        vkn: comp.vkn,
        tckn: comp.tckn,
        mysoftMatchedType: comp.mysoftMatchedType,
        tenantIdentifierNumber: comp.tenantIdentifierNumber,
        mysoftStatus: comp.mysoftStatus,
        eFaturaPrefix: comp.eFaturaPrefix,
        eFaturaNextNumber: comp.eFaturaNextNumber,
        eArsivPrefix: comp.eArsivPrefix,
        eArsivNextNumber: comp.eArsivNextNumber,
        defaultInvoicePrefix: comp.eFaturaPrefix || freshData.settings.defaultInvoicePrefix,
      };
    }
    setData(freshData);
  };

  const handleAddCompany = (newComp: CompanyItem, makeActiveImmediately = true) => {
    const updatedList = addCompanyItem(newComp);
    setCompanies(updatedList);
    if (makeActiveImmediately) {
      handleSelectCompany(newComp.id, updatedList);
    }
  };

  const handleUpdateCompany = (comp: CompanyItem) => {
    const updatedList = updateCompanyItem(comp);
    setCompanies(updatedList);
    if (activeCompanyId === comp.id) {
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          companyName: comp.companyName,
          companyTitle: comp.companyTitle,
          taxOffice: comp.taxOffice,
          taxNumber: comp.tenantIdentifierNumber || comp.vkn || comp.tckn || prev.settings.taxNumber,
          vkn: comp.vkn,
          tckn: comp.tckn,
          mysoftMatchedType: comp.mysoftMatchedType,
          tenantIdentifierNumber: comp.tenantIdentifierNumber,
          mysoftStatus: comp.mysoftStatus,
          eFaturaPrefix: comp.eFaturaPrefix,
          eFaturaNextNumber: comp.eFaturaNextNumber,
          eArsivPrefix: comp.eArsivPrefix,
          eArsivNextNumber: comp.eArsivNextNumber,
          defaultInvoicePrefix: comp.eFaturaPrefix || prev.settings.defaultInvoicePrefix,
          mysoftCredentials: {
            tenantIdentifierNumber: comp.tenantIdentifierNumber,
          },
        },
      }));
      writeStoredMysoftTenantVkn(comp.tenantIdentifierNumber || comp.vkn || comp.tckn);
    }
  };

  const handleDeleteCompany = (id: string) => {
    const updatedList = deleteCompanyItem(id);
    setCompanies(updatedList);
    if (activeCompanyId === id) {
      const nextId = updatedList.length > 0 ? updatedList[0].id : DEFAULT_COMPANY.id;
      handleSelectCompany(nextId, updatedList);
    }
  };

  // Quick Action Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [initialContactIdForInvoice, setInitialContactIdForInvoice] = useState<string | null>(null);
  const [isGitHubPublishOpen, setIsGitHubPublishOpen] = useState(false);

  // Restore GitHub PAT from browser localStorage after container restarts & sync all companies/users
  const githubAutoSyncedRef = useRef(false);
  useEffect(() => {
    if (githubAutoSyncedRef.current) return;
    githubAutoSyncedRef.current = true;

    const synced = syncAllCompaniesAndUsersData();
    if (synced.companies.length > 0) {
      setCompanies(synced.companies);
    }
    void verifyAndSyncAllUsersLocalDb(
      0,
      "Sistem Yöneticisi",
      "Tüm Şirketler ve Kullanıcılar Senkronize Edildi"
    );

    const handleCentralSync = () => {
      const freshCompanies = getCompaniesList();
      setCompanies(freshCompanies);
      const currentActive = getActiveCompanyId();
      setData(getStoredData(currentActive));
    };
    window.addEventListener("muavin:central-sync-broadcast", handleCentralSync);

    const savedToken = localStorage.getItem("muavin_github_pat")?.trim();
    const savedRepo = localStorage.getItem("muavin_github_repo_url")?.trim();
    if (savedToken) {
      (async () => {
        try {
          await fetch("/api/github/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: savedToken,
              repoUrl: savedRepo || undefined,
            }),
          });
        } catch {
          // Ignore background config sync errors
        }
      })();
    }

    return () => {
      window.removeEventListener("muavin:central-sync-broadcast", handleCentralSync);
    };
  }, []);

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem("muavin_active_user") || sessionStorage.getItem("muavin_active_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(() => currentUser === null);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  // Auto switch admin to admin tab on login
  useEffect(() => {
    const userEmail = currentUser?.email?.toLowerCase().trim() || "";
    const isSysAdmin =
      currentUser?.id === "nuT309AyQxQKddnAp1ZJjlSgBXt2" ||
      currentUser?.id === "usr_admin_001" ||
      currentUser?.role?.includes("Admin") ||
      userEmail === "ilyasyildirim@outlook.com.tr" ||
      userEmail === "ilyasylldrm@gmail.com" ||
      userEmail.includes("admin");

    if (currentUser && isSysAdmin) {
      setCurrentTab("admin");
    }
  }, [currentUser]);

  // Oturum açan kullanıcının tanımlı bir şirketi varsa aktif şirketi otomatik olarak o şirkete geçir
  useEffect(() => {
    if (currentUser?.companyId && currentUser.companyId !== activeCompanyId) {
      handleSelectCompany(currentUser.companyId);
    }
  }, [currentUser?.companyId]);

  useEffect(() => {
    cleanupOversizedStorage();
  }, []);

  // Google Cloud Console: Logoyu ve kurumsal kimlik ayarlarını Firestore'dan çek ve canlı dinle
  useEffect(() => {
    // 1. İlk açılışta Cloud Console'dan çek
    fetchCloudLogo().then((branding) => {
      if (branding?.logoUrl) {
        setData((prev) => {
          if (prev.settings?.logoUrl !== branding.logoUrl) {
            return {
              ...prev,
              settings: {
                ...prev.settings,
                logoUrl: branding.logoUrl,
              },
            };
          }
          return prev;
        });
      }
    });

    // 2. Cloud Console Firestore (system_settings/branding) gerçek zamanlı güncellemelerini dinle
    const unsubscribe = subscribeToCloudLogo((branding) => {
      if (branding?.logoUrl) {
        setData((prev) => {
          if (prev.settings?.logoUrl !== branding.logoUrl) {
            return {
              ...prev,
              settings: {
                ...prev.settings,
                logoUrl: branding.logoUrl,
              },
            };
          }
          return prev;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenAuthModal = (mode: "login" | "register") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("muavin_active_user");
    sessionStorage.removeItem("muavin_active_user");
    setCurrentUser(null);
    setAuthModalMode("login");
    setAuthModalOpen(true);
  };

  // Sync state changes with localStorage per slice (scoped to activeCompanyId)
  useEffect(() => { saveStoredData("SETTINGS", data.settings, activeCompanyId); }, [data.settings, activeCompanyId]);
  useEffect(() => { saveStoredData("CONTACTS", data.contacts, activeCompanyId); }, [data.contacts, activeCompanyId]);
  useEffect(() => { saveStoredData("ACCOUNTS", data.accounts, activeCompanyId); }, [data.accounts, activeCompanyId]);
  useEffect(() => { saveStoredData("INVOICES", data.invoices, activeCompanyId); }, [data.invoices, activeCompanyId]);
  useEffect(() => { saveStoredData("TRANSACTIONS", data.transactions, activeCompanyId); }, [data.transactions, activeCompanyId]);
  useEffect(() => { saveStoredData("PRODUCTS", data.products, activeCompanyId); }, [data.products, activeCompanyId]);
  useEffect(() => { saveStoredData("QUOTES", data.quotes, activeCompanyId); }, [data.quotes, activeCompanyId]);
  useEffect(() => { if (data.orders) saveStoredData("ORDERS", data.orders, activeCompanyId); }, [data.orders, activeCompanyId]);
  useEffect(() => { if (data.waybills) saveStoredData("WAYBILLS", data.waybills, activeCompanyId); }, [data.waybills, activeCompanyId]);
  useEffect(() => { if (data.cheques) saveStoredData("CHEQUES", data.cheques, activeCompanyId); }, [data.cheques, activeCompanyId]);
  useEffect(() => { if (data.promissoryNotes) saveStoredData("PROMISSORY_NOTES", data.promissoryNotes, activeCompanyId); }, [data.promissoryNotes, activeCompanyId]);
  useEffect(() => { if (data.branches) saveStoredData("BRANCHES", data.branches, activeCompanyId); }, [data.branches, activeCompanyId]);
  useEffect(() => { if (data.warehouses) saveStoredData("WAREHOUSES", data.warehouses, activeCompanyId); }, [data.warehouses, activeCompanyId]);
  useEffect(() => { if (data.employees) saveStoredData("EMPLOYEES", data.employees, activeCompanyId); }, [data.employees, activeCompanyId]);
  useEffect(() => { if (data.leaveRequests) saveStoredData("LEAVE_REQUESTS", data.leaveRequests, activeCompanyId); }, [data.leaveRequests, activeCompanyId]);
  useEffect(() => { if (data.advanceRequests) saveStoredData("ADVANCE_REQUESTS", data.advanceRequests, activeCompanyId); }, [data.advanceRequests, activeCompanyId]);
  useEffect(() => { if (data.legalDeductions) saveStoredData("LEGAL_DEDUCTIONS", data.legalDeductions, activeCompanyId); }, [data.legalDeductions, activeCompanyId]);
  useEffect(() => { if (data.costProjects) saveStoredData("COST_PROJECTS", data.costProjects, activeCompanyId); }, [data.costProjects, activeCompanyId]);
  useEffect(() => { if (data.assetCustodies) saveStoredData("ASSET_CUSTODIES", data.assetCustodies, activeCompanyId); }, [data.assetCustodies, activeCompanyId]);
  useEffect(() => { if (data.boms) saveStoredData("BOMS", data.boms, activeCompanyId); }, [data.boms, activeCompanyId]);
  useEffect(() => { if (data.routings) saveStoredData("ROUTINGS", data.routings, activeCompanyId); }, [data.routings, activeCompanyId]);
  useEffect(() => { if (data.workstations) saveStoredData("WORKSTATIONS", data.workstations, activeCompanyId); }, [data.workstations, activeCompanyId]);
  useEffect(() => { if (data.workOrders) saveStoredData("WORK_ORDERS", data.workOrders, activeCompanyId); }, [data.workOrders, activeCompanyId]);
  useEffect(() => { if (data.subcontractOrders) saveStoredData("SUBCONTRACT_ORDERS", data.subcontractOrders, activeCompanyId); }, [data.subcontractOrders, activeCompanyId]);
  useEffect(() => { if (data.autoServices) saveStoredData("AUTO_SERVICES", data.autoServices, activeCompanyId); }, [data.autoServices, activeCompanyId]);
  useEffect(() => { if (data.itServices) saveStoredData("IT_SERVICES", data.itServices, activeCompanyId); }, [data.itServices, activeCompanyId]);
  useEffect(() => { if (data.applianceServices) saveStoredData("APPLIANCE_SERVICES", data.applianceServices, activeCompanyId); }, [data.applianceServices, activeCompanyId]);
  useEffect(() => { if (data.constructionProjects) saveStoredData("CONSTRUCTION_PROJECTS", data.constructionProjects, activeCompanyId); }, [data.constructionProjects, activeCompanyId]);

  // Auto & IT & Appliance & Construction Service Handlers
  const handleUpdateAutoServices = (services: AutoServiceRecord[]) => {
    setData((prev) => ({ ...prev, autoServices: services }));
  };

  const handleUpdateItServices = (services: ItServiceRecord[]) => {
    setData((prev) => ({ ...prev, itServices: services }));
  };

  const handleUpdateApplianceServices = (services: ApplianceServiceRecord[]) => {
    setData((prev) => ({ ...prev, applianceServices: services }));
  };

  const handleUpdateConstructionProjects = (projects: ConstructionProject[]) => {
    setData((prev) => ({ ...prev, constructionProjects: projects }));
  };

  // Handlers for Cost Projects
  const handleAddCostProject = (newProject: CostProject) => {
    setData((prev) => ({
      ...prev,
      costProjects: [newProject, ...(prev.costProjects || [])],
    }));
  };

  const handleUpdateCostProject = (updatedProject: CostProject) => {
    setData((prev) => ({
      ...prev,
      costProjects: (prev.costProjects || []).map((p) => (p.id === updatedProject.id ? updatedProject : p)),
    }));
  };

  const handleDeleteCostProject = (projectId: string) => {
    setData((prev) => ({
      ...prev,
      costProjects: (prev.costProjects || []).filter((p) => p.id !== projectId),
    }));
  };

  // Handlers for Waybills (İrsaliyeler)
  const handleAddWaybill = (newWaybill: Waybill) => {
    setData((prev) => ({
      ...prev,
      waybills: [newWaybill, ...(prev.waybills || [])],
    }));
  };

  const handleUpdateWaybill = (updatedWaybill: Waybill) => {
    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).map((w) => (w.id === updatedWaybill.id ? updatedWaybill : w)),
    }));
  };

  const handleDeleteWaybill = (waybillId: string) => {
    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).filter((w) => w.id !== waybillId),
    }));
  };

  const handleBulkDeleteWaybills = (ids: string[]) => {
    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).filter((w) => !ids.includes(w.id)),
    }));
  };

  const handleConvertWaybillToInvoice = (waybill: Waybill) => {
    const prefix = waybill.type === "dispatch" ? "FAT-SEVK-" : "FAT-AL-";
    const nextSeq = String((data.invoices || []).length + 1).padStart(6, "0");

    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: `${prefix}${nextSeq}`,
      type: waybill.type === "dispatch" ? "sales" : "purchase",
      contactId: waybill.contactId,
      contactName: waybill.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: waybill.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate || 0,
        totalWithoutVat: item.totalWithoutVat,
        vatAmount: item.vatAmount,
        totalWithVat: item.totalWithVat,
      })),
      subtotal: waybill.subtotal,
      totalVat: waybill.totalVat,
      grandTotal: waybill.grandTotal,
      currency: waybill.currency || "₺",
      paidAmount: 0,
      remainingAmount: waybill.grandTotal,
      status: "sent",
      notes: `İrsaliye No: ${waybill.waybillNumber} faturalandırıldı. (Plaka: ${waybill.vehiclePlate || "-"}, Sürücü: ${waybill.driverName || "-"})`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedWaybill: Waybill = {
      ...waybill,
      status: "invoiced",
      invoicedInvoiceId: newInvoice.id,
      invoicedInvoiceNumber: newInvoice.invoiceNumber,
    };

    setData((prev) => {
      const updatedWaybills = (prev.waybills || []).map((w) => (w.id === waybill.id ? updatedWaybill : w));
      const updatedInvoices = [newInvoice, ...prev.invoices];

      const updatedProducts = prev.products.map((p) => {
        const item = waybill.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const qty = item.quantity;
        const newStock = waybill.type === "dispatch" ? p.stockQuantity - qty : p.stockQuantity + qty;
        return { ...p, stockQuantity: newStock < 0 ? 0 : newStock };
      });

      const updatedContacts = prev.contacts.map((c) => {
        if (c.id !== waybill.contactId) return c;
        const currentBal = c.balance || 0;
        const change = waybill.type === "dispatch" ? waybill.grandTotal : -waybill.grandTotal;
        const newBal = currentBal + change;
        return {
          ...c,
          balance: newBal,
          balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        waybills: updatedWaybills,
        products: updatedProducts,
        contacts: updatedContacts,
      };
    });
  };

  // Handlers for Orders
  const handleAddOrder = (newOrder: Order) => {
    setData((prev) => ({
      ...prev,
      orders: [newOrder, ...(prev.orders || [])],
    }));
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    }));
  };

  const handleDeleteOrder = (orderId: string) => {
    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).filter((o) => o.id !== orderId),
    }));
  };

  const handleBulkDeleteOrders = (ids: string[]) => {
    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).filter((o) => !ids.includes(o.id)),
    }));
  };

  const handleConvertOrderToInvoice = (order: Order) => {
    // 1. Create a new Invoice from Order
    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber:
        order.type === "sales"
          ? "FAT-SAT-" + Date.now().toString().slice(-6)
          : "FAT-AL-" + Date.now().toString().slice(-6),
      type: order.type === "sales" ? "sales" : "purchase",
      contactId: order.contactId,
      contactName: order.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: order.deliveryDate || new Date().toISOString().split("T")[0],
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountRate: item.discountRate || 0,
        totalWithoutVat: item.totalWithoutVat,
        vatAmount: item.vatAmount,
        totalWithVat: item.totalWithVat,
      })),
      subtotal: order.subtotal,
      totalVat: order.totalVat,
      grandTotal: order.grandTotal,
      currency: order.currency || "₺",
      paidAmount: 0,
      remainingAmount: order.grandTotal,
      status: "sent",
      notes: `Sipariş No: ${order.orderNumber} faturaya dönüştürüldü. ${order.notes || ""}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // 2. Update Order status to 'converted'
    const updatedOrder: Order = {
      ...order,
      status: "converted",
    };

    // 3. Update products stock and contacts balance
    setData((prev) => {
      const updatedInvoices = [newInvoice, ...prev.invoices];
      const updatedOrders = (prev.orders || []).map((o) => (o.id === order.id ? updatedOrder : o));

      const updatedProducts = prev.products.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const qty = item.quantity;
        const newStock = order.type === "sales" ? p.stockQuantity - qty : p.stockQuantity + qty;
        return { ...p, stockQuantity: newStock < 0 ? 0 : newStock };
      });

      const updatedContacts = prev.contacts.map((c) => {
        if (c.id !== order.contactId) return c;
        const currentBal = c.balance || 0;
        const change = order.type === "sales" ? order.grandTotal : -order.grandTotal;
        return { ...c, balance: currentBal + change };
      });

      return {
        ...prev,
        invoices: updatedInvoices,
        orders: updatedOrders,
        products: updatedProducts,
        contacts: updatedContacts,
      };
    });
  };

  // Handlers for Branches
  const handleAddBranch = (branch: Branch) => {
    setData((prev) => ({
      ...prev,
      branches: [branch, ...(prev.branches || [])],
    }));
  };

  const handleUpdateBranch = (branch: Branch) => {
    setData((prev) => ({
      ...prev,
      branches: (prev.branches || []).map((b) => (b.id === branch.id ? branch : b)),
    }));
  };

  const handleDeleteBranch = (id: string) => {
    setData((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((b) => b.id !== id),
    }));
  };

  // Handlers for Warehouses
  const handleAddWarehouse = (wh: Warehouse) => {
    setData((prev) => ({
      ...prev,
      warehouses: [wh, ...(prev.warehouses || [])],
    }));
  };

  const handleUpdateWarehouse = (wh: Warehouse) => {
    setData((prev) => ({
      ...prev,
      warehouses: (prev.warehouses || []).map((w) => (w.id === wh.id ? wh : w)),
    }));
  };

  const handleDeleteWarehouse = (id: string) => {
    setData((prev) => ({
      ...prev,
      warehouses: (prev.warehouses || []).filter((w) => w.id !== id),
    }));
  };

  // Handlers for Accounts & Finance Entities
  const handleUpdateAccount = (account: Account) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === account.id ? account : a)),
    }));
  };

  const handleDeleteAccount = (id: string) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  };

  const handleUpdateTransaction = (tx: Transaction) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === tx.id ? tx : t)),
    }));
  };

  const handleUpdateCheque = (cheque: Cheque) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).map((c) => (c.id === cheque.id ? cheque : c)),
    }));
  };

  const handleUpdatePromissoryNote = (note: PromissoryNote) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).map((n) => (n.id === note.id ? note : n)),
    }));
  };

  // Handlers
  const handleAddContact = (contact: Contact) => {
    setData((prev) => ({
      ...prev,
      contacts: [contact, ...prev.contacts],
    }));
  };

  const handleUpdateContact = (contact: Contact) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === contact.id ? contact : c)),
    }));
  };

  const handleDeleteContact = (id: string) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  };

  const handleBulkDeleteContacts = (ids: string[]) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => !ids.includes(c.id)),
    }));
  };

  const handleBulkAddContacts = (newContacts: Contact[], updateExisting = false) => {
    if (!newContacts.length) return;
    setData((prev) => {
      if (!updateExisting) {
        return {
          ...prev,
          contacts: [...newContacts, ...prev.contacts],
        };
      }
      const updatedList = [...prev.contacts];
      const toAppend: Contact[] = [];

      for (const nc of newContacts) {
        let matchedIdx = -1;
        if (nc.taxNumber && nc.taxNumber.trim()) {
          matchedIdx = updatedList.findIndex(
            (c) => c.taxNumber && c.taxNumber.trim() === nc.taxNumber!.trim()
          );
        }
        if (matchedIdx === -1 && nc.name && nc.name.trim()) {
          matchedIdx = updatedList.findIndex(
            (c) => c.name.trim().toLowerCase() === nc.name.trim().toLowerCase()
          );
        }

        if (matchedIdx >= 0) {
          updatedList[matchedIdx] = {
            ...updatedList[matchedIdx],
            ...nc,
            id: updatedList[matchedIdx].id,
          };
        } else {
          toAppend.push(nc);
        }
      }

      return {
        ...prev,
        contacts: [...toAppend, ...updatedList],
      };
    });
  };

  const handleAddInvoice = (invoice: Invoice) => {
    setData((prev) => {
      const isDraftOrCancelled = invoice.status === "draft" || invoice.status === "cancelled";

      // Update contact balance only when invoice is officially issued (not draft/cancelled)
      const updatedContacts = isDraftOrCancelled
        ? prev.contacts
        : prev.contacts.map((c) => {
            if (c.id === invoice.contactId) {
              const delta = invoice.type === "sales" ? invoice.grandTotal : -invoice.grandTotal;
              const newBal = c.balance + delta;
              return {
                ...c,
                balance: newBal,
                balanceType: newBal > 0 ? "receivable" : newBal < 0 ? "payable" : "balanced",
              };
            }
            return c;
          });

      // Advance Mysoft e-Fatura / e-Arşiv sequential invoice number when issuing a non-draft sales invoice
      let updatedSettings = prev.settings;
      if (!isDraftOrCancelled && invoice.type === "sales" && invoice.docKind !== "receipt") {
        const cleanNo = String(invoice.invoiceNumber || "").trim().toUpperCase();
        const serialMatch = cleanNo.match(/^([A-Z0-9]{3})(\d{4})(\d{9})$/);
        if (serialMatch) {
          const usedPrefix = serialMatch[1];
          const usedYear = serialMatch[2];
          const usedSeq = parseInt(serialMatch[3], 10) || 0;
          const nextSerialNo = `${usedPrefix}${usedYear}${String(usedSeq + 1).padStart(9, "0")}`;
          const isEArsivDoc =
            invoice.eDocumentType === "e_arsiv" ||
            invoice.invoiceScenario === "EARSIVFATURA" ||
            usedPrefix === (prev.settings.eArsivPrefix || "EAR").toUpperCase();

          updatedSettings = {
            ...prev.settings,
            ...(isEArsivDoc
              ? {
                  eArsivPrefix: prev.settings.eArsivPrefix || usedPrefix,
                  eArsivNextNumber: nextSerialNo,
                }
              : {
                  eFaturaPrefix: prev.settings.eFaturaPrefix || usedPrefix,
                  eFaturaNextNumber: nextSerialNo,
                }),
          };

          const activeComp = companies.find((c) => c.id === activeCompanyId);
          if (activeComp) {
            const updatedComp: CompanyItem = {
              ...activeComp,
              ...(isEArsivDoc
                ? {
                    eArsivPrefix: activeComp.eArsivPrefix || usedPrefix,
                    eArsivNextNumber: nextSerialNo,
                  }
                : {
                    eFaturaPrefix: activeComp.eFaturaPrefix || usedPrefix,
                    eFaturaNextNumber: nextSerialNo,
                  }),
            };
            const updatedCompList = updateCompanyItem(updatedComp);
            setCompanies(updatedCompList);
          }
        }
      }

      return {
        ...prev,
        settings: updatedSettings,
        invoices: [invoice, ...prev.invoices],
        contacts: updatedContacts as Contact[],
      };
    });
  };

  const handleImportMysoftInvoice = (document: MysoftEDocument) => {
    const isIncoming =
      document.canonicalDirection === "incoming" ||
      document.direction === "inbox" ||
      document.direction === "incoming";
    const taxNumber =
      document.taxNumber ||
      (isIncoming ? document.senderTaxNumber : document.receiverTaxNumber) ||
      "";
    const contactName =
      document.accountName ||
      (isIncoming ? document.senderName : document.receiverName) ||
      "Mysoft e-Belge";
    const invoiceNumber =
      document.documentNo ||
      document.number ||
      document.documentNumber ||
      document.ettn ||
      `MS-${Date.now()}`;
    const issueDate = (document.issueDate || document.date || new Date().toISOString()).slice(0, 10);
    const dueDate = (document.dueDate || issueDate).slice(0, 10);
    const grandTotal = Number(document.grandTotal ?? document.amount) || 0;
    const subtotal = Number(document.subtotal) || grandTotal;
    const vatTotal = Number(document.vatTotal) || 0;
    const eDocumentType =
      document.documentType === "e_arsiv" ||
      document.documentType === "e_fatura" ||
      document.documentType === "paper"
        ? document.documentType
        : "e_fatura";

    setData((prev) => {
      if (document.ettn && prev.invoices.some((invoice) => invoice.eDocumentEttn === document.ettn)) {
        return prev;
      }

      let contacts = prev.contacts;
      let contact =
        (taxNumber ? contacts.find((item) => item.taxNumber === taxNumber) : undefined) ||
        contacts.find((item) => item.name === contactName);

      if (!contact) {
        const contactType = isIncoming ? "vendor" : "customer";
        contact = {
          id: "ct_mysoft_" + Date.now(),
          name: contactName,
          contactType,
          taxNumber: taxNumber || undefined,
          balance: 0,
          balanceType: "balanced",
          createdAt: new Date().toISOString(),
          accountCode: getContactAccountCode({ contactType, taxNumber }),
        };
        contacts = [contact, ...contacts];
      }

      const invoice: Invoice = {
        id: "inv_mysoft_" + Date.now(),
        invoiceNumber,
        type: isIncoming ? "purchase" : "sales",
        contactId: contact.id,
        contactName: contact.name,
        taxNumber: contact.taxNumber,
        issueDate,
        dueDate,
        items: [
          {
            id: "it_mysoft_" + Date.now(),
            description: `${String(document.documentType || "e-Belge")} ${invoiceNumber}`,
            quantity: 1,
            unit: "Adet",
            unitPrice: subtotal,
            vatRate: subtotal > 0 ? Math.round((vatTotal / subtotal) * 100) : 0,
            totalWithoutVat: subtotal,
            vatAmount: vatTotal,
            totalWithVat: grandTotal,
          },
        ],
        subtotal,
        totalVat: vatTotal,
        grandTotal,
        paidAmount: 0,
        remainingAmount: grandTotal,
        status: "sent",
        currency: document.currency === "₺" ? "TRY" : document.currency || "TRY",
        notes: document.ettn ? `Mysoft ETTN: ${document.ettn}` : undefined,
        createdAt: new Date().toISOString(),
        eDocumentType,
        eDocumentEttn: document.ettn,
      };

      const delta = invoice.type === "sales" ? invoice.grandTotal : -invoice.grandTotal;
      const updatedContacts = contacts.map((item) => {
        if (item.id !== contact.id) return item;
        const newBal = item.balance + delta;
        return {
          ...item,
          balance: newBal,
          balanceType: newBal > 0 ? "receivable" : newBal < 0 ? "payable" : "balanced",
        } as Contact;
      });

      return {
        ...prev,
        contacts: updatedContacts,
        invoices: [invoice, ...prev.invoices],
      };
    });
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setData((prev) => {
      const oldInvoice = prev.invoices.find((i) => i.id === updatedInvoice.id);
      let updatedContacts = prev.contacts;
      let updatedSettings = prev.settings;

      if (oldInvoice) {
        const oldWasInactive = oldInvoice.status === "draft" || oldInvoice.status === "cancelled";
        const newIsInactive = updatedInvoice.status === "draft" || updatedInvoice.status === "cancelled";

        const oldDelta = oldWasInactive
          ? 0
          : oldInvoice.type === "sales"
          ? oldInvoice.grandTotal
          : -oldInvoice.grandTotal;
        const newDelta = newIsInactive
          ? 0
          : updatedInvoice.type === "sales"
          ? updatedInvoice.grandTotal
          : -updatedInvoice.grandTotal;

        if (oldInvoice.contactId === updatedInvoice.contactId) {
          const diff = newDelta - oldDelta;
          if (diff !== 0) {
            updatedContacts = prev.contacts.map((c) => {
              if (c.id === updatedInvoice.contactId) {
                const newBal = c.balance + diff;
                return {
                  ...c,
                  balance: newBal,
                  balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
                };
              }
              return c;
            });
          }
        } else {
          updatedContacts = prev.contacts.map((c) => {
            if (c.id === oldInvoice.contactId && oldDelta !== 0) {
              const newBal = c.balance - oldDelta;
              return {
                ...c,
                balance: newBal,
                balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
              };
            }
            if (c.id === updatedInvoice.contactId && newDelta !== 0) {
              const newBal = c.balance + newDelta;
              return {
                ...c,
                balance: newBal,
                balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
              };
            }
            return c;
          });
        }

        // If transitioning from draft to an issued sales invoice, advance Mysoft serial counter
        if (
          oldInvoice.status === "draft" &&
          !newIsInactive &&
          updatedInvoice.type === "sales" &&
          updatedInvoice.docKind !== "receipt"
        ) {
          const cleanNo = String(updatedInvoice.invoiceNumber || "").trim().toUpperCase();
          const serialMatch = cleanNo.match(/^([A-Z0-9]{3})(\d{4})(\d{9})$/);
          if (serialMatch) {
            const usedPrefix = serialMatch[1];
            const usedYear = serialMatch[2];
            const usedSeq = parseInt(serialMatch[3], 10) || 0;
            const nextSerialNo = `${usedPrefix}${usedYear}${String(usedSeq + 1).padStart(9, "0")}`;
            const isEArsivDoc =
              updatedInvoice.eDocumentType === "e_arsiv" ||
              updatedInvoice.invoiceScenario === "EARSIVFATURA" ||
              usedPrefix === (prev.settings.eArsivPrefix || "EAR").toUpperCase();

            updatedSettings = {
              ...prev.settings,
              ...(isEArsivDoc
                ? {
                    eArsivPrefix: prev.settings.eArsivPrefix || usedPrefix,
                    eArsivNextNumber: nextSerialNo,
                  }
                : {
                    eFaturaPrefix: prev.settings.eFaturaPrefix || usedPrefix,
                    eFaturaNextNumber: nextSerialNo,
                  }),
            };

            const activeComp = companies.find((c) => c.id === activeCompanyId);
            if (activeComp) {
              const updatedComp: CompanyItem = {
                ...activeComp,
                ...(isEArsivDoc
                  ? {
                      eArsivPrefix: activeComp.eArsivPrefix || usedPrefix,
                      eArsivNextNumber: nextSerialNo,
                    }
                  : {
                      eFaturaPrefix: activeComp.eFaturaPrefix || usedPrefix,
                      eFaturaNextNumber: nextSerialNo,
                    }),
              };
              const updatedCompList = updateCompanyItem(updatedComp);
              setCompanies(updatedCompList);
            }
          }
        }
      }

      return {
        ...prev,
        settings: updatedSettings,
        invoices: prev.invoices.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)),
        contacts: updatedContacts as Contact[],
      };
    });
  };

  const handleDeleteInvoice = (id: string) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => i.id !== id),
    }));
  };

  const handleBulkDeleteInvoices = (ids: string[]) => {
    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((i) => !ids.includes(i.id)),
    }));
  };

  const handleAddTransaction = (tx: Transaction) => {
    setData((prev) => {
      // Update account balance
      const updatedAccounts = prev.accounts.map((a) => {
        if (a.id === tx.accountId) {
          const isInc = tx.type === "income" || tx.type === "collection";
          return {
            ...a,
            balance: isInc ? a.balance + tx.amount : a.balance - tx.amount,
          };
        }
        return a;
      });

      // If contact linked, update contact balance
      let updatedContacts = prev.contacts;
      if (tx.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === tx.contactId) {
            const isInc = tx.type === "income" || tx.type === "collection";
            // Collection reduces receivable balance
            const delta = isInc ? -tx.amount : tx.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }

      return {
        ...prev,
        transactions: [tx, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleBulkDeleteTransactions = (ids: string[]) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => !ids.includes(t.id)),
    }));
  };

  const handleAddTransactionFromInvoice = (
    invoice: Invoice,
    accountId: string,
    paidAmount: number
  ) => {
    const isSales = invoice.type === "sales";
    const acc = data.accounts.find((a) => a.id === accountId);
    const methodLabel =
      invoice.paymentMethod === "nakit"
        ? "Nakit"
        : invoice.paymentMethod === "kredi_karti"
        ? "Kredi Kartı"
        : "";

    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      date: invoice.issueDate || new Date().toISOString().split("T")[0],
      type: isSales ? "collection" : "payment",
      amount: paidAmount,
      currency: invoice.currency || "TRY",
      accountId,
      accountName: acc?.name || invoice.paymentAccountName || "Kasa/Banka",
      contactId: invoice.contactId,
      contactName: invoice.contactName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      category: isSales
        ? methodLabel
          ? `Fatura Tahsilatı (${methodLabel})`
          : "Fatura Tahsilatı"
        : methodLabel
        ? `Fatura Ödemesi (${methodLabel})`
        : "Fatura Ödemesi",
      description: `${invoice.invoiceNumber} nolu fatura ${methodLabel ? `${methodLabel} ` : ""}${isSales ? "tahsilatı" : "ödemesi"}`,
    };

    // Update invoice status & remaining
    const targetPayable = invoice.payableAmount ?? invoice.grandTotal;
    const newPaid = invoice.paidAmount + paidAmount;
    const newRemaining = targetPayable - newPaid;
    const newStatus = newRemaining <= 0 ? "paid" : "partial";

    const updatedInvoice: Invoice = {
      ...invoice,
      paidAmount: newPaid,
      remainingAmount: Math.max(0, newRemaining),
      status: newStatus as any,
      paymentAccountId: accountId || invoice.paymentAccountId,
      paymentAccountName: acc?.name || invoice.paymentAccountName,
    };

    setData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((i) => (i.id === invoice.id ? updatedInvoice : i)),
    }));

    handleAddTransaction(newTx);
  };

  const handleCollectAllInvoices = (targetAccountId?: string) => {
    setData((prev) => {
      const defaultAcc = prev.accounts.find((a) => a.id === targetAccountId) || prev.accounts[0];
      const accountId = defaultAcc?.id || "acc_1";
      const accountName = defaultAcc?.name || "Merkez TL Kasası";

      const newTransactions: Transaction[] = [];
      let updatedAccounts = [...prev.accounts];
      let updatedContacts = [...prev.contacts];

      const nowStr = new Date().toISOString().split("T")[0];
      let collectCount = 0;

      const updatedInvoices = prev.invoices.map((inv) => {
        if (inv.status !== "cancelled" && inv.remainingAmount > 0) {
          collectCount++;
          const remainingToPay = inv.remainingAmount;
          const isSales = inv.type === "sales";

          const tx: Transaction = {
            id: `tx_all_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            date: nowStr,
            type: isSales ? "collection" : "payment",
            amount: remainingToPay,
            currency: inv.currency || "TRY",
            accountId,
            accountName,
            contactId: inv.contactId,
            contactName: inv.contactName,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            category: isSales ? "Fatura Tahsilatı" : "Fatura Ödemesi",
            description: `${inv.invoiceNumber} nolu fatura ${isSales ? "toplu tahsilatı" : "toplu ödemesi"}`,
          };
          newTransactions.push(tx);

          // Update Account Balance
          updatedAccounts = updatedAccounts.map((a) => {
            if (a.id === accountId) {
              const delta = isSales ? remainingToPay : -remainingToPay;
              return { ...a, balance: a.balance + delta };
            }
            return a;
          });

          // Update Contact Balance
          if (inv.contactId) {
            updatedContacts = updatedContacts.map((c) => {
              if (c.id === inv.contactId) {
                const delta = isSales ? -remainingToPay : remainingToPay;
                const newBal = c.balance + delta;
                return {
                  ...c,
                  balance: newBal,
                  balanceType:
                    newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
                };
              }
              return c;
            });
          }

          return {
            ...inv,
            paidAmount: inv.grandTotal,
            remainingAmount: 0,
            status: "paid" as const,
          };
        }
        return inv;
      });

      if (collectCount === 0) return prev;

      return {
        ...prev,
        invoices: updatedInvoices,
        transactions: [...newTransactions, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  // Auto collect all invoices on mount if any are uncollected
  useEffect(() => {
    const uncollectedCount = data.invoices.filter((i) => i.status !== "cancelled" && i.remainingAmount > 0).length;
    if (uncollectedCount > 0) {
      handleCollectAllInvoices();
    }
  }, []);

  const handleTransferBetweenAccounts = (
    fromId: string,
    toId: string,
    amount: number,
    desc: string
  ) => {
    if (!fromId || !toId || fromId === toId || amount <= 0) return;

    setData((prev) => {
      const fromAcc = prev.accounts.find((a) => a.id === fromId);
      const fromContact = prev.contacts.find((c) => c.id === fromId);
      const toAcc = prev.accounts.find((a) => a.id === toId);
      const toContact = prev.contacts.find((c) => c.id === toId);

      if ((!fromAcc && !fromContact) || (!toAcc && !toContact)) return prev;

      const fromName = fromAcc?.name || fromContact?.name || "Borçlu Hesap";
      const toName = toAcc?.name || toContact?.name || "Alacaklı Hesap";
      const docNo = `VRM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = Date.now();
      const todayStr = new Date().toISOString().split("T")[0];

      const txOut: Transaction = {
        id: "tx_out_" + now,
        date: todayStr,
        type: "expense",
        amount,
        currency: fromAcc?.currency || toAcc?.currency || "TRY",
        accountId: fromAcc ? fromAcc.id : (prev.accounts[0]?.id || ""),
        accountName: fromAcc ? fromAcc.name : (fromContact ? `Cari: ${fromContact.name}` : "Virman Hesabı"),
        contactId: fromContact ? fromContact.id : undefined,
        contactName: fromContact ? fromContact.name : undefined,
        category: "Virman / Transfer",
        description: `Virman (Çıkış): ${fromName} -> ${toName}${desc ? ` (${desc})` : ""}`,
        documentNo: docNo,
      };

      const txIn: Transaction = {
        id: "tx_in_" + (now + 1),
        date: todayStr,
        type: "income",
        amount,
        currency: toAcc?.currency || fromAcc?.currency || "TRY",
        accountId: toAcc ? toAcc.id : (prev.accounts[0]?.id || ""),
        accountName: toAcc ? toAcc.name : (toContact ? `Cari: ${toContact.name}` : "Virman Hesabı"),
        contactId: toContact ? toContact.id : undefined,
        contactName: toContact ? toContact.name : undefined,
        category: "Virman / Transfer",
        description: `Virman (Giriş): ${toName} <- ${fromName}${desc ? ` (${desc})` : ""}`,
        documentNo: docNo,
      };

      const updatedAccounts = prev.accounts.map((acc) => {
        let bal = acc.balance;
        if (fromAcc && acc.id === fromAcc.id) {
          bal -= amount;
        }
        if (toAcc && acc.id === toAcc.id) {
          bal += amount;
        }
        return { ...acc, balance: bal };
      });

      let updatedContacts = prev.contacts;
      if (fromContact || toContact) {
        updatedContacts = prev.contacts.map((c) => {
          let bal = c.balance;
          if (fromContact && c.id === fromContact.id) {
            bal += amount;
          }
          if (toContact && c.id === toContact.id) {
            bal -= amount;
          }
          return {
            ...c,
            balance: bal,
            balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
          };
        });
      }

      return {
        ...prev,
        transactions: [txOut, txIn, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  const handleAddCheque = (cheque: Cheque) => {
    setData((prev) => {
      let updatedContacts = prev.contacts;
      if (cheque.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === cheque.contactId) {
            const delta = cheque.type === "received" ? -cheque.amount : cheque.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }
      return {
        ...prev,
        cheques: [cheque, ...(prev.cheques || [])],
        contacts: updatedContacts,
      };
    });
  };

  const handleUpdateChequeStatus = (id: string, status: ChequeStatus) => {
    setData((prev) => {
      const cheque = (prev.cheques || []).find((c) => c.id === id);
      const updatedCheques = (prev.cheques || []).map((c) => (c.id === id ? { ...c, status } : c));

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;

      if (cheque && (status === "collected" || status === "paid")) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = cheque.type === "received";
          const newTx: Transaction = {
            id: "tx_chq_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: cheque.amount,
            currency: cheque.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: cheque.contactId,
            contactName: cheque.contactName,
            category: isIncome ? "Çek Tahsilatı" : "Çek Ödemesi",
            description: `${cheque.bankName || "Banka"} (${cheque.chequeNumber || "Çek"}) ${isIncome ? "Çek Tahsilatı" : "Çek Ödemesi"}`,
          };
          updatedAccounts = prev.accounts.map((acc) =>
            acc.id === defaultAcc.id
              ? { ...acc, balance: isIncome ? acc.balance + cheque.amount : acc.balance - cheque.amount }
              : acc
          );
          updatedTransactions = [newTx, ...prev.transactions];
        }
      }

      return {
        ...prev,
        cheques: updatedCheques,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleEndorseCheque = (
    chequeId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).map((c) =>
        c.id === chequeId
          ? {
              ...c,
              status: "endorsed",
              endorsedToContactId: targetContactId,
              endorsedToContactName: targetContactName,
              endorsedDate: endorseDate,
            }
          : c
      ),
    }));
  };

  const handleDeleteCheque = (id: string) => {
    setData((prev) => ({
      ...prev,
      cheques: (prev.cheques || []).filter((c) => c.id !== id),
    }));
  };

  const handleAddPromissoryNote = (note: PromissoryNote) => {
    setData((prev) => {
      let updatedContacts = prev.contacts;
      if (note.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === note.contactId) {
            const delta = note.type === "received" ? -note.amount : note.amount;
            const newBal = c.balance + delta;
            return {
              ...c,
              balance: newBal,
              balanceType: newBal > 0 ? ("receivable" as const) : newBal < 0 ? ("payable" as const) : ("balanced" as const),
            };
          }
          return c;
        });
      }
      return {
        ...prev,
        promissoryNotes: [note, ...(prev.promissoryNotes || [])],
        contacts: updatedContacts,
      };
    });
  };

  const handleUpdateNoteStatus = (id: string, status: PromissoryNoteStatus) => {
    setData((prev) => {
      const note = (prev.promissoryNotes || []).find((n) => n.id === id);
      const updatedNotes = (prev.promissoryNotes || []).map((n) => (n.id === id ? { ...n, status } : n));

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;

      if (note && (status === "collected" || status === "paid")) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = note.type === "received";
          const newTx: Transaction = {
            id: "tx_note_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: note.amount,
            currency: note.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: note.contactId,
            contactName: note.contactName,
            category: isIncome ? "Senet Tahsilatı" : "Senet Ödemesi",
            description: `Senet No: ${note.noteNumber || "Senet"} ${isIncome ? "Senet Tahsilatı" : "Senet Ödemesi"}`,
          };
          updatedAccounts = prev.accounts.map((acc) =>
            acc.id === defaultAcc.id
              ? { ...acc, balance: isIncome ? acc.balance + note.amount : acc.balance - note.amount }
              : acc
          );
          updatedTransactions = [newTx, ...prev.transactions];
        }
      }

      return {
        ...prev,
        promissoryNotes: updatedNotes,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleEndorsePromissoryNote = (
    noteId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).map((n) =>
        n.id === noteId
          ? {
              ...n,
              status: "endorsed",
              endorsedToContactId: targetContactId,
              endorsedToContactName: targetContactName,
              endorsedDate: endorseDate,
            }
          : n
      ),
    }));
  };

  const handleDeletePromissoryNote = (id: string) => {
    setData((prev) => ({
      ...prev,
      promissoryNotes: (prev.promissoryNotes || []).filter((n) => n.id !== id),
    }));
  };

  const handleAddProduct = (product: Product) => {
    setData((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
  };

  const handleUpdateProduct = (product: Product) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === product.id ? product : p)),
    }));
  };

  const handleDeleteProduct = (id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const handleBulkDeleteProducts = (ids: string[]) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => !ids.includes(p.id)),
    }));
  };

  const handleBulkAddProducts = (newProducts: Product[], updateExisting = false) => {
    if (!newProducts.length) return;
    setData((prev) => {
      if (!updateExisting) {
        return {
          ...prev,
          products: [...newProducts, ...prev.products],
        };
      }
      const updatedList = [...prev.products];
      const toAppend: Product[] = [];

      for (const np of newProducts) {
        let matchedIdx = -1;
        if (np.code && np.code.trim()) {
          matchedIdx = updatedList.findIndex(
            (p) => p.code && p.code.trim().toLowerCase() === np.code.trim().toLowerCase()
          );
        }
        if (matchedIdx === -1 && np.barcode && np.barcode.trim()) {
          matchedIdx = updatedList.findIndex(
            (p) => p.barcode && p.barcode.trim() === np.barcode!.trim()
          );
        }
        if (matchedIdx === -1 && np.name && np.name.trim()) {
          matchedIdx = updatedList.findIndex(
            (p) => p.name.trim().toLowerCase() === np.name.trim().toLowerCase()
          );
        }

        if (matchedIdx >= 0) {
          updatedList[matchedIdx] = {
            ...updatedList[matchedIdx],
            ...np,
            id: updatedList[matchedIdx].id,
          };
        } else {
          toAppend.push(np);
        }
      }

      return {
        ...prev,
        products: [...toAppend, ...updatedList],
      };
    });
  };

  const handleAddQuote = (quote: Quote) => {
    setData((prev) => ({
      ...prev,
      quotes: [quote, ...prev.quotes],
    }));
  };

  const handleUpdateFixedAssets = (updatedAssets: FixedAsset[]) => {
    setData((prev) => {
      const next = { ...prev, fixedAssets: updatedAssets };
      saveStoredData("FIXED_ASSETS", updatedAssets);
      return next;
    });
  };

  const handleUpdateAssetMaintenances = (updatedMaintenances: AssetMaintenanceRecord[]) => {
    setData((prev) => {
      const next = { ...prev, assetMaintenances: updatedMaintenances };
      saveStoredData("ASSET_MAINTENANCES", updatedMaintenances);
      return next;
    });
  };

  const handleUpdateAssetDisposals = (updatedDisposals: AssetDisposalRecord[]) => {
    setData((prev) => {
      const next = { ...prev, assetDisposals: updatedDisposals };
      saveStoredData("ASSET_DISPOSALS", updatedDisposals);
      return next;
    });
  };

  const handleConvertQuoteToInvoice = (quote: Quote) => {
    const currentYear = new Date().getFullYear();
    const prefix = (data.settings.eFaturaPrefix || data.settings.defaultInvoicePrefix || "GIB")
      .trim()
      .toUpperCase()
      .slice(0, 3)
      .padEnd(3, "X");
    const nextSeq = String(data.invoices.length + 1).padStart(9, "0");
    const resolvedInvoiceNo =
      data.settings.eFaturaNextNumber || `${prefix}${currentYear}${nextSeq}`;

    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: resolvedInvoiceNo,
      type: "sales",
      contactId: quote.contactId,
      contactName: quote.contactName,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: quote.items,
      subtotal: quote.items.reduce((s, i) => s + i.totalWithoutVat, 0),
      totalVat: quote.items.reduce((s, i) => s + i.vatAmount, 0),
      grandTotal: quote.grandTotal,
      paidAmount: 0,
      remainingAmount: quote.grandTotal,
      status: "sent",
      currency: "TRY",
      notes: quote.notes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    handleAddInvoice(newInvoice);

    // Update quote status
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, status: "converted" as const } : q
      ),
    }));
  };

  const handleConvertQuoteToOrder = (quote: Quote) => {
    const prefix = "SIP2026";
    const nextSeq = String((data.orders || []).length + 1).padStart(6, "0");
    const contact = data.contacts.find((c) => c.id === quote.contactId);

    const newOrder: Order = {
      id: "ord_" + Date.now(),
      orderNumber: `${prefix}${nextSeq}`,
      type: "sales",
      contactId: quote.contactId,
      contactName: quote.contactName,
      contactPhone: contact?.phone,
      contactEmail: contact?.email,
      taxNumber: contact?.taxNumber,
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: quote.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: quote.items.map((item) => {
        const prod = data.products.find((p) => p.id === item.productId);
        return {
          id: item.id || "item_" + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productCode: prod?.code,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discountRate: 0,
          totalWithoutVat: item.totalWithoutVat,
          vatAmount: item.vatAmount,
          totalWithVat: item.totalWithVat,
        };
      }),
      subtotal: quote.items.reduce((s, i) => s + i.totalWithoutVat, 0),
      totalVat: quote.items.reduce((s, i) => s + i.vatAmount, 0),
      grandTotal: quote.grandTotal,
      currency: quote.currency || "TRY",
      status: "approved",
      notes: `Proforma (Belge No: ${quote.quoteNumber}) siparişe dönüştürüldü. ${quote.notes || ""}`,
      createdAt: new Date().toISOString().split("T")[0],
    };

    handleAddOrder(newOrder);

    // Update quote status to converted
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id ? { ...q, status: "converted" as const } : q
      ),
    }));
  };

  const handleDeleteQuote = (id: string) => {
    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== id),
    }));
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    setData((prev) => {
      let updatedEmployees = prev.employees;
      if (newSettings.applyAllowancesToAllEmployees !== false) {
        const newFood = newSettings.defaultFoodAllowance ?? 5500;
        const newRoad = newSettings.defaultRoadAllowance ?? 2500;
        updatedEmployees = (prev.employees || []).map((emp) => ({
          ...emp,
          foodAllowance: newFood,
          roadAllowance: newRoad,
        }));
        saveStoredData("EMPLOYEES", updatedEmployees);
      }
      saveStoredData("SETTINGS", newSettings);
      return {
        ...prev,
        settings: newSettings,
        employees: updatedEmployees,
      };
    });
  };

  const handleResetDemoData = () => {
    resetToDemoData();
    setData(getStoredData());
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Muavin_Yedek_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleImportBackup = (jsonStr: string) => {
    const ok = importBackupJSON(jsonStr);
    if (ok) {
      setData(getStoredData());
    }
    return ok;
  };

  // HR Handlers
  const handleAddEmployee = (emp: Employee) => {
    setData((p) => {
      const next = { ...p, employees: [emp, ...(p.employees || [])] };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setData((p) => {
      const next = {
        ...p,
        employees: (p.employees || []).map((e) => (e.id === emp.id ? emp : e)),
      };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleDeleteEmployee = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        employees: (p.employees || []).filter((e) => e.id !== id),
      };
      saveStoredData("EMPLOYEES", next.employees);
      return next;
    });
  };

  const handleAddLeaveRequest = (req: LeaveRequest) => {
    setData((p) => {
      const next = { ...p, leaveRequests: [req, ...(p.leaveRequests || [])] };
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests);
      return next;
    });
  };

  const handleUpdateLeaveStatus = (id: string, status: "approved" | "rejected") => {
    setData((p) => {
      const next = {
        ...p,
        leaveRequests: (p.leaveRequests || []).map((r) =>
          r.id === id ? { ...r, status } : r
        ),
      };
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests);
      return next;
    });
  };

  const handleAddAdvanceRequest = (req: AdvanceRequest) => {
    setData((p) => {
      const next = { ...p, advanceRequests: [req, ...(p.advanceRequests || [])] };
      saveStoredData("ADVANCE_REQUESTS", next.advanceRequests);
      return next;
    });
  };

  const handleUpdateAdvanceStatus = (id: string, status: "paid" | "approved" | "rejected") => {
    setData((p) => {
      const targetReq = (p.advanceRequests || []).find((r) => r.id === id);
      const updatedAdvanceRequests = (p.advanceRequests || []).map((r) =>
        r.id === id ? { ...r, status } : r
      );
      saveStoredData("ADVANCE_REQUESTS", updatedAdvanceRequests);

      let updatedAccounts = p.accounts;
      let updatedTransactions = p.transactions;

      if (status === "paid" && targetReq && targetReq.status !== "paid") {
        const defaultAcc = p.accounts[0];
        if (defaultAcc) {
          const emp = (p.employees || []).find((e) => e.id === targetReq.employeeId);
          const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Personel";
          const newTx: Transaction = {
            id: "tx_adv_" + Date.now(),
            date: new Date().toISOString().split("T")[0],
            type: "expense",
            amount: targetReq.amount,
            currency: "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            category: "Personel / Avans",
            description: `Personel Avans Ödemesi: ${empName} (${targetReq.reason || "Avans Ödemesi"})`,
          };
          updatedAccounts = p.accounts.map((acc) =>
            acc.id === defaultAcc.id ? { ...acc, balance: acc.balance - targetReq.amount } : acc
          );
          updatedTransactions = [newTx, ...p.transactions];
        }
      }

      return {
        ...p,
        advanceRequests: updatedAdvanceRequests,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
    });
  };

  const handleAddLegalDeduction = (deduction: LegalDeduction) => {
    setData((p) => {
      const next = { ...p, legalDeductions: [deduction, ...(p.legalDeductions || [])] };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  const handleUpdateLegalDeduction = (deduction: LegalDeduction) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).map((d) => (d.id === deduction.id ? deduction : d)),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  const handleDeleteLegalDeduction = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).filter((d) => d.id !== id),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions);
      return next;
    });
  };

  // Handlers for Asset Custody (Zimmet & Demirbaş)
  const handleAddAsset = (asset: AssetCustody) => {
    setData((p) => {
      const next = { ...p, assetCustodies: [asset, ...(p.assetCustodies || [])] };
      saveStoredData("ASSET_CUSTODIES", next.assetCustodies);
      return next;
    });
  };

  const handleUpdateAsset = (asset: AssetCustody) => {
    setData((p) => {
      const next = {
        ...p,
        assetCustodies: (p.assetCustodies || []).map((a) => (a.id === asset.id ? asset : a)),
      };
      saveStoredData("ASSET_CUSTODIES", next.assetCustodies);
      return next;
    });
  };

  const handleDeleteAsset = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        assetCustodies: (p.assetCustodies || []).filter((a) => a.id !== id),
      };
      saveStoredData("ASSET_CUSTODIES", next.assetCustodies);
      return next;
    });
  };

  const getPageTitle = (tab: NavItem) => {
    switch (tab) {
      case "dashboard":
        return "Ana Sayfa";
      case "contacts":
        return "Cari Hesaplar";
      case "invoices":
        return "E-Belgeler";
      case "invoices_sales":
        return "Gelir Faturası";
      case "invoices_purchase":
        return "Gider Faturası";
      case "e_documents_incoming":
        return "Gelen e-Faturalar";
      case "e_documents_outgoing":
        return "Giden e-Faturalar";
      case "quotes":
        return "Proforma Faturalar";
      case "quotes_and_slips":
        return "Gelir & Gider Fişleri";
      case "orders":
        return "Siparişler & Sipariş Oluştur";
      case "orders_module":
        return "Sipariş & Proforma";
      case "production":
        return "Üretim Yönetimi";
      case "sectors":
        return "Sektör Yönetimi & Mimarisi";
      case "waybills":
        return "İrsaliye Oluştur (Yerel)";
      case "waybills_dispatch":
        return "Giden e-İrsaliyeler";
      case "waybills_receipt":
        return "Gelen e-İrsaliyeler";
      case "accounts":
        return "Finans Yönetimi";
      case "transactions":
        return "Gelir & Giderler";
      case "income_slips":
        return "Gelir Fişi";
      case "expenses":
        return "Gider Fişi";
      case "products":
      case "products_list":
        return "Stoklar & Depolar";
      case "auto_service":
        return "Oto Servis & Araç Bakım";
      case "it_service":
        return "Bilişim & BT Teknik Servis";
      case "appliance_service":
        return "Ev Aletleri ve Klima Servisi";
      case "construction_costing":
        return "İnşaat Maliyetlendirme";
      case "hr":
        return "İnsan Kaynakları";
      case "reports":
        return "Vergilendirme";
      case "company":
      case "company_profile":
        return "Firma Profili & Adres";
      case "company_branches":
        return "Firma Şubeleri";
      case "company_warehouses":
        return "Firma Depoları";
      case "company_companies":
        return "Firma Bilgileri - Sistem Ayarları (Şirketler & Çoklu Şirket)";
      case "company_mysoft":
        return "Firma Bilgileri - Sistem Ayarları (Mysoft Eşleştirme)";
      case "company_settings":
      case "settings":
        return "Firma Bilgileri - Sistem Ayarları";
      case "company_e_services":
      case "e_services":
        return "E-İşlemler (GİB, SGK, E-Devlet)";
      case "admin":
        return "Admin Yönetici Paneli";
      default:
        return "Ana Sayfa";
    }
  };

  const activeCompanyObj =
    companies.find((c) => c.id === activeCompanyId) || companies[0] || null;

  const isCurrentTabAuthorized = (tab: NavItem): boolean => {
    if (tab === "dashboard") return true;
    if (tab === "admin") return isAdminOrSysAdmin(currentUser);

    const tabPermissionMap: Record<string, { key: string; parent?: string }> = {
      company: { key: "company" },
      company_profile: { key: "company_profile", parent: "company" },
      company_branches: { key: "company_branches", parent: "company" },
      company_warehouses: { key: "company_warehouses", parent: "company" },
      settings: { key: "company_settings", parent: "company" },
      company_settings: { key: "company_settings", parent: "company" },
      company_companies: { key: "company_companies", parent: "company" },
      company_mysoft: { key: "company_mysoft", parent: "company" },
      contacts: { key: "contacts" },
      contacts_debtors: { key: "contacts_customers", parent: "contacts" },
      contacts_risky: { key: "contacts_customers", parent: "contacts" },
      invoices: { key: "invoices" },
      invoices_sales: { key: "invoices_sales", parent: "invoices" },
      invoices_purchase: { key: "invoices_purchase", parent: "invoices" },
      e_documents_outgoing: { key: "invoices_sales", parent: "invoices" },
      e_documents_incoming: { key: "invoices_purchase", parent: "invoices" },
      orders_module: { key: "orders_module" },
      orders: { key: "orders_sales", parent: "orders_module" },
      quotes: { key: "orders_quotes", parent: "orders_module" },
      quotes_and_slips: { key: "invoices_expense", parent: "invoices" },
      accounts: { key: "accounts" },
      transactions: { key: "finance_gelir_gider", parent: "accounts" },
      income_slips: { key: "invoices_sales", parent: "invoices" },
      expenses: { key: "invoices_expense", parent: "invoices" },
      products: { key: "products" },
      products_list: { key: "products_stock", parent: "products" },
      fixed_assets: { key: "fixed_assets" },
      production: { key: "production" },
      sectors: { key: "sectors_hub" },
      waybills: { key: "waybills" },
      waybills_dispatch: { key: "waybills_sales", parent: "waybills" },
      waybills_receipt: { key: "waybills_purchase", parent: "waybills" },
      auto_service: { key: "auto_service" },
      it_service: { key: "it_service" },
      appliance_service: { key: "appliance_service" },
      construction_costing: { key: "construction_costing" },
      hr: { key: "hr" },
      files: { key: "files" },
      reports: { key: "reports" },
      e_services: { key: "e_services" },
      company_e_services: { key: "e_services" },
      whatsapp: { key: "whatsapp" },
    };

    const mapped = tabPermissionMap[tab];
    if (!mapped) return true;
    return isModuleOrSubModuleAllowed(
      mapped.key,
      mapped.parent,
      currentUser,
      activeCompanyObj
    );
  };

  return (
    <div className="flex min-h-screen bg-theme-page text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (!isCurrentTabAuthorized(tab)) {
            triggerFormErrorNotification(
              "Bu modül veya alt modül için erişim yetkiniz bulunmamaktadır. Modül ve alt modül tanımlama/yetkilendirme işlemleri sadece Admin ve Sistem Yöneticisi tarafından yapılabilir.",
              "Yetkisiz Erişim"
            );
            return;
          }
          setCurrentTab(tab);
        }}
        activeFinanceSubTab={financeSubTab}
        onSelectFinanceSubTab={setFinanceSubTab}
        settings={data.settings}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSaveSettings={handleSaveSettings}
        constructionProjects={data.constructionProjects || []}
        selectedConstructionProjectId={selectedConstructionProjectId}
        onSelectConstructionProject={(projId) => {
          setSelectedConstructionProjectId(projId);
          setCurrentTab("construction_costing");
        }}
        onOpenGitHubPublish={() => setIsGitHubPublishOpen(true)}
        activeCompany={companies.find((c) => c.id === activeCompanyId) || companies[0]}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          title={getPageTitle(currentTab)}
          subtitle="Muavin Ön Muhasebe & Finansal Takip Programı"
          accounts={data.accounts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          logoUrl={data.settings?.logoUrl || "/logo.svg"}
          onOpenGitHubPublish={() => setIsGitHubPublishOpen(true)}
          companies={companies}
          activeCompanyId={activeCompanyId}
          onSelectCompany={handleSelectCompany}
          onOpenNewCompanyModal={() => setIsNewCompanyModalOpen(true)}
        />

        <main className="flex-1 pb-12 bg-theme-page">
          <ErrorBoundary key={currentTab}>
            <Suspense fallback={<TabLoadingSkeleton />}>
            {currentTab === "dashboard" && (
            <Dashboard
              contacts={data.contacts}
              invoices={data.invoices}
              accounts={data.accounts}
              transactions={data.transactions}
              cheques={data.cheques || []}
              promissoryNotes={data.promissoryNotes || []}
              products={data.products || []}
              quotes={data.quotes || []}
              orders={data.orders || []}
              waybills={data.waybills || []}
              settings={data.settings}
              globalSearchTerm={searchTerm}
              onSelectTab={setCurrentTab}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
          )}

          {currentTab === "contacts" && (
            <Contacts
              currentUser={currentUser}
              contacts={data.contacts}
              invoices={data.invoices}
              transactions={data.transactions}
              accounts={data.accounts}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              initialOnlyDebtors={currentTab === "contacts_debtors"}
              initialStatusFilter={currentTab === "contacts_risky" ? "risky" : "all"}
              onAddContact={handleAddContact}
              onBulkAddContacts={handleBulkAddContacts}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onBulkDeleteContacts={handleBulkDeleteContacts}
              onAddTransaction={handleAddTransaction}
              onAddCheque={handleAddCheque}
              onAddPromissoryNote={handleAddPromissoryNote}
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onOpenNewInvoiceForContact={(cid) => {
                setInitialContactIdForInvoice(cid);
                setCurrentTab("invoices");
              }}
              onOpenPaymentModal={() => setCurrentTab("transactions")}
            />
          )}

          {(currentTab === "invoices" ||
            currentTab === "invoices_sales" ||
            currentTab === "invoices_purchase") && (
            <Invoices
              invoices={data.invoices}
              contacts={data.contacts}
              products={data.products}
              accounts={data.accounts}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              forcedType={
                currentTab === "invoices_sales"
                  ? "sales"
                  : currentTab === "invoices_purchase"
                  ? "purchase"
                  : undefined
              }
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onBulkDeleteInvoices={handleBulkDeleteInvoices}
              onAddTransactionFromInvoice={handleAddTransactionFromInvoice}
              onCollectAllInvoices={handleCollectAllInvoices}
              initialContactIdForNewInvoice={initialContactIdForInvoice}
              onSelectTab={setCurrentTab}
              onAddContact={handleAddContact}
            />
          )}

          {(currentTab === "e_documents_incoming" || currentTab === "e_documents_outgoing") && (
            <EDocuments
              family="invoice"
              direction={currentTab === "e_documents_outgoing" ? "outgoing" : "incoming"}
              companySettings={data.settings}
              tenantIdentifierNumber={
                data.settings.tenantIdentifierNumber || readStoredMysoftTenantVkn()
              }
              globalSearchTerm={searchTerm}
              onImportInvoice={handleImportMysoftInvoice}
            />
          )}

          {currentTab === "quotes" && (
            <Quotes
              quotes={data.quotes}
              contacts={data.contacts}
              products={data.products}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddQuote={handleAddQuote}
              onConvertQuoteToInvoice={handleConvertQuoteToInvoice}
              onConvertQuoteToOrder={handleConvertQuoteToOrder}
              onDeleteQuote={handleDeleteQuote}
            />
          )}

          {currentTab === "accounts" && (
            <Accounts
              accounts={data.accounts}
              transactions={data.transactions}
              contacts={data.contacts}
              cheques={data.cheques || []}
              promissoryNotes={data.promissoryNotes || []}
              companySettings={data.settings}
              activeFinanceSubTab={financeSubTab}
              globalSearchTerm={searchTerm}
              onSelectFinanceSubTab={setFinanceSubTab}
              onAddAccount={(acc) =>
                setData((p) => ({ ...p, accounts: [...p.accounts, acc] }))
              }
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddCheque={handleAddCheque}
              onUpdateCheque={handleUpdateCheque}
              onUpdateChequeStatus={handleUpdateChequeStatus}
              onDeleteCheque={handleDeleteCheque}
              onEndorseCheque={handleEndorseCheque}
              onAddPromissoryNote={handleAddPromissoryNote}
              onUpdatePromissoryNote={handleUpdatePromissoryNote}
              onUpdateNoteStatus={handleUpdateNoteStatus}
              onEndorsePromissoryNote={handleEndorsePromissoryNote}
              onDeletePromissoryNote={handleDeletePromissoryNote}
            />
          )}

          {(currentTab === "transactions" ||
            currentTab === "income_slips" ||
            currentTab === "expenses") && (
            <Transactions
              transactions={data.transactions}
              accounts={data.accounts}
              contacts={data.contacts}
              products={data.products || []}
              globalSearchTerm={searchTerm}
              forcedType={
                currentTab === "income_slips"
                  ? "income"
                  : currentTab === "expenses"
                  ? "expense"
                  : undefined
              }
              companySettings={data.settings}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onBulkDeleteTransactions={handleBulkDeleteTransactions}
            />
          )}

          {(currentTab === "products" || currentTab === "products_list") && (
            <Products
              products={data.products}
              invoices={data.invoices}
              contacts={data.contacts}
              warehouses={data.warehouses || []}
              branches={data.branches || []}
              employees={data.employees || []}
              transactions={data.transactions || []}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddProduct={handleAddProduct}
              onBulkAddProducts={handleBulkAddProducts}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDeleteProducts={handleBulkDeleteProducts}
              onAddWarehouse={handleAddWarehouse}
              onUpdateWarehouse={handleUpdateWarehouse}
              onDeleteWarehouse={handleDeleteWarehouse}
            />
          )}

          {currentTab === "fixed_assets" && (
            <FixedAssetsModule
              assets={data.fixedAssets || []}
              maintenances={data.assetMaintenances || []}
              disposals={data.assetDisposals || []}
              employees={data.employees || []}
              settings={data.settings}
              onUpdateAssets={handleUpdateFixedAssets}
              onUpdateMaintenances={handleUpdateAssetMaintenances}
              onUpdateDisposals={handleUpdateAssetDisposals}
            />
          )}

          {currentTab === "orders" && (
            <Orders
              orders={data.orders || []}
              contacts={data.contacts}
              products={data.products}
              warehouses={data.warehouses || []}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddOrder={handleAddOrder}
              onUpdateOrder={handleUpdateOrder}
              onConvertOrderToInvoice={handleConvertOrderToInvoice}
              onDeleteOrder={handleDeleteOrder}
              onBulkDeleteOrders={handleBulkDeleteOrders}
            />
          )}

          {currentTab === "production" && (
            <ProductionModule
              sectors={data.sectors || []}
              activeSectorId={data.activeSectorId || "catering"}
              foodRecipes={data.foodRecipes || []}
              foodMenus={data.foodMenus || []}
              foodProductionOrders={data.foodProductionOrders || []}
              foodDispatches={data.foodDispatches || []}
              foodWitnessSamples={data.foodWitnessSamples || []}
              products={data.products || []}
              contacts={data.contacts || []}
              settings={data.settings}
              onNavigateToSectors={() => setCurrentTab("sectors")}
              onUpdateSectors={(updatedSectors, activeId) => {
                setData((prev) => ({
                  ...prev,
                  sectors: updatedSectors,
                  activeSectorId: activeId,
                }));
              }}
              onUpdateProducts={(updatedProducts) => {
                setData((prev) => ({
                  ...prev,
                  products: updatedProducts,
                }));
              }}
              onUpdateOrders={(updatedOrders) => {
                setData((prev) => ({
                  ...prev,
                  foodProductionOrders: updatedOrders,
                }));
              }}
            />
          )}

          {currentTab === "sectors" && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <SectorsModule
                sectors={data.sectors || []}
                activeSectorId={data.activeSectorId || "catering"}
                currentUser={currentUser}
                onSelectActiveSector={(secId) => {
                  setData((prev) => ({
                    ...prev,
                    activeSectorId: secId,
                  }));
                }}
                onNavigateToProduction={() => setCurrentTab("production")}
                onUpdateSectors={(updatedSectors, activeId) => {
                  setData((prev) => ({
                    ...prev,
                    sectors: updatedSectors,
                    activeSectorId: activeId,
                  }));
                }}
              />
            </div>
          )}

          {(currentTab === "waybills_dispatch" || currentTab === "waybills_receipt") && (
            <EDocuments
              family="despatch"
              direction={currentTab === "waybills_dispatch" ? "outgoing" : "incoming"}
              companySettings={data.settings}
              tenantIdentifierNumber={
                data.settings.tenantIdentifierNumber || readStoredMysoftTenantVkn()
              }
              globalSearchTerm={searchTerm}
            />
          )}

          {currentTab === "auto_service" && (
            <AutoServiceModule
              autoServices={data.autoServices || []}
              onUpdateAutoServices={handleUpdateAutoServices}
              contacts={data.contacts}
              companySettings={data.settings}
              onAddInvoice={handleAddInvoice}
              onAddContact={handleAddContact}
            />
          )}

          {currentTab === "it_service" && (
            <ITServiceModule
              itServices={data.itServices || []}
              onUpdateItServices={handleUpdateItServices}
              contacts={data.contacts}
              companySettings={data.settings}
              onAddInvoice={handleAddInvoice}
              onAddContact={handleAddContact}
            />
          )}

          {currentTab === "appliance_service" && (
            <ApplianceServiceModule
              applianceServices={data.applianceServices || []}
              onUpdateApplianceServices={handleUpdateApplianceServices}
              contacts={data.contacts}
              companySettings={data.settings}
              onAddInvoice={handleAddInvoice}
              onAddContact={handleAddContact}
            />
          )}

          {currentTab === "construction_costing" && (
            <ConstructionCostingModule
              projects={data.constructionProjects || []}
              onUpdateProjects={handleUpdateConstructionProjects}
              contacts={data.contacts}
              companySettings={data.settings}
              selectedProjectId={selectedConstructionProjectId || undefined}
              onSelectProjectId={(projId) => setSelectedConstructionProjectId(projId)}
            />
          )}

          {currentTab === "waybills" && (
            <Waybills
              waybills={data.waybills || []}
              contacts={data.contacts}
              products={data.products}
              warehouses={data.warehouses || []}
              companySettings={data.settings}
              globalSearchTerm={searchTerm}
              onAddWaybill={handleAddWaybill}
              onUpdateWaybill={handleUpdateWaybill}
              onConvertWaybillToInvoice={handleConvertWaybillToInvoice}
              onDeleteWaybill={handleDeleteWaybill}
              onBulkDeleteWaybills={handleBulkDeleteWaybills}
            />
          )}

          {currentTab === "hr" && (
            <HRManagement
              employees={data.employees || []}
              leaveRequests={data.leaveRequests || []}
              advanceRequests={data.advanceRequests || []}
              legalDeductions={data.legalDeductions || []}
              assetCustodies={data.assetCustodies || []}
              companySettings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              costProjects={data.costProjects || []}
              onSaveSettings={handleSaveSettings}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onAddLeaveRequest={handleAddLeaveRequest}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onAddAdvanceRequest={handleAddAdvanceRequest}
              onUpdateAdvanceStatus={handleUpdateAdvanceStatus}
              onAddLegalDeduction={handleAddLegalDeduction}
              onUpdateLegalDeduction={handleUpdateLegalDeduction}
              onDeleteLegalDeduction={handleDeleteLegalDeduction}
              onAddAsset={handleAddAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
              transactions={data.transactions || []}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
            />
          )}

          {currentTab === "files" && (
            <FileManager
              currentUser={
                currentUser || {
                  id: "usr_guest",
                  name: data.settings.companyName || "Sistem Kullanıcısı",
                  email: "info@tallsoft.com.tr",
                  role: "Yönetici",
                }
              }
            />
          )}

          {currentTab === "admin" && (
            isAdminOrSysAdmin(currentUser) ? (
              <AdminDashboard
                currentUser={
                  currentUser || {
                    id: "usr_admin_001",
                    name: "Sistem Yöneticisi",
                    email: "admin@tallsoft.com.tr",
                    role: "Süper Admin",
                  }
                }
                companies={companies}
                activeCompanyId={activeCompanyId}
                onSelectCompany={handleSelectCompany}
                onAddCompany={handleAddCompany}
                onUpdateCompany={handleUpdateCompany}
                onDeleteCompany={handleDeleteCompany}
              />
            ) : (
              <div className="p-8 max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-amber-200 shadow-sm text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Yetkisiz Erişim
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Admin Yönetici Paneli ile tüm modül ve alt modüllerin tanımlanması/yetkilendirilmesi münhasıran <strong>Admin</strong> ve <strong>Sistem Yöneticisi</strong> yetkisindedir.
                </p>
              </div>
            )
          )}

          {currentTab === "reports" && (
            <Reports
              contacts={data.contacts}
              invoices={data.invoices}
              transactions={data.transactions}
              companySettings={data.settings}
              products={data.products}
              quotes={data.quotes}
              orders={data.orders}
              waybills={data.waybills}
              cheques={data.cheques}
              promissoryNotes={data.promissoryNotes}
              employees={data.employees}
            />
          )}

          {["company", "company_profile", "company_companies", "company_mysoft", "company_branches", "company_warehouses", "company_settings", "settings"].includes(currentTab) && (
            <CompanyManagement
              settings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              onSaveSettings={handleSaveSettings}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
              onDeleteBranch={handleDeleteBranch}
              onAddWarehouse={handleAddWarehouse}
              onUpdateWarehouse={handleUpdateWarehouse}
              onDeleteWarehouse={handleDeleteWarehouse}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDemoData={handleResetDemoData}
              companies={companies}
              activeCompanyId={activeCompanyId}
              onSelectCompany={handleSelectCompany}
              onAddCompany={handleAddCompany}
              onUpdateCompany={handleUpdateCompany}
              onDeleteCompany={handleDeleteCompany}
              currentUser={currentUser}
              activeSubTab={
                currentTab === "company_companies"
                  ? "companies"
                  : currentTab === "company_mysoft"
                  ? "mysoft"
                  : currentTab === "company_branches"
                  ? "branches"
                  : currentTab === "company_warehouses"
                  ? "warehouses"
                  : currentTab === "company_settings" || currentTab === "settings"
                  ? "settings"
                  : "profile"
              }
              onSelectSubTab={(tab) => {
                if (tab === "companies") setCurrentTab("company_companies");
                else if (tab === "mysoft") setCurrentTab("company_mysoft");
                else if (tab === "branches") setCurrentTab("company_branches");
                else if (tab === "warehouses") setCurrentTab("company_warehouses");
                else if (tab === "settings") setCurrentTab("company_settings");
                else setCurrentTab("company_profile");
              }}
            />
          )}

          {currentTab === "e_services" && (
            <EServices
              settings={data.settings}
              branches={data.branches || []}
              warehouses={data.warehouses || []}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {currentTab === "whatsapp" && (
            <WhatsAppCenter settings={data.settings} />
          )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* FULL-PAGE DETAIL VIEW: QUICK ADD ACTION */}
      {isQuickAddOpen && (
        <DetailPageLayout
          title="Hızlı İşlem Menüsü"
          subtitle="Sistem genelinde hızlı kayıt ve operasyon başlatma"
          breadcrumbs={[
            { label: "Ana Menü", onClick: () => setIsQuickAddOpen(false) },
            { label: "Hızlı İşlemler", active: true },
          ]}
          onBack={() => setIsQuickAddOpen(false)}
          statusBadge={
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
              HIZLI ERİŞİM
            </span>
          }
          headerIcon={<Plus className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-xl mx-auto p-6 sm:p-8 shadow-sm space-y-4">
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("invoices");
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 hover:border-indigo-500/50 border border-slate-200 rounded-2xl flex items-center gap-4 text-left transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Yeni Fatura Kes / Kaydet
                  </h4>
                  <p className="text-xs text-slate-500">
                    Satış veya Alış e-Faturası hazırlayın
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("contacts");
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 hover:border-blue-500/50 border border-slate-200 rounded-2xl flex items-center gap-4 text-left transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Yeni Cari Kart Ekle
                  </h4>
                  <p className="text-xs text-slate-500">
                    Müşteri veya Tedarikçi tanımı yapın
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("transactions");
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500/50 border border-slate-200 rounded-2xl flex items-center gap-4 text-left transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Hızlı Gelir / Gider Kaydı
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kira, Maaş, Fiş veya Fatura dışı ödemeler
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("products");
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 hover:border-purple-500/50 border border-slate-200 rounded-2xl flex items-center gap-4 text-left transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Stok Kartı & Depo Ekle
                  </h4>
                  <p className="text-xs text-slate-500">
                    Test, şirket ve şahıs işletmelerine yeni ürün veya depo tanımlayın
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setCurrentTab("company_warehouses");
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 hover:border-amber-500/50 border border-slate-200 rounded-2xl flex items-center gap-4 text-left transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Şube & Depo Yönetimi
                  </h4>
                  <p className="text-xs text-slate-500">
                    Firma bilgileri üzerinden yeni depo ve şube ekleyin
                  </p>
                </div>
              </button>
            </div>
          </div>
        </DetailPageLayout>
      )}

      {/* GitHub & Yayınlama Senkronizasyon Modalı */}
      <GitHubPublishModal
        isOpen={isGitHubPublishOpen}
        onClose={() => setIsGitHubPublishOpen(false)}
        onSuccessNotification={(msg) => triggerFormErrorNotification(msg, "Yayınlama Başarılı")}
      />

      {/* Auth & Registration Modal with 6 Brand Logo Gallery */}
      <AuthModal
        isOpen={authModalOpen || currentUser === null}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthModalOpen(false);
          if (user.companyId) {
            handleSelectCompany(user.companyId);
          }
        }}
        initialMode={authModalMode}
        canClose={!!currentUser}
      />

      {/* Universal Print & Document Viewer Engine Modal */}
      <UniversalPrintModal />

      {/* Global Yeni Şirket Ekle Modalı */}
      <CompanyModal
        isOpen={isNewCompanyModalOpen}
        onClose={() => setIsNewCompanyModalOpen(false)}
        onSave={(newComp, makeActive) => {
          handleAddCompany(newComp, makeActive);
          setIsNewCompanyModalOpen(false);
        }}
        mode="create"
        currentUser={currentUser}
      />
    </div>
  );
}
