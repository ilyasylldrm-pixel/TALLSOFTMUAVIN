import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  HardDrive,
  FileText,
  Search,
  Calendar,
  Eye,
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
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { UserProfile, BRAND_LOGOS } from "./AuthModal";
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
import { ALL_APP_MODULES, AppModuleKey } from "../types";
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "matrix" | "users" | "files" | "payroll" | "broadcast" | "audit">("overview");
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [allFiles, setAllFiles] = useState<UserFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFileMetadata | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // User Deletion Modal & State
  const [userToDelete, setUserToDelete] = useState<UserProfileData | null>(null);
  const [deleteUserFilesToo, setDeleteUserFilesToo] = useState(true);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserSuccessMessage, setDeleteUserSuccessMessage] = useState<string | null>(null);

  // Draft permissions state: changes staged before committing to Firebase
  const [draftPermissions, setDraftPermissions] = useState<Record<string, AppModuleKey[]>>({});

  // Modals & Save states
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [confirmSaveUser, setConfirmSaveUser] = useState<UserProfileData | null>(null);
  const [confirmBatchSaveModalOpen, setConfirmBatchSaveModalOpen] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Edit Permissions Detailed Modal
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfileData | null>(null);
  const [selectedModulesToEdit, setSelectedModulesToEdit] = useState<AppModuleKey[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserCompany, setNewUserCompany] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserTaxNumber, setNewUserTaxNumber] = useState("");
  const [newUserRole, setNewUserRole] = useState("Ön Muhasebe Görevlisi");
  const [newUserAllowedModules, setNewUserAllowedModules] = useState<AppModuleKey[]>(
    ALL_APP_MODULES.map((m) => m.key)
  );
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState("");
  const [createdSuccessInfo, setCreatedSuccessInfo] = useState<any | null>(null);

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
    return ALL_APP_MODULES.map((m) => m.key);
  };

  const getUserOriginalModules = (user: UserProfileData): AppModuleKey[] => {
    if (user.allowedModules && Array.isArray(user.allowedModules)) {
      return user.allowedModules;
    }
    return ALL_APP_MODULES.map((m) => m.key);
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

  // Toggle module in draft
  const handleToggleModuleInDraft = (userId: string, moduleKey: AppModuleKey) => {
    const user = users.find((u) => u.userId === userId);
    if (!user) return;
    const currentList = getUserEffectiveModules(user);
    const updated = currentList.includes(moduleKey)
      ? currentList.filter((k) => k !== moduleKey)
      : [...currentList, moduleKey];

    setDraftPermissions((prev) => ({
      ...prev,
      [userId]: updated,
    }));
  };

  // Apply Role Preset to User Draft
  const handleApplyPresetToUser = (userId: string, preset: RolePreset) => {
    setDraftPermissions((prev) => ({
      ...prev,
      [userId]: [...preset.modules],
    }));
  };

  // Grant / Revoke all for a user
  const handleGrantAllToUser = (userId: string) => {
    setDraftPermissions((prev) => ({
      ...prev,
      [userId]: ALL_APP_MODULES.map((m) => m.key),
    }));
  };

  const handleRevokeAllFromUser = (userId: string) => {
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
    if (user.userId === currentUser.id) return false;
    if (currentUser.email && user.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim()) return false;
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
      const newUserProfile: UserProfileData = {
        userId: generatedUserId,
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
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
  };

  const handleSaveEditedPermissions = async () => {
    if (!editingPermissionsUser) return;
    setSavingPermissions(true);
    try {
      const updatedUser: UserProfileData = {
        ...editingPermissionsUser,
        allowedModules: selectedModulesToEdit,
        updatedAt: new Date().toISOString(),
      };
      await saveUserProfile(updatedUser);
      saveLocalDbSyncReport({
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser?.name || currentUser?.email || "Sistem Yöneticisi",
        lastActionSummary: `Personel Yetkileri Güncellendi: ${editingPermissionsUser.name}`,
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
        description="Personel rol sınırlandırmaları, modül bazlı erişim matrisi, kullanıcı profilleri ve evrak denetimi."
        badge="Yönetim & Yetkilendirme"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddUser}
              className="bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Kullanıcı Ekle</span>
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
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenAddUserModal={() => setIsAddUserModalOpen(true)}
          onPreviewFile={(file) => setPreviewFile(file)}
          onDeleteUser={handleOpenDeleteUserModal}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================================= */}
      {/* 🔐 TAB 1: MODÜL YETKİLENDİRME MATRİSİ */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Quick Role Preset Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider label-caps flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#0f6bae]" />
                  Hazır Personel Rol Şablonları:
                </span>
                {STAFF_ROLE_PRESETS.map((preset) => (
                  <span
                    key={preset.id}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-help transition-all ${preset.color}`}
                    title={`${preset.name}: ${preset.description}`}
                  >
                    {preset.name}
                  </span>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
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
                    {ALL_APP_MODULES.map((mod) => (
                      <th
                        key={mod.key}
                        className="p-3 font-semibold text-center min-w-[90px] max-w-[120px] bg-white text-slate-800"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold leading-tight text-slate-800">{mod.label}</span>
                        </div>
                      </th>
                    ))}
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
                              <div className="text-[10px] text-[#0f6bae] font-semibold truncate mt-0.5">
                                Rol: {user.role || "Standart Personel"}
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

                        {/* Module Checkbox Columns */}
                        {ALL_APP_MODULES.map((mod) => {
                          const isEnabled = effectiveModules.includes(mod.key);

                          return (
                            <td key={mod.key} className="p-3 text-center border-r border-slate-200">
                              {isSysAdmin ? (
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleInDraft(user.userId, mod.key)}
                                  className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all cursor-pointer ${
                                    isEnabled
                                      ? "bg-[#0f6bae] hover:bg-[#005289] text-white shadow-2xs"
                                      : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-transparent"
                                  }`}
                                  title={`${user.name} için ${mod.label} erişimini aç/kapat`}
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
                              {!isSysAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPermissions(user)}
                                  className="px-2.5 py-1 text-[10px] font-bold text-[#0f6bae] hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                                  title="Modül Yetkilerini Düzenle"
                                >
                                  Yetkileri Düzenle
                                </button>
                              )}
                              {canDeleteUser(user) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteUserModal(user)}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                  title="Kullanıcıyı Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
                placeholder="Kullanıcı, e-posta veya şirket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:border-[#0f6bae] focus:ring-2 focus:ring-[#0f6bae] focus:outline-none"
              />
            </div>

            <button
              onClick={handleOpenAddUser}
              className="w-full sm:w-auto px-4 py-2 bg-[#0f6bae] hover:bg-[#005289] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Kullanıcı Tanımla</span>
            </button>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isSysAdmin = isUserSysAdmin(user);
              const effectiveModules = getUserEffectiveModules(user);
              const userFilesCount = getFilesForUser(user.userId).length;

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
                        className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0f6bae] rounded-xl border border-slate-200 hover:border-blue-200 cursor-pointer transition-all"
                        title="Modül Yetkilerini Düzenle"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      {canDeleteUser(user) && (
                        <button
                          onClick={() => handleOpenDeleteUserModal(user)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 cursor-pointer transition-all"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                  <p className="text-[11px] text-[#9daec3]">Sistem girişi ve rol bazlı modül yetkilendirmesi</p>
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
                        Aşağıdaki giriş bilgilerini personelinizle paylaşabilirsiniz. Güvenlik amacıyla bu bilgileri güvenli bir yerde saklayınız.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#faf8ff] rounded-lg border border-[#e2e7ff] space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-sans">Ad Soyad:</span>
                      <span className="font-semibold text-slate-900">{createdSuccessInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-sans">E-posta:</span>
                      <span className="font-semibold text-slate-900">{createdSuccessInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-sans">İlk Giriş Şifresi:</span>
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
                        const info = `Muavin ERP Giriş Bilgileri\nE-posta: ${createdSuccessInfo.email}\nŞifre: ${pwd}`;
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
                        Sistem dışarıdan serbest kayda kapalıdır. Siz burada personel oluşturmadığınız sürece hiç kimse sisteme yeni kayıt yapamaz veya giriş sağlayamaz.
                      </span>
                    </div>
                  </div>

                  {createUserError && (
                    <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] rounded text-[#b91c1c] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{createUserError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        E-posta Adresi <span className="text-[#b91c1c]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-[#faf8ff] border border-[#e2e7ff] rounded">
                      {ALL_APP_MODULES.map((mod) => {
                        const checked = newUserAllowedModules.includes(mod.key);
                        return (
                          <label
                            key={mod.key}
                            className={`flex items-center gap-2 p-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                              checked ? "bg-[#eaedff] text-[#0f6bae] font-medium" : "text-slate-700 hover:bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUserAllowedModules((prev) => [...prev, mod.key]);
                                } else {
                                  setNewUserAllowedModules((prev) => prev.filter((k) => k !== mod.key));
                                }
                              }}
                              className="w-3.5 h-3.5 text-[#0f6bae] rounded border-slate-300 focus:ring-[#0f6bae]"
                            />
                            <span className="truncate">{mod.label}</span>
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

      {/* 4. DETAYLI YETKİ DÜZENLEME MODALI */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-[#e2e7ff] shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div
              className="p-4 text-white flex items-center justify-between border-b"
              style={{ backgroundColor: "#131b2e", borderColor: "#222a3d" }}
            >
              <div>
                <h3 className="font-editorial text-base font-medium text-white">
                  Yetkileri Düzenle: {editingPermissionsUser.name}
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

              {/* Modules list */}
              <div className="space-y-2 pt-2 border-t border-[#e2e7ff]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider label-caps">
                    İzin Verilen Modüller ({selectedModulesToEdit.length}/{ALL_APP_MODULES.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedModulesToEdit(ALL_APP_MODULES.map((m) => m.key))}
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

                <div className="grid grid-cols-2 gap-2 p-2 bg-[#faf8ff] border border-[#e2e7ff] rounded max-h-64 overflow-y-auto">
                  {ALL_APP_MODULES.map((mod) => {
                    const isChecked = selectedModulesToEdit.includes(mod.key);
                    return (
                      <label
                        key={mod.key}
                        className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer transition-colors ${
                          isChecked ? "bg-[#eaedff] text-[#0f6bae] font-medium" : "text-slate-700 hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModulesToEdit((prev) => [...prev, mod.key]);
                            } else {
                              setSelectedModulesToEdit((prev) => prev.filter((k) => k !== mod.key));
                            }
                          }}
                          className="w-4 h-4 text-[#0f6bae] rounded border-slate-300 focus:ring-[#0f6bae]"
                        />
                        <span className="truncate">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[#e2e7ff] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPermissionsUser(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveEditedPermissions}
                disabled={savingPermissions}
                className="px-4 py-1.5 bg-[#0f6bae] hover:bg-[#005289] text-white font-semibold text-xs rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {savingPermissions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingPermissions ? "Kaydediliyor..." : "Yetkileri Güncelle"}</span>
              </button>
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

    </div>
  );
};
