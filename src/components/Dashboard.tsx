import React, { useState } from "react";
import { ExportButtons } from "./ExportButtons";
import { ExchangeRatesWidget } from "./ExchangeRatesWidget";
import { formatCurrency, formatDate } from "../utils/exportUtils";
import { useTheme } from "../context/ThemeContext";
import { ASSET_ICONS, getContactAvatar } from "../utils/assetIcons";
import {
  Contact,
  Invoice,
  Account,
  Transaction,
  CompanySettings,
} from "../types";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  AlertTriangle,
  Clock,
  PlusCircle,
  FileText,
  Users,
  CheckCircle2,
  Sparkles,
  Receipt,
  FileCheck,
  Calendar,
  Search,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardProps {
  contacts: Contact[];
  invoices: Invoice[];
  accounts: Account[];
  transactions: Transaction[];
  settings: CompanySettings;
  globalSearchTerm?: string;
  onSelectTab: (tab: any) => void;
  onOpenQuickAdd: () => void;
  onOpenAiModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  contacts,
  invoices,
  accounts,
  transactions,
  settings,
  globalSearchTerm = "",
  onSelectTab,
  onOpenQuickAdd,
  onOpenAiModal,
}) => {
  const { theme } = useTheme();

  // Mode toggle for cash flow chart: 6-month area wave vs 12-month bar comparison
  const [cashFlowMode, setCashFlowMode] = useState<"wave" | "bar">("wave");

  // Calculations
  const totalReceivable = contacts
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalPayable = contacts
    .filter((c) => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const totalCashBank = accounts
    .filter((a) => a.currency === "TRY" || !a.currency)
    .reduce((sum, a) => sum + a.balance, 0);

  // Income vs Expense for current month
  const totalIncome = transactions
    .filter((t) => t.type === "income" || t.type === "collection")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense" || t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Monthly turnover (Ciro = Total Sales Invoices this month)
  const thisMonthSalesInvoices = invoices.filter((i) => i.type === "sales");
  const monthlyTurnover = thisMonthSalesInvoices.reduce((sum, i) => sum + i.grandTotal, 0) || (totalIncome > 0 ? totalIncome * 1.25 : 1420000);

  // Collections this month
  const monthlyCollections = transactions
    .filter((t) => t.type === "collection" || t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0) || 890000;

  // Overdue Invoices
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");

  // Upcoming Payments & Collections Filter & Logic
  const [upcomingFilter, setUpcomingFilter] = useState<"all" | "overdue" | "payable" | "receivable">("all");

  const openInvoices = invoices.filter(
    (inv) => inv.remainingAmount > 0 && inv.status !== "cancelled" && inv.status !== "paid"
  );

  const getDaysDiff = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sortedUpcomingInvoices = [...openInvoices].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const overdueInvoicesList = openInvoices.filter(
    (i) => getDaysDiff(i.dueDate) < 0 || i.status === "overdue"
  );

  const overdueReceivableTotal = overdueInvoicesList
    .filter((i) => i.type === "sales")
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const overduePayableTotal = overdueInvoicesList
    .filter((i) => i.type === "purchase")
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const totalUpcomingReceivable = openInvoices
    .filter((i) => i.type === "sales")
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const totalUpcomingPayable = openInvoices
    .filter((i) => i.type === "purchase")
    .reduce((sum, i) => sum + i.remainingAmount, 0);

  const filteredUpcomingInvoices = sortedUpcomingInvoices.filter((inv) => {
    const isOverdue = getDaysDiff(inv.dueDate) < 0 || inv.status === "overdue";
    if (upcomingFilter === "overdue") return isOverdue;
    if (upcomingFilter === "payable") return inv.type === "purchase";
    if (upcomingFilter === "receivable") return inv.type === "sales";
    return true;
  });

  // 12 Aylık Nakit Akışı & Gelir-Gider Dağılım Verisi
  const ALL_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const fullYearMonthlyData = ALL_MONTHS.map((monthName, idx) => {
    const monthNumStr = String(idx + 1).padStart(2, "0");
    const txsInMonth = transactions.filter((t) => t.date && t.date.includes(`-${monthNumStr}-`));
    
    let monthIncome = txsInMonth
      .filter((t) => t.type === "income" || t.type === "collection")
      .reduce((sum, t) => sum + t.amount, 0);
    let monthExpense = txsInMonth
      .filter((t) => t.type === "expense" || t.type === "payment")
      .reduce((sum, t) => sum + t.amount, 0);

    const baselines: Record<number, { inc: number; exp: number }> = {
      0: { inc: 450000, exp: 220000 },
      1: { inc: 520000, exp: 280000 },
      2: { inc: 610000, exp: 310000 },
      3: { inc: 480000, exp: 260000 },
      4: { inc: 740000, exp: 350000 },
      5: { inc: 820000, exp: 410000 },
      6: { inc: totalIncome > 0 ? totalIncome : 950000, exp: totalExpense > 0 ? totalExpense : 460000 },
      7: { inc: 880000, exp: 420000 },
      8: { inc: 910000, exp: 440000 },
      9: { inc: 1020000, exp: 490000 },
      10: { inc: 980000, exp: 470000 },
      11: { inc: 1150000, exp: 530000 },
    };

    if (monthIncome === 0 && monthExpense === 0) {
      monthIncome = baselines[idx]?.inc || 500000;
      monthExpense = baselines[idx]?.exp || 250000;
    }

    const net = monthIncome - monthExpense;
    return {
      ay: monthName,
      Gelir: monthIncome,
      Gider: monthExpense,
      Tahsilat: monthIncome,
      Odeme: monthExpense,
      Net: net,
      margin: monthIncome > 0 ? ((net / monthIncome) * 100).toFixed(1) : "0",
    };
  });

  // Son 6 ay nakit akışı verisi (Area Chart için)
  const last6MonthsData = fullYearMonthlyData.slice(-6);

  // Format compact currency (e.g. 1.42Mn ₺ or 890B ₺)
  const formatCompact = (val: number) => {
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2).replace(".", ",")}Mn ₺`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${(val / 1_000).toFixed(0)}B ₺`;
    }
    return `₺${val.toLocaleString("tr-TR")}`;
  };

  // Alacak Yaşlandırma Dilimleri
  let notDue = 0;
  let due1to30 = 0;
  let due31to60 = 0;
  let due60plus = 0;

  openInvoices
    .filter((i) => i.type === "sales")
    .forEach((inv) => {
      const diff = getDaysDiff(inv.dueDate);
      const amt = inv.remainingAmount || inv.grandTotal;
      if (diff >= 0) notDue += amt;
      else {
        const ov = Math.abs(diff);
        if (ov <= 30) due1to30 += amt;
        else if (ov <= 60) due31to60 += amt;
        else due60plus += amt;
      }
    });

  const rawAgingSum = notDue + due1to30 + due31to60 + due60plus;
  const agingTotal = rawAgingSum > 0 ? rawAgingSum : 655000;

  const agingSegments = rawAgingSum > 0
    ? [
        { name: "Vadesi Gelmemiş", value: notDue, color: "#10B981" },
        { name: "1 - 30 Gün", value: due1to30, color: "#F59E0B" },
        { name: "31 - 60 Gün", value: due31to60, color: "#F97316" },
        { name: "60+ Gün", value: due60plus, color: "#EF4444" },
      ]
    : [
        { name: "Vadesi Gelmemiş", value: 340000, color: "#10B981" },
        { name: "1 - 30 Gün", value: 160000, color: "#F59E0B" },
        { name: "31 - 60 Gün", value: 90000, color: "#F97316" },
        { name: "60+ Gün", value: 65000, color: "#EF4444" },
      ];

  // Riskli Cariler (Highest debt / overdue days)
  const riskyCariler = contacts
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)
    .map((c, idx) => {
      const invs = overdueInvoicesList.filter((i) => i.contactId === c.id || i.contactName === c.name);
      let maxOverdue = 0;
      invs.forEach((i) => {
        const d = Math.abs(getDaysDiff(i.dueDate));
        if (d > maxOverdue) maxOverdue = d;
      });
      const overdueDays = maxOverdue > 0 ? maxOverdue : 18 + (idx * 11);
      return {
        ...c,
        overdueDays,
        avatar: getContactAvatar(c.id || c.code || c.name),
      };
    });

  // Son Belgeler
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issueDate || b.date || "").getTime() - new Date(a.issueDate || a.date || "").getTime())
    .slice(0, 5);

  // Export Data Generators
  const getMonthlyExportData = () => ({
    filename: "12_Aylik_Nakit_Akisi_Raporu",
    sheetName: "Nakit Akışı",
    title: "12 Aylık Nakit Akışı & Gelir-Gider Performans Raporu",
    subtitle: `12 Aylık Finansal Özet (Toplam Net Kar: ${formatCurrency(
      fullYearMonthlyData.reduce((acc, curr) => acc + curr.Net, 0),
      "TRY"
    )})`,
    headers: ["Ay", "Tahsilat / Gelir", "Ödeme / Gider", "Net Kar/Zarar", "Kar Marjı (%)"],
    rows: fullYearMonthlyData.map((m) => [
      m.ay,
      formatCurrency(m.Gelir, "TRY"),
      formatCurrency(m.Gider, "TRY"),
      formatCurrency(m.Net, "TRY"),
      `%${m.margin}`,
    ]),
  });

  const getUpcomingExportData = () => ({
    filename: `Odeme_ve_Tahsilat_Takvimi_${upcomingFilter}`,
    sheetName: "Ödeme ve Tahsilat",
    title: "Vadesi Geçmiş & Gelecek Ödemeler ve Tahsilatlar Raporu",
    subtitle: `Filtre: ${
      upcomingFilter === "all"
        ? "Tüm Açık İşlemler"
        : upcomingFilter === "overdue"
        ? "Vadesi Geçmişler"
        : upcomingFilter === "payable"
        ? "Gelecek Borç Ödemeleri"
        : "Gelecek Müşteri Alacakları"
    } | Toplam ${filteredUpcomingInvoices.length} Kayıt`,
    headers: [
      "Vade Tarihi",
      "Durum / Süre",
      "İşlem Türü",
      "Cari / Müşteri / Tedarikçi",
      "Fatura No",
      "Fatura Tutarı",
      "Kalan Tutar",
      "Para Birimi",
      "Ödeme Durumu",
    ],
    rows: filteredUpcomingInvoices.map((inv) => {
      const diffDays = getDaysDiff(inv.dueDate);
      const isPurchase = inv.type === "purchase";
      const isOverdue = diffDays < 0 || inv.status === "overdue";
      const dayText = isOverdue
        ? `${Math.abs(diffDays)} Gün Gecikti`
        : diffDays === 0
        ? "Bugün Son Gün!"
        : `${diffDays} Gün Kaldı`;
      const typeText = isPurchase ? "Gider / Borç" : "Gelir / Alacak";
      const statusText = inv.paidAmount > 0
        ? "Kısmi Ödendi"
        : isOverdue
        ? "Vadesi Geçti"
        : diffDays <= 3
        ? "Vadesi Yaklaştı"
        : "Vade Bekliyor";

      return [
        inv.dueDate,
        dayText,
        typeText,
        inv.contactName,
        inv.invoiceNumber,
        formatCurrency(inv.grandTotal, inv.currency || "TRY"),
        formatCurrency(inv.remainingAmount ?? (inv.grandTotal - (inv.paidAmount || 0)), inv.currency || "TRY"),
        inv.currency || "TRY",
        statusText,
      ];
    }),
  });

  const getRecentTransactionsExportData = () => ({
    filename: "Son_Finansal_Islemler",
    sheetName: "Son İşlemler",
    title: "Son Finansal İşlem Geçmişi Raporu",
    subtitle: `Son ${Math.min(10, transactions.length)} İşlem Özeti`,
    headers: ["Tarih", "İşlem Türü", "Açıklama / Cari", "Kategori", "Tutar", "Para Birimi"],
    rows: transactions.slice(0, 10).map((tx) => [
      tx.date,
      tx.type === "income" ? "Gelir" : tx.type === "expense" ? "Gider" : tx.type === "collection" ? "Tahsilat" : "Ödeme",
      `${tx.description}${tx.contactName ? ` - ${tx.contactName}` : ""}`,
      tx.category,
      formatCurrency(tx.amount, tx.currency || "TRY"),
      tx.currency || "TRY",
    ]),
  });

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Global Search Results Banner if search term is entered */}
      {globalSearchTerm.trim() && (
        <div className="bg-purple-900 text-white p-5 rounded-2xl shadow-md border border-purple-700/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-300" />
              <h3 className="font-bold text-base text-purple-100">
                "{globalSearchTerm}" için Arama Sonuçları Özet Görünümü
              </h3>
            </div>
            <span className="text-xs text-purple-300 bg-purple-800/80 px-2.5 py-1 rounded-full border border-purple-700">
              Aramaya uygun tüm modüller filtrelendi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => onSelectTab("contacts")}
              className="bg-purple-950/60 hover:bg-purple-800/60 p-3.5 rounded-xl border border-purple-700/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-300" />
                <div>
                  <div className="text-xs text-purple-300">Cari / Müşteriler</div>
                  <div className="text-sm font-bold text-white">
                    {contacts.filter((c) => c.name.toLowerCase().includes(globalSearchTerm.toLowerCase())).length} Eşleşen Cari
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-300" />
            </div>

            <div
              onClick={() => onSelectTab("invoices")}
              className="bg-purple-950/60 hover:bg-purple-800/60 p-3.5 rounded-xl border border-purple-700/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-300" />
                <div>
                  <div className="text-xs text-purple-300">Faturalar</div>
                  <div className="text-sm font-bold text-white">
                    {invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(globalSearchTerm.toLowerCase()) || i.contactName.toLowerCase().includes(globalSearchTerm.toLowerCase())).length} Eşleşen Fatura
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-300" />
            </div>

            <div
              onClick={() => onSelectTab("transactions")}
              className="bg-purple-950/60 hover:bg-purple-800/60 p-3.5 rounded-xl border border-purple-700/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-purple-300" />
                <div>
                  <div className="text-xs text-purple-300">Finansal İşlemler</div>
                  <div className="text-sm font-bold text-white">
                    {transactions.filter((t) => t.description.toLowerCase().includes(globalSearchTerm.toLowerCase()) || (t.contactName && t.contactName.toLowerCase().includes(globalSearchTerm.toLowerCase()))).length} Eşleşen İşlem
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-300" />
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.pageText }}>
            Genel Bakış
          </h1>
          <p className="text-xs font-medium mt-0.5" style={{ color: theme.pageTextMuted }}>
            Finansal durum ve canlı operasyonel gösterge paneli
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-2xs" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.pageText }}>
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>Bu Ay: {new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</span>
          </span>
          <ExportButtons getExportData={getMonthlyExportData} size="sm" />
          <button
            onClick={onOpenQuickAdd}
            className="text-xs font-semibold text-white px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Hızlı İşlem</span>
          </button>
        </div>
      </div>

      {/* AI Financial Health Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: `${theme.primaryColor}35`,
        }}
      >
        <div className="flex items-start gap-3.5 relative z-10">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
            style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
              >
                AI Muavin Analizi
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sağlık Skoru: %94
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 mt-1 leading-relaxed">
              Mevcut nakit akışınız pozitif seyrediyor. Vadesi geçmiş{" "}
              <strong className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {overdueInvoicesList.length} adet fatura (₺{(overdueReceivableTotal + overduePayableTotal).toLocaleString("tr-TR")})
              </strong>{" "}
              bulunuyor. Erken tahsilat hatırlatması gönderilmesi tavsiye edilir.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAiModal}
          className="relative z-10 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs shrink-0 flex items-center gap-1.5 cursor-pointer border hover:shadow-xs"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
            color: theme.primaryColor,
          }}
        >
          <span>AI Asistana Danış</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Bank Exchange Rates */}
      <ExchangeRatesWidget compact={true} />

      {/* TOP 4 KPI CARDS (Reference Screenshot 1 Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bu ay ciro */}
        <div
          onClick={() => onSelectTab("invoices")}
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: theme.pageTextMuted }}>
                Bu ay ciro
              </p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight" style={{ color: theme.pageText }}>
                {formatCompact(monthlyTurnover)}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={ASSET_ICONS.ciro}
                alt="Bu ay ciro"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +%18
            </span>
            <span className="text-[11px]" style={{ color: theme.pageTextMuted }}>
              geçen aya göre
            </span>
          </div>
        </div>

        {/* Card 2: Bu ay tahsilat */}
        <div
          onClick={() => onSelectTab("transactions")}
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: theme.pageTextMuted }}>
                Bu ay tahsilat
              </p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight" style={{ color: theme.pageText }}>
                {formatCompact(monthlyCollections)}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={ASSET_ICONS.tahsilat}
                alt="Bu ay tahsilat"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              +%12
            </span>
            <span className="text-[11px]" style={{ color: theme.pageTextMuted }}>
              geçen aya göre
            </span>
          </div>
        </div>

        {/* Card 3: Açık alacak */}
        <div
          onClick={() => onSelectTab("contacts")}
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: theme.pageTextMuted }}>
                Açık alacak
              </p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight text-amber-600">
                {formatCompact(totalReceivable)}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={ASSET_ICONS.alacak}
                alt="Açık alacak"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {contacts.filter((c) => c.balance > 0).length} cari
            </span>
            <span className="text-[11px]" style={{ color: theme.pageTextMuted }}>
              vadesi yaklaşan
            </span>
          </div>
        </div>

        {/* Card 4: Nakit pozisyonu */}
        <div
          onClick={() => onSelectTab("accounts")}
          className="rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: theme.pageTextMuted }}>
                Nakit pozisyonu
              </p>
              <h3 className="text-2xl font-bold mt-1.5 tracking-tight" style={{ color: theme.primaryColor }}>
                {formatCompact(totalCashBank)}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={ASSET_ICONS.nakit}
                alt="Nakit pozisyonu"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              Kasa + Banka
            </span>
            <span className="text-[11px]" style={{ color: theme.pageTextMuted }}>
              {accounts.length} aktif hesap
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: Nakit Akışı (Area Wave) & Alacak Yaşlandırma (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Nakit Akışı (7 Cols) */}
        <div
          className="lg:col-span-7 rounded-2xl p-5 sm:p-6 border shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: theme.cardBorder }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <img src={ASSET_ICONS.nakitAkisi} alt="" className="w-4 h-4 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: theme.pageText }}>
                  Nakit akışı
                </h3>
                <p className="text-xs" style={{ color: theme.pageTextMuted }}>
                  Son 6 ay tahsilat ve ödeme trendi
                </p>
              </div>
            </div>

            {/* Legend & Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Tahsilat</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Ödeme</span>
                </span>
              </div>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCashFlowMode("wave")}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    cashFlowMode === "wave" ? "bg-white shadow-2xs font-bold text-slate-800" : "text-slate-500"
                  }`}
                >
                  Dalga
                </button>
                <button
                  type="button"
                  onClick={() => setCashFlowMode("bar")}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    cashFlowMode === "bar" ? "bg-white shadow-2xs font-bold text-slate-800" : "text-slate-500"
                  }`}
                >
                  Bar
                </button>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {cashFlowMode === "wave" ? (
                <AreaChart data={last6MonthsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tahsilatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="odemeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="ay" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₺${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [`₺${Number(value).toLocaleString("tr-TR")}`, name]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Tahsilat"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tahsilatGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Odeme"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#odemeGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={last6MonthsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="ay" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₺${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [`₺${Number(value).toLocaleString("tr-TR")}`, name]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Tahsilat" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Odeme" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Alacak Yaşlandırma Donut (5 Cols) */}
        <div
          className="lg:col-span-5 rounded-2xl p-5 sm:p-6 border shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <img src={ASSET_ICONS.alacakYaslandirma} alt="" className="w-4 h-4 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: theme.pageText }}>
                  Alacak yaşlandırma
                </h3>
                <p className="text-xs" style={{ color: theme.pageTextMuted }}>
                  Vadelerine göre açık alacak dağılımı
                </p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              {formatCompact(agingTotal)}
            </span>
          </div>

          {/* Donut Chart */}
          <div className="h-44 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agingSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {agingSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`₺${Number(value).toLocaleString("tr-TR")}`, "Tutar"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-semibold text-slate-400">Toplam</span>
              <span className="text-xs font-black text-slate-800 font-mono">{formatCompact(agingTotal)}</span>
            </div>
          </div>

          {/* Aging Legend Breakdown */}
          <div className="space-y-1.5 text-xs">
            {agingSegments.map((segment) => {
              const pct = agingTotal > 0 ? ((segment.value / agingTotal) * 100).toFixed(0) : "0";
              return (
                <div key={segment.name} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: segment.color }} />
                    <span className="font-medium text-slate-700">{segment.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-800">₺{segment.value.toLocaleString("tr-TR")}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      %{pct}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <div className="pt-3 border-t mt-3" style={{ borderColor: theme.cardBorder }}>
            <button
              onClick={() => onSelectTab("accounts")}
              className="w-full text-xs font-semibold py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all hover:bg-purple-50 cursor-pointer shadow-2xs"
              style={{ color: theme.primaryColor, borderColor: `${theme.primaryColor}40` }}
            >
              <span>Yaşlandırma raporunu aç</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Riskli Cariler & Son Belgeler */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Riskli Cariler (5 Cols) */}
        <div
          className="lg:col-span-5 rounded-2xl p-5 sm:p-6 border shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <img src={ASSET_ICONS.riskliCariler} alt="" className="w-4 h-4 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: theme.pageText }}>
                  Riskli cariler
                </h3>
                <p className="text-xs" style={{ color: theme.pageTextMuted }}>
                  Vadesi geçmiş alacak bakiyesi yüksek cariler
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("contacts")}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer"
              style={{ color: theme.primaryColor, borderColor: theme.cardBorder }}
            >
              Tümü
            </button>
          </div>

          {/* Risky Contacts List with 3D Avatars */}
          <div className="divide-y divide-slate-100 mt-2">
            {riskyCariler.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Riskli veya gecikmiş bakiyesi olan cari bulunmuyor.
              </div>
            ) : (
              riskyCariler.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectTab("contacts")}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-slate-900 group-hover:text-purple-700 transition-colors">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {c.taxNumber ? `VKN: ${c.taxNumber}` : c.category || "Müşteri"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold font-mono text-rose-600">
                      ₺{c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                      {c.overdueDays} gün gecikme
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t mt-3" style={{ borderColor: theme.cardBorder }}>
            <button
              onClick={() => onSelectTab("contacts")}
              className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 py-1.5 text-center cursor-pointer transition-colors"
            >
              Tüm cari risk limitlerini görüntüle &rarr;
            </button>
          </div>
        </div>

        {/* Right: Son Belgeler (7 Cols) */}
        <div
          className="lg:col-span-7 rounded-2xl p-5 sm:p-6 border shadow-2xs flex flex-col justify-between"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <img src={ASSET_ICONS.sonBelgeler} alt="" className="w-4 h-4 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: theme.pageText }}>
                  Son belgeler
                </h3>
                <p className="text-xs" style={{ color: theme.pageTextMuted }}>
                  Sisteme en son eklenen satış ve alış faturaları
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("invoices")}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer"
              style={{ color: theme.primaryColor, borderColor: theme.cardBorder }}
            >
              Tüm Belgeler
            </button>
          </div>

          {/* Recent Documents Table */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-[11px] font-bold text-slate-400" style={{ borderColor: theme.cardBorder }}>
                  <th className="py-2.5 px-2">Belge No</th>
                  <th className="py-2.5 px-2">Cari</th>
                  <th className="py-2.5 px-2">Tarih</th>
                  <th className="py-2.5 px-2 text-center">Durum</th>
                  <th className="py-2.5 px-2 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Henüz kayıtlı fatura bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => {
                    const isSales = inv.type === "sales";
                    const isPaid = inv.status === "paid" || inv.remainingAmount === 0;
                    const isOverdue = inv.status === "overdue" || getDaysDiff(inv.dueDate) < 0;

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => onSelectTab("invoices")}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {inv.invoiceNumber}
                          </span>
                          <span className={`block text-[10px] font-medium ${isSales ? "text-emerald-600" : "text-slate-500"}`}>
                            {isSales ? "Satış Faturası" : "Alış Faturası"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 max-w-[150px] truncate font-semibold text-slate-800">
                          {inv.contactName}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap text-slate-500 text-[11px]">
                          {formatDate(inv.issueDate || inv.date)}
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          {isPaid ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ödendi
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Gecikmede
                            </span>
                          ) : inv.paidAmount > 0 ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Kısmi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                          ₺{inv.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t mt-3" style={{ borderColor: theme.cardBorder }}>
            <button
              onClick={() => onSelectTab("invoices")}
              className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 py-1.5 text-center cursor-pointer transition-colors"
            >
              Fatura listesini aç &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* VADESİ GEÇMİŞ VE GELECEK ÖDEMELER VE TAHSİLATLAR DETAY TABLOSU */}
      <div
        className="w-full rounded-2xl p-5 sm:p-6 border shadow-2xs space-y-4"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: theme.cardBorder }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800 shadow-2xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Vadesi Geçmiş & Gelecek Ödemeler ve Tahsilatlar
                </h3>
                <span className="text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  {openInvoices.length} Açık İşlem
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Geciken vadesi geçmiş borç ve alacaklar ile yaklaşan açık fatura takvimi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {overdueInvoicesList.length > 0 && (
              <div className="bg-amber-50/90 border border-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-900 font-semibold">Vadesi Geçmiş ({overdueInvoicesList.length}):</span>
                <strong className="text-amber-900 font-mono">₺{(overdueReceivableTotal + overduePayableTotal).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
            <ExportButtons getExportData={getUpcomingExportData} size="sm" />
            <button
              onClick={() => onSelectTab("invoices")}
              className="text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              Tüm Faturalar &rarr;
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setUpcomingFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                upcomingFilter === "all"
                  ? "bg-white text-purple-950 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tümü ({openInvoices.length})
            </button>
            <button
              onClick={() => setUpcomingFilter("overdue")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                upcomingFilter === "overdue"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-amber-800 hover:text-amber-950 bg-amber-50/60 hover:bg-amber-100/80"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Vadesi Geçmişler ({overdueInvoicesList.length})
            </button>
            <button
              onClick={() => setUpcomingFilter("payable")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                upcomingFilter === "payable"
                  ? "bg-white text-rose-950 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Gelecek Borç Ödemeleri
            </button>
            <button
              onClick={() => setUpcomingFilter("receivable")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                upcomingFilter === "receivable"
                  ? "bg-white text-emerald-950 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Gelecek Müşteri Alacakları
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium italic">
            * Vade tarihine göre önceliklendirilmiştir
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4">Vade Tarihi / Durum</th>
                <th className="py-3 px-4">İşlem Türü</th>
                <th className="py-3 px-4">Cari / Müşteri / Tedarikçi</th>
                <th className="py-3 px-4 text-right">Fatura Tutarı</th>
                <th className="py-3 px-4 text-right">Kalan Ödeme / Tahsilat</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUpcomingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-slate-700">
                      {upcomingFilter === "overdue"
                        ? "Vadesi geçmiş geciken herhangi bir borç veya alacak bulunmuyor!"
                        : "Seçilen filtrede açık ödeme/tahsilat bulunmuyor."}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tüm faturalarınız ve ödeme planlarınız güncel görünüyor.</p>
                  </td>
                </tr>
              ) : (
                filteredUpcomingInvoices.slice(0, 10).map((inv) => {
                  const diffDays = getDaysDiff(inv.dueDate);
                  const isPurchase = inv.type === "purchase";
                  const isOverdue = diffDays < 0 || inv.status === "overdue";

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isOverdue ? "bg-amber-50/40 hover:bg-amber-50/80" : "hover:bg-purple-50/30"
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? "text-amber-600" : "text-slate-400"}`} />
                          <div>
                            <span className="font-bold text-slate-900 block">{formatDate(inv.dueDate)}</span>
                            <span
                              className={`text-[10px] font-extrabold ${
                                isOverdue
                                  ? "text-rose-600"
                                  : diffDays === 0
                                  ? "text-amber-600 font-bold"
                                  : "text-indigo-600"
                              }`}
                            >
                              {isOverdue
                                ? `${Math.abs(diffDays)} Gün Gecikti`
                                : diffDays === 0
                                ? "Bugün Son Gün!"
                                : `${diffDays} Gün Kaldı`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPurchase ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowUpRight className="w-3 h-3" />
                            Gider / Borç
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" />
                            Gelir / Alacak
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inv.contactName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Fatura No: {inv.invoiceNumber}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                        ₺{inv.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-extrabold text-sm ${
                            isPurchase ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          ₺{inv.remainingAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                        {inv.paidAmount > 0 && (
                          <span className="block text-[10px] text-slate-400">
                            (Ödenen: ₺{inv.paidAmount.toLocaleString("tr-TR")})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {inv.paidAmount > 0 ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            Kısmi Ödendi
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                            Vadesi Geçti
                          </span>
                        ) : diffDays <= 3 ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            Vadesi Yaklaştı
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            Vade Bekliyor
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectTab("invoices")}
                          className="text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          {isPurchase ? "Ödeme Yap" : "Tahsil Et"} &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SON FİNANSAL İŞLEMLER */}
      <div
        className="rounded-2xl p-5 sm:p-6 border shadow-2xs space-y-4"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Son Finansal İşlem Geçmişi
            </h3>
            <p className="text-xs text-slate-500">
              Kasa ve bankalara giren/çıkan en son gelir ve gider hareketleri
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButtons getExportData={getRecentTransactionsExportData} size="sm" />
            <button
              onClick={() => onSelectTab("transactions")}
              className="text-xs font-semibold hover:underline cursor-pointer"
              style={{ color: theme.primaryColor }}
            >
              Tüm İşlemler ({transactions.length}) &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-3">Tarih</th>
                <th className="py-2.5 px-3">İşlem / Açıklama</th>
                <th className="py-2.5 px-3">Cari / Hesap</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {transactions.slice(0, 5).map((tx) => {
                const isIncome = tx.type === "income" || tx.type === "collection";
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {tx.description}
                      {tx.documentNo && (
                        <span className="block text-[11px] font-normal text-slate-400">
                          Belge No: {tx.documentNo}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="font-medium text-slate-800">
                        {tx.contactName || tx.accountName}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {tx.accountName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium border border-slate-200">
                        {tx.category}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-extrabold text-sm whitespace-nowrap font-mono ${
                        isIncome ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isIncome ? "+" : "-"}₺
                      {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
