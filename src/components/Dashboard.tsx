import React, { useMemo, useState } from "react";
import { ExchangeRatesWidget } from "./ExchangeRatesWidget";
import {
  Contact,
  Invoice,
  Account,
  Transaction,
  CompanySettings,
  Cheque,
  PromissoryNote,
  Product,
  Quote,
  Order,
  Waybill,
} from "../types";
import {
  Search,
  Users,
  FileText,
  Receipt,
  ArrowUpRight,
  LayoutDashboard,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Building2,
  BadgeAlert,
  Layers,
  ArrowRight,
  Package,
  ShoppingCart,
  Send,
  Sparkle,
  SlidersHorizontal,
  Activity,
  ArrowDownRight,
} from "lucide-react";
import { ModuleEntranceHeader } from "./common/ModuleEntranceHeader";
import { GeometricHoneycombBackground } from "./common/GeometricHoneycombBackground";
import { useTheme } from "../context/ThemeContext";
import { formatCurrency, formatDate } from "../utils/exportUtils";

interface DashboardProps {
  contacts: Contact[];
  invoices: Invoice[];
  accounts: Account[];
  transactions: Transaction[];
  cheques?: Cheque[];
  promissoryNotes?: PromissoryNote[];
  products?: Product[];
  quotes?: Quote[];
  orders?: Order[];
  waybills?: Waybill[];
  settings: CompanySettings;
  globalSearchTerm?: string;
  onSelectTab: (tab: any) => void;
  onOpenQuickAdd: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  contacts,
  invoices,
  accounts,
  transactions,
  cheques = [],
  promissoryNotes = [],
  products = [],
  quotes = [],
  orders = [],
  waybills = [],
  settings,
  globalSearchTerm = "",
  onSelectTab,
  onOpenQuickAdd,
}) => {
  const { theme } = useTheme();
  const [chartPeriod, setChartPeriod] = useState<"6m" | "12m">("6m");
  const [activeAccountType, setActiveAccountType] = useState<"all" | "cash" | "bank">("all");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // 1. KPI Hesaplamaları
  const metrics = useMemo(() => {
    // Kasa & Banka Toplam Varlık
    const totalLiquidAssets = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
    const cashTotal = accounts.filter((a) => a.type === "cash").reduce((acc, a) => acc + (a.balance || 0), 0);
    const bankTotal = accounts.filter((a) => a.type === "bank" || a.type === "credit_card" || a.type === "pos").reduce((acc, a) => acc + (a.balance || 0), 0);

    // Cari Alacaklar & Borçlar (Contact bazlı)
    let totalReceivables = 0;
    let totalPayables = 0;
    contacts.forEach((c) => {
      if (c.balance > 0) totalReceivables += c.balance;
      else if (c.balance < 0) totalPayables += Math.abs(c.balance);
    });

    // Faturalar Tahsilat / Ödeme Durumu
    const unpaidSalesInvoices = invoices.filter((inv) => inv.type === "sales" && inv.status !== "paid" && inv.status !== "cancelled");
    const unpaidPurchaseInvoices = invoices.filter((inv) => inv.type === "purchase" && inv.status !== "paid" && inv.status !== "cancelled");

    // Vadesi Geçmiş Alacaklar
    const overdueReceivables = unpaidSalesInvoices
      .filter((inv) => inv.dueDate && inv.dueDate < todayStr)
      .reduce((acc, inv) => acc + (inv.remainingAmount ?? (inv.grandTotal - (inv.paidAmount || 0))), 0);

    // Vadesi Geçmiş Borçlar
    const overduePayables = unpaidPurchaseInvoices
      .filter((inv) => inv.dueDate && inv.dueDate < todayStr)
      .reduce((acc, inv) => acc + (inv.remainingAmount ?? (inv.grandTotal - (inv.paidAmount || 0))), 0);

    // Portföydeki Çek / Senetler
    const portfolioChequesAmount = cheques
      .filter((c) => c.status === "portfolio" && c.type === "received")
      .reduce((acc, c) => acc + (c.amount || 0), 0);

    const issuedChequesPending = cheques
      .filter((c) => c.status === "portfolio" && c.type === "issued")
      .reduce((acc, c) => acc + (c.amount || 0), 0);

    // Düşük Stok Uyarısı
    const lowStockCount = products.filter((p) => {
      const min = p.minStockAlert ?? p.minStock ?? 5;
      return (p.stockQuantity ?? p.stock ?? 0) <= min && !p.isService;
    }).length;

    // Bekleyen Siparişler
    const pendingOrdersCount = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;

    return {
      totalLiquidAssets,
      cashTotal,
      bankTotal,
      totalReceivables,
      totalPayables,
      overdueReceivables,
      overduePayables,
      portfolioChequesAmount,
      issuedChequesPending,
      lowStockCount,
      pendingOrdersCount,
      unpaidSalesCount: unpaidSalesInvoices.length,
      unpaidPurchaseCount: unpaidPurchaseInvoices.length,
    };
  }, [accounts, contacts, invoices, cheques, products, orders, todayStr]);

  // 2. Trend & Nakit Akışı Aylık Grafiği (Son 6 / 12 Ay)
  const cashFlowChartData = useMemo(() => {
    const monthCount = chartPeriod === "6m" ? 6 : 12;
    const result: Array<{
      monthKey: string;
      label: string;
      gelir: number;
      gider: number;
      net: number;
    }> = [];

    const now = new Date();
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${month}`;
      const label = d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });

      // O aydaki gelir işlemleri + tahsilat
      const monthIncome = transactions
        .filter((t) => t.date && t.date.startsWith(monthKey) && (t.type === "income" || t.type === "collection"))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // O aydaki gider işlemleri + tediye
      const monthExpense = transactions
        .filter((t) => t.date && t.date.startsWith(monthKey) && (t.type === "expense" || t.type === "payment"))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      result.push({
        monthKey,
        label,
        gelir: Math.round(monthIncome),
        gider: Math.round(monthExpense),
        net: Math.round(monthIncome - monthExpense),
      });
    }

    return result;
  }, [transactions, chartPeriod]);

  // 3. Fatura Dağılımı (Satış vs Alış)
  const invoiceBreakdown = useMemo(() => {
    let salesTotal = 0;
    let purchaseTotal = 0;

    invoices.forEach((inv) => {
      if (inv.status === "cancelled") return;
      if (inv.type === "sales") salesTotal += inv.grandTotal || 0;
      else if (inv.type === "purchase") purchaseTotal += inv.grandTotal || 0;
    });

    return [
      { name: "Satış Faturaları", value: Math.round(salesTotal), color: "#0ea5e9" },
      { name: "Alış & Masraflar", value: Math.round(purchaseTotal), color: "#f43f5e" },
    ];
  }, [invoices]);

  // 4. Yaklaşan / Vadesi Geçen Kritik Hareketler
  const upcomingActionItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      dueDate: string;
      amount: number;
      type: "sales_invoice" | "purchase_invoice" | "cheque_rcv" | "cheque_iss";
      isOverdue: boolean;
      daysDiff: number;
    }> = [];

    // Fatura vadesi
    invoices.forEach((inv) => {
      if (inv.status === "paid" || inv.status === "cancelled" || !inv.dueDate) return;
      const rem = inv.remainingAmount ?? (inv.grandTotal - (inv.paidAmount || 0));
      if (rem <= 0) return;

      const due = new Date(inv.dueDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

      // Son 30 gün içinde vadesi geçmiş veya önümüzdeki 30 gün içinde vadesi gelecekler
      if (diffDays <= 30 && diffDays >= -60) {
        items.push({
          id: `inv-${inv.id}`,
          title: inv.contactName || "Belirtilmemiş Cari",
          subtitle: `${inv.invoiceNumber} • ${inv.type === "sales" ? "Tahsil Edilecek Fatura" : "Ödenecek Fatura"}`,
          dueDate: inv.dueDate,
          amount: rem,
          type: inv.type === "sales" ? "sales_invoice" : "purchase_invoice",
          isOverdue: diffDays < 0,
          daysDiff: diffDays,
        });
      }
    });

    // Çek vadeleri
    cheques.forEach((chq) => {
      if (chq.status !== "portfolio" || !chq.dueDate) return;
      const due = new Date(chq.dueDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 30 && diffDays >= -60) {
        items.push({
          id: `chq-${chq.id}`,
          title: chq.contactName || chq.drawerName || "Çek",
          subtitle: `${chq.bankName || "Banka"} • ${chq.type === "received" ? "Alınan Portföy Çeki" : "Verilen Borç Çeki"}`,
          dueDate: chq.dueDate,
          amount: chq.amount,
          type: chq.type === "received" ? "cheque_rcv" : "cheque_iss",
          isOverdue: diffDays < 0,
          daysDiff: diffDays,
        });
      }
    });

    // Öncelik: Vadesi geçmişler en üstte, sonra en yakın tarihliler
    return items
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysDiff - b.daysDiff;
      })
      .slice(0, 6);
  }, [invoices, cheques, todayStr]);

  // 5. Son Yapılan Finansal İşlemler
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
      .slice(0, 6);
  }, [transactions]);

  // 5.1 Son 10 İşlem / Etkinlik Günlüğü (Recent Activity Panel)
  const recentActivities = useMemo(() => {
    interface ActivityItem {
      id: string;
      title: string;
      description: string;
      timeLabel: string;
      timestamp: number;
      type: "invoice" | "payment" | "collection" | "contact" | "order" | "cheque" | "product";
      badgeText: string;
      amount?: number;
      currency?: string;
      targetTab: string;
    }

    const list: ActivityItem[] = [];

    // Faturalar (Satış / Alış)
    invoices.forEach((inv) => {
      const rawDate = inv.createdAt || inv.issueDate;
      const ts = rawDate ? new Date(rawDate).getTime() : 0;
      const isSales = inv.type === "sales";
      list.push({
        id: `inv-${inv.id}`,
        title: isSales ? "Satış Faturası Düzenlendi" : "Alış / Gider Faturası Kaydedildi",
        description: `${inv.invoiceNumber} • ${inv.contactName || "Cari"}`,
        timeLabel: formatDate(rawDate),
        timestamp: isNaN(ts) ? 0 : ts,
        type: "invoice",
        badgeText: isSales ? "Satış Faturası" : "Alış Faturası",
        amount: inv.payableAmount ?? inv.grandTotal,
        currency: inv.currency || "TRY",
        targetTab: isSales ? "invoices_sales" : "invoices_purchase",
      });
    });

    // Kasa / Banka / Cari Finansal İşlemler (Tahsilat, Tediye, Gelir, Gider)
    transactions.forEach((tx) => {
      const rawDate = tx.date;
      const ts = rawDate ? new Date(rawDate).getTime() : 0;
      const isIncome = tx.type === "income" || tx.type === "collection";
      let actionTitle = "Finansal İşlem Gerçekleşti";
      if (tx.type === "collection") actionTitle = "Tahsilat Alındı";
      else if (tx.type === "payment") actionTitle = "Ödeme Yapıldı";
      else if (tx.type === "income") actionTitle = "Gelir Girişi Yapıldı";
      else if (tx.type === "expense") actionTitle = "Gider Çıkışı Yapıldı";
      else if (tx.type === "transfer") actionTitle = "Hesaplar Arası Virman";

      list.push({
        id: `tx-${tx.id}`,
        title: actionTitle,
        description: `${tx.accountName || "Kasa/Banka"} • ${tx.description || tx.contactName || "İşlem"}`,
        timeLabel: formatDate(rawDate),
        timestamp: isNaN(ts) ? 0 : ts,
        type: isIncome ? "collection" : "payment",
        badgeText: isIncome ? "Tahsilat / Gelir" : "Ödeme / Gider",
        amount: tx.amount,
        currency: tx.currency || "TRY",
        targetTab: "transactions",
      });
    });

    // Eklenen Cariler
    contacts.forEach((c) => {
      const rawDate = c.createdAt;
      const ts = rawDate ? new Date(rawDate).getTime() : 0;
      const typeLabel = c.contactType === "customer" ? "Müşteri" : c.contactType === "vendor" || c.contactType === "supplier" ? "Tedarikçi" : "Cari";
      list.push({
        id: `cnt-${c.id}`,
        title: "Yeni Cari Hesap Eklendi",
        description: `${c.name}${c.companyTitle ? ` (${c.companyTitle})` : ""}`,
        timeLabel: formatDate(rawDate),
        timestamp: isNaN(ts) ? 0 : ts,
        type: "contact",
        badgeText: typeLabel,
        targetTab: "contacts",
      });
    });

    // Siparişler (Varsa)
    orders.forEach((ord) => {
      const rawDate = ord.createdAt || ord.orderDate || ord.date;
      const ts = rawDate ? new Date(rawDate).getTime() : 0;
      list.push({
        id: `ord-${ord.id}`,
        title: ord.type === "sales" ? "Yeni Sipariş Alındı" : "Satın Alma Siparişi Verildi",
        description: `${ord.orderNumber} • ${ord.contactName || "Cari"}`,
        timeLabel: formatDate(rawDate),
        timestamp: isNaN(ts) ? 0 : ts,
        type: "order",
        badgeText: "Sipariş",
        amount: ord.grandTotal,
        currency: ord.currency || "TRY",
        targetTab: "orders",
      });
    });

    // Kronolojik olarak en yeniden en eskiye sırala ve son 10 işlemi al
    return list
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [invoices, transactions, contacts, orders]);

  // 6. Kasa ve Banka Hesapları
  const filteredAccounts = useMemo(() => {
    if (activeAccountType === "cash") return accounts.filter((a) => a.type === "cash");
    if (activeAccountType === "bank") return accounts.filter((a) => a.type !== "cash");
    return accounts;
  }, [accounts, activeAccountType]);

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* 1. ÜST KARŞILAMA VE ANA AKSİYONLAR */}
      <ModuleEntranceHeader
        id="dashboard-header"
        badge="Finans & İşletme Kokpiti"
        badgeIcon={<LayoutDashboard className="w-3 h-3 text-[#0f6bae]" />}
        title="Genel Bakış & Finansal Göstergeler"
        description="Nakit varlıklar, cari alacak/borç dengesi, fatura vadeleri ve canlı piyasa verileri tek ekranda."
        stats={[
          { label: "Toplam Varlık", value: formatCurrency(metrics.totalLiquidAssets), tone: "success" },
          { label: "Bekleyen Alacak", value: formatCurrency(metrics.totalReceivables), tone: "info" },
          { label: "Toplam Borç", value: formatCurrency(metrics.totalPayables), tone: metrics.totalPayables > 0 ? "warning" : "default" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQuickAdd}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-2xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Hızlı İşlem Ekle</span>
            </button>
          </div>
        }
      />

      {/* Global Search Results Banner if search term is entered */}
      {Boolean(globalSearchTerm && globalSearchTerm.trim()) && (
        <div className="bg-[#0b1c2d] text-white p-5 rounded-2xl shadow-md border border-[#1a2b3e] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#83b8ff]" />
              <h3 className="font-editorial text-base text-[#faf8ff]">
                "{globalSearchTerm}" için Arama Sonuçları Özet Görünümü
              </h3>
            </div>
            <span className="text-xs text-[#d9e8ff] bg-[#0f6bae]/40 px-2.5 py-1 rounded-lg border border-[#0f6bae]">
              Aramaya uygun tüm modüller filtrelendi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => onSelectTab("contacts")}
              className="bg-[#131b2e]/90 hover:bg-[#0f6bae]/30 p-3.5 rounded-xl border border-[#283044] cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#83b8ff]" />
                <div>
                  <div className="text-xs text-[#9daec3]">Cari / Müşteriler</div>
                  <div className="text-sm font-semibold text-white font-mono">
                    {contacts.filter((c) => c.name.toLowerCase().includes(globalSearchTerm.toLowerCase())).length} Eşleşen Cari
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#83b8ff]" />
            </div>

            <div
              onClick={() => onSelectTab("invoices")}
              className="bg-[#131b2e]/90 hover:bg-[#0f6bae]/30 p-3.5 rounded-xl border border-[#283044] cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#83b8ff]" />
                <div>
                  <div className="text-xs text-[#9daec3]">Faturalar</div>
                  <div className="text-sm font-semibold text-white font-mono">
                    {invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(globalSearchTerm.toLowerCase()) || i.contactName.toLowerCase().includes(globalSearchTerm.toLowerCase())).length} Eşleşen Fatura
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#83b8ff]" />
            </div>

            <div
              onClick={() => onSelectTab("transactions")}
              className="bg-[#131b2e]/90 hover:bg-[#0f6bae]/30 p-3.5 rounded-xl border border-[#283044] cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-[#83b8ff]" />
                <div>
                  <div className="text-xs text-[#9daec3]">Finansal İşlemler</div>
                  <div className="text-sm font-semibold text-white font-mono">
                    {transactions.filter((t) => t.description.toLowerCase().includes(globalSearchTerm.toLowerCase()) || (t.contactName && t.contactName.toLowerCase().includes(globalSearchTerm.toLowerCase()))).length} Eşleşen İşlem
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#83b8ff]" />
            </div>
          </div>
        </div>
      )}

      {/* 2. DÖRT ANA FİNANSAL KPI KARTI (Modern Bento Glassmorphic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KART 1: Nakit & Banka Varlığı */}
        <div
          onClick={() => onSelectTab("accounts")}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kasa & Banka Varlığı</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center module-icon-container transition-transform">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(metrics.totalLiquidAssets)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Kasa: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(metrics.cashTotal)}</strong></span>
            <span>Banka: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(metrics.bankTotal)}</strong></span>
          </div>
        </div>

        {/* KART 2: Bekleyen Cari Alacaklar */}
        <div
          onClick={() => onSelectTab("contacts_debtors")}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bekleyen Alacaklar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center module-icon-container transition-transform">
              <ArrowDownLeft className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            {formatCurrency(metrics.totalReceivables)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{metrics.unpaidSalesCount} ödenmemiş fatura</span>
            {metrics.overdueReceivables > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {formatCurrency(metrics.overdueReceivables)} gecikmede
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Vadesi geçen yok
              </span>
            )}
          </div>
        </div>

        {/* KART 3: Toplam Borçlar & Ödemeler */}
        <div
          onClick={() => onSelectTab("invoices_purchase")}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tedarikçi Borçları</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center module-icon-container transition-transform">
              <ArrowUpRight className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            {formatCurrency(metrics.totalPayables)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{metrics.unpaidPurchaseCount} bekleyen gider</span>
            {metrics.overduePayables > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatCurrency(metrics.overduePayables)} vadesi geçmiş
              </span>
            ) : (
              <span className="text-slate-500">Planlanan vadede</span>
            )}
          </div>
        </div>

        {/* KART 4: Çek & Portföy / İşletme Sağlığı */}
        <div
          onClick={() => onSelectTab("accounts")}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs cursor-pointer overflow-hidden dashboard-module-card"
          style={{ borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portföydeki Çek / Senet</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center module-icon-container transition-transform">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
            {formatCurrency(metrics.portfolioChequesAmount)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Verilen Borç Çeki:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {formatCurrency(metrics.issuedChequesPending)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. İKİNCİ KATMAN: GRAFİKLER & AKILLI ANALİTİK (Area Chart & Fatura Dağılımı) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: 6-12 Aylık Gelir vs Gider Trendi (Area Chart) */}
        <div
          className="lg:col-span-2 relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs flex flex-col justify-between haze-module-entrance-bg"
          style={{ borderColor: theme.cardBorder }}
        >
          <GeometricHoneycombBackground id="cashflow-trend-geom" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Nakit Akışı & Trend Analizi
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aylık fiili gelir, tahsilat, masraf ve net operasyonel kâr seyri
                </p>
              </div>
            </div>

            {/* Native High-Performance SVG Area Chart */}
            <div className="h-56 sm:h-72 w-full flex flex-col justify-between select-none">
            {(() => {
              const maxVal = Math.max(
                1,
                ...cashFlowChartData.map((d) => Math.max(d.gelir, d.gider))
              );
              const svgW = 600;
              const svgH = 200;
              const padX = 40;
              const padY = 20;
              const chartW = svgW - padX * 2;
              const chartH = svgH - padY * 2;
              const stepX = cashFlowChartData.length > 1 ? chartW / (cashFlowChartData.length - 1) : chartW;

              const pointsIncome = cashFlowChartData.map((d, i) => {
                const x = padX + i * stepX;
                const y = padY + chartH - (d.gelir / maxVal) * chartH;
                return { x, y, val: d.gelir, label: d.label };
              });

              const pointsExpense = cashFlowChartData.map((d, i) => {
                const x = padX + i * stepX;
                const y = padY + chartH - (d.gider / maxVal) * chartH;
                return { x, y, val: d.gider, label: d.label };
              });

              const pathIncome = pointsIncome.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
              const areaIncome = `${pathIncome} L ${pointsIncome[pointsIncome.length - 1]?.x || 0} ${padY + chartH} L ${pointsIncome[0]?.x || 0} ${padY + chartH} Z`;

              const pathExpense = pointsExpense.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
              const areaExpense = `${pathExpense} L ${pointsExpense[pointsExpense.length - 1]?.x || 0} ${padY + chartH} L ${pointsExpense[0]?.x || 0} ${padY + chartH} Z`;

              return (
                <div className="relative w-full h-full">
                  <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="svgIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="svgExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                      const y = padY + chartH * (1 - r);
                      return (
                        <g key={idx}>
                          <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.6" />
                          <text x={padX - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" className="font-mono">
                            {r === 0 ? "0" : (maxVal * r >= 1000 ? `${((maxVal * r) / 1000).toFixed(0)}k` : Math.round(maxVal * r))}
                          </text>
                        </g>
                      );
                    })}

                    {/* Income Area & Line */}
                    <path d={areaIncome} fill="url(#svgIncomeGrad)" />
                    <path d={pathIncome} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Expense Area & Line */}
                    <path d={areaExpense} fill="url(#svgExpenseGrad)" />
                    <path d={pathExpense} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Points & Hover info */}
                    {pointsIncome.map((p, i) => (
                      <circle key={`inc-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    ))}
                    {pointsExpense.map((p, i) => (
                      <circle key={`exp-${i}`} cx={p.x} cy={p.y} r="3" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                    ))}
                  </svg>

                  {/* Bottom Labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-6 text-[11px] font-medium text-slate-500 pointer-events-none">
                    {cashFlowChartData.map((d, i) => (
                      <span key={i} className="text-center">{d.label}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                Toplam Gelir / Tahsilat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-500 inline-block"></span>
                Toplam Gider / Masraf
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* SAĞ: Hızlı Durum Kartı & Fatura Dağılımı */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs flex flex-col justify-between space-y-4 haze-module-entrance-bg"
          style={{ borderColor: theme.cardBorder }}
        >
          <GeometricHoneycombBackground id="operations-summary-geom" />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0f6bae]" />
                  İşletme Operasyon Özeti
                </h3>
                <span className="text-[11px] font-semibold text-[#0f6bae] bg-[#eaedff] dark:bg-slate-800 border border-[#c6cdff] dark:border-slate-700 px-2 py-0.5 rounded-md shadow-2xs">
                  Canlı
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Faturalama hacmi ve kritik operasyonel göstergeler
              </p>
            </div>

            {/* Native SVG Fatura Hacmi Donut */}
            <div className="h-44 w-full flex items-center justify-center relative">
              {(() => {
                const totalInv = invoiceBreakdown.reduce((sum, b) => sum + b.value, 0) || 1;
                const salesVal = invoiceBreakdown[0]?.value || 0;
                const salesPct = Math.round((salesVal / totalInv) * 100);
                const circumference = 2 * Math.PI * 46;
                const strokeDashoffset = circumference - (salesPct / 100) * circumference;

                return (
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
                      {/* Background track (Alış / Gider rengi) */}
                      <circle
                        cx="55"
                        cy="55"
                        r="46"
                        stroke="#f43f5e"
                        strokeWidth="12"
                        fill="transparent"
                        className="opacity-90"
                      />
                      {/* Foreground arc (Satış Faturası rengi) */}
                      <circle
                        cx="55"
                        cy="55"
                        r="46"
                        stroke="#0ea5e9"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(totalInv === 1 ? 0 : totalInv)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Donut Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></span>
                <span>Satış: <strong className="text-slate-900 dark:text-white">{formatCurrency(invoiceBreakdown[0]?.value || 0)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span>
                <span>Alış: <strong className="text-slate-900 dark:text-white">{formatCurrency(invoiceBreakdown[1]?.value || 0)}</strong></span>
              </div>
            </div>

            {/* Hızlı İstatistik Rozetleri */}
            <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
              <div
                onClick={() => onSelectTab("products")}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/75 dark:bg-slate-800/75 border border-slate-200/60 dark:border-slate-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all backdrop-blur-xs shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Kritik Stok Uyarısı</span>
                    <p className="text-[11px] text-slate-400">Tükenmek üzere olan ürünler</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  {metrics.lowStockCount} Ürün
                </span>
              </div>

              <div
                onClick={() => onSelectTab("orders")}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/75 dark:bg-slate-800/75 border border-slate-200/60 dark:border-slate-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all backdrop-blur-xs shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Açık Siparişler</span>
                    <p className="text-[11px] text-slate-400">Bekleyen & onaylanan sipariş</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  {metrics.pendingOrdersCount} Sipariş
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ÜÇÜNCÜ KATMAN: VADESİ YAKLAŞANLAR / GEÇENLER & SON İŞLEMLER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SOL: Vadesi Yaklaşan / Kritik Ödeme ve Tahsilatlar */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs haze-module-entrance-bg"
          style={{ borderColor: theme.cardBorder }}
        >
          <GeometricHoneycombBackground id="upcoming-dues-geom" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Vadesi Yaklaşan & Geciken Ödemeler
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Önümüzdeki günlerde tahsil edilecek ya da ödenecek kritik evraklar
                </p>
              </div>
              <button
                onClick={() => onSelectTab("invoices")}
                className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                Tüm Vadeler <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingActionItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                  <p className="text-xs font-medium">Yakın tarihte vadesi geçen veya bekleyen acil ödeme bulunmuyor.</p>
                </div>
              ) : (
                upcomingActionItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type.includes("cheque")) onSelectTab("accounts");
                      else onSelectTab("invoices");
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 backdrop-blur-xs shadow-2xs ${
                      item.isOverdue
                        ? "border-rose-200/80 bg-rose-50/70 hover:bg-rose-50/90 dark:bg-rose-950/30"
                        : "border-slate-200/60 bg-white/80 hover:bg-slate-50 dark:bg-slate-800/75 dark:border-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                          item.type === "sales_invoice"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.type === "purchase_invoice"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {item.type === "sales_invoice" ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : item.type === "purchase_invoice" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800/50">
                      <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {item.isOverdue ? (
                          <span className="font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-200 px-1.5 py-0.5 rounded">
                            {Math.abs(item.daysDiff)} gün gecikti
                          </span>
                        ) : item.daysDiff === 0 ? (
                          <span className="font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-200 px-1.5 py-0.5 rounded">
                            Bugün vadesi
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            {item.daysDiff} gün sonra ({formatDate(item.dueDate)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SAĞ: Son Finansal İşlemler (Kasa / Banka Hareketleri) */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs haze-module-entrance-bg"
          style={{ borderColor: theme.cardBorder }}
        >
          <GeometricHoneycombBackground id="recent-transactions-geom" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#0f6bae]" />
                  Son Finansal Hareketler
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kasa, banka ve cari hesaplara işlenen en son kayıtlar
                </p>
              </div>
              <button
                onClick={() => onSelectTab("transactions")}
                className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                Tüm Fişler <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">Henüz kayıtlı bir finansal işlem bulunmuyor.</p>
                </div>
              ) : (
                recentTransactions.map((tx) => {
                  const isIncome = tx.type === "income" || tx.type === "collection";
                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTab("transactions")}
                      className="p-3 rounded-xl border border-slate-200/60 bg-white/80 hover:bg-slate-50 dark:bg-slate-800/75 dark:border-slate-700/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 backdrop-blur-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                            isIncome
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.description || tx.contactName || "İşlem"}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                            <span>{tx.accountName || "Kasa"}</span>
                            <span>•</span>
                            <span>{formatDate(tx.date)}</span>
                            {tx.category && (
                              <>
                                <span>•</span>
                                <span className="bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                                  {tx.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 dark:border-slate-800/50">
                        <div
                          className={`text-xs font-black font-mono ${
                            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(tx.amount, tx.currency)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isIncome ? "Tahsilat / Giriş" : "Tediye / Çıkış"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. DÖRDÜNCÜ KATMAN: KASA VE BANKA DETAY HESAPLARI & TCMB DÖVİZ KURLARI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: Kasa & Banka Kartları */}
        <div
          className="lg:col-span-1 relative overflow-hidden rounded-2xl p-4 sm:p-6 border shadow-2xs flex flex-col justify-between haze-module-entrance-bg"
          style={{ borderColor: theme.cardBorder }}
        >
          <GeometricHoneycombBackground id="accounts-balances-geom" />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0f6bae]" />
                  Kasa & Banka Bakiyeleri
                </h3>
                <div className="flex items-center gap-1 text-[11px] font-semibold bg-white/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xs shrink-0 self-start sm:self-auto shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveAccountType("all")}
                    className={`px-2 py-0.5 rounded-md transition-all ${activeAccountType === "all" ? "bg-white dark:bg-slate-700 font-bold shadow-2xs text-slate-900 dark:text-white" : "text-slate-500"}`}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAccountType("cash")}
                    className={`px-2 py-0.5 rounded-md transition-all ${activeAccountType === "cash" ? "bg-white dark:bg-slate-700 font-bold shadow-2xs text-slate-900 dark:text-white" : "text-slate-500"}`}
                  >
                    Kasa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAccountType("bank")}
                    className={`px-2 py-0.5 rounded-md transition-all ${activeAccountType === "bank" ? "bg-white dark:bg-slate-700 font-bold shadow-2xs text-slate-900 dark:text-white" : "text-slate-500"}`}
                  >
                    Banka
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Kayıtlı aktif hesapların güncel bakiyeleri
              </p>

              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {filteredAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => onSelectTab("accounts")}
                    className="p-3 rounded-xl border border-slate-200/60 hover:border-blue-200 bg-white/80 hover:bg-blue-50/50 dark:bg-slate-800/75 dark:border-slate-700/60 backdrop-blur-xs transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                        {acc.type === "cash" ? <Wallet className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {acc.bankName ? `${acc.bankName} • ` : ""}{acc.currency || "TRY"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs font-black text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(acc.balance, acc.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
              <button
                onClick={() => onSelectTab("accounts")}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-[#0f6bae] bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Hesapları Yönet & Virman Yap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ: TCMB Günlük Döviz Kurları (Kompakt ve Detaylı Tablo) */}
        <div className="lg:col-span-2">
          <ExchangeRatesWidget compact={false} allowToggle={true} />
        </div>
      </div>

      {/* 6. BEŞİNCİ KATMAN: SON ETKİNLİKLER & İŞLEM GÜNLÜĞÜ (RECENT ACTIVITY PANEL) */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border shadow-2xs haze-module-entrance-bg"
        style={{ borderColor: theme.cardBorder }}
      >
        <GeometricHoneycombBackground id="recent-activity-panel-geom" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0f6bae]/10 text-[#0f6bae] dark:bg-[#0f6bae]/20 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Son Etkinlikler & İşlem Geçmişi
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0f6bae] dark:text-blue-300">
                      Son 10 İşlem
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sistemde gerçekleştirilen son fatura kesimleri, tahsilatlar, ödemeler ve cari kayıtlarının kronolojik akışı
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onSelectTab("transactions")}
                className="text-xs font-bold text-[#0f6bae] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Tüm Finansal Hareketler <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">Henüz kayıtlı bir etkinlik veya işlem kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentActivities.map((act) => {
                let iconEl = <FileText className="w-4 h-4 text-blue-600" />;
                let iconBg = "bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
                let badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";

                if (act.type === "collection") {
                  iconEl = <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
                  iconBg = "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
                  badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
                } else if (act.type === "payment") {
                  iconEl = <ArrowUpRight className="w-4 h-4 text-rose-600" />;
                  iconBg = "bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300";
                  badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800";
                } else if (act.type === "contact") {
                  iconEl = <Users className="w-4 h-4 text-indigo-600" />;
                  iconBg = "bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300";
                  badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800";
                } else if (act.type === "order") {
                  iconEl = <ShoppingCart className="w-4 h-4 text-amber-600" />;
                  iconBg = "bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300";
                  badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
                }

                return (
                  <div
                    key={act.id}
                    onClick={() => onSelectTab(act.targetTab)}
                    className="p-3.5 rounded-xl border border-slate-200/60 bg-white/80 hover:bg-slate-50 dark:bg-slate-800/75 dark:border-slate-700/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs backdrop-blur-xs group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconBg} transition-transform group-hover:scale-105`}>
                        {iconEl}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {act.title}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                            {act.badgeText}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                          <span className="truncate">{act.description}</span>
                          <span>•</span>
                          <span className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            {act.timeLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {act.amount !== undefined && (
                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-black font-mono ${
                            act.type === "collection"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : act.type === "payment"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {act.type === "collection" ? "+" : act.type === "payment" ? "-" : ""}
                          {formatCurrency(act.amount, act.currency)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Tutar
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
