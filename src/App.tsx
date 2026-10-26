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
  getManualBackupStatus,
  recordManualBackup,
  snoozeManualBackupReminder,
  ManualBackupStatus,
  syncAccountBalancesFromTransactions,
} from "./utils/storage";
import {
  verifyAndSyncAllUsersLocalDb,
  subscribeToCentralSyncState,
  pullLatestCompanyDataFromCloud,
  pushCompanyDataToCloud,
  saveProductToDatabase,
  deleteProductFromDatabase,
  saveInvoiceToDatabase,
  deleteInvoiceFromDatabase,
  saveTransactionToDatabase,
  deleteTransactionFromDatabase,
  saveAccountToDatabase,
  deleteAccountFromDatabase,
} from "./services/systemSyncService";
import { deleteUserProfile } from "./lib/firebase";
import { readStoredMysoftTenantVkn, writeStoredMysoftTenantVkn } from "./utils/mysoftTenantStorage";
import {
  upsertOutgoingEDocumentFromSalesInvoice,
  removeOutgoingEDocumentForInvoice,
  getLocalNextSequentialInvoiceNumber,
} from "./services/mysoftEDocumentService";
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
  isCompanyMysoftMatched,
} from "./types";

import { Plus, FileText, Users, ArrowUpRight, ArrowDownLeft, X, Lock, AlertTriangle, Download, Clock } from "lucide-react";
import { DetailPageLayout } from "./components/common/DetailPageLayout";

