import React from "react";
import {
  TrendingUp,
  Coins,
  ShieldCheck,
  Wrench,
  Clock,
  BarChart2,
  AlertTriangle,
  Building,
  CheckCircle2,
  PieChart as PieIcon,
} from "lucide-react";
import { FixedAsset, AssetMaintenanceRecord } from "../../types";
import { formatTRY, getCategoryBadgeColor } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";

interface FixedAssetsAnalyticsProps {
  assets: FixedAsset[];
  maintenances: AssetMaintenanceRecord[];
}

export const FixedAssetsAnalytics: React.FC<FixedAssetsAnalyticsProps> = ({
  assets,
  maintenances,
}) => {
  const { theme } = useTheme();

  const totalCost = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const totalAccumulated = assets.reduce(
    (sum, a) => sum + (a.accumulatedDepreciation || 0),
    0
  );
  const totalNetBookValue = assets.reduce((sum, a) => sum + (a.netBookValue || 0), 0);
  const totalAssetsCount = assets.length;

  // Active year depreciation estimated
  const currentYearDeprEst = assets.reduce((sum, a) => {
    if (a.depreciationMethod === "normal") {
      return sum + (a.purchaseCost || 0) / Math.max(1, a.usefulLifeYears || 5);
    }
    return sum + ((a.netBookValue || 0) * (a.depreciationRate || 20)) / 100;
  }, 0);

  // Group by category
  const categoryGroups: { [key: string]: { label: string; count: number; totalCost: number } } = {};
  assets.forEach((a) => {
    const key = a.category;
    if (!categoryGroups[key]) {
      categoryGroups[key] = {
        label: a.categoryLabel || a.category,
        count: 0,
        totalCost: 0,
      };
    }
    categoryGroups[key].count += 1;
    categoryGroups[key].totalCost += a.purchaseCost || 0;
  });

  // Upcoming warranties (next 90 days)
  const today = new Date();
  const ninetyDaysLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const upcomingWarranties = assets.filter((a) => {
    if (!a.warrantyEndDate) return false;
    const end = new Date(a.warrantyEndDate);
    return end >= today && end <= ninetyDaysLater;
  });

  const inCustodyCount = assets.filter((a) => a.status === "in_custody").length;
  const activeCount = assets.filter((a) => a.status === "active").length;
  const inStorageCount = assets.filter((a) => a.status === "in_storage").length;

  return (
    <div className="space-y-4">
      {/* 1. 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          className="p-5 rounded-2xl border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Toplam Aktif Değeri</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {formatTRY(totalCost)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
            {totalAssetsCount} Kayıtlı Demirbaş · KDV Hariç
          </span>
        </div>

        <div
          className="p-5 rounded-2xl border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Birikmiş Amortisman</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
            {formatTRY(totalAccumulated)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono font-medium">
            Aktif İtfa Oranı: %{Math.round((totalAccumulated / Math.max(1, totalCost)) * 100)}
          </span>
        </div>

        <div
          className="p-5 rounded-2xl border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Net Defter Değeri</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {formatTRY(totalNetBookValue)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
            Bilanço 25 Maddi Duran Varlıklar
          </span>
        </div>

        <div
          className="p-5 rounded-2xl border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 haze-kpi-card-bg relative overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Cari Yıl Amortisman Gideri</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
            {formatTRY(currentYearDeprEst)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
            770/760/730 Gider Hesaplarına Pay
          </span>
        </div>
      </div>

      {/* 2. Category Breakdown & Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Breakdown List */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5 shadow-2xs space-y-4 transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Demirbaş Kategori ve Varlık Dağılımı
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tek Düzen Hesap Planı gruplarına göre maliyet ve adet analizi
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">
              {Object.keys(categoryGroups).length} Grup
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryGroups).map(([catKey, info]) => {
              const percentage = Math.round((info.totalCost / Math.max(1, totalCost)) * 100);

              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{info.label}</span>
                      <span className="text-slate-400 font-medium">({info.count} Adet)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                        {formatTRY(info.totalCost)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2 font-mono">%{percentage}</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-indigo-600 dark:bg-indigo-500"
                      style={{ width: `${Math.max(2, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Status & Custody */}
        <div
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Operasyonel Durum</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Kullanım ve tahsisat durumu</p>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">Personele Zimmetli</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono">{inCustodyCount} Adet</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Aktif Ortak Kullanım</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">{activeCount} Adet</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Depoda / Boşta</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{inStorageCount} Adet</span>
              </div>
            </div>
          </div>

          {/* Upcoming Maintenance / Warranty */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Yaklaşan Garanti Bitişleri (90 Gün)</span>
            </div>

            {upcomingWarranties.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                90 gün içerisinde garantisi bitecek demirbaş bulunmuyor.
              </p>
            ) : (
              <div className="space-y-1.5">
                {upcomingWarranties.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between text-[11px] bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg text-amber-900 dark:text-amber-200 border border-amber-200/50 dark:border-amber-900/30"
                  >
                    <span className="font-semibold truncate max-w-[170px]">{w.name}</span>
                    <span className="font-mono">{w.warrantyEndDate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
