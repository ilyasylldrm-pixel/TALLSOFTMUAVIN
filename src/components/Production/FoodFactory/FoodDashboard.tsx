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

interface FoodDashboardProps {
  recipes: FoodRecipe[];
  menus: FoodMenuPlan[];
  productionOrders: FoodProductionOrder[];
  dispatches: FoodDispatchDelivery[];
  samples: FoodWitnessSample[];
  products: Product[];
  settings: CompanySettings;
  onNavigateTab: (tab: "recipes" | "menus" | "orders" | "mrp" | "dispatches" | "samples" | "analysis") => void;
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
    <div className="space-y-6">
      {/* Üst Karşılama ve Hızlı Butonlar */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 skew-x-12 transform pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase text-amber-100">
              <ChefHat className="w-3.5 h-3.5" />
              <span>Yemek Fabrikası & Endüstriyel Mutfak</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Mutfak ve Üretim Kontrol Paneli
            </h1>
            <p className="text-amber-100 text-sm max-w-2xl leading-relaxed">
              Porsiyon bazlı reçeteler, 4 kap tabldot menü planlama, mutfak iş emirleri, şantiye sefer tası ve termobox sevkiyatları ile 72 saatlik gıda şahit numuneleri tek ekrandan yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenNewOrderModal}
              className="bg-white hover:bg-amber-50 text-amber-900 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-700" />
              <span>Yeni Üretim Emri</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewRecipeModal}
              className="bg-amber-800/60 hover:bg-amber-800/80 border border-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-200" />
              <span>Reçete Ekle</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewMenuModal}
              className="bg-amber-800/60 hover:bg-amber-800/80 border border-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-200" />
              <span>Menü Planla</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("analysis")}
              className="bg-emerald-700/80 hover:bg-emerald-700 border border-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-emerald-200" />
              <span>Maliyet & Gramaj Analizi</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Bugünkü Toplam Porsiyon */}
        <div
          onClick={() => onNavigateTab("orders")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bugünkü Üretim
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
              <CookingPot className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalPortionsToday.toLocaleString("tr-TR")} <span className="text-sm font-normal text-slate-500">Porsiyon</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>{cookingOrders.length} iş emri şu anda kazanlarda pişiyor</span>
          </div>
        </div>

        {/* 2. Dağıtımdaki Termobox / Sefer Tası */}
        <div
          onClick={() => onNavigateTab("dispatches")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sevkiyat & Termobox
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalTermoboxesInField} <span className="text-sm font-normal text-slate-500">Konteyner / Termobox</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{activeDispatches.length} araç yolda şantiye dağıtımında</span>
          </div>
        </div>

        {/* 3. Reçete & BOM Sayısı */}
        <div
          onClick={() => onNavigateTab("recipes")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kayıtlı Yemek Reçetesi
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {recipes.length} <span className="text-sm font-normal text-slate-500">Standart Yemek</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gramaj, fire payı ve kalori hesaplı</span>
          </div>
        </div>

        {/* 4. Şahit Numune (72 Saat) */}
        <div
          onClick={() => onNavigateTab("samples")}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Yasal Şahit Numune
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeWitnessSamples.length} <span className="text-sm font-normal text-slate-500">Aktif Numune</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-700 font-medium">
            <Thermometer className="w-3.5 h-3.5 text-purple-600" />
            <span>+4°C numune dolabında saklanıyor</span>
          </div>
        </div>
      </div>

      {/* 💡 REÇETE MALİYET VE GRAMAJ ANALİZİ HIZLI ERİŞİM ŞERİDİ */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-slate-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Reçete Bazlı Hammadde Maliyet & Gramaj Analizi</span>
              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Yeni
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Porsiyon başı hammadde gramajları, çiğ/pişmiş fire oranları, birim maliyet kırılımları ve parti kârlılık simülatörü.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab("analysis")}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
        >
          <span>Analiz Raporunu Aç</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* İki Kolonlu Canlı Operasyon Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Günün 4 Kap Tabldot Menüsü ve Maliyeti (1 Kolon) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
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
