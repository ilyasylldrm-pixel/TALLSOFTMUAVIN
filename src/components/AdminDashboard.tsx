import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  HardDrive,
  FileText,
  Search,
  Calendar,
  Eye,
  EyeOff,
  Download,
  Trash2,
  X,
  CheckCircle2,
  Lock,
  Building,
  Mail,
  RefreshCw,
  Image,
  FileSpreadsheet,
  File,
  UserPlus,
  UserMinus,
  Sliders,
  Check,
  KeyRound,
  Phone,
  Building2,
  AlertCircle,
  Copy,
  Layers,
  Sparkles,
  Table,
  CheckSquare,
  Square,
  ShieldCheck,
  Save,
  Wallet,
  UserCheck,
  ShoppingCart,
  PackageIcon,
  BarChart3,
  Settings,
  RotateCcw,
  Undo2,
  ExternalLink,
  Calculator,
  Radio,
  Globe,
  ArrowRight,
  Edit2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { UserProfile, BRAND_LOGOS } from "./AuthModal";
import { CompanyModal } from "./CompanyModal";
import {
  getCompaniesList,
  getActiveCompanyId,
  addCompanyItem,
  updateCompanyItem,
  deleteCompanyItem,
  setActiveCompanyId,
  safeGetStorageItem,
  safeSetStorageItem,
} from "../utils/storage";
import { writeStoredMysoftTenantVkn } from "../utils/mysoftTenantStorage";
import {
  getAllUsersProfiles,
  getAllFilesForAdmin,
  deleteUserFile,
  saveUserProfile,
  deleteUserProfile,
  deleteUserProfileAndData,
  UserProfileData,
  UserFileMetadata,
} from "../lib/firebase";
import {
  CompanyItem,
  ALL_APP_MODULES,
  AppModuleKey,
  AppModuleDefinition,
  getAllAppModulesWithCustom,
  isAdminOrSysAdmin,
  isKeyAllowedInList,
  toggleModuleSelectionWithSubModules,
  CUSTOM_MODULES_STORAGE_KEY,
} from "../types";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { PayrollParametersPanel } from "./PayrollParametersPanel";
import { AdminOverviewPanel } from "./AdminOverviewPanel";
import { AdminBroadcastPanel } from "./AdminBroadcastPanel";
import { AdminAuditPanel } from "./AdminAuditPanel";
import { AdminSyncStatusBar } from "./AdminSyncStatusBar";
import { logSystemAction, saveLocalDbSyncReport } from "../services/systemSyncService";
import { triggerFormErrorNotification } from "../context/FormErrorContext";

interface AdminDashboardProps {
  currentUser: UserProfile;
  companies?: CompanyItem[];
  activeCompanyId?: string;
  onSelectCompany?: (id: string) => void;
  onAddCompany?: (comp: CompanyItem, makeActiveImmediately?: boolean) => void;
  onUpdateCompany?: (comp: CompanyItem) => void;
  onDeleteCompany?: (id: string) => void;
}

export interface RolePreset {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  modules: AppModuleKey[];
}

