import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Download,
  RotateCcw,
  ListPlus,
} from "lucide-react";
import { ConstructionProject } from "../../types";
import { formatCurrency } from "../../utils/exportUtils";

export interface ConstructionSummaryRow {
  id: string;
  sNo: number;
  imallatAdi1: string; // İMALATIN ADI
  imallatAdi2?: string;
  grupToplamKdvHaric: number | ""; // GRUP TOPLAM TUTARI (KDV HARİÇ) (TL)
  kapaliOtoparkTutar: number | ""; // KAPALI OTOPARK TOPLAM TUTAR ( TL )
  sosyalTesisTutar: number | ""; // SOSYAL TESİS TOPLAM TUTAR ( TL )
  cevreTanzimTutar: number | ""; // ÇEVRE TANZİM ALT. TOPLAM TUTAR ( TL )
}

const DEFAULT_ITEMS_LIST: string[] = [
  "Yıkım Söküm İşleri",
  "Mevcut yapıların yıkılması ve uzaklaştırılması",
  "İnklinometre deneyleri",
  "Kat bahçesi bitkisel toprak dolgusu",
  "Her çapta, nervürlü ve hasır demir işçilik",
  "Daire içi duvarların 2 cm xps ile izolasyon yapılması",
  "Gazbeton ile 10 Cm duvar yapılması malzeme ve işçilik",
  "Normal alçıpandan asma tavan yapılması",
  "Duvar alçı sıva yapılması",
  "Hazır şap betonu ile şap yapılması malzeme ve işçiliği",
  "Teknik alanlar seramik süpürgelik kaplama yapılması",
  "Kapalı otoparklarda yönlendirme boyaları dahil tüm iç boyalar",
  "S3 (150x200cm), Otopark Yangın Merdiveni",
  "Pencere ve teras önü korkuluk imalatları",
  "PVC Pencere doğrama metrajı ( cam ve tüm aksesuar dahil )",
  "Mantolama, sıva,boya, pencere söveleri ve kat silmeleri dahil dış cephe kaplaması",
  "Mermer merdiven basamak kaplama yapılması",
  "Alüminyum giydirme cephe (kapılar dahil )",
  "Asansör kapısı ve etrafı mermer kaplama",
  "3+1 daire aynası",
  "Aspiratör",
  "Ahşap deck ile havuz teras kaplama yapılması",
  "Tamir ve bakım giderleri",
  "TOPLAM İNŞAAT MALİYETİ ( TL )",
  "BRÜT İNŞAAT ALANI TOPLAMI (M2)",
  "BRÜT İNŞAAT BİRİM MALİYETİ ( TL/M2 )",
];

export const createPresetRows = (): ConstructionSummaryRow[] => {
  return DEFAULT_ITEMS_LIST.map((item, index) => ({
    id: `row-preset-${index + 1}`,
    sNo: index + 1,
    imallatAdi1: item,
    imallatAdi2: "",
    grupToplamKdvHaric: "",
    kapaliOtoparkTutar: "",
    sosyalTesisTutar: "",
    cevreTanzimTutar: "",
  }));
};

const createEmptyRow = (sNo: number): ConstructionSummaryRow => ({
  id: `row-${Date.now()}-${sNo}-${Math.random().toString(36).substring(2, 7)}`,
  sNo,
  imallatAdi1: "",
  imallatAdi2: "",
  grupToplamKdvHaric: "",
  kapaliOtoparkTutar: "",
  sosyalTesisTutar: "",
  cevreTanzimTutar: "",
});

const INITIAL_EMPTY_ROWS: ConstructionSummaryRow[] = createPresetRows();

interface ConstructionSiteSummaryTableProps {
  currentProject: ConstructionProject | undefined;
}

export const ConstructionSiteSummaryTable: React.FC<
  ConstructionSiteSummaryTableProps
