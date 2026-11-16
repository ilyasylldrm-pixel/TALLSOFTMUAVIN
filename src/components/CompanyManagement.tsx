import React, { useState } from "react";
import {
  CompanySettings,
  CompanyItem,
  Branch,
  Warehouse,
  AddressDetails,
  TAXPAYER_TYPES,
  isAdminOrSysAdmin,
  isModuleOrSubModuleAllowed,
  isCompanyMysoftMatched,
  resolveCompanyMysoftTenantIdentifier,
  isCompanyLogoEnabled,
  isCompanyDefaultBankEnabled,
} from "../types";
import { UserProfile } from "./AuthModal";
import { ExportButtons } from "./ExportButtons";
import { ExportData } from "../utils/exportUtils";
import { AddressSelector } from "./AddressSelector";
import { GibPortalModal } from "./GibPortalModal";
import { MysoftTenantPicker } from "./MysoftTenantPicker";
import { CompanyModal } from "./CompanyModal";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { useTheme } from "../context/ThemeContext";
import { Settings } from "./Settings";
import { Logo } from "./Logo";
import { AdminMysoftLogMonitorPanel } from "./AdminMysoftLogMonitorPanel";
import {
  getCompaniesList,
  getActiveCompanyId,
  addCompanyItem,
  updateCompanyItem,
  deleteCompanyItem,
  setActiveCompanyId,
  isProtectedCompanyId,
  parseSeparateAddressFields,
  appendCityDistrictToAddress,
  compileStructuredAddress,
  getDeletedCompanyIds,
  getStoredData,
  saveStoredData,
  PROTECTED_COMPANY_IDS,
} from "../utils/storage";
import { writeStoredMysoftTenantVkn } from "../utils/mysoftTenantStorage";
import { useMysoftTenants } from "../hooks/useMysoftTenants";
import {
  checkRecipientTaxpayerStatus,
  getMysoftBusinessPartnerSummary,
  getMysoftMappingDefaults,
  getNextMysoftInvoiceNumber,
  getLocalNextSequentialInvoiceNumber,
  validateSequentialInvoiceNumber,
  type MysoftBusinessPartnerSummary,
  type MysoftMappingDefaults,
  type MysoftTenant,
} from "../services/mysoftEDocumentService";
import {
  fetchCloudLogo,
  saveCloudLogo,
  subscribeToCloudLogo,
  CloudBrandingConfig,
  DEFAULT_CLOUD_BRANDING,
} from "../services/cloudBrandingService";
import { readAndOptimizeLogoFile, clampLogoScale } from "../utils/logoUpload";
import { logSystemAction } from "../services/systemSyncService";
import {
  Building2,
  Building,
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle2,
  XCircle,
  Save,
  Check,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Layers,
  Store,
  Tag,
  X,
  Lock,
  Key,
  Eye,
  EyeOff,
  FileText,
  ExternalLink,
  Globe,
  Copy,
  Calendar,
  Smartphone,
  Info,
  Shield,
  Fingerprint,
  CheckCheck,
  Settings as SettingsIcon,
  Cloud,
  RefreshCw,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  Database as DatabaseIcon,
  ArrowRight,
  UserCheck,
  Upload,
  Terminal,
  AlertTriangle,
  Landmark,
} from "lucide-react";

export type CompanySubTab = "profile" | "companies" | "mysoft" | "branches" | "warehouses" | "settings" | "logs";

interface CompanyManagementProps {
  settings: CompanySettings;
  branches: Branch[];
  warehouses: Warehouse[];
  onSaveSettings: (s: CompanySettings) => void;
  onAddBranch: (b: Branch) => void;
  onUpdateBranch: (b: Branch) => void;
  onDeleteBranch: (id: string) => void;
  onAddWarehouse: (w: Warehouse) => void;
  onUpdateWarehouse: (w: Warehouse) => void;
  onDeleteWarehouse: (id: string) => void;
  onExportBackup?: () => void;
  onImportBackup?: (jsonStr: string) => boolean;
  onResetDemoData?: () => void;
  activeSubTab?: CompanySubTab;
  onSelectSubTab?: (tab: CompanySubTab) => void;
  companies?: CompanyItem[];
  activeCompanyId?: string;
  onSelectCompany?: (companyId: string) => void;
  onAddCompany?: (comp: CompanyItem, makeActive?: boolean) => void;
  onUpdateCompany?: (comp: CompanyItem) => void;
  onDeleteCompany?: (companyId: string) => void;
  currentUser?: UserProfile | null;
  settingsInitialTab?: "theme" | "system" | "backup" | "cloud" | "github";
}

