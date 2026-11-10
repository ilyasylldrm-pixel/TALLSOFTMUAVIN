import React, { useMemo, useState } from "react";
import { Cheque, PromissoryNote, Contact } from "../../types";
import { formatCurrency, formatDate } from "../../utils/exportUtils";
import {
  FileCheck2,
  Stamp,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowRight,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ChequeNoteSummaryReportProps {
  cheques: Cheque[];
  promissoryNotes: PromissoryNote[];
  contacts?: Contact[];
  compact?: boolean;
  onNavigateToPortfolio?: () => void;
}

type GroupMode = "status" | "dueDate" | "contact";
type InstrumentFilter = "all" | "cheque" | "note";

export const ChequeNoteSummaryReport: React.FC<ChequeNoteSummaryReportProps> = ({
  cheques = [],
  promissoryNotes = [],
  contacts = [],
  compact = false,
  onNavigateToPortfolio,
}) => {
  const [groupBy, setGroupBy] = useState<GroupMode>("status");
  const [instrumentFilter, setInstrumentFilter] = useState<InstrumentFilter>("all");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Normalize cheques & promissory notes into a unified instrument list
  const unifiedItems = useMemo(() => {
    const items: Array<{
      id: string;
      instrumentType: "cheque" | "note";
      direction: "received" | "issued";
      number: string;
      contactName: string;
      dueDate: string;
      amount: number;
      currency: string;
      status: "portfolio" | "collected" | "endorsed" | "bounced";
      rawStatus: string;
    }> = [];

    if (instrumentFilter === "all" || instrumentFilter === "cheque") {
      cheques.forEach((c) => {
        let normalizedStatus: "portfolio" | "collected" | "endorsed" | "bounced" = "portfolio";
        if (c.status === "collected" || c.status === "paid") normalizedStatus = "collected";
        else if (c.status === "endorsed") normalizedStatus = "endorsed";
        else if (c.status === "bounced" || c.status === "returned") normalizedStatus = "bounced";

        const matchedContact = c.contactId ? contacts.find((cnt) => cnt.id === c.contactId) : undefined;

        items.push({
          id: c.id,
          instrumentType: "cheque",
          direction: c.type,
          number: c.chequeNumber || "-",
          contactName: c.contactName || matchedContact?.name || c.drawerName || "Genel Cari",
          dueDate: c.dueDate || todayStr,
          amount: Number(c.amount) || 0,
          currency: c.currency || "TRY",
          status: normalizedStatus,
          rawStatus: c.status,
        });
      });
    }

    if (instrumentFilter === "all" || instrumentFilter === "note") {
      promissoryNotes.forEach((n) => {
        let normalizedStatus: "portfolio" | "collected" | "endorsed" | "bounced" = "portfolio";
        if (n.status === "collected" || n.status === "paid") normalizedStatus = "collected";
        else if (n.status === "endorsed") normalizedStatus = "endorsed";
        else if (n.status === "protested" || n.status === "returned") normalizedStatus = "bounced";

        const matchedContact = n.contactId ? contacts.find((cnt) => cnt.id === n.contactId) : undefined;

        items.push({
          id: n.id,
          instrumentType: "note",
          direction: n.type,
          number: n.noteNumber || "-",
          contactName: n.contactName || matchedContact?.name || n.debtorName || "Genel Cari",
          dueDate: n.dueDate || todayStr,
          amount: Number(n.amount) || 0,
          currency: n.currency || "TRY",
          status: normalizedStatus,
          rawStatus: n.status,
        });
      });
    }

    return items;
  }, [cheques, promissoryNotes, contacts, instrumentFilter, todayStr]);

  // 1. Duruma Göre Gruplandırma (Bekleyen / Portföyde, Tahsil Edilmiş / Ödenmiş, Ciro Edilmiş, Karşılıksız / Protestolu)
  const statusSummary = useMemo(() => {
    const groups = {
      portfolio: { label: "Bekleyen (Portföyde)", count: 0, amount: 0, color: "#4f46e5", badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200" },
      collected: { label: "Tahsil Edilmiş / Ödenmiş", count: 0, amount: 0, color: "#10b981", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      endorsed: { label: "Ciro Edilmiş (Devredilen)", count: 0, amount: 0, color: "#f59e0b", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
      bounced: { label: "Karşılıksız / Protestolu", count: 0, amount: 0, color: "#f43f5e", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
    };

    unifiedItems.forEach((item) => {
      groups[item.status].count += 1;
      groups[item.status].amount += item.amount;
    });

    return Object.entries(groups).map(([key, val]) => ({
      key,
      name: val.label,
      count: val.count,
      amount: Math.round(val.amount),
      color: val.color,
      badgeClass: val.badgeClass,
    }));
  }, [unifiedItems]);

  // 2. Vade Tarihine Göre Gruplandırma (Vadesi Geçmiş, Bu Hafta, Bu Ay / 30 Gün, 31-60 Gün, 60+ Gün)
  const maturitySummary = useMemo(() => {
    const buckets = [
      { key: "overdue", name: "Vadesi Geçmiş", count: 0, amount: 0, color: "#f43f5e" },
      { key: "7days", name: "0 - 7 Gün", count: 0, amount: 0, color: "#f59e0b" },
      { key: "30days", name: "8 - 30 Gün", count: 0, amount: 0, color: "#0ea5e9" },
      { key: "60days", name: "31 - 60 Gün", count: 0, amount: 0, color: "#6366f1" },
      { key: "future", name: "60+ Gün Vadeli", count: 0, amount: 0, color: "#10b981" },
    ];

    const todayTime = new Date(todayStr).getTime();

    unifiedItems.forEach((item) => {
      const dueTime = new Date(item.dueDate).getTime();
      const diffDays = Math.round((dueTime - todayTime) / (1000 * 3600 * 24));

      if (diffDays < 0) {
        buckets[0].count += 1;
        buckets[0].amount += item.amount;
      } else if (diffDays <= 7) {
        buckets[1].count += 1;
        buckets[1].amount += item.amount;
      } else if (diffDays <= 30) {
        buckets[2].count += 1;
        buckets[2].amount += item.amount;
      } else if (diffDays <= 60) {
        buckets[3].count += 1;
        buckets[3].amount += item.amount;
      } else {
        buckets[4].count += 1;
        buckets[4].amount += item.amount;
      }
    });

    return buckets.map((b) => ({
      ...b,
      amount: Math.round(b.amount),
    }));
  }, [unifiedItems, todayStr]);

  // 3. Cari Hesaba Göre Gruplandırma
  const contactSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        contactName: string;
        count: number;
        totalAmount: number;
        pendingAmount: number;
        collectedAmount: number;
        endorsedAmount: number;
      }
    >();

    unifiedItems.forEach((item) => {
      const key = item.contactName.trim() || "Genel Cari";
      const existing = map.get(key) || {
        contactName: key,
        count: 0,
        totalAmount: 0,
        pendingAmount: 0,
        collectedAmount: 0,
        endorsedAmount: 0,
      };

      existing.count += 1;
      existing.totalAmount += item.amount;
      if (item.status === "portfolio") existing.pendingAmount += item.amount;
      else if (item.status === "collected") existing.collectedAmount += item.amount;
      else if (item.status === "endorsed") existing.endorsedAmount += item.amount;

      map.set(key, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 8)
      .map((c, idx) => ({
        ...c,
        name: c.contactName.length > 20 ? c.contactName.slice(0, 18) + "…" : c.contactName,
        amount: Math.round(c.totalAmount),
        color: ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"][idx % 8],
      }));
  }, [unifiedItems]);

  const totalPortfolioSum = unifiedItems.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
      {/* Üst Başlık ve Gruplandırma Seçicileri */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Çek / Senet Durum Özet Raporu</span>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                  {unifiedItems.length} Evrak • {formatCurrency(totalPortfolioSum, "TRY")}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Durumuna (bekleyen, tahsil edilmiş, ciro edilmiş), vade tarihine veya cari hesaba göre grafiksel analiz
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Evrak Tipi Filtresi */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setInstrumentFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                instrumentFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Tümü ({cheques.length + promissoryNotes.length})
            </button>
            <button
              type="button"
              onClick={() => setInstrumentFilter("cheque")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                instrumentFilter === "cheque"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Çek ({cheques.length})
            </button>
            <button
              type="button"
              onClick={() => setInstrumentFilter("note")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                instrumentFilter === "note"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Senet ({promissoryNotes.length})
            </button>
          </div>

          {/* Gruplandırma Boyutu Seçici */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setGroupBy("status")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === "status"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Duruma Göre</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("dueDate")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === "dueDate"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Vade Tarihine Göre</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("contact")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === "contact"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cari Hesaba Göre</span>
            </button>
          </div>

          {onNavigateToPortfolio && (
            <button
              type="button"
              onClick={onNavigateToPortfolio}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Portföye Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Hızlı Durum KPI Kartı (Her Zaman Görünür) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statusSummary.map((st) => (
          <div
            key={st.key}
            className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: st.color }}
                />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                  {st.name}
                </span>
              </div>
              <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(st.amount, "TRY")}
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border shrink-0 ${st.badgeClass}`}>
              {st.count} Adet
            </span>
          </div>
        ))}
      </div>

      {/* Grafik ve Gruplandırılmış Özet Tablo Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* SOL: Grafiksel Görselleştirme */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              {groupBy === "status"
                ? "Duruma Göre Tutar Dağılım Grafiği"
                : groupBy === "dueDate"
                ? "Vade Dilimlerine Göre Nakit Akış Projeksiyonu"
                : "Cari Hesaplara Göre Çek/Senet Dağılımı"}
            </span>
          </div>

          <div className="h-64 w-full">
            {unifiedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <PieChartIcon className="w-8 h-8 mb-2 opacity-40" />
                <span>Gösterilecek çek veya senet kaydı bulunmuyor.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    groupBy === "status"
                      ? statusSummary
                      : groupBy === "dueDate"
                      ? maturitySummary
                      : contactSummary
                  }
                  margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                  />
                  <YAxis
                    tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}B`}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val) || 0, "TRY"), "Toplam Tutar"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {(groupBy === "status"
                      ? statusSummary
                      : groupBy === "dueDate"
                      ? maturitySummary
                      : contactSummary
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* SAĞ: Gruplandırılmış Detaylı Özet Tablosu */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between">
          <div className="overflow-x-auto">
            {groupBy === "status" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="py-2.5 px-3.5">Durum Grubu</th>
                    <th className="py-2.5 px-3 text-center">Evrak Adedi</th>
                    <th className="py-2.5 px-3 text-right">Oran (%)</th>
                    <th className="py-2.5 px-3.5 text-right">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {statusSummary.map((row) => {
                    const pct = totalPortfolioSum > 0 ? ((row.amount / totalPortfolioSum) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                          <span>{row.name}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {row.count}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          %{pct}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          {formatCurrency(row.amount, "TRY")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {groupBy === "dueDate" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="py-2.5 px-3.5">Vade Aralığı</th>
                    <th className="py-2.5 px-3 text-center">Evrak Adedi</th>
                    <th className="py-2.5 px-3 text-right">Pay (%)</th>
                    <th className="py-2.5 px-3.5 text-right">Vade Toplamı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {maturitySummary.map((row) => {
                    const pct = totalPortfolioSum > 0 ? ((row.amount / totalPortfolioSum) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                          <span>{row.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {row.count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          %{pct}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          {formatCurrency(row.amount, "TRY")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {groupBy === "contact" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">
                    <th className="py-2.5 px-3">Cari Hesap</th>
                    <th className="py-2.5 px-2 text-center">Adet</th>
                    <th className="py-2.5 px-2.5 text-right">Bekleyen</th>
                    <th className="py-2.5 px-2.5 text-right">Tahsil / Ciro</th>
                    <th className="py-2.5 px-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {contactSummary.map((row) => (
                    <tr key={row.contactName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                        {row.contactName}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {row.count}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-indigo-600 font-semibold">
                        {formatCurrency(row.pendingAmount, "TRY")}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-emerald-600 font-semibold">
                        {formatCurrency(row.collectedAmount + row.endorsedAmount, "TRY")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(row.totalAmount, "TRY")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/70 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">
              Genel Portföy Toplamı ({unifiedItems.length} Kayıt)
            </span>
            <span className="font-mono font-black text-indigo-700 dark:text-indigo-400">
              {formatCurrency(totalPortfolioSum, "TRY")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
