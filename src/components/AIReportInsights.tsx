import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Layers,
  Zap,
  Target,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Briefcase,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Invoice, Transaction } from "../types";
import { formatCurrency, formatDate } from "../utils/exportUtils";

interface MonthlyStatItem {
  monthIndex: number;
  monthName: string;
  income: number;
  expense: number;
  netProfit: number;
  invoiceCount: number;
  transactionCount: number;
  topExpenseCategory?: string;
}

interface ActionableInsightItem {
  id: string;
  title: string;
  category: "Nakit Akışı" | "Gider Optimizasyonu" | "Gelir Artırma" | "Vergi & Mevzuat" | "Risk Yönetimi" | string;
  impact: "Yüksek" | "Orta" | "Kritik" | string;
  description: string;
  recommendedAction: string;
  estimatedBenefit?: string;
}

interface MonthlyPatternItem {
  monthName: string;
  trend: "up" | "down" | "neutral";
  observation: string;
  marginRate?: number;
}

interface AIReportInsightsData {
  executiveSummary: string;
  financialHealthScore: number;
  healthScoreRating: "Güçlü" | "İyi" | "Dengeli" | "Riskli" | "Kritik" | string;
  monthlyPatterns: MonthlyPatternItem[];
  topDrivers: {
    incomeDriver: string;
    expenseDriver: string;
  };
  actionableInsights: ActionableInsightItem[];
  projections?: {
    nextQuarterOutlook?: string;
    workingCapitalStatus?: string;
  };
}