import { FinanceSubModule } from "./components/Accounts";
import { useDataGridRowHighlight } from "./hooks/useDataGridRowHighlight";
import { useDataGridRowResizing } from "./hooks/useDataGridRowResizing";
import { useDataGridColumnResizing } from "./hooks/useDataGridColumnResizing";
import { fetchCloudLogo, saveCloudLogo, subscribeToCloudLogo } from "./services/cloudBrandingService";
import { AdminMysoftLogMonitorPanel } from "./components/AdminMysoftLogMonitorPanel";
import {
  initBrowserHistory,
  pushAppNavigationState,
  onBrowserPopState,
  navigateBrowserBack,
  navigateBrowserForward,
} from "./utils/browserNavigation";

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
  const [settingsInitialTab, setSettingsInitialTab] = useState<"theme" | "system" | "backup" | "cloud" | "github">("system");
  const [backupStatus, setBackupStatus] = useState<ManualBackupStatus>(() =>
    getManualBackupStatus(getActiveCompanyId(), data.settings)
  );

  // Automated 7-day manual backup check on mount, company switch, settings change, and 60s interval
  useEffect(() => {
    const refreshBackupStatus = () => {
      setBackupStatus(getManualBackupStatus(activeCompanyId, data.settings));
    };
    refreshBackupStatus();
    const intervalId = window.setInterval(refreshBackupStatus, 60 * 1000);
    window.addEventListener("muavin:backup-status-changed", refreshBackupStatus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("muavin:backup-status-changed", refreshBackupStatus);
    };
  }, [activeCompanyId, data.settings]);

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
        companyName: comp.companyName || freshData.settings.companyName,
        name: comp.companyName || freshData.settings.name,
        companyTitle: comp.companyTitle || comp.companyName || freshData.settings.companyTitle,
        title: comp.companyTitle || comp.companyName || freshData.settings.title,
        taxpayerType: comp.taxpayerType ?? freshData.settings.taxpayerType,
        taxOffice: comp.taxOffice || freshData.settings.taxOffice || "Merkez",
        taxNumber: comp.tenantIdentifierNumber || comp.vkn || comp.tckn || comp.taxNumber || freshData.settings.taxNumber,
        vkn: comp.vkn ?? freshData.settings.vkn,
        tckn: comp.tckn ?? freshData.settings.tckn,
        tradeRegisterNo: comp.tradeRegisterNo ?? freshData.settings.tradeRegisterNo ?? "",
        mersisNo: comp.mersisNo ?? freshData.settings.mersisNo ?? "",
        phone: comp.phone ?? freshData.settings.phone,
        email: comp.email ?? freshData.settings.email,
        website: comp.website ?? freshData.settings.website,
        address: comp.address ?? freshData.settings.address,
        city: comp.city ?? freshData.settings.city,
        district: comp.district ?? freshData.settings.district,
        neighborhood: comp.neighborhood ?? freshData.settings.neighborhood,
        street: comp.street ?? freshData.settings.street,
        buildingNo: comp.buildingNo ?? freshData.settings.buildingNo,
        doorNo: comp.doorNo ?? freshData.settings.doorNo,
        postalCode: comp.postalCode ?? freshData.settings.postalCode,
        addressDetails: comp.addressDetails ?? freshData.settings.addressDetails,
        defaultBankAccountName: comp.defaultBankAccountName ?? freshData.settings.defaultBankAccountName,
        defaultBankName: comp.defaultBankName ?? freshData.settings.defaultBankName,
        defaultBankIban: comp.defaultBankIban ?? freshData.settings.defaultBankIban,
        mysoftMatchedType: comp.mysoftMatchedType ?? freshData.settings.mysoftMatchedType,
        tenantIdentifierNumber: comp.tenantIdentifierNumber ?? freshData.settings.tenantIdentifierNumber,
        mysoftStatus: comp.mysoftStatus ?? freshData.settings.mysoftStatus,
        eFaturaPrefix: comp.eFaturaPrefix ?? freshData.settings.eFaturaPrefix,
        eFaturaNextNumber: comp.eFaturaNextNumber ?? freshData.settings.eFaturaNextNumber,
        eArsivPrefix: comp.eArsivPrefix ?? freshData.settings.eArsivPrefix,
        eArsivNextNumber: comp.eArsivNextNumber ?? freshData.settings.eArsivNextNumber,
        defaultInvoicePrefix: comp.eFaturaPrefix || freshData.settings.defaultInvoicePrefix,
        logoUrl:
          comp.logoUrl && comp.logoUrl !== "/logo.svg"
            ? comp.logoUrl
            : freshData.settings.logoUrl || comp.logoUrl || "/logo.svg",
        logoScale: comp.logoScale ?? freshData.settings.logoScale ?? 1,
      };
      saveStoredData("SETTINGS", freshData.settings, comp.id);
    }
    setData(freshData);
  };

  const handleAddCompany = (newComp: CompanyItem, makeActiveImmediately = true) => {
    const updatedList = addCompanyItem(newComp);
    setCompanies(updatedList);
    if (newComp.logoUrl && newComp.logoUrl !== "/logo.svg") {
      saveCloudLogo(
        newComp.logoUrl,
        { brandName: newComp.companyName, logoScale: newComp.logoScale ?? 1 },
        newComp.id
      ).catch(() => {});
    }
    if (makeActiveImmediately) {
      handleSelectCompany(newComp.id, updatedList);
    }
    void pushCompanyDataToCloud(newComp.id);
    void verifyAndSyncAllUsersLocalDb(
      0,
      "Sistem Yöneticisi",
      `Yeni Şirket Eklendi (${newComp.companyName}) ve Tüm Kullanıcılara Gönderildi`,
      true
    );
  };

  const handleUpdateCompany = (comp: CompanyItem) => {
    const updatedList = updateCompanyItem(comp);
    setCompanies(updatedList);
    saveCloudLogo(
      comp.logoUrl || "/logo.svg",
      { brandName: comp.companyName, logoScale: comp.logoScale ?? 1 },
      comp.id
    ).catch(() => {});
    const targetSettingsData = getStoredData(comp.id);
    const updatedTargetSettings: CompanySettings = {
      ...targetSettingsData.settings,
      companyName: comp.companyName || targetSettingsData.settings.companyName,
      name: comp.companyName || targetSettingsData.settings.name,
      companyTitle: comp.companyTitle || comp.companyName || targetSettingsData.settings.companyTitle,
      title: comp.companyTitle || comp.companyName || targetSettingsData.settings.title,
      taxpayerType: comp.taxpayerType ?? targetSettingsData.settings.taxpayerType,
      taxOffice: comp.taxOffice || targetSettingsData.settings.taxOffice,
      taxNumber:
        comp.taxNumber ||
        comp.vkn ||
        comp.tckn ||
        comp.tenantIdentifierNumber ||
        targetSettingsData.settings.taxNumber,
      vkn: comp.vkn ?? targetSettingsData.settings.vkn,
      tckn: comp.tckn ?? targetSettingsData.settings.tckn,
      tradeRegisterNo: comp.tradeRegisterNo ?? targetSettingsData.settings.tradeRegisterNo ?? "",
      mersisNo: comp.mersisNo ?? targetSettingsData.settings.mersisNo ?? "",
      phone: comp.phone ?? targetSettingsData.settings.phone,
      email: comp.email ?? targetSettingsData.settings.email,
      website: comp.website ?? targetSettingsData.settings.website,
      address: comp.address ?? targetSettingsData.settings.address,
      city: comp.city ?? targetSettingsData.settings.city,
      district: comp.district ?? targetSettingsData.settings.district,
      neighborhood: comp.neighborhood ?? targetSettingsData.settings.neighborhood,
      street: comp.street ?? targetSettingsData.settings.street,
      buildingNo: comp.buildingNo ?? targetSettingsData.settings.buildingNo,
      doorNo: comp.doorNo ?? targetSettingsData.settings.doorNo,
      postalCode: comp.postalCode ?? targetSettingsData.settings.postalCode,
      addressDetails: comp.addressDetails ?? targetSettingsData.settings.addressDetails,
      defaultBankAccountName: comp.defaultBankAccountName ?? targetSettingsData.settings.defaultBankAccountName,
      defaultBankName: comp.defaultBankName ?? targetSettingsData.settings.defaultBankName,
      defaultBankIban: comp.defaultBankIban ?? targetSettingsData.settings.defaultBankIban,
      mysoftMatchedType: comp.mysoftMatchedType ?? targetSettingsData.settings.mysoftMatchedType,
      tenantIdentifierNumber: comp.tenantIdentifierNumber ?? targetSettingsData.settings.tenantIdentifierNumber,
      mysoftStatus: comp.mysoftStatus ?? targetSettingsData.settings.mysoftStatus,
      eFaturaPrefix: comp.eFaturaPrefix ?? targetSettingsData.settings.eFaturaPrefix,
      eFaturaNextNumber: comp.eFaturaNextNumber ?? targetSettingsData.settings.eFaturaNextNumber,
      eArsivPrefix: comp.eArsivPrefix ?? targetSettingsData.settings.eArsivPrefix,
      eArsivNextNumber: comp.eArsivNextNumber ?? targetSettingsData.settings.eArsivNextNumber,
      defaultInvoicePrefix: comp.eFaturaPrefix || targetSettingsData.settings.defaultInvoicePrefix,
      logoUrl: comp.logoUrl || targetSettingsData.settings.logoUrl || "/logo.svg",
      logoScale: comp.logoScale ?? targetSettingsData.settings.logoScale ?? 1,
      mysoftCredentials: {
        ...targetSettingsData.settings.mysoftCredentials,
        tenantIdentifierNumber: comp.tenantIdentifierNumber || targetSettingsData.settings.tenantIdentifierNumber,
      },
    };
    saveStoredData("SETTINGS", updatedTargetSettings, comp.id);
    if (activeCompanyId === comp.id) {
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...updatedTargetSettings,
        },
      }));
      writeStoredMysoftTenantVkn(comp.tenantIdentifierNumber || comp.vkn || comp.tckn);
    }
    void pushCompanyDataToCloud(comp.id);
    void verifyAndSyncAllUsersLocalDb(
      0,
      "Sistem Yöneticisi",
      `Şirket Bilgileri Güncellendi (${comp.companyName}) ve Tüm Kullanıcılara Gönderildi`,
      true
    );
  };

  const handleDeleteCompany = (id: string) => {
    const updatedList = deleteCompanyItem(id);
    setCompanies(updatedList);
    void deleteUserProfile(`usr_comp_${id}`);
    if (activeCompanyId === id) {
      const nextId = updatedList.length > 0 ? updatedList[0].id : DEFAULT_COMPANY.id;
      handleSelectCompany(nextId, updatedList);
    }
    void verifyAndSyncAllUsersLocalDb(
      0,
      "Sistem Yöneticisi",
      "Şirket Kalıcı Olarak Silindi ve Yönetici Panelinde Kaydedildi",
      true
    );
  };

  // Quick Action Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [initialContactIdForInvoice, setInitialContactIdForInvoice] = useState<string | null>(null);
  const [isGitHubPublishOpen, setIsGitHubPublishOpen] = useState(false);

  // Tarayıcı Geri / İleri (History API - popstate & pushState) Senkronizasyonu
  const historyInitializedRef = useRef(false);
  const isApplyingPopStateRef = useRef(false);

  useEffect(() => {
    if (!historyInitializedRef.current) {
      historyInitializedRef.current = true;
      const initialHistoryState = initBrowserHistory({
        tab: currentTab,
        financeSubTab,
        selectedConstructionProjectId,
        activeCompanyId,
        isQuickAddOpen,
      });

      // URL / History state'te kayıtlı sekme varsa ilk açılışta geri yükle
      if (initialHistoryState.tab && initialHistoryState.tab !== currentTab) {
        isApplyingPopStateRef.current = true;
        setCurrentTab(initialHistoryState.tab as NavItem);
        if (initialHistoryState.financeSubTab) {
          setFinanceSubTab(initialHistoryState.financeSubTab as FinanceSubModule);
        }
        if (initialHistoryState.selectedConstructionProjectId !== undefined) {
          setSelectedConstructionProjectId(initialHistoryState.selectedConstructionProjectId);
        }
        setTimeout(() => {
          isApplyingPopStateRef.current = false;
        }, 0);
      }
    }

    const unsubscribePopState = onBrowserPopState((navState) => {
      isApplyingPopStateRef.current = true;
      if (navState.tab) {
        setCurrentTab(navState.tab as NavItem);
      }
      if (navState.financeSubTab) {
        setFinanceSubTab(navState.financeSubTab as FinanceSubModule);
      }
      setSelectedConstructionProjectId(navState.selectedConstructionProjectId ?? null);
      setIsQuickAddOpen(Boolean(navState.isQuickAddOpen));
      setIsMobileMenuOpen(false);
      if (navState.activeCompanyId && navState.activeCompanyId !== getActiveCompanyId()) {
        handleSelectCompany(navState.activeCompanyId);
      }
      setTimeout(() => {
        isApplyingPopStateRef.current = false;
      }, 0);
    });

    // Klavye kısayolları: Alt+Sol Ok (Geri), Alt+Sağ Ok (İleri)
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.altKey && !isInputFocused) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigateBrowserBack();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          navigateBrowserForward();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unsubscribePopState();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Sekme, alt sekme, şantiye projesi, hızlı işlem veya aktif şirket değiştiğinde tarayıcı geçmişine (history) ekle
  useEffect(() => {
    if (!historyInitializedRef.current || isApplyingPopStateRef.current) return;
    pushAppNavigationState({
      tab: currentTab,
      financeSubTab,
      selectedConstructionProjectId,
      activeCompanyId,
      isQuickAddOpen,
    });
  }, [currentTab, financeSubTab, selectedConstructionProjectId, activeCompanyId, isQuickAddOpen]);

  // Restore GitHub PAT from browser localStorage after container restarts & sync all companies/users
  const githubAutoSyncedRef = useRef(false);
  const isInitialCloudPullCompleteRef = useRef(false);
  const cloudPushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (githubAutoSyncedRef.current) return;
    githubAutoSyncedRef.current = true;

    const synced = syncAllCompaniesAndUsersData();
    if (synced.companies.length > 0) {
      setCompanies(synced.companies);
    }
    setData(getStoredData(getActiveCompanyId()));

    pullLatestCompanyDataFromCloud(undefined, true)
      .then(() =>
        verifyAndSyncAllUsersLocalDb(
          0,
          "Sistem Yöneticisi",
          "Tüm Şirketler ve Kullanıcılar Senkronize Edildi",
          false
        )
      )
      .then(() => {
        const freshCompanies = getCompaniesList();
        setCompanies(freshCompanies);
        const currentActive = getActiveCompanyId();
        setData(getStoredData(currentActive));
        isInitialCloudPullCompleteRef.current = true;
      })
      .catch(() => {
        isInitialCloudPullCompleteRef.current = true;
      });

    const handleCentralSync = () => {
      const freshCompanies = getCompaniesList();
      setCompanies(freshCompanies);
      const currentActive = getActiveCompanyId();
      setData(getStoredData(currentActive));
      try {
        const storedUserRaw =
          localStorage.getItem("muavin_active_user") ||
          sessionStorage.getItem("muavin_active_user");
        if (storedUserRaw) {
          const parsedU = JSON.parse(storedUserRaw);
          setCurrentUser((prev) => {
            if (!prev) return parsedU;
            if (
              prev.companyId !== parsedU.companyId ||
              prev.companyName !== parsedU.companyName ||
              prev.taxNumber !== parsedU.taxNumber ||
              JSON.stringify(prev.allowedModules) !== JSON.stringify(parsedU.allowedModules)
            ) {
              return parsedU;
            }
            return prev;
          });
        }
      } catch {}
    };
    window.addEventListener("muavin:central-sync-broadcast", handleCentralSync);
    const unsubscribeCentralSync = subscribeToCentralSyncState(() => {
      pullLatestCompanyDataFromCloud(getActiveCompanyId(), true).finally(() => {
        handleCentralSync();
      });
    });

    // Sekme odaklandığında (focus/visibility) ve periyodik olarak tüm kullanıcılara sunucu güncellemelerini yansıt
    let lastKnownServerVersion = 0;
    const checkServerUpdates = async () => {
      try {
        const activeId = getActiveCompanyId();
        const resp = await fetch(`/api/cloud-sync/state?companyId=${encodeURIComponent(activeId)}`);
        if (!resp.ok) return;
        const json = await resp.json();
        const incomingVersion = Number(json?.version) || 0;
        if (incomingVersion > 0 && incomingVersion !== lastKnownServerVersion) {
          lastKnownServerVersion = incomingVersion;
          await pullLatestCompanyDataFromCloud(activeId, true);
          handleCentralSync();
        }
      } catch {
        // ignore offline check
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void checkServerUpdates();
      }
    };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    const pollInterval = setInterval(() => {
      void checkServerUpdates();
    }, 15000);

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
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      clearInterval(pollInterval);
      unsubscribeCentralSync();
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
    if (currentUser && isAdminOrSysAdmin(currentUser)) {
      setCurrentTab("admin");
    }
  }, [currentUser]);

  // Oturum açan kullanıcının tanımlı bir şirketi varsa aktif şirketi otomatik olarak o şirkete geçir ve en güncel verilerini yükle
  const lastAutoSwitchedUserCompanyRef = useRef<string>("");
  useEffect(() => {
    if (!currentUser) return;
    const isSysAdmin = isAdminOrSysAdmin(currentUser);
    let targetComp = currentUser.companyId
      ? companies.find((c) => c.id === currentUser.companyId)
      : undefined;

    if (!targetComp && !isSysAdmin) {
      const cleanEmail = (currentUser.email || "").trim().toLowerCase();
      const cleanUser = (currentUser.username || "").trim().toLowerCase();
      const cleanTax = String(currentUser.taxNumber || "").replace(/\D/g, "").trim();
      const cleanName = (currentUser.companyName || "").trim().toLocaleLowerCase("tr-TR");

      targetComp = companies.find(
        (c) =>
          (cleanEmail && (c.loginEmail || c.email || "").trim().toLowerCase() === cleanEmail) ||
          (cleanUser && (c.loginUsername || "").trim().toLowerCase() === cleanUser) ||
          (cleanTax.length >= 10 &&
            (String(c.taxNumber || "").replace(/\D/g, "") === cleanTax ||
              String(c.vkn || "").replace(/\D/g, "") === cleanTax ||
              String(c.tckn || "").replace(/\D/g, "") === cleanTax ||
              String(c.tenantIdentifierNumber || "").replace(/\D/g, "") === cleanTax)) ||
          (cleanName &&
            ((c.companyName || "").trim().toLocaleLowerCase("tr-TR") === cleanName ||
              (c.companyTitle || "").trim().toLocaleLowerCase("tr-TR") === cleanName))
      );
    }

    if (targetComp && (!isSysAdmin || currentUser.companyId === targetComp.id)) {
      const switchKey = `${currentUser.id || currentUser.email || "user"}_${targetComp.id}_${activeCompanyId}`;
      if (lastAutoSwitchedUserCompanyRef.current === switchKey) return;
      lastAutoSwitchedUserCompanyRef.current = switchKey;

      if (currentUser.companyId !== targetComp.id) {
        const updatedUser = { ...currentUser, companyId: targetComp.id, companyName: targetComp.companyName };
        setCurrentUser(updatedUser);
        if (localStorage.getItem("muavin_active_user")) {
          localStorage.setItem("muavin_active_user", JSON.stringify(updatedUser));
        }
        if (sessionStorage.getItem("muavin_active_user")) {
          sessionStorage.setItem("muavin_active_user", JSON.stringify(updatedUser));
        }
      }
      if (!isSysAdmin && activeCompanyId !== targetComp.id) {
        handleSelectCompany(targetComp.id, companies);
        void pullLatestCompanyDataFromCloud(targetComp.id, true).then(() => {
          const refreshedList = getCompaniesList();
          setCompanies(refreshedList);
          handleSelectCompany(targetComp!.id, refreshedList);
        });
      }
    }
  }, [currentUser, companies, activeCompanyId]);

  useEffect(() => {
    cleanupOversizedStorage();
  }, []);

  // Google Cloud Console: Şirket bazlı logoyu ve kurumsal kimlik ayarlarını Firestore'dan çek ve canlı dinle
  useEffect(() => {
    let isMounted = true;

    const applyCloudBranding = (branding: any) => {
      if (!isMounted || !branding) return;
      const activeId = getActiveCompanyId();
      const companyMap = branding.companyLogos || {};

      if (Object.keys(companyMap).length > 0) {
        const currentList = getCompaniesList();
        let listChanged = false;
        currentList.forEach((comp) => {
          const entry = companyMap[comp.id];
          if (entry && entry.logoUrl) {
            const shouldUseCloudLogo =
              (!comp.logoUrl || comp.logoUrl === "/logo.svg") && entry.logoUrl !== "/logo.svg";
            const nextLogo = shouldUseCloudLogo ? entry.logoUrl : comp.logoUrl || entry.logoUrl;
            const nextScale = comp.logoScale ?? entry.logoScale ?? 1;
            if (nextLogo !== comp.logoUrl || nextScale !== comp.logoScale) {
              updateCompanyItem({ ...comp, logoUrl: nextLogo, logoScale: nextScale });
              listChanged = true;
            }
          }
        });
        if (listChanged) {
          setCompanies(getCompaniesList());
        }
      }

      const activeComp = getCompaniesList().find((c) => c.id === activeId);
      const cloudEntryForActive = companyMap[activeId];
      const targetLogoUrl =
        (activeComp?.logoUrl && activeComp.logoUrl !== "/logo.svg" ? activeComp.logoUrl : undefined) ||
        cloudEntryForActive?.logoUrl ||
        (activeId === "comp_default" ? branding.logoUrl : undefined) ||
        activeComp?.logoUrl ||
        "/logo.svg";
      const targetScale =
        activeComp?.logoScale ?? cloudEntryForActive?.logoScale ?? branding.logoScale ?? 1;

      setData((prev) => {
        const currentLogo = prev.settings?.logoUrl;
        const currentScale = prev.settings?.logoScale ?? 1;
        if (
          targetLogoUrl === "/logo.svg" &&
          currentLogo &&
          currentLogo !== "/logo.svg"
        ) {
          return prev;
        }
        if (currentLogo !== targetLogoUrl || currentScale !== targetScale) {
          const nextSettings = {
            ...prev.settings,
            logoUrl: targetLogoUrl,
            logoScale: targetScale,
          };
          saveStoredData("SETTINGS", nextSettings, activeId);
          return {
            ...prev,
            settings: nextSettings,
          };
        }
        return prev;
      });
    };

    // 1. İlk açılışta Cloud Console'dan çek
    fetchCloudLogo().then((branding) => {
      applyCloudBranding(branding);
    });

    // 2. Cloud Console Firestore (system_settings/branding) gerçek zamanlı güncellemelerini dinle
    const unsubscribe = subscribeToCloudLogo((branding) => {
      applyCloudBranding(branding);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeCompanyId]);

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

  // Şirket kullanıcısı herhangi bir değişiklik yaptığında (fatura, cari, şube, depo, ayarlar vb.) bulut deposuna otomatik senkronize et
  useEffect(() => {
    if (!isInitialCloudPullCompleteRef.current) return;
    if (cloudPushTimerRef.current) {
      clearTimeout(cloudPushTimerRef.current);
    }
    cloudPushTimerRef.current = setTimeout(() => {
      void pushCompanyDataToCloud(activeCompanyId, data);
    }, 600);
    return () => {
      if (cloudPushTimerRef.current) {
        clearTimeout(cloudPushTimerRef.current);
      }
    };
  }, [data, activeCompanyId]);

  // Auto & IT & Appliance & Construction Service Handlers (Bidirectionally synced with Invoices & CostProjects)
  const handleUpdateAutoServices = (services: AutoServiceRecord[]) => {
    const prevList = data.autoServices || [];
    const newIds = new Set(services.map((s) => s.id));
    const removedServices = prevList.filter((s) => !newIds.has(s.id));
    const linkedInvoiceIdsToDelete = removedServices
      .filter((s) => s.isInvoiced)
      .flatMap((s) =>
        (data.invoices || [])
          .filter(
            (inv) =>
              inv.id === s.invoiceId ||
              inv.invoiceNumber === s.invoiceNumber ||
              inv.serviceRecordId === s.id
          )
          .map((inv) => inv.id)
      );

    setData((prev) => ({ ...prev, autoServices: services }));
    if (linkedInvoiceIdsToDelete.length > 0) {
      handleBulkDeleteInvoices(Array.from(new Set(linkedInvoiceIdsToDelete)));
    }
  };

  const handleUpdateItServices = (services: ItServiceRecord[]) => {
    const prevList = data.itServices || [];
    const newIds = new Set(services.map((s) => s.id));
    const removedServices = prevList.filter((s) => !newIds.has(s.id));
    const linkedInvoiceIdsToDelete = removedServices
      .filter((s) => s.isInvoiced)
      .flatMap((s) =>
        (data.invoices || [])
          .filter(
            (inv) =>
              inv.id === s.invoiceId ||
              inv.invoiceNumber === s.invoiceNumber ||
              inv.serviceRecordId === s.id
          )
          .map((inv) => inv.id)
      );

    setData((prev) => ({ ...prev, itServices: services }));
    if (linkedInvoiceIdsToDelete.length > 0) {
      handleBulkDeleteInvoices(Array.from(new Set(linkedInvoiceIdsToDelete)));
    }
  };

  const handleUpdateApplianceServices = (services: ApplianceServiceRecord[]) => {
    const prevList = data.applianceServices || [];
    const newIds = new Set(services.map((s) => s.id));
    const removedServices = prevList.filter((s) => !newIds.has(s.id));
    const linkedInvoiceIdsToDelete = removedServices
      .filter((s) => s.isInvoiced)
      .flatMap((s) =>
        (data.invoices || [])
          .filter(
            (inv) =>
              inv.id === s.invoiceId ||
              inv.invoiceNumber === s.invoiceNumber ||
              inv.serviceRecordId === s.id
          )
          .map((inv) => inv.id)
      );

    setData((prev) => ({ ...prev, applianceServices: services }));
    if (linkedInvoiceIdsToDelete.length > 0) {
      handleBulkDeleteInvoices(Array.from(new Set(linkedInvoiceIdsToDelete)));
    }
  };

  const handleUpdateConstructionProjects = (projects: ConstructionProject[]) => {
    setData((prev) => {
      const prevProjects = prev.constructionProjects || [];
      const newIds = new Set(projects.map((p) => p.id));
      const removedProjectIds = new Set(prevProjects.filter((p) => !newIds.has(p.id)).map((p) => p.id));

      // Keep CostProjects bidirectionally synced with ConstructionProjects
      let updatedCostProjects = (prev.costProjects || []).filter((cp) => !removedProjectIds.has(cp.id));
      projects.forEach((proj) => {
        const existingIdx = updatedCostProjects.findIndex((cp) => cp.id === proj.id);
        const mappedCostProject = {
          id: proj.id,
          code: proj.code,
          name: proj.name,
          managerName: proj.contractorName || "Şantiye Şefi",
          startDate: proj.startDate,
          endDate: proj.estimatedEndDate,
          status:
            proj.status === "completed"
              ? "completed"
              : proj.status === "suspended"
              ? "paused"
              : "active",
          budgetLimit: proj.totalCost * 1.15,
          description: `${proj.projectType} - ${proj.totalConstructionAreaM2} m² İnşaat Projesi`,
        } as unknown as CostProject;
        if (existingIdx >= 0) {
          updatedCostProjects[existingIdx] = {
            ...updatedCostProjects[existingIdx],
            ...mappedCostProject,
          };
        } else {
          updatedCostProjects = [mappedCostProject, ...updatedCostProjects];
        }
      });

      const updatedEmployees =
        removedProjectIds.size > 0
          ? (prev.employees || []).map((emp) =>
              emp.costProjectId && removedProjectIds.has(emp.costProjectId)
                ? { ...emp, costProjectId: undefined, costProjectName: undefined }
                : emp
            )
          : prev.employees;

      return {
        ...prev,
        constructionProjects: projects,
        costProjects: updatedCostProjects,
        employees: updatedEmployees,
      };
    });
  };

  // Handlers for Cost Projects (Bidirectionally synced with ConstructionProjects & HR Employees)
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
      constructionProjects: (prev.constructionProjects || []).map((cp) =>
        cp.id === updatedProject.id ? { ...cp, name: updatedProject.name, code: updatedProject.code } : cp
      ),
      employees: (prev.employees || []).map((emp) =>
        emp.costProjectId === updatedProject.id ? { ...emp, costProjectName: updatedProject.name } : emp
      ),
    }));
  };

  const handleDeleteCostProject = (projectId: string) => {
    setData((prev) => ({
      ...prev,
      costProjects: (prev.costProjects || []).filter((p) => p.id !== projectId),
      constructionProjects: (prev.constructionProjects || []).filter((cp) => cp.id !== projectId),
      employees: (prev.employees || []).map((emp) =>
        emp.costProjectId === projectId
          ? { ...emp, costProjectId: undefined, costProjectName: undefined }
          : emp
      ),
    }));
  };

  // Handlers for Waybills (İrsaliyeler) - Bidirectionally linked with Invoices
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
    handleBulkDeleteWaybills([waybillId]);
  };

  const handleBulkDeleteWaybills = (ids: string[]) => {
    const targetWaybills = (data.waybills || []).filter((w) => ids.includes(w.id));
    const linkedInvoiceIds: string[] = Array.from(
      new Set<string>(
        targetWaybills
          .flatMap((w) => {
            const matchedInvs = (data.invoices || []).filter(
              (inv) =>
                inv.id === w.invoicedInvoiceId ||
                (w.invoicedInvoiceNumber && inv.invoiceNumber === w.invoicedInvoiceNumber) ||
                inv.waybillId === w.id
            );
            return [w.invoicedInvoiceId, ...matchedInvs.map((i) => i.id)];
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).filter((w) => !ids.includes(w.id)),
    }));

    if (linkedInvoiceIds.length > 0) {
      handleBulkDeleteInvoices(linkedInvoiceIds);
    }
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
      waybillId: waybill.id,
    };

    const updatedWaybill: Waybill = {
      ...waybill,
      status: "invoiced",
      invoicedInvoiceId: newInvoice.id,
      invoicedInvoiceNumber: newInvoice.invoiceNumber,
    };

    setData((prev) => ({
      ...prev,
      waybills: (prev.waybills || []).map((w) => (w.id === waybill.id ? updatedWaybill : w)),
    }));

    handleAddInvoice(newInvoice);
  };

  // Handlers for Orders (Bidirectionally linked with Quotes & Invoices)
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
    handleBulkDeleteOrders([orderId]);
  };

  const handleBulkDeleteOrders = (ids: string[]) => {
    const targetOrders = (data.orders || []).filter((o) => ids.includes(o.id));
    const linkedInvoiceIds: string[] = Array.from(
      new Set<string>(
        targetOrders
          .flatMap((o) => {
            const matchedInvs = (data.invoices || []).filter(
              (inv) =>
                inv.id === o.convertedToInvoiceId ||
                (o.convertedToInvoiceNumber && inv.invoiceNumber === o.convertedToInvoiceNumber) ||
                inv.orderId === o.id ||
                (inv.notes && inv.notes.includes(`Sipariş No: ${o.orderNumber}`))
            );
            return [o.convertedToInvoiceId, ...matchedInvs.map((i) => i.id)];
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    const linkedQuoteIds: string[] = Array.from(
      new Set<string>(
        targetOrders
          .flatMap((o) => {
            const matchedQuotes = (data.quotes || []).filter(
              (q) =>
                q.id === o.quoteId ||
                q.convertedOrderId === o.id ||
                (o.notes && o.notes.includes(`Belge No: ${q.quoteNumber}`))
            );
            return [o.quoteId, ...matchedQuotes.map((q) => q.id)];
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).filter((o) => !ids.includes(o.id)),
      quotes: (prev.quotes || []).filter((q) => !linkedQuoteIds.includes(q.id)),
    }));

    if (linkedInvoiceIds.length > 0) {
      handleBulkDeleteInvoices(linkedInvoiceIds);
    }
  };

  const handleConvertOrderToInvoice = (order: Order) => {
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
      orderId: order.id,
      quoteId: order.quoteId,
    };

    const updatedOrder: Order = {
      ...order,
      status: "converted",
      convertedToInvoiceId: newInvoice.id,
      convertedToInvoiceNumber: newInvoice.invoiceNumber,
    };

    setData((prev) => ({
      ...prev,
      orders: (prev.orders || []).map((o) => (o.id === order.id ? updatedOrder : o)),
    }));

    handleAddInvoice(newInvoice);
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
      employees: (prev.employees || []).map((emp) =>
        emp.branchId === branch.id ? { ...emp, branchName: branch.name } : emp
      ),
    }));
  };

  const handleDeleteBranch = (id: string) => {
    setData((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((b) => b.id !== id),
      employees: (prev.employees || []).map((emp) =>
        emp.branchId === id ? { ...emp, branchId: undefined, branchName: undefined } : emp
      ),
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
      employees: (prev.employees || []).map((emp) =>
        emp.warehouseId === wh.id ? { ...emp, warehouseName: wh.name } : emp
      ),
    }));
  };

  const handleDeleteWarehouse = (id: string) => {
    setData((prev) => ({
      ...prev,
      warehouses: (prev.warehouses || []).filter((w) => w.id !== id),
      employees: (prev.employees || []).map((emp) =>
        emp.warehouseId === id ? { ...emp, warehouseId: undefined, warehouseName: undefined } : emp
      ),
    }));
  };

  // Handlers for Accounts & Finance Entities
  const handleUpdateAccount = (account: Account) => {
    void saveAccountToDatabase(account, activeCompanyId);
    setData((prev) => {
      const updatedAccounts = prev.accounts.map((a) => (a.id === account.id ? account : a));
      let updatedTransactions = prev.transactions.map((t) =>
        t.accountId === account.id ? { ...t, accountName: account.name } : t
      );

      // Eğer kullanıcı düzenleme ekranında hesap bakiyesini değiştirdiyse hareket toplamıyla farkı açılış/düzeltme fişi olarak eşitle
      const currentTxSum = updatedTransactions.reduce((sum, tx) => {
        if (tx.accountId !== account.id) return sum;
        const isInc = tx.type === "income" || tx.type === "collection";
        return sum + (isInc ? Number(tx.amount) || 0 : -(Number(tx.amount) || 0));
      }, 0);
      const targetBal = Math.round((Number(account.balance) || 0) * 100) / 100;
      const diff = Math.round((targetBal - currentTxSum) * 100) / 100;
      if (Math.abs(diff) >= 0.01) {
        const adjTx: Transaction = {
          id: `tx_adj_${account.id}_${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          type: diff > 0 ? "income" : "expense",
          amount: Math.abs(diff),
          currency: account.currency || "TRY",
          accountId: account.id,
          accountName: account.name,
          category: "Bakiye Düzeltme / Devir",
          description: `${account.name} bakiye güncellemesi`,
        };
        void saveTransactionToDatabase(adjTx, activeCompanyId);
        updatedTransactions = [adjTx, ...updatedTransactions];
      }

      const nextState = {
        ...prev,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
        invoices: prev.invoices.map((inv) =>
          inv.paymentAccountId === account.id ? { ...inv, paymentAccountName: account.name } : inv
        ),
      };
      saveStoredData("ACCOUNTS", nextState.accounts, activeCompanyId);
      saveStoredData("TRANSACTIONS", nextState.transactions, activeCompanyId);
      void pushCompanyDataToCloud(activeCompanyId, nextState);
      return nextState;
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (!id) return;
    void deleteAccountFromDatabase(id, activeCompanyId);
    const accountTxs = data.transactions.filter((t) => t.accountId === id);
    if (accountTxs.length > 0) {
      handleBulkDeleteTransactions(accountTxs.map((t) => t.id));
    }
    setData((prev) => {
      const updatedAccounts = prev.accounts.filter((a) => a.id !== id);
      const updatedTransactions = prev.transactions.filter((t) => t.accountId !== id);
      const nextState = {
        ...prev,
        accounts: updatedAccounts,
        transactions: updatedTransactions,
      };
      saveStoredData("ACCOUNTS", updatedAccounts, activeCompanyId);
      saveStoredData("TRANSACTIONS", updatedTransactions, activeCompanyId);
      void pushCompanyDataToCloud(activeCompanyId, nextState);
      return nextState;
    });
  };

  const handleUpdateTransaction = (tx: Transaction) => {
    void saveTransactionToDatabase(tx, activeCompanyId);
    setData((prev) => {
      const oldTx = prev.transactions.find((t) => t.id === tx.id);
      if (!oldTx) {
        return {
          ...prev,
          transactions: prev.transactions.map((t) => (t.id === tx.id ? tx : t)),
        };
      }

      const oldIsInc = oldTx.type === "income" || oldTx.type === "collection";
      const newIsInc = tx.type === "income" || tx.type === "collection";

      // 1. Update Account balances (reverse oldTx, apply new tx)
      const updatedAccounts = prev.accounts.map((acc) => {
        let bal = acc.balance;
        if (acc.id === oldTx.accountId) {
          bal += oldIsInc ? -oldTx.amount : oldTx.amount;
        }
        if (acc.id === tx.accountId) {
          bal += newIsInc ? tx.amount : -tx.amount;
        }
        return bal === acc.balance ? acc : { ...acc, balance: bal };
      });

      // 2. Update Contact balances (reverse oldTx, apply new tx)
      const updatedContacts = prev.contacts.map((c) => {
        let bal = c.balance;
        if (oldTx.contactId && c.id === oldTx.contactId) {
          bal += oldIsInc ? oldTx.amount : -oldTx.amount;
        }
        if (tx.contactId && c.id === tx.contactId) {
          bal += newIsInc ? -tx.amount : tx.amount;
        }
        if (bal === c.balance) return c;
        return {
          ...c,
          balance: bal,
          balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      // 3. Update Product stocks if items changed
      let updatedProducts = prev.products;
      if ((oldTx.items && oldTx.items.length > 0) || (tx.items && tx.items.length > 0)) {
        updatedProducts = prev.products.map((p) => {
          let stock = p.stockQuantity;
          (oldTx.items || []).forEach((item) => {
            if (item.productId === p.id) {
              stock += oldIsInc ? item.quantity : -item.quantity;
            }
          });
          (tx.items || []).forEach((item) => {
            if (item.productId === p.id) {
              stock += newIsInc ? -item.quantity : item.quantity;
            }
          });
          return stock === p.stockQuantity ? p : { ...p, stockQuantity: Math.max(0, stock) };
        });
      }

      // 4. Update linked Invoice paidAmount / remainingAmount if amount changed
      let updatedInvoices = prev.invoices;
      if (tx.invoiceId && oldTx.amount !== tx.amount) {
        const diff = tx.amount - oldTx.amount;
        updatedInvoices = prev.invoices.map((inv) => {
          if (inv.id !== tx.invoiceId) return inv;
          const targetPayable = inv.payableAmount ?? inv.grandTotal;
          const newPaid = Math.max(0, (inv.paidAmount || 0) + diff);
          const newRemaining = Math.max(0, targetPayable - newPaid);
          const newStatus = newRemaining <= 0 ? "paid" : newPaid > 0 ? "partial" : "sent";
          return {
            ...inv,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus as any,
          };
        });
      }

      return {
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === tx.id ? tx : t)),
        accounts: updatedAccounts,
        contacts: updatedContacts,
        products: updatedProducts,
        invoices: updatedInvoices,
      };
    });
  };

  const handleUpdateCheque = (cheque: Cheque) => {
    setData((prev) => {
      const oldCheque = (prev.cheques || []).find((c) => c.id === cheque.id);
      let updatedContacts = prev.contacts;
      if (oldCheque && (oldCheque.amount !== cheque.amount || oldCheque.contactId !== cheque.contactId || oldCheque.type !== cheque.type)) {
        updatedContacts = prev.contacts.map((c) => {
          let bal = c.balance;
          if (oldCheque.contactId && c.id === oldCheque.contactId) {
            bal += oldCheque.type === "received" ? oldCheque.amount : -oldCheque.amount;
          }
          if (cheque.contactId && c.id === cheque.contactId) {
            bal += cheque.type === "received" ? -cheque.amount : cheque.amount;
          }
          if (bal === c.balance) return c;
          return {
            ...c,
            balance: bal,
            balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
          };
        });
      }
      return {
        ...prev,
        cheques: (prev.cheques || []).map((c) => (c.id === cheque.id ? cheque : c)),
        contacts: updatedContacts,
      };
    });
  };

  const handleUpdatePromissoryNote = (note: PromissoryNote) => {
    setData((prev) => {
      const oldNote = (prev.promissoryNotes || []).find((n) => n.id === note.id);
      let updatedContacts = prev.contacts;
      if (oldNote && (oldNote.amount !== note.amount || oldNote.contactId !== note.contactId || oldNote.type !== note.type)) {
        updatedContacts = prev.contacts.map((c) => {
          let bal = c.balance;
          if (oldNote.contactId && c.id === oldNote.contactId) {
            bal += oldNote.type === "received" ? oldNote.amount : -oldNote.amount;
          }
          if (note.contactId && c.id === note.contactId) {
            bal += note.type === "received" ? -note.amount : note.amount;
          }
          if (bal === c.balance) return c;
          return {
            ...c,
            balance: bal,
            balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
          };
        });
      }
      return {
        ...prev,
        promissoryNotes: (prev.promissoryNotes || []).map((n) => (n.id === note.id ? note : n)),
        contacts: updatedContacts,
      };
    });
  };

  // Handlers for Contacts (Bidirectionally synced with Invoices, Transactions, Cheques, Notes, Orders, Quotes, Waybills, Services)
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
      invoices: prev.invoices.map((inv) =>
        inv.contactId === contact.id ? { ...inv, contactName: contact.name } : inv
      ),
      transactions: prev.transactions.map((tx) =>
        tx.contactId === contact.id ? { ...tx, contactName: contact.name } : tx
      ),
      cheques: (prev.cheques || []).map((chq) =>
        chq.contactId === contact.id ? { ...chq, contactName: contact.name } : chq
      ),
      promissoryNotes: (prev.promissoryNotes || []).map((n) =>
        n.contactId === contact.id ? { ...n, contactName: contact.name } : n
      ),
      orders: (prev.orders || []).map((o) =>
        o.contactId === contact.id ? { ...o, contactName: contact.name } : o
      ),
      quotes: (prev.quotes || []).map((q) =>
        q.contactId === contact.id ? { ...q, contactName: contact.name } : q
      ),
      waybills: (prev.waybills || []).map((w) =>
        w.contactId === contact.id ? { ...w, contactName: contact.name } : w
      ),
    }));
  };

  const handleDeleteContact = (id: string) => {
    handleBulkDeleteContacts([id]);
  };

  const handleBulkDeleteContacts = (ids: string[]) => {
    const idSet = new Set(ids);
    const contactInvoices = data.invoices.filter((i) => idSet.has(i.contactId));
    const contactTxs = data.transactions.filter((t) => t.contactId && idSet.has(t.contactId));
    const contactCheques = (data.cheques || []).filter((c) => c.contactId && idSet.has(c.contactId));
    const contactNotes = (data.promissoryNotes || []).filter((n) => n.contactId && idSet.has(n.contactId));

    if (contactInvoices.length > 0) {
      handleBulkDeleteInvoices(contactInvoices.map((i) => i.id));
    }
    if (contactTxs.length > 0) {
      handleBulkDeleteTransactions(contactTxs.map((t) => t.id));
    }
    if (contactCheques.length > 0) {
      handleBulkDeleteCheques(contactCheques.map((c) => c.id));
    }
    if (contactNotes.length > 0) {
      handleBulkDeletePromissoryNotes(contactNotes.map((n) => n.id));
    }

    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => !idSet.has(c.id)),
      orders: (prev.orders || []).filter((o) => !idSet.has(o.contactId)),
      quotes: (prev.quotes || []).filter((q) => !idSet.has(q.contactId)),
      waybills: (prev.waybills || []).filter((w) => !idSet.has(w.contactId)),
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
    void saveInvoiceToDatabase(invoice, activeCompanyId);
    setData((prev) => {
      const isDraftOrCancelled = invoice.status === "draft" || invoice.status === "cancelled";

      // 1. Update contact balance only when invoice is officially issued (not draft/cancelled)
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

      // 2. Update product stock quantities for all items in the invoice
      const updatedProducts = isDraftOrCancelled
        ? prev.products
        : prev.products.map((p) => {
            const matchingItems = (invoice.items || []).filter(
              (item) =>
                item.productId === p.id ||
                (item.productCode && p.code && item.productCode === p.code)
            );
            if (matchingItems.length === 0) return p;
            const totalQty = matchingItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            const newStock =
              invoice.type === "sales"
                ? p.stockQuantity - totalQty
                : p.stockQuantity + totalQty;
            return {
              ...p,
              stockQuantity: Math.max(0, newStock),
            };
          });

      // 3. Advance Mysoft e-Fatura / e-Arşiv sequential invoice number when issuing a non-draft sales invoice
      let updatedSettings = prev.settings;
      if (!isDraftOrCancelled && invoice.type === "sales" && invoice.docKind !== "receipt") {
        const cleanNo = String(invoice.invoiceNumber || "").trim().toUpperCase();
        const serialMatch = cleanNo.match(/^([A-Z0-9]{3})(20\d{2})(\d{1,9})$/);
        const isGyrDoc = cleanNo.startsWith("GYR") || invoice.eDocumentType === "paper";
        if (serialMatch && !isGyrDoc) {
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
                  eArsivPrefix: usedPrefix,
                  eArsivNextNumber: nextSerialNo,
                }
              : {
                  eFaturaPrefix: usedPrefix,
                  eFaturaNextNumber: nextSerialNo,
                }),
          };
          saveStoredData("SETTINGS", updatedSettings, activeCompanyId);

          const activeComp = companies.find((c) => c.id === activeCompanyId);
          if (activeComp) {
            const updatedComp: CompanyItem = {
              ...activeComp,
              ...(isEArsivDoc
                ? {
                    eArsivPrefix: usedPrefix,
                    eArsivNextNumber: nextSerialNo,
                  }
                : {
                    eFaturaPrefix: usedPrefix,
                    eFaturaNextNumber: nextSerialNo,
                  }),
            };
            const updatedCompList = updateCompanyItem(updatedComp);
            setCompanies(updatedCompList);
          }
        }
      }

      if (invoice.type === "sales" && invoice.docKind !== "receipt") {
        upsertOutgoingEDocumentFromSalesInvoice(invoice, updatedSettings, activeCompanyId);
      }

      // 4. If invoice was created as already "paid" without a linked transaction (e.g. from ServiceInvoicingModal), create its paired Transaction and update account balance
      let updatedTransactions = prev.transactions;
      let updatedAccounts = prev.accounts;
      if (
        !isDraftOrCancelled &&
        invoice.status === "paid" &&
        (invoice.paidAmount || 0) > 0 &&
        !prev.transactions.some((t) => t.invoiceId === invoice.id)
      ) {
        const payAcc =
          prev.accounts.find((a) => a.id === invoice.paymentAccountId) || prev.accounts[0];
        if (payAcc) {
          const isSales = invoice.type === "sales";
          const amountToPay = invoice.paidAmount || invoice.grandTotal;
          const autoTx: Transaction = {
            id: `tx_inv_${invoice.id}`,
            date: invoice.issueDate || new Date().toISOString().split("T")[0],
            type: isSales ? "collection" : "payment",
            amount: amountToPay,
            currency: invoice.currency || "TRY",
            accountId: payAcc.id,
            accountName: payAcc.name,
            contactId: invoice.contactId,
            contactName: invoice.contactName,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            serviceRecordId: invoice.serviceRecordId,
            category: isSales ? "Fatura Tahsilatı" : "Fatura Ödemesi",
            description: `${invoice.invoiceNumber} nolu fatura ${isSales ? "peşin tahsilatı" : "peşin ödemesi"}`,
          };
          void saveTransactionToDatabase(autoTx, activeCompanyId);
          updatedTransactions = [autoTx, ...prev.transactions];
          updatedAccounts = prev.accounts.map((a) =>
            a.id === payAcc.id
              ? { ...a, balance: isSales ? a.balance + amountToPay : a.balance - amountToPay }
              : a
          );
          // Adjust contact balance for the immediate collection/payment so net balance change is 0
          const paidDelta = isSales ? -amountToPay : amountToPay;
          return {
            ...prev,
            settings: updatedSettings,
            invoices: [
              {
                ...invoice,
                paymentAccountId: payAcc.id,
                paymentAccountName: payAcc.name,
              },
              ...prev.invoices,
            ],
            products: updatedProducts,
            transactions: updatedTransactions,
            accounts: updatedAccounts,
            contacts: (updatedContacts as Contact[]).map((c) => {
              if (c.id !== invoice.contactId) return c;
              const finalBal = c.balance + paidDelta;
              return {
                ...c,
                balance: finalBal,
                balanceType:
                  finalBal > 0 ? "receivable" : finalBal < 0 ? "payable" : "balanced",
              };
            }),
          };
        }
      }

      return {
        ...prev,
        settings: updatedSettings,
        invoices: [invoice, ...prev.invoices],
        products: updatedProducts,
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
    void saveInvoiceToDatabase(updatedInvoice, activeCompanyId);
    setData((prev) => {
      const oldInvoice = prev.invoices.find((i) => i.id === updatedInvoice.id);
      let updatedContacts = prev.contacts;
      let updatedProducts = prev.products;
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

        // Update product stocks when invoice items or status change
        updatedProducts = prev.products.map((p) => {
          let stock = p.stockQuantity;
          if (!oldWasInactive) {
            (oldInvoice.items || []).forEach((item) => {
              if (item.productId === p.id || (item.productCode && p.code && item.productCode === p.code)) {
                stock += oldInvoice.type === "sales" ? item.quantity : -item.quantity;
              }
            });
          }
          if (!newIsInactive) {
            (updatedInvoice.items || []).forEach((item) => {
              if (item.productId === p.id || (item.productCode && p.code && item.productCode === p.code)) {
                stock += updatedInvoice.type === "sales" ? -item.quantity : item.quantity;
              }
            });
          }
          return stock === p.stockQuantity ? p : { ...p, stockQuantity: Math.max(0, stock) };
        });

        // If transitioning from draft to an issued sales invoice, advance Mysoft serial counter
        if (
          oldInvoice.status === "draft" &&
          !newIsInactive &&
          updatedInvoice.type === "sales" &&
          updatedInvoice.docKind !== "receipt"
        ) {
          const cleanNo = String(updatedInvoice.invoiceNumber || "").trim().toUpperCase();
          const serialMatch = cleanNo.match(/^([A-Z0-9]{3})(20\d{2})(\d{1,9})$/);
          const isGyrDoc = cleanNo.startsWith("GYR") || updatedInvoice.eDocumentType === "paper";
          if (serialMatch && !isGyrDoc) {
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
                    eArsivPrefix: usedPrefix,
                    eArsivNextNumber: nextSerialNo,
                  }
                : {
                    eFaturaPrefix: usedPrefix,
                    eFaturaNextNumber: nextSerialNo,
                  }),
            };
            saveStoredData("SETTINGS", updatedSettings, activeCompanyId);

            const activeComp = companies.find((c) => c.id === activeCompanyId);
            if (activeComp) {
              const updatedComp: CompanyItem = {
                ...activeComp,
                ...(isEArsivDoc
                  ? {
                      eArsivPrefix: usedPrefix,
                      eArsivNextNumber: nextSerialNo,
                    }
                  : {
                      eFaturaPrefix: usedPrefix,
                      eFaturaNextNumber: nextSerialNo,
                    }),
              };
              const updatedCompList = updateCompanyItem(updatedComp);
              setCompanies(updatedCompList);
            }
          }
        }
      }

      if (updatedInvoice.type === "sales" && updatedInvoice.docKind !== "receipt") {
        upsertOutgoingEDocumentFromSalesInvoice(updatedInvoice, updatedSettings, activeCompanyId);
      }

      return {
        ...prev,
        settings: updatedSettings,
        invoices: prev.invoices.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)),
        products: updatedProducts,
        contacts: updatedContacts as Contact[],
      };
    });
  };

  const handleDeleteInvoice = (id: string) => {
    handleBulkDeleteInvoices([id]);
  };

  const handleBulkDeleteInvoices = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);

    ids.forEach((id) => {
      void deleteInvoiceFromDatabase(id, activeCompanyId);
      removeOutgoingEDocumentForInvoice(id);
    });

    setData((prev) => {
      const targetInvoices = prev.invoices.filter((i) => idSet.has(i.id));
      if (targetInvoices.length === 0) return prev;

      const targetInvoiceNumbers = new Set(
        targetInvoices.map((i) => i.invoiceNumber).filter(Boolean)
      );

      // Find all linked transactions (collections/payments for these invoices + any paired POS commissions)
      const directLinkedTxs = prev.transactions.filter(
        (t) =>
          (t.invoiceId && idSet.has(t.invoiceId)) ||
          (t.invoiceNumber && targetInvoiceNumbers.has(t.invoiceNumber))
      );
      const directTxIds = new Set(directLinkedTxs.map((t) => t.id));
      const allLinkedTxs = prev.transactions.filter(
        (t) =>
          directTxIds.has(t.id) ||
          (t.linkedTransactionId && directTxIds.has(t.linkedTransactionId))
      );
      const allLinkedTxIds = new Set<string>(allLinkedTxs.map((t) => t.id));

      allLinkedTxIds.forEach((txId) => void deleteTransactionFromDatabase(txId, activeCompanyId));

      // 1. Reverse Account balances from linked transactions
      const updatedAccounts = prev.accounts.map((acc) => {
        let bal = acc.balance;
        allLinkedTxs.forEach((tx) => {
          if (tx.accountId === acc.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            bal += isInc ? -tx.amount : tx.amount;
          }
        });
        return bal === acc.balance ? acc : { ...acc, balance: bal };
      });

      // 2. Reverse Contact balances from deleted invoices AND linked transactions
      const updatedContacts = prev.contacts.map((c) => {
        let bal = c.balance;
        targetInvoices.forEach((inv) => {
          const isInactive = inv.status === "draft" || inv.status === "cancelled";
          if (!isInactive && inv.contactId === c.id) {
            const invDelta = inv.type === "sales" ? inv.grandTotal : -inv.grandTotal;
            bal -= invDelta;
          }
        });
        allLinkedTxs.forEach((tx) => {
          if (tx.contactId === c.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            const txDelta = isInc ? -tx.amount : tx.amount;
            bal -= txDelta;
          }
        });
        if (bal === c.balance) return c;
        return {
          ...c,
          balance: bal,
          balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      // 3. Reverse Product stock quantities from deleted invoices
      const updatedProducts = prev.products.map((p) => {
        let stock = p.stockQuantity;
        targetInvoices.forEach((inv) => {
          const isInactive = inv.status === "draft" || inv.status === "cancelled";
          if (!isInactive) {
            (inv.items || []).forEach((item) => {
              if (
                item.productId === p.id ||
                (item.productCode && p.code && item.productCode === p.code)
              ) {
                stock += inv.type === "sales" ? item.quantity : -item.quantity;
              }
            });
          }
        });
        return stock === p.stockQuantity ? p : { ...p, stockQuantity: Math.max(0, stock) };
      });

      // 4. Bidirectional cascade: delete paired Waybills, Orders, Quotes, and Service Records
      const waybillIdsToDelete = new Set<string>();
      const orderIdsToDelete = new Set<string>();
      const quoteIdsToDelete = new Set<string>();
      const serviceIdsToDelete = new Set<string>();

      targetInvoices.forEach((inv) => {
        if (inv.waybillId) waybillIdsToDelete.add(inv.waybillId);
        if (inv.orderId) orderIdsToDelete.add(inv.orderId);
        if (inv.quoteId) quoteIdsToDelete.add(inv.quoteId);
        if (inv.serviceRecordId) serviceIdsToDelete.add(inv.serviceRecordId);
      });

      const updatedWaybills = (prev.waybills || []).filter((w) => {
        const isLinked =
          waybillIdsToDelete.has(w.id) ||
          (w.invoicedInvoiceId && idSet.has(w.invoicedInvoiceId)) ||
          (w.invoicedInvoiceNumber && targetInvoiceNumbers.has(w.invoicedInvoiceNumber)) ||
          targetInvoices.some((inv) => inv.notes && inv.notes.includes(`İrsaliye No: ${w.waybillNumber}`));
        return !isLinked;
      });

      const updatedOrders = (prev.orders || []).filter((o) => {
        const isLinked =
          orderIdsToDelete.has(o.id) ||
          (o.convertedToInvoiceId && idSet.has(o.convertedToInvoiceId)) ||
          (o.convertedToInvoiceNumber && targetInvoiceNumbers.has(o.convertedToInvoiceNumber)) ||
          targetInvoices.some((inv) => inv.notes && inv.notes.includes(`Sipariş No: ${o.orderNumber}`));
        if (isLinked && o.quoteId) {
          quoteIdsToDelete.add(o.quoteId);
        }
        return !isLinked;
      });

      const updatedQuotes = (prev.quotes || []).filter((q) => {
        const isLinked =
          quoteIdsToDelete.has(q.id) ||
          (q.convertedInvoiceId && idSet.has(q.convertedInvoiceId)) ||
          (q.convertedOrderId && orderIdsToDelete.has(q.convertedOrderId));
        return !isLinked;
      });

      const updatedAutoServices = (prev.autoServices || []).filter(
        (s) =>
          !serviceIdsToDelete.has(s.id) &&
          !(s.invoiceId && idSet.has(s.invoiceId)) &&
          !(s.invoiceNumber && targetInvoiceNumbers.has(s.invoiceNumber))
      );

      const updatedItServices = (prev.itServices || []).filter(
        (s) =>
          !serviceIdsToDelete.has(s.id) &&
          !(s.invoiceId && idSet.has(s.invoiceId)) &&
          !(s.invoiceNumber && targetInvoiceNumbers.has(s.invoiceNumber))
      );

      const updatedApplianceServices = (prev.applianceServices || []).filter(
        (s) =>
          !serviceIdsToDelete.has(s.id) &&
          !(s.invoiceId && idSet.has(s.invoiceId)) &&
          !(s.invoiceNumber && targetInvoiceNumbers.has(s.invoiceNumber))
      );

      return {
        ...prev,
        invoices: prev.invoices.filter((i) => !idSet.has(i.id)),
        transactions: prev.transactions.filter((t) => !allLinkedTxIds.has(t.id)),
        accounts: updatedAccounts,
        contacts: updatedContacts,
        products: updatedProducts,
        waybills: updatedWaybills,
        orders: updatedOrders,
        quotes: updatedQuotes,
        autoServices: updatedAutoServices,
        itServices: updatedItServices,
        applianceServices: updatedApplianceServices,
      };
    });
  };

  const handleAddTransaction = (tx: Transaction) => {
    void saveTransactionToDatabase(tx, activeCompanyId);
    setData((prev) => {
      const isInc = tx.type === "income" || tx.type === "collection";

      // 1. Update account balance
      const updatedAccounts = prev.accounts.map((a) => {
        if (a.id === tx.accountId) {
          return {
            ...a,
            balance: isInc ? a.balance + tx.amount : a.balance - tx.amount,
          };
        }
        return a;
      });

      // 2. If contact linked, update contact balance
      let updatedContacts = prev.contacts;
      if (tx.contactId) {
        updatedContacts = prev.contacts.map((c) => {
          if (c.id === tx.contactId) {
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

      // 3. If transaction has product line items (Gelir/Gider Fişi kalemleri), update product stock quantities
      let updatedProducts = prev.products;
      if (tx.items && tx.items.length > 0) {
        updatedProducts = prev.products.map((p) => {
          const matchingItems = (tx.items || []).filter(
            (item) =>
              item.productId === p.id ||
              (item.productCode && p.code && item.productCode === p.code)
          );
          if (matchingItems.length === 0) return p;
          const totalQty = matchingItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
          const newStock = isInc ? p.stockQuantity - totalQty : p.stockQuantity + totalQty;
          return {
            ...p,
            stockQuantity: Math.max(0, newStock),
          };
        });
      }

      return {
        ...prev,
        transactions: [tx, ...prev.transactions],
        accounts: updatedAccounts,
        contacts: updatedContacts,
        products: updatedProducts,
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    handleBulkDeleteTransactions([id]);
  };

  const handleBulkDeleteTransactions = (ids: string[]) => {
    if (!ids.length) return;

    setData((prev) => {
      const initialSet = new Set(ids);
      const initialTxs = prev.transactions.filter((t) => initialSet.has(t.id));
      if (initialTxs.length === 0) return prev;

      // Expand set to include paired Virman transactions, linked POS commission transactions, and credit card transfer pairs
      const fullTxIdSet = new Set<string>(ids);
      const virmanDocNos = new Set<string>();

      initialTxs.forEach((tx) => {
        if (tx.linkedTransactionId) {
          fullTxIdSet.add(tx.linkedTransactionId);
        }
        if (
          tx.documentNo &&
          (tx.documentNo.startsWith("VRM-") ||
            tx.documentNo.startsWith("KKB-") ||
            tx.category === "Virman / Transfer")
        ) {
          virmanDocNos.add(tx.documentNo);
        }
        if (tx.id.startsWith("tx_cc_pay_")) {
          const tsPart = tx.id.replace("tx_cc_pay_", "");
          fullTxIdSet.add(`tx_cc_inc_${Number(tsPart) + 1}`);
        } else if (tx.id.startsWith("tx_cc_inc_")) {
          const tsPart = tx.id.replace("tx_cc_inc_", "");
          fullTxIdSet.add(`tx_cc_pay_${Number(tsPart) - 1}`);
        }
      });

      prev.transactions.forEach((t) => {
        if (t.linkedTransactionId && fullTxIdSet.has(t.linkedTransactionId)) {
          fullTxIdSet.add(t.id);
        }
        if (t.documentNo && virmanDocNos.has(t.documentNo)) {
          fullTxIdSet.add(t.id);
        }
      });

      const allTxsToDelete = prev.transactions.filter((t) => fullTxIdSet.has(t.id));
      allTxsToDelete.forEach((t) => void deleteTransactionFromDatabase(t.id, activeCompanyId));

      // Check if any deleted transactions are linked to Invoices, Cheques, PromissoryNotes, or AdvanceRequests
      const linkedInvoiceIdsToDelete = new Set<string>();
      const linkedChequeIdsToDelete = new Set<string>();
      const linkedNoteIdsToDelete = new Set<string>();
      const linkedAdvanceIdsToDelete = new Set<string>();

      allTxsToDelete.forEach((tx) => {
        if (tx.invoiceId) linkedInvoiceIdsToDelete.add(tx.invoiceId);
        if (tx.chequeId) linkedChequeIdsToDelete.add(tx.chequeId);
        if (tx.promissoryNoteId) linkedNoteIdsToDelete.add(tx.promissoryNoteId);
        if (tx.advanceRequestId) linkedAdvanceIdsToDelete.add(tx.advanceRequestId);

        // Also match by documentNo or id pattern for cheques/notes
        if (tx.category === "Ciro Edilen Çek" || tx.category === "Çek Tahsilatı" || tx.category === "Çek Ödemesi") {
          (prev.cheques || []).forEach((chq) => {
            if (
              chq.id === tx.chequeId ||
              chq.linkedTransactionId === tx.id ||
              chq.endorsementTransactionId === tx.id ||
              (tx.documentNo && chq.chequeNumber === tx.documentNo)
            ) {
              linkedChequeIdsToDelete.add(chq.id);
            }
          });
        }
        if (tx.category === "Ciro Edilen Senet" || tx.category === "Senet Tahsilatı" || tx.category === "Senet Ödemesi") {
          (prev.promissoryNotes || []).forEach((n) => {
            if (
              n.id === tx.promissoryNoteId ||
              n.linkedTransactionId === tx.id ||
              n.endorsementTransactionId === tx.id ||
              (tx.documentNo && n.noteNumber === tx.documentNo)
            ) {
              linkedNoteIdsToDelete.add(n.id);
            }
          });
        }
      });

      // Also include any other transactions linked to the invoices/cheques/notes being cascade-deleted
      const targetInvoices = prev.invoices.filter((inv) => linkedInvoiceIdsToDelete.has(inv.id));
      const targetCheques = (prev.cheques || []).filter((chq) => linkedChequeIdsToDelete.has(chq.id));
      const targetNotes = (prev.promissoryNotes || []).filter((n) => linkedNoteIdsToDelete.has(n.id));

      prev.transactions.forEach((t) => {
        if (
          (t.invoiceId && linkedInvoiceIdsToDelete.has(t.invoiceId)) ||
          (t.chequeId && linkedChequeIdsToDelete.has(t.chequeId)) ||
          (t.promissoryNoteId && linkedNoteIdsToDelete.has(t.promissoryNoteId))
        ) {
          fullTxIdSet.add(t.id);
        }
      });

      const finalTxsToDelete = prev.transactions.filter((t) => fullTxIdSet.has(t.id));
      finalTxsToDelete.forEach((t) => void deleteTransactionFromDatabase(t.id, activeCompanyId));
      targetInvoices.forEach((inv) => {
        void deleteInvoiceFromDatabase(inv.id, activeCompanyId);
        removeOutgoingEDocumentForInvoice(inv.id);
      });

      // 1. Reverse Account balances for all deleted transactions
      const updatedAccounts = prev.accounts.map((acc) => {
        let bal = acc.balance;
        finalTxsToDelete.forEach((tx) => {
          if (tx.accountId === acc.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            bal += isInc ? -tx.amount : tx.amount;
          }
        });
        return bal === acc.balance ? acc : { ...acc, balance: bal };
      });

      // 2. Reverse Contact balances for all deleted transactions, cascade-deleted invoices, cheques, and notes
      const updatedContacts = prev.contacts.map((c) => {
        let bal = c.balance;
        finalTxsToDelete.forEach((tx) => {
          if (tx.contactId === c.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            const txDelta = isInc ? -tx.amount : tx.amount;
            bal -= txDelta;
          }
        });
        targetInvoices.forEach((inv) => {
          const isInactive = inv.status === "draft" || inv.status === "cancelled";
          if (!isInactive && inv.contactId === c.id) {
            const invDelta = inv.type === "sales" ? inv.grandTotal : -inv.grandTotal;
            bal -= invDelta;
          }
        });
        targetCheques.forEach((chq) => {
          if (chq.contactId === c.id) {
            const chqDelta = chq.type === "received" ? -chq.amount : chq.amount;
            bal -= chqDelta;
          }
        });
        targetNotes.forEach((n) => {
          if (n.contactId === c.id) {
            const noteDelta = n.type === "received" ? -n.amount : n.amount;
            bal -= noteDelta;
          }
        });
        if (bal === c.balance) return c;
        return {
          ...c,
          balance: bal,
          balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      // 3. Reverse Product stock quantities for deleted transactions (with items) and cascade-deleted invoices
      const updatedProducts = prev.products.map((p) => {
        let stock = p.stockQuantity;
        finalTxsToDelete.forEach((tx) => {
          const isInc = tx.type === "income" || tx.type === "collection";
          (tx.items || []).forEach((item) => {
            if (
              item.productId === p.id ||
              (item.productCode && p.code && item.productCode === p.code)
            ) {
              stock += isInc ? item.quantity : -item.quantity;
            }
          });
        });
        targetInvoices.forEach((inv) => {
          const isInactive = inv.status === "draft" || inv.status === "cancelled";
          if (!isInactive) {
            (inv.items || []).forEach((item) => {
              if (
                item.productId === p.id ||
                (item.productCode && p.code && item.productCode === p.code)
              ) {
                stock += inv.type === "sales" ? item.quantity : -item.quantity;
              }
            });
          }
        });
        return stock === p.stockQuantity ? p : { ...p, stockQuantity: Math.max(0, stock) };
      });

      // 4. Cascade delete Waybills, Orders, Quotes, Service Records linked to cascade-deleted Invoices
      const targetInvoiceNumbers = new Set(targetInvoices.map((i) => i.invoiceNumber).filter(Boolean));
      const serviceIdsToDelete = new Set<string>(
        targetInvoices.map((i) => i.serviceRecordId).filter((id): id is string => Boolean(id))
      );
      finalTxsToDelete.forEach((tx) => {
        if (tx.serviceRecordId) serviceIdsToDelete.add(tx.serviceRecordId);
      });

      const updatedWaybills = (prev.waybills || []).filter(
        (w) =>
          !(w.invoicedInvoiceId && linkedInvoiceIdsToDelete.has(w.invoicedInvoiceId)) &&
          !(w.invoicedInvoiceNumber && targetInvoiceNumbers.has(w.invoicedInvoiceNumber))
      );

      const updatedOrders = (prev.orders || []).filter(
        (o) =>
          !(o.convertedToInvoiceId && linkedInvoiceIdsToDelete.has(o.convertedToInvoiceId)) &&
          !(o.convertedToInvoiceNumber && targetInvoiceNumbers.has(o.convertedToInvoiceNumber))
      );

      const updatedQuotes = (prev.quotes || []).filter(
        (q) => !(q.convertedInvoiceId && linkedInvoiceIdsToDelete.has(q.convertedInvoiceId))
      );

      const updatedAutoServices = (prev.autoServices || []).filter(
        (s) =>
          !serviceIdsToDelete.has(s.id) &&
          !(s.invoiceId && linkedInvoiceIdsToDelete.has(s.invoiceId)) &&
          !(s.invoiceNumber && targetInvoiceNumbers.has(s.invoiceNumber))
      );

      const updatedItServices = (prev.itServices || []).filter(
        (s) =>
          !serviceIdsToDelete.has(s.id) &&
          !(s.invoiceId && linkedInvoiceIdsToDelete.has(s.invoiceId)) &&
          !(s.invoiceNumber && targetInvoiceNumbers.has(s.invoiceNumber))
      );

      const updatedApplianceServices = (prev.applianceServices || []).filter(
        (s) =>
          !serviceIdsToDelete.has(s.id) &&
          !(s.invoiceId && linkedInvoiceIdsToDelete.has(s.invoiceId)) &&
          !(s.invoiceNumber && targetInvoiceNumbers.has(s.invoiceNumber))
      );

      const updatedAdvanceRequests = (prev.advanceRequests || []).filter(
        (r) => !linkedAdvanceIdsToDelete.has(r.id)
      );

      return {
        ...prev,
        transactions: prev.transactions.filter((t) => !fullTxIdSet.has(t.id)),
        invoices: prev.invoices.filter((inv) => !linkedInvoiceIdsToDelete.has(inv.id)),
        cheques: (prev.cheques || []).filter((chq) => !linkedChequeIdsToDelete.has(chq.id)),
        promissoryNotes: (prev.promissoryNotes || []).filter((n) => !linkedNoteIdsToDelete.has(n.id)),
        advanceRequests: updatedAdvanceRequests,
        accounts: updatedAccounts,
        contacts: updatedContacts,
        products: updatedProducts,
        waybills: updatedWaybills,
        orders: updatedOrders,
        quotes: updatedQuotes,
        autoServices: updatedAutoServices,
        itServices: updatedItServices,
        applianceServices: updatedApplianceServices,
      };
    });
  };

  const handleAddTransactionFromInvoice = (
    invoice: Invoice,
    accountId: string,
    paidAmount: number
  ) => {
    const isSales = invoice.type === "sales";
    const acc = data.accounts.find((a) => a.id === accountId) || data.accounts[0];
    const resolvedAccountId = acc?.id || accountId;
    const methodLabel =
      invoice.paymentMethod === "nakit"
        ? "Nakit"
        : invoice.paymentMethod === "kredi_karti"
        ? "Kredi Kartı"
        : invoice.paymentMethod === "eft_havale"
        ? "EFT / Havale"
        : "";

    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      date: invoice.issueDate || new Date().toISOString().split("T")[0],
      type: isSales ? "collection" : "payment",
      amount: paidAmount,
      currency: invoice.currency || "TRY",
      accountId: resolvedAccountId,
      accountName: acc?.name || invoice.paymentAccountName || "Kasa/Banka",
      contactId: invoice.contactId,
      contactName: invoice.contactName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      serviceRecordId: invoice.serviceRecordId,
      category: isSales
        ? methodLabel
          ? `Fatura Tahsilatı (${methodLabel})`
          : "Fatura Tahsilatı"
        : methodLabel
        ? `Fatura Ödemesi (${methodLabel})`
        : "Fatura Ödemesi",
      description: `${invoice.invoiceNumber} nolu fatura ${methodLabel ? `${methodLabel} ` : ""}${isSales ? "tahsilatı" : "ödemesi"}`,
    };

    const targetPayable = invoice.payableAmount ?? invoice.grandTotal;
    const newPaid = invoice.paidAmount + paidAmount;
    const newRemaining = targetPayable - newPaid;
    const newStatus = newRemaining <= 0 ? "paid" : "partial";

    const updatedInvoice: Invoice = {
      ...invoice,
      paidAmount: newPaid,
      remainingAmount: Math.max(0, newRemaining),
      status: newStatus as any,
      paymentAccountId: resolvedAccountId || invoice.paymentAccountId,
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
        if (inv.status !== "cancelled" && inv.status !== "draft" && inv.remainingAmount > 0) {
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
      const txOutId = "tx_out_" + now;
      const txInId = "tx_in_" + (now + 1);

      const txOut: Transaction = {
        id: txOutId,
        date: todayStr,
        type: "expense",
        amount,
        currency: fromAcc?.currency || toAcc?.currency || "TRY",
        accountId: fromAcc ? fromAcc.id : "virman_cari_bridge",
        accountName: fromAcc ? fromAcc.name : (fromContact ? `Cari: ${fromContact.name}` : "Virman Hesabı"),
        contactId: fromContact ? fromContact.id : undefined,
        contactName: fromContact ? fromContact.name : undefined,
        linkedTransactionId: txInId,
        category: "Virman / Transfer",
        description: `Virman (Çıkış): ${fromName} -> ${toName}${desc ? ` (${desc})` : ""}`,
        documentNo: docNo,
      };

      const txIn: Transaction = {
        id: txInId,
        date: todayStr,
        type: "income",
        amount,
        currency: toAcc?.currency || fromAcc?.currency || "TRY",
        accountId: toAcc ? toAcc.id : "virman_cari_bridge",
        accountName: toAcc ? toAcc.name : (toContact ? `Cari: ${toContact.name}` : "Virman Hesabı"),
        contactId: toContact ? toContact.id : undefined,
        contactName: toContact ? toContact.name : undefined,
        linkedTransactionId: txOutId,
        category: "Virman / Transfer",
        description: `Virman (Giriş): ${toName} <- ${fromName}${desc ? ` (${desc})` : ""}`,
        documentNo: docNo,
      };

      void saveTransactionToDatabase(txOut, activeCompanyId);
      void saveTransactionToDatabase(txIn, activeCompanyId);

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
      if (!cheque) return prev;

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;
      let linkedTxId = cheque.linkedTransactionId;

      if (
        (status === "collected" || status === "paid") &&
        cheque.status !== "collected" &&
        cheque.status !== "paid"
      ) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = cheque.type === "received";
          const txId = "tx_chq_" + Date.now();
          linkedTxId = txId;
          const newTx: Transaction = {
            id: txId,
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: cheque.amount,
            currency: cheque.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: cheque.contactId,
            contactName: cheque.contactName,
            chequeId: cheque.id,
            documentNo: cheque.chequeNumber,
            category: isIncome ? "Çek Tahsilatı" : "Çek Ödemesi",
            description: `${cheque.bankName || "Banka"} (${cheque.chequeNumber || "Çek"}) ${isIncome ? "Çek Tahsilatı" : "Çek Ödemesi"}`,
          };
          void saveTransactionToDatabase(newTx, activeCompanyId);
          updatedAccounts = prev.accounts.map((acc) =>
            acc.id === defaultAcc.id
              ? { ...acc, balance: isIncome ? acc.balance + cheque.amount : acc.balance - cheque.amount }
              : acc
          );
          updatedTransactions = [newTx, ...prev.transactions];
        }
      }

      const updatedCheques = (prev.cheques || []).map((c) =>
        c.id === id ? { ...c, status, linkedTransactionId: linkedTxId } : c
      );

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
    handleBulkDeleteCheques([id]);
  };

  const handleBulkDeleteCheques = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);

    setData((prev) => {
      const targetCheques = (prev.cheques || []).filter((c) => idSet.has(c.id));
      if (targetCheques.length === 0) return prev;

      const chequeNumbers = new Set(targetCheques.map((c) => c.chequeNumber).filter(Boolean));
      const linkedTxIds = new Set<string>();
      targetCheques.forEach((c) => {
        if (c.linkedTransactionId) linkedTxIds.add(c.linkedTransactionId);
        if (c.endorsementTransactionId) linkedTxIds.add(c.endorsementTransactionId);
      });

      const linkedTxs = prev.transactions.filter(
        (t) =>
          linkedTxIds.has(t.id) ||
          (t.chequeId && idSet.has(t.chequeId)) ||
          ((t.category === "Çek Tahsilatı" ||
            t.category === "Çek Ödemesi" ||
            t.category === "Ciro Edilen Çek") &&
            t.documentNo &&
            chequeNumbers.has(t.documentNo))
      );
      const allTxIdSet = new Set<string>(linkedTxs.map((t) => t.id));
      allTxIdSet.forEach((txId) => void deleteTransactionFromDatabase(txId, activeCompanyId));

      // 1. Reverse Account balances for any linked cheque collection/payment transactions
      const updatedAccounts = prev.accounts.map((acc) => {
        let bal = acc.balance;
        linkedTxs.forEach((tx) => {
          if (tx.accountId === acc.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            bal += isInc ? -tx.amount : tx.amount;
          }
        });
        return bal === acc.balance ? acc : { ...acc, balance: bal };
      });

      // 2. Reverse Contact balances for the deleted cheques AND any endorsement transactions
      const updatedContacts = prev.contacts.map((c) => {
        let bal = c.balance;
        targetCheques.forEach((chq) => {
          if (chq.contactId === c.id) {
            const delta = chq.type === "received" ? -chq.amount : chq.amount;
            bal -= delta;
          }
        });
        linkedTxs.forEach((tx) => {
          // Endorsement transactions modified the endorsed target contact's balance via handleAddTransaction
          if (tx.category === "Ciro Edilen Çek" && tx.contactId === c.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            const txDelta = isInc ? -tx.amount : tx.amount;
            bal -= txDelta;
          }
        });
        if (bal === c.balance) return c;
        return {
          ...c,
          balance: bal,
          balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      return {
        ...prev,
        cheques: (prev.cheques || []).filter((c) => !idSet.has(c.id)),
        transactions: prev.transactions.filter((t) => !allTxIdSet.has(t.id)),
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
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
      if (!note) return prev;

      let updatedAccounts = prev.accounts;
      let updatedTransactions = prev.transactions;
      let linkedTxId = note.linkedTransactionId;

      if (
        (status === "collected" || status === "paid") &&
        note.status !== "collected" &&
        note.status !== "paid"
      ) {
        const defaultAcc = prev.accounts[0];
        if (defaultAcc) {
          const isIncome = note.type === "received";
          const txId = "tx_note_" + Date.now();
          linkedTxId = txId;
          const newTx: Transaction = {
            id: txId,
            date: new Date().toISOString().split("T")[0],
            type: isIncome ? "collection" : "payment",
            amount: note.amount,
            currency: note.currency || "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: note.contactId,
            contactName: note.contactName,
            promissoryNoteId: note.id,
            documentNo: note.noteNumber,
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

      const updatedNotes = (prev.promissoryNotes || []).map((n) =>
        n.id === id ? { ...n, status, linkedTransactionId: linkedTxId } : n
      );

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
    handleBulkDeletePromissoryNotes([id]);
  };

  const handleBulkDeletePromissoryNotes = (ids: string[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);

    setData((prev) => {
      const targetNotes = (prev.promissoryNotes || []).filter((n) => idSet.has(n.id));
      if (targetNotes.length === 0) return prev;

      const noteNumbers = new Set(targetNotes.map((n) => n.noteNumber).filter(Boolean));
      const linkedTxIds = new Set<string>();
      targetNotes.forEach((n) => {
        if (n.linkedTransactionId) linkedTxIds.add(n.linkedTransactionId);
        if (n.endorsementTransactionId) linkedTxIds.add(n.endorsementTransactionId);
      });

      const linkedTxs = prev.transactions.filter(
        (t) =>
          linkedTxIds.has(t.id) ||
          (t.promissoryNoteId && idSet.has(t.promissoryNoteId)) ||
          ((t.category === "Senet Tahsilatı" ||
            t.category === "Senet Ödemesi" ||
            t.category === "Ciro Edilen Senet") &&
            t.documentNo &&
            noteNumbers.has(t.documentNo))
      );
      const allTxIdSet = new Set<string>(linkedTxs.map((t) => t.id));
      allTxIdSet.forEach((txId) => void deleteTransactionFromDatabase(txId, activeCompanyId));

      // 1. Reverse Account balances
      const updatedAccounts = prev.accounts.map((acc) => {
        let bal = acc.balance;
        linkedTxs.forEach((tx) => {
          if (tx.accountId === acc.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            bal += isInc ? -tx.amount : tx.amount;
          }
        });
        return bal === acc.balance ? acc : { ...acc, balance: bal };
      });

      // 2. Reverse Contact balances
      const updatedContacts = prev.contacts.map((c) => {
        let bal = c.balance;
        targetNotes.forEach((n) => {
          if (n.contactId === c.id) {
            const delta = n.type === "received" ? -n.amount : n.amount;
            bal -= delta;
          }
        });
        linkedTxs.forEach((tx) => {
          if (tx.category === "Ciro Edilen Senet" && tx.contactId === c.id) {
            const isInc = tx.type === "income" || tx.type === "collection";
            const txDelta = isInc ? -tx.amount : tx.amount;
            bal -= txDelta;
          }
        });
        if (bal === c.balance) return c;
        return {
          ...c,
          balance: bal,
          balanceType: bal > 0 ? ("receivable" as const) : bal < 0 ? ("payable" as const) : ("balanced" as const),
        };
      });

      return {
        ...prev,
        promissoryNotes: (prev.promissoryNotes || []).filter((n) => !idSet.has(n.id)),
        transactions: prev.transactions.filter((t) => !allTxIdSet.has(t.id)),
        accounts: updatedAccounts,
        contacts: updatedContacts,
      };
    });
  };

  const handleAddProduct = (product: Product) => {
    void saveProductToDatabase(product, activeCompanyId);
    setData((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
  };

  const handleUpdateProduct = (product: Product) => {
    void saveProductToDatabase(product, activeCompanyId);
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === product.id ? product : p)),
    }));
  };

  const handleDeleteProduct = (id: string) => {
    void deleteProductFromDatabase(id, activeCompanyId);
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const handleBulkDeleteProducts = (ids: string[]) => {
    ids.forEach((id) => void deleteProductFromDatabase(id, activeCompanyId));
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

  // FixedAssets <-> HR AssetCustodies bidirectional synchronization
  const handleUpdateFixedAssets = (updatedAssets: FixedAsset[]) => {
    setData((prev) => {
      const prevAssets = prev.fixedAssets || [];
      const newIds = new Set(updatedAssets.map((a) => a.id));
      const removedAssetIds = new Set(prevAssets.filter((a) => !newIds.has(a.id)).map((a) => a.id));
      const removedSerials = new Set(
        prevAssets
          .filter((a) => !newIds.has(a.id) && a.serialOrPlate)
          .map((a) => a.serialOrPlate!)
      );

      // Remove linked custodies, maintenances, and disposals when a FixedAsset is deleted
      let updatedCustodies = (prev.assetCustodies || []).filter(
        (c) =>
          !removedAssetIds.has(c.id) &&
          !removedAssetIds.has(c.id.replace(/^zim_/, "")) &&
          !(c.serialNumber && removedSerials.has(c.serialNumber))
      );

      // Sync custody assignments for updated/created FixedAssets
      updatedAssets.forEach((fa) => {
        const custodyId = `zim_${fa.id}`;
        const existingIdx = updatedCustodies.findIndex(
          (c) => c.id === custodyId || c.id === fa.id || (fa.serialOrPlate && c.serialNumber === fa.serialOrPlate)
        );
        if (fa.custodianEmployeeId) {
          const rawFaCat = String(fa.category || "");
          const rawFaStatus = String(fa.status || "");
          const syncedCustody = {
            id: existingIdx >= 0 ? updatedCustodies[existingIdx].id : custodyId,
            employeeId: fa.custodianEmployeeId,
            assetName: fa.name,
            category: (
              rawFaCat === "Tasitlar" || rawFaCat === "vehicle"
                ? "vehicle"
                : rawFaCat === "Bilgisayar_Bilisim" || rawFaCat === "laptop"
                ? "laptop"
                : rawFaCat === "Makine_Tesis" || rawFaCat === "El_Aletleri" || rawFaCat === "equipment"
                ? "equipment"
                : "other"
            ) as AssetCustody["category"],
            serialNumber: fa.serialOrPlate || fa.code,
            assignedDate: fa.custodyStartDate || (fa as any).purchaseDate || fa.acquisitionDate,
            status: rawFaStatus === "hurda" || rawFaStatus === "satildi" || rawFaStatus === "scrapped" || rawFaStatus === "sold" ? "returned" : "active",
            notes: fa.description,
          } as AssetCustody;
          if (existingIdx >= 0) {
            updatedCustodies[existingIdx] = syncedCustody;
          } else {
            updatedCustodies = [syncedCustody, ...updatedCustodies];
          }
        } else if (existingIdx >= 0) {
          updatedCustodies = updatedCustodies.filter((_, i) => i !== existingIdx);
        }
      });

      const updatedMaintenances = (prev.assetMaintenances || []).filter(
        (m) => !removedAssetIds.has(m.assetId)
      );
      const updatedDisposals = (prev.assetDisposals || []).filter(
        (d) => !removedAssetIds.has(d.assetId)
      );

      saveStoredData("FIXED_ASSETS", updatedAssets, activeCompanyId);
      saveStoredData("ASSET_CUSTODIES", updatedCustodies, activeCompanyId);
      saveStoredData("ASSET_MAINTENANCES", updatedMaintenances, activeCompanyId);
      saveStoredData("ASSET_DISPOSALS", updatedDisposals, activeCompanyId);

      return {
        ...prev,
        fixedAssets: updatedAssets,
        assetCustodies: updatedCustodies,
        assetMaintenances: updatedMaintenances,
        assetDisposals: updatedDisposals,
      };
    });
  };

  const handleUpdateAssetMaintenances = (updatedMaintenances: AssetMaintenanceRecord[]) => {
    setData((prev) => {
      const next = { ...prev, assetMaintenances: updatedMaintenances };
      saveStoredData("ASSET_MAINTENANCES", updatedMaintenances, activeCompanyId);
      return next;
    });
  };

  const handleUpdateAssetDisposals = (updatedDisposals: AssetDisposalRecord[]) => {
    setData((prev) => {
      const next = { ...prev, assetDisposals: updatedDisposals };
      saveStoredData("ASSET_DISPOSALS", updatedDisposals, activeCompanyId);
      return next;
    });
  };

  const handleConvertQuoteToInvoice = (quote: Quote) => {
    const seqInfo = getLocalNextSequentialInvoiceNumber("e_fatura", activeCompanyId);
    const resolvedInvoiceNo = seqInfo.nextInvoiceNumber;

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
      quoteId: quote.id,
    };

    handleAddInvoice(newInvoice);

    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id
          ? { ...q, status: "converted" as const, convertedInvoiceId: newInvoice.id }
          : q
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
      quoteId: quote.id,
      createdAt: new Date().toISOString().split("T")[0],
    };

    handleAddOrder(newOrder);

    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.map((q) =>
        q.id === quote.id
          ? { ...q, status: "converted" as const, convertedOrderId: newOrder.id }
          : q
      ),
    }));
  };

  const handleDeleteQuote = (id: string) => {
    const targetQuote = data.quotes.find((q) => q.id === id);
    const linkedInvoiceIds: string[] = [];
    const linkedOrderIds: string[] = [];

    if (targetQuote) {
      if (targetQuote.convertedInvoiceId) linkedInvoiceIds.push(targetQuote.convertedInvoiceId);
      if (targetQuote.convertedOrderId) linkedOrderIds.push(targetQuote.convertedOrderId);
      data.invoices.forEach((inv) => {
        if (inv.quoteId === id) linkedInvoiceIds.push(inv.id);
      });
      (data.orders || []).forEach((ord) => {
        if (
          ord.quoteId === id ||
          (ord.notes && ord.notes.includes(`Belge No: ${targetQuote.quoteNumber}`))
        ) {
          linkedOrderIds.push(ord.id);
        }
      });
    }

    setData((prev) => ({
      ...prev,
      quotes: prev.quotes.filter((q) => q.id !== id),
    }));

    if (linkedOrderIds.length > 0) {
      handleBulkDeleteOrders(Array.from(new Set(linkedOrderIds)));
    }
    if (linkedInvoiceIds.length > 0) {
      handleBulkDeleteInvoices(Array.from(new Set(linkedInvoiceIds)));
    }
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    const targetCompanyId = getActiveCompanyId();
    const cleanTaxDigits = String(newSettings.taxNumber || "").replace(/\D/g, "");
    const normalizedSettings: CompanySettings = {
      ...newSettings,
      vkn: cleanTaxDigits.length === 10 ? cleanTaxDigits : newSettings.vkn,
      tckn: cleanTaxDigits.length === 11 ? cleanTaxDigits : newSettings.tckn,
      tradeRegisterNo: (newSettings.tradeRegisterNo ?? "").trim(),
      mersisNo: (newSettings.mersisNo ?? "").trim(),
      defaultBankAccountName:
        newSettings.defaultBankAccountName !== undefined && newSettings.defaultBankAccountName !== ""
          ? newSettings.defaultBankAccountName
          : newSettings.companyTitle || newSettings.companyName || "",
    };

    // Persist SETTINGS immediately before any synchronous reads
    saveStoredData("SETTINGS", normalizedSettings, targetCompanyId);

    const existingComp = getCompaniesList().find((c) => c.id === targetCompanyId);
    if (existingComp) {
      const updatedList = updateCompanyItem({
        ...existingComp,
        companyName: normalizedSettings.companyName || existingComp.companyName,
        name: normalizedSettings.companyName || existingComp.name,
        companyTitle: normalizedSettings.companyTitle || normalizedSettings.companyName || existingComp.companyTitle,
        title: normalizedSettings.companyTitle || normalizedSettings.companyName || existingComp.title,
        taxpayerType: normalizedSettings.taxpayerType ?? existingComp.taxpayerType,
        taxOffice: normalizedSettings.taxOffice ?? existingComp.taxOffice,
        taxNumber: normalizedSettings.taxNumber ?? existingComp.taxNumber,
        vkn: cleanTaxDigits.length === 10 ? cleanTaxDigits : (normalizedSettings.vkn ?? existingComp.vkn),
        tckn: cleanTaxDigits.length === 11 ? cleanTaxDigits : (normalizedSettings.tckn ?? existingComp.tckn),
        tradeRegisterNo: normalizedSettings.tradeRegisterNo,
        mersisNo: normalizedSettings.mersisNo,
        phone: normalizedSettings.phone ?? existingComp.phone,
        email: normalizedSettings.email ?? existingComp.email,
        website: normalizedSettings.website ?? existingComp.website,
        address: normalizedSettings.address ?? existingComp.address,
        city: normalizedSettings.city ?? existingComp.city,
        district: normalizedSettings.district ?? existingComp.district,
        neighborhood: normalizedSettings.neighborhood ?? existingComp.neighborhood,
        street: normalizedSettings.street ?? existingComp.street,
        buildingNo: normalizedSettings.buildingNo ?? existingComp.buildingNo,
        doorNo: normalizedSettings.doorNo ?? existingComp.doorNo,
        postalCode: normalizedSettings.postalCode ?? existingComp.postalCode,
        addressDetails: normalizedSettings.addressDetails ?? existingComp.addressDetails,
        defaultBankAccountName: normalizedSettings.defaultBankAccountName ?? existingComp.defaultBankAccountName,
        defaultBankName: normalizedSettings.defaultBankName ?? existingComp.defaultBankName,
        defaultBankIban: normalizedSettings.defaultBankIban ?? existingComp.defaultBankIban,
        tenantIdentifierNumber: normalizedSettings.tenantIdentifierNumber ?? existingComp.tenantIdentifierNumber,
        eFaturaPrefix: normalizedSettings.eFaturaPrefix ?? existingComp.eFaturaPrefix,
        eFaturaNextNumber: normalizedSettings.eFaturaNextNumber ?? existingComp.eFaturaNextNumber,
        eArsivPrefix: normalizedSettings.eArsivPrefix ?? existingComp.eArsivPrefix,
        eArsivNextNumber: normalizedSettings.eArsivNextNumber ?? existingComp.eArsivNextNumber,
        defaultInvoicePrefix: normalizedSettings.defaultInvoicePrefix ?? existingComp.defaultInvoicePrefix,
        invoiceDesign: normalizedSettings.invoiceDesign ?? existingComp.invoiceDesign,
        logoUrl: normalizedSettings.logoUrl || "/logo.svg",
        logoScale: normalizedSettings.logoScale ?? 1,
      });
      setCompanies(updatedList);
    }
    saveCloudLogo(
      normalizedSettings.logoUrl || "/logo.svg",
      {
        brandName: normalizedSettings.companyName,
        logoScale: normalizedSettings.logoScale ?? 1,
      },
      targetCompanyId
    ).catch(() => {});

    setData((prev) => {
      let updatedEmployees = prev.employees;
      if (normalizedSettings.applyAllowancesToAllEmployees !== false) {
        const newFood = normalizedSettings.defaultFoodAllowance ?? 5500;
        const newRoad = normalizedSettings.defaultRoadAllowance ?? 2500;
        updatedEmployees = (prev.employees || []).map((emp) => ({
          ...emp,
          foodAllowance: newFood,
          roadAllowance: newRoad,
        }));
        saveStoredData("EMPLOYEES", updatedEmployees, targetCompanyId);
      }

      // Sync the main (Merkez) branch address with the updated company settings
      let updatedBranches = prev.branches;
      if (Array.isArray(prev.branches) && prev.branches.length > 0 && normalizedSettings.address) {
        updatedBranches = prev.branches.map((br) => {
          if (!br.isMain) return br;
          return {
            ...br,
            phone: normalizedSettings.phone || br.phone,
            email: normalizedSettings.email || br.email,
            address: {
              ...br.address,
              country: normalizedSettings.country || br.address?.country || "Türkiye",
              city: normalizedSettings.city || br.address?.city || "İstanbul",
              district: normalizedSettings.district ?? br.address?.district ?? "",
              neighborhood: normalizedSettings.neighborhood ?? br.address?.neighborhood ?? "",
              street: normalizedSettings.street ?? br.address?.street ?? "",
              buildingNo: normalizedSettings.buildingNo ?? br.address?.buildingNo ?? "",
              doorNo: normalizedSettings.doorNo ?? br.address?.doorNo ?? "",
              postalCode: normalizedSettings.postalCode ?? br.address?.postalCode ?? "",
              fullAddress: normalizedSettings.address || br.address?.fullAddress || "",
            },
          };
        });
        saveStoredData("BRANCHES", updatedBranches, targetCompanyId);
      }

      saveStoredData("SETTINGS", normalizedSettings, targetCompanyId);
      const nextState = {
        ...prev,
        settings: normalizedSettings,
        branches: updatedBranches,
        employees: updatedEmployees,
      };
      void pushCompanyDataToCloud(targetCompanyId, nextState);
      return nextState;
    });
    void verifyAndSyncAllUsersLocalDb(
      0,
      currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
      `Şirket Ayarları ve Logosu Güncellendi (${normalizedSettings.companyName || targetCompanyId})`,
      true
    );
  };

  const handleResetDemoData = () => {
    resetToDemoData();
    setData(getStoredData());
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const fileName = `Muavin_Yedek_${new Date().toISOString().split("T")[0]}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    const updatedStatus = recordManualBackup(
      activeCompanyId,
      currentUser?.name || currentUser?.email || "Sistem Kullanıcısı",
      fileName,
      blob.size
    );
    setBackupStatus(updatedStatus);
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        lastManualBackupAt: updatedStatus.lastBackupAt || new Date().toISOString(),
        manualBackupHistory: updatedStatus.history,
      },
    }));
    triggerFormErrorNotification(
      `Manuel veri yedeğiniz (${fileName}) indirildi. 7 günlük yedekleme hatırlatma sayacı güncellendi.`,
      "Manuel Yedekleme Tamamlandı"
    );
  };

  const handleSnoozeBackupReminder = () => {
    snoozeManualBackupReminder(activeCompanyId, 24);
    setBackupStatus(getManualBackupStatus(activeCompanyId, data.settings));
  };

  const handleOpenBackupSettings = () => {
    setSettingsInitialTab("backup");
    setCurrentTab("company_settings");
  };

  const handleImportBackup = (jsonStr: string) => {
    const ok = importBackupJSON(jsonStr);
    if (ok) {
      recordManualBackup(
        activeCompanyId,
        currentUser?.name || currentUser?.email || "Sistem Kullanıcısı (İçe Aktarma)",
        `Yuklenen_Yedek_${new Date().toISOString().split("T")[0]}.json`,
        jsonStr.length
      );
      const fresh = getStoredData(activeCompanyId);
      setData(fresh);
      setBackupStatus(getManualBackupStatus(activeCompanyId, fresh.settings));
    }
    return ok;
  };

  // HR Handlers (Bidirectionally synced with Transactions, FixedAssets, Leave/Advance/LegalDeductions)
  const handleAddEmployee = (emp: Employee) => {
    setData((p) => {
      const next = { ...p, employees: [emp, ...(p.employees || [])] };
      saveStoredData("EMPLOYEES", next.employees, activeCompanyId);
      return next;
    });
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setData((p) => {
      const next = {
        ...p,
        employees: (p.employees || []).map((e) => (e.id === emp.id ? emp : e)),
        fixedAssets: (p.fixedAssets || []).map((fa) =>
          fa.custodianEmployeeId === emp.id
            ? { ...fa, custodianName: emp.fullName, department: emp.department }
            : fa
        ),
      };
      saveStoredData("EMPLOYEES", next.employees, activeCompanyId);
      return next;
    });
  };

  const handleDeleteEmployee = (id: string) => {
    const empTxs = data.transactions.filter(
      (t) =>
        t.contactId === id ||
        t.employeeId === id ||
        (t.documentNo && t.documentNo.includes(id.slice(-4)))
    );
    if (empTxs.length > 0) {
      handleBulkDeleteTransactions(empTxs.map((t) => t.id));
    }

    setData((p) => {
      const updatedEmployees = (p.employees || []).filter((e) => e.id !== id);
      const updatedLeaves = (p.leaveRequests || []).filter((l) => l.employeeId !== id);
      const updatedAdvances = (p.advanceRequests || []).filter((a) => a.employeeId !== id);
      const updatedDeductions = (p.legalDeductions || []).filter((d) => d.employeeId !== id);
      const updatedCustodies = (p.assetCustodies || []).filter((c) => c.employeeId !== id);
      const updatedFixedAssets = (p.fixedAssets || []).map((fa) =>
        fa.custodianEmployeeId === id
          ? { ...fa, custodianEmployeeId: undefined, custodianName: undefined }
          : fa
      );

      saveStoredData("EMPLOYEES", updatedEmployees, activeCompanyId);
      saveStoredData("LEAVE_REQUESTS", updatedLeaves, activeCompanyId);
      saveStoredData("ADVANCE_REQUESTS", updatedAdvances, activeCompanyId);
      saveStoredData("LEGAL_DEDUCTIONS", updatedDeductions, activeCompanyId);
      saveStoredData("ASSET_CUSTODIES", updatedCustodies, activeCompanyId);
      saveStoredData("FIXED_ASSETS", updatedFixedAssets, activeCompanyId);

      return {
        ...p,
        employees: updatedEmployees,
        leaveRequests: updatedLeaves,
        advanceRequests: updatedAdvances,
        legalDeductions: updatedDeductions,
        assetCustodies: updatedCustodies,
        fixedAssets: updatedFixedAssets,
      };
    });
  };

  const handleAddLeaveRequest = (req: LeaveRequest) => {
    setData((p) => {
      const next = { ...p, leaveRequests: [req, ...(p.leaveRequests || [])] };
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests, activeCompanyId);
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
      saveStoredData("LEAVE_REQUESTS", next.leaveRequests, activeCompanyId);
      return next;
    });
  };

  const handleAddAdvanceRequest = (req: AdvanceRequest) => {
    setData((p) => {
      const next = { ...p, advanceRequests: [req, ...(p.advanceRequests || [])] };
      saveStoredData("ADVANCE_REQUESTS", next.advanceRequests, activeCompanyId);
      return next;
    });
  };

  const handleUpdateAdvanceStatus = (id: string, status: "paid" | "approved" | "rejected") => {
    setData((p) => {
      const targetReq = (p.advanceRequests || []).find((r) => r.id === id);
      const updatedAdvanceRequests = (p.advanceRequests || []).map((r) =>
        r.id === id ? { ...r, status } : r
      );
      saveStoredData("ADVANCE_REQUESTS", updatedAdvanceRequests, activeCompanyId);

      let updatedAccounts = p.accounts;
      let updatedTransactions = p.transactions;

      if (status === "paid" && targetReq && targetReq.status !== "paid") {
        const defaultAcc = p.accounts[0];
        if (defaultAcc) {
          const emp = (p.employees || []).find((e) => e.id === targetReq.employeeId);
          const empName = emp?.fullName || "Personel";
          const newTx: Transaction = {
            id: "tx_adv_" + targetReq.id,
            date: new Date().toISOString().split("T")[0],
            type: "expense",
            amount: targetReq.amount,
            currency: "TRY",
            accountId: defaultAcc.id,
            accountName: defaultAcc.name,
            contactId: emp?.id,
            contactName: emp ? `${emp.fullName} (Personel)` : undefined,
            advanceRequestId: targetReq.id,
            employeeId: targetReq.employeeId,
            documentNo: `AVN-${targetReq.id.slice(-6).toUpperCase()}`,
            category: "Personel / Avans",
            description: `Personel Avans Ödemesi: ${empName} (${targetReq.description || "Avans Ödemesi"})`,
          };
          void saveTransactionToDatabase(newTx, activeCompanyId);
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
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions, activeCompanyId);
      return next;
    });
  };

  const handleUpdateLegalDeduction = (deduction: LegalDeduction) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).map((d) => (d.id === deduction.id ? deduction : d)),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions, activeCompanyId);
      return next;
    });
  };

  const handleDeleteLegalDeduction = (id: string) => {
    setData((p) => {
      const next = {
        ...p,
        legalDeductions: (p.legalDeductions || []).filter((d) => d.id !== id),
      };
      saveStoredData("LEGAL_DEDUCTIONS", next.legalDeductions, activeCompanyId);
      return next;
    });
  };

  // Handlers for Asset Custody (Zimmet & Demirbaş) - Bidirectionally synced with FixedAssets
  const handleAddAsset = (asset: AssetCustody) => {
    setData((p) => {
      const updatedCustodies = [asset, ...(p.assetCustodies || [])];
      const emp = (p.employees || []).find((e) => e.id === asset.employeeId);

      // Sync to FixedAssets if matching serialNumber or create a paired FixedAsset
      let updatedFixedAssets = [...(p.fixedAssets || [])];
      const matchIdx = updatedFixedAssets.findIndex(
        (fa) =>
          fa.id === asset.id.replace(/^zim_/, "") ||
          (asset.serialNumber && fa.serialOrPlate === asset.serialNumber)
      );
      if (matchIdx >= 0) {
        updatedFixedAssets[matchIdx] = {
          ...updatedFixedAssets[matchIdx],
          custodianEmployeeId: asset.employeeId,
          custodianName: emp?.fullName,
          department: emp?.department,
          custodyStartDate: asset.assignedDate,
        };
      } else {
        const rawCustCat = String(asset.category || "");
        const newFa = {
          id: `fa_${asset.id}`,
          code: `DMB-${Date.now().toString().slice(-4)}`,
          name: asset.assetName,
          category: (
            rawCustCat === "Arac" || rawCustCat === "vehicle"
              ? "vehicle"
              : rawCustCat === "Bilgisayar" || rawCustCat === "Telefon" || rawCustCat === "laptop" || rawCustCat === "phone"
              ? "computer"
              : "furniture"
          ) as FixedAsset["category"],
          serialOrPlate: asset.serialNumber,
          acquisitionDate: asset.assignedDate || new Date().toISOString().split("T")[0],
          vatRate: 20,
          currency: "TRY",
          usefulLifeYears: 5,
          depreciationRate: 20,
          depreciationMethod: "normal",
          isProRata: false,
          accumulatedDepreciation: 0,
          netBookValue: 0,
          custodianEmployeeId: asset.employeeId,
          custodianName: emp?.fullName,
          department: emp?.department,
          custodyStartDate: asset.assignedDate,
          status: (asset.status === "active" ? "active" : "maintenance") as FixedAsset["status"],
          description: asset.notes,
        } as unknown as FixedAsset;
        updatedFixedAssets = [newFa, ...updatedFixedAssets];
      }

      saveStoredData("ASSET_CUSTODIES", updatedCustodies, activeCompanyId);
      saveStoredData("FIXED_ASSETS", updatedFixedAssets, activeCompanyId);
      return {
        ...p,
        assetCustodies: updatedCustodies,
        fixedAssets: updatedFixedAssets,
      };
    });
  };

  const handleUpdateAsset = (asset: AssetCustody) => {
    setData((p) => {
      const updatedCustodies = (p.assetCustodies || []).map((a) => (a.id === asset.id ? asset : a));
      const emp = (p.employees || []).find((e) => e.id === asset.employeeId);
      const updatedFixedAssets = (p.fixedAssets || []).map((fa) => {
        if (
          fa.id === asset.id.replace(/^zim_/, "") ||
          fa.id === `fa_${asset.id}` ||
          (asset.serialNumber && fa.serialOrPlate === asset.serialNumber)
        ) {
          return {
            ...fa,
            name: asset.assetName,
            serialOrPlate: asset.serialNumber,
            custodianEmployeeId: asset.status === "returned" ? undefined : asset.employeeId,
            custodianName: asset.status === "returned" ? undefined : emp?.fullName,
            department: emp?.department,
          };
        }
        return fa;
      });
      saveStoredData("ASSET_CUSTODIES", updatedCustodies, activeCompanyId);
      saveStoredData("FIXED_ASSETS", updatedFixedAssets, activeCompanyId);
      return {
        ...p,
        assetCustodies: updatedCustodies,
        fixedAssets: updatedFixedAssets,
      };
    });
  };

  const handleDeleteAsset = (id: string) => {
    setData((p) => {
      const targetCustody = (p.assetCustodies || []).find((a) => a.id === id);
      const updatedCustodies = (p.assetCustodies || []).filter((a) => a.id !== id);
      const updatedFixedAssets = (p.fixedAssets || []).filter((fa) => {
        if (fa.id === id.replace(/^zim_/, "") || fa.id === `fa_${id}`) return false;
        if (targetCustody?.serialNumber && fa.serialOrPlate === targetCustody.serialNumber) return false;
        return true;
      });
      saveStoredData("ASSET_CUSTODIES", updatedCustodies, activeCompanyId);
      saveStoredData("FIXED_ASSETS", updatedFixedAssets, activeCompanyId);
      return {
        ...p,
        assetCustodies: updatedCustodies,
        fixedAssets: updatedFixedAssets,
      };
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
      case "company_logs":
      case "e_document_logs":
        return "Log İzleme Ekranı (Mysoft API & Teknik Hata Konsolu)";
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
    if (tab === "admin" || tab === "company_companies" || tab === "company_mysoft") return isAdminOrSysAdmin(currentUser);
    if (tab === "company_logs" || tab === "e_document_logs") {
      return isCompanyMysoftMatched(activeCompanyObj, data.settings);
    }

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
          onOpenNewCompanyModal={
            isAdminOrSysAdmin(currentUser) ? () => setIsNewCompanyModalOpen(true) : undefined
          }
          backupStatus={backupStatus}
          onTriggerManualBackup={handleExportBackup}
          onSnoozeBackupReminder={handleSnoozeBackupReminder}
          onOpenBackupSettings={handleOpenBackupSettings}
        />

        {/* Automated 7-Day Manual Data Backup Alert Banner */}
        {backupStatus.isOverdue &&
          !backupStatus.isSnoozed &&
          data.settings?.manualBackupReminderEnabled !== false && (
            <div
              role="alert"
              className="w-full bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800/70 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-950 dark:text-rose-100"
            >
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0 leading-relaxed">
                  <span className="font-bold">Otomatik Veri Güvenliği Uyarısı:</span>{" "}
                  <span>
                    {backupStatus.lastBackupAt
                      ? `Son manuel veri yedeğinizin üzerinden ${backupStatus.daysSinceLastBackup} gün geçti (Son yedek: ${new Date(
                          backupStatus.lastBackupAt
                        ).toLocaleDateString("tr-TR")}).`
                      : `Son ${backupStatus.thresholdDays} gün içinde hiç manuel veri yedeği alınmadı.`}{" "}
                    Veri kaybı riskine karşı lütfen güncel sistem yedeğinizi indirin.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Şimdi Manuel Yedek Al</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenBackupSettings}
                  className="px-3 py-1.5 bg-white hover:bg-rose-100/80 dark:bg-slate-900 dark:hover:bg-slate-800 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700 font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Yedekleme Ayarları
                </button>
                <button
                  type="button"
                  onClick={handleSnoozeBackupReminder}
                  className="px-2.5 py-1.5 text-rose-700 hover:text-rose-950 dark:text-rose-300 dark:hover:text-white font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="Bu uyarıyı 24 saatliğine gizle"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>24 Saat Ertele</span>
                </button>
              </div>
            </div>
          )}

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
              onDeleteInvoice={handleDeleteInvoice}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteCheque={handleDeleteCheque}
              onDeletePromissoryNote={handleDeletePromissoryNote}
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
              branches={data.branches || []}
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
              onSaveCompanySettings={handleSaveSettings}
              onAddBranch={handleAddBranch}
              onUpdateBranch={handleUpdateBranch}
            />
          )}

          {(currentTab === "e_documents_incoming" || currentTab === "e_documents_outgoing") && (
            <EDocuments
              family="invoice"
              direction={currentTab === "e_documents_outgoing" ? "outgoing" : "incoming"}
              companySettings={data.settings}
              activeCompany={activeCompanyObj || undefined}
              companyId={activeCompanyId}
              invoices={data.invoices}
              currentUser={currentUser}
              tenantIdentifierNumber={
                activeCompanyObj?.tenantIdentifierNumber ||
                data.settings.tenantIdentifierNumber ||
                data.settings.mysoftCredentials?.tenantIdentifierNumber ||
                activeCompanyObj?.vkn ||
                activeCompanyObj?.tckn ||
                data.settings.taxNumber ||
                readStoredMysoftTenantVkn()
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
              onAddAccount={(acc) => {
                void saveAccountToDatabase(acc, activeCompanyId);
                setData((p) => {
                  const initBal = Number(acc.balance) || 0;
                  if (initBal === 0) {
                    const nextState = { ...p, accounts: [...p.accounts, acc] };
                    saveStoredData("ACCOUNTS", nextState.accounts, activeCompanyId);
                    void pushCompanyDataToCloud(activeCompanyId, nextState);
                    return nextState;
                  }
                  const openingTx: Transaction = {
                    id: "tx_open_" + acc.id,
                    date: new Date().toISOString().split("T")[0],
                    type: initBal >= 0 ? "income" : "expense",
                    amount: Math.abs(initBal),
                    currency: acc.currency || "TRY",
                    accountId: acc.id,
                    accountName: acc.name,
                    category: "Açılış Devir Bakiyesi",
                    description: `${acc.name} açılış devir bakiyesi`,
                  };
                  void saveTransactionToDatabase(openingTx, activeCompanyId);
                  const nextState = {
                    ...p,
                    accounts: [...p.accounts, acc],
                    transactions: [openingTx, ...p.transactions],
                  };
                  saveStoredData("ACCOUNTS", nextState.accounts, activeCompanyId);
                  saveStoredData("TRANSACTIONS", nextState.transactions, activeCompanyId);
                  void pushCompanyDataToCloud(activeCompanyId, nextState);
                  return nextState;
                });
              }}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onTransferBetweenAccounts={handleTransferBetweenAccounts}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onBulkDeleteTransactions={handleBulkDeleteTransactions}
              onAddCheque={handleAddCheque}
              onUpdateCheque={handleUpdateCheque}
              onUpdateChequeStatus={handleUpdateChequeStatus}
              onDeleteCheque={handleDeleteCheque}
              onBulkDeleteCheques={handleBulkDeleteCheques}
              onEndorseCheque={handleEndorseCheque}
              onAddPromissoryNote={handleAddPromissoryNote}
              onUpdatePromissoryNote={handleUpdatePromissoryNote}
              onUpdateNoteStatus={handleUpdateNoteStatus}
              onEndorsePromissoryNote={handleEndorsePromissoryNote}
              onDeletePromissoryNote={handleDeletePromissoryNote}
              onBulkDeletePromissoryNotes={handleBulkDeletePromissoryNotes}
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
              onDeleteInvoice={handleDeleteInvoice}
              onDeleteTransaction={handleDeleteTransaction}
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
              activeCompany={activeCompanyObj || undefined}
              companyId={activeCompanyId}
              currentUser={currentUser}
              tenantIdentifierNumber={
                activeCompanyObj?.tenantIdentifierNumber ||
                data.settings.tenantIdentifierNumber ||
                data.settings.mysoftCredentials?.tenantIdentifierNumber ||
                activeCompanyObj?.vkn ||
                activeCompanyObj?.tckn ||
                data.settings.taxNumber ||
                readStoredMysoftTenantVkn()
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

          {["company", "company_profile", "company_companies", "company_mysoft", "company_branches", "company_warehouses", "company_settings", "company_logs", "e_document_logs", "settings"].includes(currentTab) && (
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
              settingsInitialTab={settingsInitialTab}
              activeSubTab={
                currentTab === "company_companies"
                  ? "companies"
                  : currentTab === "company_mysoft"
                  ? "mysoft"
                  : currentTab === "company_logs" || currentTab === "e_document_logs"
                  ? "logs"
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
                else if (tab === "logs") setCurrentTab("company_logs");
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
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
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
        </div>
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
          const latestCompanies = getCompaniesList();
          setCompanies(latestCompanies);
          const targetId = user.companyId || getActiveCompanyId();
          handleSelectCompany(targetId, latestCompanies);
          void pullLatestCompanyDataFromCloud(targetId, true).then(() => {
            const refreshedCompanies = getCompaniesList();
            setCompanies(refreshedCompanies);
            handleSelectCompany(targetId, refreshedCompanies);
          });
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
