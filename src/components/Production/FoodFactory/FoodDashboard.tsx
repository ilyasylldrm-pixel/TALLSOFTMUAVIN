import React from "react";
import {
  ChefHat,
  CookingPot,
  UtensilsCrossed,
  Truck,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Flame,
  Thermometer,
  ShieldCheck,
  Building2,
  Share2,
  ArrowRight,
  TrendingUp,
  Cpu,
  Gauge,
} from "lucide-react";
import {
  FoodRecipe,
  FoodMenuPlan,
  FoodProductionOrder,
  FoodDispatchDelivery,
  FoodWitnessSample,
  Product,
  CompanySettings,
} from "../../../types";
import { formatCurrency } from "../../../utils/exportUtils";
import { useTheme } from "../../../context/ThemeContext";

interface FoodDashboardProps {
  recipes: FoodRecipe[];
  menus: FoodMenuPlan[];
  productionOrders: FoodProductionOrder[];
  dispatches: FoodDispatchDelivery[];
  samples: FoodWitnessSample[];
  products: Product[];
  settings: CompanySettings;
  onNavigateTab: (tab: "recipes" | "menus" | "orders" | "capacity" | "mrp" | "dispatches" | "samples" | "analysis" | "product_mrp") => void;
  onOpenNewOrderModal: () => void;
  onOpenNewRecipeModal: () => void;
  onOpenNewMenuModal: () => void;
  onOpenNewSampleModal: () => void;
  onOpenNewDispatchModal: () => void;
}

