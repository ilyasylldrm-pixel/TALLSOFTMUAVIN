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

interface DepreciationScheduleTableProps {
  asset: FixedAsset;
  companyName?: string;
}

export const DepreciationScheduleTable: React.FC<DepreciationScheduleTableProps> = ({
  asset,
  companyName = "Şirket",
}) => {
  const [viewMode, setViewMode] = useState<"annual" | "quarterly">("annual");
  const [selectedJournalYear, setSelectedJournalYear] = useState<number | null>(null);

  const schedule: AssetDepreciationYearRecord[] = calculateDepreciationSchedule(asset);

  const totalDepreciation = schedule.reduce((sum, r) => sum + r.annualDepreciation, 0);
  const currentYear = new Date().getFullYear();

  const handleExportCSV = () => {
    const headers = [
      "Yıl",
      "Dönem Başı Değer (TL)",
      "Amortisman Oranı (%)",
      "Yıllık Amortisman (TL)",
      "Q1 (1. Geçici)",
      "Q2 (2. Geçici)",
      "Q3 (3. Geçici)",
      "Q4 (Yıllık Kapanış)",
      "Birikmiş Amortisman (TL)",
      "Kalan Net Defter Değeri (TL)",
    ];

    const rows = schedule.map((r) => [
      r.year,
      r.openingBookValue.toFixed(2),
      `%${r.depreciationRate}`,
      r.annualDepreciation.toFixed(2),
      r.q1Amount.toFixed(2),
      r.q2Amount.toFixed(2),
      r.q3Amount.toFixed(2),
      r.q4Amount.toFixed(2),
      r.accumulatedDepreciation.toFixed(2),
      r.closingNetBookValue.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${asset.code}_Amortisman_Itfa_Plani_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Parameter Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-700/50">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                VUK & TMS Uyumlu Amortisman Tablosu
              </span>
              {asset.isPartialYear && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  VUK 320 Kıst Amortisman (Binek Otomobil)
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {asset.code} - {asset.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("annual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "annual"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Yıllık İtfa Çizelgesi
              </button>
              <button
                type="button"
                onClick={() => setViewMode("quarterly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "quarterly"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3 Aylık Geçici Vergi (Q1-Q4)
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Excel (CSV) İndir</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium">Aktif Giriş Maliyeti</span>
            <div className="text-base font-bold text-white mt-0.5">
              {formatTRY(asset.purchaseCost)}
            </div>
            <span className="text-[10px] text-slate-400">
              KDV Hariç • {asset.currency || "TRY"}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium">Amortisman Yöntemi</span>
            <div className="text-base font-bold text-white mt-0.5">
              {asset.depreciationMethod === "normal"
                ? "Normal (Doğrusal)"
                : asset.depreciationMethod === "declining_balance"
                ? "Azalan Bakiyeler"
                : "Muaf"}
            </div>
            <span className="text-[10px] text-indigo-300">
              {asset.usefulLifeYears} Yıl (%{asset.depreciationRate})
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium">Birikmiş Amortisman</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {formatTRY(asset.accumulatedDepreciation)}
            </div>
            <span className="text-[10px] text-slate-400">
              İtfa Oranı: %
              {Math.min(
                100,
                Math.round((asset.accumulatedDepreciation / (asset.purchaseCost || 1)) * 100)
              )}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium">Kalan Net Defter Değeri</span>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              {formatTRY(asset.netBookValue)}
            </div>
            <span className="text-[10px] text-slate-400">Bilanço Aktif Değeri</span>
          </div>
        </div>
      </div>

      {/* VUK Note Notice */}
      {asset.isPartialYear && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              VUK Madde 320 Kıst Amortisman Kuralı:
            </p>
            <p className="text-amber-800">
              Faaliyetleri kısmen veya tamamen binek otomobillerinin kiralanması veya çeşitli şekillerde
              işletilmesi olanların bu amaçla kullandıkları binek otomobilleri hariç olmak üzere, işletmelere
              ait binek otomobillerinin aktife girdiği hesap dönemi için <strong>ay kesri tam ay sayılmak suretiyle</strong> kalan ay süresi kadar amortisman ayrılır. Amortisman ayrılmayan süreye isabet eden bakiye değer, <strong>itfa süresinin son yılında</strong> tamamen amortisman konusu yapılır.
            </p>
          </div>
        </div>
      )}

      {/* Depreciation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Yıl</th>
                <th className="py-3 px-4">Dönem Başı Değeri</th>
                <th className="py-3 px-4">Oran</th>
                {viewMode === "annual" ? (
                  <th className="py-3 px-4 text-indigo-700 bg-indigo-50/50">
                    Yıllık Amortisman Payı
                  </th>
                ) : (
                  <>
                    <th className="py-3 px-3 text-slate-600">Q1 (1. Geçici)</th>
                    <th className="py-3 px-3 text-slate-600">Q2 (2. Geçici)</th>
                    <th className="py-3 px-3 text-slate-600">Q3 (3. Geçici)</th>
                    <th className="py-3 px-3 text-slate-600">Q4 (Yıllık)</th>
                    <th className="py-3 px-3 text-indigo-700 bg-indigo-50/50">Toplam Yıl</th>
                  </>
                )}
                <th className="py-3 px-4">Birikmiş Amortisman</th>
                <th className="py-3 px-4 text-emerald-700">Net Defter Değeri</th>
                <th className="py-3 px-4 text-center">Yevmiye Fişi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {schedule.map((record) => {
                const isCurrent = record.year === currentYear;
                const isPast = record.year < currentYear;

                return (
                  <tr
                    key={record.year}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isCurrent ? "bg-indigo-50/40 font-semibold" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{record.year}</span>
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
                          <span className="text-[10px] px-1 bg-amber-100 text-amber-700 rounded font-semibold">
                            Kıst
                          </span>
                        )}
                        {record.isFinalYearCatchup && (
                          <span className="text-[10px] px-1 bg-blue-100 text-blue-700 rounded font-semibold">
                            Kıst Telafi
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {formatTRY(record.openingBookValue)}
                    </td>

                    <td className="py-3 px-4 text-slate-600">%{record.depreciationRate}</td>

                    {viewMode === "annual" ? (
                      <td className="py-3 px-4 font-bold text-indigo-700 bg-indigo-50/30">
                        {formatTRY(record.annualDepreciation)}
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-3 text-slate-600">{formatTRY(record.q1Amount)}</td>
                        <td className="py-3 px-3 text-slate-600">{formatTRY(record.q2Amount)}</td>
                        <td className="py-3 px-3 text-slate-600">{formatTRY(record.q3Amount)}</td>
                        <td className="py-3 px-3 text-slate-600">{formatTRY(record.q4Amount)}</td>
                        <td className="py-3 px-3 font-bold text-indigo-700 bg-indigo-50/30">
                          {formatTRY(record.annualDepreciation)}
                        </td>
                      </>
                    )}

                    <td className="py-3 px-4 text-slate-700">
                      {formatTRY(record.accumulatedDepreciation)}
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-600">
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          selectedJournalYear === record.year
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
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
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                <td className="py-3 px-4" colSpan={3}>
                  GENEL TOPLAM
                </td>
                {viewMode === "annual" ? (
                  <td className="py-3 px-4 text-indigo-700 text-sm">
                    {formatTRY(totalDepreciation)}
                  </td>
                ) : (
                  <>
                    <td className="py-3 px-3">
                      {formatTRY(schedule.reduce((s, r) => s + r.q1Amount, 0))}
                    </td>
                    <td className="py-3 px-3">
                      {formatTRY(schedule.reduce((s, r) => s + r.q2Amount, 0))}
                    </td>
                    <td className="py-3 px-3">
                      {formatTRY(schedule.reduce((s, r) => s + r.q3Amount, 0))}
                    </td>
                    <td className="py-3 px-3">
                      {formatTRY(schedule.reduce((s, r) => s + r.q4Amount, 0))}
                    </td>
                    <td className="py-3 px-3 text-indigo-700">
                      {formatTRY(totalDepreciation)}
                    </td>
                  </>
                )}
                <td className="py-3 px-4 text-slate-800">
                  {formatTRY(schedule[schedule.length - 1]?.accumulatedDepreciation || 0)}
                </td>
                <td className="py-3 px-4 text-emerald-700">0,00 ₺ (Tam İtfa)</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Accounting Journal Entry Preview (Yevmiye Maddesi) */}
      {selectedJournalYear && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-700 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-sm">
                Tek Düzen Hesap Planı Yevmiye Maddesi ({selectedJournalYear} Yılı Dönem Sonu)
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSelectedJournalYear(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Kapat
            </button>
          </div>

          {(() => {
            const rec = schedule.find((r) => r.year === selectedJournalYear);
            if (!rec) return null;

            return (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-700">
                  <div className="space-y-0.5">
                    <span className="text-emerald-400 font-bold">
                      {asset.expenseAccountCode || "770.05.001"}
                    </span>
                    <p className="text-slate-300">
                      GENEL YÖNETİM GİDERLERİ - Amortisman Payları
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">BORÇ (TL)</span>
                    <span className="font-bold text-white text-sm">
                      {formatTRY(rec.annualDepreciation)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-700 ml-6">
                  <div className="space-y-0.5">
                    <span className="text-amber-400 font-bold">
                      {asset.depreciationAccountCode || "257.01.001"}
                    </span>
                    <p className="text-slate-300">
                      BİRİKMİŞ AMORTİSMANLAR - {asset.categoryLabel || "Demirbaş"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">ALACAK (TL)</span>
                    <span className="font-bold text-white text-sm">
                      {formatTRY(rec.annualDepreciation)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-sans italic pt-1">
                  * 31.12.{selectedJournalYear} tarihinde otomatik tahakkuk ettirilecek dönem sonu amortisman mahsup fişidir.
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
