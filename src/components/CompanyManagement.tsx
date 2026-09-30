import React, { useState } from "react";
import { CompanySettings, Branch, Warehouse, AddressDetails, TAXPAYER_TYPES } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData } from "../utils/exportUtils";
import { AddressSelector } from "./AddressSelector";
import { GibPortalModal } from "./GibPortalModal";
import { MysoftTenantPicker } from "./MysoftTenantPicker";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { Settings } from "./Settings";
import { Logo } from "./Logo";
import {
  fetchCloudLogo,
  saveCloudLogo,
  subscribeToCloudLogo,
  CloudBrandingConfig,
  DEFAULT_CLOUD_BRANDING,
} from "../services/cloudBrandingService";
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
  Image as ImageIcon,
  CheckCircle,
  Database as DatabaseIcon,
} from "lucide-react";

export type CompanySubTab = "profile" | "branches" | "warehouses" | "settings";

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

  // Profile Form State
  const [profileForm, setProfileForm] = useState<CompanySettings>(settings);
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

  // Cloud Console'dan başlangıçta logoyu çek
  React.useEffect(() => {
    fetchCloudLogo().then((branding) => {
      if (branding) {
        setCloudBranding(branding);
        if (branding.logoUrl && !profileForm.logoUrl) {
          setProfileForm((prev) => ({ ...prev, logoUrl: branding.logoUrl }));
        }
      }
    });

    const unsubscribe = subscribeToCloudLogo((branding) => {
      if (branding) {
        setCloudBranding(branding);
        setProfileForm((prev) => ({ ...prev, logoUrl: branding.logoUrl }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Google Cloud Console'dan Logoyu Çek Buton Olayı
  const handleFetchFromCloudConsole = async () => {
    setCloudLogoLoading(true);
    setCloudSyncStatus(null);
    try {
      const res = await fetchCloudLogo();
      if (res?.logoUrl) {
        setCloudBranding(res);
        setProfileForm((prev) => ({ ...prev, logoUrl: res.logoUrl }));
        onSaveSettings({ ...settings, ...profileForm, logoUrl: res.logoUrl });
        setCloudSyncStatus("Logo Google Cloud Console Firestore veritabanından başarıyla çekildi!");
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
      const saved = await saveCloudLogo(targetUrl, {
        brandName: profileForm.companyName || "E-MUAVİN",
        description: "Cloud Console üzerinden güncellenen kurumsal logo",
      });
      setCloudBranding(saved);
      onSaveSettings({ ...settings, ...profileForm, logoUrl: targetUrl });
      setCloudSyncStatus("Logo Google Cloud Console Firestore veritabanına kaydedildi!");
    } catch (err: any) {
      setCloudSyncStatus("Kaydetme hatası: " + (err?.message || "Bilinmiyor"));
    } finally {
      setCloudLogoLoading(false);
      setTimeout(() => setCloudSyncStatus(null), 4000);
    }
  };

  // Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(profileForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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

    if (editingBranch) {
      onUpdateBranch({
        ...editingBranch,
        ...branchForm,
        address: branchForm.address as AddressDetails,
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
        address: (branchForm.address as AddressDetails) || {
          country: "Türkiye",
          city: "İstanbul",
          district: "Şişli",
        },
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

    if (editingWarehouse) {
      onUpdateWarehouse({
        ...editingWarehouse,
        ...warehouseForm,
        branchName: selectedBranch?.name || warehouseForm.branchName,
        address: warehouseForm.address as AddressDetails,
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
        address: (warehouseForm.address as AddressDetails) || {
          country: "Türkiye",
          city: "İstanbul",
          district: "Şişli",
        },
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
                Şirketinizin resmi kimlik bilgilerini yönetin, şubelerinizi ve depolarınızı ekleyin. Tüm adres detaylarında Türkiye şehir, ilçe ve mahalle seçimi aktif hale getirilmiştir.
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

        {/* Sub-tab Navigation */}
        <div className="relative z-10 flex items-center gap-2 mt-6 pt-4 border-t border-[#283044] overflow-x-auto">
          <button
            onClick={() => handleTabChange("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentSubTab === "profile"
                ? "bg-[#0f6bae] text-white shadow-2xs"
                : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
            }`}
          >
            <Building className={`w-4 h-4 ${currentSubTab === "profile" ? "text-white" : "text-[#83b8ff]"}`} />
            <span>Firma Profili & Adres</span>
          </button>

          <button
            onClick={() => handleTabChange("branches")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentSubTab === "branches"
                ? "bg-[#0f6bae] text-white shadow-2xs"
                : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
            }`}
          >
            <Store className={`w-4 h-4 ${currentSubTab === "branches" ? "text-white" : "text-[#83b8ff]"}`} />
            <span>Şubeler ({branches.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("warehouses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentSubTab === "warehouses"
                ? "bg-[#0f6bae] text-white shadow-2xs"
                : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
            }`}
          >
            <WarehouseIcon className={`w-4 h-4 ${currentSubTab === "warehouses" ? "text-white" : "text-[#83b8ff]"}`} />
            <span>Depolar ({warehouses.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentSubTab === "settings"
                ? "bg-[#0f6bae] text-white shadow-2xs"
                : "bg-[#1a233a] hover:bg-[#202c48] text-[#c6cdff] border border-[#283044]"
            }`}
          >
            <SettingsIcon className={`w-4 h-4 ${currentSubTab === "settings" ? "text-white" : "text-[#83b8ff]"}`} />
            <span>Sistem Ayarları</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: FIRMA PROFILI & RESMI BILGILER */}
      {currentSubTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          {/* 1. ADRES BİLGİLERİ */}
          <AddressSelector
            title="Merkez Genel Adres Detayları"
            address={
              profileForm.addressDetails || {
                country: profileForm.country || "Türkiye",
                city: profileForm.city || "İstanbul",
                district: profileForm.district || "Şişli",
                neighborhood: profileForm.neighborhood || "Mecidiyeköy",
                street: profileForm.street || "",
                buildingNo: profileForm.buildingNo || "",
                doorNo: profileForm.doorNo || "",
                postalCode: profileForm.postalCode || "",
                fullAddress: profileForm.address || "",
              }
            }
            onChange={(updatedDetails) => {
              setProfileForm({
                ...profileForm,
                city: updatedDetails.city,
                district: updatedDetails.district,
                neighborhood: updatedDetails.neighborhood,
                street: updatedDetails.street,
                buildingNo: updatedDetails.buildingNo,
                doorNo: updatedDetails.doorNo,
                postalCode: updatedDetails.postalCode,
                country: updatedDetails.country,
                address: updatedDetails.fullAddress || profileForm.address,
                addressDetails: updatedDetails,
              });
            }}
          />

          {/* 2. RESMİ ŞİRKET KİMLİK BİLGİLERİ */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0f6bae]" /> Resmi Şirket Kimlik Bilgileri
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Faturaya ve resmi belgelere basılacak detaylar</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kısa Şirket Adı *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-bold focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mükellefiyet Türü *
                </label>
                <select
                  value={profileForm.taxpayerType || "Anonim Şirket"}
                  onChange={(e) => setProfileForm({ ...profileForm, taxpayerType: e.target.value })}
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
                  required
                  value={profileForm.companyTitle}
                  onChange={(e) => setProfileForm({ ...profileForm, companyTitle: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vergi Dairesi
                </label>
                <input
                  type="text"
                  value={profileForm.taxOffice}
                  onChange={(e) => setProfileForm({ ...profileForm, taxOffice: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  VKN / TCKN No
                </label>
                <input
                  type="text"
                  value={profileForm.taxNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, taxNumber: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ticaret Sicil No
                </label>
                <input
                  type="text"
                  value={profileForm.tradeRegisterNo || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, tradeRegisterNo: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  MERSİS No
                </label>
                <input
                  type="text"
                  value={profileForm.mersisNo || ""}
                  onChange={(e) => setProfileForm({ ...profileForm, mersisNo: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>
            </div>

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
                hintVkn={profileForm.tenantIdentifierNumber}
                onSelect={(vkn) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    tenantIdentifierNumber: vkn,
                    mysoftCredentials: {
                      ...prev.mysoftCredentials,
                      tenantIdentifierNumber: vkn,
                    },
                  }))
                }
              />
              {profileForm.tenantIdentifierNumber && (
                <p className="text-[11px] font-mono text-[#0f6bae] font-bold">
                  Kayıtlı Mysoft tenantIdentifierNumber: {profileForm.tenantIdentifierNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#0f6bae]" /> Telefon
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#0f6bae]" /> E-posta
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Web Sitesi
                </label>
                <input
                  type="text"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>
            </div>
          </div>

          {/* Banka IBAN Detayları */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">
              Faturaya Basılacak Varsayılan Banka
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Banka Adı ve Şubesi
                </label>
                <input
                  type="text"
                  value={profileForm.defaultBankName}
                  onChange={(e) => setProfileForm({ ...profileForm, defaultBankName: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  IBAN Numarası
                </label>
                <input
                  type="text"
                  value={profileForm.defaultBankIban}
                  onChange={(e) => setProfileForm({ ...profileForm, defaultBankIban: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                />
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
                <label className="block font-bold text-slate-700">Canlı Logo Önizleme</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Koyu Arka Plan Önizleme */}
                  <div className="bg-[#0A192F] p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center gap-2 min-h-[110px] shadow-xs">
                    <Logo size="lg" src={profileForm.logoUrl || "/logo.svg"} />
                    <span className="text-[10px] font-semibold text-slate-400">Koyu Tema (Sidebar)</span>
                  </div>

                  {/* Açık Arka Plan Önizleme */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center gap-2 min-h-[110px] shadow-xs">
                    <Logo size="lg" src={profileForm.logoUrl || "/logo.svg"} />
                    <span className="text-[10px] font-semibold text-slate-500">Açık Tema (Fatura / Belge)</span>
                  </div>
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

              {/* Logo URL ve Cloud İşlemleri */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Logo Dosya Yolu veya Cloud Depolama URL'si
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={profileForm.logoUrl || "/logo.svg"}
                      onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                      placeholder="/logo.svg veya https://storage.googleapis.com/..."
                      className="flex-1 bg-white border border-slate-300 text-slate-900 rounded-lg p-2.5 font-mono text-xs focus:border-[#0f6bae] focus:ring-1 focus:ring-[#0f6bae]"
                    />
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, logoUrl: "/logo.svg" })}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-slate-200"
                      title="Varsayılan Kurumsal Vektör Logoyu Seç"
                    >
                      Varsayılan
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Google Cloud Storage bucket URL'si, HTTPS adresi veya uygulama içi SVG vektör dosya yolunu girebilirsiniz.
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
            settings={profileForm}
            onSaveSettings={(newSettings) => {
              setProfileForm(newSettings);
              onSaveSettings(newSettings);
            }}
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            onResetDemoData={onResetDemoData}
          />
        </div>
      )}

    </div>
  );
};
