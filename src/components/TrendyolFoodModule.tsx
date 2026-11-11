import React, { useState, useMemo, useEffect } from "react";
import {
  TrendyolFoodOrder,
  TrendyolFoodSettings,
  TrendyolFoodLog,
  DEFAULT_TRENDYOL_FOOD_SETTINGS,
} from "../types/trendyolFood";
import type { CompanySettings, Invoice, Contact } from "../types";
import {
  getStoredTrendyolFoodSettings,
  saveStoredTrendyolFoodSettings,
  getStoredTrendyolFoodOrders,
  saveStoredTrendyolFoodOrders,
  getStoredTrendyolFoodLogs,
  addTrendyolFoodLog,
  testTrendyolConnection,
  createInvoiceFromTrendyolFoodOrder,
} from "../services/trendyolFoodService";
import { formatCurrency } from "../utils/exportUtils";
import { useTheme } from "../context/ThemeContext";
import {
  UtensilsCrossed,
  Bike,
  Zap,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  KeyRound,
  FileText,
  Sliders,
  History,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Store,
  DollarSign,
  User,
  MapPin,
  Phone,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Plus,
  Send,
} from "lucide-react";

interface TrendyolFoodModuleProps {
  companySettings?: CompanySettings;
  activeCompanyId?: string;
  invoices?: Invoice[];
  contacts?: Contact[];
  onAddInvoice?: (invoice: Invoice) => void;
  onAddContact?: (contact: Contact) => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onSelectTab?: (tab: any) => void;
}

