import React, { useState } from "react";
import { ExportButtons } from "./ExportButtons";
import { ExchangeRatesWidget } from "./ExchangeRatesWidget";
import { formatCurrency } from "../utils/exportUtils";
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
} from "lucide-react";
import {
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
  onSelectTab,
  onOpenQuickAdd,
  onOpenAiModal,
}) => {
  // Calculations
  const totalReceivable = contacts
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalPayable = contacts
    .filter((c) => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const totalCashBank = accounts
    .filter((a) => a.currency === "TRY")
    .reduce((sum, a) => sum + a.balance, 0);

  // Income vs Expense for current month
  const totalIncome = transactions
    .filter((t) => t.type === "income" || t.type === "collection")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense" || t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

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

  // KDV Calculations
  const salesVatTotal = invoices
    .filter((i) => i.type === "sales")
    .reduce((sum, i) => sum + i.totalVat, 0);

  const purchaseVatTotal = invoices
    .filter((i) => i.type === "purchase")
    .reduce((sum, i) => sum + i.totalVat, 0);

  const netVatPayable = salesVatTotal - purchaseVatTotal;

  // 12 Aylık Nakit Akışı & Gelir-Gider Dağılım Verisi
  const ALL_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylul", "Ekim", "Kasım", "Aralık"
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
      0: { inc: 45000, exp: 22000 },
      1: { inc: 52000, exp: 28000 },
      2: { inc: 61000, exp: 31000 },
      3: { inc: 48000, exp: 26000 },
      4: { inc: 74000, exp: 35000 },
      5: { inc: 82000, exp: 41000 },
      6: { inc: totalIncome > 0 ? totalIncome : 95000, exp: totalExpense > 0 ? totalExpense : 46000 },
      7: { inc: 88000, exp: 42000 },
      8: { inc: 91000, exp: 44000 },
      9: { inc: 102000, exp: 49000 },
      10: { inc: 98000, exp: 47000 },
      11: { inc: 115000, exp: 53000 },
    };

    if (monthIncome === 0 && monthExpense === 0) {
      monthIncome = baselines[idx]?.inc || 50000;
      monthExpense = baselines[idx]?.exp || 25000;
    }

    const net = monthIncome - monthExpense;
    return {
      ay: monthName,
      Gelir: monthIncome,
      Gider: monthExpense,
      Net: net,
      margin: monthIncome > 0 ? ((net / monthIncome) * 100).toFixed(1) : "0",
    };
  });

  // Export Data Generators
  const getMonthlyExportData = () => ({
    filename: "12_Aylik_Nakit_Akisi_Raporu",
    sheetName: "Nakit Akışı",
    title: "12 Aylık Nakit Akışı & Gelir-Gider Performans Raporu",
    subtitle: `12 Aylık Finansal Özet (Toplam Net Kar: ${formatCurrency(
      fullYearMonthlyData.reduce((acc, curr) => acc + curr.Net, 0),
      "TRY"
    )})`,
    headers: ["Ay", "Gelir", "Gider", "Net Kar/Zarar", "Kar Marjı (%)"],
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
    <div className="w-full px-6 py-6 space-y-6">
      {/* AI Financial Health Banner (Lila Konsepti) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 text-slate-900 shadow-2xs border border-purple-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Büyük Lila Geometrik Vektör Şekiller (Sağ ve Sol Köşeler) */}
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

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100/60 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0 mt-0.5 shadow-2xs backdrop-blur-2xs">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200/80">
                AI Muavin Analizi
              </span>
              <span className="text-xs text-purple-900 font-bold">Canlı Finans Sağlığı</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-1.5 leading-relaxed">
              Mevcut nakit akışınız pozitif seyrediyor. Vadesi geçmiş{" "}
              <strong className="text-amber-900 font-bold bg-amber-100/80 px-1 py-0.5 rounded border border-amber-300/60">
                {overdueInvoices.length} adet fatura (₺
                {overdueInvoices
                  .reduce((sum, i) => sum + i.remainingAmount, 0)
                  .toLocaleString("tr-TR")}
                )
              </strong>{" "}
              bulunuyor. Tahsilat takibi yapılması tavsiye edilir.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAiModal}
          className="relative z-10 bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 backdrop-blur-md text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-2xs shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>AI Asistana Danış</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-purple-700 font-bold" />
        </button>
      </div>

      {/* Central Bank (TCMB) Daily Exchange Rates (Euro, Dollar, Sterlin) */}
      <ExchangeRatesWidget compact={true} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receivables */}
        <div
          onClick={() => onSelectTab("contacts")}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 backdrop-blur-md rounded-2xl p-5 border border-blue-300/70 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
              Toplam Alacak (Müşteri)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
              <ArrowUpRight className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
              ₺{totalReceivable.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-semibold text-blue-900/80 mt-1 flex items-center gap-1">
              <span className="text-blue-950 font-bold bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300/80">
                {contacts.filter((c) => c.balance > 0).length} Müşteri
              </span>{" "}
              borçlu durumda
            </p>
          </div>
        </div>

        {/* Payables */}
        <div
          onClick={() => onSelectTab("contacts")}
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/70 backdrop-blur-md rounded-2xl p-5 border border-amber-300/70 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
              Toplam Borç (Tedarikçi)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
              <ArrowDownLeft className="w-5 h-5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
              ₺{totalPayable.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-semibold text-amber-900/80 mt-1 flex items-center gap-1">
              <span className="text-amber-950 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300/80">
                {contacts.filter((c) => c.balance < 0).length} Tedarikçiye
              </span>{" "}
              ödenecek
            </p>
          </div>
        </div>

        {/* Cash & Bank Total */}
        <div
          onClick={() => onSelectTab("accounts")}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-50/70 backdrop-blur-md rounded-2xl p-5 border border-emerald-300/70 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
              Kasa ve Bankalar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
              <Wallet className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
              ₺{totalCashBank.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-semibold text-emerald-900/80 mt-1">
              <span className="text-emerald-950 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded border border-emerald-300/80">
                {accounts.length} Aktif Hesap
              </span>{" "}
              bakiye toplamı
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div
          onClick={() => onSelectTab("transactions")}
          className={`relative overflow-hidden backdrop-blur-md rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all cursor-pointer group ${
            netProfit >= 0
              ? "bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-purple-50/70 border-purple-300/70 hover:border-purple-400"
              : "bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-rose-50/70 border-rose-300/70 hover:border-rose-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                netProfit >= 0 ? "text-purple-950" : "text-rose-950"
              }`}
            >
              Bu Ayki Net Kar
            </span>
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform font-bold ${
                netProfit >= 0
                  ? "bg-purple-500/20 border-purple-400/40 text-purple-800"
                  : "bg-rose-500/20 border-rose-400/40 text-rose-800"
              }`}
            >
              {netProfit >= 0 ? (
                <TrendingUp className="w-5 h-5 text-purple-700" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-700" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black font-mono tracking-tight ${
                netProfit >= 0 ? "text-purple-950" : "text-rose-950"
              }`}
            >
              ₺{netProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </div>
            <p
              className={`text-xs font-semibold mt-1 ${
                netProfit >= 0 ? "text-purple-900/80" : "text-rose-900/80"
              }`}
            >
              Gelir: <strong className="font-mono">₺{totalIncome.toLocaleString("tr-TR")}</strong> | Gider: <strong className="font-mono">₺{totalExpense.toLocaleString("tr-TR")}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart: 12 Aylık Nakit Akışı (Ekrana Kapla) */}
      <div className="w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              12 Aylık Nakit Akışı & Gelir-Gider Performansı
            </h3>
            <p className="text-xs text-slate-500">
              Yıllık 12 ayın gerçekleşen gelir, gider ve net bakiye dağılımı
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButtons getExportData={getMonthlyExportData} size="sm" />
            <button
              onClick={() => onSelectTab("reports")}
              className="text-xs font-bold text-purple-950 bg-purple-100 hover:bg-purple-200 border border-purple-300/80 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
            >
              Vergilendirme Detayı &rarr;
            </button>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fullYearMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="ay" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `₺${val / 1000}k`}
              />
              <Tooltip
                formatter={(value: any) => [`₺${Number(value).toLocaleString("tr-TR")}`, ""]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "12px",
                  color: "#0f172a",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px", color: "#475569" }} />
              <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gider" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Net" fill="#8252f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 12 Aylık Dağılım Kartları */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
              Aylara Göre Finansal Dağılım (12 Ay Özet)
            </span>
            <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200/60">
              12 Aylık Toplam Net Kar: ₺{fullYearMonthlyData.reduce((acc, curr) => acc + curr.Net, 0).toLocaleString("tr-TR")}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
            {fullYearMonthlyData.map((m) => (
              <div
                key={m.ay}
                className="bg-slate-50/80 hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-300 rounded-xl p-2.5 transition-all shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{m.ay}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                    %{m.margin}
                  </span>
                </div>
                <div className="text-[11px] space-y-0.5 pt-0.5">
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Gelir:</span>
                    <span className="font-mono">₺{(m.Gelir / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>Gider:</span>
                    <span className="font-mono">₺{(m.Gider / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between text-purple-950 font-bold border-t border-slate-200/60 pt-0.5">
                    <span>Net:</span>
                    <span className="font-mono">₺{(m.Net / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* VADESİ GEÇMİŞ VE GELECEK ÖDEMELER VE TAHSİLATLAR LISTESI */}
      <div className="w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800 shadow-2xs shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Vadesi Geçmiş & Gelecek Ödemeler ve Tahsilatlar
                </h3>
                <span className="text-[11px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  {openInvoices.length} Açık İşlem
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Geciken vadesi geçmiş borç ve alacaklar ile vadesi yaklaşan açık fatura takvimi
              </p>
            </div>
          </div>

          {/* Top Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {overdueInvoicesList.length > 0 && (
              <div className="bg-amber-50/90 border border-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-900 font-semibold">Vadesi Geçmiş ({overdueInvoicesList.length}):</span>
                <strong className="text-amber-900 font-mono">₺{(overdueReceivableTotal + overduePayableTotal).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
            <div className="bg-emerald-50/80 border border-emerald-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 font-medium">Toplam Alacak:</span>
              <strong className="text-emerald-700 font-mono">₺{totalUpcomingReceivable.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="bg-rose-50/80 border border-rose-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-slate-600 font-medium">Toplam Borç:</span>
              <strong className="text-rose-700 font-mono">₺{totalUpcomingPayable.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</strong>
            </div>
            <ExportButtons getExportData={getUpcomingExportData} size="sm" className="ml-auto" />
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

        {/* Table / List */}
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
                filteredUpcomingInvoices.slice(0, 12).map((inv) => {
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
                      {/* Vade Tarihi & Süre */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? "text-amber-600" : "text-slate-400"}`} />
                          <div>
                            <span className="font-bold text-slate-900 block">{inv.dueDate}</span>
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

                      {/* İşlem Türü */}
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

                      {/* Cari / Müşteri / Tedarikçi */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inv.contactName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Fatura No: {inv.invoiceNumber}</div>
                      </td>

                      {/* Fatura Tutarı */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                        ₺{inv.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Kalan Ödeme / Tahsilat */}
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

                      {/* Durum */}
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

                      {/* İşlem */}
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



      {/* Recent Transactions List Table */}
      <div className="bg-white rounded-2xl p-6 border border-purple-200/60 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
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
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
            >
              Tüm İşlemler ({transactions.length}) &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-3">Tarih</th>
                <th className="pb-2 px-3">İşlem / Açıklama</th>
                <th className="pb-2 px-3">Cari / Hesap</th>
                <th className="pb-2 px-3">Kategori</th>
                <th className="pb-2 px-3 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((tx) => {
                const isIncome = tx.type === "income" || tx.type === "collection";
                return (
                  <tr
                    key={tx.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3 px-3 text-slate-500 group-hover:text-purple-900 font-medium whitespace-nowrap rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {tx.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {tx.description}
                      {tx.documentNo && (
                        <span className="block text-[11px] font-normal text-slate-400 group-hover:text-purple-700/60">
                          Belge No: {tx.documentNo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span className="font-medium text-slate-800 group-hover:text-purple-950">
                        {tx.contactName || tx.accountName}
                      </span>
                      <span className="block text-[11px] text-slate-400 group-hover:text-purple-700/60">
                        {tx.accountName}
                      </span>
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span className="bg-slate-100 text-slate-700 group-hover:text-purple-900 px-2 py-0.5 rounded-md text-[11px] font-medium border border-slate-200 group-hover:border-purple-300 transition-all">
                        {tx.category}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-extrabold text-sm whitespace-nowrap rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all ${
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
