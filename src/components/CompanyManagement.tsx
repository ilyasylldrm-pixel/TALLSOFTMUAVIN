import React, { useState } from "react";
import { CompanySettings, Branch, Warehouse, AddressDetails, TAXPAYER_TYPES } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData } from "../utils/exportUtils";
import { AddressSelector } from "./AddressSelector";
import { GibPortalModal } from "./GibPortalModal";
import { MysoftTenantPicker } from "./MysoftTenantPicker";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
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
} from "lucide-react";

export type CompanySubTab = "profile" | "branches" | "warehouses";

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
  activeSubTab = "profile",
  onSelectSubTab,
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<CompanySubTab>(activeSubTab);

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
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 text-slate-900 shadow-xs border border-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-50 text-purple-700 border border-purple-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Firma Yönetim Modülü
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-purple-600" />
              {settings.companyName || "Firma Bilgileri"}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Şirketinizin resmi kimlik bilgilerini yönetin, şubelerinizi ve depolarınızı ekleyin. Tüm adres detaylarında Türkiye şehir, ilçe ve mahalle seçimi aktif hale getirilmiştir.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#a36dfe] border border-purple-400/30 rounded-xl p-3 text-center min-w-[100px] shadow-2xs text-white">
              <div className="text-lg font-black text-white">{branches.length}</div>
              <div className="text-[10px] text-purple-100 font-bold">Kayıtlı Şube</div>
            </div>
            <div className="bg-[#a36dfe] border border-purple-400/30 rounded-xl p-3 text-center min-w-[100px] shadow-2xs text-white">
              <div className="text-lg font-black text-white">{warehouses.length}</div>
              <div className="text-[10px] text-purple-100 font-bold">Kayıtlı Depo</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="relative z-10 flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 overflow-x-auto">
          <button
            onClick={() => handleTabChange("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === "profile"
                ? "bg-purple-700 text-white shadow-xs font-black"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200"
            }`}
          >
            <Building className={`w-4 h-4 ${currentSubTab === "profile" ? "text-white" : "text-purple-600"}`} />
            <span>Firma Profili & Adres</span>
          </button>

          <button
            onClick={() => handleTabChange("branches")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === "branches"
                ? "bg-purple-700 text-white shadow-xs font-black"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200"
            }`}
          >
            <Store className={`w-4 h-4 ${currentSubTab === "branches" ? "text-white" : "text-fuchsia-600"}`} />
            <span>Şubeler ({branches.length})</span>
          </button>

          <button
            onClick={() => handleTabChange("warehouses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === "warehouses"
                ? "bg-purple-700 text-white shadow-xs font-black"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200"
            }`}
          >
            <WarehouseIcon className={`w-4 h-4 ${currentSubTab === "warehouses" ? "text-white" : "text-amber-500"}`} />
            <span>Depolar ({warehouses.length})</span>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Resmi Şirket Kimlik Bilgileri
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mükellefiyet Türü *
                </label>
                <select
                  value={profileForm.taxpayerType || "Anonim Şirket"}
                  onChange={(e) => setProfileForm({ ...profileForm, taxpayerType: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-semibold cursor-pointer focus:bg-white focus:border-purple-500"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
              <div>
                <h4 className="text-sm font-extrabold text-violet-950 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Mysoft e-Belge mükellefi
                </h4>
                <p className="text-[11px] text-violet-800/90 mt-1 leading-relaxed">
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
                <p className="text-[11px] font-mono text-violet-900">
                  Kayıtlı Mysoft tenantIdentifierNumber: {profileForm.tenantIdentifierNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-purple-600" /> Telefon
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-purple-600" /> E-posta
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5"
                />
              </div>
            </div>
          </div>

          {/* Banka IBAN Detayları */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Action for Profile */}
          <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-2xl border border-purple-200/60">
            {isSaved ? (
              <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Firma bilgileri ve detaylı adres başarıyla kaydedildi!
              </span>
            ) : (
              <span className="text-xs text-purple-900/80 font-medium">
                Firma profili ve adres değişikliklerinizi kaydetmek için butona basınız.
              </span>
            )}

            <button
              type="submit"
              className="bg-[#8252F6] hover:bg-[#703EE5] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#EF7D2C]" />
              <span>Firma Bilgilerini Kaydet</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB: E-İŞLEMLER (GİB, SGK, E-DEVLET VE KURUM ŞİFRELERİ) */}
      {(false as any) && (
        <form onSubmit={handleSaveCredentials} className="space-y-6">
          {/* E-İşlemler Üst Bilgilendirme & Hızlı Portal Bağlantıları */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    E-İşlemler Modülü
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Resmi Kurum Portalları
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
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
                  className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Dijital Vergi Dairesi
                </button>
              </div>
            </div>

            {/* Hızlı Portal Başlatıcı Kartları */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-600" />
                Sık Kullanılan Resmi E-Devlet ve Kurum Portalları
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <a
                  href="https://dijital.gib.gov.tr"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-red-50/60 border border-slate-200/80 hover:border-red-200 text-slate-700 hover:text-red-700 transition-all group"
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-slate-700 hover:text-blue-700 transition-all group"
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 transition-all group"
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 text-slate-700 hover:text-amber-700 transition-all group"
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 text-slate-700 hover:text-purple-700 transition-all group"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">MERSİS Portalı</div>
                    <div className="text-[10px] text-slate-400 group-hover:text-purple-500 truncate">mersis.gtb.gov.tr</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0 ml-1" />
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
          <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-2xl border border-purple-200/60 shadow-xs">
            {isCredSaved ? (
              <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                GİB, SGK ve e-Devlet şifreleri başarıyla kaydedildi!
              </span>
            ) : (
              <span className="text-xs text-purple-900/80 font-medium">
                Yapılan tüm kurum ve şifre değişikliklerini kaydetmek için butona basınız.
              </span>
            )}

            <button
              type="submit"
              className="bg-[#8252F6] hover:bg-[#703EE5] text-white font-bold px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#EF7D2C]" />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Şube adı, kodu, şehir veya ilçe ara..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
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
                className="bg-[#8252F6] hover:bg-[#703EE5] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#EF7D2C]" />
                <span>Yeni Şube Ekle</span>
              </button>
            </div>
          </div>

          {/* Branch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white rounded-2xl border border-purple-100 hover:border-purple-300 shadow-xs hover:shadow-md transition-all p-5 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl font-mono text-xs font-black">
                      {branch.code}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        {branch.name}
                        {branch.isMain && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-300">
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
                      className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                    <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
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
                className="bg-[#8252F6] hover:bg-[#703EE5] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-[#EF7D2C]" />
                <span>Yeni Depo Ekle</span>
              </button>
            </div>
          </div>

          {/* Warehouse Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWarehouses.map((wh) => (
              <div
                key={wh.id}
                className="bg-white rounded-2xl border border-purple-100 hover:border-purple-300 shadow-xs hover:shadow-md transition-all p-5 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl font-mono text-xs font-black">
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
                      className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-purple-100/70 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
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
                    <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
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
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
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

    </div>
  );
};