export const FoodDashboard: React.FC<FoodDashboardProps> = ({
  recipes,
  menus,
  productionOrders,
  dispatches,
  samples,
  products,
  settings,
  onNavigateTab,
  onOpenNewOrderModal,
  onOpenNewRecipeModal,
  onOpenNewMenuModal,
  onOpenNewSampleModal,
  onOpenNewDispatchModal,
}) => {
  const { theme } = useTheme();
  const todayStr = "2026-09-07"; // Can compare with live or today's date
  const todayOrders = productionOrders.filter((o) => o.date === todayStr || o.status !== "completed");
  const totalPortionsToday = todayOrders.reduce((sum, o) => sum + o.totalPortions, 0);

  const cookingOrders = todayOrders.filter((o) => o.status === "cooking");
  const activeDispatches = dispatches.filter((d) => d.status === "on_route" || d.status === "preparing" || d.status === "loaded");
  const totalTermoboxesInField = dispatches.reduce((acc, d) => {
    return acc + (d.deliveries || []).reduce((sum, del) => sum + (del.termoboxCount || 0), 0);
  }, 0);

  const activeWitnessSamples = samples.filter((s) => s.status === "retained");

  // Today's main menu plan
  const todayMenu = menus.find((m) => m.date === todayStr) || menus[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 2. KPI METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Bugünkü Toplam Porsiyon */}
        <div
          onClick={() => onNavigateTab("orders")}
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Bugünkü Üretim
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 border border-amber-200">
              <CookingPot className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {totalPortionsToday.toLocaleString("tr-TR")}{" "}
              <span className="text-xs sm:text-sm font-semibold text-slate-500">Porsiyon</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-2xs sm:text-xs text-amber-700 font-medium">
              <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse shrink-0" />
              <span className="truncate">{cookingOrders.length} iş emri kazanlarda pişiyor</span>
            </div>
          </div>
        </div>

        {/* 2. Dağıtımdaki Termobox / Sefer Tası */}
        <div
          onClick={() => onNavigateTab("dispatches")}
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Sevkiyat & Termobox
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-200">
              <Truck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {totalTermoboxesInField}{" "}
              <span className="text-xs sm:text-sm font-semibold text-slate-500">Termobox</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-2xs sm:text-xs text-blue-700 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{activeDispatches.length} araç sahada teslimatta</span>
            </div>
          </div>
        </div>

        {/* 3. Reçete & BOM Sayısı */}
        <div
          onClick={() => onNavigateTab("recipes")}
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Kayıtlı Yemek Reçetesi
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-200">
              <UtensilsCrossed className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {recipes.length}{" "}
              <span className="text-xs sm:text-sm font-semibold text-slate-500">Standart Yemek</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-2xs sm:text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Gramaj, fire payı ve kalori hesaplı</span>
            </div>
          </div>
        </div>

        {/* 4. Şahit Numune (72 Saat) */}
        <div
          onClick={() => onNavigateTab("samples")}
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-2xs sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Yasal Şahit Numune
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-purple-50 text-purple-600 border border-purple-200">
              <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeWitnessSamples.length}{" "}
              <span className="text-xs sm:text-sm font-semibold text-slate-500">Aktif Numune</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-2xs sm:text-xs text-purple-700 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">+4°C numune dolabında saklanıyor</span>
            </div>
          </div>
        </div>
      </div>

      {/* 💡 REÇETE MALİYET VE ÜRETİM KAPASİTESİ HIZLI ERİŞİM ŞERİTLERİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Reçete Maliyet Analizi */}
        <div
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Hammadde Maliyet & Gramaj Analizi</span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Analiz
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Porsiyon hammadde gramajı, fire payı ve parti kârlılık simülatörü.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("analysis")}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <span>Aç</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Üretim Kapasitesi & Makine Doluluk */}
        <div
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Üretim Kapasitesi & Makineler</span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  %88.5 Doluluk
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Kazan ve fırın doluluk oranları (OEE), planlanan vs gerçekleşen grafikleri.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("capacity")}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <span>Kapasiteyi İncele</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* İki Kolonlu Canlı Operasyon Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Günün 4 Kap Tabldot Menüsü ve Maliyeti (1 Kolon) */}
        <div
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="rounded-2xl border p-5 shadow-2xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Günün Tabldot Menüsü</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                {todayMenu.dayOfWeek} (Öğle)
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2.5 mb-4">{todayMenu.title}</p>

            <div className="space-y-2.5">
              {/* 1. Kap */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{todayMenu.items.soupRecipeName}</p>
                    <span className="text-slate-400 text-2xs">Çorba (250 ml)</span>
                  </div>
                </div>
                <span className="font-bold text-slate-700">165 kcal</span>
              </div>

              {/* 2. Kap */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{todayMenu.items.mainRecipeName}</p>
                    <span className="text-slate-400 text-2xs">Ana Yemek (Etli/Tavuklu 240g)</span>
                  </div>
                </div>
                <span className="font-bold text-slate-700">420 kcal</span>
              </div>

              {/* 3. Kap */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{todayMenu.items.sideRecipeName}</p>
                    <span className="text-slate-400 text-2xs">Yardımcı Yemek (180g)</span>
                  </div>
                </div>
                <span className="font-bold text-slate-700">285 kcal</span>
              </div>

              {/* 4. Kap */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{todayMenu.items.dessertOrSaladRecipeName}</p>
                    <span className="text-slate-400 text-2xs">Tatlı / Meyve (120g)</span>
                  </div>
                </div>
                <span className="font-bold text-slate-700">340 kcal</span>
              </div>
            </div>

            {/* Menü İstatistiği */}
            <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Porsiyon Başı Maliyet:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(todayMenu.totalCostPerPortion)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Porsiyon Satış Fiyatı:</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(todayMenu.sellingPricePerPortion)}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-amber-200/60 pt-1">
                <span>Toplam Enerji Değeri:</span>
                <span className="font-bold text-amber-900">{todayMenu.totalCalorie} kcal</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("menus")}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Haftalık Menü Takvimine Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sağ Kolon: Aktif Mutfak İş Emirleri ve Şantiye Dağıtımı (2 Kolon) */}
        <div
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          className="lg:col-span-2 rounded-2xl border p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CookingPot className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-slate-900 text-sm">Canlı Mutfak & Üretim İş Emirleri</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Tümünü Gör ({productionOrders.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayOrders.map((order) => {
              const statusBadge =
                order.status === "cooking"
                  ? { label: "Kazanlarda Pişiriliyor", bg: "bg-orange-50 text-orange-700 border-orange-200", icon: Flame }
                  : order.status === "ingredients_issued"
                  ? { label: "Hammadde Çıktı / Hazırlıkta", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock }
                  : order.status === "portioning"
                  ? { label: "Termoboxlara Porsiyonlanıyor", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: UtensilsCrossed }
                  : { label: "Sevkiyata Hazır", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 };

              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{order.orderNo}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusBadge.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Sorumlu: <strong className="text-slate-800">{order.headChefName}</strong></span>
                      <span>•</span>
                      <span>Çıkış: <strong className="text-slate-800">{order.scheduledDispatchTime}</strong></span>
                    </div>
                  </div>

                  {/* Menü ve Toplam Porsiyon */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">{order.menuTitle}</span>
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {order.totalPortions} Porsiyon
                    </span>
                  </div>

                  {/* Müşteri ve Şantiye Dağılımı */}
                  <div className="space-y-1.5">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                      Teslim Edilecek Firma ve Şantiyeler ({order.customerPortions.length} Nokta)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {order.customerPortions.map((cp, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <p className="font-semibold text-slate-800 truncate" title={cp.contactName}>
                            {cp.contactName}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-slate-500">
                            <span>{cp.portionCount} Porsiyon</span>
                            <span className="text-amber-700 font-medium">{cp.termoboxCount || 0} Termobox</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sevkiyat Durum Şeridi */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>
                Bugün planlanan <strong>{dispatches.length}</strong> sevkiyat seferi bulunuyor.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("dispatches")}
              className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Araç ve Sevkiyat Takibi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
