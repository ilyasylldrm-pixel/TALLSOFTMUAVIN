import React, { useState } from "react";
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
  ExternalLink,
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
  HelpCircle,
  RotateCcw,
  Undo2,
  ArrowRight,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import { UserProfile, BRAND_LOGOS } from "./AuthModal";
import {
  getAllUsersProfiles,
  getAllFilesForAdmin,
  deleteUserFile,
  saveUserProfile,
  deleteUserProfile,
  UserProfileData,
  UserFileMetadata
} from "../lib/firebase";
import { ALL_APP_MODULES, AppModuleKey } from "../types";

interface AdminDashboardProps {
  currentUser: UserProfile;
}

// Key modules highlighted in the table
const CORE_MATRIX_MODULES: {
  key: AppModuleKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    key: "contacts",
    label: "Cari Hesaplar",
    shortLabel: "Cari",
    icon: Users,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    key: "invoices",
    label: "E-Belgeler / Fatura",
    shortLabel: "Fatura",
    icon: FileText,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    key: "accounts",
    label: "Finans & Kasa",
    shortLabel: "Kasa",
    icon: Wallet,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    key: "hr",
    label: "İnsan Kaynakları",
    shortLabel: "İK",
    icon: UserCheck,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  {
    key: "products",
    label: "Stok & Ürünler",
    shortLabel: "Stok",
    icon: PackageIcon,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    key: "orders_module",
    label: "Sipariş & Proforma",
    shortLabel: "Sipariş",
    icon: ShoppingCart,
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  {
    key: "reports",
    label: "Vergilendirme & Rapor",
    shortLabel: "Rapor",
    icon: BarChart3,
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    key: "files",
    label: "Bulut Depo",
    shortLabel: "Depo",
    icon: HardDrive,
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  {
    key: "ai",
    label: "AI Asistanı",
    shortLabel: "AI",
    icon: Sparkles,
    color: "text-fuchsia-700",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-200",
  },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [allFiles, setAllFiles] = useState<UserFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "hasFiles" | "adminCreated">("all");
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFileMetadata | null>(null);

  // Active Main View Tab: "matrix" (Yetkilendirme Matrisi) vs "list" (Detaylı Kullanıcı & Dosya Listesi)
  const [activeAdminTab, setActiveAdminTab] = useState<"matrix" | "list">("matrix");

  // Draft / Pending unsaved permission changes in Matrix view: Record<userId, AppModuleKey[]>
  const [draftPermissions, setDraftPermissions] = useState<Record<string, AppModuleKey[]>>({});

  // Single User Save Confirmation Modal State
  const [confirmSaveData, setConfirmSaveData] = useState<{
    user: UserProfileData;
    newModules: AppModuleKey[];
    oldModules: AppModuleKey[];
  } | null>(null);

  // Batch Save Confirmation Modal State
  const [confirmBatchSaveModalOpen, setConfirmBatchSaveModalOpen] = useState(false);

  // Saving state & feedback
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [savedUserFeedback, setSavedUserFeedback] = useState<string | null>(null);

  // New User Creation Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserCompany, setNewUserCompany] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("+90 (212) 555 0100");
  const [newUserTaxNumber, setNewUserTaxNumber] = useState("1234567890");
  const [newUserRole, setNewUserRole] = useState("Ön Muhasebe Görevlisi");
  const [newUserAllowedModules, setNewUserAllowedModules] = useState<AppModuleKey[]>(
    ALL_APP_MODULES.map((m) => m.key)
  );
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState("");
  const [createdSuccessInfo, setCreatedSuccessInfo] = useState<{
    email: string;
    passwordPlain: string;
    name: string;
    allowedModulesCount: number;
  } | null>(null);

  // Detailed User Permissions Editing Modal State
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfileData | null>(null);
  const [selectedModulesToEdit, setSelectedModulesToEdit] = useState<AppModuleKey[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  React.useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, filesData] = await Promise.all([
        getAllUsersProfiles(),
        getAllFilesForAdmin()
      ]);

      // Ensure current user is in the list if not present
      let mergedUsers = [...usersData];
      if (!mergedUsers.some((u) => u.userId === currentUser.id)) {
        mergedUsers.push({
          userId: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          companyName: currentUser.companyName,
          phone: currentUser.phone || "",
          taxNumber: currentUser.taxNumber || "",
          selectedLogoId: currentUser.selectedLogoId,
          selectedLogoName: currentUser.selectedLogoName,
          selectedLogoUrl: currentUser.selectedLogoUrl,
          role: currentUser.role,
          allowedModules: currentUser.allowedModules
        });
      }

      setUsers(mergedUsers);
      setAllFiles(filesData);
      setDraftPermissions({});
    } catch (err) {
      console.error("Admin verileri yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilesForUser = (userId: string) => {
    return allFiles.filter((f) => f.userId === userId);
  };

  const isUserSysAdmin = (user: UserProfileData) => {
    return (
      user.role?.includes("Admin") ||
      user.email === "ilyasyildirim@outlook.com.tr" ||
      user.email === "ilyasylldrm@gmail.com" ||
      user.userId === "nuT309AyQxQKddnAp1ZJjlSgBXt2"
    );
  };

  // Get current effective modules (staged draft or saved original)
  const getUserEffectiveModules = (user: UserProfileData): AppModuleKey[] => {
    if (draftPermissions[user.userId] !== undefined) {
      return draftPermissions[user.userId];
    }
    return user.allowedModules && user.allowedModules.length > 0
      ? user.allowedModules
      : ALL_APP_MODULES.map((m) => m.key);
  };

  // Get saved original modules
  const getUserOriginalModules = (user: UserProfileData): AppModuleKey[] => {
    return user.allowedModules && user.allowedModules.length > 0
      ? user.allowedModules
      : ALL_APP_MODULES.map((m) => m.key);
  };

  // Check if a specific module is checked for a user (includes draft state)
  const isModuleChecked = (user: UserProfileData, moduleKey: AppModuleKey): boolean => {
    if (isUserSysAdmin(user)) {
      return true;
    }
    const currentModules = getUserEffectiveModules(user);
    return currentModules.includes(moduleKey);
  };

  // Check if user has uncommitted / draft modifications
  const hasUserDraftChanges = (user: UserProfileData): boolean => {
    if (draftPermissions[user.userId] === undefined) return false;
    const original = getUserOriginalModules(user).slice().sort();
    const draft = draftPermissions[user.userId].slice().sort();
    if (original.length !== draft.length) return true;
    return original.some((val, idx) => val !== draft[idx]);
  };

  // Total users with pending draft modifications
  const pendingUsersList = users.filter((u) => hasUserDraftChanges(u));
  const pendingChangesCount = pendingUsersList.length;

  // Toggle a single module permission in DRAFT mode (does NOT save immediately)
  const handleToggleDraftModule = (user: UserProfileData, moduleKey: AppModuleKey) => {
    if (isUserSysAdmin(user)) {
      alert("Sistem Yöneticisi (Admin) tüm modüllere daimi tam erişim yetkisine sahiptir.");
      return;
    }

    const currentAllowed = getUserEffectiveModules(user);
    let updatedAllowed: AppModuleKey[];
    if (currentAllowed.includes(moduleKey)) {
      updatedAllowed = currentAllowed.filter((k) => k !== moduleKey);
      if (updatedAllowed.length === 0) {
        updatedAllowed = ["dashboard"];
      }
    } else {
      updatedAllowed = [...currentAllowed, moduleKey];
    }

    setDraftPermissions((prev) => ({
      ...prev,
      [user.userId]: updatedAllowed,
    }));
  };

  // Apply a preset to DRAFT state (does NOT save immediately)
  const handleSetDraftPreset = (user: UserProfileData, keys: AppModuleKey[]) => {
    if (isUserSysAdmin(user)) return;
    setDraftPermissions((prev) => ({
      ...prev,
      [user.userId]: keys,
    }));
  };

  // Discard / Revert draft changes for a specific user
  const handleCancelUserDraft = (userId: string) => {
    setDraftPermissions((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  // Discard / Revert ALL draft changes
  const handleCancelAllDrafts = () => {
    setDraftPermissions({});
  };

  // Open confirmation modal for a specific user before saving
  const handlePromptSaveUser = (user: UserProfileData) => {
    const newModules = getUserEffectiveModules(user);
    const oldModules = getUserOriginalModules(user);

    setConfirmSaveData({
      user,
      newModules,
      oldModules,
    });
  };

  // Execute Save after user confirmation
  const handleExecuteSaveUser = async () => {
    if (!confirmSaveData) return;
    const { user, newModules } = confirmSaveData;

    setSavingUserId(user.userId);
    try {
      const updatedUser: UserProfileData = {
        ...user,
        allowedModules: newModules,
        updatedAt: new Date().toISOString(),
      };

      await saveUserProfile(updatedUser);

      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? updatedUser : u))
      );

      // Clear draft for this user
      setDraftPermissions((prev) => {
        const next = { ...prev };
        delete next[user.userId];
        return next;
      });

      setSavedUserFeedback(user.userId);
      setTimeout(() => {
        setSavedUserFeedback(null);
      }, 2500);

      // If current logged-in user, update local session
      if (currentUser.id === user.userId) {
        currentUser.allowedModules = newModules;
        const stored = localStorage.getItem("muavin_active_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.allowedModules = newModules;
          localStorage.setItem("muavin_active_user", JSON.stringify(parsed));
        }
      }

      setConfirmSaveData(null);
    } catch (err) {
      console.error("Error saving user permissions:", err);
      alert("İzin kaydedilirken bir hata oluştu.");
    } finally {
      setSavingUserId(null);
    }
  };

  // Execute Batch Save for all modified users
  const handleExecuteBatchSave = async () => {
    setIsBatchSaving(true);
    try {
      for (const user of pendingUsersList) {
        const newModules = getUserEffectiveModules(user);
        const updatedUser: UserProfileData = {
          ...user,
          allowedModules: newModules,
          updatedAt: new Date().toISOString(),
        };

        await saveUserProfile(updatedUser);

        setUsers((prev) =>
          prev.map((u) => (u.userId === user.userId ? updatedUser : u))
        );

        if (currentUser.id === user.userId) {
          currentUser.allowedModules = newModules;
          const stored = localStorage.getItem("muavin_active_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.allowedModules = newModules;
            localStorage.setItem("muavin_active_user", JSON.stringify(parsed));
          }
        }
      }

      setDraftPermissions({});
      setConfirmBatchSaveModalOpen(false);
      alert("Tüm kullanıcı yetki değişiklikleri başarıyla kaydedildi.");
    } catch (err) {
      console.error("Batch save error:", err);
      alert("Toplu kayıt sırasında bir hata oluştu.");
    } finally {
      setIsBatchSaving(false);
    }
  };

  const handleDeleteFile = async (file: UserFileMetadata) => {
    if (!window.confirm(`Admin Yetkisi: "${file.fileName}" dosyasını kalıcı olarak silmek istediğinizden emin misiniz?`)) {
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
    if (!window.confirm(`DİKKAT: "${userToDelete.name}" (${userToDelete.email}) kullanıcısının sistem yetkilerini ve profilini silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteUserProfile(userToDelete.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userToDelete.userId));
      handleCancelUserDraft(userToDelete.userId);
      alert("Kullanıcı kaydı başarıyla silindi.");
    } catch (err) {
      console.error("User deletion error:", err);
      alert("Kullanıcı silinirken bir hata oluştu.");
    }
  };

  const handleOpenAddUser = () => {
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword(generateRandomPassword());
    setNewUserCompany(currentUser.companyName || "Muavin Finans & ERP Müşterisi");
    setNewUserPhone("+90 (212) 555 0100");
    setNewUserTaxNumber("1234567890");
    setNewUserRole("Ön Muhasebe Sorumlusu");
    setNewUserAllowedModules(ALL_APP_MODULES.map((m) => m.key));
    setCreateUserError("");
    setCreatedSuccessInfo(null);
    setIsAddUserModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError("");

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setCreateUserError("Lütfen ad soyad, e-posta ve şifre alanlarını eksiksiz doldurunuz.");
      return;
    }

    if (newUserAllowedModules.length === 0) {
      setCreateUserError("Kullanıcıya en az 1 modül erişim yetkisi tanımlamalısınız.");
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
        createdAt: new Date().toISOString()
      };

      await saveUserProfile(newUserProfile);

      setUsers((prev) => [newUserProfile, ...prev]);
      setCreatedSuccessInfo({
        email: newUserProfile.email,
        passwordPlain: newUserPassword,
        name: newUserProfile.name,
        allowedModulesCount: newUserAllowedModules.length
      });
    } catch (err: any) {
      console.error("Create user error:", err);
      setCreateUserError("Kullanıcı oluşturulurken bir hata oluştu: " + (err.message || "Bilinmeyen hata"));
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
    if (selectedModulesToEdit.length === 0) {
      alert("Kullanıcıya en az 1 modül yetkisi verilmelidir.");
      return;
    }

    // Direct confirmation before applying from modal
    if (!window.confirm(`${editingPermissionsUser.name} kullanıcısının modül erişim izinlerini güncellemek istediğinize emin misiniz?`)) {
      return;
    }

    setSavingPermissions(true);
    try {
      const updatedUser: UserProfileData = {
        ...editingPermissionsUser,
        allowedModules: selectedModulesToEdit,
        updatedAt: new Date().toISOString()
      };

      await saveUserProfile(updatedUser);

      setUsers((prev) =>
        prev.map((u) => (u.userId === updatedUser.userId ? updatedUser : u))
      );

      handleCancelUserDraft(updatedUser.userId);

      if (currentUser.id === updatedUser.userId) {
        currentUser.allowedModules = updatedUser.allowedModules;
        const stored = localStorage.getItem("muavin_active_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.allowedModules = updatedUser.allowedModules;
          localStorage.setItem("muavin_active_user", JSON.stringify(parsed));
        }
      }

      setEditingPermissionsUser(null);
      alert(`${updatedUser.name} kullanıcısının modül erişim izinleri başarıyla güncellendi.`);
    } catch (err) {
      console.error("Save permissions error:", err);
      alert("İzinler kaydedilirken bir hata oluştu.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesTerm =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.companyName.toLowerCase().includes(term) ||
      u.userId.toLowerCase().includes(term);

    if (!matchesTerm) return false;

    if (userFilter === "hasFiles") {
      return getFilesForUser(u.userId).length > 0;
    }
    if (userFilter === "adminCreated") {
      return !!u.createdByAdmin;
    }

    return true;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-5 h-5 text-purple-600" />;
    if (type.includes("pdf")) return <FileText className="w-5 h-5 text-rose-600" />;
    if (type.includes("sheet") || type.includes("excel") || type.includes("csv"))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-indigo-600" />;
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls (Lila Bal Peteği & Geometrik Desen) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-rose-500/10 text-rose-700 border border-rose-300/60 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              Sistem Yöneticisi Paneli
            </span>
            <span className="bg-purple-100/80 text-purple-900 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-700" />
              Güvenli Onaylı Yetkilendirme (Kaydet & İptal Korumalı)
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              ilyasyildirim@outlook.com.tr
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-950">
            Kullanıcı Modül Yetkilendirme & Evrak Denetim Merkezi
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            Kullanıcı izinlerini checkbox kutucuklarıyla düzenleyebilir; yanlışlıkla yapılan değişiklikleri önlemek için <strong>Kaydet</strong> veya <strong>İptal</strong> butonlarıyla güvenle onaylayabilirsiniz.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenAddUser}
            className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Yeni Kullanıcı Aç</span>
          </button>

          <button
            onClick={loadAdminData}
            className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all shrink-0"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-800 font-bold ${loading ? "animate-spin" : ""}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* PENDING DRAFT NOTIFICATION & BATCH ACTIONS BANNER */}
      {pendingChangesCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-400/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  Kaydedilmemiş Yetki Değişiklikleri Mevcut ({pendingChangesCount} Kullanıcı)
                </h3>
                <span className="bg-white/20 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  Taslak Aşamasında
                </span>
              </div>
              <p className="text-xs text-amber-50 mt-1 leading-relaxed">
                Yaptığınız değişiklikler henüz veritabanına uygulanmadı. Değişikliklerin geçerli olması için ilgili satırlardaki <strong>Kaydet</strong> butonunu kullanabilir veya tümünü topluca onaylayabilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={handleCancelAllDrafts}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/40 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tümünü İptal Et</span>
            </button>

            <button
              onClick={() => setConfirmBatchSaveModalOpen(true)}
              className="bg-white text-orange-900 hover:bg-orange-50 font-black text-xs py-2 px-4 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              <span>Tüm Değişiklikleri Kaydet ({pendingChangesCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Switcher & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* View Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveAdminTab("matrix")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
              activeAdminTab === "matrix"
                ? "bg-purple-700 text-white border-purple-700 shadow-purple-500/20"
                : "bg-white text-slate-700 border-purple-200/80 hover:bg-purple-50 hover:text-purple-900"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Modül Yetkilendirme Matrisi (Checkbox Tablosu)</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeAdminTab === "matrix" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"}`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs border ${
              activeAdminTab === "list"
                ? "bg-purple-700 text-white border-purple-700 shadow-purple-500/20"
                : "bg-white text-slate-700 border-purple-200/80 hover:bg-purple-50 hover:text-purple-900"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Kullanıcı Detayları & Evrak Deposu</span>
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Filter */}
          <div className="flex items-center gap-1 bg-purple-50/60 p-1 rounded-xl border border-purple-200/60 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setUserFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                userFilter === "all" ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
              }`}
            >
              Tümü ({users.length})
            </button>
            <button
              onClick={() => setUserFilter("adminCreated")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                userFilter === "adminCreated" ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
              }`}
            >
              Admin Açanlar ({users.filter((u) => u.createdByAdmin).length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kullanıcı veya firma ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CHECKBOX BAZLI MODÜL YETKİLENDİRME MATRİSİ (KAYDET & İPTAL KORUMALI) */}
      {/* ========================================================================= */}
      {activeAdminTab === "matrix" && (
        <div className="bg-white rounded-2xl border border-purple-200/80 p-3 sm:p-5 shadow-sm space-y-4">
          {/* Table Header Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Modül Erişim İzinleri Matrisi (Cari • Fatura • Kasa • İK • Stok • Sipariş)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Kutucukları işaretleyip kaldırabilirsiniz. Değişiklik yaptığınız satırda çıkan <strong>Kaydet</strong> butonu ile onaylayabilir veya <strong>İptal</strong> ile geri alabilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                İşaretli = Erişim Açık
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                <Square className="w-3 h-3 text-slate-400" />
                Boş = Kısıtlı
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Sarı = Değişiklik Var
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
              <thead>
                <tr className="bg-slate-50/90 text-purple-950 font-extrabold uppercase tracking-wider text-[10px] border-y border-purple-200/60">
                  <th className="py-3 px-3 w-56 sticky left-0 bg-slate-50/95 z-10 shadow-r border-r border-purple-100">
                    Kullanıcı Bilgileri
                  </th>
                  {CORE_MATRIX_MODULES.map((mod) => {
                    const IconComp = mod.icon;
                    return (
                      <th key={mod.key} className="py-3 px-2 text-center border-r border-purple-100 min-w-[84px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-6 h-6 rounded-lg ${mod.bgColor} ${mod.color} border ${mod.borderColor} flex items-center justify-center`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-[11px] text-slate-900">{mod.shortLabel}</span>
                          <span className="text-[9px] text-slate-400 font-normal normal-case truncate max-w-[80px]">
                            {mod.label}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-center min-w-[190px]">
                    İzin Onay & Hızlı İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60">
                {loading ? (
                  <tr>
                    <td colSpan={CORE_MATRIX_MODULES.length + 2} className="text-center py-12 text-slate-500">
                      <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="font-extrabold text-xs">Kullanıcı yetkileri yükleniyor...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={CORE_MATRIX_MODULES.length + 2} className="text-center py-8 text-slate-400">
                      Kayıtlı kullanıcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSysAdmin = isUserSysAdmin(u);
                    const isSaving = savingUserId === u.userId;
                    const isJustSaved = savedUserFeedback === u.userId;
                    const isDraftChanged = hasUserDraftChanges(u);

                    return (
                      <tr
                        key={u.userId}
                        className={`transition-colors group ${
                          isDraftChanged ? "bg-amber-50/50 hover:bg-amber-50/80" : "hover:bg-purple-50/30"
                        }`}
                      >
                        {/* User Identity Column (Sticky Left) */}
                        <td
                          className={`py-3 px-3 sticky left-0 z-10 shadow-r border-r border-purple-100 transition-colors ${
                            isDraftChanged
                              ? "bg-amber-50/90 group-hover:bg-amber-100/70"
                              : "bg-white group-hover:bg-purple-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-900 border border-purple-200 flex items-center justify-center font-black shrink-0 text-xs shadow-2xs">
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 text-xs truncate max-w-[130px]">
                                  {u.name}
                                </span>
                                {isSysAdmin && (
                                  <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[8px] font-black px-1.5 py-0.2 rounded shrink-0">
                                    Admin
                                  </span>
                                )}
                                {isDraftChanged && (
                                  <span className="bg-amber-500 text-white font-extrabold text-[8px] px-1.5 py-0.2 rounded animate-pulse shrink-0">
                                    Değişiklik Var
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-purple-900/80 truncate max-w-[140px]">
                                {u.email}
                              </div>
                              <div className="text-[9px] text-slate-400 truncate max-w-[140px]">
                                {u.companyName || u.role || "Kullanıcı"}
                              </div>
                            </div>
                          </div>

                          {/* Save feedback indicator */}
                          {isJustSaved && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700 animate-in fade-in">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Yetkiler Kaydedildi</span>
                            </div>
                          )}
                          {isSaving && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-700 animate-pulse">
                              <RefreshCw className="w-3 h-3 animate-spin text-purple-600" />
                              <span>Kaydediliyor...</span>
                            </div>
                          )}
                        </td>

                        {/* Interactive Checkbox for each Core Module */}
                        {CORE_MATRIX_MODULES.map((mod) => {
                          const checked = isModuleChecked(u, mod.key);
                          const originalAllowed = getUserOriginalModules(u).includes(mod.key);
                          const isModuleModified = isDraftChanged && (checked !== originalAllowed);

                          return (
                            <td
                              key={mod.key}
                              className={`py-3 px-2 text-center border-r border-purple-100/60 align-middle ${
                                isModuleModified ? "bg-amber-100/50" : ""
                              }`}
                            >
                              <div className="flex items-center justify-center relative">
                                {isSysAdmin ? (
                                  <div
                                    className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center cursor-default shadow-2xs"
                                    title="Sistem Yöneticisi daima tam yetkilidir"
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDraftModule(u, mod.key)}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs border ${
                                      checked
                                        ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 active:scale-95"
                                        : "bg-white border-slate-300 text-transparent hover:border-purple-400 hover:bg-purple-50"
                                    } ${
                                      isModuleModified
                                        ? "ring-2 ring-amber-500 ring-offset-1"
                                        : ""
                                    }`}
                                    title={`${u.name} için ${mod.label} yetkisini ${checked ? "kaldır" : "ver"} (Kaydet butonuyla onaylanmalıdır)`}
                                  >
                                    <Check className={`w-4 h-4 stroke-[3] ${checked ? "block" : "hidden"}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Row Confirmation & Action Controls */}
                        <td className="py-3 px-3 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {!isSysAdmin && isDraftChanged ? (
                              /* Active Pending State Controls: Explicit Kaydet & İptal */
                              <div className="flex items-center gap-1.5 bg-amber-100/80 p-1 rounded-xl border border-amber-300 shadow-2xs animate-in zoom-in-95">
                                <button
                                  type="button"
                                  onClick={() => handlePromptSaveUser(u)}
                                  disabled={isSaving}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                                  title="Değişiklikleri Onayla ve Kaydet"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Kaydet</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelUserDraft(u.userId)}
                                  disabled={isSaving}
                                  className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                                  title="Değişiklikleri İptal Et / Geri Al"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                  <span>İptal</span>
                                </button>
                              </div>
                            ) : !isSysAdmin ? (
                              /* Standard Fast Preset Buttons */
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSetDraftPreset(u, ALL_APP_MODULES.map((m) => m.key))}
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all"
                                  title="Tüm modül izinlerini aç (Kaydet ile onaylayınız)"
                                >
                                  Tümünü Aç
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetDraftPreset(u, ["dashboard", "contacts", "invoices", "accounts", "hr"])}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all"
                                  title="Standart Ön Muhasebe Yetkileri (Cari, Fatura, Kasa, İK)"
                                >
                                  Standart
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetDraftPreset(u, ["dashboard"])}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-1.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all"
                                  title="Sadece Ana Sayfa İzni Bırak (Kaydet ile onaylayınız)"
                                >
                                  Sıfırla
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                Tam Yetkili Admin
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEditPermissions(u)}
                              className="p-1 text-indigo-700 hover:bg-indigo-50 rounded-md cursor-pointer transition-colors ml-0.5"
                              title="Tüm Modülleri Detaylı Düzenle"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DETAYLI KULLANICI LİSTESİ & EVRAK DENETİMİ VIEW */}
      {/* ========================================================================= */}
      {activeAdminTab === "list" && (
        <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[900px]">
              <thead>
                <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="pb-2 px-4">Kullanıcı / Rol</th>
                  <th className="pb-2 px-4">E-Posta & Giriş</th>
                  <th className="pb-2 px-4">Firma & İletişim</th>
                  <th className="pb-2 px-4 text-center">İzinli Modüller</th>
                  <th className="pb-2 px-4 text-center">Dosyalar</th>
                  <th className="pb-2 px-4 text-center">Yönetim İşlemleri</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 bg-white rounded-xl border border-purple-100/80">
                      <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="font-extrabold text-xs">Kullanıcı verileri ve yetkiler yükleniyor...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                      Aramanıza uygun kullanıcı kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const userFiles = getFilesForUser(u.userId);
                    const isCurrentAdmin = u.userId === currentUser.id;
                    const isSysAdmin = isUserSysAdmin(u);
                    const effectiveModules = getUserEffectiveModules(u);
                    const allowedCount = effectiveModules.length;
                    const isFullyOpen = allowedCount === ALL_APP_MODULES.length;
                    const isDraftChanged = hasUserDraftChanges(u);

                    return (
                      <tr
                        key={u.userId}
                        className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                      >
                        <td className="py-3.5 px-4 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 border border-purple-200/80 flex items-center justify-center font-black shrink-0 text-xs">
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 group-hover:text-purple-950 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSysAdmin && (
                                  <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                                    Sistem Yöneticisi
                                  </span>
                                )}
                                {u.createdByAdmin && (
                                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                    Admin Açtı
                                  </span>
                                )}
                                {isDraftChanged && (
                                  <span className="bg-amber-500 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded animate-pulse">
                                    Taslak Yetkiler
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-500">
                                {u.role || "Kullanıcı"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-purple-950">
                            <Mail className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="font-mono text-xs">{u.email}</span>
                          </div>
                          {u.passwordPlain && (
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                              <KeyRound className="w-3 h-3 text-amber-500" />
                              <span>Şifre: <strong className="text-slate-600">{u.passwordPlain}</strong></span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-purple-950">
                            <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>{u.companyName || "—"}</span>
                          </div>
                          {u.phone && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                isFullyOpen
                                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                  : "bg-amber-50 border border-amber-200 text-amber-800"
                              }`}
                            >
                              <Sliders className="w-3 h-3" />
                              <span>{allowedCount} / {ALL_APP_MODULES.length} Modül</span>
                            </span>
                            {!isFullyOpen && (
                              <span className="text-[9px] text-amber-700 font-semibold mt-0.5">
                                Kısıtlamalı Erişim
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              userFiles.length > 0
                                ? "bg-purple-50 border border-purple-200 text-purple-900"
                                : "bg-slate-100 border border-slate-200 text-slate-400"
                            }`}
                          >
                            <HardDrive className="w-3 h-3 text-purple-600" />
                            <span>{userFiles.length} Dosya</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPermissions(u)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Modül Yetkilerini Düzenle"
                            >
                              <Sliders className="w-3.5 h-3.5 text-indigo-700" />
                              <span className="hidden sm:inline">Yetkiler</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Evrakları Görüntüle"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-700" />
                              <span className="hidden sm:inline">Evraklar</span>
                            </button>

                            {!isCurrentAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL: SINGLE USER PERMISSION SAVE CONFIRMATION (KAYDETME ONAY MODALI) */}
      {/* ========================================================================= */}
      {confirmSaveData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-5 flex items-center justify-between border-b border-purple-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Yetki Güncelleme Onayı</h3>
                  <p className="text-[11px] text-purple-200">
                    Değişiklikleri uygulamadan önce lütfen kontrol ediniz
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmSaveData(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 bg-slate-50">
              {/* User summary card */}
              <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-black flex items-center justify-center text-sm border border-purple-200">
                  {confirmSaveData.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-900">{confirmSaveData.user.name}</h4>
                  <p className="text-[11px] text-purple-900 font-mono">{confirmSaveData.user.email}</p>
                  <p className="text-[10px] text-slate-400">{confirmSaveData.user.role || confirmSaveData.user.companyName}</p>
                </div>
              </div>

              {/* Added Modules */}
              {(() => {
                const added = confirmSaveData.newModules.filter(
                  (k) => !confirmSaveData.oldModules.includes(k)
                );
                const removed = confirmSaveData.oldModules.filter(
                  (k) => !confirmSaveData.newModules.includes(k)
                );

                return (
                  <div className="space-y-3">
                    {added.length > 0 && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                          <span>Yeni Tanımlanan Yetkiler ({added.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {added.map((key) => {
                            const mod = ALL_APP_MODULES.find((m) => m.key === key);
                            return (
                              <span
                                key={key}
                                className="bg-white text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-2xs"
                              >
                                + {mod ? mod.label : key}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {removed.length > 0 && (
                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                          <MinusCircle className="w-4 h-4 text-rose-600" />
                          <span>Kaldırılan / Kısıtlanan Yetkiler ({removed.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {removed.map((key) => {
                            const mod = ALL_APP_MODULES.find((m) => m.key === key);
                            return (
                              <span
                                key={key}
                                className="bg-white text-rose-800 border border-rose-300 font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-2xs line-through"
                              >
                                - {mod ? mod.label : key}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {added.length === 0 && removed.length === 0 && (
                      <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-medium">
                        Herhangi bir yetki değişikliği tespit edilmedi.
                      </div>
                    )}

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 mb-1">
                        Güncelleme Sonrası Toplam İzin: {confirmSaveData.newModules.length} / {ALL_APP_MODULES.length} Modül
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Kullanıcı sisteme giriş yaptığında menüde yalnızca izin verilen modüllere erişebilecektir.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmSaveData(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Vazgeç / Düzenlemeye Dön
              </button>
              <button
                type="button"
                onClick={handleExecuteSaveUser}
                disabled={savingUserId !== null}
                className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {savingUserId !== null ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Onayla ve Yetkileri Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: BATCH SAVE CONFIRMATION (TOPLU KAYDETME ONAYI) */}
      {/* ========================================================================= */}
      {confirmBatchSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Toplu Yetki Kaydı Onayı</h3>
                  <p className="text-[11px] text-orange-100">
                    {pendingChangesCount} kullanıcının yetki değişiklikleri kaydedilecek
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmBatchSaveModalOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 bg-slate-50 max-h-80 overflow-y-auto custom-scrollbar">
              <p className="text-xs font-bold text-slate-700">
                Aşağıdaki kullanıcıların modül erişim izinleri güncellenecektir:
              </p>

              <div className="space-y-2">
                {pendingUsersList.map((user) => {
                  const newMods = getUserEffectiveModules(user);
                  const oldMods = getUserOriginalModules(user);
                  const addedCount = newMods.filter((k) => !oldMods.includes(k)).length;
                  const removedCount = oldMods.filter((k) => !newMods.includes(k)).length;

                  return (
                    <div
                      key={user.userId}
                      className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold">
                        {addedCount > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            +{addedCount} Modül
                          </span>
                        )}
                        {removedCount > 0 && (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                            -{removedCount} Modül
                          </span>
                        )}
                        <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                          Toplam: {newMods.length}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmBatchSaveModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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
      {/* 5. MODAL: DETAILED USER PERMISSIONS EDITING MODAL */}
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
                      Rol: {editingPermissionsUser.role || "Ön Muhasebe"}
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
              <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-black text-slate-800">Aktif İzin Verilen Modüller</h4>
                  <p className="text-[10px] text-slate-500">
                    Seçilen modüller kullanıcının sol menüsünde ve yetki alanında aktif olacaktır.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModulesToEdit(ALL_APP_MODULES.map((m) => m.key))}
                    className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md hover:bg-indigo-100 cursor-pointer"
                  >
                    Tümünü Aç
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModulesToEdit(["dashboard", "contacts", "invoices", "accounts", "hr"])}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md hover:bg-emerald-100 cursor-pointer"
                  >
                    Standart
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModulesToEdit(["dashboard"])}
                    className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md hover:bg-slate-200 cursor-pointer"
                  >
                    Sadece Ana Sayfa
                  </button>
                </div>
              </div>

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
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">{module.label}</span>
                        </div>
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
                  <span>Yetki Değişikliklerini Onayla & Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: NEW USER CREATION */}
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
                  <h3 className="text-sm font-black text-white">Yeni Sistem Kullanıcısı Oluştur</h3>
                  <p className="text-[11px] text-purple-200/80">Kullanıcı hesabı açın ve modül yetkilerini tanımlayın</p>
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
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 text-center animate-in zoom-in-95">
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
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                        E-Posta Adresi (Kullanıcı Adı) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="Örn: ahmet@sirket.com"
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
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
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
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="Ön Muhasebe Görevlisi">Ön Muhasebe Görevlisi</option>
                        <option value="Muhasebe Müdürü">Muhasebe Müdürü</option>
                        <option value="Finans Sorumlusu">Finans Sorumlusu</option>
                        <option value="Satış & Fatura Uzmanı">Satış & Fatura Uzmanı</option>
                        <option value="İK & Bordro Yetkilisi">İK & Bordro Yetkilisi</option>
                        <option value="Stok & Depo Sorumlusu">Stok & Depo Sorumlusu</option>
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
                          Kullanıcının sadece seçtiğiniz modülleri görmesini sağlayabilirsiniz.
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
                              <span className="text-[9px] text-slate-400 block truncate">
                                {module.description}
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
      {/* 7. MODAL: USER FILES INSPECTION */}
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
                      Admin İnceleme Modu
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
                      <p className="text-xs text-slate-500">
                        Kullanıcı dosya yüklediğinde bu panel üzerinden anında görüntülenecektir.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Yüklenen Evraklar ({userFiles.length})</span>
                      <span className="text-slate-400 font-mono">UID: {selectedUser.userId}</span>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      {userFiles.map((file) => (
                        <div key={file.id} className="p-4 hover:bg-purple-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900 truncate">{file.fileName}</h4>
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                                  {file.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{file.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {new Date(file.uploadDate).toLocaleDateString("tr-TR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                                <span>•</span>
                                <span className="font-mono">{formatBytes(file.fileSize)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {(file.fileUrl || file.fileData) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(file)}
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Önizle</span>
                                </button>

                                <a
                                  href={file.fileUrl || file.fileData}
                                  download={file.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>İndir</span>
                                </a>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Sil (Admin)"
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
      {/* 8. MODAL: FILE PREVIEW */}
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
