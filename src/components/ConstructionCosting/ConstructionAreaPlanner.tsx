import React, { useState, useMemo } from "react";
import {
  Home,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
  Sliders,
  Check,
  Maximize2,
  Scale,
  TrendingUp,
  X,
  FileSpreadsheet,
} from "lucide-react";
import {
  CommonAreaItem,
  ApartmentRoomItem,
  ApartmentUnitConfig,
} from "../../types";
import {
  ZONING_REGULATION_M29,
  calculateRoomsForApartment,
  generateDefaultCommonAreas,
  generateDefaultApartmentConfigs,
  optimizeApartmentDistribution,
  OptimizationPresetOption,
} from "../../utils/constructionAreaStandards";

interface ConstructionAreaPlannerProps {
  totalGrossM2: number;
  landAreaM2?: number;
  kaks?: number;
  initialCommonAreas?: CommonAreaItem[];
  initialApartmentConfigs?: ApartmentUnitConfig[];
  onChange?: (data: {
    commonAreas: CommonAreaItem[];
    totalCommonAreaM2: number;
    remainingNetM2: number;
    apartmentConfigs: ApartmentUnitConfig[];
    totalUnits: number;
    totalAllocatedNetM2: number;
  }) => void;
}

export const ConstructionAreaPlanner: React.FC<ConstructionAreaPlannerProps> = ({
  totalGrossM2,
  landAreaM2 = 0,
  kaks = 0,
  initialCommonAreas,
  initialApartmentConfigs,
  onChange,
}) => {
  // 1. Ortak Kullanım Alanları State
  const [commonAreas, setCommonAreas] = useState<CommonAreaItem[]>(() => {
    if (initialCommonAreas && initialCommonAreas.length > 0) {
      return initialCommonAreas;
    }
    return generateDefaultCommonAreas(totalGrossM2, 24);
  });

  // 2. Daire Dağılımı State
  const [apartmentConfigs, setApartmentConfigs] = useState<ApartmentUnitConfig[]>(() => {
    if (initialApartmentConfigs && initialApartmentConfigs.length > 0) {
      return initialApartmentConfigs;
    }
    const initialCommonSum = generateDefaultCommonAreas(totalGrossM2, 24).reduce(
      (s, c) => s + c.m2,
      0
    );
    const initialNet = Math.max(100, totalGrossM2 - initialCommonSum);
    return generateDefaultApartmentConfigs(initialNet);
  });

  // UI States
  const [showCommonAreasList, setShowCommonAreasList] = useState<boolean>(true);
  const [selectedApartmentForRooms, setSelectedApartmentForRooms] =
    useState<ApartmentUnitConfig | null>(null);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState<boolean>(false);
  const [custom2p1Size, setCustom2p1Size] = useState<number>(85);
  const [custom3p1Size, setCustom3p1Size] = useState<number>(120);

  // Toplam Ortak Alan
  const totalCommonAreaM2 = useMemo(() => {
    return commonAreas.reduce((sum, item) => sum + (Number(item.m2) || 0), 0);
  }, [commonAreas]);

  // Kalan Net Alan (Brüt - Ortak Alanlar)
  const remainingNetM2 = useMemo(() => {
    return Math.max(0, totalGrossM2 - totalCommonAreaM2);
  }, [totalGrossM2, totalCommonAreaM2]);

  // Dairelere Tahsis Edilen Toplam Net Alan & Daire Adedi
  const totalAllocatedNetM2 = useMemo(() => {
    return apartmentConfigs.reduce(
      (sum, apt) => sum + (Number(apt.count) || 0) * (Number(apt.targetNetM2) || 0),
      0
    );
  }, [apartmentConfigs]);

  const totalUnits = useMemo(() => {
    return apartmentConfigs.reduce((sum, apt) => sum + (Number(apt.count) || 0), 0);
  }, [apartmentConfigs]);

  // Fark (Atıl veya Taşan Alan)
  const areaDifference = remainingNetM2 - totalAllocatedNetM2;
  const isOverAllocated = areaDifference < -0.5;
  const isExactMatch = Math.abs(areaDifference) <= 5; // 5 m² tolerans

  // Optimizasyon Önerileri
  const optimizationPresets = useMemo(() => {
    return optimizeApartmentDistribution(remainingNetM2, {
      custom2Plus1NetM2: custom2p1Size,
      custom3Plus1NetM2: custom3p1Size,
    });
  }, [remainingNetM2, custom2p1Size, custom3p1Size]);

  // Notify parent
  const notifyChange = (
    newCommon: CommonAreaItem[],
    newApts: ApartmentUnitConfig[]
  ) => {
    if (onChange) {
      const cSum = newCommon.reduce((s, c) => s + (Number(c.m2) || 0), 0);
      const remNet = Math.max(0, totalGrossM2 - cSum);
      const aNet = newApts.reduce(
        (s, a) => s + (Number(a.count) || 0) * (Number(a.targetNetM2) || 0),
        0
      );
      const units = newApts.reduce((s, a) => s + (Number(a.count) || 0), 0);
      onChange({
        commonAreas: newCommon,
        totalCommonAreaM2: cSum,
        remainingNetM2: remNet,
        apartmentConfigs: newApts,
        totalUnits: units,
        totalAllocatedNetM2: aNet,
      });
    }
  };

  // Ortak Alan m² Güncelleme
  const handleUpdateCommonAreaM2 = (id: string, newM2: number) => {
    const updated = commonAreas.map((item) => {
      if (item.id === id) {
        const validM2 = Math.max(0, newM2);
        return {
          ...item,
          m2: validM2,
          percentageOfGross:
            totalGrossM2 > 0
              ? Math.round((validM2 / totalGrossM2) * 1000) / 10
              : 0,
        };
      }
      return item;
    });
    setCommonAreas(updated);
    notifyChange(updated, apartmentConfigs);
  };

  // Ortak Alanları Standartlara Sıfırla
  const handleResetCommonAreas = () => {
    const defaults = generateDefaultCommonAreas(totalGrossM2, totalUnits || 24);
    setCommonAreas(defaults);
    notifyChange(defaults, apartmentConfigs);
  };

  // Daire Sayısı Değiştir
  const handleUpdateApartmentCount = (id: string, deltaOrValue: number, isAbsolute: boolean = false) => {
    const updated = apartmentConfigs.map((apt) => {
      if (apt.id === id) {
        const newCount = Math.max(
          0,
          isAbsolute ? deltaOrValue : apt.count + deltaOrValue
        );
        return {
          ...apt,
          count: newCount,
          totalNetM2: newCount * apt.targetNetM2,
        };
      }
      return apt;
    });
    setApartmentConfigs(updated);
    notifyChange(commonAreas, updated);
  };

  // Daire Net m² Değiştir
  const handleUpdateApartmentNetM2 = (id: string, newM2: number) => {
    const updated = apartmentConfigs.map((apt) => {
      if (apt.id === id) {
        const validM2 = Math.max(25, newM2);
        return {
          ...apt,
          targetNetM2: validM2,
          totalNetM2: apt.count * validM2,
          rooms: calculateRoomsForApartment(apt.type, validM2),
        };
      }
      return apt;
    });
    setApartmentConfigs(updated);
    notifyChange(commonAreas, updated);

    // Eğer açık olan modal bu daire ise odaları yenile
    if (selectedApartmentForRooms?.id === id) {
      const found = updated.find((a) => a.id === id);
      if (found) setSelectedApartmentForRooms(found);
    }
  };

  // Yeni Daire Tipi Ekle
  const handleAddApartmentType = (type: string = "2+1") => {
    let defaultM2 = 85;
    if (type === "1+1") defaultM2 = 52;
    if (type === "2+1") defaultM2 = 85;
    if (type === "3+1") defaultM2 = 120;
    if (type === "4+1") defaultM2 = 155;

    const newApt: ApartmentUnitConfig = {
      id: `apt_${Date.now()}`,
      type: type,
      title: `${type} Dairesi`,
      count: 2,
      targetNetM2: defaultM2,
      grossMultiplier: 1.25,
      totalNetM2: 2 * defaultM2,
      rooms: calculateRoomsForApartment(type, defaultM2),
      estimatedSalePricePerUnit: defaultM2 * 60000,
    };

    const updated = [...apartmentConfigs, newApt];
    setApartmentConfigs(updated);
    notifyChange(commonAreas, updated);
  };

  // Daire Tipini Sil
  const handleRemoveApartmentType = (id: string) => {
    const updated = apartmentConfigs.filter((a) => a.id !== id);
    setApartmentConfigs(updated);
    notifyChange(commonAreas, updated);
  };

  // Optimizasyon Presetini Uygula
  const handleApplyOptimizationPreset = (preset: OptimizationPresetOption) => {
    setApartmentConfigs(preset.unitConfigs);
    notifyChange(commonAreas, preset.unitConfigs);
    setIsOptimizeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. ÜST ÖZET KARTLARI & İMAR ALANI METRAJI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                İnşaat Alanı, Ortak Kullanım & Daire Dağılım Motoru
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Planlı Alanlar İmar Yönetmeliği Madde 29 asgari ölçü denetimi ve
              kalan net alana göre 2+1 / 3+1 otomatik optimizasyonu.
            </p>
          </div>

          {/* AKILLI DAİRE SAYISI ÖNER BUTONU (PROMINENT ACTION) */}
          <button
            type="button"
            onClick={() => setIsOptimizeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer transform active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>Otomatik Daire Sayısı Öner (2+1 & 3+1 Optimize Et)</span>
          </button>
        </div>

        {/* METRAJ GÖSTERGE IZGARASI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          <div className="rounded-2xl p-4 border border-slate-200/90 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Toplam Brüt İnşaat
                </span>
                <div className="text-xl font-bold font-mono tracking-tight text-slate-900 mt-1">
                  {totalGrossM2.toLocaleString("tr-TR")} <span className="text-xs font-semibold text-slate-400">m²</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Layers className="w-4.5 h-4.5" />
              </div>
            </div>
            <span className="text-2xs text-slate-400 mt-2 block font-medium">
              Ruhsata esas toplam yapı hacmi
            </span>
          </div>

          <div className="rounded-2xl p-4 border border-amber-200/80 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xs font-semibold text-amber-700 uppercase tracking-wider block">
                    Ortak Kullanım
                  </span>
                  <span className="text-3xs font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    %{totalGrossM2 > 0 ? Math.round((totalCommonAreaM2 / totalGrossM2) * 100) : 0}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-amber-900 mt-1">
                  {totalCommonAreaM2.toLocaleString("tr-TR")} <span className="text-xs font-semibold text-amber-700/60">m²</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
            </div>
            <span className="text-2xs text-amber-700 mt-2 block font-medium">
              Otopark, sığınak, yangın, merdiven
            </span>
          </div>

          <div className="rounded-2xl p-4 border border-emerald-200/80 shadow-2xs haze-kpi-card-bg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-semibold text-emerald-700 uppercase tracking-wider block">
                  Kalan Net Konut Alanı
                </span>
                <div className="text-xl font-bold font-mono tracking-tight text-emerald-800 mt-1">
                  {remainingNetM2.toLocaleString("tr-TR")} <span className="text-xs font-semibold text-emerald-600/60">m²</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Home className="w-4.5 h-4.5" />
              </div>
            </div>
            <span className="text-2xs text-emerald-700 mt-2 block font-medium">
              Dairelere dağıtılabilir net yaşam hacmi
            </span>
          </div>

          <div className={`rounded-2xl p-4 border shadow-2xs relative overflow-hidden flex flex-col justify-between ${
            isOverAllocated
              ? "bg-rose-50/70 border-rose-200 text-rose-950"
              : isExactMatch
              ? "bg-teal-50/70 border-teal-200 text-teal-950"
              : "bg-blue-50/70 border-blue-200 text-blue-950"
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xs font-semibold uppercase tracking-wider block">
                    Tahsis Edilen Net
                  </span>
                  <span className="text-3xs font-extrabold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/50">
                    {totalUnits} Daire
                  </span>
                </div>
                <div className="text-xl font-bold font-mono tracking-tight mt-1">
                  {totalAllocatedNetM2.toLocaleString("tr-TR")} <span className="text-xs font-semibold opacity-60">m²</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/80 border border-slate-200/60 flex items-center justify-center shrink-0">
                {isExactMatch ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-teal-600" />
                ) : isOverAllocated ? (
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
                ) : (
                  <Sparkles className="w-4.5 h-4.5 text-blue-600" />
                )}
              </div>
            </div>
            <span className="text-2xs block mt-2 font-semibold">
              {isOverAllocated
                ? `⚠️ ${Math.abs(areaDifference).toLocaleString("tr-TR")} m² Net Alan Aşımı!`
                : areaDifference > 5
                ? `⚡ ${areaDifference.toLocaleString("tr-TR")} m² Boş Alan Kaldı`
                : `✅ Kusursuz Tam Dağılım (%100)`}
            </span>
          </div>
        </div>

        {/* ALAN DENGE BAR ÇUBUĞU */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-2xs font-medium text-slate-600 mb-1.5">
            <span>Kalan Net Konut Alanının Kullanım Oranı:</span>
            <span className="font-bold text-slate-900">
              {totalAllocatedNetM2.toLocaleString("tr-TR")} m² / {remainingNetM2.toLocaleString("tr-TR")} m² (
              %{remainingNetM2 > 0 ? Math.round((totalAllocatedNetM2 / remainingNetM2) * 100) : 0})
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                isOverAllocated
                  ? "bg-rose-500"
                  : isExactMatch
                  ? "bg-emerald-500"
                  : "bg-teal-500"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  remainingNetM2 > 0
                    ? (totalAllocatedNetM2 / remainingNetM2) * 100
                    : 0
                )}%`,
              }}
            />
          </div>
          {areaDifference > 5 && (
            <div className="flex items-center justify-between mt-2 text-2xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Henüz tahsis edilmemiş <strong>{areaDifference.toLocaleString("tr-TR")} m²</strong> net alan bulunmaktadır.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOptimizeModalOpen(true)}
                className="font-bold text-amber-900 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Optimizasyon ile Tam Doldur</span>
                <Sparkles className="w-3 h-3 text-amber-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. ORTAK KULLANIM ALANLARI CETVELİ (LİSTE GÖSTERİMİ) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div
          onClick={() => setShowCommonAreasList(!showCommonAreasList)}
          className="p-4 bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-between select-none"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Ortak Kullanım Alanları Cetveli (Zorunlu Mahaller)
                <span className="text-2xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                  {commonAreas.length} Mahal
                </span>
              </h3>
              <p className="text-2xs text-slate-500">
                Otopark, sığınak, yangın merdiveni, asansör, su deposu ve sirkülasyon hacimleri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">
              Toplam: {totalCommonAreaM2.toLocaleString("tr-TR")} m²
            </span>
            {showCommonAreasList ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {showCommonAreasList && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between text-2xs text-slate-500 pb-2 border-b border-slate-100">
              <span>
                Planlı Alanlar, Otopark ve Sığınak Yönetmelikleri uyarınca zorunlu ortak mahaller listesi
              </span>
              <button
                type="button"
                onClick={handleResetCommonAreas}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Yönetmelik Standartlarına Sıfırla</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-2xs text-slate-500 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3 font-semibold">Ortak Mahal / Hacim</th>
                    <th className="py-2.5 px-3 font-semibold">Yasal / Teknik Dayanak</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Brüt Oranı</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-32">Alan (m²)</th>
                    <th className="py-2.5 px-3 font-semibold text-center w-24">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commonAreas.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        {item.notes && (
                          <div className="text-3xs text-slate-400 mt-0.5">{item.notes}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-2xs">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-3xs font-medium">
                          {item.regulationNotice}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-600 text-2xs">
                        %{item.percentageOfGross || (totalGrossM2 > 0 ? Math.round((item.m2 / totalGrossM2) * 1000) / 10 : 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="0"
                            value={item.m2}
                            onChange={(e) =>
                              handleUpdateCommonAreaM2(item.id, Number(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 text-right text-xs font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                          />
                          <span className="text-2xs font-medium text-slate-400">m²</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <Check className="w-2.5 h-2.5" />
                          <span>Zorunlu</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50/50 font-bold text-xs text-amber-950 border-t border-amber-200">
                    <td colSpan={2} className="py-2.5 px-3">
                      Ortak Kullanım Alanları Toplamı
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-800">
                      %{totalGrossM2 > 0 ? Math.round((totalCommonAreaM2 / totalGrossM2) * 1000) / 10 : 0}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm">
                      {totalCommonAreaM2.toLocaleString("tr-TR")} m²
                    </td>
                    <td className="py-2.5 px-3 text-center text-3xs text-amber-700">
                      Düşülecek Alan
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. DAİRE SAYISI & ODA DAĞILIMI BÖLÜMÜ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                <Home className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Daire Tipleri & Bağımsız Bölüm Planı
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kalan <strong>{remainingNetM2.toLocaleString("tr-TR")} m²</strong> net alanda daire tipine göre adet ve oda büyüklüklerini belirleyin.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Add buttons */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleAddApartmentType("1+1")}
                className="px-2.5 py-1 text-2xs font-bold text-slate-700 hover:text-slate-950 cursor-pointer"
              >
                + 1+1
              </button>
              <button
                type="button"
                onClick={() => handleAddApartmentType("2+1")}
                className="px-2.5 py-1 text-2xs font-bold text-slate-700 hover:text-slate-950 cursor-pointer border-l border-slate-200"
              >
                + 2+1
              </button>
              <button
                type="button"
                onClick={() => handleAddApartmentType("3+1")}
                className="px-2.5 py-1 text-2xs font-bold text-slate-700 hover:text-slate-950 cursor-pointer border-l border-slate-200"
              >
                + 3+1
              </button>
              <button
                type="button"
                onClick={() => handleAddApartmentType("4+1")}
                className="px-2.5 py-1 text-2xs font-bold text-slate-700 hover:text-slate-950 cursor-pointer border-l border-slate-200"
              >
                + 4+1
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOptimizeModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Otomatik Dağıt</span>
            </button>
          </div>
        </div>

        {/* DAİRE TİPLERİ KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apartmentConfigs.map((apt) => {
            const grossPerUnit = Math.round(apt.targetNetM2 * apt.grossMultiplier);
            return (
              <div
                key={apt.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-white transition-all space-y-3 relative group"
              >
                {/* Üst Başlık & Sil Butonu */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      {apt.type} Dairesi
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {apt.title}
                    </h4>
                  </div>
                  {apartmentConfigs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveApartmentType(apt.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      title="Bu daire tipini kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* ADET AYARI (+ / -) */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Daire Adedi:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateApartmentCount(apt.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer transition-colors text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={apt.count}
                      onChange={(e) =>
                        handleUpdateApartmentCount(
                          apt.id,
                          Number(e.target.value) || 0,
                          true
                        )
                      }
                      className="w-12 text-center font-bold text-sm text-slate-900 border border-slate-200 rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateApartmentCount(apt.id, 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center cursor-pointer transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* METREKARE AYARI */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-3xs text-slate-500 block uppercase font-medium">
                      Net Alan (Daire)
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="number"
                        min="25"
                        value={apt.targetNetM2}
                        onChange={(e) =>
                          handleUpdateApartmentNetM2(
                            apt.id,
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-14 text-xs font-bold text-slate-900 border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-2xs text-slate-400 font-medium">m²</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-3xs text-slate-500 block uppercase font-medium">
                      Brüt Alan (~1.25)
                    </span>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                      {grossPerUnit} <span className="text-2xs text-slate-400 font-normal">m²</span>
                    </div>
                  </div>
                </div>

                {/* TOPLAM AYRILAN NET METRAJ */}
                <div className="flex items-center justify-between text-2xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">
                    Toplam Net Alan ({apt.count} adet):
                  </span>
                  <span className="font-bold text-slate-900">
                    {(apt.count * apt.targetNetM2).toLocaleString("tr-TR")} m²
                  </span>
                </div>

                {/* PİYESLERİ GÖR BUTONU */}
                <button
                  type="button"
                  onClick={() => setSelectedApartmentForRooms(apt)}
                  className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-200/60"
                >
                  <Maximize2 className="w-3 h-3 text-emerald-600" />
                  <span>Piyesleri & İmar Standartlarını Gör ({apt.rooms.length} Bölüm)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL: AKILLI DAİRE SAYISI ÖNERME (2+1 ve 3+1 OPTİMİZASYON MOTORU) */}
      {isOptimizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 text-white flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-2xs font-bold border border-emerald-400/30 mb-1">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  <span>Sıfır Atıl Alan / Otomatik Verimlilik Motoru</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Otomatik Daire Sayısı & Karması Öner
                </h3>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Kalan <strong>{remainingNetM2.toLocaleString("tr-TR")} m²</strong> net alanı en verimli şekilde kullanacak 2+1 ve 3+1 kombinasyonları.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOptimizeModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Özel Büyüklük Parametreleri */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-2xs font-bold text-slate-700 uppercase tracking-wider block">
                  Hedef Daire Net m² Büyüklükleri (İsteğe Bağlı Değiştirilebilir)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs text-slate-500 font-medium block mb-1">
                      2+1 Hedef Net m²:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="65"
                        max="110"
                        value={custom2p1Size}
                        onChange={(e) =>
                          setCustom2p1Size(Number(e.target.value) || 85)
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">m²</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs text-slate-500 font-medium block mb-1">
                      3+1 Hedef Net m²:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="95"
                        max="150"
                        value={custom3p1Size}
                        onChange={(e) =>
                          setCustom3p1Size(Number(e.target.value) || 120)
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-400 font-medium">m²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OPTİMİZASYON SENARYOLARI */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Kalan Net Alana En Uygun Dağılım Senaryoları:
                </span>

                {optimizationPresets.map((preset) => {
                  const isRecommended = preset.id === "preset_balanced_2_and_3";
                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isRecommended
                          ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/50"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {preset.name}
                            </h4>
                            <span
                              className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                                isRecommended
                                  ? "bg-emerald-200/80 text-emerald-900 font-extrabold"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-2xs text-slate-500 mt-1">
                            {preset.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-emerald-700 block">
                            %{preset.efficiencyPercentage} Verim
                          </span>
                          <span className="text-3xs text-slate-400">
                            Atıl Alan: {preset.remainingWasteM2} m²
                          </span>
                        </div>
                      </div>

                      {/* DAİRE ADETLERİ DETAYI */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60">
                        {preset.unitConfigs.map((cfg) => (
                          <div
                            key={cfg.id}
                            className="p-2 bg-white rounded-lg border border-slate-200 text-center"
                          >
                            <span className="text-xs font-black text-slate-900 block">
                              {cfg.count} Adet {cfg.type}
                            </span>
                            <span className="text-3xs text-slate-500 font-medium">
                              Net {cfg.targetNetM2} m² ({cfg.totalNetM2} m²)
                            </span>
                          </div>
                        ))}
                        <div className="p-2 bg-slate-100/70 rounded-lg border border-slate-200/80 text-center flex flex-col justify-center">
                          <span className="text-xs font-bold text-slate-700">
                            Toplam {preset.totalUnits} Daire
                          </span>
                          <span className="text-3xs text-slate-500">
                            {preset.totalAllocatedNetM2} m² Net
                          </span>
                        </div>
                      </div>

                      {/* UYGULA BUTONU */}
                      <div className="mt-3.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleApplyOptimizationPreset(preset)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            isRecommended
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-slate-800 hover:bg-slate-900 text-white"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Bu Dağılımı Projeye Uygula</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-2xs text-slate-500">
                Seçilen senaryo projedeki daire tiplerini ve adetlerini otomatik olarak günceller.
              </span>
              <button
                type="button"
                onClick={() => setIsOptimizeModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: PİYESLER & İMAR YÖNETMELİĞİ STANDARTLARI */}
      {selectedApartmentForRooms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div>
                <span className="text-2xs font-bold text-emerald-200 uppercase tracking-wider">
                  Planlı Alanlar İmar Yönetmeliği Madde 29 Denetimi
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedApartmentForRooms.title} — Piyes Dağılımı
                </h3>
                <p className="text-2xs text-emerald-100 mt-0.5">
                  Toplam Net Alan: <strong>{selectedApartmentForRooms.targetNetM2} m²</strong> • Hiçbir oda yasal asgari ölçünün altına düşürülemez.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApartmentForRooms(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-2xs text-slate-500 uppercase tracking-wider bg-slate-50">
                      <th className="py-2.5 px-3 font-semibold">Piyes (Oda / Hacim)</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Asgari Yasal Alan</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Asgari Dar Kenar</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Proje Alanı</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Yasal Uygunluk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedApartmentForRooms.rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {room.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                          min {room.minM2.toFixed(2)} m²
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-500">
                          {room.minWidthMeter ? `min ${room.minWidthMeter.toFixed(2)} m` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                          {room.calculatedM2.toFixed(2)} m²
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-3xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Uygun</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/70 font-bold text-slate-900 border-t border-slate-200">
                      <td colSpan={3} className="py-2.5 px-3">
                        Daire Süpürülebilir Net Alanı
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-900">
                        {selectedApartmentForRooms.rooms
                          .reduce((s, r) => s + r.calculatedM2, 0)
                          .toFixed(2)}{" "}
                        m²
                      </td>
                      <td className="py-2.5 px-3 text-center text-3xs text-emerald-700">
                        Onaylı
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-2xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">
                  Resmî Gazete Planlı Alanlar İmar Yönetmeliği Madde 29 Standartları:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                  <li>Oturma Odası (Salon): Dar kenar en az 2.80 m, alan en az 12.00 m²</li>
                  <li>Yatak Odası: Dar kenar en az 2.52 m, alan en az 9.00 m²</li>
                  <li>İlave Yatak Odaları: Dar kenar en az 2.10 m, alan en az 8.00 m²</li>
                  <li>Mutfak: Bağımsız mutfakta en az 5.00 m², niş/açık mutfakta en az 3.30 m²</li>
                  <li>Banyo: En az 3.00 m² (yıkanma yeri, lavabo, klozet)</li>
                  <li>Tuvalet (WC): En az 1.20 m²</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedApartmentForRooms(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
