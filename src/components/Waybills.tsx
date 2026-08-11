import React, { useState } from "react";
import { Waybill, WaybillItem, WaybillType, WaybillStatus, Contact, Product, Warehouse, CompanySettings } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency } from "../utils/exportUtils";
import {
  Truck,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  PackageCheck,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building2,
  Users,
  Package,
  Trash2,
  Edit2,
  Eye,
  Send,
  AlertCircle,
  X,
  Warehouse as WarehouseIcon,
  Filter,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Navigation,
  User,
} from "lucide-react";

const TURKISH_MONTHS = [
  { id: 1, name: "Ocak" },
  { id: 2, name: "Şubat" },
  { id: 3, name: "Mart" },
  { id: 4, name: "Nisan" },
  { id: 5, name: "Mayıs" },
  { id: 6, name: "Haziran" },
  { id: 7, name: "Temmuz" },
  { id: 8, name: "Ağustos" },
  { id: 9, name: "Eylül" },
  { id: 10, name: "Ekim" },
  { id: 11, name: "Kasım" },
  { id: 12, name: "Aralık" },
];

const getDateYearAndMonth = (dateStr?: string) => {
  if (!dateStr) return { year: null, month: null };
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
    }
  }
  if (dateStr.includes(".")) {
    const parts = dateStr.split(".");
    if (parts.length >= 3) {
      const y = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return { year: null, month: null };
};

interface WaybillsProps {
  waybills: Waybill[];
  contacts: Contact[];
  products: Product[];
  warehouses?: Warehouse[];
  companySettings?: CompanySettings;
  globalSearchTerm?: string;
  forcedType?: "dispatch" | "receipt";
  onAddWaybill: (waybill: Waybill) => void;
  onUpdateWaybill: (waybill: Waybill) => void;
  onConvertWaybillToInvoice: (waybill: Waybill) => void;
  onDeleteWaybill: (id: string) => void;
}

export const Waybills: React.FC<WaybillsProps> = ({
  waybills = [],
  contacts = [],
  products = [],
  warehouses = [],
  companySettings,
  globalSearchTerm = "",
  forcedType,
  onAddWaybill,
  onUpdateWaybill,
  onConvertWaybillToInvoice,
  onDeleteWaybill,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "dispatch" | "receipt">(forcedType || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  React.useEffect(() => {
    if (forcedType) {
      setActiveTab(forcedType);
    }
  }, [forcedType]);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWaybillForView, setSelectedWaybillForView] = useState<Waybill | null>(null);
  const [convertConfirmWaybill, setConvertConfirmWaybill] = useState<Waybill | null>(null);

  // New Waybill Form State
  const [waybillType, setWaybillType] = useState<WaybillType>("dispatch");
  const [waybillNumber, setWaybillNumber] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [waybillDate, setWaybillDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dispatchDate, setDispatchDate] = useState(() => {
    const now = new Date();
    return `${now.toISOString().split("T")[0]} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [vehiclePlate, setVehiclePlate] = useState("34 BRS 102");
  const [driverName, setDriverName] = useState("Ahmet Demir");
  const [driverTckn, setDriverTckn] = useState("10293847562");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<WaybillItem[]>([
    {
      id: "item_1",
      productId: "",
      productCode: "",
      description: "",
      quantity: 1,
      unit: "Adet",
      unitPrice: 0,
      vatRate: 20,
      discountRate: 0,
      totalWithoutVat: 0,
      vatAmount: 0,
      totalWithVat: 0,
    },
  ]);

  // Open Modal Helper
  const handleOpenNewWaybillModal = (type: WaybillType = "dispatch") => {
    setWaybillType(type);
    const prefix = type === "dispatch" ? "IRS-SEVK-" : "IRS-AL-";
    const num = Math.floor(10000 + Math.random() * 90000);
    const newNo = `${prefix}2026-${num}`;
    setWaybillNumber(newNo);

    if (contacts.length > 0) {
      const filtered = contacts.filter((c) =>
        type === "dispatch" ? c.contactType !== "vendor" : c.contactType !== "customer"
      );
      const chosen = filtered[0] || contacts[0];
      setSelectedContactId(chosen?.id || "");
      setDeliveryAddress(chosen?.address || chosen?.addressDetails?.fullAddress || "");
    } else {
      setSelectedContactId("");
      setDeliveryAddress("");
    }

    setWaybillDate(new Date().toISOString().split("T")[0]);
    const now = new Date();
    setDispatchDate(`${now.toISOString().split("T")[0]} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setSelectedWarehouseId(warehouses[0]?.id || "");
    setNotes("");

    // Initial first line
    const firstProd = products[0];
    if (firstProd) {
      const price = type === "dispatch" ? firstProd.sellPrice : firstProd.buyPrice;
      const totalWithout = price * 1;
      const vat = (totalWithout * (firstProd.vatRate || 20)) / 100;
      setItems([
        {
          id: "item_" + Date.now(),
          productId: firstProd.id,
          productCode: firstProd.code,
          description: firstProd.name,
          quantity: 1,
          unit: firstProd.unit || "Adet",
          unitPrice: price,
          vatRate: firstProd.vatRate || 20,
          discountRate: 0,
          totalWithoutVat: totalWithout,
          vatAmount: vat,
          totalWithVat: totalWithout + vat,
        },
      ]);
    } else {
      setItems([
        {
          id: "item_" + Date.now(),
          productId: "",
          productCode: "",
          description: "",
          quantity: 1,
          unit: "Adet",
          unitPrice: 0,
          vatRate: 20,
          discountRate: 0,
          totalWithoutVat: 0,
          vatAmount: 0,
          totalWithVat: 0,
        },
      ]);
    }

    setIsModalOpen(true);
  };

  // Contact Selection Change
  const handleContactChange = (cId: string) => {
    setSelectedContactId(cId);
    const c = contacts.find((item) => item.id === cId);
    if (c) {
      setDeliveryAddress(c.address || c.addressDetails?.fullAddress || "");
    }
  };

  // Item change handler
  const handleItemProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...items];
    if (prod) {
      const price = waybillType === "dispatch" ? prod.sellPrice : prod.buyPrice;
      const qty = updated[index].quantity || 1;
      const discount = updated[index].discountRate || 0;
      const totalWithout = qty * price * (1 - discount / 100);
      const vat = (totalWithout * (prod.vatRate || 20)) / 100;

      updated[index] = {
        ...updated[index],
        productId: prod.id,
        productCode: prod.code,
        description: prod.name,
        unit: prod.unit || "Adet",
        unitPrice: price,
        vatRate: prod.vatRate || 20,
        totalWithoutVat: totalWithout,
        vatAmount: vat,
        totalWithVat: totalWithout + vat,
      };
    } else {
      updated[index].productId = "";
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof WaybillItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discount = Number(item.discountRate) || 0;
    const vatRate = Number(item.vatRate) || 0;

    const totalWithout = qty * price * (1 - discount / 100);
    const vat = (totalWithout * vatRate) / 100;

    item.totalWithoutVat = totalWithout;
    item.vatAmount = vat;
    item.totalWithVat = totalWithout + vat;

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: "item_" + Date.now(),
        productId: "",
        productCode: "",
        description: "",
        quantity: 1,
        unit: "Adet",
        unitPrice: 0,
        vatRate: 20,
        discountRate: 0,
        totalWithoutVat: 0,
        vatAmount: 0,
        totalWithVat: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations for New Waybill
  const subtotal = items.reduce((acc, i) => acc + (i.totalWithoutVat || 0), 0);
  const totalVat = items.reduce((acc, i) => acc + (i.vatAmount || 0), 0);
  const grandTotal = subtotal + totalVat;

  // Submit New Waybill
  const handleSaveWaybill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) {
      alert("Lütfen irsaliye için bir Cari Firma / Kişi seçiniz.");
      return;
    }
    const contactObj = contacts.find((c) => c.id === selectedContactId);
    if (!contactObj) return;

    const whObj = warehouses.find((w) => w.id === selectedWarehouseId);

    const newWaybill: Waybill = {
      id: "way_" + Date.now(),
      waybillNumber,
      type: waybillType,
      contactId: contactObj.id,
      contactName: contactObj.name,
      contactPhone: contactObj.phone,
      contactEmail: contactObj.email,
      taxNumber: contactObj.taxNumber,
      waybillDate,
      dispatchDate,
      vehiclePlate,
      driverName,
      driverTckn,
      deliveryAddress,
      warehouseId: whObj?.id,
      warehouseName: whObj?.name,
      items,
      subtotal,
      totalVat,
      grandTotal,
      currency: "₺",
      status: "shipped",
      notes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    onAddWaybill(newWaybill);
    setIsModalOpen(false);
  };

  // Years memo
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    waybills.forEach((w) => {
      const { year } = getDateYearAndMonth(w.waybillDate || w.createdAt);
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [waybills]);

  // Filtering
  const activeSearchQuery = (globalSearchTerm || searchTerm).toLowerCase().trim();
  const filteredWaybills = waybills.filter((w) => {
    // Year & Month Filter
    const { year: wayYear, month: wayMonth } = getDateYearAndMonth(w.waybillDate || w.createdAt);

    if (selectedYear !== "all" && wayYear !== parseInt(selectedYear, 10)) {
      return false;
    }

    if (selectedMonth !== "all" && wayMonth !== parseInt(selectedMonth, 10)) {
      return false;
    }

    // Type Filter
    if (activeTab === "dispatch" && w.type !== "dispatch") return false;
    if (activeTab === "receipt" && w.type !== "receipt") return false;

    // Status Filter
    if (statusFilter !== "all" && w.status !== statusFilter) return false;

    // Search
    if (activeSearchQuery) {
      const match =
        w.waybillNumber.toLowerCase().includes(activeSearchQuery) ||
        w.contactName.toLowerCase().includes(activeSearchQuery) ||
        (w.vehiclePlate && w.vehiclePlate.toLowerCase().includes(activeSearchQuery)) ||
        (w.driverName && w.driverName.toLowerCase().includes(activeSearchQuery)) ||
        (w.notes && w.notes.toLowerCase().includes(activeSearchQuery)) ||
        w.items.some((i) => i.description.toLowerCase().includes(activeSearchQuery));
      if (!match) return false;
    }

    return true;
  });

  const displayedWaybills = filteredWaybills.slice(0, displayLimit);

  // Analytics Metrics
  const totalWaybillsCount = waybills.length;
  const dispatchWaybillsTotal = waybills
    .filter((w) => w.type === "dispatch" && w.status !== "cancelled")
    .reduce((acc, w) => acc + w.grandTotal, 0);
  const receiptWaybillsTotal = waybills
    .filter((w) => w.type === "receipt" && w.status !== "cancelled")
    .reduce((acc, w) => acc + w.grandTotal, 0);
  const pendingWaybillsCount = waybills.filter((w) => w.status === "pending" || w.status === "shipped").length;
  const invoicedWaybillsCount = waybills.filter((w) => w.status === "invoiced").length;

  // Status Badge Helper
  const getStatusBadge = (status: WaybillStatus) => {
    switch (status) {
      case "pending":
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Hazırlanıyor</span>;
      case "shipped":
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Truck className="w-3 h-3" /> Sevk Edildi</span>;
      case "delivered":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Teslim Edildi</span>;
      case "invoiced":
        return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Faturalandırıldı</span>;
      case "cancelled":
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> İptal Edildi</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // Export Data Builder
  const getWaybillsExportData = (): ExportData => {
    const headers = [
      "İrsaliye No",
      "İrsaliye Tipi",
      "İrsaliye Tarihi",
      "Fiili Sevk Tarihi",
      "Cari Unvanı",
      "Araç Plaka / Sürücü",
      "Depo",
      "Kalem Sayısı",
      "Ara Toplam",
      "KDV Tutarı",
      "Genel Toplam",
      "Durum",
    ];
    const rows = filteredWaybills.map((w) => [
      w.waybillNumber,
      w.type === "dispatch" ? "Sevk İrsaliyesi (Giden)" : "Alış İrsaliyesi (Gelen)",
      w.waybillDate,
      w.dispatchDate || "-",
      w.contactName,
      `${w.vehiclePlate || "-"} / ${w.driverName || "-"}`,
      w.warehouseName || "-",
      w.items.length,
      formatCurrency(w.subtotal, w.currency || "TRY"),
      formatCurrency(w.totalVat, w.currency || "TRY"),
      formatCurrency(w.grandTotal, w.currency || "TRY"),
      w.status,
    ]);
    return {
      filename: `Irsaliyeler_Listesi_${new Date().toISOString().split("T")[0]}`,
      title: "İRSALİYE YÖNETİM LİSTESİ",
      subtitle: activeTab === "all" ? "Tüm İrsaliyeler" : activeTab === "dispatch" ? "Sevk İrsaliyeleri (Giden)" : "Alış İrsaliyeleri (Gelen)",
      headers,
      rows,
    };
  };

  // Header and Description based on forcedType or active view
  const pageTitle =
    forcedType === "receipt"
      ? "Gelen İrsaliyeler (Alış İrsaliyeleri)"
      : forcedType === "dispatch"
      ? "Giden İrsaliyeler (Sevk İrsaliyeleri)"
      : "İrsaliye Yönetimi & İrsaliye Oluştur";

  const pageDescription =
    forcedType === "receipt"
      ? "Tedarikçilerden gelen alış irsaliyeleri takibi, tesellüm kayıtları, sürücü/plaka ve irsaliye detayları"
      : forcedType === "dispatch"
      ? "Müşterilere sevk edilen malzeme irsaliyeleri, sürücü & plaka kaydı ve faturalandırma modülü"
      : "Sevk ve alış irsaliyeleri takibi, sevkiyat araç & sürücü kaydı ve tek tıkla faturalandırma modülü";

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header (Lila Bal Peteği & Geometrik Desen - Faturalar Tasarımı ile Aynı) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Geometrik Vektör Şekiller */}
        <svg
          className="absolute -right-6 -bottom-10 w-48 h-48 pointer-events-none text-purple-400/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="100,35 155,67 155,133 100,165 45,133 45,67" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="55" x2="180" y2="145" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="145" x2="180" y2="55" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        </svg>

        <svg
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-400/10"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="relative z-10">
          <h2 className="text-lg font-extrabold text-slate-950">
            {pageTitle}
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            {pageDescription}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {(!forcedType || forcedType === "dispatch") && (
            <button
              onClick={() => handleOpenNewWaybillModal("dispatch")}
              className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-purple-800 font-bold" />
              <span>Yeni Sevk İrsaliyesi</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {forcedType === "receipt" ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Gelen İrsaliye</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {waybills.filter((w) => w.type === "receipt").length} Adet
                </div>
                <span className="text-[11px] text-indigo-600 font-medium mt-1 inline-block">Alış irsaliye kayıtları</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Alış Tutar</span>
                <div className="text-xl font-bold text-indigo-600 mt-1">
                  ₺{receiptWaybillsTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-indigo-600 font-medium mt-1 inline-block">Tedarikçi teslimat toplamı</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tesellüm Bekleyen</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {waybills.filter((w) => w.type === "receipt" && (w.status === "pending" || w.status === "shipped")).length} Adet
                </div>
                <span className="text-[11px] text-amber-600 font-medium mt-1 inline-block">Açık alış sevkiyatı</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturalandırılan Alışlar</span>
                <div className="text-2xl font-bold text-teal-600 mt-1">
                  {waybills.filter((w) => w.type === "receipt" && w.status === "invoiced").length} Adet
                </div>
                <span className="text-[11px] text-teal-600 font-medium mt-1 inline-block">Gider faturasına dönüştürülen</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </>
        ) : forcedType === "dispatch" ? (
          <>
            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Giden İrsaliye</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {waybills.filter((w) => w.type === "dispatch").length} Adet
                </div>
                <span className="text-[11px] text-blue-600 font-medium mt-1 inline-block">Sevk irsaliye kayıtları</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Sevk Tutarı</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  ₺{dispatchWaybillsTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Müşteri sevkiyat toplamı</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sevkiyattaki Mallar</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {waybills.filter((w) => w.type === "dispatch" && (w.status === "pending" || w.status === "shipped")).length} Adet
                </div>
                <span className="text-[11px] text-amber-600 font-medium mt-1 inline-block">Açık sevk irsaliyesi</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturalandırılan Sevkler</span>
                <div className="text-2xl font-bold text-teal-600 mt-1">
                  {waybills.filter((w) => w.type === "dispatch" && w.status === "invoiced").length} Adet
                </div>
                <span className="text-[11px] text-teal-600 font-medium mt-1 inline-block">Gelir faturasına dönüştürülen</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Total Waybills */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam İrsaliye</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{totalWaybillsCount} Adet</div>
                <span className="text-[11px] text-blue-600 font-medium mt-1 inline-block">Sistemde kayıtlı irsaliyeler</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            {/* Dispatch Total */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giden Sevk İrsaliyeleri</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  ₺{dispatchWaybillsTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Müşterilere sevk edilen mallar</span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            {/* Receipt Total */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gelen Alış İrsaliyeleri</span>
                <div className="text-xl font-bold text-indigo-600 mt-1">
                  ₺{receiptWaybillsTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-indigo-600 font-medium mt-1 inline-block">Tedarikçilerden gelen teslimatlar</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>

            {/* Invoiced Status */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Açık Sevkiyat & Faturalanan</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-amber-600">{pendingWaybillsCount} Açık</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-lg font-bold text-teal-600">{invoicedWaybillsCount} Fatura</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">Faturalandırma durumu</span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Main Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs">
          {!forcedType ? (
            <>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60"
                    : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Tüm İrsaliyeler ({waybills.length})
              </button>
              <button
                onClick={() => setActiveTab("dispatch")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "dispatch"
                    ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60"
                    : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Sevk İrsaliyeleri (Giden)
              </button>
              <button
                onClick={() => setActiveTab("receipt")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "receipt"
                    ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60"
                    : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Alış İrsaliyeleri (Gelen)
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab(forcedType)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === forcedType
                  ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60"
                  : "text-purple-900/70 hover:text-purple-950"
              }`}
            >
              Tümü ({waybills.filter((w) => w.type === forcedType).length})
            </button>
          )}
        </div>

        {/* Search, Year/Month, Status & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Yıl Filtresi */}
          <div className="flex items-center gap-1.5 bg-white border border-purple-200/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-slate-400 font-bold">Yıl:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Yıllar</option>
              {availableYears.map((y) => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>

          {/* Ay Filtresi */}
          <div className="flex items-center gap-1.5 bg-white border border-purple-200/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-slate-400 font-bold">Ay:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Aylar</option>
              {TURKISH_MONTHS.map((m) => (
                <option key={m.id} value={m.id.toString()}>{m.name}</option>
              ))}
            </select>
          </div>

          {(selectedYear !== "all" || selectedMonth !== "all") && (
            <button
              onClick={() => {
                setSelectedYear("all");
                setSelectedMonth("all");
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Yıl ve Ay filtresini temizle"
            >
              <X className="w-3.5 h-3.5" />
              <span>Temizle</span>
            </button>
          )}

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İrsaliye No, Cari, Plaka..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white text-slate-700 text-xs rounded-xl px-3 py-2 border border-purple-200/60 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Hazırlanıyor</option>
            <option value="shipped">Sevk Edildi</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="invoiced">Faturalandırıldı</option>
            <option value="cancelled">İptal Edilenler</option>
          </select>

          <ExportButtons getExportData={getWaybillsExportData} size="sm" />
        </div>
      </div>

      {/* Waybills Table */}
      <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[800px]">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-4">İrsaliye No / Tarih</th>
                <th className="pb-2 px-4">İrsaliye Tipi</th>
                <th className="pb-2 px-4">Cari Firma / VKN</th>
                <th className="pb-2 px-4">Plaka & Sürücü / Depo</th>
                <th className="pb-2 px-4 text-center">Kalem</th>
                <th className="pb-2 px-4 text-right">Genel Toplam</th>
                <th className="pb-2 px-4">Durum</th>
                <th className="pb-2 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredWaybills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    Kriterlere uygun irsaliye kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                displayedWaybills.map((waybill) => (
                  <tr
                    key={waybill.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3.5 px-4 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-950 font-mono text-sm transition-colors">
                        {waybill.waybillNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        <span>{waybill.waybillDate}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {waybill.type === "dispatch" ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 group-hover:border-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Sevk İrsaliyesi
                        </span>
                      ) : (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:border-indigo-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3" /> Alış İrsaliyesi
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {waybill.contactName}
                      {waybill.taxNumber && (
                        <div className="text-[10px] font-normal text-slate-400 group-hover:text-purple-700/60">
                          VKN: {waybill.taxNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="text-slate-800 font-bold flex items-center gap-1 group-hover:text-purple-950">
                        <Truck className="w-3.5 h-3.5 text-purple-500" />
                        <span>{waybill.vehiclePlate || "Plakasız"}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        <span>{waybill.driverName || "Sürücü Belirtilmedi"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span className="bg-purple-50 border border-purple-200 text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold">
                        {waybill.items.length} Kalem
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-950 font-mono text-sm">
                        ₺{waybill.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">
                        KDV: ₺{waybill.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {getStatusBadge(waybill.status)}
                    </td>

                    <td className="py-3.5 px-4 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* İncele Button */}
                        <button
                          onClick={() => setSelectedWaybillForView(waybill)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="İrsaliye Detayını İncele"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>İncele</span>
                        </button>

                        {/* Yazdır Button */}
                        <button
                          onClick={() => {
                            setSelectedWaybillForView(waybill);
                            setTimeout(() => window.print(), 100);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="İrsaliye Belgesini Yazdır"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Yazdır</span>
                        </button>

                        {/* Convert to Invoice - Sadece Giden Sevk İrsaliyesi İçin */}
                        {waybill.type === "dispatch" && waybill.status !== "invoiced" && waybill.status !== "cancelled" && (
                          <button
                            onClick={() => setConvertConfirmWaybill(waybill)}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="İrsaliyeyi Faturalandır"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Faturalandır</span>
                          </button>
                        )}

                        {/* Delete Waybill */}
                        <button
                          onClick={() => {
                            if (confirm(`'${waybill.waybillNumber}' numaralı irsaliyeyi silmek istediğinize emin misiniz?`)) {
                              onDeleteWaybill(waybill.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="İrsaliyeyi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredWaybills.length > displayLimit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              Daha Fazla Göster ({displayLimit} / {filteredWaybills.length})
            </button>
          </div>
        )}
      </div>

      {/* NEW WAYBILL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 border border-blue-400/30">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    Yeni {waybillType === "dispatch" ? "Sevk" : "Alış"} İrsaliyesi Düzenle
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    Cari firma, araç plaka, sürücü ve stok kalemlerini girin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWaybill} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher & Waybill Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">İrsaliye Tipi</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setWaybillType("dispatch");
                        setWaybillNumber("IRS-SEVK-2026-" + Math.floor(10000 + Math.random() * 90000));
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        waybillType === "dispatch" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Sevk İrsaliyesi (Giden)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWaybillType("receipt");
                        setWaybillNumber("IRS-AL-2026-" + Math.floor(10000 + Math.random() * 90000));
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        waybillType === "receipt" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Alış İrsaliyesi (Gelen)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">İrsaliye Numarası</label>
                  <input
                    type="text"
                    required
                    value={waybillNumber}
                    onChange={(e) => setWaybillNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Çıkış / Varış Deposu</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cari Firma / Müşteri / Tedarikçi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedContactId}
                    onChange={(e) => handleContactChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">-- Cari Seçiniz --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyTitle ? `(${c.companyTitle})` : ""} - VKN: {c.taxNumber || "-"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">İrsaliye Tarihi</label>
                  <input
                    type="date"
                    required
                    value={waybillDate}
                    onChange={(e) => setWaybillDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fiili Sevk Tarihi / Saati</label>
                  <input
                    type="text"
                    required
                    placeholder="YYYY-AA-GG HH:MM"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Logistics & Driver Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Araç Plakası</label>
                  <input
                    type="text"
                    placeholder="34 ABC 123"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sürücü Adı Soyadı</label>
                  <input
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sürücü TCKN</label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="10293847562"
                    value={driverTckn}
                    onChange={(e) => setDriverTckn(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teslimat Adresi</label>
                  <input
                    type="text"
                    placeholder="Sevkiyatın teslim edileceği açık adres..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>İrsaliye Kalemleri (Sevk Edilen Stoklar)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar w-full">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Ürün / Stok Seçimi</th>
                        <th className="py-2.5 px-3 w-20">Miktar</th>
                        <th className="py-2.5 px-3 w-20">Birim</th>
                        <th className="py-2.5 px-3 w-28 text-right">Birim Fiyat (₺)</th>
                        <th className="py-2.5 px-3 w-20 text-right">KDV (%)</th>
                        <th className="py-2.5 px-3 w-32 text-right">Toplam (KDV Dahil)</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {items.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.productId);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60">
                            <td className="p-2">
                              <select
                                value={item.productId || ""}
                                onChange={(e) => handleItemProductSelect(idx, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">-- Listeden Ürün Seçiniz --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    [{p.code}] {p.name} - Stok: {p.stockQuantity} {p.unit} (Satış: ₺{p.sellPrice})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder="Kalem açıklaması..."
                                value={item.description}
                                onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-900"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center font-medium text-slate-700"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                required
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-right font-bold text-slate-900"
                              />
                            </td>

                            <td className="p-2">
                              <select
                                value={item.vatRate}
                                onChange={(e) => handleItemChange(idx, "vatRate", e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-xs text-center font-medium text-slate-800"
                              >
                                <option value={0}>%0</option>
                                <option value={1}>%1</option>
                                <option value={10}>%10</option>
                                <option value={20}>%20</option>
                              </select>
                            </td>

                            <td className="p-2 text-right font-bold text-slate-900">
                              ₺{(item.totalWithVat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">İrsaliye Notu & Teslim Şartları</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Teslimat notu, şoför imzası vb. detaylar yazabilirsiniz..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-700 justify-self-end w-full max-w-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Ara Toplam (KDV Hariç):</span>
                    <span className="text-slate-900 font-bold">
                      ₺{subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Toplam KDV Tutarı:</span>
                    <span className="text-blue-700 font-bold">
                      ₺{totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm text-slate-900 font-bold bg-blue-100/60 px-3 rounded-xl border border-blue-200/80">
                    <span>Genel Toplam:</span>
                    <span className="text-blue-900">
                      ₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>İrsaliyeyi Kaydet & Sevk Et</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT WAYBILL DOCUMENT PREVIEW MODAL */}
      {selectedWaybillForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedWaybillForView.waybillNumber}</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedWaybillForView.type === "receipt" ? "Resmi Alış İrsaliyesi Belge Detayı" : "Resmi Sevk İrsaliyesi Belge Detayı"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
                <button
                  onClick={() => setSelectedWaybillForView(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Waybill Document Body */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{companySettings?.companyName || "Muavin Bilişim A.Ş."}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{companySettings?.address || "Mecidiyeköy, İstanbul"}</p>
                  <p className="text-xs text-slate-500">VKN: {companySettings?.taxNumber || "8470291038"}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-blue-700">{selectedWaybillForView.waybillNumber}</div>
                  <div className="text-xs text-slate-500">Düzenlenme: {selectedWaybillForView.waybillDate}</div>
                  <div className="text-xs text-slate-500">Fiili Sevk: {selectedWaybillForView.dispatchDate || "-"}</div>
                </div>
              </div>

              {/* Driver & Vehicle Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Firma Bilgileri</div>
                  <div className="text-sm font-bold text-slate-900">{selectedWaybillForView.contactName}</div>
                  {selectedWaybillForView.taxNumber && (
                    <div className="text-xs text-slate-600">VKN/TCKN: {selectedWaybillForView.taxNumber}</div>
                  )}
                  {selectedWaybillForView.deliveryAddress && (
                    <div className="text-xs text-slate-600">Teslimat Adresi: {selectedWaybillForView.deliveryAddress}</div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Lojistik & Sürücü Bilgileri</div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Araç Plakası: {selectedWaybillForView.vehiclePlate || "Belirtilmedi"}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sürücü: {selectedWaybillForView.driverName || "Belirtilmedi"}</span>
                  </div>
                  {selectedWaybillForView.driverTckn && (
                    <div className="text-[11px] text-slate-500">Sürücü TC: {selectedWaybillForView.driverTckn}</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto custom-scrollbar w-full rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2">Açıklama / Ürün</th>
                      <th className="p-2 text-center">Miktar</th>
                      <th className="p-2 text-right">Birim Fiyat</th>
                      <th className="p-2 text-right">KDV</th>
                      <th className="p-2 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedWaybillForView.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-slate-800">{item.description}</td>
                        <td className="p-2 text-center font-bold">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right">₺{(item.unitPrice || 0).toLocaleString("tr-TR")}</td>
                        <td className="p-2 text-right">%{item.vatRate}</td>
                        <td className="p-2 text-right font-bold">₺{(item.totalWithVat || 0).toLocaleString("tr-TR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 max-w-sm">
                  <strong>Notlar:</strong> {selectedWaybillForView.notes || "Mal teslimatı sırasında eksiksiz ve hasarsız teslim alınmıştır."}
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-slate-500">
                    Ara Toplam: ₺{selectedWaybillForView.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500">
                    KDV: ₺{selectedWaybillForView.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    Genel Toplam: ₺{selectedWaybillForView.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT TO INVOICE CONFIRM MODAL */}
      {convertConfirmWaybill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">İrsaliyeyi Faturalandır</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">{convertConfirmWaybill.waybillNumber}</strong> numaralı irsaliye,{" "}
              <strong>₺{convertConfirmWaybill.grandTotal.toLocaleString("tr-TR")}</strong> tutarında resmi e-Faturaya dönüştürülecektir.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div>• Ürün stok miktarları otomatik düşürülecektir/artırılacaktır.</div>
              <div>• Cari hesaba ₺{convertConfirmWaybill.grandTotal.toLocaleString("tr-TR")} borç/alacak işlenecektir.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConvertConfirmWaybill(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onConvertWaybillToInvoice(convertConfirmWaybill);
                  setConvertConfirmWaybill(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Onayla ve Faturayı Kes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
