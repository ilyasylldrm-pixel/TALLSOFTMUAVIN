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
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { UserProfile, BRAND_LOGOS } from "./AuthModal";
import {
  getAllUsersProfiles,
  getAllFilesForAdmin,
  deleteUserFile,
  saveUserProfile,
  deleteUserProfile,
  UserProfileData,
  UserFileMetadata,
} from "../lib/firebase";
import { ALL_APP_MODULES, AppModuleKey } from "../types";

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
    color: "bg-blue-50 text-blue-800 border-blue-200",
    description: "Araç kabul, teşhis, lift ve yedek parça yönetimi",
    modules: ["dashboard", "auto_service", "contacts", "products", "files"],
  },
  {
    id: "it_tech",
    name: "BT & Bilişim Teknikeri",
    badge: "💻 BT Servis",
    color: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Cihaz kabul, donanım onarım ve veri yedekleme takibi",
    modules: ["dashboard", "it_service", "contacts", "products", "files"],
  },
  {
    id: "appliance_tech",
    name: "Ev Aletleri & Klima Teknisyeni",
    badge: "❄️ Ev Aletleri Servis",
    color: "bg-cyan-50 text-cyan-900 border-cyan-200",
    description: "Beyaz eşya ve klima bakım, randevu ve servis fişleri",
    modules: ["dashboard", "appliance_service", "contacts", "products", "files"],
  },
  {
    id: "service_manager",
    name: "Teknik Servisler Müdürü",
    badge: "🛠️ Servis Müdürü",
    color: "bg-amber-50 text-amber-900 border-amber-200",
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
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
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
    color: "bg-slate-900 text-amber-300 border-slate-700",
    description: "Tüm sistem modüllerine ve raporlarına eksiksiz erişim",
    modules: ALL_APP_MODULES.map((m) => m.key),
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<"matrix" | "users" | "files">("matrix");
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [allFiles, setAllFiles] = useState<UserFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFileMetadata | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

      setUsers((prev) =>
        prev.map((u) => (u.userId === userId ? updatedUser : u))
      );
      handleCancelUserDraft(userId);
      setConfirmSaveUser(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Yetkiler kaydedilirken bir hata oluştu.");
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
      await fetchData();
      setConfirmBatchSaveModalOpen(false);
    } catch (err) {
      console.error("Batch save error:", err);
      alert("Toplu kayıt sırasında bir hata oluştu.");
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
      alert("Dosya silinirken hata oluştu.");
    }
  };

  const handleDeleteUser = async (userToDelete: UserProfileData) => {
    if (userToDelete.userId === currentUser.id) {
      alert("Kendi admin hesabınızı silemezsiniz.");
      return;
    }
    if (!window.confirm(`"${userToDelete.name}" (${userToDelete.email}) kullanıcısının sistem yetkilerini ve profilini silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await deleteUserProfile(userToDelete.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userToDelete.userId));
      handleCancelUserDraft(userToDelete.userId);
    } catch (err) {
      console.error("User deletion error:", err);
      alert("Kullanıcı silinirken bir hata oluştu.");
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
      setUsers((prev) =>
        prev.map((u) => (u.userId === editingPermissionsUser.userId ? updatedUser : u))
      );
      handleCancelUserDraft(editingPermissionsUser.userId);
      setEditingPermissionsUser(null);
    } catch (err) {
      console.error("Save permissions error:", err);
      alert("Yetki güncellenirken hata oluştu.");
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
    if (fileType.startsWith("image/")) return <Image className="w-5 h-5 text-purple-600" />;
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-rose-600" />;
    if (fileType.includes("sheet") || fileType.includes("excel") || fileType.includes("csv"))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 🚀 Top Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg border border-purple-400/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Sistem Yönetici & Yetkilendirme Paneli
                </h1>
                <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Yönetim & Yetkilendirme
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl">
                Personel rol sınırlandırmaları, modül bazlı erişim matrisi, kullanıcı profilleri ve evrak denetimi.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddUser}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg border border-purple-400/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Kullanıcı Ekle</span>
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-purple-100 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* 📑 Tab Navigation */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-6 pt-6 border-t border-purple-800/50">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === "matrix"
                ? "bg-white text-purple-950 shadow-md font-black"
                : "bg-white/5 text-purple-200 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Modül Yetkilendirme Matrisi</span>
            {pendingChangesCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingChangesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-purple-950 shadow-md font-black"
                : "bg-white/5 text-purple-200 hover:bg-white/10 border border-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kullanıcı & Personel Listesi ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "files"
                ? "bg-white text-purple-950 shadow-md font-black"
                : "bg-white/5 text-purple-200 hover:bg-white/10 border border-white/5"
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Evrak & Belge Denetimi ({allFiles.length})</span>
          </button>
        </div>
      </div>

      {/* ⚠️ Batch Changes Pending Alert Banner */}
      {pendingChangesCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                Kaydedilmemiş Yetki Değişiklikleri Mevcut
              </div>
              <div className="text-xs font-medium text-slate-900">
                {pendingChangesCount} personelin modül erişim izinlerinde yapılan değişiklikler henüz veritabanına işlenmedi.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDraftPermissions({})}
              className="px-3 py-1.5 bg-black/10 hover:bg-black/20 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tümünü Sıfırla</span>
            </button>
            <button
              onClick={() => setConfirmBatchSaveModalOpen(true)}
              className="px-4 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Toplu Kaydet ({pendingChangesCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔐 TAB 1: MODÜL YETKİLENDİRME MATRİSİ */}
      {/* ========================================================================= */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Quick Role Preset Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-purple-700" />
                  Hazır Personel Rol Şablonları:
                </span>
                {STAFF_ROLE_PRESETS.map((preset) => (
                  <span
                    key={preset.id}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-help ${preset.color}`}
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
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 📊 The Matrix Table */}
          <div className="bg-white rounded-3xl border border-purple-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white divide-x divide-slate-800">
                    <th className="p-4 font-black w-64 sticky left-0 bg-slate-900 z-20">
                      Personel & Rolü
                    </th>
                    <th className="p-3 font-bold text-center w-36 bg-slate-800/80">
                      Hızlı Şablon
                    </th>
                    {ALL_APP_MODULES.map((mod) => (
                      <th
                        key={mod.key}
                        className="p-3 font-bold text-center min-w-[90px] max-w-[120px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold leading-tight">{mod.label}</span>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 font-bold text-center w-32 sticky right-0 bg-slate-900 z-20">
                      İşlem & Kayıt
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isSysAdmin = isUserSysAdmin(user);
                    const effectiveModules = getUserEffectiveModules(user);
                    const isPending = hasUserPendingChanges(user.userId);

                    return (
                      <tr
                        key={user.userId}
                        className={`hover:bg-purple-50/30 transition-colors ${
                          isPending ? "bg-amber-50/50" : ""
                        }`}
                      >
                        {/* User Identity Column */}
                        <td className="p-4 sticky left-0 bg-white z-10 shadow-r border-r border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs shrink-0">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSysAdmin && (
                                  <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                              <div className="text-[10px] text-indigo-700 font-semibold truncate mt-0.5">
                                Rol: {user.role || "Standart Personel"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Quick Role Template Selector Dropdown */}
                        <td className="p-3 text-center border-r border-slate-100 bg-slate-50/40">
                          {isSysAdmin ? (
                            <span className="text-[10px] font-bold text-slate-400">Tam Erişim</span>
                          ) : (
                            <div className="flex flex-col gap-1 items-center">
                              <select
                                onChange={(e) => {
                                  const preset = STAFF_ROLE_PRESETS.find((p) => p.id === e.target.value);
                                  if (preset) handleApplyPresetToUser(user.userId, preset);
                                }}
                                defaultValue=""
                                className="w-full text-[10px] font-bold bg-white border border-purple-200 rounded-lg p-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
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
                                  className="text-[9px] text-indigo-700 font-bold hover:underline"
                                >
                                  Tümü
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAllFromUser(user.userId)}
                                  className="text-[9px] text-rose-600 font-bold hover:underline"
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
                            <td key={mod.key} className="p-3 text-center border-r border-slate-100">
                              {isSysAdmin ? (
                                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleInDraft(user.userId, mod.key)}
                                  className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center transition-all cursor-pointer ${
                                    isEnabled
                                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
                                      : "bg-slate-100 hover:bg-slate-200 border border-slate-300 text-transparent"
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
                        <td className="p-3 text-center sticky right-0 bg-white z-10 shadow-l border-l border-slate-100">
                          {isSysAdmin ? (
                            <span className="text-[10px] font-bold text-slate-400">Sistem Admini</span>
                          ) : isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCancelUserDraft(user.userId)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition-colors"
                                title="Değişikliği Geri Al"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmSaveUser(user)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Kaydet</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEditPermissions(user)}
                              className="px-2 py-1 text-[10px] font-bold text-purple-700 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                            >
                              Yetkileri Düzenle
                            </button>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-purple-100 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kullanıcı, e-posta veya şirket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleOpenAddUser}
              className="w-full sm:w-auto px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
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
                  className="bg-white rounded-3xl border border-purple-100 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">{user.name}</h3>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                        </div>
                      </div>

                      {isSysAdmin ? (
                        <span className="bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">
                          Süper Admin
                        </span>
                      ) : (
                        <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {user.role || "Ön Muhasebe"}
                        </span>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Şirket:</span>
                        <span className="font-bold text-slate-800 truncate">{user.companyName || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">İletişim:</span>
                        <span className="font-mono text-slate-700">{user.phone || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Yetkili Modüller:</span>
                        <span className="font-black text-purple-800">
                          {isSysAdmin ? "Tümü Açık (17)" : `${effectiveModules.length} Modül`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Yüklü Evrak:</span>
                        <span className="font-bold text-slate-700">{userFilesCount} Dosya</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Evraklar ({userFilesCount})</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPermissions(user)}
                        className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl cursor-pointer transition-colors"
                        title="Modül Yetkilerini Düzenle"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      {!isSysAdmin && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl cursor-pointer transition-colors"
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
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Sistem Geneli Yüklenen Belgeler & Evraklar</h3>
              <p className="text-xs text-slate-500">Tüm kullanıcıların buluta yüklediği evrak ve dosyalar</p>
            </div>
            <span className="bg-purple-100 text-purple-800 text-xs font-black px-3 py-1 rounded-full">
              Toplam: {allFiles.length} Belge
            </span>
          </div>

          {allFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Henüz yüklenmiş bulut belgesi bulunmamaktadır.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allFiles.map((file) => (
                <div key={file.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">{file.fileName}</h4>
                      <p className="text-[10px] text-slate-500">
                        {file.category} • {formatBytes(file.fileSize)} • Yükleyen: {file.userEmail || file.userId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(file.fileUrl || file.fileData) && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Önizle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFile(file)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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

    </div>
  );
};
