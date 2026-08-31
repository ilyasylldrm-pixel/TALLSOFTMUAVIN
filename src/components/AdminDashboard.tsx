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

      {/* ========================================================================= */}
      {/* 🛑 MODAL: SINGLE USER PERMISSION SAVE CONFIRMATION */}
      {/* ========================================================================= */}
      {confirmSaveUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Yetki Kaydını Onayla</h3>
                  <p className="text-[11px] text-emerald-100">{confirmSaveUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmSaveUser(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50 text-xs">
              <p className="text-slate-700 font-medium">
                <strong>{confirmSaveUser.name}</strong> kullanıcısı için seçilen ({getUserEffectiveModules(confirmSaveUser).length}) modül yetkisi kaydedilecektir.
              </p>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 max-h-48 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Erişim İzni Olan Modüller:</span>
                <div className="flex flex-wrap gap-1.5">
                  {getUserEffectiveModules(confirmSaveUser).map((key) => {
                    const mod = ALL_APP_MODULES.find((m) => m.key === key);
                    return (
                      <span key={key} className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                        {mod ? mod.label : key}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmSaveUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteSaveUser}
                disabled={savingUserId !== null}
                className="px-5 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {savingUserId !== null ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Onayla ve Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛑 MODAL: BATCH SAVE CONFIRMATION */}
      {/* ========================================================================= */}
      {confirmBatchSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Toplu Yetki Kaydı Onayı</h3>
                  <p className="text-[11px] text-orange-100">
                    {pendingChangesCount} kullanıcının yetkileri kaydedilecek
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmBatchSaveModalOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 bg-slate-50 max-h-80 overflow-y-auto custom-scrollbar text-xs">
              <p className="font-bold text-slate-700">Aşağıdaki personelin erişim izinleri güncellenecektir:</p>
              <div className="space-y-2">
                {pendingUsersList.map((user) => (
                  <div key={user.userId} className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{user.name}</div>
                      <div className="text-[10px] text-slate-500">{user.email}</div>
                    </div>
                    <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-bold border border-purple-200">
                      Toplam: {getUserEffectiveModules(user).length} Modül
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmBatchSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchSave}
                disabled={isBatchSaving}
                className="px-5 py-2.5 text-xs font-black bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isBatchSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Tümünü Onayla ve Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛑 MODAL: DETAILED USER PERMISSIONS EDITING */}
      {/* ========================================================================= */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-5 flex items-center justify-between border-b border-purple-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-black border border-indigo-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{editingPermissionsUser.name} — Modül İzinleri</h3>
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-400/30">
                      Rol: {editingPermissionsUser.role || "Standart"}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200/80">{editingPermissionsUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPermissionsUser(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50">
              {/* Presets Quick Actions */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800">Hazır Rol Şablonları ile Hızlı Seçim:</h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedModulesToEdit(ALL_APP_MODULES.map((m) => m.key))}
                      className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 cursor-pointer"
                    >
                      Tümünü Aç
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModulesToEdit(["dashboard"])}
                      className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 cursor-pointer"
                    >
                      Sadece Ana Sayfa
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {STAFF_ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedModulesToEdit([...preset.modules])}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer hover:shadow-2xs active:scale-95 ${preset.color}`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Module Checkbox Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar p-1">
                {ALL_APP_MODULES.map((module) => {
                  const isChecked = selectedModulesToEdit.includes(module.key);
                  return (
                    <div
                      key={module.key}
                      onClick={() =>
                        setSelectedModulesToEdit((prev) =>
                          prev.includes(module.key)
                            ? prev.filter((k) => k !== module.key)
                            : [...prev, module.key]
                        )
                      }
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked
                          ? "bg-indigo-50/70 border-indigo-300 shadow-2xs"
                          : "bg-slate-50/50 border-slate-200 opacity-50 hover:opacity-100"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-black text-slate-900 block">{module.label}</span>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{module.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPermissionsUser(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedPermissions}
                  disabled={savingPermissions}
                  className="px-5 py-2.5 text-xs font-extrabold bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingPermissions ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Kaydet ve Uygula</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛑 MODAL: NEW USER CREATION */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-5 flex items-center justify-between border-b border-purple-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-black border border-purple-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Yeni Sistem Kullanıcısı Tanımla</h3>
                  <p className="text-[11px] text-purple-200/80">Kullanıcı hesabı oluşturun ve modül yetkilerini belirleyin</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50">
              {createdSuccessInfo ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-900">Kullanıcı Başarıyla Oluşturuldu!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Kullanıcı sisteme aşağıdaki giriş bilgileriyle hemen giriş yapabilir.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Ad Soyad:</span>
                      <span className="font-extrabold text-slate-800">{createdSuccessInfo.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">E-Posta:</span>
                      <span className="font-mono font-bold text-purple-900">{createdSuccessInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Geçici Şifre:</span>
                      <span className="font-mono font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {createdSuccessInfo.passwordPlain}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">İzinli Modüller:</span>
                      <span className="font-bold text-slate-800">{createdSuccessInfo.allowedModulesCount} Modül Açık</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                  {createUserError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{createUserError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        Kullanıcı Adı Soyadı <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Örn: Mehmet Demir"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        E-Posta Adresi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="Örn: mehmet@sirket.com"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        Giriş Şifresi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono pr-20 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setNewUserPassword(generateRandomPassword())}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md cursor-pointer"
                        >
                          Yeni Üret
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        Sistem Rolü / Pozisyon
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => {
                          const role = e.target.value;
                          setNewUserRole(role);
                          // Auto preset match
                          const preset = STAFF_ROLE_PRESETS.find((p) => p.name.includes(role) || p.badge.includes(role));
                          if (preset) {
                            setNewUserAllowedModules([...preset.modules]);
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Ön Muhasebe Görevlisi">Ön Muhasebe Görevlisi</option>
                        <option value="Oto Servis Danışmanı & Teknisyeni">Oto Servis Danışmanı & Teknisyeni</option>
                        <option value="BT & Bilişim Teknikeri">BT & Bilişim Teknikeri</option>
                        <option value="Ev Aletleri & Klima Teknisyeni">Ev Aletleri & Klima Teknisyeni</option>
                        <option value="Teknik Servisler Müdürü">Teknik Servisler Müdürü</option>
                        <option value="Üretim & MES Sorumlusu">Üretim & MES Sorumlusu</option>
                        <option value="İK & Bordro Yetkilisi">İK & Bordro Yetkilisi</option>
                        <option value="Şirket Yöneticisi">Şirket Yöneticisi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        Firma / Şirket Adı
                      </label>
                      <input
                        type="text"
                        value={newUserCompany}
                        onChange={(e) => setNewUserCompany(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        İletişim Telefonu
                      </label>
                      <input
                        type="text"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Module Permissions Checkbox Selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-slate-800">
                          Erişebileceği Modüller ({newUserAllowedModules.length}/{ALL_APP_MODULES.length})
                        </label>
                        <p className="text-[10px] text-slate-500">
                          Kullanıcının sadece seçilen modülleri görmesini sağlayabilirsiniz.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewUserAllowedModules(ALL_APP_MODULES.map((m) => m.key))}
                          className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md hover:bg-purple-100 cursor-pointer"
                        >
                          Tümünü Seç
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewUserAllowedModules(["dashboard"])}
                          className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          Temizle
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {ALL_APP_MODULES.map((module) => {
                        const isChecked = newUserAllowedModules.includes(module.key);
                        return (
                          <div
                            key={module.key}
                            onClick={() =>
                              setNewUserAllowedModules((prev) =>
                                prev.includes(module.key)
                                  ? prev.filter((k) => k !== module.key)
                                  : [...prev, module.key]
                              )
                            }
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                              isChecked
                                ? "bg-purple-50/70 border-purple-300"
                                : "bg-slate-50/50 border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isChecked
                                  ? "bg-purple-600 border-purple-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {module.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={creatingUser}
                      className="px-5 py-2.5 text-xs font-extrabold bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {creatingUser ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>Kullanıcıyı Oluştur ve Yetkilendir</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛑 MODAL: USER FILES INSPECTION */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-5 flex items-center justify-between border-b border-purple-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-black border border-purple-500/30">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedUser.name} — Yüklü Dosyalar</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-400/30">
                      Admin İnceleme
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200/80">{selectedUser.email} • {selectedUser.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50">
              {(() => {
                const userFiles = getFilesForUser(selectedUser.userId);
                if (userFiles.length === 0) {
                  return (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                      <HardDrive className="w-12 h-12 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">Bu Kullanıcının Henüz Yüklenmiş Dosyası Yok</h4>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Yüklenen Evraklar ({userFiles.length})</span>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      {userFiles.map((file) => (
                        <div key={file.id} className="p-4 hover:bg-purple-50/50 transition-colors flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 truncate">{file.fileName}</h4>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {file.category} • {formatBytes(file.fileSize)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {(file.fileUrl || file.fileData) && (
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Önizle</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛑 MODAL: FILE PREVIEW */}
      {/* ========================================================================= */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-4 flex items-center justify-between border-b border-purple-800/40">
              <div className="flex items-center gap-2.5">
                {getFileIcon(previewFile.fileType)}
                <div>
                  <h3 className="text-xs font-black text-white">{previewFile.fileName}</h3>
                  <p className="text-[10px] text-purple-200/80">{previewFile.category} • {formatBytes(previewFile.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100">
              {previewFile.fileType.startsWith("image/") ? (
                <img
                  src={previewFile.fileUrl || previewFile.fileData}
                  alt={previewFile.fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-md border border-slate-200"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-md space-y-4">
                  <FileText className="w-12 h-12 text-purple-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{previewFile.fileName}</h4>
                    <p className="text-xs text-slate-500 mt-1">{previewFile.description}</p>
                  </div>
                  <a
                    href={previewFile.fileUrl || previewFile.fileData}
                    download={previewFile.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-purple-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-purple-800 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Dosyayı İndir</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
