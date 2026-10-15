import React, { useState } from "react";
import {
  Calendar,
  FileSpreadsheet,
  Download,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  FileText,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { FixedAsset, AssetDepreciationYearRecord } from "../../types";
import { calculateDepreciationSchedule, formatTRY } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";
import { ExportButtons } from "../ExportButtons";
import { ExportData, formatCurrency } from "../../utils/exportUtils";

interface DepreciationScheduleTableProps {
  asset: FixedAsset;
  companyName?: string;
}

export const DepreciationScheduleTable: React.FC<DepreciationScheduleTableProps> = ({
  asset,
  companyName = "Şirket",
}) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<"annual" | "quarterly">("annual");
  const [selectedJournalYear, setSelectedJournalYear] = useState<number | null>(null);

  const schedule: AssetDepreciationYearRecord[] = calculateDepreciationSchedule(asset);
  const totalDepreciation = schedule.reduce((sum, r) => sum + r.annualDepreciation, 0);
  const currentYear = new Date().getFullYear();

  const getScheduleExportData = (): ExportData => {
    const headers = [
      "Yıl",
      "Dönem Başı Değer",
      "Amortisman Oranı",
      "Yıllık Amortisman",
      "Q1 (1. Geçici)",
      "Q2 (2. Geçici)",
      "Q3 (3. Geçici)",
      "Q4 (Yıllık Kapanış)",
      "Birikmiş Amortisman",
      "Kalan Net Defter Değeri",
    ];

    const rows = schedule.map((r) => [
      r.year,
      formatCurrency(r.openingBookValue, "TRY"),
      `%${r.depreciationRate}`,
      formatCurrency(r.annualDepreciation, "TRY"),
      formatCurrency(r.q1Amount, "TRY"),
      formatCurrency(r.q2Amount, "TRY"),
      formatCurrency(r.q3Amount, "TRY"),
      formatCurrency(r.q4Amount, "TRY"),
      formatCurrency(r.accumulatedDepreciation, "TRY"),
      formatCurrency(r.closingNetBookValue, "TRY"),
    ]);

    return {
      filename: `Amortisman_Itfa_Plani_${asset.code}_${new Date().toISOString().split("T")[0]}`,
      sheetName: "İtfa Tablosu",
      title: `${asset.code} - ${asset.name} AMORTİSMAN İTFA TABLOSU`,
      subtitle: `Yöntem: ${asset.depreciationMethod === "normal" ? "Normal" : "Azalan Bakiyeler"} | Faydalı Ömür: ${asset.usefulLifeYears} Yıl | Oran: %${asset.depreciationRate} | Alış Bedeli: ${formatTRY(asset.purchaseCost)}`,
      headers,
      rows,
    };
  };

  return (
    <div className="space-y-4">
      {/* 1. Top Parameter Summary Card */}
      <div
        className="rounded-2xl p-5 border shadow-2xs transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                VUK & TMS Uyumlu Amortisman Tablosu
              </span>
              {asset.isPartialYear && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  VUK 320 Kıst Amortisman
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              {asset.code} · {asset.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("annual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "annual"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Yıllık İtfa Çizelgesi
              </button>
              <button
                type="button"
                onClick={() => setViewMode("quarterly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "quarterly"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                3 Aylık Geçici Vergi (Q1-Q4)
              </button>
            </div>

            <ExportButtons getExportData={getScheduleExportData} size="sm" />
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Aktif Giriş Maliyeti</span>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5 tabular-nums">
              {formatTRY(asset.purchaseCost)}
            </div>
            <span className="text-[10px] text-slate-400">
              KDV Hariç · {asset.currency || "TRY"}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Amortisman Yöntemi</span>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {asset.depreciationMethod === "normal"
                ? "Normal (Doğrusal)"
                : asset.depreciationMethod === "declining_balance"
                ? "Azalan Bakiyeler"
                : "Muaf"}
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
              {asset.usefulLifeYears} Yıl (%{asset.depreciationRate})
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Birikmiş Amortisman</span>
            <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 tabular-nums">
              {formatTRY(asset.accumulatedDepreciation)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              İtfa Oranı: %
              {Math.min(
                100,
                Math.round((asset.accumulatedDepreciation / (asset.purchaseCost || 1)) * 100)
              )}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Kalan Net Defter Değeri</span>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 tabular-nums">
              {formatTRY(asset.netBookValue)}
            </div>
            <span className="text-[10px] text-slate-400">Bilanço Aktif Değeri</span>
          </div>
        </div>
      </div>

      {/* VUK Note Notice */}
      {asset.isPartialYear && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              VUK Madde 320 Kıst Amortisman Kuralı:
            </p>
            <p className="text-amber-800 dark:text-amber-300">
              Faaliyetleri binek otomobili işletmeciliği olmayan şirketlerde binek araçlar için aktife girdiği ilk yılda kalan ay kadar kıst amortisman ayrılır. Ayrılmayan süreye isabet eden bakiye, son yılda amortisman gideri yazılır.
            </p>
          </div>
        </div>
      )}

      {/* Depreciation Table Grid */}
      <div
        className="rounded-2xl border shadow-2xs overflow-hidden transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs data-grid">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Yıl</th>
                <th className="py-3 px-4">Dönem Başı Değeri</th>
                <th className="py-3 px-4">Oran</th>
                {viewMode === "annual" ? (
                  <th className="py-3 px-4 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30">
                    Yıllık Amortisman Payı
                  </th>
                ) : (
                  <>
                    <th className="py-3 px-3">Q1 (1. Geçici)</th>
                    <th className="py-3 px-3">Q2 (2. Geçici)</th>
                    <th className="py-3 px-3">Q3 (3. Geçici)</th>
                    <th className="py-3 px-3">Q4 (Yıllık)</th>
                    <th className="py-3 px-3 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30">
                      Toplam Yıl
                    </th>
                  </>
                )}
                <th className="py-3 px-4">Birikmiş Amortisman</th>
                <th className="py-3 px-4 text-emerald-700 dark:text-emerald-400">Net Defter Değeri</th>
                <th className="py-3 px-4 text-center">Yevmiye Fişi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {schedule.map((record) => {
                const isCurrent = record.year === currentYear;
                const isPast = record.year < currentYear;

                return (
                  <tr
                    key={record.year}
                    className={`transition-colors text-slate-900 dark:text-slate-100 ${
                      isCurrent
                        ? "bg-indigo-50/40 dark:bg-indigo-950/30 font-semibold"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-850/50"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">
                          {record.year}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                            Cari Yıl
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Ayrıldı
                          </span>
                        )}
                        {record.isPartialApplied && (
                          <span className="text-[10px] px-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-semibold">
                            Kıst
                          </span>
                        )}
                        {record.isFinalYearCatchup && (
                          <span className="text-[10px] px-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold">
                            Kıst Telafi
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                      {formatTRY(record.openingBookValue)}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      %{record.depreciationRate}
                    </td>

                    {viewMode === "annual" ? (
                      <td className="py-3 px-4 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 font-mono tabular-nums">
                        {formatTRY(record.annualDepreciation)}
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {formatTRY(record.q1Amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {formatTRY(record.q2Amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {formatTRY(record.q3Amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                          {formatTRY(record.q4Amount)}
                        </td>
                        <td className="py-3 px-3 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 font-mono tabular-nums">
                          {formatTRY(record.annualDepreciation)}
                        </td>
                      </>
                    )}

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                      {formatTRY(record.accumulatedDepreciation)}
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      {formatTRY(record.closingNetBookValue)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedJournalYear(
                            selectedJournalYear === record.year ? null : record.year
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          selectedJournalYear === record.year
                            ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-700 dark:border-slate-600"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                        }`}
                      >
                        Fiş Detayı
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-850 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 text-xs">
                <td colSpan={3} className="py-3 px-4">
                  Toplam İtfa Edilen Tutar
                </td>
                <td className="py-3 px-4 text-indigo-700 dark:text-indigo-400 font-mono tabular-nums">
                  {formatTRY(totalDepreciation)}
                </td>
                {viewMode === "quarterly" && <td colSpan={4}></td>}
                <td className="py-3 px-4 font-mono tabular-nums">
                  {formatTRY(totalDepreciation)}
                </td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  0,00 TL
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 2. Journal Voucher Entry (Yevmiye Kaydı Önizlemesi) */}
      {selectedJournalYear && (() => {
        const record = schedule.find((r) => r.year === selectedJournalYear);
        if (!record) return null;

        const expenseAccount = asset.expenseAccountCode || "770.01.005";
        const deprAccount = asset.depreciationAccountCode || "257.01.001";

        return (
          <div
            className="rounded-2xl border p-5 shadow-2xs space-y-3 animate-in fade-in transition-colors"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {selectedJournalYear} Yılı Yıllık Amortisman Muhasebe Yevmiye Fişi Önizlemesi
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJournalYear(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Hesap Kodu</th>
                    <th className="py-2.5 px-3">Hesap Adı / Açıklama</th>
                    <th className="py-2.5 px-3 text-right">Borç (TL)</th>
                    <th className="py-2.5 px-3 text-right">Alacak (TL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {expenseAccount}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      GENEL YÖNETİM GİDERLERİ / AMORTİSMAN GİDERİ ({asset.name})
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                      {formatTRY(record.annualDepreciation)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                      -
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                      {deprAccount}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      BİRİKMİŞ AMORTİSMANLAR ({asset.code} - {asset.name})
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                      -
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                      {formatTRY(record.annualDepreciation)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-850 font-bold border-t border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan={2} className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      Yevmiye Dengesi
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-600">
                      {formatTRY(record.annualDepreciation)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-600">
                      {formatTRY(record.annualDepreciation)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
