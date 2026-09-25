import React from "react";
import {
  TrendingUp,
  Coins,
  ShieldCheck,
  Wrench,
  Clock,
  PieChart as PieIcon,
  BarChart2,
  AlertTriangle,
  Building,
  CheckCircle2,
} from "lucide-react";
import { FixedAsset, AssetMaintenanceRecord } from "../../types";
import { formatTRY, getCategoryBadgeColor } from "../../data/fixedAssetsData";

interface FixedAssetsAnalyticsProps {
  assets: FixedAsset[];
  maintenances: AssetMaintenanceRecord[];
}

export const FixedAssetsAnalytics: React.FC<FixedAssetsAnalyticsProps> = ({
  assets,
  maintenances,
}) => {
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
    <div className="space-y-6">
      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Toplam Demirbaş Aktif Değeri</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{formatTRY(totalCost)}</div>
          <span className="text-[11px] text-slate-500 block">
            {totalAssetsCount} Kayıtlı Demirbaş • KDV Hariç
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Toplam Birikmiş Amortisman</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-600">
            {formatTRY(totalAccumulated)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Aktif İtfa Oranı: %
            {Math.round((totalAccumulated / Math.max(1, totalCost)) * 100)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Güncel Net Defter Değeri</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-600">
            {formatTRY(totalNetBookValue)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Bilanço 25 Maddi Duran Varlıklar
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Yıllık Amortisman Gider Payı</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-purple-700">
            {formatTRY(currentYearDeprEst)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            770/760/730 Gider Hesaplarına Pay
          </span>
        </div>
      </div>

      {/* Category Breakdown & Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Demirbaş Kategori ve Varlık Dağılımı
              </h4>
              <p className="text-xs text-slate-500">
                Tek Düzen Hesap Planı gruplarına göre maliyet ve adet analizi
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {Object.keys(categoryGroups).length} Grup
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryGroups).map(([catKey, info]) => {
              const percentage = Math.round((info.totalCost / Math.max(1, totalCost)) * 100);
              const colorInfo = getCategoryBadgeColor(catKey as any);

              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorInfo.dot}`} />
                      <span className="font-bold text-slate-800">{info.label}</span>
                      <span className="text-slate-400 font-medium">({info.count} Adet)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{formatTRY(info.totalCost)}</span>
                      <span className="text-[11px] text-slate-400 ml-2">%{percentage}</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorInfo.dot}`}
                      style={{ width: `${Math.max(2, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Status & Custody */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Operasyonel Durum</h4>
            <p className="text-xs text-slate-500">Kullanım ve tahsisat durumu</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-xs font-semibold text-blue-900">Personele Zimmetli</span>
                <span className="text-sm font-bold text-blue-700">{inCustodyCount} Adet</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-900">Aktif Ortak Kullanım</span>
                <span className="text-sm font-bold text-emerald-700">{activeCount} Adet</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Depoda / Boşta</span>
                <span className="text-sm font-bold text-slate-800">{inStorageCount} Adet</span>
              </div>
            </div>
          </div>

          {/* Upcoming Maintenance / Warranty */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2">
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
                    className="flex items-center justify-between text-[11px] bg-amber-50 p-2 rounded-lg text-amber-900"
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