interface AIReportInsightsProps {
  invoices: Invoice[];
  transactions: Transaction[];
  selectedYear: number;
  onNavigateToTab?: (tab: string) => void;
}

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const AIReportInsights: React.FC<AIReportInsightsProps> = ({
  invoices,
  transactions,
  selectedYear,
  onNavigateToTab,
}) => {
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [insightsData, setInsightsData] = useState<AIReportInsightsData | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<string | null>(null);

  // 1. Calculate monthly historical metrics from actual invoices and transactions
  const { monthlyStats, totalIncome, totalExpense, netProfit, topCategories, cashFlowSummary } = useMemo(() => {
    const stats: MonthlyStatItem[] = MONTH_NAMES.map((name, idx) => ({
      monthIndex: idx,
      monthName: name,
      income: 0,
      expense: 0,
      netProfit: 0,
      invoiceCount: 0,
      transactionCount: 0,
    }));

    const expenseCategoryMap: { [cat: string]: number } = {};
    let totalSales = 0;
    let totalPurchases = 0;
    let cashInflow = 0;
    let cashOutflow = 0;

    // Process invoices for the year
    invoices.forEach((inv) => {
      const d = new Date(inv.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        const amt = Number(inv.grandTotal || inv.totalAmount || 0);
        if (inv.type === "sales") {
          stats[m].income += amt;
          totalSales += amt;
        } else if (inv.type === "purchase") {
          stats[m].expense += amt;
          totalPurchases += amt;
          const cat = inv.category || "Genel Gider";
          expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + amt;
        }
        stats[m].invoiceCount += 1;
      }
    });

    // Process transactions (cash/bank entries)
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        const amt = Number(tx.amount || 0);
        if (tx.type === "income" || tx.type === "collection") {
          cashInflow += amt;
        } else if (tx.type === "expense" || tx.type === "payment") {
          cashOutflow += amt;
          const cat = tx.category || "Operasyonel Harcama";
          expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + amt;
        }
        stats[m].transactionCount += 1;
      }
    });

    // Finalize monthly stats
    stats.forEach((s) => {
      s.netProfit = s.income - s.expense;
    });

    const topCats = Object.entries(expenseCategoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      monthlyStats: stats,
      totalIncome: totalSales > 0 ? totalSales : cashInflow,
      totalExpense: totalPurchases > 0 ? totalPurchases : cashOutflow,
      netProfit: (totalSales > 0 ? totalSales : cashInflow) - (totalPurchases > 0 ? totalPurchases : cashOutflow),
      topCategories: topCats,
      cashFlowSummary: { cashInflow, cashOutflow, netCash: cashInflow - cashOutflow },
    };
  }, [invoices, transactions, selectedYear]);

  // Function to run AI Pattern Analysis
  const runAIAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/report-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          totalIncome,
          totalExpense,
          topExpenseCategories: topCategories,
          cashFlowSummary,
          monthlyStats: monthlyStats.map((m) => ({
            monthIndex: m.monthIndex,
            monthName: m.monthName,
            income: Math.round(m.income),
            expense: Math.round(m.expense),
            netProfit: Math.round(m.netProfit),
            invoiceCount: m.invoiceCount,
          })),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setInsightsData(resData.data);
        setLastAnalyzedTime(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
      } else {
        throw new Error(resData.error || "Yapay zeka analizi oluşturulamadı.");
      }
    } catch (err: any) {
      console.error("AI report analysis error:", err);
      setError(err.message || "Analiz sırasında bir bağlantı hatası meydana geldi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run automatically on first mount or year change
  useEffect(() => {
    runAIAnalysis();
  }, [selectedYear]);

  // Filter actionable insights by category
  const filteredInsights = useMemo(() => {
    if (!insightsData?.actionableInsights) return [];
    if (filterCategory === "all") return insightsData.actionableInsights;
    return insightsData.actionableInsights.filter((item) => item.category === filterCategory);
  }, [insightsData, filterCategory]);

  const categories = useMemo(() => {
    if (!insightsData?.actionableInsights) return [];
    const set = new Set<string>();
    insightsData.actionableInsights.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [insightsData]);

  // Health Score Color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    if (score >= 65) return "text-[#0f6bae] bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800";
    if (score >= 50) return "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    return "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
  };

  const getImpactBadge = (impact: string) => {
    if (impact === "Kritik") {
      return "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    }
    if (impact === "Yüksek") {
      return "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
    return "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  };

  // Max value for bar visual
  const maxMonthlyVal = useMemo(() => {
    const maxInc = Math.max(...monthlyStats.map((m) => m.income), 1000);
    const maxExp = Math.max(...monthlyStats.map((m) => m.expense), 1000);
    return Math.max(maxInc, maxExp);
  }, [monthlyStats]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* TOP HERO / AI OVERVIEW BANNER */}
      <div
        className="rounded-3xl border p-6 shadow-xs relative overflow-hidden transition-all"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f6bae] to-[#005289] text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight" style={{ color: theme.pageText }}>
                  AI Finansal Analitik & Gelir/Gider Örüntü Modeli
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaedff] text-[#005289] dark:bg-slate-800 dark:text-[#9dcaff] border border-[#dae2fd] dark:border-[#283044]">
                  Gemini Flash AI
                </span>
              </div>
              <p className="text-xs font-medium mt-1 max-w-2xl" style={{ color: theme.pageTextMuted }}>
                İşletmenizin geçmiş işlem ve fatura verilerini tarayarak dönemsel gelir-gider paternlerini,
                mevsimsel dalgalanmaları ve kârlılığı artırmaya yönelik aksiyon önerilerini analiz eder.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastAnalyzedTime && (
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Son Güncelleme: {lastAnalyzedTime}
              </span>
            )}
            <button
              onClick={runAIAnalysis}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0f6bae] hover:bg-[#005289] text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "AI İnceliyor..." : "Yeniden Analiz Et"}</span>
            </button>
          </div>
        </div>

        {/* LOADING STATE SKELETON */}
        {isLoading && !insightsData && (
          <div className="mt-6 p-8 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-[#0f6bae] flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Yapay Zeka Geçmiş Verileri İnceliyor
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              12 aylık fatura, kasa/banka hareketleri, gider kategorileri ve nakit akışı verileri taranarak aksiyon önerileri oluşturuluyor...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* EXECUTIVE SUMMARY & HEALTH SCORE (When Loaded) */}
        {insightsData && (
          <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#005289] dark:text-[#9dcaff]">
                <Zap className="w-3.5 h-3.5" />
                <span>Üst Düzey Yönetici Özeti (Executive Summary)</span>
              </div>
              <p className="text-sm leading-relaxed font-medium" style={{ color: theme.pageText }}>
                {insightsData.executiveSummary}
              </p>
              {insightsData.projections?.workingCapitalStatus && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong>İşletme Sermayesi:</strong> {insightsData.projections.workingCapitalStatus}</span>
                </div>
              )}
            </div>

            {/* Health Score Pill */}
            <div className="flex flex-col justify-center items-center p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/50 text-center" style={{ borderColor: theme.cardBorder }}>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Finansal Sağlık Skoru
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-4xl font-black font-mono tabular-nums ${getScoreColor(insightsData.financialHealthScore).split(" ")[0]}`}>
                  {insightsData.financialHealthScore}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
              <div className={`mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(insightsData.financialHealthScore)}`}>
                {insightsData.healthScoreRating || "Dengeli"} Düzey
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 12 MONTH INCOME / EXPENSE PATTERNS VISUAL MATRIX */}
      <div
        className="rounded-3xl border p-6 shadow-xs space-y-4"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#005289]" />
              <h3 className="text-sm font-black" style={{ color: theme.pageText }}>
                {selectedYear} Yılı Aylık Gelir ve Gider Örüntüsü (Patterns)
              </h3>
            </div>
            <p className="text-xs font-medium" style={{ color: theme.pageTextMuted }}>
              Geçmiş işlem verilerine göre aylık gelir, gider ve net işletme fazlalığı dağılımı
            </p>
          </div>

          {/* Key Indicators */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span style={{ color: theme.pageText }}>Gelir (₺{formatCurrency(totalIncome)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500" />
              <span style={{ color: theme.pageText }}>Gider (₺{formatCurrency(totalExpense)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#0f6bae]" />
              <span style={{ color: theme.pageText }}>Net: ₺{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* 12 Month Bar Graph */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2.5 pt-2">
          {monthlyStats.map((item) => {
            const incPct = maxMonthlyVal > 0 ? (item.income / maxMonthlyVal) * 100 : 0;
            const expPct = maxMonthlyVal > 0 ? (item.expense / maxMonthlyVal) * 100 : 0;
            const isProfitable = item.income >= item.expense;

            const aiPattern = insightsData?.monthlyPatterns?.find((p) =>
              p.monthName.toLowerCase().includes(item.monthName.toLowerCase())
            );

            return (
              <div
                key={item.monthIndex}
                className="p-3 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all flex flex-col justify-between group"
                style={{ borderColor: theme.cardBorder }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold" style={{ color: theme.pageText }}>
                      {item.monthName}
                    </span>
                    {aiPattern && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          aiPattern.trend === "up"
                            ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                            : aiPattern.trend === "down"
                            ? "text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                            : "text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                        title={aiPattern.observation}
                      >
                        {aiPattern.trend === "up" ? "▲" : aiPattern.trend === "down" ? "▼" : "•"}
                      </span>
                    )}
                  </div>

                  {/* Dual Bar Graphic */}
                  <div className="mt-3 flex items-end gap-1.5 h-20 bg-white/60 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex-1 flex flex-col justify-end h-full">
                      <div
                        className="w-full bg-emerald-500 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                        style={{ height: `${Math.max(incPct, 4)}%` }}
                        title={`Gelir: ₺${formatCurrency(item.income)}`}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-end h-full">
                      <div
                        className="w-full bg-rose-500 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                        style={{ height: `${Math.max(expPct, 4)}%` }}
                        title={`Gider: ₺${formatCurrency(item.expense)}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[10px] space-y-0.5">
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>G:</span>
                    <span>₺{formatCurrency(item.income)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                    <span>Ç:</span>
                    <span>₺{formatCurrency(item.expense)}</span>
                  </div>
                  <div
                    className={`flex justify-between font-extrabold pt-0.5 border-t border-slate-200/40 dark:border-slate-700/40 ${
                      isProfitable ? "text-slate-700 dark:text-slate-200" : "text-rose-600 font-black"
                    }`}
                  >
                    <span>Net:</span>
                    <span>₺{formatCurrency(item.netProfit)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Key Observation on Patterns */}
        {insightsData?.topDrivers && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[#f2f3ff] dark:bg-slate-800/80 border border-[#dae2fd] dark:border-[#283044] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                  Temel Gelir Dinamiği
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {insightsData.topDrivers.incomeDriver}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-extrabold text-rose-800 dark:text-rose-300 block">
                  Kritik Gider Odağı
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {insightsData.topDrivers.expenseDriver}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTIONABLE INSIGHTS SECTION (STRATEGIC RECOMMENDATIONS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#005289]" />
              <h3 className="text-sm font-black" style={{ color: theme.pageText }}>
                Uygulanabilir Aksiyon Önerileri (Actionable Insights)
              </h3>
            </div>
            <p className="text-xs font-medium" style={{ color: theme.pageTextMuted }}>
              Yapay zekanın geçmiş gelir-gider verilerine dayanarak sunduğu somut iyileştirme adımları
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterCategory === "all"
                    ? "bg-[#0f6bae] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                Tümü ({insightsData?.actionableInsights.length || 0})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterCategory === cat
                      ? "bg-[#0f6bae] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INSIGHTS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInsights.map((insight, idx) => (
            <div
              key={insight.id || idx}
              className="p-5 rounded-3xl border shadow-xs flex flex-col justify-between transition-all hover:shadow-md group relative overflow-hidden"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
            >
              <div className="space-y-3">
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {insight.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getImpactBadge(
                      insight.impact
                    )}`}
                  >
                    {insight.impact} Etki
                  </span>
                </div>

                {/* Insight Title */}
                <h4 className="text-sm font-extrabold leading-snug" style={{ color: theme.pageText }}>
                  {insight.title}
                </h4>

                {/* Data Description */}
                <p className="text-xs leading-relaxed font-medium" style={{ color: theme.pageTextMuted }}>
                  {insight.description}
                </p>

                {/* Recommended Operational Action */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#0f6bae] dark:text-[#58b1ff]">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>Önerilen Aksiyon:</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed" style={{ color: theme.pageText }}>
                    {insight.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Benefit Footer */}
              {insight.estimatedBenefit && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {insight.estimatedBenefit}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PROJECTIONS & OUTLOOK FOOTER */}
      {insightsData?.projections?.nextQuarterOutlook && (
        <div
          className="p-5 rounded-3xl border shadow-2xs flex items-start gap-3.5"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0f6bae] flex items-center justify-center shrink-0 mt-0.5">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#005289] dark:text-[#9dcaff]">
              Gelecek Dönem Projeksiyonu & Beklenti
            </h4>
            <p className="text-xs font-medium mt-1 leading-relaxed" style={{ color: theme.pageText }}>
              {insightsData.projections.nextQuarterOutlook}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