export const CompanyManagement: React.FC<CompanyManagementProps> = ({
  settings,
  branches,
  warehouses,
  onSaveSettings,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onAddWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
  activeSubTab = "profile",
  onSelectSubTab,
  companies,
  activeCompanyId,
  onSelectCompany,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  currentUser,
  settingsInitialTab,
}) => {
  const { theme } = useTheme();
  const [currentSubTab, setCurrentSubTab] = useState<CompanySubTab>(activeSubTab);
  const [branchStatusFilter, setBranchStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [warehouseStatusFilter, setWarehouseStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [pendingEntityDelete, setPendingEntityDelete] = useState<{
    type: "branch" | "warehouse";
    id: string;
    name: string;
  } | null>(null);

  React.useEffect(() => {
    if (activeSubTab) {
      if (!isAdminOrSysAdmin(currentUser) && ["settings", "companies", "mysoft", "logs"].includes(activeSubTab)) {
        setCurrentSubTab("profile");
      } else {
        setCurrentSubTab(activeSubTab);
      }
    }
  }, [activeSubTab, currentUser]);

  // Sync internal subtab if controlled externally
  const handleTabChange = (tab: CompanySubTab) => {
    if (!isAdminOrSysAdmin(currentUser) && ["settings", "companies", "mysoft", "logs"].includes(tab)) {
      return;
    }
    setCurrentSubTab(tab);
    if (onSelectSubTab) onSelectSubTab(tab);
  };

  // Multi-Company Local State & Modal
  const [localCompanies, setLocalCompanies] = useState<CompanyItem[]>(() => companies || getCompaniesList());
  const deletedIds = new Set(getDeletedCompanyIds());
  const rawCompanies = companies || localCompanies;
  const effectiveCompanies = React.useMemo(
    () =>
      rawCompanies.filter(
        (c) => c && c.id && (PROTECTED_COMPANY_IDS.has(c.id) || !deletedIds.has(c.id))
      ),
    [rawCompanies]
  );
  const currentActiveCompanyId = activeCompanyId || getActiveCompanyId();
  const activeCompanyRecord = React.useMemo(
    () => effectiveCompanies.find((c) => c.id === currentActiveCompanyId) || null,
    [effectiveCompanies, currentActiveCompanyId]
  );

  React.useEffect(() => {
    const subKeyMap: Record<CompanySubTab, string> = {
      profile: "company_profile",
      branches: "company_branches",
      warehouses: "company_warehouses",
      settings: "company_settings",
      companies: "company_companies",
      mysoft: "company_mysoft",
      logs: "company_logs",
    };
    const key = subKeyMap[currentSubTab] || "company_profile";
    if (!isModuleOrSubModuleAllowed(key, "company", currentUser, activeCompanyRecord)) {
      const candidates: CompanySubTab[] = isAdminOrSysAdmin(currentUser)
        ? ["profile", "branches", "warehouses", "settings"]
        : ["profile", "branches", "warehouses"];
      const firstAllowed = candidates.find((c) =>
        isModuleOrSubModuleAllowed(subKeyMap[c], "company", currentUser, activeCompanyRecord)
      );
      if (firstAllowed && firstAllowed !== currentSubTab) {
        setCurrentSubTab(firstAllowed);
        if (onSelectSubTab) onSelectSubTab(firstAllowed);
      }
    }
  }, [currentSubTab, currentUser, activeCompanyRecord]);

  const lastCompaniesJsonRef = React.useRef<string>("");
  React.useEffect(() => {
    if (companies) {
      const cStr = JSON.stringify(companies);
      if (lastCompaniesJsonRef.current !== cStr) {
        lastCompaniesJsonRef.current = cStr;
        setLocalCompanies(companies);
      }
    }
  }, [companies]);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<CompanySettings>(settings);
  const [isFetchingTaxpayer, setIsFetchingTaxpayer] = useState(false);
  const [vknFetchFeedback, setVknFetchFeedback] = useState<string | null>(null);

  const lastSettingsJsonRef = React.useRef<string>("");
  React.useEffect(() => {
    if (settings) {
      const sStr = JSON.stringify(settings);
      if (lastSettingsJsonRef.current !== sStr) {
        lastSettingsJsonRef.current = sStr;
        setProfileForm(settings);
      }
    }
  }, [settings]);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);
  const [companyModalMode, setCompanyModalMode] = useState<"create" | "edit" | "mysoft_match">("create");

  // Selected company for Mysoft tab
  const [selectedMysoftCompId, setSelectedMysoftCompId] = useState<string>(currentActiveCompanyId);

  const isAdmin = isAdminOrSysAdmin(currentUser);

  const handleOpenAddCompany = () => {
    if (!isAdmin) return;
    setEditingCompany(null);
    setCompanyModalMode("create");
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp: CompanyItem) => {
    if (!isAdmin) return;
    setEditingCompany(comp);
    setCompanyModalMode("edit");
    setIsCompanyModalOpen(true);
  };

  const handleOpenMysoftMatch = (comp: CompanyItem) => {
    setEditingCompany(comp);
    setCompanyModalMode("mysoft_match");
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompanyFromModal = (savedComp: CompanyItem, makeActiveImmediately = true) => {
    const isExisting = Boolean(editingCompany) || effectiveCompanies.some((c) => c.id === savedComp.id);
    if (isExisting) {
      if (onUpdateCompany) {
        onUpdateCompany(savedComp);
      } else {
        const updated = updateCompanyItem(savedComp);
        setLocalCompanies(updated);
      }
      setLocalCompanies(getCompaniesList());
      // Persist Portaldaki Seriler & Format Parametreleri to the matched company's settings
      try {
        const compStored = getStoredData(savedComp.id);
        const baseSettings =
          savedComp.id === currentActiveCompanyId
            ? profileForm || settings
            : compStored.settings || settings;
        const modalLogoEnabled = isCompanyLogoEnabled(savedComp);
        const modalBankEnabled = isCompanyDefaultBankEnabled(savedComp);
        const nextCompSettings: CompanySettings = {
          ...baseSettings,
          companyName: savedComp.companyName || baseSettings.companyName,
          companyTitle: savedComp.companyTitle || savedComp.companyName || baseSettings.companyTitle,
          taxOffice: savedComp.taxOffice || baseSettings.taxOffice,
          taxNumber: savedComp.taxNumber || savedComp.vkn || savedComp.tckn || baseSettings.taxNumber,
          vkn: savedComp.vkn ?? baseSettings.vkn,
          tckn: savedComp.tckn ?? baseSettings.tckn,
          tradeRegisterNo: savedComp.tradeRegisterNo ?? baseSettings.tradeRegisterNo,
          esnafSicilNo: savedComp.esnafSicilNo ?? baseSettings.esnafSicilNo,
          mersisNo: savedComp.mersisNo ?? baseSettings.mersisNo,
          phone: savedComp.phone ?? baseSettings.phone,
          email: savedComp.email ?? baseSettings.email,
          website: savedComp.website ?? baseSettings.website,
          address: savedComp.address ?? baseSettings.address,
          city: savedComp.city ?? baseSettings.city,
          district: savedComp.district ?? baseSettings.district,
          useCorporateLogo: modalLogoEnabled,
          logoUrl: modalLogoEnabled
            ? (savedComp.logoUrl && savedComp.logoUrl !== "/logo.svg" ? savedComp.logoUrl : "")
            : "",
          logoScale: savedComp.logoScale ?? baseSettings.logoScale ?? 1,
          useDefaultBankInfo: modalBankEnabled,
          defaultBankAccountName: modalBankEnabled ? (savedComp.defaultBankAccountName ?? "") : "",
          defaultBankName: modalBankEnabled ? (savedComp.defaultBankName ?? "") : "",
          defaultBankIban: modalBankEnabled ? (savedComp.defaultBankIban ?? "") : "",
          tenantIdentifierNumber: savedComp.tenantIdentifierNumber || baseSettings.tenantIdentifierNumber,
          mysoftMatchedType: savedComp.mysoftMatchedType ?? baseSettings.mysoftMatchedType,
          mysoftStatus: savedComp.mysoftStatus ?? baseSettings.mysoftStatus,
          mysoftAccessMode: "business_partner",
          mysoftPartnerTenantId: savedComp.mysoftPartnerTenantId ?? baseSettings.mysoftPartnerTenantId,
          mysoftPartnerName: savedComp.mysoftPartnerName ?? baseSettings.mysoftPartnerName,
          mysoftUsername: savedComp.mysoftUsername ?? baseSettings.mysoftUsername,
          mysoftPassword: savedComp.mysoftPassword ?? baseSettings.mysoftPassword,
          mysoftCredentials: {
            ...baseSettings.mysoftCredentials,
            tenantIdentifierNumber: savedComp.tenantIdentifierNumber || baseSettings.tenantIdentifierNumber,
            accessMode: "business_partner",
            partnerTenantId:
              savedComp.mysoftPartnerTenantId ?? baseSettings.mysoftCredentials?.partnerTenantId,
            partnerName:
              savedComp.mysoftPartnerName ?? baseSettings.mysoftCredentials?.partnerName,
            username: savedComp.mysoftUsername ?? baseSettings.mysoftCredentials?.username,
            password: savedComp.mysoftPassword ?? baseSettings.mysoftCredentials?.password,
          },
          eFaturaPrefix: savedComp.eFaturaPrefix || baseSettings.eFaturaPrefix,
          eFaturaNextNumber: savedComp.eFaturaNextNumber || baseSettings.eFaturaNextNumber,
          eArsivPrefix: savedComp.eArsivPrefix || baseSettings.eArsivPrefix,
          eArsivNextNumber: savedComp.eArsivNextNumber || baseSettings.eArsivNextNumber,
          defaultInvoicePrefix:
            savedComp.eFaturaPrefix ||
            savedComp.defaultInvoicePrefix ||
            baseSettings.defaultInvoicePrefix,
        };
        saveStoredData("SETTINGS", nextCompSettings, savedComp.id);
        if (savedComp.id === currentActiveCompanyId) {
          setProfileForm(nextCompSettings);
          onSaveSettings(nextCompSettings);
        }
      } catch {
        // Ignore storage write errors
      }

      void logSystemAction({
        action: `Şirket Bilgileri Güncellendi: ${savedComp.companyName}`,
        category: "Şirket & Yapılandırma",
        details: `${savedComp.companyName} (${savedComp.taxNumber || savedComp.vkn || "VKN Yok"}) ticari firma bilgileri güncellendi.`,
        performedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        userRole: currentUser?.role || "Admin",
        targetCompany: savedComp.companyName,
        timestamp: new Date().toISOString(),
      });
    } else {
      if (onAddCompany) {
        onAddCompany(savedComp, makeActiveImmediately);
        setLocalCompanies(getCompaniesList());
      } else {
        const updated = addCompanyItem(savedComp);
        setLocalCompanies(updated);
        if (makeActiveImmediately) {
          setActiveCompanyId(savedComp.id);
          if (onSelectCompany) {
            onSelectCompany(savedComp.id);
          }
        }
      }
      if (makeActiveImmediately && onSelectCompany) {
        onSelectCompany(savedComp.id);
      }

      void logSystemAction({
        action: `Yeni Şirket Oluşturuldu: ${savedComp.companyName}`,
        category: "Şirket & Yapılandırma",
        details: `${savedComp.companyName} (${savedComp.taxNumber || savedComp.vkn || "VKN Yok"}) sisteme yeni firma olarak eklendi.`,
        performedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        userRole: currentUser?.role || "Admin",
        targetCompany: savedComp.companyName,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const [companyToDelete, setCompanyToDelete] = useState<CompanyItem | null>(null);

  const handleDeleteCompanyItem = (id: string) => {
    if (!isAdmin) return;
    if (isProtectedCompanyId(id)) {
      return;
    }
    const target = effectiveCompanies.find((c) => c.id === id);
    if (target) {
      if (isProtectedCompanyId(target.id) || target.isDefault) return;
      setCompanyToDelete(target);
    } else {
      if (onDeleteCompany) {
        onDeleteCompany(id);
      } else {
        const updated = deleteCompanyItem(id);
        setLocalCompanies(updated);
      }
    }
  };

  const handleConfirmDeleteCompanyItem = () => {
    if (!companyToDelete) return;
    if (isProtectedCompanyId(companyToDelete.id) || companyToDelete.isDefault) {
      setCompanyToDelete(null);
      return;
    }
    const deletedName = companyToDelete.companyName;
    if (onDeleteCompany) {
      onDeleteCompany(companyToDelete.id);
    } else {
      const updated = deleteCompanyItem(companyToDelete.id);
      setLocalCompanies(updated);
    }

    void logSystemAction({
      action: `Şirket Silindi: ${deletedName}`,
      category: "Şirket & Yapılandırma",
      details: `${deletedName} firma kaydı ve ilişkili yerel veriler sistemden silindi.`,
      performedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
      userRole: currentUser?.role || "Admin",
      targetCompany: deletedName,
      status: "warning",
      timestamp: new Date().toISOString(),
    });

    setCompanyToDelete(null);
  };

  // Mysoft VKN/TCKN Eşleştirme Masası — Resmi Belge Ön Ekleri ve Ardışık Numaratör State
  const [mysoftDeskDefaults, setMysoftDeskDefaults] = useState<MysoftMappingDefaults | null>(null);
  const [isSyncingMysoftPrefixes, setIsSyncingMysoftPrefixes] = useState(false);
  const [mysoftDeskFeedback, setMysoftDeskFeedback] = useState<string | null>(null);
  const [deskEFaturaPrefix, setDeskEFaturaPrefix] = useState<string>("GIB");
  const [deskEFaturaLastNo, setDeskEFaturaLastNo] = useState<string>("");
  const [deskEFaturaNextNo, setDeskEFaturaNextNo] = useState<string>("");
  const [deskEArsivPrefix, setDeskEArsivPrefix] = useState<string>("EAR");
  const [deskEArsivLastNo, setDeskEArsivLastNo] = useState<string>("");
  const [deskEArsivNextNo, setDeskEArsivNextNo] = useState<string>("");

  const syncSelectedCompanyMysoftPrefixes = React.useCallback(
    async (
      compId?: string,
      showFeedback = false,
      overrideVkn?: string,
      baseCompOverride?: CompanyItem,
    ) => {
      const targetId = compId || selectedMysoftCompId || currentActiveCompanyId;
      const targetComp =
        baseCompOverride ||
        getCompaniesList().find((c) => c.id === targetId) ||
        effectiveCompanies.find((c) => c.id === targetId) ||
        effectiveCompanies[0];
      if (!targetComp) return;

      const localEFat = getLocalNextSequentialInvoiceNumber("e_fatura", targetComp.id);
      const localEArs = getLocalNextSequentialInvoiceNumber("e_arsiv", targetComp.id);

      setDeskEFaturaPrefix(localEFat.prefix);
      setDeskEFaturaLastNo(localEFat.lastInvoiceNumber || "");
      setDeskEFaturaNextNo(localEFat.nextInvoiceNumber);
      setDeskEArsivPrefix(localEArs.prefix);
      setDeskEArsivLastNo(localEArs.lastInvoiceNumber || "");
      setDeskEArsivNextNo(localEArs.nextInvoiceNumber);

      const cleanId = (
        overrideVkn ||
        targetComp.tenantIdentifierNumber ||
        targetComp.vkn ||
        targetComp.tckn ||
        targetComp.taxNumber ||
        ""
      )
        .replace(/\D/g, "")
        .trim();

      if (!cleanId) return;

      setIsSyncingMysoftPrefixes(true);
      if (showFeedback) setMysoftDeskFeedback(null);

      try {
        const currentYear = new Date().getFullYear();
        const [defaultsSettled, efatSettled, earsSettled] = await Promise.allSettled([
          getMysoftMappingDefaults(cleanId),
          getNextMysoftInvoiceNumber({
            tenantIdentifierNumber: cleanId,
            eDocumentType: "EFATURA",
            year: currentYear,
          }),
          getNextMysoftInvoiceNumber({
            tenantIdentifierNumber: cleanId,
            eDocumentType: "EARSIVFATURA",
            year: currentYear,
          }),
        ]);

        const defaults =
          defaultsSettled.status === "fulfilled" ? defaultsSettled.value : null;
        const efatRes = efatSettled.status === "fulfilled" ? efatSettled.value : null;
        const earsRes = earsSettled.status === "fulfilled" ? earsSettled.value : null;

        const nonGen = (v?: string) => {
          const c = String(v || "").trim().toUpperCase().slice(0, 3);
          return c && c !== "GIB" && c !== "EAR" ? c : "";
        };

        const resolvedEFatPrefix = (
          nonGen(efatRes?.prefix) ||
          nonGen(defaults?.eFaturaPrefix) ||
          nonGen(localEFat.prefix) ||
          nonGen(targetComp.eFaturaPrefix) ||
          efatRes?.prefix ||
          defaults?.eFaturaPrefix ||
          localEFat.prefix ||
          targetComp.eFaturaPrefix ||
          "GIB"
        )
          .toUpperCase()
          .slice(0, 3);

        const resolvedEArsPrefix = (
          nonGen(earsRes?.prefix) ||
          nonGen(defaults?.eArsivPrefix) ||
          nonGen(localEArs.prefix) ||
          nonGen(targetComp.eArsivPrefix) ||
          earsRes?.prefix ||
          defaults?.eArsivPrefix ||
          localEArs.prefix ||
          targetComp.eArsivPrefix ||
          "EAR"
        )
          .toUpperCase()
          .slice(0, 3);

        const finalEFatSeq = Math.max(
          1,
          efatRes?.nextSequence || 1,
          defaults?.eFaturaSequence || 1,
          localEFat.nextSequence || 1,
        );
        const finalEArsSeq = Math.max(
          1,
          earsRes?.nextSequence || 1,
          defaults?.eArsivSequence || 1,
          localEArs.nextSequence || 1,
        );

        const finalEFatNext = `${resolvedEFatPrefix}${currentYear}${String(finalEFatSeq).padStart(9, "0")}`;
        const finalEFatLast =
          finalEFatSeq > 1
            ? `${resolvedEFatPrefix}${currentYear}${String(finalEFatSeq - 1).padStart(9, "0")}`
            : efatRes?.lastInvoiceNumber || defaults?.eFaturaLastNumber || localEFat.lastInvoiceNumber || "";

        const finalEArsNext = `${resolvedEArsPrefix}${currentYear}${String(finalEArsSeq).padStart(9, "0")}`;
        const finalEArsLast =
          finalEArsSeq > 1
            ? `${resolvedEArsPrefix}${currentYear}${String(finalEArsSeq - 1).padStart(9, "0")}`
            : earsRes?.lastInvoiceNumber || defaults?.eArsivLastNumber || localEArs.lastInvoiceNumber || "";

        setDeskEFaturaPrefix(resolvedEFatPrefix);
        setDeskEFaturaLastNo(finalEFatLast);
        setDeskEFaturaNextNo(finalEFatNext);
        setDeskEArsivPrefix(resolvedEArsPrefix);
        setDeskEArsivLastNo(finalEArsLast);
        setDeskEArsivNextNo(finalEArsNext);

        const mergedPrefixes = [...(defaults?.prefixes || [])];
        const seenPfx = new Set(mergedPrefixes.map((p) => String(p.prefix || "").toUpperCase()));
        if (!seenPfx.has(resolvedEFatPrefix)) {
          seenPfx.add(resolvedEFatPrefix);
          mergedPrefixes.unshift({
            prefix: resolvedEFatPrefix,
            edocumentType: 1,
            isDefault: true,
            currentNumber: finalEFatSeq - 1,
            lastNumber: finalEFatLast || undefined,
            nextNumber: finalEFatNext,
          });
        }
        if (!seenPfx.has(resolvedEArsPrefix)) {
          seenPfx.add(resolvedEArsPrefix);
          mergedPrefixes.push({
            prefix: resolvedEArsPrefix,
            edocumentType: 2,
            isDefault: true,
            currentNumber: finalEArsSeq - 1,
            lastNumber: finalEArsLast || undefined,
            nextNumber: finalEArsNext,
          });
        }

        setMysoftDeskDefaults({
          vknTckn: cleanId,
          eFaturaPrefix: resolvedEFatPrefix,
          eFaturaLastNumber: finalEFatLast || undefined,
          eFaturaNextNumber: finalEFatNext,
          eFaturaSequence: finalEFatSeq,
          eArsivPrefix: resolvedEArsPrefix,
          eArsivLastNumber: finalEArsLast || undefined,
          eArsivNextNumber: finalEArsNext,
          eArsivSequence: finalEArsSeq,
          prefixes: mergedPrefixes,
        });

        // Persist updated prefixes and next numbers to the company & settings automatically
        if (
          targetComp.eFaturaPrefix !== resolvedEFatPrefix ||
          targetComp.eFaturaNextNumber !== finalEFatNext ||
          targetComp.eArsivPrefix !== resolvedEArsPrefix ||
          targetComp.eArsivNextNumber !== finalEArsNext
        ) {
          const updatedComp: CompanyItem = {
            ...targetComp,
            eFaturaPrefix: resolvedEFatPrefix,
            eFaturaNextNumber: finalEFatNext,
            eArsivPrefix: resolvedEArsPrefix,
            eArsivNextNumber: finalEArsNext,
          };
          handleSaveCompanyFromModal(updatedComp, false);
        }

        if (showFeedback) {
          setMysoftDeskFeedback(
            `Resmi belge ön ekleri (${resolvedEFatPrefix} / ${resolvedEArsPrefix}) ve Mysoft son belge numaraları eşitlendi. Programdan kesilecek faturalar ${finalEFatNext} / ${finalEArsNext} numarasından ardışık devam edecektir.`,
          );
          setTimeout(() => setMysoftDeskFeedback(null), 6000);
        }
      } catch {
        if (showFeedback) {
          setMysoftDeskFeedback(
            `Yerel Mysoft e-Belge kayıtlarından ön ekler (${localEFat.prefix} / ${localEArs.prefix}) ve sıradaki numaralar (${localEFat.nextInvoiceNumber}) güncellendi.`,
          );
          setTimeout(() => setMysoftDeskFeedback(null), 5000);
        }
      } finally {
        setIsSyncingMysoftPrefixes(false);
      }
    },
    [selectedMysoftCompId, currentActiveCompanyId, effectiveCompanies],
  );

  React.useEffect(() => {
    void syncSelectedCompanyMysoftPrefixes(selectedMysoftCompId, false);
  }, [selectedMysoftCompId, currentSubTab]);

  // Mysoft İş Ortağı (Business Partner) Merkezi API Erişim Durumu ve Opsiyonel Portal Bilgileri State
  const [deskMysoftUsername, setDeskMysoftUsername] = useState<string>("");
  const [deskMysoftPassword, setDeskMysoftPassword] = useState<string>("");
  const [showDeskMysoftPassword, setShowDeskMysoftPassword] = useState<boolean>(false);
  const [showOptionalPortalCreds, setShowOptionalPortalCreds] = useState<boolean>(false);
  const [tenantSearchQuery, setTenantSearchQuery] = useState<string>("");
  const [partnerSummary, setPartnerSummary] = useState<MysoftBusinessPartnerSummary | null>(null);
  const [isSyncingPartnerLinks, setIsSyncingPartnerLinks] = useState<boolean>(false);

  const {
    tenants: mysoftDeskTenants,
    loading: isMysoftDeskTenantsLoading,
    error: mysoftDeskTenantsError,
    partnerHint: mysoftDeskPartnerHint,
    reload: reloadMysoftDeskTenants,
    manualVkn: deskManualVkn,
    setManualVkn: setDeskManualVkn,
    lookupLoading: isDeskManualVknLoading,
    lookupByVkn: deskLookupByVkn,
  } = useMysoftTenants({
    autoLoad: true,
  });

  const refreshPartnerSummary = React.useCallback(async () => {
    try {
      const summary = await getMysoftBusinessPartnerSummary();
      setPartnerSummary(summary);
    } catch {
      // Non-fatal if status endpoint is temporarily unavailable
    }
  }, []);

  React.useEffect(() => {
    if (currentSubTab === "mysoft") {
      void refreshPartnerSummary();
    }
  }, [currentSubTab, refreshPartnerSummary]);

  // Seçili şirket değiştiğinde Mysoft opsiyonel portal kullanıcı adı ve şifresini forma eşitle
  React.useEffect(() => {
    const comp = effectiveCompanies.find((c) => c.id === selectedMysoftCompId) || effectiveCompanies[0];
    if (comp) {
      setDeskMysoftUsername(comp.mysoftUsername || comp.mysoftCredentials?.username || "");
      setDeskMysoftPassword(comp.mysoftPassword || comp.mysoftCredentials?.password || "");
    }
  }, [selectedMysoftCompId, effectiveCompanies]);

  const handleSaveDeskMysoftCredentials = (compId?: string) => {
    const targetId = compId || selectedMysoftCompId || currentActiveCompanyId;
    const targetComp = effectiveCompanies.find((c) => c.id === targetId) || effectiveCompanies[0];
    if (!targetComp) return;

    const trimmedUser = deskMysoftUsername.trim();
    const trimmedPass = deskMysoftPassword.trim();
    const resolvedTenant =
      resolveCompanyMysoftTenantIdentifier(targetComp) ||
      targetComp.tenantIdentifierNumber ||
      targetComp.vkn ||
      targetComp.tckn;

    const updatedComp: CompanyItem = {
      ...targetComp,
      mysoftAccessMode: "business_partner",
      mysoftUsername: trimmedUser,
      mysoftPassword: trimmedPass,
      mysoftCredentials: {
        ...targetComp.mysoftCredentials,
        tenantIdentifierNumber: resolvedTenant,
        accessMode: "business_partner",
        partnerTenantId: targetComp.mysoftPartnerTenantId,
        partnerName: targetComp.mysoftPartnerName,
        username: trimmedUser,
        password: trimmedPass,
      },
    };

    handleSaveCompanyFromModal(updatedComp, false);
    setMysoftDeskFeedback(
      `"${targetComp.companyName}" için opsiyonel portal giriş bilgileri kaydedildi. Tüm Mysoft API erişimleri Mysoft İş Ortağı hesabı üzerinden (${resolvedTenant || "VKN/TCKN"}) yürütülmeye devam eder.`,
    );
    setTimeout(() => setMysoftDeskFeedback(null), 5000);
  };

  const handleMatchTenantWithSelectedComp = (tenant: MysoftTenant) => {
    const targetComp = effectiveCompanies.find((c) => c.id === selectedMysoftCompId) || effectiveCompanies[0];
    if (!targetComp) return;
    const vkn = String(tenant.taxNumber || "").replace(/\D/g, "").trim();
    if (!vkn) return;

    const matchedType: "vkn" | "tckn" = vkn.length === 11 ? "tckn" : "vkn";
    const updatedComp: CompanyItem = {
      ...targetComp,
      mysoftMatchedType: matchedType,
      tenantIdentifierNumber: vkn,
      mysoftStatus: "verified" as const,
      mysoftAccessMode: "business_partner",
      mysoftPartnerTenantId: tenant.id || targetComp.mysoftPartnerTenantId,
      mysoftPartnerName: tenant.name || targetComp.mysoftPartnerName,
      mysoftTenantName: tenant.name || targetComp.mysoftTenantName,
      vkn: vkn.length === 10 ? vkn : targetComp.vkn,
      tckn: vkn.length === 11 ? vkn : targetComp.tckn,
      mysoftCredentials: {
        ...targetComp.mysoftCredentials,
        tenantIdentifierNumber: vkn,
        accessMode: "business_partner",
        partnerTenantId: tenant.id || targetComp.mysoftPartnerTenantId,
        partnerName: tenant.name || targetComp.mysoftPartnerName,
      },
    };
    handleSaveCompanyFromModal(updatedComp, false);
    if (targetComp.id === currentActiveCompanyId) {
      writeStoredMysoftTenantVkn(vkn);
    }
    void syncSelectedCompanyMysoftPrefixes(targetComp.id, true, vkn, updatedComp);
    setMysoftDeskFeedback(
      `"${tenant.name || vkn}" mükellefi Mysoft İş Ortağı API erişimi üzerinden "${targetComp.companyName}" şirketine bağlandı (${vkn}). Firmanın e-Fatura ve e-Arşiv seri numaraları getiriliyor...`,
    );
    setTimeout(() => setMysoftDeskFeedback(null), 5500);
  };

  const handleBindAllCompaniesToBusinessPartner = async () => {
    setIsSyncingPartnerLinks(true);
    try {
      await reloadMysoftDeskTenants();
      await refreshPartnerSummary();
      const tenantByVkn = new Map<string, MysoftTenant>();
      for (const t of mysoftDeskTenants) {
        const cleanTax = String(t.taxNumber || "").replace(/\D/g, "").trim();
        if (cleanTax) tenantByVkn.set(cleanTax, t);
      }

      let boundCount = 0;
      for (const comp of effectiveCompanies) {
        const candidateId =
          resolveCompanyMysoftTenantIdentifier(comp) ||
          String(comp.vkn || comp.tckn || comp.taxNumber || "")
            .replace(/\D/g, "")
            .trim();
        if (candidateId.length !== 10 && candidateId.length !== 11) continue;
        const partnerTenant = tenantByVkn.get(candidateId);
        const matchedType: "vkn" | "tckn" = candidateId.length === 11 ? "tckn" : "vkn";
        const updatedComp: CompanyItem = {
          ...comp,
          mysoftMatchedType: comp.mysoftMatchedType || matchedType,
          tenantIdentifierNumber: candidateId,
          mysoftStatus: "verified",
          mysoftAccessMode: "business_partner",
          mysoftPartnerTenantId: partnerTenant?.id || comp.mysoftPartnerTenantId,
          mysoftPartnerName: partnerTenant?.name || comp.mysoftPartnerName || comp.mysoftTenantName,
          mysoftTenantName: partnerTenant?.name || comp.mysoftTenantName || comp.companyTitle,
          vkn: candidateId.length === 10 ? candidateId : comp.vkn,
          tckn: candidateId.length === 11 ? candidateId : comp.tckn,
          mysoftCredentials: {
            ...comp.mysoftCredentials,
            tenantIdentifierNumber: candidateId,
            accessMode: "business_partner",
            partnerTenantId: partnerTenant?.id || comp.mysoftPartnerTenantId,
            partnerName: partnerTenant?.name || comp.mysoftPartnerName,
          },
        };
        handleSaveCompanyFromModal(updatedComp, false);
        if (comp.id === currentActiveCompanyId) {
          writeStoredMysoftTenantVkn(candidateId);
        }
        boundCount += 1;
      }

      await syncSelectedCompanyMysoftPrefixes(selectedMysoftCompId, false);

      setMysoftDeskFeedback(
        `${boundCount} şirket/firma Mysoft İş Ortağı (Merkezi Entegratör OAuth2) API erişimine bağlandı ve e-Fatura / e-Arşiv seri numaraları eşitlendi.`,
      );
      setTimeout(() => setMysoftDeskFeedback(null), 6000);
    } finally {
      setIsSyncingPartnerLinks(false);
    }
  };

  const [isSaved, setIsSaved] = useState(false);
  const [isCredSaved, setIsCredSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Credential Password Visibility
  const [showTaxPasswords, setShowTaxPasswords] = useState(false);
  const [showSgkPasswords, setShowSgkPasswords] = useState(false);
  const [showEDevletPasswords, setShowEDevletPasswords] = useState(false);
  const [isGibModalOpen, setIsGibModalOpen] = useState(false);

  const handleTaxCredChange = (field: string, value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      taxCredentials: {
        ...prev.taxCredentials,
        [field]: value,
      },
    }));
  };

  const handleSgkCredChange = (field: string, value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      sgkCredentials: {
        ...prev.sgkCredentials,
        [field]: value,
      },
    }));
  };

  const handleEDevletCredChange = (field: string, value: string) => {
    setProfileForm((prev) => ({
      ...prev,
      eDevletCredentials: {
        ...prev.eDevletCredentials,
        [field]: value,
      },
    }));
  };

  const copyToClipboard = (text: string | undefined, keyId: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveCredentials = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(profileForm);
    setIsCredSaved(true);
    setTimeout(() => setIsCredSaved(false), 3000);
  };

  // Detail Navigation for Full-Page Views
  const companyNav = useDetailNavigation({
    moduleKey: "company-management",
  });

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchSearch, setBranchSearch] = useState("");

  // Warehouse Modal State
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseSearch, setWarehouseSearch] = useState("");

  const handleCloseBranch = () => {
    companyNav.backToList();
    setIsBranchModalOpen(false);
    setEditingBranch(null);
  };

  const handleCloseWarehouse = () => {
    companyNav.backToList();
    setIsWarehouseModalOpen(false);
    setEditingWarehouse(null);
  };

  // Form State for Branch Add/Edit
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({
    code: "",
    name: "",
    managerName: "",
    phone: "",
    email: "",
    isMain: false,
    status: "active",
    address: {
      country: "Türkiye",
      city: "İstanbul",
      district: "Şişli",
      neighborhood: "Mecidiyeköy",
      street: "",
      buildingNo: "",
      doorNo: "",
      postalCode: "",
      fullAddress: "",
    },
  });

  // Form State for Warehouse Add/Edit
  const [warehouseForm, setWarehouseForm] = useState<Partial<Warehouse>>({
    code: "",
    name: "",
    type: "main",
    capacityM2: 500,
    managerName: "",
    phone: "",
    branchId: branches[0]?.id || "",
    branchName: branches[0]?.name || "",
    status: "active",
    address: {
      country: "Türkiye",
      city: "İstanbul",
      district: "Şişli",
      neighborhood: "Mecidiyeköy",
      street: "",
      buildingNo: "",
      doorNo: "",
      postalCode: "",
      fullAddress: "",
    },
  });

  // Google Cloud Console Logo State
  const [cloudLogoLoading, setCloudLogoLoading] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);
  const [cloudBranding, setCloudBranding] = useState<CloudBrandingConfig | null>(null);

  // Cloud Console'dan başlangıçta aktif şirketin logosunu çek
  React.useEffect(() => {
    const applyForActiveCompany = (branding: CloudBrandingConfig | null) => {
      if (!branding) return;
      setCloudBranding(branding);
      const currentCompId = activeCompanyId || getActiveCompanyId();
      const compEntry = branding.companyLogos?.[currentCompId];
      const targetLogo =
        compEntry?.logoUrl ||
        (currentCompId === "comp_default" ? branding.logoUrl : undefined);
      const targetScale = compEntry?.logoScale ?? branding.logoScale;
      if (targetLogo && targetLogo !== "/logo.svg") {
        setProfileForm((prev) => {
          if (!isCompanyLogoEnabled(prev)) {
            return prev;
          }
          if (prev.logoUrl && prev.logoUrl !== "/logo.svg") {
            return prev;
          }
          return {
            ...prev,
            useCorporateLogo: true,
            logoUrl: targetLogo,
            logoScale: prev.logoScale ?? targetScale ?? 1,
          };
        });
      }
    };

    fetchCloudLogo().then((branding) => {
      applyForActiveCompany(branding);
    });

    const unsubscribe = subscribeToCloudLogo((branding) => {
      applyForActiveCompany(branding);
    });

    return () => unsubscribe();
  }, [activeCompanyId]);

  // Google Cloud Console'dan Logoyu Çek Buton Olayı
  const handleFetchFromCloudConsole = async () => {
    setCloudLogoLoading(true);
    setCloudSyncStatus(null);
    try {
      const res = await fetchCloudLogo();
      const currentCompId = activeCompanyId || getActiveCompanyId();
      const compEntry = res?.companyLogos?.[currentCompId];
      const fetchedUrl = compEntry?.logoUrl || res?.logoUrl;
      const fetchedScale = clampLogoScale(compEntry?.logoScale ?? res?.logoScale ?? 1);
      if (fetchedUrl && fetchedUrl !== "/logo.svg") {
        setCloudBranding(res);
        const nextForm: CompanySettings = {
          ...profileForm,
          useCorporateLogo: true,
          logoUrl: fetchedUrl,
          logoScale: fetchedScale,
        };
        setProfileForm(nextForm);
        onSaveSettings({ ...settings, ...nextForm });
        setCloudSyncStatus("Şirket logosu Google Cloud Console Firestore veritabanından başarıyla çekildi!");
      } else {
        setCloudSyncStatus("Cloud Console bağlantısı sağlandı (kayıtlı özel şirket logosu bulunamadı).");
      }
    } catch (err: any) {
      setCloudSyncStatus("Cloud Console bağlantı uyarısı: " + (err?.message || "Bilinmiyor"));
    } finally {
      setCloudLogoLoading(false);
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Google Cloud Console Firestore'a Kaydet
  const handleSaveToCloudConsole = async () => {
    setCloudLogoLoading(true);
    setCloudSyncStatus(null);
    try {
      const targetUrl = profileForm.logoUrl && profileForm.logoUrl !== "/logo.svg" ? profileForm.logoUrl : "";
      if (!targetUrl) {
        setCloudSyncStatus("Cloud'a kaydetmek için önce bir şirket logosu yükleyin veya URL girin.");
        return;
      }
      const targetScale = clampLogoScale(profileForm.logoScale ?? 1);
      const currentCompId = activeCompanyId || getActiveCompanyId();
      const saved = await saveCloudLogo(
        targetUrl,
        {
          brandName: profileForm.companyName || "E-MUAVİN",
          logoScale: targetScale,
          description: "Cloud Console üzerinden güncellenen şirket kurumsal logosu",
        },
        currentCompId
      );
      setCloudBranding(saved);
      const nextForm: CompanySettings = {
        ...profileForm,
        useCorporateLogo: true,
        logoUrl: targetUrl,
        logoScale: targetScale,
      };
      setProfileForm(nextForm);
      onSaveSettings({ ...settings, ...nextForm });
      setCloudSyncStatus("Şirket logosu ve ölçeği Google Cloud Console Firestore veritabanına kaydedildi!");
    } catch (err: any) {
      setCloudSyncStatus("Kaydetme hatası: " + (err?.message || "Bilinmiyor"));
    } finally {
      setCloudLogoLoading(false);
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  const companyLogoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUploadLogoFromComputer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCloudLogoLoading(true);
    setCloudSyncStatus(null);
    try {
      const optimizedDataUrl = await readAndOptimizeLogoFile(file);
      const currentCompId = activeCompanyId || getActiveCompanyId();
      const nextProfile: CompanySettings = {
        ...profileForm,
        useCorporateLogo: true,
        logoUrl: optimizedDataUrl,
        logoScale: 1,
      };
      setProfileForm(nextProfile);
      onSaveSettings({ ...settings, ...nextProfile });
      const saved = await saveCloudLogo(
        optimizedDataUrl,
        {
          brandName: profileForm.companyName || "E-MUAVİN",
          logoScale: 1,
          description: `Bilgisayardan yüklenen kurumsal logo (${file.name})`,
        },
        currentCompId
      );
      setCloudBranding(saved);
      setCloudSyncStatus(`"${file.name}" Muavin logosu ölçüsüne uyarlanarak şirket logonuz olarak kaydedildi!`);
    } catch (err: any) {
      setCloudSyncStatus("Logo yükleme hatası: " + (err?.message || "Geçersiz dosya formatı"));
    } finally {
      setCloudLogoLoading(false);
      e.target.value = "";
      setTimeout(() => setCloudSyncStatus(null), 5000);
    }
  };

  const handleAdjustLogoScale = (nextScaleValue: number) => {
    const clamped = clampLogoScale(nextScaleValue);
    const nextProfile: CompanySettings = {
      ...profileForm,
      useCorporateLogo: true,
      logoScale: clamped,
    };
    setProfileForm(nextProfile);
    onSaveSettings({ ...settings, ...nextProfile });
  };

  const autoSaveTimerRef = React.useRef< ReturnType<typeof setTimeout> | null >(null);

  const persistProfileSettings = React.useCallback(
    (sourceForm: CompanySettings, showSavedFeedback = true) => {
      const resolvedName = (sourceForm.companyName || sourceForm.companyTitle || "Aktif Şirket").trim();
      const resolvedTitle = (sourceForm.companyTitle || sourceForm.companyName || resolvedName).trim();
      const cleanTax = String(sourceForm.taxNumber || "").replace(/\D/g, "").trim();
      const logoEnabled = isCompanyLogoEnabled(sourceForm);
      const bankEnabled = isCompanyDefaultBankEnabled(sourceForm);
      const resolvedBankHolder = bankEnabled
        ? sourceForm.defaultBankAccountName && sourceForm.defaultBankAccountName.trim()
          ? sourceForm.defaultBankAccountName
          : resolvedTitle
        : "";

      const cleanedProfile: CompanySettings = {
        ...sourceForm,
        companyName: resolvedName,
        name: resolvedName,
        companyTitle: resolvedTitle,
        title: resolvedTitle,
        vkn: cleanTax.length === 10 ? cleanTax : sourceForm.vkn,
        tckn: cleanTax.length === 11 ? cleanTax : sourceForm.tckn,
        tradeRegisterNo: (sourceForm.tradeRegisterNo ?? "").trim(),
        esnafSicilNo: (sourceForm.esnafSicilNo ?? "").trim(),
        mersisNo: (sourceForm.mersisNo ?? "").trim(),
        phone: (sourceForm.phone ?? "").trim(),
        email: (sourceForm.email ?? "").trim(),
        website: (sourceForm.website ?? "").trim(),
        useCorporateLogo: logoEnabled,
        logoUrl: logoEnabled
          ? sourceForm.logoUrl && sourceForm.logoUrl !== "/logo.svg"
            ? sourceForm.logoUrl
            : ""
          : "",
        useDefaultBankInfo: bankEnabled,
        defaultBankAccountName: resolvedBankHolder,
        defaultBankName: bankEnabled ? (sourceForm.defaultBankName ?? "") : "",
        defaultBankIban: bankEnabled ? (sourceForm.defaultBankIban ?? "") : "",
      };

      onSaveSettings(cleanedProfile);

      const activeComp =
        getCompaniesList().find((c) => c.id === currentActiveCompanyId) ||
        effectiveCompanies.find((c) => c.id === currentActiveCompanyId);
      if (activeComp) {
        const updatedComp: CompanyItem = {
          ...activeComp,
          companyName: cleanedProfile.companyName,
          name: cleanedProfile.companyName,
          companyTitle: cleanedProfile.companyTitle,
          title: cleanedProfile.companyTitle,
          taxpayerType: cleanedProfile.taxpayerType ?? activeComp.taxpayerType,
          taxOffice: cleanedProfile.taxOffice || activeComp.taxOffice,
          taxNumber: cleanedProfile.taxNumber || activeComp.taxNumber,
          vkn: cleanTax.length === 10 ? cleanTax : activeComp.vkn,
          tckn: cleanTax.length === 11 ? cleanTax : activeComp.tckn,
          tradeRegisterNo: cleanedProfile.tradeRegisterNo,
          esnafSicilNo: cleanedProfile.esnafSicilNo,
          mersisNo: cleanedProfile.mersisNo,
          phone: cleanedProfile.phone,
          email: cleanedProfile.email,
          website: cleanedProfile.website,
          address: cleanedProfile.address,
          city: cleanedProfile.city,
          district: cleanedProfile.district,
          neighborhood: cleanedProfile.neighborhood,
          street: cleanedProfile.street,
          buildingNo: cleanedProfile.buildingNo,
          doorNo: cleanedProfile.doorNo,
          postalCode: cleanedProfile.postalCode,
          addressDetails: cleanedProfile.addressDetails,
          useDefaultBankInfo: bankEnabled,
          defaultBankAccountName: cleanedProfile.defaultBankAccountName,
          defaultBankName: cleanedProfile.defaultBankName,
          defaultBankIban: cleanedProfile.defaultBankIban,
          tenantIdentifierNumber: cleanedProfile.tenantIdentifierNumber || activeComp.tenantIdentifierNumber,
          eFaturaPrefix: cleanedProfile.eFaturaPrefix || activeComp.eFaturaPrefix,
          eFaturaNextNumber: cleanedProfile.eFaturaNextNumber || activeComp.eFaturaNextNumber,
          eArsivPrefix: cleanedProfile.eArsivPrefix || activeComp.eArsivPrefix,
          eArsivNextNumber: cleanedProfile.eArsivNextNumber || activeComp.eArsivNextNumber,
          defaultInvoicePrefix: cleanedProfile.defaultInvoicePrefix || activeComp.defaultInvoicePrefix,
          invoiceDesign: cleanedProfile.invoiceDesign || activeComp.invoiceDesign,
          useCorporateLogo: logoEnabled,
          logoUrl: cleanedProfile.logoUrl || "",
          logoScale: cleanedProfile.logoScale ?? activeComp.logoScale,
          moduleRestrictionEnabled: activeComp.moduleRestrictionEnabled,
          allowedModules: activeComp.allowedModules,
        };
        const updatedList = updateCompanyItem(updatedComp);
        setLocalCompanies(updatedList);
      }

      // Sync Main Branch ("Merkez") with Firma Profili address
      const mainBr = branches.find((b) => b.isMain) || branches[0];
      if (mainBr) {
        const compiledHqAddr =
          cleanedProfile.address ||
          compileStructuredAddress(
            cleanedProfile.neighborhood,
            cleanedProfile.street,
            cleanedProfile.district,
            cleanedProfile.city,
            cleanedProfile.buildingNo,
            cleanedProfile.doorNo,
            cleanedProfile.postalCode
          ) ||
          `${cleanedProfile.district || ""} / ${cleanedProfile.city || "İstanbul"}`;
        onUpdateBranch({
          ...mainBr,
          code: mainBr.code || "MRK-001",
          name: "Merkez",
          isMain: true,
          phone: cleanedProfile.phone || mainBr.phone || "",
          email: cleanedProfile.email || mainBr.email || "",
          address: {
            country: cleanedProfile.country || cleanedProfile.addressDetails?.country || "Türkiye",
            city: cleanedProfile.city || cleanedProfile.addressDetails?.city || "İstanbul",
            district: cleanedProfile.district || cleanedProfile.addressDetails?.district || "Merkez",
            neighborhood: cleanedProfile.neighborhood || cleanedProfile.addressDetails?.neighborhood || "",
            street: cleanedProfile.street || cleanedProfile.addressDetails?.street || "",
            buildingNo: cleanedProfile.buildingNo || cleanedProfile.addressDetails?.buildingNo || "",
            doorNo: cleanedProfile.doorNo || cleanedProfile.addressDetails?.doorNo || "",
            postalCode: cleanedProfile.postalCode || cleanedProfile.addressDetails?.postalCode || "",
            fullAddress: compiledHqAddr,
          },
        });
      }

      if (showSavedFeedback) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3500);
      }
    },
    [branches, currentActiveCompanyId, effectiveCompanies, onSaveSettings, onUpdateBranch]
  );

  const updateAndAutoSaveProfile = React.useCallback(
    (updater: CompanySettings | ((prev: CompanySettings) => CompanySettings), immediate = false) => {
      setProfileForm((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        if (immediate) {
          setTimeout(() => persistProfileSettings(next, true), 0);
        } else {
          autoSaveTimerRef.current = setTimeout(() => {
            persistProfileSettings(next, true);
          }, 400);
        }
        return next;
      });
    },
    [persistProfileSettings]
  );

  const handleFetchProfileTaxpayer = async (rawVkn?: string) => {
    const clean = String(rawVkn ?? profileForm.taxNumber ?? "").replace(/\D/g, "").trim();
    if (clean.length !== 10 && clean.length !== 11) return;
    setIsFetchingTaxpayer(true);
    setVknFetchFeedback(null);
    try {
      const status = await checkRecipientTaxpayerStatus(clean);
      if (status) {
        const parsed = parseSeparateAddressFields({
          taxOffice: status.taxOffice,
          city: status.city,
          district: status.district,
          neighborhood: status.neighborhood,
          street: status.street,
          buildingNo: status.buildingNo,
          doorNo: status.doorNo,
          postalCode: status.postalCode,
          address: status.address,
        });
        updateAndAutoSaveProfile((prev) => {
          const nextCity = parsed.city || prev.city || "İstanbul";
          const nextDistrict = parsed.district || prev.district || "";
          const nextNeighborhood = parsed.neighborhood || prev.neighborhood || "";
          const nextStreet = parsed.street || prev.street || "";
          const nextBuildingNo = parsed.buildingNo || prev.buildingNo || "";
          const nextDoorNo = parsed.doorNo || prev.doorNo || "";
          const nextPostalCode = parsed.postalCode || prev.postalCode || "";
          const nextAddress = parsed.address || prev.address || "";
          const nextTitle = status.companyTitle || status.title || prev.companyTitle;
          return {
            ...prev,
            taxNumber: clean,
            vkn: clean.length === 10 ? clean : prev.vkn,
            tckn: clean.length === 11 ? clean : prev.tckn,
            name: status.companyTitle || status.title || prev.name,
            companyName: status.companyTitle || status.title || prev.companyName,
            companyTitle: nextTitle,
            defaultBankAccountName: prev.defaultBankAccountName || nextTitle,
            taxOffice: parsed.taxOffice || prev.taxOffice,
            city: nextCity,
            district: nextDistrict,
            neighborhood: nextNeighborhood,
            street: nextStreet,
            buildingNo: nextBuildingNo,
            doorNo: nextDoorNo,
            postalCode: nextPostalCode,
            address: nextAddress,
            phone: status.phone || prev.phone,
            email: status.email || prev.email,
            tenantIdentifierNumber: clean,
            addressDetails: {
              ...(prev.addressDetails || { country: prev.country || "Türkiye" }),
              country: prev.country || prev.addressDetails?.country || "Türkiye",
              city: nextCity,
              district: nextDistrict,
              neighborhood: nextNeighborhood,
              street: nextStreet,
              buildingNo: nextBuildingNo,
              doorNo: nextDoorNo,
              postalCode: nextPostalCode,
              fullAddress: nextAddress,
            },
          };
        }, true);
        setVknFetchFeedback(
          `✓ Bilgiler getirildi ve otomatik kaydedildi: Vergi Dairesi (${parsed.taxOffice || "-"}), İl (${parsed.city || "-"}), İlçe (${parsed.district || "-"}), Mahalle (${parsed.neighborhood || "-"}) ve Açık Adres.`
        );
      }
    } catch {
      setVknFetchFeedback("⚠️ Firma bilgileri alınamadı.");
    } finally {
      setIsFetchingTaxpayer(false);
    }
  };

  // Save Profile
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    persistProfileSettings(profileForm, true);
  };

  // Effective Branches: Main branch ("Merkez") always pulls its address from Firma Profili (profileForm)
  const effectiveBranches = React.useMemo<Branch[]>(() => {
    const cleanedList = branches.filter(
      (b) =>
        !(b.id === "br_2" && b.name === "Ankara Bölge Müdürlüğü") &&
        !(b.id === "br_3" && b.name === "İzmir Şubesi")
    );
    const hqCity = profileForm.city || profileForm.addressDetails?.city || settings.city || "İstanbul";
    const hqDistrict = profileForm.district || profileForm.addressDetails?.district || settings.district || "Merkez";
    const hqNeighborhood = profileForm.neighborhood || profileForm.addressDetails?.neighborhood || settings.neighborhood || "";
    const hqStreet = profileForm.street || profileForm.addressDetails?.street || settings.street || "";
    const hqBuildingNo = profileForm.buildingNo || profileForm.addressDetails?.buildingNo || settings.buildingNo || "";
    const hqDoorNo = profileForm.doorNo || profileForm.addressDetails?.doorNo || settings.doorNo || "";
    const hqPostalCode = profileForm.postalCode || profileForm.addressDetails?.postalCode || settings.postalCode || "";
    const hqExplicitFull = String(
      profileForm.address || profileForm.addressDetails?.fullAddress || settings.address || ""
    ).trim();
    const hqCompiledFull =
      hqExplicitFull ||
      compileStructuredAddress(hqNeighborhood, hqStreet, hqDistrict, hqCity, hqBuildingNo, hqDoorNo, hqPostalCode) ||
      `${hqDistrict} / ${hqCity}`;

    const hqAddress: AddressDetails = {
      country: profileForm.country || profileForm.addressDetails?.country || "Türkiye",
      city: hqCity,
      district: hqDistrict,
      neighborhood: hqNeighborhood,
      street: hqStreet,
      buildingNo: hqBuildingNo,
      doorNo: hqDoorNo,
      postalCode: hqPostalCode,
      fullAddress: hqCompiledFull,
    };

    const existingMain = cleanedList.find((b) => b.isMain) || cleanedList[0];
    const mainBranch: Branch = existingMain
      ? {
          ...existingMain,
          code: existingMain.code || "MRK-001",
          name: "Merkez",
          isMain: true,
          phone: profileForm.phone || existingMain.phone || settings.phone || "",
          email: profileForm.email || existingMain.email || settings.email || "",
          address: hqAddress,
        }
      : {
          id: "br_1",
          code: "MRK-001",
          name: "Merkez",
          isMain: true,
          managerName: "Merkez Yönetimi",
          phone: profileForm.phone || settings.phone || "",
          email: profileForm.email || settings.email || "",
          status: "active",
          address: hqAddress,
          createdAt: new Date().toISOString().split("T")[0],
        };

    const subBranches = cleanedList
      .filter((b) => b.id !== mainBranch.id && !b.isMain)
      .map((b) => ({ ...b, isMain: false }));

    return [mainBranch, ...subBranches];
  }, [branches, profileForm, settings]);

  // Open Branch Detail
  const handleOpenBranchModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm(branch);
      companyNav.openEdit(branch, branch.id);
    } else {
      const subBranchCount = effectiveBranches.filter((b) => !b.isMain).length;
      const nextSubNumber = String(subBranchCount + 1).padStart(3, "0");
      setEditingBranch(null);
      setBranchForm({
        code: `SUB-${nextSubNumber}`,
        name: "",
        managerName: "",
        phone: "",
        email: "",
        isMain: false,
        status: "active",
        address: {
          country: "Türkiye",
          city: "",
          district: "",
          neighborhood: "",
          street: "",
          buildingNo: "",
          doorNo: "",
          postalCode: "",
          fullAddress: "",
        },
      });
      companyNav.openCreate();
    }
    setIsBranchModalOpen(true);
  };

  // Submit Branch
  const handleSubmitBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code) return;

    const rawAddr = (branchForm.address as AddressDetails) || {
      country: "Türkiye",
      city: "",
      district: "",
    };
    const explicitFull = String(rawAddr.fullAddress || "").trim();
    const compiledFull = compileStructuredAddress(
      rawAddr.neighborhood,
      rawAddr.street,
      rawAddr.district,
      rawAddr.city,
      rawAddr.buildingNo,
      rawAddr.doorNo,
      rawAddr.postalCode
    );
    const finalFullAddr = explicitFull
      ? appendCityDistrictToAddress(explicitFull, rawAddr.city, rawAddr.district) || explicitFull
      : compiledFull || "";
    const normalizedAddr: AddressDetails = {
      ...rawAddr,
      fullAddress: finalFullAddr,
    };

    if (editingBranch) {
      const isEditingMain = editingBranch.isMain;
      const updatedBranch: Branch = {
        ...editingBranch,
        ...branchForm,
        name: isEditingMain ? "Merkez" : branchForm.name!,
        isMain: isEditingMain,
        address: normalizedAddr,
      } as Branch;
      onUpdateBranch(updatedBranch);

      // If Merkez (Ana Şube) address was edited, sync it back to Firma Profili address
      if (isEditingMain) {
        updateAndAutoSaveProfile(
          (prev) => ({
            ...prev,
            phone: updatedBranch.phone || prev.phone,
            email: updatedBranch.email || prev.email,
            city: normalizedAddr.city || prev.city,
            district: normalizedAddr.district || prev.district,
            neighborhood: normalizedAddr.neighborhood ?? prev.neighborhood,
            street: normalizedAddr.street ?? prev.street,
            buildingNo: normalizedAddr.buildingNo ?? prev.buildingNo,
            doorNo: normalizedAddr.doorNo ?? prev.doorNo,
            postalCode: normalizedAddr.postalCode ?? prev.postalCode,
            address: normalizedAddr.fullAddress || prev.address,
            addressDetails: {
              ...(prev.addressDetails || { country: "Türkiye" }),
              country: normalizedAddr.country || "Türkiye",
              city: normalizedAddr.city || prev.city || "İstanbul",
              district: normalizedAddr.district || prev.district || "",
              neighborhood: normalizedAddr.neighborhood || "",
              street: normalizedAddr.street || "",
              buildingNo: normalizedAddr.buildingNo || "",
              doorNo: normalizedAddr.doorNo || "",
              postalCode: normalizedAddr.postalCode || "",
              fullAddress: normalizedAddr.fullAddress || prev.address || "",
            },
          }),
          true
        );
      }
    } else {
      const newBranch: Branch = {
        id: `br_${Date.now()}`,
        code: branchForm.code!,
        name: branchForm.name!,
        managerName: branchForm.managerName || "",
        phone: branchForm.phone || "",
        email: branchForm.email || "",
        isMain: false,
        status: (branchForm.status as "active" | "passive") || "active",
        address: normalizedAddr,
        createdAt: new Date().toISOString().split("T")[0],
      };
      onAddBranch(newBranch);
    }
    handleCloseBranch();
  };

  // Open Warehouse Detail
  const handleOpenWarehouseModal = (wh?: Warehouse) => {
    if (wh) {
      setEditingWarehouse(wh);
      setWarehouseForm(wh);
      companyNav.openEdit(wh, wh.id);
    } else {
      setEditingWarehouse(null);
      setWarehouseForm({
        code: `DEP-00${warehouses.length + 1}`,
        name: "",
        type: "main",
        capacityM2: 1000,
        managerName: "",
        phone: "",
        branchId: effectiveBranches[0]?.id || "",
        branchName: effectiveBranches[0]?.name || "Merkez",
        status: "active",
        address: {
          country: "Türkiye",
          city: "İstanbul",
          district: "Şişli",
          neighborhood: "Mecidiyeköy",
          street: "",
          buildingNo: "",
          doorNo: "",
          postalCode: "",
          fullAddress: "",
        },
      });
      companyNav.openCreate();
    }
    setIsWarehouseModalOpen(true);
  };

  // Submit Warehouse
  const handleSubmitWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.name || !warehouseForm.code) return;

    const selectedBranch = effectiveBranches.find((b) => b.id === warehouseForm.branchId);
    const rawAddr = (warehouseForm.address as AddressDetails) || {
      country: "Türkiye",
      city: "İstanbul",
      district: "Şişli",
    };
    const finalFullAddr =
      compileStructuredAddress(
        rawAddr.neighborhood,
        rawAddr.street,
        rawAddr.district,
        rawAddr.city,
        rawAddr.buildingNo,
        rawAddr.doorNo,
        rawAddr.postalCode
      ) || rawAddr.fullAddress || "";
    const normalizedAddr: AddressDetails = {
      ...rawAddr,
      fullAddress: finalFullAddr,
    };

    if (editingWarehouse) {
      onUpdateWarehouse({
        ...editingWarehouse,
        ...warehouseForm,
        branchName: selectedBranch?.name || warehouseForm.branchName,
        address: normalizedAddr,
      } as Warehouse);
    } else {
      const newWh: Warehouse = {
        id: `wh_${Date.now()}`,
        code: warehouseForm.code!,
        name: warehouseForm.name!,
        type: warehouseForm.type || "main",
        capacityM2: warehouseForm.capacityM2 || 500,
        managerName: warehouseForm.managerName || "",
        phone: warehouseForm.phone || "",
        branchId: warehouseForm.branchId || effectiveBranches[0]?.id || "",
        branchName: selectedBranch?.name || "Merkez",
        status: (warehouseForm.status as "active" | "passive") || "active",
        address: normalizedAddr,
        createdAt: new Date().toISOString().split("T")[0],
      };
      onAddWarehouse(newWh);
    }
    handleCloseWarehouse();
  };

  // Filtered Lists
  const filteredBranches = effectiveBranches.filter((b) => {
    if (branchStatusFilter !== "all" && b.status !== branchStatusFilter) return false;
    const q = branchSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      (b.address.city || "").toLowerCase().includes(q) ||
      (b.address.district || "").toLowerCase().includes(q)
    );
  });

  const filteredWarehouses = warehouses.filter((w) => {
    if (warehouseStatusFilter !== "all" && w.status !== warehouseStatusFilter) return false;
    const q = warehouseSearch.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.code.toLowerCase().includes(q) ||
      (w.address.city || "").toLowerCase().includes(q) ||
      (w.address.district || "").toLowerCase().includes(q)
    );
  });

  const isCompanySubAllowed = (subKey: string) =>
    isModuleOrSubModuleAllowed(subKey, "company", currentUser, activeCompanyRecord);
  const isSettingsGroupActive = ["settings", "companies", "mysoft", "logs"].includes(currentSubTab);
  const isActiveCompanyMysoftReady = isCompanyMysoftMatched(
    activeCompanyRecord,
    profileForm || settings
  );
  const canViewLogsTab =
    isActiveCompanyMysoftReady && isCompanySubAllowed("company_logs");

  const cleanTaxNo = String(profileForm.taxNumber || settings.taxNumber || "").replace(/\D/g, "");
  const headerStats = [
    {
      label: "Mükellefiyet",
      value: profileForm.taxpayerType || "Kurumsal",
      tone: "neutral" as const,
    },
    {
      label: cleanTaxNo.length === 11 ? "TCKN" : "VKN",
      value: cleanTaxNo || "Tanımsız",
      tone: cleanTaxNo ? ("info" as const) : ("warning" as const),
    },
    ...(isCompanySubAllowed("company_branches")
      ? [
          {
            label: "Şubeler",
            value: `${effectiveBranches.filter((b) => b.status === "active").length} / ${effectiveBranches.length}`,
            tone: "neutral" as const,
          },
        ]
      : []),
    ...(isCompanySubAllowed("company_warehouses")
      ? [
          {
            label: "Depolar",
            value: `${warehouses.filter((w) => w.status === "active").length} / ${warehouses.length}`,
            tone: "neutral" as const,
          },
        ]
      : []),
    ...(isActiveCompanyMysoftReady
      ? [
          {
            label: "e-Belge",
            value: "Mysoft Bağlı",
            tone: "success" as const,
          },
        ]
      : []),
  ];

  const renderHeaderAction = () => {
    if (currentSubTab === "profile" && isCompanySubAllowed("company_profile")) {
      return (
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Kaydedildi</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSaveProfile()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>Firma Bilgilerini Kaydet</span>
          </button>
        </div>
      );
    }
    if (currentSubTab === "branches" && isCompanySubAllowed("company_branches")) {
      return (
        <button
          type="button"
          onClick={() => handleOpenBranchModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Yeni Şube Ekle</span>
        </button>
      );
    }
    if (currentSubTab === "warehouses" && isCompanySubAllowed("company_warehouses")) {
      return (
        <button
          type="button"
          onClick={() => handleOpenWarehouseModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Yeni Depo Ekle</span>
        </button>
      );
    }
    if (currentSubTab === "companies" && isAdmin) {
      return (
        <button
          type="button"
          onClick={handleOpenAddCompany}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Yeni Şirket Ekle</span>
        </button>
      );
    }
    return null;
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      <ModuleEntranceHeader
        id="company-management-header"
        badge="Kurumsal Yapı & Sicil Yönetimi"
        badgeIcon={<Building2 className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400" />}
        title={profileForm.companyName || settings.companyName || "Firma Bilgileri"}
        subtitle={
          profileForm.companyTitle && profileForm.companyTitle !== profileForm.companyName
            ? `${profileForm.companyTitle} — Resmi vergi sicili, merkez adresi, şube ve depo organizasyonu.`
            : "Şirketinizin resmi kimlik bilgilerini, merkez adresini, şubelerini, depolarını ve sistem yapılandırmasını yönetin."
        }
        stats={headerStats}
        actions={renderHeaderAction()}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {isCompanySubAllowed("company_profile") && (
            <button
              type="button"
              onClick={() => handleTabChange("profile")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === "profile"
                  ? "text-white shadow-2xs"
                  : "bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              }`}
              style={currentSubTab === "profile" ? { backgroundColor: theme.primaryColor } : {}}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span>Firma Profili & Adres</span>
            </button>
          )}

          {isCompanySubAllowed("company_branches") && (
            <button
              type="button"
              onClick={() => handleTabChange("branches")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === "branches"
                  ? "text-white shadow-2xs"
                  : "bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              }`}
              style={currentSubTab === "branches" ? { backgroundColor: theme.primaryColor } : {}}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>Şubeler</span>
              <span
                className={`font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md ${
                  currentSubTab === "branches"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {effectiveBranches.length}
              </span>
            </button>
          )}

          {isCompanySubAllowed("company_warehouses") && (
            <button
              type="button"
              onClick={() => handleTabChange("warehouses")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentSubTab === "warehouses"
                  ? "text-white shadow-2xs"
                  : "bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              }`}
              style={currentSubTab === "warehouses" ? { backgroundColor: theme.primaryColor } : {}}
            >
              <WarehouseIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Depolar</span>
              <span
                className={`font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md ${
                  currentSubTab === "warehouses"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {warehouses.length}
              </span>
            </button>
          )}

          {isAdmin && isCompanySubAllowed("company_settings") && (
            <button
              type="button"
              onClick={() => handleTabChange("settings")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isSettingsGroupActive
                  ? "text-white shadow-2xs"
                  : "bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              }`}
              style={isSettingsGroupActive ? { backgroundColor: theme.primaryColor } : {}}
            >
              <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Sistem Ayarları</span>
            </button>
          )}
        </div>
      </ModuleEntranceHeader>

      {isAdmin && isSettingsGroupActive && (
        <div
          className="bg-white dark:bg-slate-900 p-3 rounded-2xl border shadow-2xs flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center gap-2 overflow-x-auto">
            {isAdmin && isCompanySubAllowed("company_settings") && (
              <button
                type="button"
                onClick={() => handleTabChange("settings")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  currentSubTab === "settings"
                    ? "text-white shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                }`}
                style={currentSubTab === "settings" ? { backgroundColor: theme.primaryColor } : {}}
              >
                <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Genel & Sistem Ayarları</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleTabChange("companies")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  currentSubTab === "companies"
                    ? "text-white shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                }`}
                style={currentSubTab === "companies" ? { backgroundColor: theme.primaryColor } : {}}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Şirketler & Çoklu Şirket</span>
                <span
                  className={`font-mono tabular-nums text-[11px] px-1.5 py-0.5 rounded-md ${
                    currentSubTab === "companies"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {effectiveCompanies.length}
                </span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleTabChange("mysoft")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  currentSubTab === "mysoft"
                    ? "text-white shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                }`}
                style={currentSubTab === "mysoft" ? { backgroundColor: theme.primaryColor } : {}}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>Mysoft VKN / TCKN Eşleştirme</span>
              </button>
            )}

            {canViewLogsTab && (
              <button
                type="button"
                onClick={() => handleTabChange("logs")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  currentSubTab === "logs"
                    ? "text-white shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                }`}
                style={currentSubTab === "logs" ? { backgroundColor: theme.primaryColor } : {}}
              >
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                <span>API Log İzleme</span>
              </button>
            )}
          </div>

          {isAdmin && currentSubTab !== "companies" && (
            <button
              type="button"
              onClick={handleOpenAddCompany}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0" />
              <span>Yeni Şirket Ekle</span>
            </button>
          )}
        </div>
      )}

      {/* SUB-TAB 1: FIRMA PROFILI & RESMI BILGILER */}
      {currentSubTab === "profile" && (
        <form onSubmit={handleSaveProfile} noValidate className="space-y-6">
          {/* ÜST BÖLÜM (ZORUNLU KİMLİK & ADRES): RESMİ KİMLİK + İLETİŞİM (7 KOLON) | MERKEZ ADRES YAPILANDIRMASI (5 KOLON) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            {/* SOL: RESMİ ŞİRKET KİMLİK, VERGİ SİCİL & KURUMSAL İLETİŞİM BİLGİLERİ */}
            <section
              className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-5"
              style={{ borderColor: theme.cardBorder }}
            >
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div>
                    <h2 className="text-base font-editorial font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                      <span>Resmi Şirket Kimlik & Vergi Sicil Bilgileri</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      e-Fatura, e-Arşiv ve resmi beyannamelerde yer alacak ticari ünvan, sicil ve iletişim kayıtları.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {isSaved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Otomatik kaydedildi</span>
                      </span>
                    ) : (
                      "Alanlardan çıkıldığında otomatik kaydedilir"
                    )}
                  </span>
                </div>

                {/* Ünvan ve Mükellefiyet Satırı */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Kısa Şirket Adı *
                    </label>
                    <input
                      type="text"
                      value={profileForm.companyName || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndAutoSaveProfile((prev) => ({ ...prev, companyName: val }));
                      }}
                      onBlur={() => handleSaveProfile()}
                      placeholder="Örn: Muavin Bilişim"
                      className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Mükellefiyet Türü *
                    </label>
                    <select
                      value={profileForm.taxpayerType || "Anonim Şirket"}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndAutoSaveProfile((prev) => ({ ...prev, taxpayerType: val }), true);
                      }}
                      className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-semibold cursor-pointer focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                    >
                      {TAXPAYER_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Tam Resmi Ticari Ünvan *
                    </label>
                    <input
                      type="text"
                      value={profileForm.companyTitle || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndAutoSaveProfile((prev) => ({ ...prev, companyTitle: val }));
                      }}
                      onBlur={() => handleSaveProfile()}
                      placeholder="Örn: Muavin Bilişim Teknolojileri A.Ş."
                      className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                    />
                  </div>
                </div>

                {/* VKN / TCKN ve Vergi Dairesi Satırı */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-7">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      VKN (10 Hane) / TCKN (11 Hane)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={11}
                        value={profileForm.taxNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateAndAutoSaveProfile((prev) => ({ ...prev, taxNumber: val }));
                          const clean = val.replace(/\D/g, "").trim();
                          if (clean.length === 10 || clean.length === 11) {
                            void handleFetchProfileTaxpayer(clean);
                          }
                        }}
                        onBlur={() => handleSaveProfile()}
                        placeholder="10 haneli VKN veya 11 haneli TCKN..."
                        className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-mono tabular-nums font-semibold focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => void handleFetchProfileTaxpayer()}
                        disabled={
                          isFetchingTaxpayer ||
                          !profileForm.taxNumber ||
                          (profileForm.taxNumber.replace(/\D/g, "").length !== 10 &&
                            profileForm.taxNumber.replace(/\D/g, "").length !== 11)
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-2xs cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-45 disabled:cursor-not-allowed hover:opacity-95"
                        style={{ backgroundColor: theme.primaryColor }}
                        title="VKN/TCKN ile GİB Mükellef ve Adres Bilgilerini Getir"
                      >
                        {isFetchingTaxpayer ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>GİB&apos;den Getir</span>
                      </button>
                    </div>
                    {vknFetchFeedback && (
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1.5">
                        {vknFetchFeedback}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Vergi Dairesi
                    </label>
                    <input
                      type="text"
                      value={profileForm.taxOffice || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndAutoSaveProfile((prev) => ({ ...prev, taxOffice: val }));
                      }}
                      onBlur={() => handleSaveProfile()}
                      placeholder="Örn: Büyük Mükellefler V.D."
                      className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                    />
                  </div>
                </div>

                {/* Sicil & MERSİS Numaraları */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Ticaret Sicil Numarası
                    </label>
                    <input
                      type="text"
                      placeholder="Ticaret Sicil No"
                      value={profileForm.tradeRegisterNo || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndAutoSaveProfile((prev) => ({ ...prev, tradeRegisterNo: val }));
                      }}
                      onBlur={() => handleSaveProfile()}
                      className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-mono tabular-nums font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Esnaf Sicil Numarası
                    </label>
                    <input
                      type="text"
                      placeholder="Esnaf Sicil No"
                      value={profileForm.esnafSicilNo || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndAutoSaveProfile((prev) => ({ ...prev, esnafSicilNo: val }));
                      }}
                      onBlur={() => handleSaveProfile()}
                      className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-mono tabular-nums font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      MERSİS Numarası
                    </label>
                    <input
                      type="text"
                      placeholder="0000000000000000"
                      value={profileForm.mersisNo || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAndAutoSaveProfile((prev) => ({ ...prev, mersisNo: val }));
                      }}
                      onBlur={() => handleSaveProfile()}
                      className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-mono tabular-nums font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500 focus:ring-2 focus:ring-[#0f6bae]/15 transition-colors"
                    />
                  </div>
                </div>

                {/* Kurumsal İletişim Bilgileri */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                      <span>Kurumsal İletişim Kanalları</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Doldurulan alanlar resmi belgelere otomatik eklenir
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Telefon Numarası
                        </label>
                        {(profileForm.phone || "").trim() && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="0 (212) 000 00 00"
                          value={profileForm.phone || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateAndAutoSaveProfile((prev) => ({ ...prev, phone: val }));
                          }}
                          onBlur={() => handleSaveProfile()}
                          className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 pr-7 font-mono tabular-nums font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500"
                        />
                        {(profileForm.phone || "").trim() && (
                          <button
                            type="button"
                            onClick={() => updateAndAutoSaveProfile((prev) => ({ ...prev, phone: "" }), true)}
                            title="Temizle"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          E-Posta Adresi
                        </label>
                        {(profileForm.email || "").trim() && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="muhasebe@firma.com.tr"
                          value={profileForm.email || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateAndAutoSaveProfile((prev) => ({ ...prev, email: val }));
                          }}
                          onBlur={() => handleSaveProfile()}
                          className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 pr-7 font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500"
                        />
                        {(profileForm.email || "").trim() && (
                          <button
                            type="button"
                            onClick={() => updateAndAutoSaveProfile((prev) => ({ ...prev, email: "" }), true)}
                            title="Temizle"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Web Sitesi
                        </label>
                        {(profileForm.website || "").trim() && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="www.firma.com.tr"
                          value={profileForm.website || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateAndAutoSaveProfile((prev) => ({ ...prev, website: val }));
                          }}
                          onBlur={() => handleSaveProfile()}
                          className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 pr-7 font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500"
                        />
                        {(profileForm.website || "").trim() && (
                          <button
                            type="button"
                            onClick={() => updateAndAutoSaveProfile((prev) => ({ ...prev, website: "" }), true)}
                            title="Temizle"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isAdmin && !isActiveCompanyMysoftReady && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                        <span>Mysoft e-Belge Mükellef Eşleştirmesi</span>
                      </span>
                      {profileForm.tenantIdentifierNumber && (
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-[#0f6bae] dark:text-sky-400">
                          Seçili Mükellef: {profileForm.tenantIdentifierNumber}
                        </span>
                      )}
                    </div>
                    <MysoftTenantPicker
                      variant="compact"
                      hideWhenMatched={true}
                      currentUser={currentUser}
                      hintVkn={profileForm.tenantIdentifierNumber}
                      onSelect={(vkn) =>
                        updateAndAutoSaveProfile(
                          (prev) => ({
                            ...prev,
                            tenantIdentifierNumber: vkn,
                            mysoftCredentials: {
                              ...prev.mysoftCredentials,
                              tenantIdentifierNumber: vkn,
                            },
                          }),
                          true
                        )
                      }
                    />
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                Ticaret Sicil No, Esnaf Sicil No ve MERSİS alanları doldurulduğunda giden e-Fatura ve e-Arşiv belgelerinde otomatik olarak yer alır.
              </p>
            </section>

            {/* SAĞ: MERKEZ AÇIK ADRES YAPILANDIRMASI */}
            <section
              className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border p-5 sm:p-6 shadow-2xs space-y-4"
              style={{ borderColor: theme.cardBorder }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div>
                  <h2 className="text-base font-editorial font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                    <span>Merkez Açık Adres Yapılandırması</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Buradaki adres değişiklikleri Merkez (Ana Şube) kaydı ile çift yönlü senkronize çalışır.
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[#0f6bae] dark:text-sky-400 whitespace-nowrap">
                  Merkez Şube Senkronize
                </span>
              </div>

              <AddressSelector
                frameless={true}
                title="Merkez Genel Adres Detayları"
                address={{
                  country: profileForm.country || profileForm.addressDetails?.country || "Türkiye",
                  city: profileForm.city || profileForm.addressDetails?.city || "İstanbul",
                  district: profileForm.district ?? profileForm.addressDetails?.district ?? "",
                  neighborhood: profileForm.neighborhood ?? profileForm.addressDetails?.neighborhood ?? "",
                  street: profileForm.street ?? profileForm.addressDetails?.street ?? "",
                  buildingNo: profileForm.buildingNo ?? profileForm.addressDetails?.buildingNo ?? "",
                  doorNo: profileForm.doorNo ?? profileForm.addressDetails?.doorNo ?? "",
                  postalCode: profileForm.postalCode ?? profileForm.addressDetails?.postalCode ?? "",
                  fullAddress: profileForm.address ?? profileForm.addressDetails?.fullAddress ?? "",
                }}
                onChange={(updatedDetails) => {
                  updateAndAutoSaveProfile((prev) => ({
                    ...prev,
                    city: updatedDetails.city,
                    district: updatedDetails.district,
                    neighborhood: updatedDetails.neighborhood,
                    street: updatedDetails.street,
                    buildingNo: updatedDetails.buildingNo,
                    doorNo: updatedDetails.doorNo,
                    postalCode: updatedDetails.postalCode,
                    country: updatedDetails.country,
                    address: updatedDetails.fullAddress || prev.address,
                    addressDetails: updatedDetails,
                  }));
                }}
              />
            </section>
          </div>

          {/* ALT BÖLÜM (OPSİYONEL SEÇİLEBİLİR KUTUCUKLAR): KURUMSAL LOGO & CLOUD CONSOLE (6 KOLON) | VARSAYILAN BANKA BİLGİLERİ (6 KOLON) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* SOL SEÇİLEBİLİR KUTUCUK: KURUMSAL LOGO & GOOGLE CLOUD CONSOLE ENTEGRASYONU */}
            {(() => {
              const logoBoxChecked = isCompanyLogoEnabled(profileForm);
              return (
                <section
                  className={`xl:col-span-6 rounded-2xl border p-5 sm:p-6 shadow-2xs transition-colors text-xs ${
                    logoBoxChecked
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/70 dark:bg-slate-900/60"
                  }`}
                  style={{
                    borderColor: logoBoxChecked ? theme.primaryColor : theme.cardBorder,
                  }}
                >
                  <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={logoBoxChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateAndAutoSaveProfile(
                            (prev) => ({
                              ...prev,
                              useCorporateLogo: checked,
                              logoUrl: checked
                                ? prev.logoUrl && prev.logoUrl !== "/logo.svg"
                                  ? prev.logoUrl
                                  : ""
                                : "",
                            }),
                            true
                          );
                        }}
                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-[#0f6bae] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-base font-editorial font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                          <span>Kurumsal Logo & Google Cloud Console Entegrasyonu</span>
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Menüde ve resmi e-Fatura / e-Arşiv belgelerinde şirketinize özel logo kullanılacaksa işaretleyin; kullanılmayacaksa boş geçin.
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold whitespace-nowrap shrink-0 mt-0.5 ${
                        logoBoxChecked
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {logoBoxChecked ? "Seçili • Cloud Aktif" : "Boş Geçildi"}
                    </span>
                  </label>

                  {!logoBoxChecked ? (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                      <span>
                        Kurumsal logo kullanılmıyor. Düzenlenen faturalara şirket logosu basılmaz; etkinleştirmek için kutucuğu işaretleyin.
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      {cloudSyncStatus && (
                        <div className="px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{cloudSyncStatus}</span>
                        </div>
                      )}

                      {/* Canlı Önizleme Çifti */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center gap-2 min-h-[96px] overflow-hidden">
                          {profileForm.logoUrl && profileForm.logoUrl !== "/logo.svg" ? (
                            <Logo
                              size="lg"
                              src={profileForm.logoUrl}
                              scale={profileForm.logoScale ?? 1}
                            />
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              Henüz özel şirket logosu seçilmedi
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-slate-400">Koyu Zemin (Menü)</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-2 min-h-[96px] overflow-hidden">
                          {profileForm.logoUrl && profileForm.logoUrl !== "/logo.svg" ? (
                            <Logo
                              size="lg"
                              src={profileForm.logoUrl}
                              scale={profileForm.logoScale ?? 1}
                            />
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Fatura için logo yükleyin
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            Açık Zemin (Fatura Belgesi)
                          </span>
                        </div>
                      </div>

                      {/* Ölçek Kontrolü */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            Logo Görünüm Ölçeği
                          </span>
                          <span className="font-mono tabular-nums text-[11px] font-bold text-[#0f6bae] dark:text-sky-400">
                            %{Math.round(clampLogoScale(profileForm.logoScale ?? 1) * 100)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustLogoScale(clampLogoScale(profileForm.logoScale ?? 1) - 0.1)}
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            - Küçült
                          </button>
                          <input
                            type="range"
                            min={0.5}
                            max={1.5}
                            step={0.05}
                            value={clampLogoScale(profileForm.logoScale ?? 1)}
                            onChange={(e) => handleAdjustLogoScale(Number(e.target.value))}
                            className="flex-1 accent-[#0f6bae] cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdjustLogoScale(1)}
                            className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#0f6bae] dark:text-sky-400 border border-slate-200 dark:border-slate-700 rounded-lg font-mono tabular-nums text-[10px] font-bold cursor-pointer whitespace-nowrap"
                          >
                            %100
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustLogoScale(clampLogoScale(profileForm.logoScale ?? 1) + 0.1)}
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            + Büyült
                          </button>
                        </div>
                      </div>

                      {/* Dosya Yükleme & URL */}
                      <div className="space-y-2.5 pt-1">
                        <input
                          ref={companyLogoFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/*"
                          onChange={handleUploadLogoFromComputer}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => companyLogoFileInputRef.current?.click()}
                          disabled={cloudLogoLoading}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-semibold text-xs shadow-2xs cursor-pointer transition-all disabled:opacity-50 hover:opacity-95 whitespace-nowrap"
                          style={{ backgroundColor: theme.primaryColor }}
                        >
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                          <span>Bilgisayardan Logo Seç & Yükle</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={
                              profileForm.logoUrl?.startsWith("data:")
                                ? "Bilgisayardan Yüklenen Özel Logo"
                                : profileForm.logoUrl || ""
                            }
                            onChange={(e) => {
                              if (!e.target.value.startsWith("Bilgisayardan Yüklenen")) {
                                const val = e.target.value;
                                updateAndAutoSaveProfile((prev) => ({
                                  ...prev,
                                  useCorporateLogo: true,
                                  logoUrl: val,
                                }));
                              }
                            }}
                            onBlur={() => handleSaveProfile()}
                            placeholder="Logo URL adresi (https://...) veya bilgisayardan yükleyin"
                            className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500"
                          />
                          {profileForm.logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                updateAndAutoSaveProfile(
                                  (prev) => ({
                                    ...prev,
                                    useCorporateLogo: true,
                                    logoUrl: "",
                                  }),
                                  true
                                );
                              }}
                              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 rounded-xl text-[11px] font-semibold cursor-pointer border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                            >
                              Temizle
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cloud Console Senkron Butonları */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleFetchFromCloudConsole}
                            disabled={cloudLogoLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-[11px] cursor-pointer transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            <RefreshCw className={`w-3 h-3 ${cloudLogoLoading ? "animate-spin" : ""}`} />
                            <span>Cloud&apos;dan Çek</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveToCloudConsole}
                            disabled={cloudLogoLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-lg font-semibold text-[11px] cursor-pointer transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            <Cloud className="w-3 h-3 text-sky-300" />
                            <span>Cloud&apos;a Kaydet</span>
                          </button>
                        </div>
                        {cloudBranding?.updatedAt && (
                          <span className="font-mono tabular-nums text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(cloudBranding.updatedAt).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* SAĞ SEÇİLEBİLİR KUTUCUK: FATURAYA BASILACAK VARSAYILAN BANKA BİLGİLERİ */}
            {(() => {
              const bankBoxChecked = isCompanyDefaultBankEnabled(profileForm);
              return (
                <section
                  className={`xl:col-span-6 rounded-2xl border p-5 sm:p-6 shadow-2xs transition-colors text-xs ${
                    bankBoxChecked
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/70 dark:bg-slate-900/60"
                  }`}
                  style={{
                    borderColor: bankBoxChecked ? theme.primaryColor : theme.cardBorder,
                  }}
                >
                  <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={bankBoxChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateAndAutoSaveProfile(
                            (prev) => ({
                              ...prev,
                              useDefaultBankInfo: checked,
                              defaultBankName: checked ? prev.defaultBankName || "" : "",
                              defaultBankAccountName: checked
                                ? prev.defaultBankAccountName || prev.companyTitle || prev.companyName || ""
                                : "",
                              defaultBankIban: checked ? prev.defaultBankIban || "" : "",
                            }),
                            true
                          );
                        }}
                        className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-[#0f6bae] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-base font-editorial font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                          <span>Faturaya Basılacak Varsayılan Banka Bilgileri</span>
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Düzenlenen e-Fatura ve e-Arşiv belgelerinin alt bilgisine varsayılan banka ve IBAN basılacaksa işaretleyin; kullanılmayacaksa boş geçin.
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold whitespace-nowrap shrink-0 mt-0.5 ${
                        bankBoxChecked
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {bankBoxChecked ? "Seçili • Aktif" : "Boş Geçildi"}
                    </span>
                  </label>

                  {!bankBoxChecked ? (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                      <span>
                        Varsayılan banka bilgisi kullanılmıyor. Faturalara otomatik banka/IBAN basılmaz; etkinleştirmek için kutucuğu işaretleyin.
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Varsayılan Banka & IBAN Detayları
                        </span>
                        {(profileForm.defaultBankName ||
                          profileForm.defaultBankIban ||
                          profileForm.defaultBankAccountName) && (
                          <button
                            type="button"
                            onClick={() => {
                              updateAndAutoSaveProfile(
                                (prev) => ({
                                  ...prev,
                                  useDefaultBankInfo: true,
                                  defaultBankName: "",
                                  defaultBankAccountName: "",
                                  defaultBankIban: "",
                                }),
                                true
                              );
                            }}
                            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer whitespace-nowrap"
                          >
                            Alanları Temizle
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Banka Adı ve Şubesi
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: İş Bankası - Merkez Şubesi"
                            value={profileForm.defaultBankName || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateAndAutoSaveProfile((prev) => ({
                                ...prev,
                                useDefaultBankInfo: true,
                                defaultBankName: val,
                              }));
                            }}
                            onBlur={() => handleSaveProfile()}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                            Hesap Sahibi (Alıcı Ünvanı)
                          </label>
                          <input
                            type="text"
                            placeholder={profileForm.companyTitle || profileForm.companyName || "Alıcı ünvanı"}
                            value={profileForm.defaultBankAccountName ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateAndAutoSaveProfile((prev) => ({
                                ...prev,
                                useDefaultBankInfo: true,
                                defaultBankAccountName: val,
                              }));
                            }}
                            onBlur={() => handleSaveProfile()}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                          IBAN Numarası
                        </label>
                        <input
                          type="text"
                          placeholder="TR00 0000 0000 0000 0000 0000 00"
                          value={profileForm.defaultBankIban || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateAndAutoSaveProfile((prev) => ({
                              ...prev,
                              useDefaultBankInfo: true,
                              defaultBankIban: val,
                            }));
                          }}
                          onBlur={() => handleSaveProfile()}
                          className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 font-mono tabular-nums font-semibold tracking-wide focus:outline-none focus:border-[#0f6bae] dark:focus:border-sky-500"
                        />
                      </div>

                      {/* Fatura Alt Bilgi Canlı Özet Satırı */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">
                          <strong className="text-slate-700 dark:text-slate-200">
                            {profileForm.defaultBankName || "Banka adı girilmedi"}
                          </strong>
                          {" • "}
                          <span>
                            {profileForm.defaultBankAccountName ||
                              profileForm.companyTitle ||
                              profileForm.companyName ||
                              "Hesap sahibi yok"}
                          </span>
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                          {profileForm.defaultBankIban || "IBAN girilmedi"}
                        </span>
                      </div>
                    </div>
                  )}
                </section>
              );
            })()}
          </div>

          {/* ALT KAYIT ÇUBUĞU */}
          <div
            className="bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border shadow-2xs flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: theme.cardBorder }}
          >
            {isSaved ? (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Firma kimlik, adres ve seçili opsiyonel bilgileriniz kaydedildi.</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tüm değişiklikler otomatik olarak saklanır; dilerseniz manuel olarak da kaydedebilirsiniz.
              </span>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-2xs cursor-pointer transition-all hover:opacity-95 whitespace-nowrap shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>Firma Bilgilerini Kaydet</span>
            </button>
          </div>
        </form>
      )}

      {/* GİB DİJİTAL VERGİ DAİRESİ MODAL */}
      <GibPortalModal
        isOpen={isGibModalOpen}
        onClose={() => setIsGibModalOpen(false)}
        companySettings={profileForm}
      />

      {/* SUB-TAB 2: ŞUBELER (BRANCHES) */}
      {currentSubTab === "branches" && (
        <div className="space-y-5">
          {/* Şube Özet Metrikleri */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs flex items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Toplam Şube
                </div>
                <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {effectiveBranches.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#0f6bae] dark:text-sky-400">
                <Store className="w-5 h-5" />
              </div>
            </div>

            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs flex items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Aktif Şube
                </div>
                <div className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {effectiveBranches.filter((b) => b.status === "active").length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs flex items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Merkez Lokasyon
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1.5 truncate">
                  {effectiveBranches.find((b) => b.isMain)?.address.district || profileForm.district || "Merkez"}
                  {" / "}
                  {effectiveBranches.find((b) => b.isMain)?.address.city || profileForm.city || "İstanbul"}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#0f6bae] dark:text-sky-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Arama & Filtre Çubuğu */}
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-2xs"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Şube adı, kodu, il veya ilçe ara..."
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0f6bae] dark:focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
                {(["all", "active", "passive"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setBranchStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      branchStatusFilter === st
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {st === "all" ? "Tümü" : st === "active" ? "Aktif" : "Pasif"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ExportButtons
                getExportData={() => ({
                  filename: `Sube_Listesi_${new Date().toISOString().split("T")[0]}`,
                  title: "FİRMA YÖNETİMİ - ŞUBE LİSTESİ",
                  subtitle: `Toplam ${filteredBranches.length} Şube Kaydı`,
                  headers: ["Şube Kodu", "Şube Adı", "Ana Şube mi?", "Sorumlu Yetkili", "Telefon", "E-Posta", "İl / İlçe", "Açık Adres", "Durum"],
                  rows: filteredBranches.map((b) => [
                    b.code,
                    b.name,
                    b.isMain ? "Evet (Ana Şube)" : "Hayır",
                    b.managerName || "-",
                    b.phone || "-",
                    b.email || "-",
                    `${b.address.district || ""} / ${b.address.city || ""}`,
                    b.address.fullAddress || "-",
                    b.status === "active" ? "Aktif" : "Pasif",
                  ]),
                })}
                size="sm"
              />
              <button
                type="button"
                onClick={() => handleOpenBranchModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Yeni Şube Ekle</span>
              </button>
            </div>
          </div>

          {/* Şube Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
                style={{ borderColor: theme.cardBorder }}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 text-[#0f6bae] dark:text-sky-400 border border-slate-200/80 dark:border-slate-700 rounded-xl font-mono tabular-nums text-xs font-bold shrink-0">
                        {branch.code}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {branch.name}
                          </h4>
                          {branch.isMain && (
                            <span className="text-[10px] font-semibold text-[#0f6bae] dark:text-sky-400 whitespace-nowrap">
                              • Merkez
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {branch.address.district || "Merkez"} / {branch.address.city || "İstanbul"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenBranchModal(branch)}
                        className="p-1.5 text-slate-400 hover:text-[#0f6bae] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Şubeyi Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!branch.isMain && (
                        <button
                          type="button"
                          onClick={() =>
                            setPendingEntityDelete({
                              type: "branch",
                              id: branch.id,
                              name: branch.name,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Şubeyi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {branch.managerName && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{branch.managerName}</span>
                      </div>
                    )}

                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono tabular-nums">{branch.phone}</span>
                      </div>
                    )}

                    {branch.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{branch.email}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0">
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed block">
                          {branch.address.fullAddress ||
                            `${branch.address.street || ""} ${branch.address.neighborhood || ""} ${branch.address.district}/${branch.address.city}`}
                        </span>
                        {branch.isMain && (
                          <span className="text-[11px] font-medium text-[#0f6bae] dark:text-sky-400 block">
                            Firma Profili merkez adresi ile senkronize
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-mono tabular-nums">Kayıt: {branch.createdAt}</span>
                  <span
                    className={`font-semibold ${
                      branch.status === "active"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {branch.status === "active" ? "Aktif Şube" : "Pasif"}
                  </span>
                </div>
              </div>
            ))}

            {filteredBranches.length === 0 && (
              <div
                className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border text-slate-500 dark:text-slate-400 text-xs"
                style={{ borderColor: theme.cardBorder }}
              >
                Arama veya filtre kriterlerine uygun şube kaydı bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DEPOLAR (WAREHOUSES) */}
      {currentSubTab === "warehouses" && (
        <div className="space-y-5">
          {/* Depo Özet Metrikleri */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs flex items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Toplam Depo
                </div>
                <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {warehouses.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#0f6bae] dark:text-sky-400">
                <WarehouseIcon className="w-5 h-5" />
              </div>
            </div>

            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs flex items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Aktif Depo
                </div>
                <div className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {warehouses.filter((w) => w.status === "active").length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs flex items-center justify-between"
              style={{ borderColor: theme.cardBorder }}
            >
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Toplam Kapasite
                </div>
                <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {warehouses.reduce((acc, w) => acc + (Number(w.capacityM2) || 0), 0).toLocaleString("tr-TR")}{" "}
                  <span className="text-xs font-sans font-medium text-slate-500">m²</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#0f6bae] dark:text-sky-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Arama & Filtre Çubuğu */}
          <div
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-2xs"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Depo adı, kodu, şube veya konum ara..."
                  value={warehouseSearch}
                  onChange={(e) => setWarehouseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0f6bae] dark:focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
                {(["all", "active", "passive"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setWarehouseStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      warehouseStatusFilter === st
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {st === "all" ? "Tümü" : st === "active" ? "Aktif" : "Pasif"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ExportButtons
                getExportData={() => ({
                  filename: `Depo_Listesi_${new Date().toISOString().split("T")[0]}`,
                  title: "FİRMA YÖNETİMİ - DEPO LİSTESİ",
                  subtitle: `Toplam ${filteredWarehouses.length} Depo Kaydı`,
                  headers: ["Depo Kodu", "Depo Adı", "Bağlı Şube", "Ana Depo mu?", "Sorumlu Yetkili", "Telefon", "İl / İlçe", "Açık Adres", "Durum"],
                  rows: filteredWarehouses.map((w) => [
                    w.code,
                    w.name,
                    branches.find((b) => b.id === w.branchId)?.name || "-",
                    w.isDefault ? "Evet (Varsayılan)" : "Hayır",
                    w.managerName || "-",
                    w.phone || "-",
                    `${w.address.district || ""} / ${w.address.city || ""}`,
                    w.address.fullAddress || "-",
                    w.status === "active" ? "Aktif" : "Pasif",
                  ]),
                })}
                size="sm"
              />
              <button
                type="button"
                onClick={() => handleOpenWarehouseModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Yeni Depo Ekle</span>
              </button>
            </div>
          </div>

          {/* Depo Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredWarehouses.map((wh) => (
              <div
                key={wh.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
                style={{ borderColor: theme.cardBorder }}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-slate-200/80 dark:border-slate-700 rounded-xl font-mono tabular-nums text-xs font-bold shrink-0">
                        {wh.code}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {wh.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{wh.branchName || "Merkez Şube"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenWarehouseModal(wh)}
                        className="p-1.5 text-slate-400 hover:text-[#0f6bae] dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Depoyu Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingEntityDelete({
                            type: "warehouse",
                            id: wh.id,
                            name: wh.name,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Depoyu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-[#0f6bae] dark:text-sky-400">
                      {wh.type === "main"
                        ? "Ana Depo"
                        : wh.type === "regional"
                        ? "Bölge Deposu"
                        : wh.type === "transit"
                        ? "Transit Lojistik"
                        : wh.type === "cold_storage"
                        ? "Soğuk Hava Deposu"
                        : "Antrepo / Serbest Depo"}
                    </span>
                    {wh.capacityM2 ? (
                      <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {Number(wh.capacityM2).toLocaleString("tr-TR")} m²
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {wh.managerName && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{wh.managerName}</span>
                      </div>
                    )}

                    {wh.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono tabular-nums">{wh.phone}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {wh.address.fullAddress ||
                          `${wh.address.street || ""} ${wh.address.neighborhood || ""} ${wh.address.district}/${wh.address.city}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-mono tabular-nums">Kayıt: {wh.createdAt}</span>
                  <span
                    className={`font-semibold ${
                      wh.status === "active"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {wh.status === "active" ? "Aktif Depo" : "Pasif"}
                  </span>
                </div>
              </div>
            ))}

            {filteredWarehouses.length === 0 && (
              <div
                className="col-span-full bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border text-slate-500 dark:text-slate-400 text-xs"
                style={{ borderColor: theme.cardBorder }}
              >
                Arama veya filtre kriterlerine uygun depo kaydı bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SISTEM AYARLARI (Yalnızca Admin ve Sistem Yöneticisi) */}
      {isAdmin && currentSubTab === "settings" && (
        <div className="space-y-6">
          <Settings
            embedded={true}
            initialTab={settingsInitialTab || "system"}
            settings={profileForm}
            onSaveSettings={(newSettings) => {
              setProfileForm(newSettings);
              onSaveSettings(newSettings);
            }}
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            onResetDemoData={onResetDemoData}
            companiesCount={effectiveCompanies.length}
            onOpenSubModule={(sub) => handleTabChange(sub)}
            currentUser={currentUser}
            activeCompany={effectiveCompanies.find((c) => c.id === currentActiveCompanyId) || null}
          />
        </div>
      )}

      {/* SUB-TAB: ŞİRKETLER & ÇOKLU ŞİRKET YÖNETİMİ */}
      {currentSubTab === "companies" &&
        (!isAdmin ? (
          <div
            className="p-8 max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border shadow-2xs text-center space-y-3"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-editorial font-semibold text-slate-900 dark:text-slate-100">
              Çoklu Şirket Tanımı Yetki Kısıtlaması
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Çoklu şirket tanımlama, yeni şirket ekleme ve şirket yapılandırma işlemleri yalnızca <strong>Admin</strong> ve <strong>Sistem Yöneticisi</strong> yetkisine sahip kullanıcılar tarafından yapılabilir.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ borderColor: theme.cardBorder }}
            >
              <div>
                <h3 className="text-base font-editorial font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                  <span>Kayıtlı Şirketler & Çoklu Şirket Yönetimi</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Her yeni eklenen şirkete fatura, cari, banka ve stok modülleri tamamen izole ve temiz veri alanı olarak açılır.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddCompany}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Yeni Şirket Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {effectiveCompanies.map((comp) => {
                const isActive = comp.id === currentActiveCompanyId;
                return (
                  <div
                    key={comp.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all shadow-2xs flex flex-col justify-between ${
                      isActive
                        ? "ring-2 ring-[#0f6bae]/20"
                        : "hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                    style={{
                      borderColor: isActive ? theme.primaryColor : theme.cardBorder,
                    }}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? "text-white"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}
                            style={isActive ? { backgroundColor: theme.primaryColor } : {}}
                          >
                            <Building className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {comp.companyName}
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {comp.companyType === "anonim"
                                ? "Anonim Şirket (A.Ş.)"
                                : comp.companyType === "sahis"
                                ? "Şahıs Firması"
                                : "Limited Şirket (Ltd. Şti.)"}
                            </span>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                            Aktif Şirket
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectCompany) {
                                onSelectCompany(comp.id);
                              } else {
                                setActiveCompanyId(comp.id);
                                window.location.reload();
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-[#0f6bae] hover:text-white text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Bu Şirkete Geç
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {comp.companyTitle || comp.companyName}
                      </div>

                      {/* Vergi & Mysoft Sicil Satırları */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Vergi Dairesi</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {comp.taxOffice || "Merkez"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 dark:text-slate-400">VKN / TCKN</span>
                          <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                            {comp.vkn || comp.tckn || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 dark:text-slate-400">Mysoft Mükellef</span>
                          <span className="font-mono tabular-nums font-semibold text-[#0f6bae] dark:text-sky-400">
                            {comp.tenantIdentifierNumber || comp.vkn || comp.tckn || "Eşleşmedi"}
                          </span>
                        </div>
                      </div>

                      {/* Yetki & Giriş Durumu */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        {comp.moduleRestrictionEnabled ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span className="tabular-nums">
                              Kısıtlı Modül ({comp.allowedModules?.length || 0} / 19)
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Tüm Modüller Açık (19)</span>
                          </span>
                        )}

                        {comp.loginUsername && (
                          <span className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300 truncate">
                            <Key className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{comp.loginUsername}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Alt İşlemler */}
                    <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenMysoftMatch(comp)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#0f6bae] dark:text-sky-400 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                          title="Mysoft VKN / TCKN Eşleştirmesini Düzenle"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>Mysoft Eşle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditCompany(comp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Şirketi Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!isProtectedCompanyId(comp.id) && !comp.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCompanyItem(comp.id)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          title="Şirketi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Sil</span>
                        </button>
                      ) : (
                        <span
                          className="text-[11px] font-medium text-slate-400 flex items-center gap-1 whitespace-nowrap"
                          title="Ana şirket kaydı korunmaktadır"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Korunan Kayıt</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* SUB-TAB: MYSOFT ENTEGRASYON & VKN/TCKN EŞLEŞTİRME MASASI */}
      {currentSubTab === "mysoft" && (
        <div className="space-y-5">
          {/* KART 1: MERKEZİ MYSOFT İŞ ORTAĞI API ERİŞİM ÖZETİ & ŞİRKET SEÇİCİ */}
          <div
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-2xs space-y-5"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Mysoft e-Belge Entegrasyonu — VKN / TCKN Eşleştirme Masası
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold whitespace-nowrap">
                    {partnerSummary?.mockMode
                      ? "İş Ortağı Simülasyon Modu"
                      : partnerSummary?.configured
                        ? "Canlı İş Ortağı OAuth2 Bağlantısı"
                        : "İş Ortağı Proxy Hazır"}
                  </span>
                  {partnerSummary?.businessPartnerId && (
                    <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      Partner ID: #{partnerSummary.businessPartnerId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Eşleştirilen tüm şirketlerin Mysoft e-Fatura, e-Arşiv ve e-İrsaliye API erişimleri merkezi <strong className="text-slate-700 dark:text-slate-200">Mysoft İş Ortağı</strong> hesabı (<code className="font-mono text-[#0f6bae] dark:text-sky-400">tenantIdentifierNumber</code>) üzerinden yürütülür.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isSyncingPartnerLinks}
                  onClick={() => void handleBindAllCompaniesToBusinessPartner()}
                  className="h-9 px-3.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 hover:opacity-95"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isSyncingPartnerLinks
                      ? "İş Ortağına Bağlanıyor..."
                      : "Eşleşmiş Şirketleri İş Ortağına Bağla"}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    Şirket:
                  </label>
                  <select
                    value={selectedMysoftCompId}
                    onChange={(e) => setSelectedMysoftCompId(e.target.value)}
                    className="h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-[#0f6bae] transition-colors"
                  >
                    {effectiveCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.id === currentActiveCompanyId ? "(Aktif)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Özet Metrik Şeridi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    İş Ortağı Mükellefi
                  </div>
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {mysoftDeskTenants.length}
                  </div>
                </div>
                <Building2 className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
              </div>

              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Eşleşen Şirket
                  </div>
                  <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {effectiveCompanies.filter((c) => isCompanyMysoftMatched(c)).length} / {effectiveCompanies.length}
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>

              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Merkezi Kanal
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    Mysoft İş Ortağı OAuth2
                  </div>
                </div>
                <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Tüm Şirketlerin Eşleşme & İş Ortağı API Durum Listesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {effectiveCompanies.map((comp) => {
                const compTenantId =
                  resolveCompanyMysoftTenantIdentifier(comp) ||
                  String(comp.vkn || comp.tckn || "").replace(/\D/g, "");
                const isMatched = isCompanyMysoftMatched(comp);
                const linkedPartner = mysoftDeskTenants.find(
                  (t) => String(t.taxNumber || "").replace(/\D/g, "") === compTenantId,
                );
                const isSelectedRow = comp.id === selectedMysoftCompId;
                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedMysoftCompId(comp.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelectedRow
                        ? "bg-sky-50/70 dark:bg-sky-950/30 border-[#0f6bae] dark:border-sky-500"
                        : "bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {comp.companyName}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                        <span>{compTenantId || "VKN/TCKN Yok"}</span>
                        {linkedPartner && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold truncate">
                            • İş Ortağı Kayıtlı
                          </span>
                        )}
                      </div>
                      {isMatched && (
                        <div className="text-[10px] font-mono tabular-nums text-slate-600 dark:text-slate-300 mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            e-Fat: {comp.eFaturaNextNumber || `${comp.eFaturaPrefix || "GIB"}${new Date().getFullYear()}000000001`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            e-Arş: {comp.eArsivNextNumber || `${comp.eArsivPrefix || "EAR"}${new Date().getFullYear()}000000001`}
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 whitespace-nowrap ${
                        isMatched
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {isMatched ? "İş Ortağı API" : "Eşleşmedi"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇİLİ ŞİRKET DETAY KARTLARI (TEK SEVİYE ELEVASYON) */}
          {(() => {
            const selectedComp = effectiveCompanies.find((c) => c.id === selectedMysoftCompId) || effectiveCompanies[0];
            if (!selectedComp) return null;
            const currentYear = new Date().getFullYear();
            const activeEFatPrefix = (deskEFaturaPrefix || selectedComp.eFaturaPrefix || "GIB").toUpperCase().slice(0, 3);
            const activeEArsPrefix = (deskEArsivPrefix || selectedComp.eArsivPrefix || "EAR").toUpperCase().slice(0, 3);
            const activeEFatNext = deskEFaturaNextNo || selectedComp.eFaturaNextNumber || `${activeEFatPrefix}${currentYear}000000001`;
            const activeEArsNext = deskEArsivNextNo || selectedComp.eArsivNextNumber || `${activeEArsPrefix}${currentYear}000000001`;
            const selectedMatchedTenant =
              resolveCompanyMysoftTenantIdentifier(selectedComp) ||
              selectedComp.tenantIdentifierNumber ||
              selectedComp.vkn ||
              selectedComp.tckn ||
              "";
            const isSelectedMatched = isCompanyMysoftMatched(selectedComp);
            const linkedPartnerRecord = mysoftDeskTenants.find(
              (t) => String(t.taxNumber || "").replace(/\D/g, "") === selectedMatchedTenant,
            );

            const handleSavePrefixSettingsOnDesk = () => {
              const normEFatPfx = activeEFatPrefix.replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X");
              const normEArsPfx = activeEArsPrefix.replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X");
              const updatedComp: CompanyItem = {
                ...selectedComp,
                mysoftAccessMode: "business_partner",
                eFaturaPrefix: normEFatPfx,
                eFaturaNextNumber: activeEFatNext.trim().toUpperCase(),
                eArsivPrefix: normEArsPfx,
                eArsivNextNumber: activeEArsNext.trim().toUpperCase(),
                defaultInvoicePrefix: normEFatPfx,
              };
              handleSaveCompanyFromModal(updatedComp, false);
              setMysoftDeskFeedback(
                `Şirketin resmi belge ön ekleri (${normEFatPfx} / ${normEArsPfx}) ve sıradaki ardışık fatura numaraları (${activeEFatNext} / ${activeEArsNext}) başarıyla kaydedildi.`,
              );
              setTimeout(() => setMysoftDeskFeedback(null), 5000);
            };

            return (
              <>
                {/* KART 2: SEÇİLİ ŞİRKET & E-FATURA / E-ARŞİV SERİ NUMARALARI */}
                <div
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-2xs space-y-5"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0f6bae] dark:text-sky-400 block">
                        Seçili Şirket &amp; Mysoft İş Ortağı Mükellef Bilgisi
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedComp.companyTitle || selectedComp.companyName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Vergi Dairesi: {selectedComp.taxOffice || "Merkez"} • İl: {selectedComp.city || "İstanbul"}
                        {(linkedPartnerRecord?.name || selectedComp.mysoftPartnerName) && (
                          <span className="text-slate-700 dark:text-slate-200 font-semibold">
                            {" "}• İş Ortağı Kaydı: {linkedPartnerRecord?.name || selectedComp.mysoftPartnerName}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isSyncingMysoftPrefixes}
                        onClick={() => void syncSelectedCompanyMysoftPrefixes(selectedComp.id, true)}
                        className="h-9 px-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncingMysoftPrefixes ? "animate-spin" : ""}`} />
                        <span>Seri Numaralarını Çek</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenMysoftMatch(selectedComp)}
                        className="h-9 px-4 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span>Mysoft Eşleştir &amp; Seri Numaraları</span>
                      </button>
                    </div>
                  </div>

                  {mysoftDeskFeedback && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{mysoftDeskFeedback}</span>
                    </div>
                  )}

                  {/* 5'li Tabular Kimlik & Numaratör Özeti */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        Kurumsal VKN (10 Hane)
                      </div>
                      <div className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {selectedComp.vkn || "Girilmedi"}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Tüzel Kişi Vergi No</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        Yetkili TCKN (11 Hane)
                      </div>
                      <div className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {selectedComp.tckn || "Girilmedi"}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Gerçek Kişi / Şahıs No</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-[#0f6bae] dark:text-sky-400 font-semibold mb-1">
                        İş Ortağı Mükellef Kimliği
                      </div>
                      <div className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {selectedMatchedTenant || "Eşleşmedi"}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
                        İş Ortağı API ({selectedComp.mysoftMatchedType?.toUpperCase() || (selectedMatchedTenant.length === 11 ? "TCKN" : "VKN")})
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between gap-1">
                        <span className="truncate">e-Fatura Ön Eki</span>
                        <span className="text-[10px] bg-white dark:bg-slate-900 text-[#0f6bae] dark:text-sky-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono tabular-nums font-bold shrink-0">
                          {activeEFatPrefix}
                        </span>
                      </div>
                      <div className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate mt-1">
                        {activeEFatNext}
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1 block truncate">
                        {deskEFaturaLastNo ? `Son: ${deskEFaturaLastNo}` : "Sıradaki Ardışık No"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between gap-1">
                        <span className="truncate">e-Arşiv Ön Eki</span>
                        <span className="text-[10px] bg-white dark:bg-slate-900 text-[#0f6bae] dark:text-sky-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono tabular-nums font-bold shrink-0">
                          {activeEArsPrefix}
                        </span>
                      </div>
                      <div className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate mt-1">
                        {activeEArsNext}
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1 block truncate">
                        {deskEArsivLastNo ? `Son: ${deskEArsivLastNo}` : "Sıradaki Ardışık No"}
                      </span>
                    </div>
                  </div>

                  {/* E-FATURA & E-ARŞİV ARDIŞIK NUMARATÖR YÖNETİMİ */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                          <span>Eşleşen Firmanın e-Fatura &amp; e-Arşiv Seri Numaraları (Ardışık Numaratör)</span>
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Mysoft tarafında eşleştirmesi yapılan firmanın resmi belge ön ekleri ve sıradaki ardışık seri numaraları buradan yönetilir.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSavePrefixSettingsOnDesk}
                        className="h-9 px-3.5 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0 hover:opacity-95"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <Save className="w-3.5 h-3.5 shrink-0" />
                        <span>Seri Numaralarını Kaydet</span>
                      </button>
                    </div>

                    {/* Tanımlı Seriler Seçim Satırı */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                        <span>Mysoft Portalında Tanımlı e-Fatura &amp; e-Arşiv Serileri</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Üzerine tıklayarak aktif seri numarası olarak seçebilirsiniz
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {(mysoftDeskDefaults?.prefixes && mysoftDeskDefaults.prefixes.length > 0
                          ? mysoftDeskDefaults.prefixes
                          : [
                              {
                                prefix: activeEFatPrefix,
                                edocumentType: 1,
                                isDefault: true,
                                lastNumber: deskEFaturaLastNo || undefined,
                                nextNumber: activeEFatNext,
                              },
                              {
                                prefix: activeEArsPrefix,
                                edocumentType: 2,
                                isDefault: true,
                                lastNumber: deskEArsivLastNo || undefined,
                                nextNumber: activeEArsNext,
                              },
                            ]
                        ).map((p, idx) => {
                          const isEArs = p.edocumentType === 2 || String(p.prefix || "").toUpperCase() === activeEArsPrefix;
                          const docTypeLabel =
                            p.edocumentType === 2
                              ? "e-Arşiv Fatura"
                              : p.edocumentType === 3
                                ? "e-İrsaliye"
                                : "e-Fatura (GİB)";
                          const pfxCode = String(p.prefix || "").toUpperCase().slice(0, 3);
                          const isSelected = isEArs
                            ? pfxCode === activeEArsPrefix
                            : pfxCode === activeEFatPrefix;
                          return (
                            <div
                              key={`${pfxCode}-${idx}`}
                              onClick={() => {
                                const nextNumVal = p.nextNumber || `${pfxCode}${currentYear}000000001`;
                                if (isEArs) {
                                  setDeskEArsivPrefix(pfxCode);
                                  setDeskEArsivNextNo(nextNumVal);
                                  if (p.lastNumber) setDeskEArsivLastNo(p.lastNumber);
                                  handleSaveCompanyFromModal(
                                    {
                                      ...selectedComp,
                                      eArsivPrefix: pfxCode,
                                      eArsivNextNumber: nextNumVal,
                                    },
                                    false,
                                  );
                                } else {
                                  setDeskEFaturaPrefix(pfxCode);
                                  setDeskEFaturaNextNo(nextNumVal);
                                  if (p.lastNumber) setDeskEFaturaLastNo(p.lastNumber);
                                  handleSaveCompanyFromModal(
                                    {
                                      ...selectedComp,
                                      eFaturaPrefix: pfxCode,
                                      eFaturaNextNumber: nextNumVal,
                                      defaultInvoicePrefix: pfxCode,
                                    },
                                    false,
                                  );
                                }
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? "bg-sky-50/70 dark:bg-sky-950/30 border-[#0f6bae] dark:border-sky-500"
                                  : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="px-2 py-0.5 rounded-md text-white font-mono tabular-nums text-xs font-bold tracking-wider"
                                    style={{ backgroundColor: theme.primaryColor }}
                                  >
                                    {pfxCode}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {docTypeLabel}
                                  </span>
                                  {p.isDefault && (
                                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                                      Varsayılan
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
                                  En Son: <strong className="text-slate-700 dark:text-slate-200">{p.lastNumber || "Henüz kesilmedi (0)"}</strong>
                                </div>
                                <div className="text-[10px] text-[#0f6bae] dark:text-sky-400 font-mono tabular-nums truncate">
                                  Sıradaki: <strong>{p.nextNumber || `${pfxCode}${currentYear}000000001`}</strong>
                                </div>
                              </div>
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 ${
                                  isSelected ? "text-[#0f6bae] dark:text-sky-400" : "text-slate-300 dark:text-slate-600"
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Düzenlenebilir Seri Giriş Alanları */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* e-Fatura Alanı */}
                      {(() => {
                        const efatSeqCheck = validateSequentialInvoiceNumber({
                          enteredNumber: activeEFatNext,
                          expectedPrefix: deskEFaturaPrefix || activeEFatPrefix,
                          lastUsedNumber: deskEFaturaLastNo,
                          year: currentYear,
                        });
                        return (
                          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                                <span>e-Fatura Seri Numarası</span>
                              </span>
                              <span className="text-[10px] font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                                Son No: {deskEFaturaLastNo || "Yok"}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Ön Ek (3 Harf)
                                </label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={deskEFaturaPrefix}
                                  onChange={(e) => {
                                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
                                    setDeskEFaturaPrefix(val);
                                    if (val.length === 3) {
                                      const seqInfo = getLocalNextSequentialInvoiceNumber("e_fatura", selectedComp.id, val);
                                      setDeskEFaturaLastNo(seqInfo.lastInvoiceNumber || "");
                                      setDeskEFaturaNextNo(seqInfo.nextInvoiceNumber);
                                    }
                                  }}
                                  className="w-full h-9 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-xs font-bold text-slate-900 dark:text-white uppercase text-center outline-none focus:border-[#0f6bae]"
                                  placeholder="TLL"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Sıradaki e-Fatura Seri Numarası
                                </label>
                                <input
                                  type="text"
                                  maxLength={16}
                                  value={activeEFatNext}
                                  onChange={(e) => setDeskEFaturaNextNo(e.target.value.toUpperCase().trim())}
                                  className={`w-full h-9 px-3 bg-white dark:bg-slate-900 border rounded-lg font-mono tabular-nums text-xs font-bold outline-none ${
                                    efatSeqCheck.hasWarning
                                      ? "border-rose-400 text-rose-900 dark:text-rose-300"
                                      : "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-[#0f6bae]"
                                  }`}
                                />
                              </div>
                            </div>
                            <div
                              className={`p-2.5 rounded-lg border text-[10px] flex items-start justify-between gap-2 ${
                                efatSeqCheck.hasWarning
                                  ? efatSeqCheck.status === "gap"
                                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300"
                                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                              }`}
                            >
                              <div className="flex items-start gap-1.5 min-w-0">
                                {efatSeqCheck.hasWarning ? (
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold">{efatSeqCheck.title}</div>
                                  <p>{efatSeqCheck.message}</p>
                                </div>
                              </div>
                              {efatSeqCheck.hasWarning && efatSeqCheck.expectedNextNumber && (
                                <button
                                  type="button"
                                  onClick={() => setDeskEFaturaNextNo(efatSeqCheck.expectedNextNumber)}
                                  className="px-2 py-1 rounded text-white font-semibold shrink-0 cursor-pointer whitespace-nowrap"
                                  style={{ backgroundColor: theme.primaryColor }}
                                >
                                  Düzelt
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* e-Arşiv Alanı */}
                      {(() => {
                        const earsSeqCheck = validateSequentialInvoiceNumber({
                          enteredNumber: activeEArsNext,
                          expectedPrefix: deskEArsivPrefix || activeEArsPrefix,
                          lastUsedNumber: deskEArsivLastNo,
                          year: currentYear,
                        });
                        return (
                          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                                <span>e-Arşiv Seri Numarası</span>
                              </span>
                              <span className="text-[10px] font-mono tabular-nums bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                                Son No: {deskEArsivLastNo || "Yok"}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Ön Ek (3 Harf)
                                </label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={deskEArsivPrefix}
                                  onChange={(e) => {
                                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
                                    setDeskEArsivPrefix(val);
                                    if (val.length === 3) {
                                      const seqInfo = getLocalNextSequentialInvoiceNumber("e_arsiv", selectedComp.id, val);
                                      setDeskEArsivLastNo(seqInfo.lastInvoiceNumber || "");
                                      setDeskEArsivNextNo(seqInfo.nextInvoiceNumber);
                                    }
                                  }}
                                  className="w-full h-9 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-xs font-bold text-slate-900 dark:text-white uppercase text-center outline-none focus:border-[#0f6bae]"
                                  placeholder="EAR"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Sıradaki e-Arşiv Seri Numarası
                                </label>
                                <input
                                  type="text"
                                  maxLength={16}
                                  value={activeEArsNext}
                                  onChange={(e) => setDeskEArsivNextNo(e.target.value.toUpperCase().trim())}
                                  className={`w-full h-9 px-3 bg-white dark:bg-slate-900 border rounded-lg font-mono tabular-nums text-xs font-bold outline-none ${
                                    earsSeqCheck.hasWarning
                                      ? "border-rose-400 text-rose-900 dark:text-rose-300"
                                      : "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-[#0f6bae]"
                                  }`}
                                />
                              </div>
                            </div>
                            <div
                              className={`p-2.5 rounded-lg border text-[10px] flex items-start justify-between gap-2 ${
                                earsSeqCheck.hasWarning
                                  ? earsSeqCheck.status === "gap"
                                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300"
                                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300"
                                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                              }`}
                            >
                              <div className="flex items-start gap-1.5 min-w-0">
                                {earsSeqCheck.hasWarning ? (
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold">{earsSeqCheck.title}</div>
                                  <p>{earsSeqCheck.message}</p>
                                </div>
                              </div>
                              {earsSeqCheck.hasWarning && earsSeqCheck.expectedNextNumber && (
                                <button
                                  type="button"
                                  onClick={() => setDeskEArsivNextNo(earsSeqCheck.expectedNextNumber)}
                                  className="px-2 py-1 rounded text-white font-semibold shrink-0 cursor-pointer whitespace-nowrap"
                                  style={{ backgroundColor: theme.primaryColor }}
                                >
                                  Düzelt
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* KART 3: MYSOFT API ERİŞİM KANALI & OPSİYONEL PORTAL BİLGİLERİ */}
                <div
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-2xs space-y-4"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          Mysoft API Erişim Kanalı: Mysoft İş Ortağı (Merkezi OAuth2 Erişimi)
                        </h5>
                        {isSelectedMatched && selectedMatchedTenant ? (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>İş Ortağı Üzerinden Bağlı (<span className="font-mono tabular-nums">{selectedMatchedTenant}</span>)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1 whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>VKN / TCKN Eşleşmesi Bekleniyor</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <strong className="text-slate-700 dark:text-slate-200">{selectedComp.companyTitle || selectedComp.companyName}</strong> şirketinin tüm e-Belge ve mükellef sorgulama çağrıları bireysel şifre gerektirmeden <strong className="text-slate-700 dark:text-slate-200">Mysoft İş Ortağı</strong> hesabı üzerinden (<code className="font-mono tabular-nums text-[#0f6bae] dark:text-sky-400">{selectedMatchedTenant || "tenantIdentifierNumber"}</code>) yürütülür.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowOptionalPortalCreds((prev) => !prev)}
                      className="h-9 px-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0 whitespace-nowrap"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>
                        {showOptionalPortalCreds
                          ? "Opsiyonel Portal Bilgilerini Gizle"
                          : "Opsiyonel Bireysel Portal Bilgisi"}
                      </span>
                    </button>
                  </div>

                  {showOptionalPortalCreds && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>
                          Not: API erişimi <strong>Mysoft İş Ortağı</strong> üzerinden yapılır. Aşağıdaki alanlar yalnızca şirketin kendi Mysoft Portal ekranı giriş notunu saklamak isterseniz opsiyoneldir.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveDeskMysoftCredentials(selectedComp.id)}
                          className="h-8 px-3 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap self-end sm:self-auto"
                          style={{ backgroundColor: theme.primaryColor }}
                        >
                          <Save className="w-3.5 h-3.5 shrink-0" />
                          <span>Kaydet</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Mysoft Portal Kullanıcı Adı (Opsiyonel)</span>
                          </label>
                          <input
                            type="text"
                            value={deskMysoftUsername}
                            onChange={(e) => setDeskMysoftUsername(e.target.value)}
                            placeholder="Opsiyonel portal kullanıcı adı"
                            className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Mysoft Portal Şifresi (Opsiyonel)</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showDeskMysoftPassword ? "text" : "password"}
                              value={deskMysoftPassword}
                              onChange={(e) => setDeskMysoftPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full h-10 px-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowDeskMysoftPassword(!showDeskMysoftPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                              title={showDeskMysoftPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                            >
                              {showDeskMysoftPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* KART 4: MYSOFT İŞ ORTAKLARI & BAĞLI MÜKELLEF LİSTESİ */}
                <div
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-2xs space-y-4"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#0f6bae] dark:text-sky-400 shrink-0" />
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                          Mysoft İş Ortakları &amp; Bağlı Mükellef Listesi
                        </h5>
                        <span className="text-[10px] font-mono tabular-nums bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold">
                          {mysoftDeskTenants.length} Mükellef
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Mysoft İş Ortağı hesabınıza bağlı mükellefleri görüntüleyebilir ve <strong className="text-slate-700 dark:text-slate-200">{selectedComp.companyName}</strong> şirketini doğrudan iş ortağı API yetkisiyle eşleştirebilirsiniz.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void reloadMysoftDeskTenants();
                        void refreshPartnerSummary();
                      }}
                      disabled={isMysoftDeskTenantsLoading}
                      className="h-9 px-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isMysoftDeskTenantsLoading ? "animate-spin" : ""}`} />
                      <span>İş Ortaklarını Yenile</span>
                    </button>
                  </div>

                  {mysoftDeskPartnerHint && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{mysoftDeskPartnerHint}</span>
                    </div>
                  )}

                  {mysoftDeskTenantsError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>{mysoftDeskTenantsError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void reloadMysoftDeskTenants()}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-50 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Tekrar Dene
                      </button>
                    </div>
                  )}

                  {/* Arama & Manuel VKN Sorgulama Çubuğu */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-7 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={tenantSearchQuery}
                        onChange={(e) => setTenantSearchQuery(e.target.value)}
                        placeholder="İş ortağı adı, VKN veya TCKN ile filtrele..."
                        className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-all"
                      />
                    </div>

                    <div className="md:col-span-5 flex items-center gap-2">
                      <input
                        type="text"
                        value={deskManualVkn}
                        onChange={(e) => setDeskManualVkn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="10 VKN / 11 TCKN getir"
                        className="flex-1 h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-all"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await deskLookupByVkn();
                          if (res) {
                            handleMatchTenantWithSelectedComp(res);
                          }
                        }}
                        disabled={isDeskManualVknLoading || !deskManualVkn.trim()}
                        className="h-10 px-3.5 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap hover:opacity-95"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        {isDeskManualVknLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : (
                          <Search className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>VKN ile Getir</span>
                      </button>
                    </div>
                  </div>

                  {/* İş Ortakları Listesi */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span>Kayıtlı İş Ortakları</span>
                      <span className="font-normal text-slate-400">
                        Seçili şirkete atamak için &quot;Bu Şirkete Eşle&quot; butonunu kullanın
                      </span>
                    </div>

                    {isMysoftDeskTenantsLoading ? (
                      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#0f6bae] dark:text-sky-400" />
                        <span>Mysoft iş ortakları ve mükellef rehberi yükleniyor...</span>
                      </div>
                    ) : (() => {
                      const q = tenantSearchQuery.trim().toLowerCase();
                      const filteredTenants = mysoftDeskTenants.filter((t) => {
                        if (!q) return true;
                        const name = String(t.name || "").toLowerCase();
                        const taxNo = String(t.taxNumber || "");
                        const tid = String(t.id || "");
                        return name.includes(q) || taxNo.includes(q) || tid.includes(q);
                      });

                      if (filteredTenants.length === 0) {
                        return (
                          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                            {tenantSearchQuery ? (
                              <span>Arama kriterinize uygun Mysoft iş ortağı bulunamadı.</span>
                            ) : (
                              <span>Henüz Mysoft iş ortağı kaydı bulunamadı. Yukarıdaki alandan VKN/TCKN ile sorgulama yapabilirsiniz.</span>
                            )}
                          </div>
                        );
                      }

                      const selectedCompMatchedId = (
                        selectedComp.tenantIdentifierNumber ||
                        selectedComp.vkn ||
                        selectedComp.tckn ||
                        ""
                      ).trim();

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                          {filteredTenants.map((t, idx) => {
                            const tTax = String(t.taxNumber || "").trim();
                            const isMatched = Boolean(tTax && tTax === selectedCompMatchedId);

                            return (
                              <div
                                key={`${tTax}_${t.id || idx}`}
                                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                                  isMatched
                                    ? "bg-sky-50/70 dark:bg-sky-950/30 border-[#0f6bae] dark:border-sky-500"
                                    : "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <h6 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2" title={t.name}>
                                      {t.name || "İsimsiz İş Ortağı"}
                                    </h6>
                                    {t.id && (
                                      <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                                        #{t.id}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[11px] font-mono tabular-nums font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                      {tTax}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {tTax.length === 10 ? "VKN" : tTax.length === 11 ? "TCKN" : "Kimlik"}
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2">
                                  {isMatched ? (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>Eşleşmiş Şirket</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleMatchTenantWithSelectedComp(t)}
                                      className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-[#0f6bae] hover:text-white dark:hover:bg-sky-600 text-[#0f6bae] dark:text-sky-400 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                                    >
                                      <Check className="w-3.5 h-3.5 shrink-0" />
                                      <span>Bu Şirkete Eşle</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Şube Ekle / Düzenle Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white">
                    {editingBranch ? "Şube Bilgilerini Düzenle" : "Yeni Şube Tanımla"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {settings.companyName || "İşletme"} bünyesine şube kaydı ekleyin veya güncelleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseBranch}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBranch} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Şube Kodu *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.code || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    placeholder="SUB-001"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono tabular-nums font-bold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Şube Adı *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.name || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="Örn: Merkez Şube, Kadıköy Şubesi..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Şube Sorumlusu</label>
                  <input
                    type="text"
                    value={branchForm.managerName || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                    placeholder="Ad Soyad"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telefon</label>
                  <input
                    type="text"
                    value={branchForm.phone || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+90 (212) 000 00 00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono tabular-nums text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">E-Posta</label>
                  <input
                    type="email"
                    value={branchForm.email || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    placeholder="sube@firma.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {editingBranch?.isMain ? (
                  <span className="bg-sky-50 dark:bg-sky-950/40 text-[#0f6bae] dark:text-sky-400 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800">
                    Merkez (Ana Şube — Firma Profili Adresi)
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Şube Türü: <strong className="text-slate-900 dark:text-white">Ek Şube</strong> (Merkez şubeye bağlı)
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Durum:</span>
                  <select
                    value={branchForm.status || "active"}
                    onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value as "active" | "passive" })}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae]"
                  >
                    <option value="active">Aktif</option>
                    <option value="passive">Pasif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <AddressSelector
                  title="Şube Adres Bilgileri"
                  frameless={true}
                  address={
                    branchForm.address || {
                      country: "Türkiye",
                      city: "İstanbul",
                      district: "Şişli",
                      neighborhood: "Mecidiyeköy",
                      street: "",
                      buildingNo: "",
                      doorNo: "",
                      postalCode: "",
                      fullAddress: "",
                    }
                  }
                  onChange={(updatedAddress) => setBranchForm({ ...branchForm, address: updatedAddress })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseBranch}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer whitespace-nowrap"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap hover:opacity-95 transition-all"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{editingBranch ? "Şubeyi Güncelle" : "Şubeyi Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Depo Ekle / Düzenle Modal */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <WarehouseIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white">
                    {editingWarehouse ? "Depo Bilgilerini Düzenle" : "Yeni Depo Tanımla"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {settings.companyName || "İşletme"} için stok ve lojistik deposu ekleyin veya güncelleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseWarehouse}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWarehouse} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Depo Kodu *</label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.code || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    placeholder="DEP-001"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono tabular-nums font-bold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Depo Adı *</label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.name || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    placeholder="Örn: Merkez Ana Depo, Gebze Lojistik Depo..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Depo Tipi</label>
                  <select
                    value={warehouseForm.type || "main"}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, type: e.target.value as Warehouse["type"] })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  >
                    <option value="main">Ana Depo</option>
                    <option value="regional">Bölge Deposu</option>
                    <option value="transit">Transit Lojistik</option>
                    <option value="cold_storage">Soğuk Hava Deposu</option>
                    <option value="bonded">Antrepo / Serbest Depo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bağlı Şube</label>
                  <select
                    value={warehouseForm.branchId || ""}
                    onChange={(e) => {
                      const b = branches.find((br) => br.id === e.target.value);
                      setWarehouseForm({
                        ...warehouseForm,
                        branchId: e.target.value,
                        branchName: b?.name || "Merkez Şube",
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  >
                    <option value="">Merkez / Genel</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kapasite (m²)</label>
                  <input
                    type="number"
                    value={warehouseForm.capacityM2 ?? 1000}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, capacityM2: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono tabular-nums font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Depo Sorumlusu</label>
                  <input
                    type="text"
                    value={warehouseForm.managerName || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, managerName: e.target.value })}
                    placeholder="Ad Soyad"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">İletişim Telefonu</label>
                  <input
                    type="text"
                    value={warehouseForm.phone || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })}
                    placeholder="+90 (212) 000 00 00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono tabular-nums text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Durum</label>
                  <select
                    value={warehouseForm.status || "active"}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, status: e.target.value as "active" | "passive" })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0f6bae] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  >
                    <option value="active">Aktif Depo</option>
                    <option value="passive">Pasif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <AddressSelector
                  title="Depo Adres Bilgileri"
                  frameless={true}
                  address={
                    warehouseForm.address || {
                      country: "Türkiye",
                      city: "İstanbul",
                      district: "Şişli",
                      neighborhood: "Mecidiyeköy",
                      street: "",
                      buildingNo: "",
                      doorNo: "",
                      postalCode: "",
                      fullAddress: "",
                    }
                  }
                  onChange={(updatedAddress) => setWarehouseForm({ ...warehouseForm, address: updatedAddress })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseWarehouse}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer whitespace-nowrap"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap hover:opacity-95 transition-all"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{editingWarehouse ? "Depoyu Güncelle" : "Depoyu Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Şube / Depo Silme Onay Modalı */}
      {pendingEntityDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {pendingEntityDelete.type === "branch" ? "Şube Silme Onayı" : "Depo Silme Onayı"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kayıt sistemden kalıcı olarak kaldırılacaktır
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingEntityDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">{pendingEntityDelete.name}</strong>{" "}
                {pendingEntityDelete.type === "branch"
                  ? "şubesini silmek istediğinize emin misiniz?"
                  : "deposunu silmek istediğinize emin misiniz?"}
              </p>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingEntityDelete(null)}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingEntityDelete.type === "branch") {
                    onDeleteBranch(pendingEntityDelete.id);
                  } else {
                    onDeleteWarehouse(pendingEntityDelete.id);
                  }
                  setPendingEntityDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {pendingEntityDelete.type === "branch" ? "Evet, Şubeyi Sil" : "Evet, Depoyu Sil"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şirket Silme Onay Modalı */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden"
            style={{ borderColor: theme.cardBorder }}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Şirket Silme Onayı</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Seçili şirket sistemden kaldırılacak</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white">{companyToDelete.companyName}</strong>{" "}
                (<span className="font-mono tabular-nums">{companyToDelete.companyTitle || companyToDelete.vkn || companyToDelete.tckn}</span>) şirketini ve yapılandırmasını silmek istediğinize emin misiniz?
              </p>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCompanyItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Evet, Şirketi Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: LOG İZLEME EKRANI (MYSOFT API & TEKNİK HATA KONSOLU) */}
      {currentSubTab === "logs" && (() => {
        const activeCompObj = effectiveCompanies.find((c) => c.id === currentActiveCompanyId) || null;

        return (
          <AdminMysoftLogMonitorPanel
            companyName={activeCompObj?.companyName || activeCompObj?.name || profileForm?.companyName || settings?.companyName}
            companyTaxNumber={
              activeCompObj?.taxNumber ||
              profileForm?.tenantIdentifierNumber ||
              profileForm?.taxNumber ||
              settings?.tenantIdentifierNumber ||
              settings?.taxNumber
            }
          />
        );
      })()}

      {/* Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompanyFromModal}
        onDelete={handleDeleteCompanyItem}
        initialCompany={editingCompany}
        mode={companyModalMode}
        currentUser={currentUser}
      />
    </div>
  );
};