export const STAFF_ROLE_PRESETS: RolePreset[] = [
  {
    id: "auto_tech",
    name: "Oto Servis Teknisyeni / Kabul",
    badge: "🚗 Oto Servis",
    color: "bg-[#eaedff] text-[#0f6bae] border-[#c6cdff]",
    description: "Araç kabul, teşhis, lift ve yedek parça yönetimi",
    modules: ["dashboard", "auto_service", "contacts", "products", "files"],
  },
  {
    id: "it_tech",
    name: "BT & Bilişim Teknikeri",
    badge: "💻 BT Servis",
    color: "bg-[#f1f5f9] text-[#334155] border-[#cbd5e1]",
    description: "Cihaz kabul, donanım onarım ve veri yedekleme takibi",
    modules: ["dashboard", "it_service", "contacts", "products", "files"],
  },
  {
    id: "appliance_tech",
    name: "Ev Aletleri & Klima Teknisyeni",
    badge: "❄️ Ev Aletleri Servis",
    color: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]",
    description: "Beyaz eşya ve klima bakım, randevu ve servis fişleri",
    modules: ["dashboard", "appliance_service", "contacts", "products", "files"],
  },
  {
    id: "service_manager",
    name: "Teknik Servisler Müdürü",
    badge: "🛠️ Servis Müdürü",
    color: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
    description: "Tüm teknik servis modülleri, cari, stok ve faturalandırma",
    modules: [
      "dashboard",
      "auto_service",
      "it_service",
      "appliance_service",
      "contacts",
      "products",
      "invoices",
      "orders_module",
      "reports",
      "files",
    ],
  },
  {
    id: "accounting",
    name: "Ön Muhasebe & Finans",
    badge: "💼 Ön Muhasebe",
    color: "bg-[#ecfdf5] text-[#0d7f56] border-[#a7f3d0]",
    description: "Faturalar, cari hesaplar, kasa/banka ve raporlar",
    modules: [
      "dashboard",
      "invoices",
      "orders_module",
      "contacts",
      "accounts",
      "products",
      "reports",
      "files",
    ],
  },
  {
    id: "full_admin",
    name: "Tam Yetkili Yönetici",
    badge: "👑 Tüm Modüller",
    color: "bg-[#131b2e] text-[#c6cdff] border-[#222a3d]",
    description: "Tüm sistem modüllerine ve raporlarına eksiksiz erişim",
    modules: ALL_APP_MODULES.map((m) => m.key),
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  companies,
  activeCompanyId,
  onSelectCompany,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "credentials" | "matrix" | "users" | "companies" | "files" | "payroll" | "broadcast" | "audit">("overview");
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [allFiles, setAllFiles] = useState<UserFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState(true);
  const [credentialSearch, setCredentialSearch] = useState("");

  // Companies Management State
  const [localCompanies, setLocalCompanies] = useState<CompanyItem[]>(() => companies || getCompaniesList());
  const [localActiveCompId, setLocalActiveCompId] = useState<string>(() => activeCompanyId || getActiveCompanyId());

  useEffect(() => {
    if (companies) setLocalCompanies(companies);
  }, [companies]);

  useEffect(() => {
    if (activeCompanyId) setLocalActiveCompId(activeCompanyId);
  }, [activeCompanyId]);

  const adminCompanies = companies || localCompanies;
  const adminActiveCompId = activeCompanyId || localActiveCompId;

  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [compModalMode, setCompModalMode] = useState<"create" | "edit" | "mysoft_match">("create");
  const [compToEdit, setCompToEdit] = useState<CompanyItem | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState("");

  const handleOpenAddCompany = () => {
    setCompToEdit(null);
    setCompModalMode("create");
    setIsCompModalOpen(true);
  };

  const handleOpenEditCompany = (comp: CompanyItem) => {
    setCompToEdit(comp);
    setCompModalMode("edit");
    setIsCompModalOpen(true);
  };

  const handleOpenMysoftMatch = (comp: CompanyItem) => {
    setCompToEdit(comp);
    setCompModalMode("mysoft_match");
    setIsCompModalOpen(true);
  };

  const handleSaveCompany = (savedComp: CompanyItem, makeActiveImmediately = true) => {
    if (compToEdit) {
      if (onUpdateCompany) {
        onUpdateCompany(savedComp);
      } else {
        const updated = updateCompanyItem(savedComp);
        setLocalCompanies(updated);
      }
      setLocalCompanies(getCompaniesList());
    } else {
      if (onAddCompany) {
        onAddCompany(savedComp, makeActiveImmediately);
        setLocalCompanies(getCompaniesList());
        if (makeActiveImmediately) {
          setActiveCompanyId(savedComp.id);
          setLocalActiveCompId(savedComp.id);
        }
      } else {
        const updated = addCompanyItem(savedComp);
        setLocalCompanies(updated);
        if (makeActiveImmediately) {
          setActiveCompanyId(savedComp.id);
          setLocalActiveCompId(savedComp.id);
        }
      }
      if (makeActiveImmediately && onSelectCompany) {
        onSelectCompany(savedComp.id);
      }
    }
    fetchData();
  };

  const [companyToDelete, setCompanyToDelete] = useState<CompanyItem | null>(null);
  const [isQuickDeleteCompanyModalOpen, setIsQuickDeleteCompanyModalOpen] = useState(false);
  const [quickDeleteCompanySearchTerm, setQuickDeleteCompanySearchTerm] = useState("");
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);

  const handleDeleteCompany = (id: string) => {
    const targetComp = adminCompanies.find((c) => c.id === id);
    if (targetComp) {
      setCompanyToDelete(targetComp);
    } else {
      const updated = deleteCompanyItem(id);
      setLocalCompanies(updated);
      setLocalActiveCompId(getActiveCompanyId());
      if (onDeleteCompany) {
        onDeleteCompany(id);
      }
      fetchData();
    }
  };

  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    setIsDeletingCompany(true);
    try {
      const targetId = companyToDelete.id;
      const targetName = companyToDelete.companyName;

      if (onDeleteCompany) {
        onDeleteCompany(targetId);
      } else {
        const updated = deleteCompanyItem(targetId);
        setLocalCompanies(updated);
        setLocalActiveCompId(getActiveCompanyId());
      }
      setLocalCompanies(getCompaniesList());
      setLocalActiveCompId(getActiveCompanyId());

      // Şirkete bağlı oluşturulmuş giriş kullanıcısı varsa onu da temizle
      const linkedUsers = users.filter(
        (u) => u.companyId === targetId || u.userId === `usr_comp_${targetId}`
      );
      for (const lu of linkedUsers) {
        try {
          await deleteUserProfile(lu.userId);
        } catch (err) {
          console.warn("Şirket kullanıcısı silinirken uyarı:", err);
        }
      }
      if (linkedUsers.length > 0) {
        setUsers((prev) =>
          prev.filter((u) => u.companyId !== targetId && u.userId !== `usr_comp_${targetId}`)
        );
      }

      saveLocalDbSyncReport({
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        lastActionSummary: `Şirket Silindi: ${targetName}`,
        totalUsersCount: Math.max(0, users.length - linkedUsers.length),
        syncedUsersCount: Math.max(0, users.length - linkedUsers.length),
      });

      setDeleteUserSuccessMessage(`"${targetName}" şirketi ve bağlı yapılandırma kayıtları başarıyla silindi.`);
      setTimeout(() => setDeleteUserSuccessMessage(null), 4000);
      setCompanyToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error("Company deletion error:", err);
      triggerFormErrorNotification("Şirket silinirken bir hata oluştu: " + (err?.message || err), "Şirket Silme Hatası");
    } finally {
      setIsDeletingCompany(false);
    }
  };

  const handleSwitchCompany = (id: string) => {
    if (onSelectCompany) {
      onSelectCompany(id);
    } else {
      setActiveCompanyId(id);
      setLocalActiveCompId(id);
    }
  };
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFileMetadata | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // User Deletion Modal & State
  const [userToDelete, setUserToDelete] = useState<UserProfileData | null>(null);
  const [deleteUserFilesToo, setDeleteUserFilesToo] = useState(true);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserSuccessMessage, setDeleteUserSuccessMessage] = useState<string | null>(null);
  const [isQuickDeleteUserModalOpen, setIsQuickDeleteUserModalOpen] = useState(false);
  const [quickDeleteSearchTerm, setQuickDeleteSearchTerm] = useState("");

  // Draft permissions state: changes staged before committing to Firebase
  const [draftPermissions, setDraftPermissions] = useState<Record<string, AppModuleKey[]>>({});

  // Modals & Save states
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [confirmSaveUser, setConfirmSaveUser] = useState<UserProfileData | null>(null);
  const [confirmBatchSaveModalOpen, setConfirmBatchSaveModalOpen] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Edit Permissions & Credentials Detailed Modal
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfileData | null>(null);
  const [selectedModulesToEdit, setSelectedModulesToEdit] = useState<AppModuleKey[]>([]);
  const [editUsername, setEditUsername] = useState("");
  const [editPasswordPlain, setEditPasswordPlain] = useState("");
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Dynamic list of all modules & sub-modules (including Admin-defined custom modules)
  const [allAppModules, setAllAppModules] = useState<AppModuleDefinition[]>(() =>
    getAllAppModulesWithCustom()
  );
  const [matrixLevelFilter, setMatrixLevelFilter] = useState<"all" | "main" | "sub">("all");
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState<string>("Tümü");
  const [showDefineModuleModal, setShowDefineModuleModal] = useState(false);
  const [newModuleForm, setNewModuleForm] = useState<{
    key: string;
    label: string;
    description: string;
    category: "Temel" | "Ticari & Finans" | "Operasyon" | "Sektörel" | "Rapor & Analiz" | "Sistem";
    isSubModule: boolean;
    parentKey: string;
  }>({
    key: "",
    label: "",
    description: "",
    category: "Operasyon",
    isSubModule: false,
    parentKey: "companies",
  });

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserCompany, setNewUserCompany] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserTaxNumber, setNewUserTaxNumber] = useState("");
  const [newUserRole, setNewUserRole] = useState("Ön Muhasebe Görevlisi");
  const [newUserAllowedModules, setNewUserAllowedModules] = useState<AppModuleKey[]>(
    () => getAllAppModulesWithCustom().map((m) => m.key)
  );
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState("");
  const [createdSuccessInfo, setCreatedSuccessInfo] = useState<any | null>(null);

  const handleCreateCustomModule = () => {
    if (!isAdminOrSysAdmin(currentUser)) {
      triggerFormErrorNotification(
        "Modül ve alt modül tanımlama yetkisi sadece Admin ve Sistem Yöneticisine aittir.",
        "Yetkisiz İşlem"
      );
      return;
    }
    const cleanLabel = newModuleForm.label.trim();
    if (!cleanLabel) {
      triggerFormErrorNotification("Lütfen modül veya alt modül adını giriniz.", "Eksik Bilgi");
      return;
    }
    const slug = (newModuleForm.key.trim() || cleanLabel)
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9_]/g, "_");
    const finalKey = (
      newModuleForm.isSubModule
        ? `${newModuleForm.parentKey}_sub_${slug}`
        : `custom_mod_${slug}`
    ) as AppModuleKey;

    if (allAppModules.some((m) => m.key === finalKey)) {
      triggerFormErrorNotification("Bu anahtara sahip bir modül/alt modül zaten tanımlı.", "Mükerrer Kayıt");
      return;
    }

    const createdModule: AppModuleDefinition = {
      key: finalKey,
      label: cleanLabel,
      description:
        newModuleForm.description.trim() ||
        (newModuleForm.isSubModule
          ? `${cleanLabel} alt modül yetkisi`
          : `${cleanLabel} ana modül yetkisi`),
      category: newModuleForm.category,
      isSubModule: newModuleForm.isSubModule,
      parentKey: newModuleForm.isSubModule
        ? (newModuleForm.parentKey as AppModuleKey)
        : undefined,
    };

    try {
      const raw = safeGetStorageItem(CUSTOM_MODULES_STORAGE_KEY);
      const existing: AppModuleDefinition[] = raw ? JSON.parse(raw) : [];
      const updatedCustom = [...existing, createdModule];
      safeSetStorageItem(CUSTOM_MODULES_STORAGE_KEY, JSON.stringify(updatedCustom));
      setAllAppModules(getAllAppModulesWithCustom());
      setNewModuleForm({
        key: "",
        label: "",
        description: "",
        category: "Operasyon",
        isSubModule: false,
        parentKey: "companies",
      });
      setShowDefineModuleModal(false);
    } catch (e) {
      console.error("Modül kaydedilemedi:", e);
    }
  };

  const handleDeleteCustomModule = (moduleKey: AppModuleKey) => {
    if (!isAdminOrSysAdmin(currentUser)) return;
    try {
      const raw = safeGetStorageItem(CUSTOM_MODULES_STORAGE_KEY);
      const existing: AppModuleDefinition[] = raw ? JSON.parse(raw) : [];
      const updated = existing.filter((m) => m.key !== moduleKey && m.parentKey !== moduleKey);
      safeSetStorageItem(CUSTOM_MODULES_STORAGE_KEY, JSON.stringify(updated));
      setAllAppModules(getAllAppModulesWithCustom());
    } catch (e) {
      console.error("Özel modül silinemedi:", e);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedFiles] = await Promise.all([
        getAllUsersProfiles(),
        getAllFilesForAdmin(),
      ]);
      setUsers(fetchedUsers);
      setAllFiles(fetchedFiles);
      setDraftPermissions({});
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // System admin check
  const isUserSysAdmin = (user: UserProfileData) => {
    return (
      user.userId === "admin" ||
      user.userId === "main_admin" ||
      user.email === "admin@sirket.com" ||
      user.email === "admin@bilisim.com" ||
      user.role === "admin" ||
      user.role === "Sistem Yöneticisi"
    );
  };

  // Helper to get effective modules
  const getUserEffectiveModules = (user: UserProfileData): AppModuleKey[] => {
    if (draftPermissions[user.userId] !== undefined) {
      return draftPermissions[user.userId];
    }
    if (user.allowedModules && Array.isArray(user.allowedModules)) {
      return user.allowedModules;
    }
    return allAppModules.map((m) => m.key);
  };

  const getUserOriginalModules = (user: UserProfileData): AppModuleKey[] => {
    if (user.allowedModules && Array.isArray(user.allowedModules)) {
      return user.allowedModules;
    }
    return allAppModules.map((m) => m.key);
  };

  const hasUserPendingChanges = (userId: string): boolean => {
    if (draftPermissions[userId] === undefined) return false;
    const user = users.find((u) => u.userId === userId);
    if (!user) return false;
    const orig = getUserOriginalModules(user);
    const draft = draftPermissions[userId];
    if (orig.length !== draft.length) return true;
    return !orig.every((k) => draft.includes(k));
  };

  const pendingUsersList = users.filter((u) => hasUserPendingChanges(u.userId));
  const pendingChangesCount = pendingUsersList.length;

  // Toggle module or sub-module in draft (Admin & System Administrator only)
  const handleToggleModuleInDraft = (userId: string, moduleKey: AppModuleKey) => {
    if (!isAdminOrSysAdmin(currentUser)) return;
    const user = users.find((u) => u.userId === userId);
    if (!user) return;
    const currentList = getUserEffectiveModules(user);
    const updated = toggleModuleSelectionWithSubModules(moduleKey, currentList) as AppModuleKey[];

    setDraftPermissions((prev) => ({
      ...prev,
      [userId]: updated,
    }));
  };

  // Apply Role Preset to User Draft
  const handleApplyPresetToUser = (userId: string, preset: RolePreset) => {
    if (!isAdminOrSysAdmin(currentUser)) return;
    // Include all sub-modules of preset's main modules automatically
    const subKeys = allAppModules
      .filter((m) => m.isSubModule && m.parentKey && preset.modules.includes(m.parentKey))
      .map((m) => m.key);
    setDraftPermissions((prev) => ({
      ...prev,
      [userId]: Array.from(new Set([...preset.modules, ...subKeys])),
    }));
  };

  // Grant / Revoke all for a user
  const handleGrantAllToUser = (userId: string) => {
    if (!isAdminOrSysAdmin(currentUser)) return;
    setDraftPermissions((prev) => ({
      ...prev,
      [userId]: allAppModules.map((m) => m.key),
    }));
  };

  const handleRevokeAllFromUser = (userId: string) => {
    if (!isAdminOrSysAdmin(currentUser)) return;
    setDraftPermissions((prev) => ({
      ...prev,
      [userId]: ["dashboard"],
    }));
  };

  // Cancel draft for single user
  const handleCancelUserDraft = (userId: string) => {
    setDraftPermissions((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  // Save single user
  const handleExecuteSaveUser = async () => {
    if (!confirmSaveUser) return;
    const userId = confirmSaveUser.userId;
    const effectiveModules = getUserEffectiveModules(confirmSaveUser);

    setSavingUserId(userId);
    try {
      const updatedUser: UserProfileData = {
        ...confirmSaveUser,
        allowedModules: effectiveModules,
        updatedAt: new Date().toISOString(),
      };
      await saveUserProfile(updatedUser);

      // Merkezi denetim ve aktivite günlüğüne kaydet
      await logSystemAction({
        action: `Kullanıcı Yetkileri Güncellendi: ${confirmSaveUser.name}`,
        category: "Kullanıcı & Yetki",
        details: `${effectiveModules.length} adet modüle erişim yetkisi tanımlandı (${effectiveModules.join(", ")}).`,
        performedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        timestamp: new Date().toISOString(),
      });

      // Kullanıcı yerel veritabanı senkronizasyon raporunu tazele
      saveLocalDbSyncReport({
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        lastActionSummary: `Kullanıcı Yetkileri Güncellendi: ${confirmSaveUser.name}`,
        totalUsersCount: users.length,
        syncedUsersCount: users.length,
      });

      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? updatedUser : u))
      );
      handleCancelUserDraft(userId);
      setConfirmSaveUser(null);
    } catch (err) {
      console.error("Save error:", err);
      triggerFormErrorNotification("Yetkiler kaydedilirken bir hata oluştu.", "Yetki Kayıt Hatası");
    } finally {
      setSavingUserId(null);
    }
  };

  // Batch save all pending changes
  const handleExecuteBatchSave = async () => {
    setIsBatchSaving(true);
    try {
      for (const user of pendingUsersList) {
        const effectiveModules = getUserEffectiveModules(user);
        const updatedUser: UserProfileData = {
          ...user,
          allowedModules: effectiveModules,
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(updatedUser);
      }

      await logSystemAction({
        action: `Toplu Yetki Güncellemesi Uygulandı`,
        category: "Kullanıcı & Yetki",
        details: `${pendingUsersList.length} adet personelin modül yetkileri merkezi veritabanına işlendi.`,
        performedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        timestamp: new Date().toISOString(),
      });

      saveLocalDbSyncReport({
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        lastActionSummary: `${pendingUsersList.length} Personelin Yetkisi Toplu Güncellendi`,
        totalUsersCount: users.length,
        syncedUsersCount: users.length,
      });

      await fetchData();
      setConfirmBatchSaveModalOpen(false);
    } catch (err) {
      console.error("Batch save error:", err);
      triggerFormErrorNotification("Toplu kayıt sırasında bir hata oluştu.", "Toplu Kayıt Hatası");
    } finally {
      setIsBatchSaving(false);
    }
  };

  // File helpers
  const getFilesForUser = (userId: string) => {
    return allFiles.filter((f) => f.userId === userId);
  };

  const handleDeleteFile = async (file: UserFileMetadata) => {
    if (!window.confirm(`"${file.fileName}" dosyasını kalıcı olarak silmek istediğinizden emin misiniz?`)) {
      return;
    }
    try {
      await deleteUserFile(file.id, file.storagePath);
      setAllFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (previewFile?.id === file.id) {
        setPreviewFile(null);
      }
    } catch (err) {
      console.error("File deletion error:", err);
      triggerFormErrorNotification("Dosya silinirken hata oluştu.", "Dosya Silme Hatası");
    }
  };

  const canDeleteUser = (user: UserProfileData) => {
    if (!user) return false;
    // Kendi aktif oturum hesabını silmeyi engelle
    const currentId = currentUser?.id || (currentUser as any)?.userId;
    const currentEmail = currentUser?.email?.toLowerCase().trim();
    if (currentId && (user.userId === currentId || (user as any).id === currentId)) return false;
    if (currentEmail && user.email?.toLowerCase().trim() === currentEmail) return false;
    return true;
  };

  const handleOpenDeleteUserModal = (user: UserProfileData) => {
    if (!canDeleteUser(user)) {
      triggerFormErrorNotification("Kendi aktif admin hesabınızı silemezsiniz.", "Güvenlik Uyarısı");
      return;
    }
    setUserToDelete(user);
    setDeleteUserFilesToo(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    const targetUserId = userToDelete.userId;
    const targetUserName = userToDelete.name || userToDelete.email;
    const targetUserEmail = userToDelete.email;

    try {
      // 1. Firebase Firestore üzerinden profil ve isteğe bağlı evrakları sil
      await deleteUserProfileAndData(targetUserId, deleteUserFilesToo);

      // 2. Sunucu proxy API çağrısı
      try {
        await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminEmail: currentUser?.email,
            userEmail: targetUserEmail,
          }),
        });
      } catch (apiErr) {
        console.warn("Backend user deletion proxy notice:", apiErr);
      }

      // 3. Merkezi Denetim & Aktivite Günlüğü
      await logSystemAction({
        action: `Kullanıcı Sistemden Silindi: ${targetUserName}`,
        category: "Kullanıcı & Yetki",
        details: `${targetUserName} (${targetUserEmail}) kullanıcısının hesabı ve tüm modül yetkileri yönetici (${currentUser?.name || currentUser?.email || "Sistem Yöneticisi"}) tarafından kalıcı olarak silindi.${deleteUserFilesToo ? " (İlişkili tüm evraklar da arşivden temizlendi)" : ""}`,
        performedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        timestamp: new Date().toISOString(),
      });

      // 4. Yerel state güncellemesi
      setUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
      if (deleteUserFilesToo) {
        setAllFiles((prev) => prev.filter((f) => f.userId !== targetUserId));
      }
      handleCancelUserDraft(targetUserId);

      // 5. Yerel senkronizasyon raporunu tazele
      saveLocalDbSyncReport({
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        lastActionSummary: `Kullanıcı Sistemden Silindi: ${targetUserName}`,
        totalUsersCount: Math.max(0, users.length - 1),
        syncedUsersCount: Math.max(0, users.length - 1),
      });

      setDeleteUserSuccessMessage(`"${targetUserName}" kullanıcısı ve sisteme ait yetkileri başarıyla silindi.`);
      setTimeout(() => setDeleteUserSuccessMessage(null), 4000);
      setUserToDelete(null);

      if (selectedUser?.userId === targetUserId) {
        setSelectedUser(null);
      }
    } catch (err: any) {
      console.error("User deletion error:", err);
      triggerFormErrorNotification("Kullanıcı silinirken bir hata oluştu: " + (err?.message || err), "Kullanıcı Silme Hatası");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenAddUser = () => {
    setNewUserName("");
    setNewUserUsername("");
    setNewUserEmail("");
    setNewUserPassword(generateRandomPassword());
    setNewUserCompany(currentUser.companyName || "Muavin Finans & ERP");
    setNewUserPhone("+90 (212) 555 0100");
    setNewUserTaxNumber("1234567890");
    setNewUserRole("Ön Muhasebe Görevlisi");
    setNewUserAllowedModules(ALL_APP_MODULES.map((m) => m.key));
    setCreateUserError("");
    setCreatedSuccessInfo(null);
    setIsAddUserModalOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError("");

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setCreateUserError("Lütfen ad soyad, e-posta ve şifre alanlarını eksiksiz doldurunuz.");
      return;
    }

    setCreatingUser(true);
    try {
      const generatedUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cleanEmail = newUserEmail.trim().toLowerCase();
      const finalUsername = (newUserUsername.trim() || cleanEmail.split("@")[0] || "kullanici").toLowerCase();
      const newUserProfile: UserProfileData = {
        userId: generatedUserId,
        name: newUserName.trim(),
        username: finalUsername,
        email: cleanEmail,
        companyName: newUserCompany.trim() || "Muavin Bilişim A.Ş.",
        phone: newUserPhone.trim(),
        taxNumber: newUserTaxNumber.trim(),
        selectedLogoId: BRAND_LOGOS[0].id,
        selectedLogoName: BRAND_LOGOS[0].title,
        selectedLogoUrl: BRAND_LOGOS[0].imageUrl,
        role: newUserRole,
        allowedModules: newUserAllowedModules,
        passwordPlain: newUserPassword,
        createdByAdmin: true,
        createdAt: new Date().toISOString(),
      };

      await saveUserProfile(newUserProfile);
      setUsers((prev) => [newUserProfile, ...prev]);
      setCreatedSuccessInfo({
        name: newUserProfile.name,
        username: finalUsername,
        email: newUserProfile.email,
        passwordPlain: newUserPassword,
        allowedModulesCount: newUserAllowedModules.length,
      });
    } catch (err) {
      console.error("Create user error:", err);
      setCreateUserError("Kullanıcı oluşturulurken hata meydana geldi.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenEditPermissions = (user: UserProfileData) => {
    setEditingPermissionsUser(user);
    setSelectedModulesToEdit(getUserEffectiveModules(user));
    setEditUsername(user.username || user.email?.split("@")[0] || "");
    setEditPasswordPlain(user.passwordPlain || "");
  };

  const handleSaveEditedPermissions = async () => {
    if (!editingPermissionsUser) return;
    setSavingPermissions(true);
    try {
      const updatedUser: UserProfileData = {
        ...editingPermissionsUser,
        username: editUsername.trim() || editingPermissionsUser.username || editingPermissionsUser.email?.split("@")[0],
        passwordPlain: editPasswordPlain.trim() || editingPermissionsUser.passwordPlain,
        allowedModules: selectedModulesToEdit,
        updatedAt: new Date().toISOString(),
      };
      await saveUserProfile(updatedUser);

      // Eğer bu kullanıcı bir şirketin ana giriş hesabıysa, şirketin giriş bilgilerini de senkronize et
      if (editingPermissionsUser.companyId || editingPermissionsUser.userId.startsWith("usr_comp_")) {
        const targetCompId = editingPermissionsUser.companyId || editingPermissionsUser.userId.replace("usr_comp_", "");
        const matchedComp = adminCompanies.find((c) => c.id === targetCompId);
        if (matchedComp) {
          const updatedComp: CompanyItem = {
            ...matchedComp,
            loginUsername: updatedUser.username || matchedComp.loginUsername,
            loginPasswordPlain: updatedUser.passwordPlain || matchedComp.loginPasswordPlain,
          };
          if (onUpdateCompany) {
            onUpdateCompany(updatedComp);
          } else {
            updateCompanyItem(updatedComp);
          }
          setLocalCompanies(getCompaniesList());
        }
      }

      saveLocalDbSyncReport({
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        lastActionSummary: `Personel Yetki & Şifre Bilgileri Güncellendi: ${editingPermissionsUser.name}`,
        totalUsersCount: users.length,
        syncedUsersCount: users.length,
      });
      setUsers((prev) =>
        prev.map((u) => (u.userId === editingPermissionsUser.userId ? updatedUser : u))
      );
      handleCancelUserDraft(editingPermissionsUser.userId);
      setEditingPermissionsUser(null);
    } catch (err) {
      console.error("Save permissions error:", err);
      triggerFormErrorNotification("Yetki güncellenirken hata oluştu.", "Yetki Kayıt Hatası");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.companyName && u.companyName.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Byte";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="w-5 h-5 text-[#0f6bae]" />;
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-[#b91c1c]" />;
    if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv"))
      return <FileSpreadsheet className="w-5 h-5 text-[#0d7f56]" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 🚀 Top Header Banner */}
      <ModuleEntranceHeader
        icon={ShieldAlert}
        title="Sistem Yönetici & Yetkilendirme Paneli"
        description="Personel rol sınırlandırmaları, tanımlanan şirket ve kullanıcıların giriş şifreleri, modül bazlı erişim matrisi ve evrak denetimi."
        badge="Yönetim & Yetkilendirme"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab("credentials")}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98"
              title="Tanımlanan Şirket ve Kullanıcıların Kullanıcı Adı ve Şifreleri"
            >
              <KeyRound className="w-4 h-4" />
              <span>Şirket & Kullanıcı Şifreleri</span>
            </button>
            <button
              onClick={handleOpenAddCompany}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98"
              title="Yeni Şirket Ekleme Modülü"
            >
              <Building2 className="w-4 h-4" />
              <span>Yeni Şirket Ekle</span>
            </button>
            <button
              onClick={() => setIsQuickDeleteCompanyModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98"
              title="Şirket Silme Paneli"
            >
              <Trash2 className="w-4 h-4" />
              <span>Şirket Sil</span>
            </button>
            <button
              onClick={handleOpenAddUser}
              className="bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Kullanıcı Ekle</span>
            </button>
            <button
              onClick={() => setIsQuickDeleteUserModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98"
              title="Kullanıcı Silme Paneli"
            >
              <UserMinus className="w-4 h-4" />
              <span>Kullanıcı Sil</span>
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 px-3.5 rounded-xl border border-white/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Yenile</span>
            </button>
          </div>
        }
      >
        {/* 📑 Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Tüm Eklenenler & Sistem Özeti</span>
          </button>

          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "credentials"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
            <span>Şirket & Kullanıcı Şifreleri ({adminCompanies.length + users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "matrix"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Modül Yetkilendirme Matrisi</span>
            {pendingChangesCount > 0 && (
              <span className="bg-[#b45309] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono">
                {pendingChangesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kullanıcı & Personel Listesi ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("companies")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "companies"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <Building2 className="w-4 h-4 text-sky-300" />
            <span>Şirketler & Mysoft Eşleştirme ({adminCompanies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "files"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Evrak & Belge Denetimi ({allFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "payroll"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>SGK ve Personel Vergilendirme</span>
          </button>

          <button
            onClick={() => setActiveTab("broadcast")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "broadcast"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Canlı Güncelleme Dağıtımı</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "audit"
                ? "bg-white text-slate-900 shadow-2xs border border-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/15"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Denetim Günlüğü</span>
          </button>
        </div>
      </ModuleEntranceHeader>

      {/* 📡 Senkronizasyon Durum Çubuğu (Tüm Kullanıcı Yerel Veritabanı Yansıma Durumu & Son Güncelleme) */}
      <AdminSyncStatusBar
        users={users}
        currentUser={currentUser}
        onRefresh={fetchData}
      />

      {/* ✅ Başarılı Kullanıcı Silme Bildirimi */}
      {deleteUserSuccessMessage && (
        <div className="card-elevation-1 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteUserSuccessMessage}</span>
          </div>
          <button
            onClick={() => setDeleteUserSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ⚠️ Batch Changes Pending Alert Banner */}
      {pendingChangesCount > 0 && (
        <div className="card-elevation-1 bg-amber-50 text-amber-900 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider label-caps text-amber-950">
                Kaydedilmemiş Yetki Değişiklikleri Mevcut
              </div>
              <div className="text-xs font-medium text-amber-800/90 mt-0.5">
                {pendingChangesCount} personelin modül erişim izinlerinde yapılan değişiklikler henüz veritabanına işlenmedi.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDraftPermissions({})}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tümünü Sıfırla</span>
            </button>
            <button
              onClick={() => setConfirmBatchSaveModalOpen(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Toplu Kaydet ({pendingChangesCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 TAB 0: TÜM EKLENENLER & SİSTEM ÖZETİ */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <AdminOverviewPanel
          users={users}
          files={allFiles}
          companies={adminCompanies}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenAddUserModal={() => setIsAddUserModalOpen(true)}
          onPreviewFile={(file) => setPreviewFile(file)}
          onDeleteUser={handleOpenDeleteUserModal}
          onEditCompany={handleOpenEditCompany}
          onDeleteCompany={(comp) => setCompanyToDelete(comp)}
          onOpenDeleteCompanyModal={() => setIsQuickDeleteCompanyModalOpen(true)}
          onSwitchCompany={handleSwitchCompany}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================================= */}
      {/* 🔑 TAB 0.5: TANIMLANAN ŞİRKETLERİN VE KULLANICILARIN KULLANICI İSİMLERİ & ŞİFRELERİ */}
      {/* ========================================================================= */}
      {activeTab === "credentials" && (
        <div className="space-y-6">
          {/* Header & Filter Bar */}
          <div className="card-elevation-2 bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#131b2e] text-amber-300 flex items-center justify-center shrink-0 border border-[#222a3d] shadow-xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Tanımlanan Şirketlerin ve Kullanıcıların Giriş Bilgileri (Kullanıcı Adı & Şifre)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Yönetici Özel Görünüm
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistemde tanımlı tüm şirketlerin ({adminCompanies.length}) ve kullanıcıların ({users.length}) kullanıcı isimlerini ve şifrelerini görüntüleyin, kopyalayın veya düzenleyin.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={credentialSearch}
                  onChange={(e) => setCredentialSearch(e.target.value)}
                  placeholder="Şirket, personel veya kullanıcı adı ara..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0f6bae] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => !prev)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                    <span>Şifreleri Gizle</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#0f6bae]" />
                    <span>Şifreleri Göster</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleOpenAddCompany}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>+ Şirket Ekle</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQuickDeleteCompanyModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Şirket Silme Paneli"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Şirket Sil</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="px-3.5 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Kullanıcı Ekle</span>
              </button>
            </div>
          </div>

          {/* 🏢 1. TANIMLANAN ŞİRKETLERİN KULLANICI İSİMLERİ VE ŞİFRELERİ */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0f6bae]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Tanımlanan Şirketlerin Kullanıcı İsimleri ve Şifreleri ({adminCompanies.length} Şirket)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Şirket düzenleme ekranından kullanıcı adı ve şifreyi güncelleyebilirsiniz
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-600 border-b border-slate-200 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Şirket / İşletme Adı</th>
                    <th className="py-3 px-4">Mükellef VKN / TCKN</th>
                    <th className="py-3 px-4">Yetkili / Rol</th>
                    <th className="py-3 px-4">Kullanıcı Adı (Giriş)</th>
                    <th className="py-3 px-4">Şifre</th>
                    <th className="py-3 px-4">Giriş E-Posta</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminCompanies
                    .filter((c) => {
                      if (!credentialSearch.trim()) return true;
                      const q = credentialSearch.toLowerCase();
                      return (
                        c.companyName?.toLowerCase().includes(q) ||
                        c.companyTitle?.toLowerCase().includes(q) ||
                        c.loginUsername?.toLowerCase().includes(q) ||
                        c.loginEmail?.toLowerCase().includes(q) ||
                        c.vkn?.includes(q) ||
                        c.tckn?.includes(q)
                      );
                    })
                    .map((comp) => {
                      const compUser = comp.loginUsername || (comp.id === "comp_default" ? "test" : comp.id === "comp_kurumsal_default" ? "sirket" : comp.id === "comp_sahis_default" ? "sahis" : comp.vkn || comp.tckn || "kullanici");
                      const compPass = comp.loginPasswordPlain || "123456";
                      const compEmail = comp.loginEmail || comp.email || `${compUser}@muavin.com`;
                      const isActive = comp.id === adminActiveCompId;

                      return (
                        <tr key={comp.id} className={`hover:bg-slate-50/80 transition-colors ${isActive ? "bg-sky-50/40" : ""}`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                                isActive ? "bg-[#0f6bae] text-white" : "bg-slate-100 text-slate-700"
                              }`}>
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{comp.companyName}</span>
                                  {isActive && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                      Aktif
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[240px]">
                                  {comp.companyTitle}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-slate-700">
                            {comp.vkn ? `VKN: ${comp.vkn}` : comp.tckn ? `TCKN: ${comp.tckn}` : comp.taxNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 text-[11px]">
                              {comp.loginFullName || comp.companyName}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {comp.loginRole || "Şirket Yöneticisi"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0f6bae] border border-blue-200 px-2.5 py-1 rounded-lg font-mono font-bold text-xs">
                              <span>{compUser}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(compUser, `cred_c_u_${comp.id}`)}
                                className="text-blue-400 hover:text-[#0f6bae] cursor-pointer"
                                title="Kullanıcı Adını Kopyala"
                              >
                                {copiedKey === `cred_c_u_${comp.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg font-mono font-bold text-xs">
                              <span>{showPasswords ? compPass : "••••••••"}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(compPass, `cred_c_p_${comp.id}`)}
                                className="text-amber-500 hover:text-amber-800 cursor-pointer"
                                title="Şifreyi Kopyala"
                              >
                                {copiedKey === `cred_c_p_${comp.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                            {compEmail}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    `Şirket: ${comp.companyName}\nKullanıcı Adı: ${compUser}\nE-Posta: ${compEmail}\nŞifre: ${compPass}`,
                                    `cred_c_all_${comp.id}`
                                  )
                                }
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedKey === `cred_c_all_${comp.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Kopyalandı</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Kopyala</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditCompany(comp)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Şifre/Bilgi Düzenle</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCompanyToDelete(comp)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-[11px] rounded-lg border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Şirketi Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Şirket Sil</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 👥 2. TANIMLANAN KULLANICILARIN VE PERSONELLERİN KULLANICI İSİMLERİ VE ŞİFRELERİ */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Tanımlanan Kullanıcıların Kullanıcı İsimleri ve Şifreleri ({users.length} Kullanıcı)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Kullanıcı satırındaki "Şifre & Yetki Düzenle" butonu ile şifreyi değiştirebilirsiniz
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-600 border-b border-slate-200 font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Ad Soyad / Kullanıcı</th>
                    <th className="py-3 px-4">Şirket / İşletme</th>
                    <th className="py-3 px-4">Görev / Rol</th>
                    <th className="py-3 px-4">Kullanıcı Adı (Giriş)</th>
                    <th className="py-3 px-4">Şifre</th>
                    <th className="py-3 px-4">E-Posta Adresi</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter((u) => {
                      if (!credentialSearch.trim()) return true;
                      const q = credentialSearch.toLowerCase();
                      return (
                        u.name?.toLowerCase().includes(q) ||
                        u.username?.toLowerCase().includes(q) ||
                        u.email?.toLowerCase().includes(q) ||
                        u.companyName?.toLowerCase().includes(q) ||
                        u.role?.toLowerCase().includes(q)
                      );
                    })
                    .map((u) => {
                      const uname = u.username || u.email?.split("@")[0] || u.userId;
                      const upass = u.passwordPlain || "123456";
                      const isSysAdmin = isUserSysAdmin(u);

                      return (
                        <tr key={u.userId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#131b2e] text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSysAdmin && (
                                    <span className="bg-[#131b2e] text-[#c6cdff] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ID: {u.userId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 text-[11px]">
                            {u.companyName || "Muavin Finans & ERP"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0f6bae] border border-blue-200 font-bold text-[10px]">
                              {u.role || "Ön Muhasebe"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0f6bae] border border-blue-200 px-2.5 py-1 rounded-lg font-mono font-bold text-xs">
                              <span>{uname}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(uname, `cred_u_u_${u.userId}`)}
                                className="text-blue-400 hover:text-[#0f6bae] cursor-pointer"
                                title="Kullanıcı Adını Kopyala"
                              >
                                {copiedKey === `cred_u_u_${u.userId}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg font-mono font-bold text-xs">
                              <span>{showPasswords ? upass : "••••••••"}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(upass, `cred_u_p_${u.userId}`)}
                                className="text-amber-500 hover:text-amber-800 cursor-pointer"
                                title="Şifreyi Kopyala"
                              >
                                {copiedKey === `cred_u_p_${u.userId}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    `Ad Soyad: ${u.name}\nKullanıcı Adı: ${uname}\nE-Posta: ${u.email}\nŞifre: ${upass}`,
                                    `cred_u_all_${u.userId}`
                                  )
                                }
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedKey === `cred_u_all_${u.userId}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-700">Kopyalandı</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Kopyala</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditPermissions(u)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f6bae] font-bold text-[11px] rounded-lg border border-blue-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Sliders className="w-3 h-3" />
                                <span>Şifre & Yetki Düzenle</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔐 TAB 1: MODÜL & ALT MODÜL TANIMLAMA VE YETKİLENDİRME MATRİSİ */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0f6bae]" />
                    Merkezi Ana Modül & Alt Modül Tanımlama ve Yetkilendirme Matrisi
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Sadece Admin & Sistem Yöneticisi Yetkilendirebilir
                  </span>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
                    {allAppModules.filter((m) => !m.isSubModule).length} Ana Modül •{" "}
                    {allAppModules.filter((m) => m.isSubModule).length} Alt Modül
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Uygulamadaki tüm modüllerin ve alt modüllerin tanımlanması ve yetkilendirilmesi sadece <strong>Admin</strong> ve <strong>Sistem Yöneticisi</strong> tarafından yapılabilir. Ana modül kapatıldığında alt modülleri otomatik kapanır.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {isAdminOrSysAdmin(currentUser) && (
                  <button
                    type="button"
                    onClick={() => setShowDefineModuleModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ Yeni Modül / Alt Modül Tanımla</span>
                  </button>
                )}

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Personel veya e-posta ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-[#0f6bae] focus:ring-2 focus:ring-[#0f6bae] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Category & Level Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  "Tümü",
                  "Temel",
                  "Ticari & Finans",
                  "Operasyon",
                  "Sektörel",
                  "Rapor & Analiz",
                  "Sistem",
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMatrixCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      matrixCategoryFilter === cat
                        ? "bg-[#0f6bae] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                {[
                  { id: "all", label: "Tüm Modül & Alt Modüller" },
                  { id: "main", label: "Ana Modüller" },
                  { id: "sub", label: "Alt Modüller" },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setMatrixLevelFilter(lvl.id as "all" | "main" | "sub")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      matrixLevelFilter === lvl.id
                        ? "bg-white text-[#0f6bae] shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 📊 The Matrix Table */}
          <div className="card-elevation-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-white text-slate-800 divide-x divide-slate-200 border-b border-slate-200">
                    <th className="p-3.5 font-semibold w-64 sticky left-0 bg-white z-20 text-slate-900 border-r border-slate-200">
                      Personel & Rolü
                    </th>
                    <th className="p-3 font-semibold text-center w-36 bg-white text-slate-800">
                      Hızlı Şablon
                    </th>
                    {allAppModules
                      .filter(
                        (m) =>
                          (matrixCategoryFilter === "Tümü" ||
                            m.category === matrixCategoryFilter) &&
                          (matrixLevelFilter === "all" ||
                            (matrixLevelFilter === "main" && !m.isSubModule) ||
                            (matrixLevelFilter === "sub" && m.isSubModule))
                      )
                      .map((mod) => {
                        const parentMod = mod.parentKey
                          ? allAppModules.find((p) => p.key === mod.parentKey)
                          : null;
                        const isCustomMod =
                          String(mod.key).startsWith("custom_mod_") ||
                          String(mod.key).includes("_sub_");
                        return (
                          <th
                            key={mod.key}
                            className={`p-3 font-semibold text-center min-w-[105px] max-w-[135px] text-slate-800 ${
                              mod.isSubModule ? "bg-purple-50/40" : "bg-white"
                            }`}
                            title={mod.description}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                                    mod.isSubModule
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-blue-100 text-[#0f6bae]"
                                  }`}
                                >
                                  {mod.isSubModule ? "ALT MODÜL" : "ANA MODÜL"}
                                </span>
                                {isCustomMod && isAdminOrSysAdmin(currentUser) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomModule(mod.key)}
                                    className="text-rose-500 hover:text-rose-700 p-0.5"
                                    title="Özel tanımlı modülü sil"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              {parentMod && (
                                <span className="text-[9px] text-purple-700 font-medium truncate max-w-[115px]">
                                  ↳ {parentMod.label}
                                </span>
                              )}
                              <span className="text-[10px] font-bold leading-tight text-slate-900">
                                {mod.label}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    <th className="p-3 font-semibold text-center w-32 sticky right-0 bg-white z-20 text-slate-900 border-l border-slate-200">
                      İşlem & Kayıt
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#e2e7ff]">
                  {filteredUsers.map((user) => {
                    const isSysAdmin = isUserSysAdmin(user);
                    const effectiveModules = getUserEffectiveModules(user);
                    const isPending = hasUserPendingChanges(user.userId);
                    const userUsername = user.username || user.email?.split("@")[0] || user.userId;
                    const userPassword = user.passwordPlain || "123456";
                    const visibleMods = allAppModules.filter(
                      (m) =>
                        (matrixCategoryFilter === "Tümü" ||
                          m.category === matrixCategoryFilter) &&
                        (matrixLevelFilter === "all" ||
                          (matrixLevelFilter === "main" && !m.isSubModule) ||
                          (matrixLevelFilter === "sub" && m.isSubModule))
                    );

                    return (
                      <tr
                        key={user.userId}
                        className={`hover:bg-[#f2f3ff]/60 transition-colors ${
                          isPending ? "bg-[#fffbeb]/50" : ""
                        }`}
                      >
                        {/* User Identity Column */}
                        <td className="p-3.5 sticky left-0 bg-white z-10 shadow-r border-r border-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0f6bae] font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSysAdmin && (
                                  <span className="bg-[#131b2e] text-[#c6cdff] border border-[#222a3d] text-[9px] font-bold px-1.5 py-0.5 rounded label-caps">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate">{user.email}</div>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#0f6bae] border border-blue-200">
                                  K.Adı: {userUsername}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                  Şifre: {showPasswords ? userPassword : "••••••"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Quick Role Template Selector Dropdown */}
                        <td className="p-3 text-center border-r border-slate-200 bg-white">
                          {isSysAdmin ? (
                            <span className="text-[10px] font-medium text-slate-400">Tam Erişim</span>
                          ) : (
                            <div className="flex flex-col gap-1 items-center">
                              <select
                                onChange={(e) => {
                                  const preset = STAFF_ROLE_PRESETS.find((p) => p.id === e.target.value);
                                  if (preset) handleApplyPresetToUser(user.userId, preset);
                                }}
                                defaultValue=""
                                className="w-full text-[10px] font-medium bg-white border border-slate-200 rounded-lg p-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0f6bae] cursor-pointer"
                              >
                                <option value="" disabled>Rol Şablonu Seç...</option>
                                {STAFF_ROLE_PRESETS.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.badge}
                                  </option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleGrantAllToUser(user.userId)}
                                  className="text-[9px] text-[#0f6bae] font-bold hover:underline cursor-pointer"
                                >
                                  Tümü
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAllFromUser(user.userId)}
                                  className="text-[9px] text-[#b91c1c] font-bold hover:underline cursor-pointer"
                                >
                                  Kapat
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Module & Sub-Module Checkbox Columns */}
                        {visibleMods.map((mod) => {
                          const isEnabled = isKeyAllowedInList(
                            mod.key,
                            mod.parentKey,
                            effectiveModules
                          );

                          return (
                            <td
                              key={mod.key}
                              className={`p-3 text-center border-r border-slate-200 ${
                                mod.isSubModule ? "bg-purple-50/20" : ""
                              }`}
                            >
                              {isSysAdmin ? (
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!isAdminOrSysAdmin(currentUser)}
                                  onClick={() => handleToggleModuleInDraft(user.userId, mod.key)}
                                  className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all cursor-pointer ${
                                    isEnabled
                                      ? mod.isSubModule
                                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
                                        : "bg-[#0f6bae] hover:bg-[#005289] text-white shadow-2xs"
                                      : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-transparent"
                                  }`}
                                  title={`${user.name} için ${mod.label} (${
                                    mod.isSubModule ? "Alt Modül" : "Ana Modül"
                                  }) erişimini aç/kapat`}
                                >
                                  {isEnabled ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Actions Column */}
                        <td className="p-3 text-center sticky right-0 bg-white z-10 shadow-l border-l border-slate-200">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCancelUserDraft(user.userId)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition-colors border border-slate-200"
                                title="Değişikliği Geri Al"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmSaveUser(user)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs cursor-pointer transition-all flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Kaydet</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPermissions(user)}
                                className="px-2 py-1 text-[10px] font-bold text-[#0f6bae] hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                                title="Kullanıcı Adı, Şifre ve Modül Yetkilerini Düzenle"
                              >
                                Şifre & Yetki
                              </button>
                              {canDeleteUser(user) ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteUserModal(user)}
                                  className="px-2 py-1 text-[10px] font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Kullanıcıyı Kalıcı Olarak Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Sil</span>
                                </button>
                              ) : (
                                <span
                                  className="px-1.5 py-1 text-[9px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200 cursor-not-allowed"
                                  title="Kendi aktif oturum hesabınızı silemezsiniz"
                                >
                                  Aktif
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB 2: KULLANICI & PERSONEL LİSTESİ */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="card-elevation-1 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kullanıcı adı, ad soyad, e-posta veya şirket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-[#0f6bae] focus:ring-2 focus:ring-[#0f6bae] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => !prev)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#0f6bae]" />}
                <span>{showPasswords ? "Şifreleri Gizle" : "Şifreleri Göster"}</span>
              </button>
              <button
                onClick={handleOpenAddUser}
                className="w-full sm:w-auto px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Yeni Kullanıcı Tanımla</span>
              </button>
              <button
                onClick={() => setIsQuickDeleteUserModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                title="Kullanıcı Silme Paneli"
              >
                <UserMinus className="w-4 h-4" />
                <span>Kullanıcı Sil</span>
              </button>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isSysAdmin = isUserSysAdmin(user);
              const effectiveModules = getUserEffectiveModules(user);
              const userFilesCount = getFilesForUser(user.userId).length;
              const uname = user.username || user.email?.split("@")[0] || user.userId;
              const upass = user.passwordPlain || "123456";

              return (
                <div
                  key={user.userId}
                  className="card-elevation-1 hover:card-elevation-2 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#131b2e] text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0 border border-[#222a3d]">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{user.name}</h3>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                        </div>
                      </div>

                      {isSysAdmin ? (
                        <span className="bg-[#131b2e] text-[#c6cdff] border border-[#222a3d] text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 label-caps">
                          Süper Admin
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-[#0f6bae] border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0">
                          {user.role || "Ön Muhasebe"}
                        </span>
                      )}
                    </div>

                    {/* 🔑 Giriş Kimlik Bilgileri Kutusu (Kullanıcı Adı & Şifre) */}
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          Giriş Kimlik Bilgileri
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              `Kullanıcı Adı: ${uname}\nE-Posta: ${user.email}\nŞifre: ${upass}`,
                              `ucard_all_${user.userId}`
                            )
                          }
                          className="text-[10px] font-bold text-[#0f6bae] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === `ucard_all_${user.userId}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Kopyalandı</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Tümünü Kopyala</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div className="bg-white px-2.5 py-1.5 rounded-lg border border-amber-200/80 flex items-center justify-between gap-1">
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-semibold block">Kullanıcı Adı</span>
                            <span className="font-mono font-bold text-xs text-[#0f6bae] truncate block">{uname}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(uname, `ucard_u_${user.userId}`)}
                            className="p-1 text-slate-400 hover:text-[#0f6bae] cursor-pointer shrink-0"
                            title="Kullanıcı Adını Kopyala"
                          >
                            {copiedKey === `ucard_u_${user.userId}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="bg-white px-2.5 py-1.5 rounded-lg border border-amber-200/80 flex items-center justify-between gap-1">
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 font-semibold block">Giriş Şifresi</span>
                            <span className="font-mono font-bold text-xs text-amber-900 truncate block">
                              {showPasswords ? upass : "••••••••"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(upass, `ucard_p_${user.userId}`)}
                            className="p-1 text-slate-400 hover:text-amber-800 cursor-pointer shrink-0"
                            title="Şifreyi Kopyala"
                          >
                            {copiedKey === `ucard_p_${user.userId}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Şirket:</span>
                        <span className="font-bold text-slate-800 truncate">{user.companyName || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">İletişim:</span>
                        <span className="font-mono text-slate-700">{user.phone || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Yetkili Modüller:</span>
                        <span className="font-bold text-[#0f6bae]">
                          {isSysAdmin ? `Tümü Açık (${ALL_APP_MODULES.length})` : `${effectiveModules.length} Modül`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Yüklü Evrak:</span>
                        <span className="font-bold text-slate-700">{userFilesCount} Dosya</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f6bae] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-blue-200"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Evraklar ({userFilesCount})</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPermissions(user)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0f6bae] rounded-xl border border-slate-200 hover:border-blue-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        title="Kullanıcı Adı, Şifre ve Modül Yetkilerini Düzenle"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Şifre & Yetki</span>
                      </button>

                      {canDeleteUser(user) ? (
                        <button
                          onClick={() => handleOpenDeleteUserModal(user)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-xl border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Kullanıcıyı Kalıcı Olarak Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      ) : (
                        <span
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-xl border border-slate-200 text-xs font-medium flex items-center gap-1 cursor-not-allowed"
                          title="Kendi aktif oturum hesabınızı silemezsiniz"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Aktif</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏢 TAB: ŞİRKETLER & MYSOFT ENTEGRASYON VE EŞLEŞTİRME */}
      {/* ========================================================================= */}
      {activeTab === "companies" && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="card-elevation-2 bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0f6bae]" />
                <h3 className="text-base font-bold text-slate-900">
                  Şirket Yönetimi & Mysoft VKN/TCKN Eşleştirme Masası
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Sisteme yeni şirket ekleyin. <strong>Yeni eklenen şirkette bütün modüller (Faturalar, Cariler, Bankalar, Stoklar vb.) tamamen boş ve tertemiz olarak açılır.</strong> Admin panelinden her şirketin giriş kullanıcı adını, şifresini ve VKN/TCKN numaralarını yönetebilirsiniz.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasswords((prev) => !prev)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#0f6bae]" />}
                <span>{showPasswords ? "Şifreleri Gizle" : "Şifreleri Göster"}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddCompany}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98 shrink-0"
              >
                <Building2 className="w-4 h-4" />
                <span>+ Yeni Şirket Ekle</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQuickDeleteCompanyModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98 shrink-0"
                title="Şirket Silme Paneli"
              >
                <Trash2 className="w-4 h-4" />
                <span>Şirket Sil</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Şirket adı, unvan, kullanıcı adı, VKN veya TCKN ile ara..."
                value={companySearchTerm}
                onChange={(e) => setCompanySearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0f6bae] outline-none"
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Toplam: {adminCompanies.length} Şirket
            </span>
          </div>

          {/* Companies Table / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Şirket / Firma Adı</th>
                    <th className="p-4">Kullanıcı Adı & Şifre (Giriş)</th>
                    <th className="p-4">Vergi Dairesi</th>
                    <th className="p-4 font-mono">VKN / TCKN</th>
                    <th className="p-4">Mysoft e-Belge Eşleşmesi</th>
                    <th className="p-4">Modül Durumu</th>
                    <th className="p-4 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminCompanies
                    .filter((c) => {
                      if (!companySearchTerm.trim()) return true;
                      const q = companySearchTerm.toLowerCase();
                      return (
                        c.companyName?.toLowerCase().includes(q) ||
                        c.companyTitle?.toLowerCase().includes(q) ||
                        c.loginUsername?.toLowerCase().includes(q) ||
                        c.vkn?.includes(q) ||
                        c.tckn?.includes(q) ||
                        c.taxNumber?.includes(q)
                      );
                    })
                    .map((comp) => {
                      const isActive = comp.id === adminActiveCompId;
                      const compUser = comp.loginUsername || (comp.id === "comp_default" ? "test" : comp.id === "comp_kurumsal_default" ? "sirket" : comp.id === "comp_sahis_default" ? "sahis" : comp.vkn || comp.tckn || "kullanici");
                      const compPass = comp.loginPasswordPlain || "123456";

                      return (
                        <tr key={comp.id} className={`hover:bg-slate-50/80 transition-colors ${isActive ? "bg-sky-50/40" : ""}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                                isActive ? "bg-[#0f6bae] text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                <Building className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{comp.companyName}</span>
                                  {isActive && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                      Aktif
                                    </span>
                                  )}
                                  {comp.isDefault && (
                                    <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.2 rounded font-normal">
                                      Ana
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                  {comp.companyTitle || comp.companyName}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0f6bae] border border-blue-200 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] w-fit">
                                <KeyRound className="w-3 h-3 text-[#0f6bae]" />
                                <span>K.Adı: {compUser}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(compUser, `ctab_u_${comp.id}`)}
                                  className="text-blue-400 hover:text-[#0f6bae] cursor-pointer"
                                  title="Kullanıcı Adını Kopyala"
                                >
                                  {copiedKey === `ctab_u_${comp.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] w-fit">
                                <span>Şifre: {showPasswords ? compPass : "••••••••"}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(compPass, `ctab_p_${comp.id}`)}
                                  className="text-amber-500 hover:text-amber-800 cursor-pointer"
                                  title="Şifreyi Kopyala"
                                >
                                  {copiedKey === `ctab_p_${comp.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-slate-700 font-medium">
                            {comp.taxOffice || "Merkez"}
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-800">
                            {comp.vkn ? (
                              <div>VKN: {comp.vkn}</div>
                            ) : null}
                            {comp.tckn ? (
                              <div className="text-slate-600">TCKN: {comp.tckn}</div>
                            ) : null}
                            {!comp.vkn && !comp.tckn ? comp.taxNumber || "—" : null}
                          </td>

                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  comp.tenantIdentifierNumber ? "bg-emerald-500" : "bg-amber-400"
                                }`} />
                                <span className="font-mono font-bold text-indigo-700">
                                  {comp.tenantIdentifierNumber || comp.vkn || comp.tckn || "Eşleşmedi"}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                Eşleşen: {comp.mysoftMatchedType?.toUpperCase() || "VKN"}
                              </span>
                              {(comp.eFaturaPrefix || comp.eArsivPrefix) && (
                                <div className="pt-1 text-[10px] space-y-0.5">
                                  <div className="text-blue-700 font-mono">
                                    e-Fat: <strong>{comp.eFaturaPrefix || "GIB"}</strong> {comp.eFaturaNextNumber ? `(${comp.eFaturaNextNumber})` : ""}
                                  </div>
                                  <div className="text-purple-700 font-mono">
                                    e-Arş: <strong>{comp.eArsivPrefix || "EAR"}</strong> {comp.eArsivNextNumber ? `(${comp.eArsivNextNumber})` : ""}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            {comp.id === "comp_default" ? (
                              <span className="text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-lg">
                                Standart Demo Verisi
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Boş Modüller (İzole)
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleSwitchCompany(comp.id)}
                                  className="px-2.5 py-1.5 bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-98 cursor-pointer"
                                  title="Bu Şirkete Geç"
                                >
                                  Şirkete Geç
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenMysoftMatch(comp)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                title="Mysoft VKN & TCKN Eşleştirmesini Yap"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Eşleştir</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditCompany(comp)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                                title="Şirketi ve Şifresini Düzenle"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Düzenle</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setCompanyToDelete(comp)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="Şirketi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Şirket Sil</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📁 TAB 3: EVRAK & DOSYA DENETİMİ */}
      {/* ========================================================================= */}
      {activeTab === "files" && (
        <div className="card-elevation-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sistem Geneli Yüklenen Belgeler & Evraklar</h3>
              <p className="text-xs text-slate-500">Tüm kullanıcıların buluta yüklediği evrak ve dosyalar</p>
            </div>
            <span className="bg-blue-50 text-[#0f6bae] border border-blue-200 text-xs font-bold px-3 py-1 rounded-xl font-mono">
              Toplam: {allFiles.length} Belge
            </span>
          </div>

          {allFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">Henüz yüklenmiş bulut belgesi bulunmamaktadır.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allFiles.map((file) => (
                <div key={file.id} className="py-3 px-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 rounded-xl transition-colors duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{file.fileName}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {file.category} • {formatBytes(file.fileSize)} • Yükleyen: {file.userEmail || file.userId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(file.fileUrl || file.fileData) && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-[#0f6bae] rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-200"
                        title="Önizle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFile(file)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-200"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💼 TAB 4: SGK VE PERSONEL VERGİLENDİRME */}
      {/* ========================================================================= */}
      {activeTab === "payroll" && (
        <PayrollParametersPanel
          canEdit={currentUser.role === "admin" || currentUser.role?.includes("Admin") || currentUser.id === "usr_admin_001" || currentUser.id === "nuT309AyQxQKddnAp1ZJjlSgBXt2"}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================================= */}
      {/* 📢 TAB 5: CANLI GÜNCELLEME VE DUYURU DAĞITIMI */}
      {/* ========================================================================= */}
      {activeTab === "broadcast" && (
        <AdminBroadcastPanel currentUser={currentUser} />
      )}

      {/* ========================================================================= */}
      {/* 🛡️ TAB 6: MERKEZİ DENETİM GÜNLÜĞÜ */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <AdminAuditPanel />
      )}

      {/* ========================================================================= */}
      {/* 🛑 MODALS & DIALOGS */}
      {/* ========================================================================= */}

      {/* 1. YENİ KULLANICI EKLE MODALI */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#e2e7ff] shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div
              className="p-4 text-white flex items-center justify-between border-b"
              style={{ backgroundColor: "#131b2e", borderColor: "#222a3d" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#0f6bae] text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-base font-medium text-white">Yeni Personel / Kullanıcı Ekle</h3>
                  <p className="text-[11px] text-[#9daec3]">Sistem girişi, kullanıcı adı, şifre ve rol bazlı modül yetkilendirmesi</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-[#9daec3] hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {createdSuccessInfo ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg text-[#0d7f56] flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider label-caps">Kullanıcı Başarıyla Oluşturuldu</h4>
                      <p className="text-xs text-slate-700 mt-1">
                        Aşağıdaki giriş bilgilerini personelinizle paylaşabilirsiniz. Bu bilgiler aynı zamanda Admin Paneli şifre tablosuna kaydedilmiştir.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#faf8ff] rounded-lg border border-[#e2e7ff] space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-sans">Ad Soyad:</span>
                      <span className="font-semibold text-slate-900">{createdSuccessInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-sans">Kullanıcı Adı (Giriş):</span>
                      <span className="font-bold text-[#0f6bae]">{createdSuccessInfo.username}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-sans">E-posta:</span>
                      <span className="font-semibold text-slate-900">{createdSuccessInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-sans">Giriş Şifresi:</span>
                      <span className="font-bold text-[#0f6bae] bg-[#eaedff] px-2 py-0.5 rounded border border-[#c6cdff]">
                        {createdSuccessInfo.password || createdSuccessInfo.passwordPlain}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-sans">Yetkili Modüller:</span>
                      <span className="font-semibold text-[#0d7f56]">
                        {createdSuccessInfo.allowedModulesCount ?? (createdSuccessInfo.allowedModules?.length || 0)} Modül
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pwd = createdSuccessInfo.password || createdSuccessInfo.passwordPlain;
                        const info = `Muavin ERP Giriş Bilgileri\nKullanıcı Adı: ${createdSuccessInfo.username}\nE-posta: ${createdSuccessInfo.email}\nŞifre: ${pwd}`;
                        navigator.clipboard.writeText(info);
                        setCopiedKey("credentials");
                        setTimeout(() => setCopiedKey(null), 2000);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === "credentials" ? <Check className="w-3.5 h-3.5 text-[#0d7f56]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "credentials" ? "Kopyalandı!" : "Bilgileri Kopyala"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddUserModalOpen(false);
                        setCreatedSuccessInfo(null);
                      }}
                      className="px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white font-semibold text-xs rounded shadow-2xs transition-colors cursor-pointer"
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-[#0f6bae] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Merkezi Yetkilendirme Kuralı: </span>
                      <span className="text-slate-600 text-[11px]">
                        Sistem dışarıdan serbest kayda kapalıdır. Burada tanımladığınız kullanıcı adı ve şifreler Admin Panelinde her zaman görüntülenebilir.
                      </span>
                    </div>
                  </div>

                  {createUserError && (
                    <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] rounded text-[#b91c1c] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{createUserError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Ad Soyad <span className="text-[#b91c1c]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full px-3 py-1.5 bg-[#faf8ff] border border-[#e2e7ff] rounded text-xs text-slate-800 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Kullanıcı Adı (Giriş)
                      </label>
                      <input
                        type="text"
                        value={newUserUsername}
                        onChange={(e) => setNewUserUsername(e.target.value)}
                        placeholder="Örn: ahmetyilmaz"
                        className="w-full px-3 py-1.5 bg-[#faf8ff] border border-[#e2e7ff] rounded font-mono text-xs text-slate-800 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        E-posta Adresi <span className="text-[#b91c1c]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => {
                          setNewUserEmail(e.target.value);
                          if (!newUserUsername && e.target.value.includes("@")) {
                            setNewUserUsername(e.target.value.split("@")[0].toLowerCase());
                          }
                        }}
                        placeholder="personel@sirketiniz.com"
                        className="w-full px-3 py-1.5 bg-[#faf8ff] border border-[#e2e7ff] rounded text-xs text-slate-800 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Giriş Şifresi <span className="text-[#b91c1c]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewUserPassword(generateRandomPassword())}
                          className="text-[10px] text-[#0f6bae] font-semibold hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" /> Rastgele Üret
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#faf8ff] border border-[#e2e7ff] rounded font-mono text-xs text-slate-800 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Görevi / Rolü <span className="text-[#b91c1c]">*</span>
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#faf8ff] border border-[#e2e7ff] rounded text-xs text-slate-800 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] focus:outline-none cursor-pointer"
                      >
                        <option value="Ön Muhasebe Görevlisi">Ön Muhasebe Görevlisi</option>
                        <option value="Satış & Müşteri Temsilcisi">Satış & Müşteri Temsilcisi</option>
                        <option value="Oto Servis Teknisyeni">Oto Servis Teknisyeni</option>
                        <option value="BT & Bilişim Uzmanı">BT & Bilişim Uzmanı</option>
                        <option value="Ev Aletleri & Servis Teknisyeni">Ev Aletleri & Servis Teknisyeni</option>
                        <option value="Teknik Servis Müdürü">Teknik Servis Müdürü</option>
                        <option value="Depo & Stok Sorumlusu">Depo & Stok Sorumlusu</option>
                        <option value="Yönetici">Yönetici</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Şirket Adı</label>
                      <input
                        type="text"
                        value={newUserCompany}
                        onChange={(e) => setNewUserCompany(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#faf8ff] border border-[#e2e7ff] rounded text-xs text-slate-800 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Telefon Numarası</label>
                      <input
                        type="text"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#faf8ff] border border-[#e2e7ff] rounded text-xs text-slate-800 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Modül Yetki Seçici */}
                  <div className="pt-2 border-t border-[#e2e7ff] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider label-caps">
                        Erişebileceği Modüller ({newUserAllowedModules.length}/{ALL_APP_MODULES.length})
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewUserAllowedModules(ALL_APP_MODULES.map((m) => m.key))}
                          className="text-[10px] text-[#0f6bae] font-semibold hover:underline"
                        >
                          Tümünü Seç
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setNewUserAllowedModules(["dashboard"])}
                          className="text-[10px] text-[#b91c1c] font-semibold hover:underline"
                        >
                          Tümünü Kaldır
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 bg-[#faf8ff] border border-[#e2e7ff] rounded">
                      {allAppModules.map((mod) => {
                        const checked = isKeyAllowedInList(
                          mod.key,
                          mod.parentKey,
                          newUserAllowedModules
                        );
                        return (
                          <label
                            key={mod.key}
                            className={`flex items-center gap-2 p-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                              checked
                                ? mod.isSubModule
                                  ? "bg-purple-50 text-purple-900 font-medium"
                                  : "bg-[#eaedff] text-[#0f6bae] font-medium"
                                : "text-slate-700 hover:bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setNewUserAllowedModules((prev) =>
                                  toggleModuleSelectionWithSubModules(
                                    mod.key,
                                    prev
                                  ) as AppModuleKey[]
                                );
                              }}
                              className="w-3.5 h-3.5 text-[#0f6bae] rounded border-slate-300 focus:ring-[#0f6bae]"
                            />
                            <span className="truncate">
                              {mod.isSubModule ? `↳ ${mod.label}` : mod.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-2 pt-3 border-t border-[#e2e7ff]">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={creatingUser}
                      className="px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white font-semibold text-xs rounded shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {creatingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{creatingUser ? "Kaydediliyor..." : "Kullanıcıyı Kaydet"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TEKİL DEĞİŞİKLİK KAYDETME ONAY MODALI */}
      {confirmSaveUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#e2e7ff] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#ecfdf5] text-[#0d7f56] flex items-center justify-center shrink-0 border border-[#a7f3d0]">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Modül Yetkilerini Kaydet</h3>
                <p className="text-xs text-slate-500">Değişiklikler veritabanına işlenecektir</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">{confirmSaveUser.name}</strong> kullanıcısı için düzenlediğiniz modül izinleri kalıcı olarak kaydedilecektir. Devam etmek istiyor musunuz?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSaveUser(null)}
                disabled={savingUserId !== null}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteSaveUser}
                disabled={savingUserId !== null}
                className="px-4 py-1.5 bg-[#0d7f56] hover:bg-[#055b3d] text-white font-semibold text-xs rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {savingUserId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{savingUserId ? "Kaydediliyor..." : "Onayla ve Kaydet"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TOPLU KAYIT ONAY MODALI */}
      {confirmBatchSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#e2e7ff] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#ecfdf5] text-[#0d7f56] flex items-center justify-center shrink-0 border border-[#a7f3d0]">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Toplu Yetki Kaydı</h3>
                <p className="text-xs text-slate-500">Tüm personel izinleri güncellenecektir</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Beklemede olan <strong className="text-slate-900 font-mono">{pendingChangesCount}</strong> personelin modül erişim izinleri Firestore veritabanına toplu olarak yazılacaktır.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBatchSaveModalOpen(false)}
                disabled={isBatchSaving}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchSave}
                disabled={isBatchSaving}
                className="px-4 py-1.5 bg-[#0d7f56] hover:bg-[#055b3d] text-white font-semibold text-xs rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isBatchSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isBatchSaving ? "Kaydediliyor..." : "Tümünü Kaydet"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DETAYLI YETKİ VE GİRİŞ BİLGİLERİ (KULLANICI ADI & ŞİFRE) DÜZENLEME MODALI */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#e2e7ff] shadow-xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden">
            <div
              className="p-4 text-white flex items-center justify-between border-b"
              style={{ backgroundColor: "#131b2e", borderColor: "#222a3d" }}
            >
              <div>
                <h3 className="font-editorial text-base font-medium text-white">
                  Kullanıcı Adı, Şifre & Yetkiler: {editingPermissionsUser.name}
                </h3>
                <p className="text-[11px] text-[#9daec3] font-mono">{editingPermissionsUser.email}</p>
              </div>
              <button
                onClick={() => setEditingPermissionsUser(null)}
                className="p-1.5 text-[#9daec3] hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {/* 🔑 Giriş Kimlik Bilgileri (Kullanıcı Adı & Şifre) Düzenleme Alanı */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    Giriş Kimlik Bilgileri (Kullanıcı Adı & Şifre)
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditPasswordPlain(generateRandomPassword())}
                    className="text-[10px] font-bold text-[#0f6bae] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Yeni Şifre Üret
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Kullanıcı Adı (Giriş)
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="kullanici_adi"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono text-xs font-bold text-[#0f6bae] focus:border-[#0f6bae] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Giriş Şifresi
                    </label>
                    <input
                      type="text"
                      value={editPasswordPlain}
                      onChange={(e) => setEditPasswordPlain(e.target.value)}
                      placeholder="Giriş şifresi"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono text-xs font-bold text-amber-950 focus:border-[#0f6bae] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider label-caps">
                  Hızlı Rol Şablonu Uygula
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STAFF_ROLE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedModulesToEdit([...p.modules])}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded border cursor-pointer transition-colors ${p.color}`}
                    >
                      {p.badge}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modules & Sub-Modules list */}
              <div className="space-y-2 pt-2 border-t border-[#e2e7ff]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider label-caps">
                    İzin Verilen Ana Modüller & Alt Modüller ({selectedModulesToEdit.length}/{allAppModules.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedModulesToEdit(allAppModules.map((m) => m.key))}
                      className="text-[10px] text-[#0f6bae] font-semibold hover:underline"
                    >
                      Tümünü Seç
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedModulesToEdit(["dashboard"])}
                      className="text-[10px] text-[#b91c1c] font-semibold hover:underline"
                    >
                      Tümünü Kaldır
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 bg-[#faf8ff] border border-[#e2e7ff] rounded max-h-60 overflow-y-auto">
                  {allAppModules.map((mod) => {
                    const isChecked = isKeyAllowedInList(
                      mod.key,
                      mod.parentKey,
                      selectedModulesToEdit
                    );
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? mod.isSubModule
                              ? "bg-purple-50 text-purple-900 font-medium border border-purple-200"
                              : "bg-[#eaedff] text-[#0f6bae] font-medium"
                            : "text-slate-700 hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedModulesToEdit((prev) =>
                              toggleModuleSelectionWithSubModules(
                                mod.key,
                                prev
                              ) as AppModuleKey[]
                            );
                          }}
                          className="w-4 h-4 text-[#0f6bae] rounded border-slate-300 focus:ring-[#0f6bae]"
                        />
                        <span className="truncate">
                          {mod.isSubModule ? `↳ ${mod.label}` : mod.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[#e2e7ff] flex items-center justify-between gap-2">
              {canDeleteUser(editingPermissionsUser) ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = editingPermissionsUser;
                    setEditingPermissionsUser(null);
                    handleOpenDeleteUserModal(target);
                  }}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Kullanıcıyı Sistemden Kalıcı Olarak Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kullanıcıyı Sil</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPermissionsUser(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedPermissions}
                  disabled={savingPermissions}
                  className="px-4 py-1.5 bg-[#0f6bae] hover:bg-[#005289] text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingPermissions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingPermissions ? "Kaydediliyor..." : "Şifre & Yetkileri Güncelle"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. KULLANICI EVRAKLARI MODALI */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#e2e7ff] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div
              className="p-4 text-white flex items-center justify-between border-b"
              style={{ backgroundColor: "#131b2e", borderColor: "#222a3d" }}
            >
              <div>
                <h3 className="font-editorial text-base font-medium text-white">
                  Kullanıcı Evrakları: {selectedUser.name}
                </h3>
                <p className="text-[11px] text-[#9daec3] font-mono">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-[#9daec3] hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar">
              {getFilesForUser(selectedUser.userId).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Bu kullanıcıya ait yüklenmiş herhangi bir evrak veya belge bulunmuyor.
                </div>
              ) : (
                <div className="divide-y divide-[#e2e7ff]">
                  {getFilesForUser(selectedUser.userId).map((file) => (
                    <div key={file.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{file.fileName}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {file.category} • {formatBytes(file.fileSize)} • {new Date(file.uploadDate).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(file.fileUrl || file.fileData) && (
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 bg-[#eaedff] hover:bg-[#dce3ff] text-[#0f6bae] rounded text-xs font-semibold transition-colors cursor-pointer border border-[#c6cdff]"
                            title="Önizle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-1.5 bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#b91c1c] rounded text-xs font-semibold transition-colors cursor-pointer border border-[#fecdd3]"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-[#e2e7ff] flex items-center justify-between">
              {canDeleteUser(selectedUser) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenDeleteUserModal(selectedUser);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kullanıcıyı Sistemden Sil</span>
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EVRAK ÖNİZLEME MODALI */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#e2e7ff] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div
              className="p-4 text-white flex items-center justify-between border-b"
              style={{ backgroundColor: "#131b2e", borderColor: "#222a3d" }}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-[#c6cdff] shrink-0" />
                <h3 className="font-editorial text-sm font-medium text-white truncate">{previewFile.fileName}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(previewFile.fileUrl || previewFile.fileData) && (
                  <a
                    href={previewFile.fileUrl || previewFile.fileData}
                    download={previewFile.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                    title="İndir"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 text-[#9daec3] hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex items-center justify-center bg-[#faf8ff] min-h-[300px]">
              {previewFile.fileType.startsWith("image/") ? (
                <img
                  src={previewFile.fileUrl || previewFile.fileData}
                  alt={previewFile.fileName}
                  className="max-h-[70vh] object-contain rounded border border-[#e2e7ff]"
                />
              ) : previewFile.fileType.includes("pdf") ? (
                <iframe
                  src={previewFile.fileUrl || previewFile.fileData}
                  title={previewFile.fileName}
                  className="w-full h-[70vh] rounded border border-[#e2e7ff]"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center mx-auto border border-slate-200">
                    {getFileIcon(previewFile.fileType)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{previewFile.fileName}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      {previewFile.category} • {formatBytes(previewFile.fileSize)}
                    </p>
                  </div>
                  {(previewFile.fileUrl || previewFile.fileData) && (
                    <a
                      href={previewFile.fileUrl || previewFile.fileData}
                      download={previewFile.fileName}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white font-semibold text-xs rounded shadow-2xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Belgeyi İndir</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔴 KULLANICI SİLME ONAY MODALI */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kullanıcı Silme Yetkisi / Onayı</h3>
                  <p className="text-[11px] text-rose-100 font-medium">Bu işlem kullanıcıyı ve sistem yetkilerini kalıcı olarak kaldırır</p>
                </div>
              </div>
              <button
                onClick={() => !isDeletingUser && setUserToDelete(null)}
                disabled={isDeletingUser}
                className="p-1.5 text-rose-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* User Profile Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#131b2e] text-white font-bold flex items-center justify-center text-sm shadow-xs border border-[#222a3d]">
                    {userToDelete.name ? userToDelete.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{userToDelete.name}</h4>
                    <p className="text-xs text-slate-500 font-mono truncate">{userToDelete.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0f6bae] border border-blue-200">
                        {userToDelete.role || "Standart Personel"}
                      </span>
                      {userToDelete.companyName && (
                        <span className="text-[10px] text-slate-500 truncate">
                          • {userToDelete.companyName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Yetkili Modüller:</span>
                    <p className="font-bold text-slate-700">{getUserEffectiveModules(userToDelete).length} Modül</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Yüklü Evrak Sayısı:</span>
                    <p className="font-bold text-slate-700">{getFilesForUser(userToDelete.userId).length} Dosya</p>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <p className="font-bold">Dikkat: Bu işlem geri alınamaz!</p>
                  <p className="text-rose-700 leading-relaxed text-[11px]">
                    Kullanıcının sisteme erişim yetkileri, modül izinleri ve profili merkezi veritabanından kalıcı olarak silinecektir. Kullanıcı oturum açamayacaktır.
                  </p>
                </div>
              </div>

              {/* Optional: Delete user files checkbox */}
              {getFilesForUser(userToDelete.userId).length > 0 && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={deleteUserFilesToo}
                    onChange={(e) => setDeleteUserFilesToo(e.target.checked)}
                    disabled={isDeletingUser}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Kullanıcıya ait yüklenmiş {getFilesForUser(userToDelete.userId).length} adet evrak/belgeyi de arşivden sil
                  </span>
                </label>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-101 active:scale-99"
              >
                {isDeletingUser ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Evet, Kullanıcıyı Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 HIZLI KULLANICI SİLME LİSTESİ MODALI */}
      {isQuickDeleteUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <UserMinus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kullanıcı Silme Paneli</h3>
                  <p className="text-xs text-rose-100 font-medium">
                    Sistemde kayıtlı kullanıcı ve personelleri görüntüleyip dilediğinizi kalıcı olarak silebilirsiniz
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickDeleteUserModalOpen(false)}
                className="p-1.5 text-rose-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Silmek istediğiniz kullanıcıyı ara (isim, e-posta, şirket)..."
                  value={quickDeleteSearchTerm}
                  onChange={(e) => setQuickDeleteSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* User List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
              {(() => {
                const filtered = users.filter((u) => {
                  if (!quickDeleteSearchTerm.trim()) return true;
                  const term = quickDeleteSearchTerm.toLowerCase();
                  return (
                    u.name?.toLowerCase().includes(term) ||
                    u.email?.toLowerCase().includes(term) ||
                    u.companyName?.toLowerCase().includes(term) ||
                    u.role?.toLowerCase().includes(term)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium space-y-2">
                      <Users className="w-8 h-8 mx-auto text-slate-300" />
                      <p>Aramaya uygun kullanıcı bulunamadı.</p>
                    </div>
                  );
                }

                return filtered.map((u) => {
                  const deletable = canDeleteUser(u);
                  const isSysAdmin = isUserSysAdmin(u);
                  const userFilesCount = getFilesForUser(u.userId).length;

                  return (
                    <div
                      key={u.userId}
                      className="p-3.5 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#131b2e] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 border border-[#222a3d]">
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{u.name}</h4>
                            {isSysAdmin ? (
                              <span className="bg-[#131b2e] text-[#c6cdff] border border-[#222a3d] text-[9px] font-bold px-1.5 py-0.5 rounded label-caps">
                                Süper Admin
                              </span>
                            ) : (
                              <span className="bg-blue-50 text-[#0f6bae] border border-blue-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {u.role || "Personel"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono truncate">{u.email}</p>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {u.companyName ? `${u.companyName} • ` : ""}{userFilesCount} dosya
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {deletable ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsQuickDeleteUserModalOpen(false);
                              handleOpenDeleteUserModal(u);
                            }}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Kullanıcıyı Sil</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-not-allowed">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Aktif Oturum (Silinemez)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Toplam Kayıtlı: {users.length} Kullanıcı
              </span>
              <button
                type="button"
                onClick={() => setIsQuickDeleteUserModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ŞİRKET SİLME ONAY MODALI */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Şirket Silme Onayı</h3>
                  <p className="text-xs text-rose-100 font-medium">
                    Seçili şirket ve yapılandırma bilgileri silinecek
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompanyToDelete(null)}
                disabled={isDeletingCompany}
                className="p-1.5 text-rose-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f6bae] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {companyToDelete.companyName}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {companyToDelete.companyTitle || companyToDelete.companyName}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">VKN / TCKN:</span>
                    <p className="font-mono font-semibold text-slate-700">
                      {companyToDelete.vkn || companyToDelete.tckn || companyToDelete.taxNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Giriş Kullanıcı Adı:</span>
                    <p className="font-mono font-bold text-[#0f6bae]">
                      {companyToDelete.loginUsername || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 space-y-1">
                  <p className="font-bold">Bu şirketi silmek istediğinize emin misiniz?</p>
                  <p className="text-rose-700 leading-relaxed text-[11px]">
                    Şirket kaydı, giriş kimlik bilgileri ve eşleştirme ayarları sistemden kaldırılacaktır.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                disabled={isDeletingCompany}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCompany}
                disabled={isDeletingCompany}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingCompany ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Evet, Şirketi Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 HIZLI ŞİRKET SİLME LİSTESİ MODALI */}
      {isQuickDeleteCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Şirket Silme Paneli</h3>
                  <p className="text-xs text-rose-100 font-medium">
                    Sistemde tanımlı şirketleri görüntüleyip dilediğinizi kalıcı olarak silebilirsiniz
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickDeleteCompanyModalOpen(false)}
                className="p-1.5 text-rose-100 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Silmek istediğiniz şirketi ara (şirket adı, unvan, VKN/TCKN, kullanıcı adı)..."
                  value={quickDeleteCompanySearchTerm}
                  onChange={(e) => setQuickDeleteCompanySearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
              {(() => {
                const filtered = adminCompanies.filter((c) => {
                  if (!quickDeleteCompanySearchTerm.trim()) return true;
                  const term = quickDeleteCompanySearchTerm.toLowerCase();
                  return (
                    c.companyName?.toLowerCase().includes(term) ||
                    c.companyTitle?.toLowerCase().includes(term) ||
                    c.vkn?.includes(term) ||
                    c.tckn?.includes(term) ||
                    c.loginUsername?.toLowerCase().includes(term)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium space-y-2">
                      <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                      <p>Aramaya uygun şirket bulunamadı.</p>
                    </div>
                  );
                }

                return filtered.map((comp) => {
                  const isActive = comp.id === adminActiveCompId;
                  return (
                    <div
                      key={comp.id}
                      className="p-3.5 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#0f6bae] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{comp.companyName}</h4>
                            {isActive && (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Aktif Şirket
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{comp.companyTitle || comp.companyName}</p>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {comp.vkn ? `VKN: ${comp.vkn}` : comp.tckn ? `TCKN: ${comp.tckn}` : comp.taxNumber || "—"} • K.Adı: {comp.loginUsername || "test"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickDeleteCompanyModalOpen(false);
                            setCompanyToDelete(comp);
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Şirketi Sil</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Toplam Kayıtlı: {adminCompanies.length} Şirket
              </span>
              <button
                type="button"
                onClick={() => setIsQuickDeleteCompanyModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Modal */}
      <CompanyModal
        isOpen={isCompModalOpen}
        onClose={() => setIsCompModalOpen(false)}
        onSave={handleSaveCompany}
        onDelete={(id) => {
          const target = adminCompanies.find((c) => c.id === id);
          if (target) {
            setCompanyToDelete(target);
          } else {
            handleDeleteCompany(id);
          }
        }}
        initialCompany={compToEdit}
        mode={compModalMode}
        currentUser={currentUser}
      />

      {/* Define Custom Module / Sub-Module Modal (Admin & System Administrator Only) */}
      {showDefineModuleModal && isAdminOrSysAdmin(currentUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/30 dark:to-indigo-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Yeni Modül / Alt Modül Tanımla
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sadece Admin ve Sistem Yöneticisi tarafından tanımlanabilir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDefineModuleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setNewModuleForm((prev) => ({ ...prev, isSubModule: false }))
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    !newModuleForm.isSubModule
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="text-xs font-extrabold uppercase">Ana Modül</div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Doğrudan ana menü ve yetki matrisinde yer alır
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewModuleForm((prev) => ({ ...prev, isSubModule: true }))
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    newModuleForm.isSubModule
                      ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="text-xs font-extrabold uppercase">Alt Modül</div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Bir ana modüle bağlı alt sekme/yetki olarak tanımlanır
                  </div>
                </button>
              </div>

              {newModuleForm.isSubModule && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bağlı Olduğu Ana Modül
                  </label>
                  <select
                    value={newModuleForm.parentKey}
                    onChange={(e) =>
                      setNewModuleForm((prev) => ({
                        ...prev,
                        parentKey: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    {allAppModules
                      .filter((m) => !m.isSubModule)
                      .map((parent) => (
                        <option key={parent.key} value={parent.key}>
                          {parent.label} ({parent.category})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {newModuleForm.isSubModule ? "Alt Modül Adı *" : "Ana Modül Adı *"}
                </label>
                <input
                  type="text"
                  value={newModuleForm.label}
                  onChange={(e) =>
                    setNewModuleForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="Örn: İthalat / İhracat Operasyonları"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Modül Kategorisi
                  </label>
                  <select
                    value={newModuleForm.category}
                    onChange={(e) =>
                      setNewModuleForm((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Temel">Temel</option>
                    <option value="Ticari & Finans">Ticari & Finans</option>
                    <option value="Operasyon">Operasyon</option>
                    <option value="Sektörel">Sektörel</option>
                    <option value="Rapor & Analiz">Rapor & Analiz</option>
                    <option value="Sistem">Sistem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teknik Kod (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={newModuleForm.key}
                    onChange={(e) =>
                      setNewModuleForm((prev) => ({ ...prev, key: e.target.value }))
                    }
                    placeholder="Otomatik oluşturulur"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Modül / Alt Modül Açıklaması
                </label>
                <input
                  type="text"
                  value={newModuleForm.description}
                  onChange={(e) =>
                    setNewModuleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Yetki matrisinde görünecek açıklama..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDefineModuleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleCreateCustomModule}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Modülü Sisteme Tanımla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