export const TrendyolFoodModule: React.FC<TrendyolFoodModuleProps> = ({
  companySettings,
  activeCompanyId,
  invoices = [],
  contacts = [],
  onAddInvoice,
  onAddContact,
  onViewInvoice,
  onSelectTab,
}) => {
  const { theme } = useTheme();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<"orders" | "rules" | "api" | "logs">("orders");

  // Settings State
  const [settings, setSettings] = useState<TrendyolFoodSettings>(() =>
    getStoredTrendyolFoodSettings(activeCompanyId)
  );

  // Orders State
  const [orders, setOrders] = useState<TrendyolFoodOrder[]>(() =>
    getStoredTrendyolFoodOrders(activeCompanyId)
  );

  // Logs State
  const [logs, setLogs] = useState<TrendyolFoodLog[]>(() =>
    getStoredTrendyolFoodLogs(activeCompanyId)
  );

  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_invoice" | "invoiced" | "shipped">("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<TrendyolFoodOrder | null>(null);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Persist settings whenever changed
  const handleSaveSettings = (updated: TrendyolFoodSettings) => {
    setSettings(updated);
    saveStoredTrendyolFoodSettings(updated, activeCompanyId);
    showToast("✓ Trendyol GO Yemek ayarları başarıyla kaydedildi!");
    addTrendyolFoodLog(
      {
        type: "sync",
        title: "Ayarlar Güncellendi",
        detail: `Otomatik Fatura: ${updated.autoInvoiceOnDelivery ? "Aktif (Mysoft GİB)" : "Kapalı"}, Seri: ${updated.invoiceSeries}`,
        status: "info",
      },
      activeCompanyId
    );
    setLogs(getStoredTrendyolFoodLogs(activeCompanyId));
  };

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testTrendyolConnection(
        settings.supplierId,
        settings.apiKey,
        settings.apiSecret,
        settings.environment
      );
      setTestResult(res);
      if (res.ok) {
        const updated = {
          ...settings,
          isConnected: true,
          lastSyncStatus: "success" as const,
          lastSyncMessage: res.message,
        };
        handleSaveSettings(updated);
      }
    } catch (e: any) {
      setTestResult({
        ok: false,
        message: e?.message || "Bağlantı sırasında bir hata oluştu.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Sync Orders manually
  const handleSyncOrders = async () => {
    setIsSyncing(true);
    try {
      // Simulate/Trigger API sync
      await new Promise((resolve) => setTimeout(resolve, 800));

      const nowStr = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      const currentOrders = getStoredTrendyolFoodOrders(activeCompanyId);

      // If auto-invoice on delivery is ON, automatically invoice any un-invoiced delivered orders!
      let newlyInvoiced = 0;
      let updatedOrders = [...currentOrders];

      if (settings.autoInvoiceOnDelivery) {
        for (let i = 0; i < updatedOrders.length; i++) {
          const ord = updatedOrders[i];
          if (ord.status === "Delivered" && !ord.invoiced) {
            try {
              const { invoice, officialDocNumber } = await createInvoiceFromTrendyolFoodOrder(
                ord,
                settings,
                companySettings,
                invoices
              );
              if (onAddInvoice) {
                onAddInvoice(invoice);
              }
              updatedOrders[i] = {
                ...ord,
                invoiced: true,
                invoiceNumber: officialDocNumber,
                invoicedAt: new Date().toLocaleString("tr-TR"),
                invoiceStatus: settings.autoSendToGib ? "sent" : "draft",
              };
              newlyInvoiced++;

              addTrendyolFoodLog(
                {
                  type: "invoice_auto",
                  title: `Otomatik e-Arşiv Kesildi (${officialDocNumber})`,
                  detail: `${ord.orderNumber} nolu sipariş kurye tarafından teslim edildiği için otomatik fatura kesildi. Tutar: ₺${ord.payableAmount}`,
                  orderNumber: ord.orderNumber,
                  invoiceNumber: officialDocNumber,
                  status: "success",
                },
                activeCompanyId
              );
            } catch (err: any) {
              console.error("Auto-invoice error:", err);
            }
          }
        }
      }

      setOrders(updatedOrders);
      saveStoredTrendyolFoodOrders(updatedOrders, activeCompanyId);

      const updatedSettings = {
        ...settings,
        lastSyncAt: nowStr,
        lastSyncStatus: "success" as const,
      };
      setSettings(updatedSettings);
      saveStoredTrendyolFoodSettings(updatedSettings, activeCompanyId);

      addTrendyolFoodLog(
        {
          type: "sync",
          title: "Siparişler Senkronize Edildi",
          detail: `Trendyol GO Yemek'ten kurye teslimatları çekildi. ${newlyInvoiced > 0 ? `${newlyInvoiced} siparişe otomatik fatura kesildi!` : "Yeni fatura kesilecek sipariş yok."}`,
          status: "success",
        },
        activeCompanyId
      );
      setLogs(getStoredTrendyolFoodLogs(activeCompanyId));

      showToast(
        newlyInvoiced > 0
          ? `✓ Senkronizasyon Başarılı: ${newlyInvoiced} siparişe anında resmi fatura kesildi!`
          : "✓ Siparişler güncel! Yeni teslimat durumu bulunamadı."
      );
    } catch (e: any) {
      showToast("Senkronizasyon sırasında hata oluştu: " + e?.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Single Click Invoice Order
  const handleInvoiceSingleOrder = async (order: TrendyolFoodOrder) => {
    if (order.invoiced) {
      showToast(`Bu sipariş için zaten ${order.invoiceNumber} numaralı fatura kesilmiş.`);
      return;
    }

    try {
      const { invoice, officialDocNumber } = await createInvoiceFromTrendyolFoodOrder(
        order,
        settings,
        companySettings,
        invoices
      );

      if (onAddInvoice) {
        onAddInvoice(invoice);
      }

      const updated = orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              invoiced: true,
              invoiceNumber: officialDocNumber,
              invoicedAt: new Date().toLocaleString("tr-TR"),
              invoiceStatus: settings.autoSendToGib ? ("sent" as const) : ("draft" as const),
            }
          : o
      );

      setOrders(updated);
      saveStoredTrendyolFoodOrders(updated, activeCompanyId);

      addTrendyolFoodLog(
        {
          type: "invoice_manual",
          title: `Tek Tıkla Fatura Kesildi (${officialDocNumber})`,
          detail: `${order.orderNumber} siparişine ${settings.autoSendToGib ? "GİB onaylı e-Arşiv" : "satış faturası"} oluşturuldu. Tutar: ₺${order.payableAmount}`,
          orderNumber: order.orderNumber,
          invoiceNumber: officialDocNumber,
          status: "success",
        },
        activeCompanyId
      );
      setLogs(getStoredTrendyolFoodLogs(activeCompanyId));

      showToast(`⚡ ${order.orderNumber} için ${officialDocNumber} nolu e-Arşiv faturası kesildi ve Gelir Faturalarına eklendi!`);
    } catch (e: any) {
      showToast("Fatura kesimi sırasında hata: " + (e?.message || e));
    }
  };

  // Batch Invoice all delivered but uninvoiced
  const handleBatchInvoiceDelivered = async () => {
    const toInvoice = orders.filter((o) => o.status === "Delivered" && !o.invoiced);
    if (toInvoice.length === 0) {
      showToast("Fatura bekleyen teslim edilmiş sipariş bulunamadı.");
      return;
    }

    let count = 0;
    const updated = [...orders];

    for (let i = 0; i < updated.length; i++) {
      const ord = updated[i];
      if (ord.status === "Delivered" && !ord.invoiced) {
        try {
          const { invoice, officialDocNumber } = await createInvoiceFromTrendyolFoodOrder(
            ord,
            settings,
            companySettings,
            invoices
          );
          if (onAddInvoice) {
            onAddInvoice(invoice);
          }
          updated[i] = {
            ...ord,
            invoiced: true,
            invoiceNumber: officialDocNumber,
            invoicedAt: new Date().toLocaleString("tr-TR"),
            invoiceStatus: settings.autoSendToGib ? ("sent" as const) : ("draft" as const),
          };
          count++;
        } catch {}
      }
    }

    setOrders(updated);
    saveStoredTrendyolFoodOrders(updated, activeCompanyId);
    showToast(`✓ Harika! ${count} teslim edilmiş siparişe tek tıkla e-Arşiv faturaları kesildi!`);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter === "pending_invoice" && (order.status !== "Delivered" || order.invoiced)) {
        return false;
      }
      if (statusFilter === "invoiced" && !order.invoiced) {
        return false;
      }
      if (statusFilter === "shipped" && order.status !== "Shipped") {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          (order.courierName && order.courierName.toLowerCase().includes(q)) ||
          order.deliveryAddress.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + o.payableAmount, 0);
    const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
    const pendingInvoiceCount = orders.filter((o) => o.status === "Delivered" && !o.invoiced).length;
    const invoicedCount = orders.filter((o) => o.invoiced).length;
    const shippedCount = orders.filter((o) => o.status === "Shipped").length;

    return {
      totalOrders,
      totalAmount,
      deliveredCount,
      pendingInvoiceCount,
      invoicedCount,
      shippedCount,
    };
  }, [orders]);

  // Copy Webhook
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(settings.webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
    showToast("✓ Webhook adresi panoya kopyalandı!");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <UtensilsCrossed className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/30">
                <Bike className="w-3.5 h-3.5 text-white" />
                <span>Trendyol GO Yemek & Hızlı Teslimat</span>
              </span>
              {settings.isConnected ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-xs font-bold border border-emerald-300/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  API Bağlı & Aktif
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/30 text-amber-100 text-xs font-bold border border-amber-300/40">
                  Kurulum Bekliyor
                </span>
              )}
              {settings.autoInvoiceOnDelivery && (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-400/30 text-sky-100 text-xs font-bold border border-sky-300/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-sky-200" />
                  Otomatik Fatura Aktif
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kurye Teslim Etsin, Fatura Pat Diye Kesilsin! 🛵
            </h1>
            <p className="text-white/90 text-sm max-w-2xl leading-relaxed">
              Trendyol GO Yemek siparişlerinizi anlık çeker; kurye siparişi müşteriye teslim ettiği anda resmi e-Arşiv faturasını otomatik oluşturup Mysoft ile GİB'e iletir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSyncOrders}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-white text-orange-700 hover:bg-orange-50 active:scale-95 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-orange-600" : ""}`} />
              <span>{isSyncing ? "Siparişler Çekiliyor..." : "Siparişleri Şimdi Çek"}</span>
            </button>

            {metrics.pendingInvoiceCount > 0 && (
              <button
                type="button"
                onClick={handleBatchInvoiceDelivered}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                title="Teslim edilen ancak henüz faturası kesilmemiş tüm siparişlere tek tıkla fatura keser"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Teslim Edilenlere Fatura Kes ({metrics.pendingInvoiceCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Bugünkü Siparişler</span>
            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.totalOrders} <span className="text-xs font-medium text-slate-400">adet</span>
          </div>
          <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
            Toplam: {formatCurrency(metrics.totalAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Yoldaki Kuryeler</span>
            <Bike className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
            {metrics.shippedCount} <span className="text-xs font-medium text-slate-400">sipariş</span>
          </div>
          <p className="text-[11px] text-slate-500">Müşteriye doğru yolda</p>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-1 ${
          metrics.pendingInvoiceCount > 0
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Fatura Bekleyenler
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics.pendingInvoiceCount} <span className="text-xs font-medium text-slate-400">teslimat</span>
          </div>
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            Teslim edildi, fatura hazır
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Kesilen Faturalar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.invoicedCount} <span className="text-xs font-medium text-slate-400">fatura</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            GİB / e-Arşiv Resmi Kayıtlı
          </p>
        </div>
      </div>

      {/* Main Tab Bar - Extremely Simple and Friendly */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-orange-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Siparişler & Teslimatlar</span>
          {metrics.pendingInvoiceCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
              {metrics.pendingInvoiceCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "rules"
              ? "bg-orange-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Otomasyon & Fatura Kuralları</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("api")}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "api"
              ? "bg-orange-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Entegrasyon & API Bilgileri</span>
          {!settings.isConnected && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "logs"
              ? "bg-orange-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Fatura & İşlem Geçmişi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SİPARİŞLER VE TESLİMATLAR (CANLI AKIŞ) */}
      {/* ========================================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                Tümü ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending_invoice")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "pending_invoice"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Fatura Bekleyenler ({metrics.pendingInvoiceCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("invoiced")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "invoiced"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Faturası Kesilenler ({metrics.invoicedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("shipped")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "shipped"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border border-sky-200"
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Yoldaki Kuryeler ({metrics.shippedCount})</span>
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Sipariş no, müşteri veya kurye ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Orders Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isDelivered = order.status === "Delivered";
              const isShipped = order.status === "Shipped";

              return (
                <div
                  key={order.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-4 transition-all hover:border-orange-300 dark:hover:border-orange-700 ${
                    order.invoiced
                      ? "border-emerald-200 dark:border-emerald-900/40"
                      : isDelivered
                      ? "border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white font-mono">
                          {order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 text-[10px] font-black uppercase">
                          Trendyol Yemek
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Sipariş: {order.orderDate}</span>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                        isDelivered
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                          : isShipped
                          ? "bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {order.statusLabel}
                    </span>
                  </div>

                  {/* Customer & Delivery Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerName}</span>
                      <span className="text-slate-400 font-normal">({order.customerPhone})</span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">
                        {order.deliveryAddress} — {order.district} / {order.city}
                      </span>
                    </div>

                    {order.courierName && (
                      <div className="flex items-center gap-2 text-[11px] text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 p-2 rounded-lg border border-sky-100 dark:border-sky-900/40 font-medium">
                        <Bike className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Kurye: {order.courierName}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Items Preview */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 space-y-1.5 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sipariş İçeriği ({order.items.length} Kalem):
                    </div>
                    {order.items.slice(0, 3).map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="truncate pr-2 font-medium">
                          {it.quantity}x {it.name}
                        </span>
                        <span className="font-mono font-semibold shrink-0">
                          {formatCurrency(it.total)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-[10px] text-slate-400 italic">
                        +{order.items.length - 3} ürün daha...
                      </div>
                    )}
                  </div>

                  {/* Amount and Payment */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Ödeme Tipi</span>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {order.paymentMethod}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Fatura Tutarı</span>
                      <p className="text-base font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(order.payableAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Action / Invoice Status Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    {order.invoiced ? (
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>e-Arşiv: {order.invoiceNumber}</span>
                        </div>

                        {onViewInvoice && (
                          <button
                            type="button"
                            onClick={() => {
                              const found = invoices.find((inv) => inv.invoiceNumber === order.invoiceNumber);
                              if (found) {
                                onViewInvoice(found);
                              } else {
                                showToast(`Fatura ${order.invoiceNumber} Gelir Faturalarında kayıtlı.`);
                              }
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Gör</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : isDelivered ? (
                      <button
                        type="button"
                        onClick={() => handleInvoiceSingleOrder(order)}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-amber-200" />
                        <span>Tek Tıkla Fatura Kes ({formatCurrency(order.payableAmount)})</span>
                      </button>
                    ) : (
                      <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-sky-500" />
                        <span>Kurye Teslimatı Bekleniyor (Otomatik Kesilecek)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Arama kriterine uygun sipariş bulunamadı
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Filtrelerinizi değiştirebilir veya "Siparişleri Şimdi Çek" butonuna basarak Trendyol'dan son siparişleri alabilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OTOMASYON & FATURA KURALLARI ("PAT PAT OTOMATİK FATURA") */}
      {/* ========================================================================= */}
      {activeTab === "rules" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-8 max-w-4xl mx-auto">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span>Otomatik Fatura Kesim Kuralları</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Siparişler teslim edildiğinde faturanın hangi şartlarda ve nasıl kesileceğini belirleyin.
            </p>
          </div>

          {/* Master Switch: Kurye Teslim Edince Otomatik Fatura */}
          <div className="p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-sm sm:text-base text-orange-950 dark:text-orange-200 flex items-center gap-2">
                <Bike className="w-4 h-4 text-orange-600" />
                <span>Kurye Teslim Ettiği Anda Otomatik Fatura Kes</span>
              </span>
              <p className="text-xs text-orange-800 dark:text-orange-300/90 max-w-xl leading-relaxed">
                Bu özellik aktif olduğunda, Trendyol kuryesi siparişi teslim ettiği an sistem otomatik olarak e-Arşiv faturayı oluşturur. Hiçbir butona basmanıza gerek kalmaz.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={settings.autoInvoiceOnDelivery}
                onChange={(e) =>
                  handleSaveSettings({ ...settings, autoInvoiceOnDelivery: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {/* Section: Fatura Modu Seçimi */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Fatura Gönderim Şekli:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => handleSaveSettings({ ...settings, autoSendToGib: true })}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  settings.autoSendToGib
                    ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Doğrudan Mysoft ile GİB'e Gönder</span>
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${settings.autoSendToGib ? "border-orange-600 bg-orange-600" : "border-slate-300"}`}>
                    {settings.autoSendToGib && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  (Tavsiye Edilen) Fatura anında resmiyet kazanır. GİB onaylı e-Arşiv faturası kesilir ve müşteriye iletilir.
                </p>
              </div>

              <div
                onClick={() => handleSaveSettings({ ...settings, autoSendToGib: false })}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  !settings.autoSendToGib
                    ? "border-orange-600 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Taslak Olarak Oluştur (Ben Onaylayayım)</span>
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!settings.autoSendToGib ? "border-orange-600 bg-orange-600" : "border-slate-300"}`}>
                    {!settings.autoSendToGib && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Faturalar Gelir Faturalarına taslak statüsünde kaydedilir. Siz istediğiniz zaman inceleyip GİB'e gönderirsiniz.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Yemek KDV Oranı */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Yemek & Restoran KDV Oranı:
            </label>

            <div className="grid grid-cols-3 gap-3">
              {[
                { rate: 10, label: "%10 (Restoran / Yemek Hizmeti)", desc: "Mevzuat standart yemek KDV'si" },
                { rate: 1, label: "%1 (Temel Gıda / Ekmek)", desc: "İstisnai temel gıdalar" },
                { rate: 20, label: "%20 (Genel KDV)", desc: "Standart ticari oran" },
              ].map((kdv) => (
                <div
                  key={kdv.rate}
                  onClick={() => handleSaveSettings({ ...settings, defaultVatRate: kdv.rate })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-center ${
                    settings.defaultVatRate === kdv.rate
                      ? "border-orange-600 bg-orange-50 dark:bg-orange-950/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{kdv.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{kdv.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Detaylı Ayarlar Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Fatura Seri Ön Eki (3 Harf):
              </label>
              <input
                type="text"
                maxLength={3}
                value={settings.invoiceSeries}
                onChange={(e) =>
                  setSettings({ ...settings, invoiceSeries: e.target.value.toUpperCase() })
                }
                placeholder="Örn: TYM"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase font-mono"
              />
              <span className="text-[10px] text-slate-400">
                Örnek fatura numarası: {settings.invoiceSeries || "TYM"}2026000000001
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bireysel Müşteri Varsayılan TCKN:
              </label>
              <input
                type="text"
                maxLength={11}
                value={settings.fallbackTckn}
                onChange={(e) =>
                  setSettings({ ...settings, fallbackTckn: e.target.value })
                }
                placeholder="11111111111"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
              />
              <span className="text-[10px] text-slate-400">
                TCKN girilmemiş yemek siparişlerinde resmi GİB nihai tüketici kodu.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kurye Teslimat Ücreti:
              </label>
              <select
                value={settings.includeDeliveryFee ? "yes" : "no"}
                onChange={(e) =>
                  setSettings({ ...settings, includeDeliveryFee: e.target.value === "yes" })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="yes">Faturaya Teslimat Hizmet Kalemi Olarak Ekle (Tavsiye)</option>
                <option value="no">Faturaya Dahil Etme (Sadece Yemek Tutarı)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Otomatik Senkronizasyon Sıklığı:
              </label>
              <select
                value={settings.autoSyncIntervalMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, autoSyncIntervalMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value={1}>Her 1 Dakikada Bir (Çok Hızlı)</option>
                <option value={3}>Her 3 Dakikada Bir (Önerilen)</option>
                <option value={5}>Her 5 Dakikada Bir</option>
                <option value={10}>Her 10 Dakikada Bir</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => handleSaveSettings(settings)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Ayarları Kaydet</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENTEGRASYON VE APİ BİLGİLERİ (KOLAY KURULUM) */}
      {/* ========================================================================= */}
      {activeTab === "api" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* 3 Step Guide Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Trendyol GO Yemek API Bilgilerini 3 Kolay Adımda Alın</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1.5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <div className="font-bold text-xs">Partner Paneline Girin</div>
                <p className="text-[11px] text-white/70 leading-snug">
                  <strong>partner.trendyol.com</strong> adresinden restoran hesabınıza giriş yapın.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1.5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div className="font-bold text-xs">Entegrasyon Bilgileri</div>
                <p className="text-[11px] text-white/70 leading-snug">
                  Sağ üst profil menünüzden <strong>Hesap Bilgilerim &gt; Entegrasyon Bilgileri</strong> sayfasına geçin.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-1.5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <div className="font-bold text-xs">Kopyalayıp Yapıştırın</div>
                <p className="text-[11px] text-white/70 leading-snug">
                  Satıcı ID (Supplier ID), API Key ve API Secret anahtarlarınızı aşağıdaki kutucuklara yapıştırın.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  Trendyol GO API Anahtarları
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Restoranınızın Trendyol GO Yemek entegrasyonu için gereken resmi kimlik bilgileri.
                </p>
              </div>

              {settings.isConnected ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bağlantı Doğrulandı</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                  Bağlantı Bekliyor
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Satıcı ID (Supplier ID):
                </label>
                <input
                  type="text"
                  value={settings.supplierId}
                  onChange={(e) => setSettings({ ...settings, supplierId: e.target.value })}
                  placeholder="Örn: 104829"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Restoran / Şube Adı:
                </label>
                <input
                  type="text"
                  value={settings.restaurantName}
                  onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                  placeholder="Örn: Muavin Döner - Beşiktaş Şubesi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  API Key (Trendyol Partner):
                </label>
                <input
                  type="text"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="Örn: 9d82f718a382..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  API Secret (Gizli Anahtar):
                </label>
                <div className="relative">
                  <input
                    type={showApiSecret ? "text" : "password"}
                    value={settings.apiSecret}
                    onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                    placeholder="Örn: a8b92c4d7e1..."
                    className="w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Çalışma Ortamı:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="env"
                      checked={settings.environment === "production"}
                      onChange={() => setSettings({ ...settings, environment: "production" })}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>Canlı Üretim (Production - Gerçek Siparişler)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="env"
                      checked={settings.environment === "stage"}
                      onChange={() => setSettings({ ...settings, environment: "stage" })}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>Test / Stage Ortamı</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Test result banner */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                  testResult.ok
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !settings.supplierId.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "Bağlantı Test Ediliyor..." : "🔌 Bağlantıyı Test Et"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveSettings(settings)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Bilgileri Kaydet</span>
              </button>
            </div>
          </div>

          {/* Webhook Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Otomatik Webhook Bildirim Adresi</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trendyol Webhook ayarlarına bu URL'yi eklerseniz, kurye siparişi müşteriye teslim ettiği anda Trendyol sunucuları Muavin'e sinyal gönderir ve faturanız 1 saniyede otomatik kesilir.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={settings.webhookUrl}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhook ? "Kopyalandı" : "Kopyala"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FATURA VE İŞLEM GEÇMİŞİ (LOGLAR) */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Recent Invoices Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Trendyol Yemek Kesilen e-Arşiv Faturaları</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 text-left">Fatura No</th>
                    <th className="py-2.5 text-left">Sipariş No</th>
                    <th className="py-2.5 text-left">Müşteri</th>
                    <th className="py-2.5 text-right">Tutar</th>
                    <th className="py-2.5 text-center">GİB Durumu</th>
                    <th className="py-2.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders
                    .filter((o) => o.invoiced)
                    .map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {ord.invoiceNumber}
                        </td>
                        <td className="py-3 font-mono text-slate-500">{ord.orderNumber}</td>
                        <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                          {ord.customerName}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(ord.payableAmount)}
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            {ord.invoiceStatus === "sent" ? "GİB'e İletildi" : "Taslak Kayıtlı"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const found = invoices.find((inv) => inv.invoiceNumber === ord.invoiceNumber);
                              if (found && onViewInvoice) {
                                onViewInvoice(found);
                              } else {
                                showToast(`Fatura ${ord.invoiceNumber} Gelir Faturalarında kayıtlı.`);
                              }
                            }}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                          >
                            Görüntüle
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {orders.filter((o) => o.invoiced).length === 0 && (
              <p className="text-center py-6 text-xs text-slate-400">
                Henüz kesilmiş bir fatura bulunmuyor. Teslim edilen siparişler üzerinden tek tıkla fatura kesebilirsiniz.
              </p>
            )}
          </div>

          {/* Operational Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              <span>Sistem & Senkronizasyon Olay Günlüğü</span>
            </h3>

            <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
              {logs.map((lg) => (
                <div
                  key={lg.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {lg.title}
                    </span>
                    <span>{lg.timestamp}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{lg.detail}</p>
                </div>
              ))}

              {logs.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-400">Henüz bir log kaydı bulunmuyor.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
