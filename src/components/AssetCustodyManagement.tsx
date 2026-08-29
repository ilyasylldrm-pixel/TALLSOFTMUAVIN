import React, { useState, useMemo } from "react";
import {
  Car,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  Plus,
  Search,
  Filter,
  Printer,
  MessageCircle,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Fuel,
  KeyRound,
  Cpu,
  Layers,
  FileCheck2,
  Download,
  Eye,
  TrendingUp,
  CreditCard,
  UserCheck,
  Check,
  AlertCircle,
  LayoutGrid,
  List,
  Headphones,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import {
  AssetCustody,
  AssetCategory,
  AssetStatus,
  Employee,
  CompanySettings,
  Branch,
  Warehouse,
} from "../types";
import { AssetCustodyModal } from "./AssetCustodyModal";
import { AssetCustodyPrintModal } from "./AssetCustodyPrintModal";
import { AssetReturnModal } from "./AssetReturnModal";
import { exportAssetCustodyToPDF } from "../utils/assetCustodyPdf";
import { exportToExcel } from "../utils/exportUtils";

interface AssetCustodyManagementProps {
  assets: AssetCustody[];
  employees: Employee[];
  companySettings: CompanySettings;
  branches?: Branch[];
  warehouses?: Warehouse[];
  globalSearchTerm?: string;
  onAddAsset: (asset: AssetCustody) => void;
  onUpdateAsset: (asset: AssetCustody) => void;
  onDeleteAsset: (assetId: string) => void;
}

export const AssetCustodyManagement: React.FC<AssetCustodyManagementProps> = ({
  assets,
  employees,
  companySettings,
  branches = [],
  warehouses = [],
  globalSearchTerm = "",
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [localSearch, setLocalSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetCustody | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingAsset, setPrintingAsset] = useState<AssetCustody | null>(null);
  const [isReturnProtocol, setIsReturnProtocol] = useState(false);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningAsset, setReturningAsset] = useState<AssetCustody | null>(null);

  // Quick PDF loading state map
  const [pdfLoadingAssetId, setPdfLoadingAssetId] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search filter
  const effectiveSearch = (localSearch || globalSearchTerm).toLowerCase().trim();

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Category filter
      if (selectedCategory !== "all" && asset.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && asset.status !== selectedStatus) {
        return false;
      }
      // Employee filter
      if (selectedEmployeeId !== "all" && asset.employeeId !== selectedEmployeeId) {
        return false;
      }
      // Branch filter
      if (selectedBranchId !== "all" && asset.branchId !== selectedBranchId) {
        return false;
      }
      // Search
      if (effectiveSearch) {
        const matchName = asset.assetName.toLowerCase().includes(effectiveSearch);
        const matchEmp = asset.employeeName.toLowerCase().includes(effectiveSearch);
        const matchBrand = asset.brand.toLowerCase().includes(effectiveSearch);
        const matchModel = asset.model.toLowerCase().includes(effectiveSearch);
        const matchSerial = asset.serialNumber?.toLowerCase().includes(effectiveSearch) || false;
        const matchBarcode = asset.barcodeNumber?.toLowerCase().includes(effectiveSearch) || false;
        const matchPlate = asset.vehicleDetails?.plateNumber.toLowerCase().includes(effectiveSearch) || false;
        const matchImei = asset.phoneDetails?.imei1.toLowerCase().includes(effectiveSearch) || false;

        if (
          !matchName &&
          !matchEmp &&
          !matchBrand &&
          !matchModel &&
          !matchSerial &&
          !matchBarcode &&
          !matchPlate &&
          !matchImei
        ) {
          return false;
        }
      }
      return true;
    });
  }, [assets, selectedCategory, selectedStatus, selectedEmployeeId, selectedBranchId, effectiveSearch]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = assets.length;
    const activeVehicles = assets.filter((a) => a.category === "vehicle" && a.status === "active").length;
    const activeComputers = assets.filter((a) => a.category === "computer" && a.status === "active").length;
    const activePhonesTablets = assets.filter(
      (a) => (a.category === "phone" || a.category === "tablet") && a.status === "active"
    ).length;
    const totalValue = assets.reduce((sum, a) => sum + (a.approximateValue || 0), 0);
    const returnedCount = assets.filter((a) => a.status === "returned").length;

    return {
      totalCount,
      activeVehicles,
      activeComputers,
      activePhonesTablets,
      totalValue,
      returnedCount,
    };
  }, [assets]);

  const formatTRY = (val?: number) => {
    if (typeof val !== "number" || isNaN(val)) return "0 ₺";
    return val.toLocaleString("tr-TR") + " ₺";
  };

  const formatTRDate = (dStr?: string) => {
    if (!dStr) return "-";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  const getCategoryBadge = (cat: AssetCategory) => {
    switch (cat) {
      case "vehicle":
        return {
          label: "Şirket Aracı",
          icon: Car,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          iconColor: "text-blue-600",
        };
      case "computer":
        return {
          label: "Bilgisayar & Laptop",
          icon: Laptop,
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          iconColor: "text-indigo-600",
        };
      case "phone":
        return {
          label: "Cep Telefonu",
          icon: Smartphone,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconColor: "text-emerald-600",
        };
      case "tablet":
        return {
          label: "Tablet & iPad",
          icon: Tablet,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          iconColor: "text-amber-600",
        };
      case "peripheral":
        return {
          label: "Donanım / Ekipman",
          icon: Headphones,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          iconColor: "text-purple-600",
        };
      default:
        return {
          label: "Demirbaş",
          icon: Package,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          iconColor: "text-slate-600",
        };
    }
  };

  const getStatusBadge = (st: AssetStatus) => {
    switch (st) {
      case "active":
        return {
          label: "Zimmetli / Aktif",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
        };
      case "returned":
        return {
          label: "İade Edildi (Boşta)",
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
        };
      case "maintenance":
        return {
          label: "Servis & Bakımda",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
        };
      case "damaged":
        return {
          label: "Arızalı / Hasarlı",
          bg: "bg-red-50 text-red-700 border-red-200",
          dot: "bg-red-500",
        };
      case "scrapped":
        return {
          label: "Hurda",
          bg: "bg-zinc-100 text-zinc-600 border-zinc-300",
          dot: "bg-zinc-500",
        };
    }
  };

  // Handlers
  const handleOpenNewModal = () => {
    setEditingAsset(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (asset: AssetCustody) => {
    setEditingAsset(asset);
    setIsFormModalOpen(true);
  };

  const handleOpenPrintModal = (asset: AssetCustody, returnDoc = false) => {
    setPrintingAsset(asset);
    setIsReturnProtocol(returnDoc);
    setIsPrintModalOpen(true);
  };

  const handleOpenReturnModal = (asset: AssetCustody) => {
    setReturningAsset(asset);
    setIsReturnModalOpen(true);
  };

  const handleDirectExportPDF = async (asset: AssetCustody, returnDoc = false) => {
    try {
      setPdfLoadingAssetId(asset.id);
      const targetEmp = employees.find((e) => e.id === asset.employeeId);
      await exportAssetCustodyToPDF(asset, targetEmp, companySettings, {
        isReturnProtocol: returnDoc,
      });
    } catch (err) {
      console.error("Doğrudan PDF indirme hatası:", err);
      alert("PDF belgesi oluşturulurken bir hata meydana geldi.");
    } finally {
      setPdfLoadingAssetId(null);
    }
  };

  const getConditionText = (c?: string) => {
    switch (c) {
      case "new":
        return "Kusursuz / Sıfır";
      case "excellent":
        return "Çok İyi";
      case "good":
        return "İyi / Çalışır Durumda";
      case "fair":
        return "Orta / Yıpranmış";
      case "damaged":
        return "Hasarlı / Kusurlu";
      case "scrapped":
        return "Hurda / Kullanılamaz";
      default:
        return c || "İyi";
    }
  };

  const handleConfirmReturn = (
    assetId: string,
    returnData: {
      returnDate: string;
      conditionOnReturn: string;
      returnNotes?: string;
      returnReceivedBy?: string;
      returnKm?: number;
      returnedAccessoriesList?: string[];
    }
  ) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const updated: AssetCustody = {
      ...target,
      status: "returned",
      returnDate: returnData.returnDate,
      conditionOnReturn: returnData.conditionOnReturn,
      returnNotes: returnData.returnNotes,
      returnReceivedBy: returnData.returnReceivedBy,
      returnedAccessoriesList: returnData.returnedAccessoriesList,
      vehicleDetails: target.vehicleDetails
        ? {
            ...target.vehicleDetails,
            returnKm: returnData.returnKm,
          }
        : undefined,
    };

    onUpdateAsset(updated);
  };

  const handleExportInventoryExcel = () => {
    if (!assets || assets.length === 0) {
      alert("Dışa aktarılacak zimmet ve demirbaş kaydı bulunamadı.");
      return;
    }

    const headers = [
      "Sıra",
      "Barkod / Zimmet No",
      "Kategori",
      "Demirbaş Adı",
      "Marka",
      "Model",
      "Seri No / Plaka / IMEI",
      "Zimmetli Personel",
      "Departman",
      "Unvan",
      "Teslim Tarihi",
      "Teslim Kondisyonu",
      "Mevcut Durum",
      "İade Tarihi",
      "İade Kondisyonu",
      "İadeyi Teslim Alan",
      "Rayiç Bedel (₺)",
      "Teknik Özellikler / Donanım",
      "Teslim Edilen Aksesuarlar",
      "İade Notları & Ekspertiz",
      "Açıklama / Özel Notlar",
    ];

    const getCategoryName = (cat: string) => {
      switch (cat) {
        case "vehicle":
          return "Şirket Aracı";
        case "computer":
          return "Bilgisayar & Laptop";
        case "phone":
          return "Cep Telefonu";
        case "tablet":
          return "Tablet & iPad";
        case "peripheral":
          return "Donanım & Ekipman";
        case "office":
          return "Ofis Mobilyası";
        case "tool":
          return "Alet / Ekipman";
        default:
          return "Diğer Demirbaş";
      }
    };

    const getStatusText = (st: string) => {
      switch (st) {
        case "active":
          return "Aktif Zimmette";
        case "returned":
          return "İade Alındı";
        case "maintenance":
          return "Serviste / Bakımda";
        case "damaged":
          return "Arızalı / Hasarlı";
        case "scrapped":
          return "Hurda / Zayi";
        default:
          return st;
      }
    };

    const rows = assets.map((asset, idx) => {
      const emp = employees.find((e) => e.id === asset.employeeId);
      const empName = asset.employeeName || emp?.fullName || "—";
      const empDept = asset.employeeDepartment || emp?.department || "—";
      const empTitle = asset.employeeTitle || emp?.title || "—";

      // Identifier
      let identifier = asset.serialNumber || "—";
      if (asset.category === "vehicle" && asset.vehicleDetails?.plateNumber) {
        identifier = asset.vehicleDetails.plateNumber;
      } else if (asset.category === "phone" && asset.phoneDetails?.imei1) {
        identifier = asset.phoneDetails.imei1;
      }

      // Technical Details
      let techDetails = "";
      if (asset.category === "vehicle" && asset.vehicleDetails) {
        const v = asset.vehicleDetails;
        techDetails = [
          v.plateNumber ? `Plaka: ${v.plateNumber}` : "",
          v.fuelType ? `Yakıt: ${v.fuelType}` : "",
          v.currentKm !== undefined ? `Teslim KM: ${v.currentKm.toLocaleString("tr-TR")}` : "",
          v.returnKm !== undefined ? `İade KM: ${v.returnKm.toLocaleString("tr-TR")}` : "",
          v.chassisNumber ? `Şasi: ${v.chassisNumber}` : "",
          v.fuelCardNumber ? `Taşıt Tanıma: ${v.fuelCardNumber}` : "",
          v.hgsNumber ? `HGS: ${v.hgsNumber}` : "",
          v.kaskoExpiryDate ? `Kasko Bitiş: ${formatTRDate(v.kaskoExpiryDate)}` : "",
          v.insuranceExpiryDate ? `Sigorta Bitiş: ${formatTRDate(v.insuranceExpiryDate)}` : "",
          v.inspectionExpiryDate ? `Muayene Bitiş: ${formatTRDate(v.inspectionExpiryDate)}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
      } else if (asset.category === "computer" && asset.computerDetails) {
        const c = asset.computerDetails;
        techDetails = [
          c.computerType ? `Tip: ${c.computerType}` : "",
          c.processor ? `CPU: ${c.processor}` : "",
          c.ram ? `RAM: ${c.ram}` : "",
          c.storage ? `Disk: ${c.storage}` : "",
          c.operatingSystem ? `İşletim Sistemi: ${c.operatingSystem}` : "",
          c.macAddress ? `MAC: ${c.macAddress}` : "",
          c.screenSize ? `Ekran: ${c.screenSize}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
      } else if (asset.category === "phone" && asset.phoneDetails) {
        const p = asset.phoneDetails;
        techDetails = [
          p.imei1 ? `IMEI 1: ${p.imei1}` : "",
          p.imei2 ? `IMEI 2: ${p.imei2}` : "",
          p.phoneNumber ? `GSM: ${p.phoneNumber}` : "",
          p.simCardNumber ? `SIM Seri: ${p.simCardNumber}` : "",
          p.storageCapacity ? `Hafıza: ${p.storageCapacity}` : "",
          p.color ? `Renk: ${p.color}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
      } else if (asset.category === "tablet" && asset.tabletDetails) {
        const t = asset.tabletDetails;
        techDetails = [
          t.tabletType ? `Model: ${t.tabletType}` : "",
          t.screenSize ? `Ekran: ${t.screenSize}` : "",
          t.hasCellular ? "Hücresel (4G/5G)" : "Wi-Fi",
          t.imei ? `IMEI: ${t.imei}` : "",
          t.storageCapacity ? `Hafıza: ${t.storageCapacity}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
      }

      const accessories = (asset.accessoriesList || []).join(", ") || "—";

      return [
        idx + 1,
        asset.barcodeNumber || asset.inventoryNumber || `ZIM-${String(idx + 1).padStart(4, "0")}`,
        getCategoryName(asset.category),
        asset.assetName,
        asset.brand,
        asset.model,
        identifier,
        empName,
        empDept,
        empTitle,
        formatTRDate(asset.assignedDate),
        getConditionText(asset.conditionOnDelivery),
        getStatusText(asset.status),
        asset.returnDate ? formatTRDate(asset.returnDate) : "—",
        asset.status === "returned" ? getConditionText(asset.conditionOnReturn) : "—",
        asset.returnReceivedBy || "—",
        asset.approximateValue || 0,
        techDetails || "—",
        accessories,
        asset.returnNotes || "—",
        asset.notes || "—",
      ];
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const compName = companySettings?.companyName || "Şirket";

    exportToExcel({
      filename: `Zimmet_ve_Demirbas_Envanter_Listesi_${dateStr}`,
      sheetName: "Zimmet Envanteri",
      title: `${compName} - TÜM ZİMMET & DEMİRBAŞ ENVANTER LİSTESİ`,
      subtitle: `Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} | Toplam Envanter: ${assets.length} Adet | Toplam Rayiç Değeri: ₺${stats.totalValue.toLocaleString("tr-TR")}`,
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Zimmet & Demirbaş Yönetimi
            </h2>
            <p className="text-xs text-slate-500">
              Şirket araçları, bilgisayarlar, cep telefonları ve tabletlerin çalışanlara tahsisi ve yasal teslim tutanakları
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportInventoryExcel}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
            title="Tüm zimmet ve demirbaş listesini detaylı Excel (.xlsx) tablosu olarak indir"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Envanter Listesini Dışa Aktar
          </button>
          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Zimmet Kaydı Ekle
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Toplam Zimmet */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Toplam Kayıt</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.returnedCount} iade edilmiş demirbaş</p>
        </div>

        {/* Zimmetli Araçlar */}
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Şirket Araçları</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2">{stats.activeVehicles}</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Kasko, plaka & KM takipli</p>
        </div>

        {/* Bilgisayar & Laptoplar */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Bilgisayarlar</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">{stats.activeComputers}</p>
          <p className="text-[11px] text-indigo-600/80 mt-0.5">Laptop & Workstation</p>
        </div>

        {/* Telefon & Tablet */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Telefon & Tablet</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">{stats.activePhonesTablets}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">GSM hat ve mobil donanım</p>
        </div>

        {/* Toplam Rayiç Bedel */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Toplam Envanter Değeri</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-900 mt-2">{formatTRY(stats.totalValue)}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Sigortalanabilir rayiç bedel</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-xs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tüm Demirbaşlar ({assets.length})
          </button>
          <button
            onClick={() => setSelectedCategory("vehicle")}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-colors cursor-pointer ${
              selectedCategory === "vehicle"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-blue-50"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>🚗 Şirket Araçları ({assets.filter((a) => a.category === "vehicle").length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory("computer")}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-colors cursor-pointer ${
              selectedCategory === "computer"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-indigo-50"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>💻 Bilgisayar & Laptop ({assets.filter((a) => a.category === "computer").length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory("phone")}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-colors cursor-pointer ${
              selectedCategory === "phone"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-emerald-50"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Cep Telefonları ({assets.filter((a) => a.category === "phone").length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory("tablet")}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-colors cursor-pointer ${
              selectedCategory === "tablet"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-amber-50"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>📟 Tablet & iPad ({assets.filter((a) => a.category === "tablet").length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory("peripheral")}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-colors cursor-pointer ${
              selectedCategory === "peripheral"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-purple-50"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>🎧 Donanım / Ekipman ({assets.filter((a) => a.category === "peripheral").length})</span>
          </button>
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Plaka, IMEI, Personel, Marka, Barkod ara..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Zimmetli / Aktif</option>
              <option value="returned">İade Edildi (Boşta)</option>
              <option value="maintenance">Servis & Bakımda</option>
              <option value="damaged">Hasarlı / Arızalı</option>
              <option value="scrapped">Hurda</option>
            </select>

            {/* Employee Filter */}
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700 max-w-[160px] truncate"
            >
              <option value="all">Tüm Personeller</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Tablo Görünümü"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Display */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Kayıtlı Zimmet Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Arama veya filtre kriterlerinize uygun demirbaş zimmet kaydı bulunamadı. Yeni bir araç, bilgisayar veya cep telefonu zimmeti tanımlayabilirsiniz.
          </p>
          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Yeni Zimmet Oluştur
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const catBadge = getCategoryBadge(asset.category);
            const statusBadge = getStatusBadge(asset.status);
            const CatIcon = catBadge.icon;
            const targetEmp = employees.find((e) => e.id === asset.employeeId);

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${catBadge.bg}`}>
                        <CatIcon className={`w-5 h-5 ${catBadge.iconColor}`} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                          {asset.barcodeNumber || "ZIMMET"}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {asset.assetName}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {asset.brand} - {asset.model}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} mr-1.5`}></span>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 text-xs">
                    {/* Personel Bilgisi */}
                    <div className="flex items-center space-x-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {asset.employeeName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-xs truncate">
                          {asset.employeeName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {asset.employeeDepartment || "Departman"} • {asset.employeeTitle || "Personel"}
                        </p>
                      </div>
                    </div>

                    {/* Kategoriye Özel Önemli Özellik Rozetleri */}
                    {asset.category === "vehicle" && asset.vehicleDetails && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          {/* Plaka Tasarımı */}
                          <div className="inline-flex items-center border-2 border-slate-900 rounded bg-white overflow-hidden shadow-xs">
                            <span className="bg-blue-700 text-white text-[9px] font-bold px-1.5 py-0.5 font-sans">
                              TR
                            </span>
                            <span className="px-2 py-0.5 font-mono font-black text-xs text-slate-900 tracking-wider">
                              {asset.vehicleDetails.plateNumber}
                            </span>
                          </div>
                          <span className="text-slate-600 font-semibold font-mono text-[11px]">
                            {asset.vehicleDetails.currentKm?.toLocaleString("tr-TR")} KM
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-1">
                          <span className="flex items-center">
                            <Fuel className="w-3 h-3 mr-1 text-slate-400" />
                            {asset.vehicleDetails.fuelType || "Benzin"}
                          </span>
                          {asset.vehicleDetails.kaskoExpiryDate && (
                            <span className="flex items-center text-slate-500">
                              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                              Kasko: {formatTRDate(asset.vehicleDetails.kaskoExpiryDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {asset.category === "computer" && asset.computerDetails && (
                      <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-medium">
                            {asset.computerDetails.processor}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                            {asset.computerDetails.ram}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                            {asset.computerDetails.storage}
                          </span>
                        </div>
                        {asset.computerDetails.operatingSystem && (
                          <p className="text-slate-500 pt-1">
                            OS: {asset.computerDetails.operatingSystem}
                          </p>
                        )}
                      </div>
                    )}

                    {asset.category === "phone" && asset.phoneDetails && (
                      <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                        <p>
                          <strong className="text-slate-800">IMEI:</strong>{" "}
                          <span className="font-mono text-slate-600">{asset.phoneDetails.imei1}</span>
                        </p>
                        {asset.phoneDetails.phoneNumber && (
                          <p className="text-emerald-700 font-semibold">
                            Hat: {asset.phoneDetails.phoneNumber}
                          </p>
                        )}
                      </div>
                    )}

                    {asset.category === "tablet" && asset.tabletDetails && (
                      <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-medium">
                            {asset.tabletDetails.tabletType || asset.model}
                          </span>
                          {asset.tabletDetails.includesStylus && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                              ✏️ Kalem Var
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Accessories Pills */}
                    {asset.accessoriesList && asset.accessoriesList.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {asset.accessoriesList.slice(0, 3).map((acc, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                          >
                            + {acc}
                          </span>
                        ))}
                        {asset.accessoriesList.length > 3 && (
                          <span className="px-1 py-0.5 text-slate-400 text-[10px]">
                            +{asset.accessoriesList.length - 3} daha
                          </span>
                        )}
                      </div>
                    )}

                    {/* İade Bilgileri Kutusu (Eğer İade Edilmişse) */}
                    {asset.status === "returned" && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-amber-900 font-bold">
                          <span className="flex items-center gap-1">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            İade Tarihi: {formatTRDate(asset.returnDate)}
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded text-[10px] font-extrabold">
                            {getConditionText(asset.conditionOnReturn)}
                          </span>
                        </div>
                        {asset.returnNotes && (
                          <div className="bg-white/80 p-1.5 rounded border border-amber-100 text-[11px] text-amber-900">
                            <span className="font-bold block text-[10px] text-amber-700">İade / Teslim Alma Notu:</span>
                            <span className="italic">{asset.returnNotes}</span>
                          </div>
                        )}
                        {asset.returnReceivedBy && (
                          <p className="text-[10px] text-amber-800">
                            Teslim Alan Yetkili: <strong>{asset.returnReceivedBy}</strong>
                          </p>
                        )}
                        {asset.vehicleDetails?.returnKm && (
                          <p className="text-[10px] text-blue-800 font-mono font-bold">
                            İade KM: {asset.vehicleDetails.returnKm.toLocaleString("tr-TR")} KM
                          </p>
                        )}
                      </div>
                    )}

                    {/* Dates & Values */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>Teslim: <strong>{formatTRDate(asset.assignedDate)}</strong></span>
                      <span className="font-bold text-slate-900">{formatTRY(asset.approximateValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {/* Direct PDF Download */}
                    <button
                      onClick={() => handleDirectExportPDF(asset, asset.status === "returned")}
                      disabled={pdfLoadingAssetId === asset.id}
                      className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center text-[11px] font-semibold"
                      title={asset.status === "returned" ? "İade Tutanağı PDF İndir" : "İmzalı Zimmet Teslim Tutanağı PDF İndir"}
                    >
                      {pdfLoadingAssetId === asset.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      )}
                      <span>PDF</span>
                    </button>

                    {/* Print Preview Modal */}
                    <button
                      onClick={() => handleOpenPrintModal(asset, false)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      title="Zimmet Tutanağı Önizleme & Yazdır"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Return Action */}
                    {asset.status === "active" ? (
                      <button
                        onClick={() => handleOpenReturnModal(asset)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold flex items-center transition-colors cursor-pointer"
                        title="Demirbaşı İade Al"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        İade Al
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenPrintModal(asset, true)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center transition-colors cursor-pointer"
                        title="İade Tutanağı Önizleme"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        İade Tutanağı
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(asset)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirmId === asset.id ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            onDeleteAsset(asset.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded cursor-pointer"
                        >
                          Sil
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(asset.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Demirbaş / Eşya</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Zimmetli Personel</th>
                  <th className="px-4 py-3">Önemli Detaylar (Plaka/IMEI/CPU)</th>
                  <th className="px-4 py-3">Teslim Tarihi</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Rayiç Bedel</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssets.map((asset) => {
                  const catBadge = getCategoryBadge(asset.category);
                  const statusBadge = getStatusBadge(asset.status);
                  const CatIcon = catBadge.icon;

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <CatIcon className={`w-4 h-4 ${catBadge.iconColor}`} />
                          <div>
                            <p className="font-bold text-slate-900">{asset.assetName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {asset.barcodeNumber || asset.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${catBadge.bg}`}>
                          {catBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <div>
                          <p className="font-bold">{asset.employeeName}</p>
                          <p className="text-[10px] text-slate-500">{asset.employeeDepartment || "-"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {asset.category === "vehicle" && asset.vehicleDetails && (
                          <div className="inline-flex items-center border border-slate-900 rounded bg-white px-1.5 py-0.5 text-[11px] font-mono font-bold">
                            <span className="text-blue-700 mr-1 font-sans text-[9px]">TR</span>
                            {asset.vehicleDetails.plateNumber}
                          </div>
                        )}
                        {asset.category === "computer" && asset.computerDetails && (
                          <span className="text-slate-600 font-mono text-[11px]">
                            {asset.computerDetails.processor} • {asset.computerDetails.ram}
                          </span>
                        )}
                        {asset.category === "phone" && asset.phoneDetails && (
                          <span className="text-slate-600 font-mono text-[11px]">
                            IMEI: {asset.phoneDetails.imei1}
                          </span>
                        )}
                        {asset.category === "tablet" && asset.tabletDetails && (
                          <span className="text-slate-600 text-[11px]">
                            {asset.tabletDetails.tabletType || asset.model}
                          </span>
                        )}
                        {asset.category === "peripheral" && (
                          <span className="text-slate-600 text-[11px]">
                            {asset.model}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatTRDate(asset.assignedDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} mr-1.5`}></span>
                          {statusBadge.label}
                        </span>
                        {asset.status === "returned" && asset.returnDate && (
                          <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                            İade: {formatTRDate(asset.returnDate)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {formatTRY(asset.approximateValue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Direct PDF Download */}
                          <button
                            onClick={() => handleDirectExportPDF(asset, asset.status === "returned")}
                            disabled={pdfLoadingAssetId === asset.id}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center text-[11px] font-semibold"
                            title={asset.status === "returned" ? "İade Tutanağı PDF İndir" : "İmzalı Zimmet Teslim Tutanağı PDF İndir"}
                          >
                            {pdfLoadingAssetId === asset.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenPrintModal(asset, false)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Zimmet Tutanağı Yazdır / Önizle"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenPrintModal(asset, asset.status === "returned")}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Zimmet / İade Tutanağını WhatsApp ile Paylaş"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {asset.status === "active" ? (
                            <button
                              onClick={() => handleOpenReturnModal(asset)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Demirbaşı İade Al"
                            >
                              İade Al
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPrintModal(asset, true)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                              title="İade Tutanağı Görüntüle"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                              İade Tutanağı
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(asset)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteAsset(asset.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Modals */}
      <AssetCustodyModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={(newOrUpdated) => {
          if (editingAsset) {
            onUpdateAsset(newOrUpdated);
          } else {
            onAddAsset(newOrUpdated);
          }
        }}
        editingAsset={editingAsset}
        employees={employees}
        branches={branches}
        warehouses={warehouses}
      />

      <AssetCustodyPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        asset={printingAsset}
        employee={employees.find((e) => e.id === printingAsset?.employeeId)}
        companySettings={companySettings}
        isReturnProtocol={isReturnProtocol}
      />

      <AssetReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        asset={returningAsset}
        onConfirmReturn={handleConfirmReturn}
      />
    </div>
  );
};