> = ({ currentProject }) => {
  const storageKey = `construction_summary_table_v3_${currentProject?.id || "default"}`;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [rows, setRows] = useState<ConstructionSummaryRow[]>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Storage access failed:", e);
    }
    return INITIAL_EMPTY_ROWS;
  });

  const saveRows = (newRows: ConstructionSummaryRow[]) => {
    setRows(newRows);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(storageKey, JSON.stringify(newRows));
      }
    } catch (e) {
      console.warn("Storage save failed:", e);
    }
  };

  // Standart şablonu (26 kalemi) tekrar yükle
  const handleLoadPreset = () => {
    saveRows(createPresetRows());
  };

  // Toplam grup tutarı (Maliyet Yüzdesi hesabı için)
  const totalGrupKdvHaric = useMemo(() => {
    return rows.reduce(
      (acc, r) => acc + (typeof r.grupToplamKdvHaric === "number" && !isNaN(r.grupToplamKdvHaric) ? r.grupToplamKdvHaric : 0),
      0
    );
  }, [rows]);

  // Satır bazlı hesaplamalar
  const computedRows = useMemo(() => {
    return rows.map((r) => {
      const gTotal = typeof r.grupToplamKdvHaric === "number" && !isNaN(r.grupToplamKdvHaric) ? r.grupToplamKdvHaric : 0;
      const otopark = typeof r.kapaliOtoparkTutar === "number" && !isNaN(r.kapaliOtoparkTutar) ? r.kapaliOtoparkTutar : 0;
      const sosyal = typeof r.sosyalTesisTutar === "number" && !isNaN(r.sosyalTesisTutar) ? r.sosyalTesisTutar : 0;
      const cevre = typeof r.cevreTanzimTutar === "number" && !isNaN(r.cevreTanzimTutar) ? r.cevreTanzimTutar : 0;

      // TOPLAM TUTAR ( TL )
      const rowToplamTutar = gTotal + otopark + sosyal + cevre;

      // MALİYET YÜZDESİ
      const maliyetYuzdesi =
        totalGrupKdvHaric > 0 ? (gTotal / totalGrupKdvHaric) * 100 : 0;

      return {
        ...r,
        rowToplamTutar,
        maliyetYuzdesi,
      };
    });
  }, [rows, totalGrupKdvHaric]);

  // Genel Toplamlar
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const gTotal = typeof r.grupToplamKdvHaric === "number" && !isNaN(r.grupToplamKdvHaric) ? r.grupToplamKdvHaric : 0;
        const otopark = typeof r.kapaliOtoparkTutar === "number" && !isNaN(r.kapaliOtoparkTutar) ? r.kapaliOtoparkTutar : 0;
        const sosyal = typeof r.sosyalTesisTutar === "number" && !isNaN(r.sosyalTesisTutar) ? r.sosyalTesisTutar : 0;
        const cevre = typeof r.cevreTanzimTutar === "number" && !isNaN(r.cevreTanzimTutar) ? r.cevreTanzimTutar : 0;
        const rowTotal = gTotal + otopark + sosyal + cevre;

        return {
          grupToplam: acc.grupToplam + gTotal,
          otoparkToplam: acc.otoparkToplam + otopark,
          sosyalToplam: acc.sosyalToplam + sosyal,
          cevreToplam: acc.cevreToplam + cevre,
          genelToplam: acc.genelToplam + rowTotal,
        };
      },
      {
        grupToplam: 0,
        otoparkToplam: 0,
        sosyalToplam: 0,
        cevreToplam: 0,
        genelToplam: 0,
      }
    );
  }, [rows]);

  // Hücre güncelleme
  const updateCell = (
    id: string,
    field: keyof ConstructionSummaryRow,
    value: string | number
  ) => {
    const updated = rows.map((r) => {
      if (r.id !== id) return r;
      return {
        ...r,
        [field]: value,
      };
    });
    saveRows(updated);
  };

  // Yeni satır ekle
  const handleAddRow = () => {
    const nextSNo = rows.length + 1;
    const newRow = createEmptyRow(nextSNo);
    saveRows([...rows, newRow]);
  };

  // Satır sil
  const handleDeleteRow = (id: string) => {
    const remaining = rows.filter((r) => r.id !== id);
    const reindexed = remaining.map((r, idx) => ({ ...r, sNo: idx + 1 }));
    saveRows(reindexed.length > 0 ? reindexed : [createEmptyRow(1)]);
  };

  // Tabloyu tamamen boşalt
  const handleClearTable = () => {
    saveRows([
      createEmptyRow(1),
      createEmptyRow(2),
      createEmptyRow(3),
      createEmptyRow(4),
      createEmptyRow(5),
    ]);
    setShowClearConfirm(false);
  };

  // Excel (CSV) İndir
  const handleExportCSV = () => {
    let csv =
      "S.NO;İMALATIN ADI;GRUP TOPLAM TUTARI (KDV HARİÇ) (TL);MALİYET YÜZDESİ;KAPALI OTOPARK TOPLAM TUTAR ( TL );SOSYAL TESİS TOPLAM TUTAR ( TL );TOPLAM TUTAR ( TL );ÇEVRE TANZİM ALT. TOPLAM TUTAR ( TL )\n";

    computedRows.forEach((r) => {
      const gTotal = typeof r.grupToplamKdvHaric === "number" ? r.grupToplamKdvHaric : 0;
      const otopark = typeof r.kapaliOtoparkTutar === "number" ? r.kapaliOtoparkTutar : 0;
      const sosyal = typeof r.sosyalTesisTutar === "number" ? r.sosyalTesisTutar : 0;
      const cevre = typeof r.cevreTanzimTutar === "number" ? r.cevreTanzimTutar : 0;

      csv += `"${r.sNo}";"${(r.imallatAdi1 || "").replace(
        /"/g,
        '""'
      )}";"${gTotal}";"%${r.maliyetYuzdesi.toFixed(2)}";"${otopark}";"${sosyal}";"${r.rowToplamTutar}";"${cevre}"\n`;
    });

    csv += `"TOPLAM";"";"${totals.grupToplam}";"%100.00";"${totals.otoparkToplam}";"${totals.sosyalToplam}";"${totals.genelToplam}";"${totals.cevreToplam}"\n`;

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentProject?.projectCode || "Proje"}_Insaat_Icmal.csv`;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 1000);
  };

  return (
    <div className="space-y-3">
      {/* ÜST BUTONLAR */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
          İnşaat İcmal Tablosu
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadPreset}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
            title="Görseldeki 26 Standart Kalemi Tabloya Yükle"
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>26 Standart Kalemi Yükle</span>
          </button>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Satır Ekle</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (CSV)</span>
          </button>
          
          {showClearConfirm ? (
            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-lg border border-rose-200 dark:border-rose-900">
              <span className="text-2xs text-rose-700 dark:text-rose-300 font-semibold px-1">Tümünü temizle?</span>
              <button
                type="button"
                onClick={handleClearTable}
                className="px-2 py-0.5 rounded text-2xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Evet
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 rounded text-2xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                İptal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Tabloyu Temizle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* YATAY TABLO */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold uppercase text-2xs border-b border-slate-200 dark:border-slate-700 select-none">
                <th className="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 w-12 shrink-0">
                  S.NO
                </th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 min-w-[260px]">
                  İMALATIN ADI
                </th>
                <th className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 min-w-[150px]">
                  GRUP TOPLAM TUTARI (KDV HARİÇ) (TL)
                </th>
                <th className="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 min-w-[90px]">
                  MALİYET YÜZDESİ
                </th>
                <th className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 min-w-[140px]">
                  KAPALI OTOPARK TOPLAM TUTAR ( TL )
                </th>
                <th className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 min-w-[140px]">
                  SOSYAL TESİS TOPLAM TUTAR ( TL )
                </th>
                <th className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 min-w-[140px] bg-slate-200/60 dark:bg-slate-800/80">
                  TOPLAM TUTAR ( TL )
                </th>
                <th className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 min-w-[150px]">
                  ÇEVRE TANZİM ALT. TOPLAM TUTAR ( TL )
                </th>
                <th className="p-2.5 text-center w-10 shrink-0"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {computedRows.map((row) => {
                const isSummaryRow =
                  row.imallatAdi1.includes("TOPLAM İNŞAAT MALİYETİ") ||
                  row.imallatAdi1.includes("BRÜT İNŞAAT ALANI") ||
                  row.imallatAdi1.includes("BRÜT İNŞAAT BİRİM MALİYETİ");

                return (
                <tr
                  key={row.id}
                  className={`transition-colors group ${
                    isSummaryRow
                      ? "bg-amber-50/60 dark:bg-amber-950/20 font-bold"
                      : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {/* S.NO */}
                  <td className="p-1 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-500">
                    {row.sNo}
                  </td>

                  {/* İMALATIN ADI */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={row.imallatAdi1}
                      onChange={(e) =>
                        updateCell(row.id, "imallatAdi1", e.target.value)
                      }
                      placeholder=""
                      className={`w-full px-2 py-1 bg-transparent border-0 focus:bg-amber-50/50 dark:focus:bg-slate-800 focus:ring-1 focus:ring-amber-500 rounded text-xs text-slate-900 dark:text-slate-100 outline-hidden ${
                        isSummaryRow ? "font-bold text-amber-900 dark:text-amber-300 uppercase" : "font-semibold"
                      }`}
                    />
                  </td>

                  {/* GRUP TOPLAM TUTARI (KDV HARİÇ) (TL) */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      value={row.grupToplamKdvHaric}
                      onChange={(e) =>
                        updateCell(
                          row.id,
                          "grupToplamKdvHaric",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full px-2 py-1 bg-transparent border-0 focus:bg-amber-50/50 dark:focus:bg-slate-800 focus:ring-1 focus:ring-amber-500 rounded text-xs text-right font-mono font-bold text-slate-900 dark:text-slate-100 outline-hidden"
                    />
                  </td>

                  {/* MALİYET YÜZDESİ */}
                  <td className="p-1 text-center border-r border-slate-200 dark:border-slate-800 font-mono font-semibold text-slate-600 dark:text-slate-400">
                    {row.maliyetYuzdesi > 0
                      ? `%${row.maliyetYuzdesi.toFixed(2)}`
                      : "-"}
                  </td>

                  {/* KAPALI OTOPARK TOPLAM TUTAR ( TL ) */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      value={row.kapaliOtoparkTutar}
                      onChange={(e) =>
                        updateCell(
                          row.id,
                          "kapaliOtoparkTutar",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full px-2 py-1 bg-transparent border-0 focus:bg-amber-50/50 dark:focus:bg-slate-800 focus:ring-1 focus:ring-amber-500 rounded text-xs text-right font-mono text-slate-800 dark:text-slate-200 outline-hidden"
                    />
                  </td>

                  {/* SOSYAL TESİS TOPLAM TUTAR ( TL ) */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      value={row.sosyalTesisTutar}
                      onChange={(e) =>
                        updateCell(
                          row.id,
                          "sosyalTesisTutar",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full px-2 py-1 bg-transparent border-0 focus:bg-amber-50/50 dark:focus:bg-slate-800 focus:ring-1 focus:ring-amber-500 rounded text-xs text-right font-mono text-slate-800 dark:text-slate-200 outline-hidden"
                    />
                  </td>

                  {/* TOPLAM TUTAR ( TL ) */}
                  <td className="p-2.5 text-right border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/40">
                    {row.rowToplamTutar > 0
                      ? formatCurrency(row.rowToplamTutar)
                      : "-"}
                  </td>

                  {/* ÇEVRE TANZİM ALT. TOPLAM TUTAR ( TL ) */}
                  <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="number"
                      value={row.cevreTanzimTutar}
                      onChange={(e) =>
                        updateCell(
                          row.id,
                          "cevreTanzimTutar",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full px-2 py-1 bg-transparent border-0 focus:bg-amber-50/50 dark:focus:bg-slate-800 focus:ring-1 focus:ring-amber-500 rounded text-xs text-right font-mono text-slate-800 dark:text-slate-200 outline-hidden"
                    />
                  </td>

                  {/* SİL */}
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Satırı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>

            {/* TOPLAM SATIRI */}
            <tfoot>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 text-xs">
                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 font-mono">
                  TOPLAM
                </td>
                <td className="p-2.5 border-r border-slate-200 dark:border-slate-700"></td>
                <td className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 font-mono font-bold">
                  {totals.grupToplam > 0 ? formatCurrency(totals.grupToplam) : "-"}
                </td>
                <td className="p-2.5 text-center border-r border-slate-200 dark:border-slate-700 font-mono">
                  {totals.grupToplam > 0 ? "%100.00" : "-"}
                </td>
                <td className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 font-mono font-bold">
                  {totals.otoparkToplam > 0 ? formatCurrency(totals.otoparkToplam) : "-"}
                </td>
                <td className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 font-mono font-bold">
                  {totals.sosyalToplam > 0 ? formatCurrency(totals.sosyalToplam) : "-"}
                </td>
                <td className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 font-mono font-black bg-slate-200/70 dark:bg-slate-700/60">
                  {totals.genelToplam > 0 ? formatCurrency(totals.genelToplam) : "-"}
                </td>
                <td className="p-2.5 text-right border-r border-slate-200 dark:border-slate-700 font-mono font-bold">
                  {totals.cevreToplam > 0 ? formatCurrency(totals.cevreToplam) : "-"}
                </td>
                <td className="p-2.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
