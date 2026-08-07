import React, { useState } from "react";
import { Order, OrderItem, OrderType, OrderStatus, Contact, Product, Warehouse, CompanySettings } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency, formatDate } from "../utils/exportUtils";
import {
  ShoppingCart,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
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
} from "lucide-react";

interface OrdersProps {
  orders: Order[];
  contacts: Contact[];
  products: Product[];
  warehouses?: Warehouse[];
  companySettings?: CompanySettings;
  globalSearchTerm?: string;
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onConvertOrderToInvoice: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({
  orders = [],
  contacts = [],
  products = [],
  warehouses = [],
  companySettings,
  globalSearchTerm = "",
  onAddOrder,
  onUpdateOrder,
  onConvertOrderToInvoice,
  onDeleteOrder,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "sales" | "purchase">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [convertConfirmOrder, setConvertConfirmOrder] = useState<Order | null>(null);

  // New Order Form State
  const [orderType, setOrderType] = useState<OrderType>("sales");
  const [orderNumber, setOrderNumber] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  });
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
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
  const handleOpenNewOrderModal = (type: OrderType = "sales") => {
    setOrderType(type);
    const prefix = type === "sales" ? "SIP-SAT-" : "SIP-AL-";
    const num = Math.floor(10000 + Math.random() * 90000);
    const newNo = `${prefix}2026-${num}`;
    setOrderNumber(newNo);

    if (contacts.length > 0) {
      const filtered = contacts.filter((c) =>
        type === "sales" ? c.contactType !== "vendor" : c.contactType !== "customer"
      );
      setSelectedContactId(filtered[0]?.id || contacts[0]?.id || "");
    } else {
      setSelectedContactId("");
    }

    setOrderDate(new Date().toISOString().split("T")[0]);
    const delDate = new Date();
    delDate.setDate(delDate.getDate() + 7);
    setDeliveryDate(delDate.toISOString().split("T")[0]);
    setSelectedWarehouseId(warehouses[0]?.id || "");
    setNotes("");

    // Initial first line
    const firstProd = products[0];
    if (firstProd) {
      const price = type === "sales" ? firstProd.sellPrice : firstProd.buyPrice;
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

  // Item change handler
  const handleItemProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...items];
    if (prod) {
      const price = orderType === "sales" ? prod.sellPrice : prod.buyPrice;
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

  const handleItemChange = (index: number, field: keyof OrderItem, val: any) => {
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

  // Calculations for New Order
  const subtotal = items.reduce((acc, i) => acc + (i.totalWithoutVat || 0), 0);
  const totalVat = items.reduce((acc, i) => acc + (i.vatAmount || 0), 0);
  const grandTotal = subtotal + totalVat;

  // Submit New Order
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) {
      alert("Lütfen sipariş için bir Cari Firma / Kişi seçiniz.");
      return;
    }
    const contactObj = contacts.find((c) => c.id === selectedContactId);
    if (!contactObj) return;

    const whObj = warehouses.find((w) => w.id === selectedWarehouseId);

    const newOrder: Order = {
      id: "ord_" + Date.now(),
      orderNumber,
      type: orderType,
      contactId: contactObj.id,
      contactName: contactObj.name,
      contactPhone: contactObj.phone,
      contactEmail: contactObj.email,
      taxNumber: contactObj.taxNumber,
      orderDate,
      deliveryDate,
      warehouseId: whObj?.id,
      warehouseName: whObj?.name,
      items,
      subtotal,
      totalVat,
      grandTotal,
      currency: "₺",
      status: "pending",
      notes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    onAddOrder(newOrder);
    setIsModalOpen(false);
  };

  // Filtering
  const activeSearchQuery = (globalSearchTerm || searchTerm).toLowerCase().trim();
  const filteredOrders = orders.filter((o) => {
    // Type Filter
    if (activeTab === "sales" && o.type !== "sales") return false;
    if (activeTab === "purchase" && o.type !== "purchase") return false;

    // Status Filter
    if (statusFilter !== "all" && o.status !== statusFilter) return false;

    // Search
    if (activeSearchQuery) {
      const match =
        o.orderNumber.toLowerCase().includes(activeSearchQuery) ||
        o.contactName.toLowerCase().includes(activeSearchQuery) ||
        (o.notes && o.notes.toLowerCase().includes(activeSearchQuery)) ||
        o.items.some((i) => i.description.toLowerCase().includes(activeSearchQuery));
      if (!match) return false;
    }

    return true;
  });

  const displayedOrders = filteredOrders.slice(0, displayLimit);

  // Analytics Metrics
  const totalOrdersCount = orders.length;
  const salesOrdersTotal = orders
    .filter((o) => o.type === "sales" && o.status !== "cancelled")
    .reduce((acc, o) => acc + o.grandTotal, 0);
  const purchaseOrdersTotal = orders
    .filter((o) => o.type === "purchase" && o.status !== "cancelled")
    .reduce((acc, o) => acc + o.grandTotal, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === "pending" || o.status === "approved" || o.status === "processing").length;
  const convertedOrdersCount = orders.filter((o) => o.status === "converted").length;

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Onay Bekliyor</span>;
      case "approved":
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Onaylandı</span>;
      case "processing":
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><PackageCheck className="w-3 h-3" /> Hazırlanıyor</span>;
      case "shipped":
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Truck className="w-3 h-3" /> Sevk Edildi</span>;
      case "delivered":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Teslim Edildi</span>;
      case "converted":
        return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><FileText className="w-3 h-3" /> Faturaya Dönüştü</span>;
      case "cancelled":
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> İptal Edildi</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // Export Data Builder
  const getOrdersExportData = (): ExportData => {
    const headers = [
      "Sipariş No",
      "Sipariş Tipi",
      "Sipariş Tarihi",
      "Teslimat Tarihi",
      "Cari Unvanı",
      "Depo",
      "Kalem Sayısı",
      "Ara Toplam",
      "KDV Tutarı",
      "Genel Toplam",
      "Durum",
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.type === "sales" ? "Satış Siparişi (Alınan)" : "Alış Siparişi (Verilen)",
      o.orderDate,
      o.deliveryDate || "-",
      o.contactName,
      o.warehouseName || "-",
      o.items.length,
      formatCurrency(o.subtotal, o.currency || "TRY"),
      formatCurrency(o.totalVat, o.currency || "TRY"),
      formatCurrency(o.grandTotal, o.currency || "TRY"),
      o.status,
    ]);
    return {
      filename: `Siparisler_Listesi_${new Date().toISOString().split("T")[0]}`,
      title: "SİPARİŞ YÖNETİM LİSTESİ",
      subtitle: activeTab === "all" ? "Tüm Siparişler" : activeTab === "sales" ? "Satış Siparişleri" : "Alış Siparişleri",
      headers,
      rows,
    };
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header Controls (Lila Bal Peteği & Geometrik Desen - Cari Hesaplar Stili) */}
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
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-500/20"
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
            Sipariş Yönetimi (Satış & Alış Siparişleri)
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            Müşterilerinizden aldığınız satış ve tedarikçilerinize verdiğiniz alış siparişlerini takip edin ve faturaya dönüştürün.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenNewOrderModal("sales")}
            className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-purple-800 font-bold" />
            <span>Yeni Satış Siparişi</span>
          </button>
          <button
            onClick={() => handleOpenNewOrderModal("purchase")}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Alış Siparişi</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Sipariş</span>
            <div className="text-2xl font-bold text-slate-950 mt-1">{totalOrdersCount} Adet</div>
            <span className="text-[11px] text-purple-700 font-medium mt-1 inline-block">Aktif sipariş havuzu</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Sales Orders Total */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alınan Satış Siparişleri</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              ₺{salesOrdersTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">Müşterilerden gelen siparişler</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Purchase Orders Total */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verilen Alış Siparişleri</span>
            <div className="text-xl font-bold text-indigo-600 mt-1">
              ₺{purchaseOrdersTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium mt-1 inline-block">Tedarikçilere verilen siparişler</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Converted Orders */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturaya Dönüşenler</span>
            <div className="text-2xl font-bold text-teal-700 mt-1">{convertedOrdersCount} Adet</div>
            <span className="text-[11px] text-teal-600 font-medium mt-1 inline-block">Resmileşen siparişler</span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl border border-teal-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60"
                : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Tümü ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "sales"
                ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60"
                : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Satış Siparişleri (Alınan) ({orders.filter((o) => o.type === "sales").length})
          </button>
          <button
            onClick={() => setActiveTab("purchase")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "purchase"
                ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60"
                : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Alış Siparişleri (Verilen) ({orders.filter((o) => o.type === "purchase").length})
          </button>
        </div>

        {/* Search, Status & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full md:w-56">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sipariş No, Cari, Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white text-slate-900 text-xs rounded-xl px-3 py-2 border border-purple-200/60 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Bekleyenler</option>
            <option value="approved">Onaylananlar</option>
            <option value="processing">Hazırlananlar</option>
            <option value="shipped">Sevk Edilenler</option>
            <option value="delivered">Teslim Edilenler</option>
            <option value="converted">Faturaya Dönüşenler</option>
            <option value="cancelled">İptal Edilenler</option>
          </select>

          <ExportButtons getExportData={getOrdersExportData} size="sm" />
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[800px]">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-4">Sipariş No / Tarih</th>
                <th className="pb-2 px-4">Sipariş Tipi</th>
                <th className="pb-2 px-4">Cari Firma / İlgili</th>
                <th className="pb-2 px-4">Teslimat Tarihi / Depo</th>
                <th className="pb-2 px-4 text-center">Kalem</th>
                <th className="pb-2 px-4 text-right">Genel Toplam</th>
                <th className="pb-2 px-4">Durum</th>
                <th className="pb-2 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-purple-300" />
                    <p className="font-semibold text-slate-600">Kriterlere uygun sipariş kaydı bulunamadı.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Yeni bir satış veya alış siparişi oluşturmak için yukarıdaki butonları kullanabilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3.5 px-4 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-950 text-sm transition-colors">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 group-hover:text-purple-800/80 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        <span>{formatDate(order.orderDate)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {order.type === "sales" ? (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs">
                          <ArrowDownLeft className="w-3 h-3 text-purple-600" /> Satış Siparişi
                        </span>
                      ) : (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs">
                          <ArrowUpRight className="w-3 h-3 text-indigo-600" /> Alış Siparişi
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-950 transition-colors">
                        {order.contactName}
                      </div>
                      {order.taxNumber && (
                        <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">
                          VKN/TCKN: {order.taxNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="text-slate-800 font-semibold">{formatDate(order.deliveryDate)}</div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60 flex items-center gap-1 mt-0.5">
                        <WarehouseIcon className="w-3 h-3 text-purple-400" />
                        <span>{order.warehouseName || "Genel Depo"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                        {order.items.length} Kalem
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-black text-slate-900 group-hover:text-purple-950 text-sm">
                        ₺{order.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">
                        KDV: ₺{order.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Order Detail */}
                        <button
                          onClick={() => setSelectedOrderForView(order)}
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                          title="Sipariş Detayı / Belge Yazdır"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Convert to Invoice */}
                        {order.status !== "cancelled" && (
                          <button
                            onClick={() => setConvertConfirmOrder(order)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            title="Siparişi Faturaya Dönüştür"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Faturaya Dönüştür</span>
                          </button>
                        )}

                        {/* Delete Order */}
                        <button
                          onClick={() => {
                            if (confirm(`'${order.orderNumber}' numaralı siparişi silmek istediğinize emin misiniz?`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Siparişi Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > displayLimit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              Daha Fazla Göster ({displayLimit} / {filteredOrders.length})
            </button>
          </div>
        )}
      </div>

      {/* NEW ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-300 border border-purple-400/30">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    Yeni {orderType === "sales" ? "Satış" : "Alış"} Siparişi Oluştur
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    Cari müşteri/tedarikçi seçip stok & hizmet kalemlerini ekleyin
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

            <form onSubmit={handleSaveOrder} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher & Order Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sipariş Tipi</label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType("sales");
                        setOrderNumber("SIP-SAT-2026-" + Math.floor(10000 + Math.random() * 90000));
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        orderType === "sales" ? "bg-[#8252F6] text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Satış (Müşteri)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderType("purchase");
                        setOrderNumber("SIP-AL-2026-" + Math.floor(10000 + Math.random() * 90000));
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        orderType === "purchase" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Alış (Tedarikçi)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sipariş Numarası</label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teslimat Yapılacak Depo</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sipariş Tarihi</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Planlanan Teslimat Tarihi</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span>Sipariş Kalemleri (Stok & Hizmet Seçimi)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-x-auto custom-scrollbar w-full">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Ürün / Hizmet Seçimi</th>
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
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 mb-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              >
                                <option value="">-- Listeden Ürün/Hizmet Seçiniz --</option>
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
                              {prod && (
                                <div className="text-[10px] text-purple-600 font-medium mt-0.5">
                                  Depo Mevcut Stok: <strong className="text-slate-900">{prod.stockQuantity} {prod.unit}</strong>
                                </div>
                              )}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sipariş Notu & Şartlar</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sipariş, ödeme koşulları veya sevkiyat notları yazabilirsiniz..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
                    <span className="text-purple-700 font-bold">
                      ₺{totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 text-sm text-slate-900 font-bold bg-purple-100/60 px-3 rounded-xl border border-purple-200/80">
                    <span>Genel Toplam:</span>
                    <span className="text-purple-900">
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
                  className="px-6 py-2.5 bg-[#8252F6] hover:bg-[#703EE5] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Siparişi Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT ORDER PREVIEW MODAL */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedOrderForView.orderNumber}</h2>
                  <p className="text-xs text-slate-500 font-medium">Sipariş Belgesi & Detay Görünümü</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForView(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Order Document Body */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{companySettings?.companyName || "Muavin A.Ş."}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{companySettings?.address || "Mecidiyeköy, İstanbul"}</p>
                  <p className="text-xs text-slate-500">VKN: {companySettings?.taxNumber || "8470291038"}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-purple-700">{selectedOrderForView.orderNumber}</div>
                  <div className="text-xs text-slate-500">Tarih: {formatDate(selectedOrderForView.orderDate)}</div>
                  <div className="text-xs text-slate-500">Termin: {formatDate(selectedOrderForView.deliveryDate)}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Firma Bilgileri</div>
                <div className="text-sm font-bold text-slate-900">{selectedOrderForView.contactName}</div>
                {selectedOrderForView.taxNumber && (
                  <div className="text-xs text-slate-600">VKN/TCKN: {selectedOrderForView.taxNumber}</div>
                )}
                {selectedOrderForView.contactPhone && (
                  <div className="text-xs text-slate-600">Tel: {selectedOrderForView.contactPhone}</div>
                )}
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
                    {selectedOrderForView.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-slate-800">{item.description}</td>
                        <td className="p-2 text-center font-bold">{item.quantity} {item.unit}</td>
                        <td className="p-2 text-right">₺{(item.unitPrice || 0).toLocaleString("tr-TR")}</td>
                        <td className="p-2 text-right">%{item.vatRate}</td>
                        <td className="p-2 text-right font-bold">₺{(item.totalWithVat || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end border-t border-slate-200 pt-4">
                <div className="text-xs text-slate-500 max-w-xs">
                  <strong>Sipariş Notları:</strong> {selectedOrderForView.notes || "Özel not belirtilmedi."}
                </div>
                <div className="text-right space-y-1 text-xs">
                  <div>Ara Toplam: <strong>₺{selectedOrderForView.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong></div>
                  <div>Toplam KDV: <strong>₺{selectedOrderForView.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong></div>
                  <div className="text-sm font-bold text-purple-900 bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 mt-2">
                    Genel Toplam: ₺{selectedOrderForView.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Kapat
              </button>
              <div className="flex items-center gap-2">
                {selectedOrderForView.status !== "converted" && (
                  <button
                    onClick={() => {
                      const ord = selectedOrderForView;
                      setSelectedOrderForView(null);
                      setConvertConfirmOrder(ord);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Faturaya Dönüştür</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Yazdır / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT TO INVOICE CONFIRMATION DIALOG */}
      {convertConfirmOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Siparişi Faturaya Dönüştür</h3>
                <p className="text-xs text-slate-500">Cari ve stok hareketi otomatik işlenecektir</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div><strong>Sipariş No:</strong> {convertConfirmOrder.orderNumber}</div>
              <div><strong>Cari Unvanı:</strong> {convertConfirmOrder.contactName}</div>
              <div><strong>Fatura Tipi:</strong> {convertConfirmOrder.type === "sales" ? "Satış Faturası (Gelir)" : "Alış Faturası (Gider)"}</div>
              <div><strong>Fatura Tutarı:</strong> <span className="font-bold text-emerald-700">₺{convertConfirmOrder.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span></div>
            </div>

            <p className="text-xs text-slate-600">
              Bu işlem neticesinde sipariş durumu <strong>"Faturaya Dönüştü"</strong> olarak güncellenecek ve sistemde otomatik olarak yeni bir fatura kaydı oluşturulacaktır.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConvertConfirmOrder(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  onConvertOrderToInvoice(convertConfirmOrder);
                  setConvertConfirmOrder(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Onayla & Faturaya Dönüştür</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
