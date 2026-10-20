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
} from "../types";
import { UserProfile } from "./AuthModal";
import { ExportButtons } from "./ExportButtons";
import { ExportData } from "../utils/exportUtils";
import { AddressSelector } from "./AddressSelector";
import { GibPortalModal } from "./GibPortalModal";
import { MysoftTenantPicker } from "./MysoftTenantPicker";
import { CompanyModal } from "./CompanyModal";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
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
} from "../utils/storage";
import { writeStoredMysoftTenantVkn } from "../utils/mysoftTenantStorage";
import { checkRecipientTaxpayerStatus } from "../services/mysoftEDocumentService";
import {
  fetchCloudLogo,
  saveCloudLogo,
  subscribeToCloudLogo,
  CloudBrandingConfig,
  DEFAULT_CLOUD_BRANDING,
} from "../services/cloudBrandingService";
import { readAndOptimizeLogoFile, clampLogoScale } from "../utils/logoUpload";
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
  const [currentSubTab, setCurrentSubTab] = useState<CompanySubTab>(activeSubTab);

  React.useEffect(() => {
    if (activeSubTab) {
      setCurrentSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Sync internal subtab if controlled externally
  const handleTabChange = (tab: CompanySubTab) => {
    setCurrentSubTab(tab);
    if (onSelectSubTab) onSelectSubTab(tab);
  };

  // Multi-Company Local State & Modal
  const [localCompanies, setLocalCompanies] = useState<CompanyItem[]>(() => companies || getCompaniesList());
  const effectiveCompanies = companies || localCompanies;
  const currentActiveCompanyId = activeCompanyId || getActiveCompanyId();

  React.useEffect(() => {
    if (companies) setLocalCompanies(companies);
  }, [companies]);

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
      if (savedComp.id === currentActiveCompanyId) {
        setProfileForm((prev) => ({
          ...prev,
          companyName: savedComp.companyName || prev.companyName,
          companyTitle: savedComp.companyTitle || savedComp.companyName || prev.companyTitle,
          taxOffice: savedComp.taxOffice || prev.taxOffice,
          taxNumber: savedComp.taxNumber || savedComp.vkn || savedComp.tckn || prev.taxNumber,
          phone: savedComp.phone ?? prev.phone,
          email: savedComp.email ?? prev.email,
          website: savedComp.website ?? prev.website,
          address: savedComp.address ?? prev.address,
          city: savedComp.city ?? prev.city,
          district: savedComp.district ?? prev.district,
          defaultBankAccountName: savedComp.defaultBankAccountName ?? prev.defaultBankAccountName,
          defaultBankName: savedComp.defaultBankName ?? prev.defaultBankName,
          defaultBankIban: savedComp.defaultBankIban ?? prev.defaultBankIban,
          tenantIdentifierNumber: savedComp.tenantIdentifierNumber || prev.tenantIdentifierNumber,
        }));
      }
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
    if (onDeleteCompany) {
      onDeleteCompany(companyToDelete.id);
    } else {
      const updated = deleteCompanyItem(companyToDelete.id);
      setLocalCompanies(updated);
    }
    setCompanyToDelete(null);
  };

  // Profile Form State
  const [profileForm, setProfileForm] = useState<CompanySettings>(settings);
  const [isFetchingTaxpayer, setIsFetchingTaxpayer] = useState(false);
  const [vknFetchFeedback, setVknFetchFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings) {
      setProfileForm(settings);
    }
  }, [settings]);
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
      if (targetLogo) {
        setProfileForm((prev) => {
          if (prev.logoUrl && prev.logoUrl !== "/logo.svg") {
            return prev;
          }
          return {
            ...prev,
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
      if (fetchedUrl) {
        setCloudBranding(res);
        setProfileForm((prev) => ({ ...prev, logoUrl: fetchedUrl, logoScale: fetchedScale }));
        onSaveSettings({ ...settings, ...profileForm, logoUrl: fetchedUrl, logoScale: fetchedScale });
        setCloudSyncStatus("Şirket logosu Google Cloud Console Firestore veritabanından başarıyla çekildi!");
      } else {
        setCloudSyncStatus("Cloud Console bağlantısı sağlandı.");
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
      const targetUrl = profileForm.logoUrl || "/logo.svg";
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
      onSaveSettings({ ...settings, ...profileForm, logoUrl: targetUrl, logoScale: targetScale });
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
      const nextProfile = { ...profileForm, logoUrl: optimizedDataUrl, logoScale: 1 };
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
    const nextProfile = { ...profileForm, logoScale: clamped };
    setProfileForm(nextProfile);
    onSaveSettings({ ...settings, ...nextProfile });
  };

  const autoSaveTimerRef = React.useRef< ReturnType<typeof setTimeout> | null >(null);

  const persistProfileSettings = React.useCallback(
    (sourceForm: CompanySettings, showSavedFeedback = true) => {
      const resolvedName = (sourceForm.companyName || sourceForm.companyTitle || "Aktif Şirket").trim();
      const resolvedTitle = (sourceForm.companyTitle || sourceForm.companyName || resolvedName).trim();
      const cleanTax = String(sourceForm.taxNumber || "").replace(/\D/g, "").trim();
      const resolvedBankHolder =
        sourceForm.defaultBankAccountName && sourceForm.defaultBankAccountName.trim()
          ? sourceForm.defaultBankAccountName
          : resolvedTitle;

      const cleanedProfile: CompanySettings = {
        ...sourceForm,
        companyName: resolvedName,
        name: resolvedName,
        companyTitle: resolvedTitle,
        title: resolvedTitle,
        vkn: cleanTax.length === 10 ? cleanTax : sourceForm.vkn,
        tckn: cleanTax.length === 11 ? cleanTax : sourceForm.tckn,
        tradeRegisterNo: (sourceForm.tradeRegisterNo ?? "").trim(),
        mersisNo: (sourceForm.mersisNo ?? "").trim(),
        defaultBankAccountName: resolvedBankHolder,
        defaultBankName: sourceForm.defaultBankName ?? "",
        defaultBankIban: sourceForm.defaultBankIban ?? "",
      };

      onSaveSettings(cleanedProfile);

      // Merkez şube adresini de Resmi Şirket Kimlik / Merkez Adresi ile senkronize et
      const mainBranch = branches.find((b) => b.isMain);
      if (mainBranch && cleanedProfile.address) {
        onUpdateBranch({
          ...mainBranch,
          phone: cleanedProfile.phone || mainBranch.phone,
          email: cleanedProfile.email || mainBranch.email,
          address: {
            ...mainBranch.address,
            country: cleanedProfile.country || mainBranch.address?.country || "Türkiye",
            city: cleanedProfile.city || mainBranch.address?.city || "İstanbul",
            district: cleanedProfile.district ?? mainBranch.address?.district ?? "",
            neighborhood: cleanedProfile.neighborhood ?? mainBranch.address?.neighborhood ?? "",
            street: cleanedProfile.street ?? mainBranch.address?.street ?? "",
            buildingNo: cleanedProfile.buildingNo ?? mainBranch.address?.buildingNo ?? "",
            doorNo: cleanedProfile.doorNo ?? mainBranch.address?.doorNo ?? "",
            postalCode: cleanedProfile.postalCode ?? mainBranch.address?.postalCode ?? "",
            fullAddress: cleanedProfile.address,
          },
        });
      }

      const activeComp = effectiveCompanies.find((c) => c.id === currentActiveCompanyId);
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
          defaultBankAccountName: cleanedProfile.defaultBankAccountName,
          defaultBankName: cleanedProfile.defaultBankName,
          defaultBankIban: cleanedProfile.defaultBankIban,
          tenantIdentifierNumber: cleanedProfile.tenantIdentifierNumber || activeComp.tenantIdentifierNumber,
          logoUrl: cleanedProfile.logoUrl || activeComp.logoUrl,
          logoScale: cleanedProfile.logoScale ?? activeComp.logoScale,
        };
        const updatedList = updateCompanyItem(updatedComp);
        setLocalCompanies(updatedList);
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

  // Open Branch Detail
  const handleOpenBranchModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm(branch);
      companyNav.openEdit(branch, branch.id);
    } else {
      setEditingBranch(null);
      setBranchForm({
        code: `SUB-00${branches.length + 1}`,
        name: "",
        managerName: "",
        phone: "",
        email: "",
        isMain: branches.length === 0,
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
    setIsBranchModalOpen(true);
  };

  // Submit Branch
  const handleSubmitBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code) return;

    const rawAddr = (branchForm.address as AddressDetails) || {
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

    if (editingBranch) {
      onUpdateBranch({
        ...editingBranch,
        ...branchForm,
        address: normalizedAddr,
      } as Branch);
    } else {
      const newBranch: Branch = {
        id: `br_${Date.now()}`,
        code: branchForm.code!,
        name: branchForm.name!,
        managerName: branchForm.managerName || "",
        phone: branchForm.phone || "",
        email: branchForm.email || "",
        isMain: !!branchForm.isMain,
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
      companyNav.openCreate();
    }
    setIsWarehouseModalOpen(true);
  };

  // Submit Warehouse
  const handleSubmitWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.name || !warehouseForm.code) return;

    const selectedBranch = branches.find((b) => b.id === warehouseForm.branchId);
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
        branchId: warehouseForm.branchId || branches[0]?.id || "",
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
  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.address.city.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.address.district.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      w.code.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      w.address.city.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      w.address.district.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-[#131b2e] rounded-lg p-6 text-white shadow-2xs border border-[#222a3d]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col items-center text-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-md bg-[#0f6bae] text-white flex items-center justify-center shrink-0 shadow-2xs border border-[#2b82c5]/40 mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="bg-[#0f6bae]/20 text-[#c6cdff] border border-[#0f6bae]/30 text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Firma Yönetim Modülü
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-editorial font-medium text-white tracking-tight text-center">
                {settings.companyName || "Firma Bilgileri"}
              </h1>
              <p className="text-xs sm:text-sm text-[#9daec3] mt-1 max-w-2xl mx-auto font-sans leading-relaxed text-center">
                Şirketinizin resmi kimlik bilgilerini, şubelerinizi, depolarınızı ve sistem ayarlarınızı (çoklu şirket & Mysoft eşleştirme dahil) bu modülden yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 shrink-0">
            <div className="bg-[#0f172a]/70 border border-[#283044] rounded-md p-3 text-center min-w-[105px] shadow-2xs text-white">
              <div className="text-lg font-bold text-white font-mono">{branches.length}</div>
              <div className="text-[10px] text-[#9daec3] font-semibold">Kayıtlı Şube</div>
            </div>
            <div className="bg-[#0f172a]/70 border border-[#283044] rounded-md p-3 text-center min-w-[105px] shadow-2xs text-white">
              <div className="text-lg font-bold text-white font-mono">{warehouses.length}</div>
              <div className="text-[10px] text-[#9daec3] font-semibold">Kayıtlı Depo</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation for Firma Bilgileri (Firma Profili, Şubeler, Depolar, Sistem Ayarları) */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mt-6 pt-4 border-t border-[#283044]">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(() => {
              const activeCompObj =
                effectiveCompanies.find((c) => c.id === currentActiveCompanyId) || null;
              const isCompanySubAllowed = (subKey: string) =>
                isModuleOrSubModuleAllowed(subKey, "company", currentUser, activeCompObj);
              const isSettingsActive = ["settings", "companies", "mysoft", "logs"].includes(currentSubTab);

              return (
                <>
                  {isCompanySubAllowed("company_profile") && (
                    <button
                      onClick={() => handleTabChange("profile")}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        currentSubTab === "profile"
                          ? "bg-[#0f6bae] text-white shadow-2xs"
                          : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
                      }`}
                    >
                      <Building className={`w-4 h-4 ${currentSubTab === "profile" ? "text-white" : "text-[#83b8ff]"}`} />
                      <span>Firma Profili & Adres</span>
                    </button>
                  )}

                  {isCompanySubAllowed("company_branches") && (
                    <button
                      onClick={() => handleTabChange("branches")}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        currentSubTab === "branches"
                          ? "bg-[#0f6bae] text-white shadow-2xs"
                          : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
                      }`}
                    >
                      <Store className={`w-4 h-4 ${currentSubTab === "branches" ? "text-white" : "text-[#83b8ff]"}`} />
                      <span>Şubeler ({branches.length})</span>
                    </button>
                  )}

                  {isCompanySubAllowed("company_warehouses") && (
                    <button
                      onClick={() => handleTabChange("warehouses")}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        currentSubTab === "warehouses"
                          ? "bg-[#0f6bae] text-white shadow-2xs"
                          : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
                      }`}
                    >
                      <WarehouseIcon className={`w-4 h-4 ${currentSubTab === "warehouses" ? "text-white" : "text-[#83b8ff]"}`} />
                      <span>Depolar ({warehouses.length})</span>
                    </button>
                  )}

                  {isCompanySubAllowed("company_settings") && (
                    <button
                      onClick={() => handleTabChange("settings")}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        isSettingsActive
                          ? "bg-[#0f6bae] text-white shadow-2xs"
                          : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
                      }`}
                    >
                      <SettingsIcon className={`w-4 h-4 ${isSettingsActive ? "text-white" : "text-[#83b8ff]"}`} />
                      <span>Sistem Ayarları</span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Sistem Ayarları Alt Modül Sekme Çubuğu (Genel Ayarlar, Şirketler & Çoklu Şirket, Mysoft VKN/TCKN Eşleştirme, Log İzleme) */}
      {["settings", "companies", "mysoft", "logs"].includes(currentSubTab) && (() => {
        const activeCompObj = effectiveCompanies.find((c) => c.id === currentActiveCompanyId) || null;
        const isMysoftMatched = isCompanyMysoftMatched(activeCompObj, profileForm || settings);

        return (
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTabChange("settings")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSubTab === "settings"
                    ? "bg-[#0f6bae] text-white shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Genel & Sistem Ayarları</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleTabChange("companies")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentSubTab === "companies"
                      ? "bg-[#0f6bae] text-white shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Şirketler & Çoklu Şirket ({effectiveCompanies.length})</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleTabChange("mysoft")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentSubTab === "mysoft"
                      ? "bg-[#0f6bae] text-white shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Mysoft VKN/TCKN Eşleştirme</span>
                </button>
              )}

              {isMysoftMatched && (
                <button
                  type="button"
                  onClick={() => handleTabChange("logs")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentSubTab === "logs"
                      ? "bg-amber-500 text-slate-950 shadow-2xs"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Log İzleme Ekranı (Mysoft API)</span>
                </button>
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAddCompany}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Şirket Ekle</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* SUB-TAB 1: FIRMA PROFILI & RESMI BILGILER */}
      {currentSubTab === "profile" && (
        <form onSubmit={handleSaveProfile} noValidate className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {/* Üst Hızlı Kayıt & Durum Barı */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0f6bae]" />
              <span className="text-xs font-bold text-slate-800">
                Firma Profili, Adres ve Banka Bilgileri Yönetimi
              </span>
              {isSaved && (
                <span className="ml-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Değişiklikler Kaydedildi!
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSaveProfile()}
              className="bg-[#0f6bae] hover:bg-[#0a5287] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-2xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              <span>Firma Bilgilerini Kaydet</span>
            </button>
          </div>

          {/* 1. ADRES BİLGİLERİ */}
          <AddressSelector
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

          {/* 2. RESMİ ŞİRKET KİMLİK BİLGİLERİ */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0f6bae]" /> Resmi Şirket Kimlik Bilgileri
              </span>
              <div className="flex items-center gap-3">
                {isSaved && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Bilgiler Kaydedildi
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-normal">Değişiklik yapıldığında otomatik ve kalıcı olarak kaydedilir</span>
                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer transition-all flex items-center gap-1"
                >
                  <Save className="w-3 h-3 text-white" />
                  <span>Kaydet</span>
                </button>
              </div>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-bold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mükellefiyet Türü *
                </label>
                <select
                  value={profileForm.taxpayerType || "Anonim Şirket"}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAndAutoSaveProfile((prev) => ({ ...prev, taxpayerType: val }), true);
                  }}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-semibold cursor-pointer focus:bg-white focus:border-[#0f6bae]"
                >
                  {TAXPAYER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  VKN / TCKN No
                </label>
                <div className="flex gap-1.5">
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
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
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
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all shadow-2xs"
                    title="VKN/TCKN ile GİB Mükellef ve Adres Bilgilerini Getir"
                  >
                    {isFetchingTaxpayer ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Bilgileri Getir</span>
                  </button>
                </div>
                {vknFetchFeedback && (
                  <p className="text-[11px] font-semibold text-emerald-700 mt-1 animate-fadeIn">
                    {vknFetchFeedback}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
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
                  placeholder="Vergi Dairesi..."
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ticaret Sicil / MERSİS No
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Sicil No"
                    value={profileForm.tradeRegisterNo || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateAndAutoSaveProfile((prev) => ({ ...prev, tradeRegisterNo: val }));
                    }}
                    onBlur={() => handleSaveProfile()}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                  />
                  <input
                    type="text"
                    placeholder="MERSİS No"
                    value={profileForm.mersisNo || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateAndAutoSaveProfile((prev) => ({ ...prev, mersisNo: val }));
                    }}
                    onBlur={() => handleSaveProfile()}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                  />
                </div>
              </div>
            </div>

            {/* Adres Alanları: Mahalle, Cadde-Sokak, İlçe, İl ve Tam Açık Adres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mahalle
                </label>
                <input
                  type="text"
                  value={profileForm.neighborhood || ""}
                  onChange={(e) => {
                    const nextNeighborhood = e.target.value;
                    updateAndAutoSaveProfile((prev) => {
                      const nextAddress = compileStructuredAddress(
                        nextNeighborhood,
                        prev.street || prev.addressDetails?.street || "",
                        prev.district,
                        prev.city,
                        prev.buildingNo,
                        prev.doorNo,
                        prev.postalCode
                      ) || prev.address || "";
                      return {
                        ...prev,
                        neighborhood: nextNeighborhood,
                        address: nextAddress,
                        addressDetails: {
                          ...(prev.addressDetails || {
                            country: prev.country || "Türkiye",
                            city: prev.city || "",
                            district: prev.district || "",
                          }),
                          neighborhood: nextNeighborhood,
                          fullAddress: nextAddress,
                        },
                      };
                    });
                  }}
                  onBlur={() => handleSaveProfile()}
                  placeholder="Mahalle..."
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cadde - Sokak
                </label>
                <input
                  type="text"
                  value={profileForm.street || profileForm.addressDetails?.street || ""}
                  onChange={(e) => {
                    const nextStreet = e.target.value;
                    updateAndAutoSaveProfile((prev) => {
                      const nextAddress = compileStructuredAddress(
                        prev.neighborhood,
                        nextStreet,
                        prev.district,
                        prev.city,
                        prev.buildingNo,
                        prev.doorNo,
                        prev.postalCode
                      ) || prev.address || "";
                      return {
                        ...prev,
                        street: nextStreet,
                        address: nextAddress,
                        addressDetails: {
                          ...(prev.addressDetails || {
                            country: prev.country || "Türkiye",
                            city: prev.city || "",
                            district: prev.district || "",
                          }),
                          street: nextStreet,
                          fullAddress: nextAddress,
                        },
                      };
                    });
                  }}
                  onBlur={() => handleSaveProfile()}
                  placeholder="Cadde, Sokak, No..."
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  İlçe
                </label>
                <input
                  type="text"
                  value={profileForm.district || ""}
                  onChange={(e) => {
                    const nextDistrict = e.target.value;
                    updateAndAutoSaveProfile((prev) => {
                      const nextAddress = compileStructuredAddress(
                        prev.neighborhood,
                        prev.street || prev.addressDetails?.street || "",
                        nextDistrict,
                        prev.city,
                        prev.buildingNo,
                        prev.doorNo,
                        prev.postalCode
                      ) || appendCityDistrictToAddress(
                        prev.address || "",
                        prev.city,
                        nextDistrict,
                        prev.city,
                        prev.district
                      );
                      return {
                        ...prev,
                        district: nextDistrict,
                        address: nextAddress,
                        addressDetails: {
                          ...(prev.addressDetails || { country: prev.country || "Türkiye" }),
                          city: prev.city || "",
                          district: nextDistrict,
                          neighborhood: prev.neighborhood || "",
                          fullAddress: nextAddress,
                        },
                      };
                    });
                  }}
                  onBlur={() => handleSaveProfile()}
                  placeholder="İlçe..."
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  İl
                </label>
                <input
                  type="text"
                  value={profileForm.city || ""}
                  onChange={(e) => {
                    const nextCity = e.target.value;
                    updateAndAutoSaveProfile((prev) => {
                      const nextAddress = compileStructuredAddress(
                        prev.neighborhood,
                        prev.street || prev.addressDetails?.street || "",
                        prev.district,
                        nextCity,
                        prev.buildingNo,
                        prev.doorNo,
                        prev.postalCode
                      ) || appendCityDistrictToAddress(
                        prev.address || "",
                        nextCity,
                        prev.district,
                        prev.city,
                        prev.district
                      );
                      return {
                        ...prev,
                        city: nextCity,
                        address: nextAddress,
                        addressDetails: {
                          ...(prev.addressDetails || { country: prev.country || "Türkiye" }),
                          city: nextCity,
                          district: prev.district || "",
                          neighborhood: prev.neighborhood || "",
                          fullAddress: nextAddress,
                        },
                      };
                    });
                  }}
                  onBlur={() => handleSaveProfile()}
                  placeholder="İl..."
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tam Adres (Mahalle, Cadde-Sokak, İlçe, İl)
              </label>
              <textarea
                rows={2}
                value={profileForm.address || ""}
                onChange={(e) => {
                  const nextAddr = e.target.value;
                  updateAndAutoSaveProfile((prev) => ({
                    ...prev,
                    address: nextAddr,
                    addressDetails: {
                      ...(prev.addressDetails || {
                        country: prev.country || "Türkiye",
                        city: prev.city || "",
                        district: prev.district || "",
                        neighborhood: prev.neighborhood || "",
                      }),
                      fullAddress: nextAddr,
                    },
                  }));
                }}
                onBlur={() => handleSaveProfile()}
                placeholder="Mahalle, Cadde-Sokak, İlçe, İl..."
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-medium focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
              />
            </div>

            {isAdmin &&
              !isCompanyMysoftMatched(
                effectiveCompanies.find((c) => c.id === currentActiveCompanyId) || null,
                profileForm || settings,
              ) && (
                <div className="rounded-lg border border-[#c6cdff] bg-[#eaedff]/50 p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#131b2e] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#0f6bae]" />
                      Mysoft e-Belge mükellefi
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Demo firma VKN yerine erişim anahtarınıza bağlı gerçek mükellef VKN/TCKN
                      seçin. Fatura kesimi ve e-belge senkronu bu değeri kullanır.
                    </p>
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
                  {profileForm.tenantIdentifierNumber && (
                    <p className="text-[11px] font-mono text-[#0f6bae] font-bold">
                      Kayıtlı Mysoft tenantIdentifierNumber: {profileForm.tenantIdentifierNumber}
                    </p>
                  )}
                </div>
              )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#0f6bae]" /> Telefon
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAndAutoSaveProfile((prev) => ({ ...prev, phone: val }));
                  }}
                  onBlur={() => handleSaveProfile()}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#0f6bae]" /> E-posta
                </label>
                <input
                  type="text"
                  value={profileForm.email || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAndAutoSaveProfile((prev) => ({ ...prev, email: val }));
                  }}
                  onBlur={() => handleSaveProfile()}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Web Sitesi
                </label>
                <input
                  type="text"
                  value={profileForm.website || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAndAutoSaveProfile((prev) => ({ ...prev, website: val }));
                  }}
                  onBlur={() => handleSaveProfile()}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>
            </div>
          </div>

          {/* Banka IBAN & Hesap Adı Detayları */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Faturaya Basılacak Varsayılan Banka Bilgileri
                </h3>
                {isSaved && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Kaydedildi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(profileForm.defaultBankName || profileForm.defaultIban || profileForm.defaultBankAccountName) && (
                  <button
                    type="button"
                    onClick={() => {
                      const cleared = {
                        ...profileForm,
                        defaultBankName: "",
                        defaultBankAccountName: "",
                        defaultIban: "",
                      };
                      setProfileForm(cleared);
                      handleSaveProfile(cleared);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer transition-all flex items-center gap-1"
                    title="Varsayılan banka ve IBAN bilgilerini sil"
                  >
                    <Trash2 className="w-3 h-3 text-rose-700" />
                    <span>Banka Bilgilerini Sil</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer transition-all flex items-center gap-1"
                >
                  <Save className="w-3 h-3 text-white" />
                  <span>Banka & Firma Bilgilerini Kaydet</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Banka Adı (ve Şubesi)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Garanti BBVA - Levent Ticari Şb."
                  value={profileForm.defaultBankName || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAndAutoSaveProfile((prev) => ({ ...prev, defaultBankName: val }));
                  }}
                  onBlur={() => handleSaveProfile()}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hesap Sahibi (Alıcı / Hesap Adı Ünvanı)
                </label>
                <input
                  type="text"
                  placeholder={profileForm.companyTitle || profileForm.companyName || "Örn: Muavin Bilişim A.Ş."}
                  value={
                    profileForm.defaultBankAccountName !== undefined
                      ? profileForm.defaultBankAccountName
                      : profileForm.companyTitle || profileForm.companyName || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAndAutoSaveProfile((prev) => ({ ...prev, defaultBankAccountName: val }));
                  }}
                  onBlur={() => handleSaveProfile()}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-semibold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  IBAN Numarası
                </label>
                <input
                  type="text"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  value={profileForm.defaultBankIban || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAndAutoSaveProfile((prev) => ({ ...prev, defaultBankIban: val }));
                  }}
                  onBlur={() => handleSaveProfile()}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono font-bold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>
            </div>

            {/* Faturada Görünecek Banka Adı, Hesap Sahibi ve IBAN Canlı Gösterim Kartı */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-700" />
                  <span>Faturaya Basılacak Varsayılan Banka Bilgileri Gösterimi</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="bg-white/90 border border-sky-100 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-bold text-slate-500 block">Banka Adı:</span>
                    <span className="font-extrabold text-slate-900">
                      {profileForm.defaultBankName || "Belirtilmedi"}
                    </span>
                  </div>
                  <div className="bg-white/90 border border-sky-100 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-bold text-slate-500 block">Hesap Sahibi:</span>
                    <span className="font-extrabold text-slate-900">
                      {profileForm.defaultBankAccountName ||
                        profileForm.companyTitle ||
                        profileForm.companyName ||
                        "Belirtilmedi"}
                    </span>
                  </div>
                  <div className="bg-white/90 border border-sky-100 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-bold text-slate-500 block">IBAN:</span>
                    <span className="font-mono font-extrabold text-sky-950">
                      {profileForm.defaultBankIban || "Belirtilmedi"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. KURUMSAL LOGO & GOOGLE CLOUD CONSOLE ENTEGRASYONU */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#0f6bae]" />
                  Kurumsal Logo & Google Cloud Console Entegrasyonu
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Logonuz Google Cloud Console Firestore veritabanı (<code>system_settings/branding</code>) üzerinden canlı olarak senkronize edilir.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Console Bağlı
                </span>
              </div>
            </div>

            {cloudSyncStatus && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-[#0f6bae] text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cloudSyncStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Logo Önizleme Kartları */}
              <div className="lg:col-span-5 space-y-3">
                <label className="block font-bold text-slate-700">
                  Canlı Şirket Logosu Önizleme ({profileForm.companyName || "Aktif Şirket"})
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Koyu Arka Plan Önizleme */}
                  <div className="bg-[#0A192F] p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center gap-2 min-h-[110px] shadow-xs overflow-hidden">
                    <Logo
                      size="lg"
                      src={profileForm.logoUrl || "/logo.svg"}
                      scale={profileForm.logoScale ?? 1}
                    />
                    <span className="text-[10px] font-semibold text-slate-400">Koyu Tema (Sidebar)</span>
                  </div>

                  {/* Açık Arka Plan Önizleme */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center gap-2 min-h-[110px] shadow-xs overflow-hidden">
                    <Logo
                      size="lg"
                      src={profileForm.logoUrl || "/logo.svg"}
                      scale={profileForm.logoScale ?? 1}
                    />
                    <span className="text-[10px] font-semibold text-slate-500">Açık Tema (Fatura / Belge)</span>
                  </div>
                </div>

                {/* Muavin Logosuna Büyült veya Küçült Kontrol Kutusu */}
                <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800">
                      Muavin Logosuna Büyült / Küçült
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#0f6bae] text-white font-mono text-[10px] font-bold">
                      %{Math.round(clampLogoScale(profileForm.logoScale ?? 1) * 100)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustLogoScale(clampLogoScale(profileForm.logoScale ?? 1) - 0.1)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
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
                      className="px-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-[#0f6bae] rounded-lg text-[10px] font-bold cursor-pointer"
                      title="Tam Muavin Logosu Boyutuna Eşitle (%100)"
                    >
                      %100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustLogoScale(clampLogoScale(profileForm.logoScale ?? 1) + 0.1)}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      + Büyült
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Yüklenen logo otomatik olarak Muavin logosu (200x50 px) çerçevesine sığdırılır; buradan büyütebilir veya küçültebilirsiniz.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Cloud Veritabanı:</span>
                    <span className="font-mono text-slate-800 font-semibold truncate max-w-[180px]">
                      {cloudBranding?.databaseId || "ai-studio-muavinnmuhasebep"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Koleksiyon Yolu:</span>
                    <span className="font-mono text-[#0f6bae] font-semibold">system_settings / branding</span>
                  </div>
                  {cloudBranding?.updatedAt && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Son Senkronizasyon:</span>
                      <span className="text-slate-700 font-medium">
                        {new Date(cloudBranding.updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Bilgisayardan Yükleme, URL ve Cloud İşlemleri */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-[#0f6bae]" />
                        Şirkete Özel Logo Yükle ({profileForm.companyName || "Aktif Şirket"})
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Bilgisayarınızdaki PNG, JPG, WEBP veya SVG formatındaki şirket logonuzu seçin; Muavin logosu boyutuna otomatik büyültülür/küçültülür.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0f6bae] hover:bg-[#0a5287] text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Bilgisayardan Logo Seç & Yükle</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Logo Dosya Yolu veya Cloud Depolama URL'si
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={
                        profileForm.logoUrl?.startsWith("data:")
                          ? "Bilgisayardan Yüklenen Özel Logo (Base64 Görsel)"
                          : profileForm.logoUrl || "/logo.svg"
                      }
                      onChange={(e) => {
                        if (!e.target.value.startsWith("Bilgisayardan Yüklenen")) {
                          setProfileForm({ ...profileForm, logoUrl: e.target.value });
                        }
                      }}
                      placeholder="/logo.svg veya https://storage.googleapis.com/..."
                      className="flex-1 bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono text-xs focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const resetProfile = { ...profileForm, logoUrl: "/logo.svg" };
                        setProfileForm(resetProfile);
                        onSaveSettings({ ...settings, ...resetProfile });
                      }}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-slate-200"
                      title="Varsayılan Kurumsal Vektör Logoyu Seç"
                    >
                      Varsayılan
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bilgisayardan görsel yükleyebilir veya Google Cloud Storage bucket URL'si / SVG dosya yolu girebilirsiniz.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFetchFromCloudConsole}
                    disabled={cloudLogoLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0f6bae] hover:bg-[#0a5287] text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cloudLogoLoading ? "animate-spin" : ""}`} />
                    <span>Cloud Console'den Çek</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToCloudConsole}
                    disabled={cloudLogoLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Cloud className="w-3.5 h-3.5 text-[#83b8ff]" />
                    <span>Cloud Console'a Kaydet</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action for Profile */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-2xs">
            {isSaved ? (
              <span className="text-xs font-semibold text-[#0d7f56] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Firma bilgileri ve detaylı adres başarıyla kaydedildi!
              </span>
            ) : (
              <span className="text-xs text-slate-600 font-medium">
                Firma profili ve adres değişikliklerinizi kaydetmek için butona basınız.
              </span>
            )}

            <button
              type="submit"
              className="bg-[#0f6bae] hover:bg-[#0a5287] text-white font-semibold px-6 py-2.5 rounded-md shadow-2xs cursor-pointer transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Firma Bilgilerini Kaydet</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB: E-İŞLEMLER (GİB, SGK, E-DEVLET VE KURUM ŞİFRELERİ) */}
      {(false as any) && (
        <form onSubmit={handleSaveCredentials} className="space-y-6">
          {/* E-İşlemler Üst Bilgilendirme & Hızlı Portal Bağlantıları */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#eaedff] text-[#0f6bae] border border-[#c6cdff] text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                    E-İşlemler Modülü
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                    Resmi Kurum Portalları
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0f6bae]" />
                  E-İşlemler, GİB, SGK ve Şirket Müdürü E-Devlet Şifreleri
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vergi dairesi, SGK işveren portalı ve şirket müdürünün e-Devlet giriş şifrelerini tek bir güvenli panelden yönetin.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGibModalOpen(true)}
                  className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Dijital Vergi Dairesi
                </button>
              </div>
            </div>

            {/* Hızlı Portal Başlatıcı Kartları */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#0f6bae]" />
                Sık Kullanılan Resmi E-Devlet ve Kurum Portalları
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <a
                  href="https://dijital.gib.gov.tr"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 hover:bg-red-50/60 border border-slate-200/80 hover:border-red-200 text-slate-700 hover:text-red-700 transition-all group"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">Dijital Vergi Dairesi</div>
                    <div className="text-[10px] text-slate-400 group-hover:text-red-500 truncate">dijital.gib.gov.tr</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 shrink-0 ml-1" />
                </a>

                <a
                  href="https://giris.turkiye.gov.tr/Giris/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-all group"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">e-Devlet Kapısı</div>
                    <div className="text-[10px] text-slate-400 group-hover:text-blue-500 truncate">turkiye.gov.tr</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                </a>

                <a
                  href="https://uyg.sgk.gov.tr/IsverenSistemi/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 transition-all group"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">SGK İşveren Sistemi</div>
                    <div className="text-[10px] text-slate-400 group-hover:text-emerald-500 truncate">uyg.sgk.gov.tr</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1" />
                </a>

                <a
                  href="https://earsivportal.efatura.gov.tr/intragiris.html"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 text-slate-700 hover:text-amber-700 transition-all group"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">GİB e-Arşiv Portalı</div>
                    <div className="text-[10px] text-slate-400 group-hover:text-amber-500 truncate">earsivportal.gov.tr</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 ml-1" />
                </a>

                <a
                  href="https://mersis.gtb.gov.tr/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 hover:bg-[#eaedff]/60 border border-slate-200/80 hover:border-[#c6cdff] text-slate-700 hover:text-[#0f6bae] transition-all group"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">MERSİS Portalı</div>
                    <div className="text-[10px] text-slate-400 group-hover:text-[#0f6bae] truncate">mersis.gtb.gov.tr</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0f6bae] shrink-0 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* 1. BÖLÜM: VERGİ DAİRESİ & GİB PORTAL ŞİFRELERİ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" />
                  1. Vergi Dairesi & GİB Portal Şifreleri
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  İnteraktif Vergi Dairesi, e-Beyanname ve Dijital Vergi Dairesi giriş bilgileriniz.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGibModalOpen(true)}
                  className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Dijital VD Bağlan
                </button>

                <button
                  type="button"
                  onClick={() => setShowTaxPasswords(!showTaxPasswords)}
                  className="text-xs font-bold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {showTaxPasswords ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Şifreleri Gizle
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-red-600" /> Şifreleri Göster
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-red-600" /> Kullanıcı Kodu
                  </span>
                  {profileForm.taxCredentials?.userCode && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.taxCredentials?.userCode, "tax_userCode")}
                      className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "tax_userCode" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="GİB / İnteraktif VD Kullanıcı Kodu"
                  value={profileForm.taxCredentials?.userCode || ""}
                  onChange={(e) => handleTaxCredChange("userCode", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-red-600" /> Parola
                  </span>
                  {profileForm.taxCredentials?.password && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.taxCredentials?.password, "tax_password")}
                      className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "tax_password" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type={showTaxPasswords ? "text" : "password"}
                  placeholder="GİB Parola"
                  value={profileForm.taxCredentials?.password || ""}
                  onChange={(e) => handleTaxCredChange("password", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-red-600" /> Şifre (e-Beyanname)
                  </span>
                  {profileForm.taxCredentials?.codeSecret && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.taxCredentials?.codeSecret, "tax_codeSecret")}
                      className="text-[10px] text-slate-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "tax_codeSecret" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type={showTaxPasswords ? "text" : "password"}
                  placeholder="e-Beyanname / İnternet VD Şifresi"
                  value={profileForm.taxCredentials?.codeSecret || ""}
                  onChange={(e) => handleTaxCredChange("codeSecret", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 2. BÖLÜM: SGK (SOSYAL GÜVENLİK KURUMU) ŞİFRELERİ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  2. SGK (Sosyal Güvenlik Kurumu) Şifreleri
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  e-SGK, e-Bildirge v2, İşveren Sistemi ve MUHSGK bildirim şifreleriniz.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://uyg.sgk.gov.tr/IsverenSistemi/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> e-SGK İşveren Portalı
                </a>

                <button
                  type="button"
                  onClick={() => setShowSgkPasswords(!showSgkPasswords)}
                  className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {showSgkPasswords ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Şifreleri Gizle
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" /> Şifreleri Göster
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> SGK İşyeri Sicil No
                  </span>
                  {profileForm.sgkCredentials?.workplaceRegistrationNo && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.sgkCredentials?.workplaceRegistrationNo, "sgk_regNo")}
                      className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "sgk_regNo" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="2.8470.01.01.1029384..."
                  value={profileForm.sgkCredentials?.workplaceRegistrationNo || ""}
                  onChange={(e) => handleSgkCredChange("workplaceRegistrationNo", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Kullanıcı Kodu
                  </span>
                  {profileForm.sgkCredentials?.userCode && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.sgkCredentials?.userCode, "sgk_userCode")}
                      className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "sgk_userCode" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="SGK e-Bildirge Kullanıcı Kodu"
                  value={profileForm.sgkCredentials?.userCode || ""}
                  onChange={(e) => handleSgkCredChange("userCode", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-600" /> Sistem Şifresi
                  </span>
                  {profileForm.sgkCredentials?.systemPassword && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.sgkCredentials?.systemPassword, "sgk_sysPass")}
                      className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "sgk_sysPass" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type={showSgkPasswords ? "text" : "password"}
                  placeholder="e-SGK Sistem Şifresi"
                  value={profileForm.sgkCredentials?.systemPassword || ""}
                  onChange={(e) => handleSgkCredChange("systemPassword", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" /> İşyeri Şifresi
                  </span>
                  {profileForm.sgkCredentials?.workplacePassword && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.sgkCredentials?.workplacePassword, "sgk_wpPass")}
                      className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "sgk_wpPass" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type={showSgkPasswords ? "text" : "password"}
                  placeholder="e-SGK İşyeri Şifresi"
                  value={profileForm.sgkCredentials?.workplacePassword || ""}
                  onChange={(e) => handleSgkCredChange("workplacePassword", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 3. BÖLÜM: ŞİRKET MÜDÜRÜ / YETKİLİSİ E-DEVLET ŞİFRELERİ (AYRI BÖLÜM) */}
          <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Yönetici & İmza Yetkilisi
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mt-1">
                  <Fingerprint className="w-4 h-4 text-blue-600" />
                  3. Şirket Müdürü / İmza Yetkilisi E-Devlet Şifreleri
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ticaret Sicil, MERSİS, e-İmza, Noter ve e-Devlet kurumsal yetkili işlemlerinde kullanılan şifre ve yetki bilgileri.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://giris.turkiye.gov.tr/Giris/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> e-Devlet Kapısına Git
                </a>

                <button
                  type="button"
                  onClick={() => setShowEDevletPasswords(!showEDevletPasswords)}
                  className="text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {showEDevletPasswords ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-600" /> Şifreleri Gizle
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-blue-600" /> Şifreleri Göster
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Müdür / Yetkili Adı Soyadı
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={profileForm.eDevletCredentials?.managerName || ""}
                  onChange={(e) => handleEDevletCredChange("managerName", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-blue-600" /> T.C. Kimlik Numarası
                  </span>
                  {profileForm.eDevletCredentials?.tcKimlikNo && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.eDevletCredentials?.tcKimlikNo, "edevlet_tckn")}
                      className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "edevlet_tckn" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="11 Haneli TCKN"
                  value={profileForm.eDevletCredentials?.tcKimlikNo || ""}
                  onChange={(e) => handleEDevletCredChange("tcKimlikNo", e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-blue-600" /> e-Devlet Şifresi
                  </span>
                  {profileForm.eDevletCredentials?.eDevletPassword && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.eDevletCredentials?.eDevletPassword, "edevlet_pass")}
                      className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "edevlet_pass" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type={showEDevletPasswords ? "text" : "password"}
                  placeholder="e-Devlet Giriş Şifresi"
                  value={profileForm.eDevletCredentials?.eDevletPassword || ""}
                  onChange={(e) => handleEDevletCredChange("eDevletPassword", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Mobil İmza / Telefon
                  </span>
                  {profileForm.eDevletCredentials?.mobileSignaturePhone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(profileForm.eDevletCredentials?.mobileSignaturePhone, "edevlet_phone")}
                      className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-0.5 cursor-pointer font-normal"
                    >
                      {copiedKey === "edevlet_phone" ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCheck className="w-3 h-3" /> Kopyalandı
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Kopyala
                        </span>
                      )}
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="+90 (5xx) xxx xx xx"
                  value={profileForm.eDevletCredentials?.mobileSignaturePhone || ""}
                  onChange={(e) => handleEDevletCredChange("mobileSignaturePhone", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono text-xs transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> İmza Sirküleri / Yetki Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={profileForm.eDevletCredentials?.validUntil || ""}
                  onChange={(e) => handleEDevletCredChange("validUntil", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" /> Yetki Kapsamı ve Özel Notlar
                </label>
                <input
                  type="text"
                  placeholder="Örn: A Grubu Münferit İmza Yetkilisi (Şirket Müdürü / YK Başkanı)"
                  value={profileForm.eDevletCredentials?.notes || ""}
                  onChange={(e) => handleEDevletCredChange("notes", e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs transition-colors"
                />
              </div>
            </div>

            {/* Güvenlik Notu */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-slate-700">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-blue-900">Güvenlik & Gizlilik Bilgilendirmesi:</span> Kurumsal e-işlemler, vergi dairesi ve e-Devlet şifreleri şirketinizin muhasebe ve resmi işlemlerini kolaylaştırmak amacıyla güvenli veritabanınızda saklanır. Yetkisiz kişilerle paylaşılmamalıdır.
              </div>
            </div>
          </div>

          {/* Submit Action for E-İşlemler */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-2xs">
            {isCredSaved ? (
              <span className="text-xs font-semibold text-[#0d7f56] flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                GİB, SGK ve e-Devlet şifreleri başarıyla kaydedildi!
              </span>
            ) : (
              <span className="text-xs text-slate-600 font-medium">
                Yapılan tüm kurum ve şifre değişikliklerini kaydetmek için butona basınız.
              </span>
            )}

            <button
              type="submit"
              className="bg-[#0f6bae] hover:bg-[#0a5287] text-white font-semibold px-6 py-2.5 rounded-md shadow-2xs cursor-pointer transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-white" />
              <span>E-İşlem ve Kurum Şifrelerini Kaydet</span>
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Şube adı, kodu, şehir veya ilçe ara..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-[#0f6bae]"
              />
            </div>

            <div className="flex items-center gap-2">
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
                onClick={() => handleOpenBranchModal()}
                className="bg-[#0f6bae] hover:bg-[#0a5287] text-white font-semibold text-xs px-4 py-2.5 rounded-md flex items-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Yeni Şube Ekle</span>
              </button>
            </div>
          </div>

          {/* Branch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white rounded-lg border border-slate-200 hover:border-[#0f6bae]/40 shadow-2xs hover:shadow-xs transition-all p-5 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-[#eaedff] text-[#0f6bae] border border-[#c6cdff] rounded-md font-mono text-xs font-black">
                      {branch.code}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        {branch.name}
                        {branch.isMain && (
                          <span className="bg-[#eaedff] text-[#0f6bae] text-[10px] font-bold px-2 py-0.5 rounded border border-[#c6cdff]">
                            Ana Şube
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {branch.address.district} / {branch.address.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenBranchModal(branch)}
                      className="p-1.5 text-slate-400 hover:text-[#0f6bae] hover:bg-[#eaedff] rounded transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!branch.isMain && (
                      <button
                        onClick={() => {
                          if (confirm(`${branch.name} şubesini silmek istediğinize emin misiniz?`)) {
                            onDeleteBranch(branch.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {branch.managerName && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{branch.managerName}</span>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}

                  {branch.email && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{branch.email}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-[11px] pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0f6bae] shrink-0 mt-0.5" />
                    <span className="text-slate-700 leading-snug">
                      {branch.address.fullAddress ||
                        `${branch.address.street || ""} ${branch.address.neighborhood || ""} ${branch.address.district}/${branch.address.city}`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                  <span>Kayıt: {branch.createdAt}</span>
                  <span
                    className={`font-extrabold px-2 py-0.5 rounded-full ${
                      branch.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {branch.status === "active" ? "Aktif Şube" : "Pasif"}
                  </span>
                </div>
              </div>
            ))}

            {filteredBranches.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                Arama kriterlerine uygun şube bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DEPOLAR (WAREHOUSES) */}
      {currentSubTab === "warehouses" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Depo adı, kodu, bağlı şube veya konum ara..."
                value={warehouseSearch}
                onChange={(e) => setWarehouseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
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
                onClick={() => handleOpenWarehouseModal()}
                className="bg-[#0f6bae] hover:bg-[#0a5287] text-white font-semibold text-xs px-4 py-2.5 rounded-md flex items-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Yeni Depo Ekle</span>
              </button>
            </div>
          </div>

          {/* Warehouse Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarehouses.map((wh) => (
              <div
                key={wh.id}
                className="bg-white rounded-lg border border-slate-200 hover:border-[#0f6bae]/40 shadow-2xs hover:shadow-xs transition-all p-5 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-mono text-xs font-black">
                      {wh.code}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{wh.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <Store className="w-3 h-3 text-slate-400" />
                        {wh.branchName || "Şube Bağlantısız"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenWarehouseModal(wh)}
                      className="p-1.5 text-slate-400 hover:text-[#0f6bae] hover:bg-[#eaedff] rounded transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${wh.name} deposunu silmek istediğinize emin misiniz?`)) {
                          onDeleteWarehouse(wh.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-[#eaedff] text-[#0f6bae] text-[10px] font-bold px-2.5 py-0.5 rounded border border-[#c6cdff]">
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

                  {wh.capacityM2 && (
                    <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      {wh.capacityM2} m² Kapasite
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {wh.managerName && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{wh.managerName}</span>
                    </div>
                  )}

                  {wh.phone && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{wh.phone}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-[11px] pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0f6bae] shrink-0 mt-0.5" />
                    <span className="text-slate-700 leading-snug">
                      {wh.address.fullAddress ||
                        `${wh.address.street || ""} ${wh.address.neighborhood || ""} ${wh.address.district}/${wh.address.city}`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                  <span>Eklenme: {wh.createdAt}</span>
                  <span
                    className={`font-extrabold px-2 py-0.5 rounded-full ${
                      wh.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {wh.status === "active" ? "Aktif Depo" : "Pasif"}
                  </span>
                </div>
              </div>
            ))}

            {filteredWarehouses.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                Arama kriterlerine uygun depo bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SISTEM AYARLARI */}
      {currentSubTab === "settings" && (
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
      {currentSubTab === "companies" && (
        !isAdmin ? (
          <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl border border-amber-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Çoklu Şirket Tanımı Yetki Kısıtlaması
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Çoklu şirket tanımlama, yeni şirket ekleme ve şirket yapılandırma işlemleri yalnızca <strong>Admin</strong> ve <strong>Sistem Yöneticisi</strong> yetkisine sahip kullanıcılar tarafından yapılabilir.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0f6bae]" />
                Kayıtlı Şirketler & Çoklu Şirket Yönetimi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tüm şirketlerinizi yönetin. Her yeni eklenen şirkete tüm modüller (Faturalar, Cariler, Bankalar, Stoklar vb.) <strong>tamamen boş ve izole</strong> olarak gelir.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddCompany}
              className="px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Şirket Ekle</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {effectiveCompanies.map((comp) => {
              const isActive = comp.id === currentActiveCompanyId;
              return (
                <div
                  key={comp.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                    isActive
                      ? "border-[#0f6bae] ring-2 ring-[#0f6bae]/20 bg-gradient-to-b from-[#f0f7fc] to-white"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          isActive ? "bg-[#0f6bae] text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          <Building className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {comp.companyName}
                          </h4>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {comp.companyType === "anonim" ? "Anonim Şirket (A.Ş.)" : comp.companyType === "sahis" ? "Şahıs Firması" : "Limited Şirket (Ltd. Şti.)"}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-[#0f6bae] hover:text-white text-slate-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Bu Şirkete Geç
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 line-clamp-2">
                      {comp.companyTitle || comp.companyName}
                    </div>

                    {/* VKN & TCKN details */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-150 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Vergi Dairesi:</span>
                        <span className="font-bold text-slate-800">{comp.taxOffice || "Merkez"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">VKN (10 hane):</span>
                        <span className="font-mono font-bold text-slate-800">{comp.vkn || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">TCKN (11 hane):</span>
                        <span className="font-mono font-bold text-slate-800">{comp.tckn || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-indigo-600 font-semibold">Mysoft Eşleşme:</span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {comp.tenantIdentifierNumber || comp.vkn || comp.tckn || "Eşleşmedi"} ({comp.mysoftMatchedType?.toUpperCase() || "VKN"})
                        </span>
                      </div>
                    </div>

                    {/* Modül Durumu Bilgisi */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {comp.moduleRestrictionEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                          🔒 Kısıtlı Modül ({comp.allowedModules?.length || 0} / 19)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                          ✨ Tüm Modüller Açık (19)
                        </span>
                      )}
                      {comp.id !== "comp_default" && (
                        <span className="text-slate-500 flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          İzole Temiz Veri
                        </span>
                      )}
                    </div>

                    {/* Giriş Bilgileri Rozeti */}
                    {comp.loginUsername && (
                      <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-1.5 truncate">
                          <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Giriş:</span>
                          <span className="font-mono font-bold">{comp.loginUsername}</span>
                          {comp.loginPasswordPlain && (
                            <span className="font-mono text-[10px] text-slate-500">({comp.loginPasswordPlain})</span>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                          {comp.loginRole || "Giriş Yetkili"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenMysoftMatch(comp)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Mysoft VKN / TCKN Eşleştirmesini Düzenle"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Mysoft Eşle</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditCompany(comp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Şirketi Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {!isProtectedCompanyId(comp.id) && !comp.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCompanyItem(comp.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Şirketi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Şirket Sil</span>
                      </button>
                    ) : (
                      <span
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 cursor-not-allowed"
                        title="Mevcut ana şirketler silinemez"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Korunan Şirket</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )
      )}

      {/* SUB-TAB: MYSOFT ENTEGRASYON & VKN/TCKN EŞLEŞTİRME MASASI */}
      {currentSubTab === "mysoft" && (
        !isAdmin ? (
          <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl border border-amber-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Yönetici Yetkisi Gerekli
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mysoft şirket eşleştirmesi ve iş ortakları yönetimi münhasıran <strong>Admin / Sistem Yöneticisi</strong> yetkisindedir.
            </p>
          </div>
        ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  Mysoft e-Belge Entegrasyonu — VKN / TCKN Eşleştirme Masası
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Yönetici (Admin) olarak sistemdeki şirketlerin Vergi Kimlik Numarası (VKN) ve T.C. Kimlik Numarası (TCKN) eşleştirmesini yapabilir, Mysoft portal mükellef kimliğiyle bağlayabilirsiniz.
                </p>
              </div>

              {/* Company Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                  İşlem Yapılacak Şirket:
                </label>
                <select
                  value={selectedMysoftCompId}
                  onChange={(e) => setSelectedMysoftCompId(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  {effectiveCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} {c.id === currentActiveCompanyId ? "(Aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Company Mapping Detail */}
            {(() => {
              const selectedComp = effectiveCompanies.find((c) => c.id === selectedMysoftCompId) || effectiveCompanies[0];
              if (!selectedComp) return null;
              return (
                <div className="bg-gradient-to-br from-indigo-50/50 via-slate-50/70 to-blue-50/40 p-5 rounded-2xl border border-indigo-150 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                        Seçili Şirket
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        {selectedComp.companyTitle || selectedComp.companyName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Vergi Dairesi: {selectedComp.taxOffice || "Merkez"} • İl: {selectedComp.city || "İstanbul"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenMysoftMatch(selectedComp)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>VKN & TCKN Eşleştirmesini Düzenle</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-semibold mb-1">
                        Kurumsal VKN (10 Hane)
                      </div>
                      <div className="text-base font-mono font-bold text-slate-900">
                        {selectedComp.vkn || "Girilmedi"}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Tüzel Kişi Vergi No</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500 font-semibold mb-1">
                        Yetkili TCKN (11 Hane)
                      </div>
                      <div className="text-base font-mono font-bold text-slate-900">
                        {selectedComp.tckn || "Girilmedi"}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Gerçek Kişi / Şahıs No</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-indigo-200">
                      <div className="text-[11px] text-indigo-600 font-bold mb-1">
                        Aktif Mysoft Eşleşmesi
                      </div>
                      <div className="text-base font-mono font-bold text-indigo-900">
                        {selectedComp.tenantIdentifierNumber || selectedComp.vkn || selectedComp.tckn || "Eşleşmedi"}
                      </div>
                      <span className="text-[10px] text-indigo-500 mt-1 block font-semibold">
                        Kullanılan Tip: {selectedComp.mysoftMatchedType?.toUpperCase() || "VKN"}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-blue-200">
                      <div className="text-[11px] text-blue-700 font-bold mb-1 flex items-center justify-between">
                        <span>e-Fatura Ön Eki</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-mono font-bold">
                          {selectedComp.eFaturaPrefix || "GIB"}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-blue-950 truncate mt-1">
                        {selectedComp.eFaturaNextNumber || `${selectedComp.eFaturaPrefix || "GIB"}2026000000001`}
                      </div>
                      <span className="text-[10px] text-blue-600 mt-1 block">Sıradaki Ardışık No</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-purple-200">
                      <div className="text-[11px] text-purple-700 font-bold mb-1 flex items-center justify-between">
                        <span>e-Arşiv Ön Eki</span>
                        <span className="text-[9px] bg-purple-100 text-purple-800 px-1 py-0.2 rounded font-mono font-bold">
                          {selectedComp.eArsivPrefix || "EAR"}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-purple-950 truncate mt-1">
                        {selectedComp.eArsivNextNumber || `${selectedComp.eArsivPrefix || "EAR"}2026000000001`}
                      </div>
                      <span className="text-[10px] text-purple-600 mt-1 block">Sıradaki Ardışık No</span>
                    </div>
                  </div>

                  {/* Mysoft Tenant Picker for this company */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-indigo-600" />
                      Mysoft Mükellef Rehberinden Seç veya Manuel Eşle
                    </h5>
                    <MysoftTenantPicker
                      variant="compact"
                      value={selectedComp.tenantIdentifierNumber || selectedComp.vkn || selectedComp.tckn || ""}
                      hintVkn={selectedComp.tenantIdentifierNumber || selectedComp.vkn || selectedComp.tckn}
                      onSelect={(newVkn) => {
                        const currentIdentifier =
                          selectedComp.tenantIdentifierNumber || selectedComp.vkn || selectedComp.tckn || "";
                        if (newVkn && newVkn !== currentIdentifier) {
                          const updated = {
                            ...selectedComp,
                            tenantIdentifierNumber: newVkn,
                            mysoftStatus: "verified" as const,
                            vkn: newVkn.length === 10 ? newVkn : selectedComp.vkn,
                            tckn: newVkn.length === 11 ? newVkn : selectedComp.tckn,
                          };
                          handleSaveCompanyFromModal(updated, false);
                          writeStoredMysoftTenantVkn(newVkn);
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        )
      )}

      {/* Şube Ekle / Düzenle Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#131b2e] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0f6bae] flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingBranch ? "Şube Bilgilerini Düzenle" : "Yeni Şube Tanımla"}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {settings.companyName || "İşletme"} bünyesine yeni şube kaydı ekleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseBranch}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBranch} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şube Kodu *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.code || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    placeholder="SUB-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Şube Adı *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.name || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="Örn: Merkez Şube, Kadıköy Şubesi..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şube Sorumlusu</label>
                  <input
                    type="text"
                    value={branchForm.managerName || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                    placeholder="Ad Soyad"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={branchForm.phone || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+90 (212) 000 00 00"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-Posta</label>
                  <input
                    type="email"
                    value={branchForm.email || ""}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    placeholder="sube@firma.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!branchForm.isMain}
                    onChange={(e) => setBranchForm({ ...branchForm, isMain: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#0f6bae] focus:ring-[#0f6bae]"
                  />
                  <span>Ana / Merkez Şube Olarak İşaretle</span>
                </label>

                <div className="flex items-center justify-end gap-2">
                  <span className="font-bold text-slate-700">Durum:</span>
                  <select
                    value={branchForm.status || "active"}
                    onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value as "active" | "passive" })}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900"
                  >
                    <option value="active">Aktif</option>
                    <option value="passive">Pasif</option>
                  </select>
                </div>
              </div>

              <AddressSelector
                title="Şube Adres Bilgileri"
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

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseBranch}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0f6bae] hover:bg-[#0a5287] text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBranch ? "Şubeyi Güncelle" : "Şubeyi Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Depo Ekle / Düzenle Modal */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#131b2e] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0f6bae] flex items-center justify-center">
                  <WarehouseIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingWarehouse ? "Depo Bilgilerini Düzenle" : "Yeni Depo Tanımla"}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {settings.companyName || "İşletme"} için yeni stok ve lojistik deposu ekleyin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseWarehouse}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWarehouse} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Depo Kodu *</label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.code || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    placeholder="DEP-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Depo Adı *</label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.name || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    placeholder="Örn: Merkez Ana Depo, Gebze Lojistik Depo..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Depo Tipi</label>
                  <select
                    value={warehouseForm.type || "main"}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, type: e.target.value as Warehouse["type"] })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900"
                  >
                    <option value="main">Ana Depo</option>
                    <option value="regional">Bölge Deposu</option>
                    <option value="transit">Transit Lojistik</option>
                    <option value="cold_storage">Soğuk Hava Deposu</option>
                    <option value="bonded">Antrepo / Serbest Depo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bağlı Şube</label>
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
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900"
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
                  <label className="block font-bold text-slate-700 mb-1">Kapasite (m²)</label>
                  <input
                    type="number"
                    value={warehouseForm.capacityM2 ?? 1000}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, capacityM2: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Depo Sorumlusu</label>
                  <input
                    type="text"
                    value={warehouseForm.managerName || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, managerName: e.target.value })}
                    placeholder="Ad Soyad"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">İletişim Telefonu</label>
                  <input
                    type="text"
                    value={warehouseForm.phone || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })}
                    placeholder="+90 (212) 000 00 00"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durum</label>
                  <select
                    value={warehouseForm.status || "active"}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, status: e.target.value as "active" | "passive" })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="active">Aktif Depo</option>
                    <option value="passive">Pasif</option>
                  </select>
                </div>
              </div>

              <AddressSelector
                title="Depo Adres Bilgileri"
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

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseWarehouse}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0f6bae] hover:bg-[#0a5287] text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingWarehouse ? "Depoyu Güncelle" : "Depoyu Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Şirket Silme Onay Modalı */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-rose-700 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Şirket Silme Onayı</h3>
                  <p className="text-xs text-rose-100">Seçili şirket sistemden kaldırılacak</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="p-1.5 text-rose-100 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700">
                <strong>{companyToDelete.companyName}</strong> ({companyToDelete.companyTitle || companyToDelete.vkn || companyToDelete.tckn}) şirketini ve yapılandırmasını silmek istediğinize emin misiniz?
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCompanyItem}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Evet, Şirketi Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: LOG İZLEME EKRANI (MYSOFT API & TEKNİK HATA KONSOLU) */}
      {currentSubTab === "logs" && (() => {
        const activeCompObj = effectiveCompanies.find((c) => c.id === currentActiveCompanyId) || null;
        const isMysoftMatched = isCompanyMysoftMatched(activeCompObj, profileForm || settings);

        if (!isMysoftMatched) {
          return (
            <div className="p-8 max-w-xl mx-auto bg-white rounded-2xl border border-amber-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Mysoft Eşleştirmesi Bulunamadı
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log İzleme Ekranı (Mysoft API) bölümü yalnızca <strong>Mysoft VKN/TCKN eşleştirmesi yapılan firma</strong> için görüntülenmektedir. Lütfen önce Sistem Ayarları altından Mysoft VKN/TCKN eşleştirmesini tamamlayın.
              </p>
              <button
                type="button"
                onClick={() => handleTabChange("mysoft")}
                className="px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Mysoft VKN/TCKN Eşleştirme Ekranına Git</span>
              </button>
            </div>
          );
        }

        return (
          <AdminMysoftLogMonitorPanel
            companyName={profileForm.companyName || settings.companyName}
            companyTaxNumber={
              profileForm.tenantIdentifierNumber ||
              profileForm.taxNumber ||
              settings.tenantIdentifierNumber ||
              settings.taxNumber
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
