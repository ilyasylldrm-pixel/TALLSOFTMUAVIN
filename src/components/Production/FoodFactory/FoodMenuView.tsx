import React, { useState, useMemo } from "react";
import {
  Calendar,
  Plus,
  Share2,
  Printer,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Flame,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Sparkles,
  Users,
  Coffee,
  Utensils,
  Moon,
  Search,
  Download,
  Eye,
  X,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { FoodMenuPlan, FoodRecipe } from "../../../types";
import { formatCurrency } from "../../../utils/exportUtils";
import { MONTH_SUMMARY_250, ONE_MONTH_SCHEDULE_RAW } from "../../../data/oneMonthFoodMenuData";

interface FoodMenuViewProps {
  menus: FoodMenuPlan[];
  recipes: FoodRecipe[];
  onOpenNewMenuModal: () => void;
  onEditMenu: (menu: FoodMenuPlan) => void;
  onDeleteMenu: (menuId: string) => void;
  onToggleMenuLock: (menuId: string) => void;
  onTriggerWorkOrder?: (menu?: FoodMenuPlan) => void;
}

export const FoodMenuView: React.FC<FoodMenuViewProps> = ({
  menus,
  recipes,
  onOpenNewMenuModal,
  onEditMenu,
  onDeleteMenu,
  onToggleMenuLock,
  onTriggerWorkOrder,
}) => {
  // Filtreler
  const [mealTypeFilter, setMealTypeFilter] = useState<"all" | "breakfast" | "lunch" | "dinner">("all");
  const [weekFilter, setWeekFilter] = useState<"all" | "w1" | "w2" | "w3" | "w4" | "w5">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMonthTableModalOpen, setIsMonthTableModalOpen] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(250);

  // Gün hesaplaması (tarihten veya id'den gün numarasını çıkarma)
  const getDayNumber = (menu: FoodMenuPlan) => {
    // Menu title'da "X. Gün" veya date '2026-09-XX' var
    const dayMatch = menu.title.match(/(\d+)\.\s*Gün/);
    if (dayMatch) return parseInt(dayMatch[1], 10);
    const dateMatch = menu.date.match(/-(\d{2})$/);
    if (dateMatch) return parseInt(dateMatch[1], 10);
    return 1;
  };

  // Filtrelenmiş menüler
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      // 1. Öğün Tipi Filtresi
      if (mealTypeFilter !== "all" && menu.mealType !== mealTypeFilter) {
        return false;
      }

      // 2. Hafta Filtresi
      const dayNum = getDayNumber(menu);
      if (weekFilter === "w1" && (dayNum < 1 || dayNum > 7)) return false;
      if (weekFilter === "w2" && (dayNum < 8 || dayNum > 14)) return false;
      if (weekFilter === "w3" && (dayNum < 15 || dayNum > 21)) return false;
      if (weekFilter === "w4" && (dayNum < 22 || dayNum > 28)) return false;
      if (weekFilter === "w5" && (dayNum < 29 || dayNum > 30)) return false;

      // 3. Arama Filtresi
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matchesTitle = menu.title.toLowerCase().includes(query);
        const matchesDay = menu.dayOfWeek.toLowerCase().includes(query);
        const matchesDate = menu.date.includes(query);
        const matchesItems =
          (menu.items.soupRecipeName && menu.items.soupRecipeName.toLowerCase().includes(query)) ||
          (menu.items.mainRecipeName && menu.items.mainRecipeName.toLowerCase().includes(query)) ||
          (menu.items.sideRecipeName && menu.items.sideRecipeName.toLowerCase().includes(query)) ||
          (menu.items.dessertOrSaladRecipeName && menu.items.dessertOrSaladRecipeName.toLowerCase().includes(query));

        if (!matchesTitle && !matchesDay && !matchesDate && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [menus, mealTypeFilter, weekFilter, searchTerm]);

  // Sayaçlar
  const counts = useMemo(() => {
    const total = menus.length;
    const breakfast = menus.filter((m) => m.mealType === "breakfast").length;
    const lunch = menus.filter((m) => m.mealType === "lunch").length;
    const dinner = menus.filter((m) => m.mealType === "dinner").length;
    return { total, breakfast, lunch, dinner };
  }, [menus]);

  // Format menu for WhatsApp sharing
  const handleShareWhatsApp = (menu: FoodMenuPlan) => {
    const isBreakfast = menu.mealType === "breakfast";
    let text = "";

    if (isBreakfast) {
      text =
        `🍳 *GÜNLÜK TABLDOT KAHVALTI* - ${menu.dayOfWeek} (${menu.date})\n` +
        `Kişi Sayısı: ${portionMultiplier} Kişi\n` +
        `--------------------------------\n` +
        `🍳 *Sıcak / Yumurta:* ${menu.items.soupRecipeName}\n` +
        `🧀 *Peynir & Şarküteri:* ${menu.items.mainRecipeName}\n` +
        `🍯 *Tatlı / Reçel:* ${menu.items.sideRecipeName}\n` +
        `☕ *İçecek & Ekmek:* ${menu.items.dessertOrSaladRecipeName}\n` +
        `🔥 *Toplam Enerji:* ${menu.totalCalorie} kcal\n` +
        (menu.allergensList ? `⚠️ *Alerjen:* ${menu.allergensList.join(", ")}\n` : "") +
        `--------------------------------\n` +
        `*Afiyet Olsun!* (Yemek Fabrikası & Catering)`;
    } else {
      text =
        `📋 *GÜNLÜK TABLDOT MENÜSÜ* - ${menu.dayOfWeek} (${menu.date}) [${menu.mealType === "dinner" ? "Akşam" : "Öğle"}]\n` +
        `Kişi Sayısı: ${portionMultiplier} Kişi\n` +
        `--------------------------------\n` +
        `🍲 *1. Kap:* ${menu.items.soupRecipeName}\n` +
        `🥩 *2. Kap:* ${menu.items.mainRecipeName}\n` +
        `🍚 *3. Kap:* ${menu.items.sideRecipeName}\n` +
        `🍮 *4. Kap:* ${menu.items.dessertOrSaladRecipeName}\n` +
        (menu.items.additionalItemNames ? `🥖 *İkram:* ${menu.items.additionalItemNames.join(", ")}\n` : "") +
        `🔥 *Toplam Enerji:* ${menu.totalCalorie} kcal\n` +
        (menu.allergensList ? `⚠️ *Alerjen:* ${menu.allergensList.join(", ")}\n` : "") +
        `--------------------------------\n` +
        `*Afiyet Olsun!* (Yemek Fabrikası & Catering)`;
    }

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
  };

  // CSV Dışa Aktarma
  const handleExportMonthCsv = () => {
    let csv = "Gün;Tarih;Hafta Günü;Öğün;Yemek 1;Yemek 2;Yemek 3;Yemek 4;Kalori (kcal);Porsiyon Maliyeti (TL);250 Kişilik Maliyet (TL)\n";

    menus.forEach((m) => {
      const dayNum = getDayNumber(m);
      const mealName = m.mealType === "breakfast" ? "Kahvaltı" : m.mealType === "lunch" ? "Öğle" : "Akşam";
      const total250 = (m.totalCostPerPortion * portionMultiplier).toFixed(2);
      csv += `${dayNum};${m.date};${m.dayOfWeek};${mealName};"${m.items.soupRecipeName || ""}";"${m.items.mainRecipeName || ""}";"${m.items.sideRecipeName || ""}";"${m.items.dessertOrSaladRecipeName || ""}";${m.totalCalorie};${m.totalCostPerPortion.toFixed(2)};${total250}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `1_Aylik_250_Kisilik_Yemek_Menuleri.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-editorial font-medium text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span>250 Kişilik Aylık Menü & Tabldot Planlama</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Şantiyeler ve fabrikalar için 30 günlük Kahvaltı, 4 Kap Öğle ve Akşam yemeği planı, kalori ve bütçe kontrolü.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMonthTableModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-300"
          >
            <Eye className="w-4 h-4 text-slate-700" />
            <span>30 Günlük Aylık Tablo</span>
          </button>

          <button
            type="button"
            onClick={handleExportMonthCsv}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer border border-emerald-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel / CSV İndir</span>
          </button>

          {onTriggerWorkOrder && (
            <button
              type="button"
              onClick={() => onTriggerWorkOrder(menus[0])}
              className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 border border-slate-800"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>⚡ Mutfak İş Emri Tetikle</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewMenuModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Menü Planla</span>
          </button>
        </div>
      </div>

      {/* 250 Kişilik Aylık Planlama Özet KPI Kartı */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-amber-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">250 Kişilik 1 Aylık Tam Hizmet Planı</span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  30 Gün • 3 Öğün • 90 Menü
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Günde 750 tabak • Aylık toplam <strong>22.500 porsiyon</strong> yemek üretimi ve lojistiği.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">Hedef Kişi:</span>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs text-xs font-bold text-slate-800">
              <input
                type="number"
                min="50"
                max="5000"
                step="25"
                value={portionMultiplier}
                onChange={(e) => setPortionMultiplier(Math.max(1, parseInt(e.target.value, 10) || 250))}
                className="w-16 text-center font-bold text-amber-700 bg-transparent focus:outline-none"
              />
              <span>Kişi</span>
            </div>
          </div>
        </div>

        {/* 4 Ana Metrik Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Günlük Ortalama Enerji</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900">~{MONTH_SUMMARY_250.avgDailyCalorie}</span>
              <span className="text-xs font-semibold text-orange-600">kcal/gün</span>
            </div>
            <span className="text-2xs text-slate-400 block mt-1">Kahvaltı 450 + Öğle 1.150 + Akşam 980</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Kişi Başı Günlük Maliyet</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900">{formatCurrency(MONTH_SUMMARY_250.avgDailyCostPerPerson)}</span>
              <span className="text-xs font-semibold text-slate-500">/ 3 Öğün</span>
            </div>
            <span className="text-2xs text-slate-400 block mt-1">Kahv: 28,5₺ • Öğle: 112₺ • Akşam: 104,5₺</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">{portionMultiplier} Kişi 1 Aylık Bütçe</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-amber-800">
                {formatCurrency((MONTH_SUMMARY_250.avgDailyCostPerPerson * portionMultiplier * 30))}
              </span>
            </div>
            <span className="text-2xs text-slate-400 block mt-1">Hammadde ve üretim doğrudan maliyeti</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">Aylık Tahmini Ciro & Kâr</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency((510 * portionMultiplier * 30))}
              </span>
              <span className="text-2xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md ml-1">%52 Kâr</span>
            </div>
            <span className="text-2xs text-slate-400 block mt-1">Brüt Kâr: ~{formatCurrency((265 * portionMultiplier * 30))}</span>
          </div>
        </div>
      </div>

      {/* Filtre ve Arama Çubuğu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Öğün Tipi Segment Butonları */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMealTypeFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mealTypeFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            Tüm Öğünler ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setMealTypeFilter("breakfast")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mealTypeFilter === "breakfast"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>🍳 Kahvaltı ({counts.breakfast})</span>
          </button>
          <button
            type="button"
            onClick={() => setMealTypeFilter("lunch")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mealTypeFilter === "lunch"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>🍲 Öğle Yemeği ({counts.lunch})</span>
          </button>
          <button
            type="button"
            onClick={() => setMealTypeFilter("dinner")}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mealTypeFilter === "dinner"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>🌙 Akşam Yemeği ({counts.dinner})</span>
          </button>
        </div>

        {/* Hafta Filtresi & Arama */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hafta Seçici */}
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">📅 Tüm Ay (30 Gün)</option>
            <option value="w1">1. Hafta (Gün 1-7)</option>
            <option value="w2">2. Hafta (Gün 8-14)</option>
            <option value="w3">3. Hafta (Gün 15-21)</option>
            <option value="w4">4. Hafta (Gün 22-28)</option>
            <option value="w5">5. Hafta (Gün 29-30)</option>
          </select>

          {/* Arama Inputu */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Yemek, çorba, gün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Sonuç Özeti */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Listelenen: <strong>{filteredMenus.length}</strong> menü planı
        </span>
        <span>
          {portionMultiplier} Kişilik Toplam Maliyet:{" "}
          <strong className="text-slate-800">
            {formatCurrency(
              filteredMenus.reduce((sum, m) => sum + m.totalCostPerPortion * portionMultiplier, 0)
            )}
          </strong>
        </span>
      </div>

      {/* Menü Kartları Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredMenus.map((menu) => {
          const profit = menu.sellingPricePerPortion - menu.totalCostPerPortion;
          const profitMargin = Math.round((profit / menu.sellingPricePerPortion) * 100);
          const isBreakfast = menu.mealType === "breakfast";
          const isDinner = menu.mealType === "dinner";
          const dayNum = getDayNumber(menu);
          const costForTarget = menu.totalCostPerPortion * portionMultiplier;

          return (
            <div
              key={menu.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                menu.isLocked ? "border-slate-200" : "border-amber-200 ring-1 ring-amber-400/20"
              }`}
            >
              {/* Gün ve Başlık */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-9 h-9 rounded-xl text-white font-bold text-sm flex items-center justify-center shadow-2xs ${
                        isBreakfast
                          ? "bg-amber-600"
                          : isDinner
                          ? "bg-indigo-600"
                          : "bg-orange-600"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-sm">{menu.dayOfWeek}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-3xs font-bold uppercase tracking-wider ${
                            isBreakfast
                              ? "bg-amber-100 text-amber-800"
                              : isDinner
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {isBreakfast ? "Kahvaltı" : isDinner ? "Akşam Yemeği" : "Öğle Yemeği"}
                        </span>
                      </div>
                      <span className="text-2xs text-slate-500">
                        {menu.date} • {portionMultiplier} Kişilik Servis
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleMenuLock(menu.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                      title={menu.isLocked ? "Menü Kilitli (Değiştirilemez)" : "Menü Taslak (Düzenlenebilir)"}
                    >
                      {menu.isLocked ? <Lock className="w-4 h-4 text-emerald-600" /> : <Unlock className="w-4 h-4 text-amber-500" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(menu)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      title="WhatsApp ile Paylaş"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditMenu(menu)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                      title="Menüyü Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${menu.title}" menüsünü silmek istediğinize emin misiniz?`)) {
                          onDeleteMenu(menu.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Menüyü Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-800 mt-2.5 mb-3">{menu.title}</p>

                {/* Yemek Öğeleri İçeriği (Kahvaltı veya 4 Kap) */}
                <div className="space-y-2 text-xs">
                  {/* 1. Öğe */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md font-bold text-2xs flex items-center justify-center shrink-0 ${
                          isBreakfast ? "bg-amber-100 text-amber-900" : "bg-orange-100 text-orange-900"
                        }`}
                      >
                        1
                      </span>
                      <div>
                        <span className="text-3xs text-slate-400 block font-medium">
                          {isBreakfast ? "Sıcak / Yumurta" : "1. Kap (Çorba)"}
                        </span>
                        <strong className="text-slate-800 font-semibold">{menu.items.soupRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. Öğe */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md font-bold text-2xs flex items-center justify-center shrink-0 ${
                          isBreakfast ? "bg-yellow-100 text-yellow-900" : "bg-rose-100 text-rose-900"
                        }`}
                      >
                        2
                      </span>
                      <div>
                        <span className="text-3xs text-slate-400 block font-medium">
                          {isBreakfast ? "Peynir & Şarküteri" : "2. Kap (Ana Yemek)"}
                        </span>
                        <strong className="text-slate-800 font-semibold">{menu.items.mainRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3. Öğe */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md font-bold text-2xs flex items-center justify-center shrink-0 ${
                          isBreakfast ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        3
                      </span>
                      <div>
                        <span className="text-3xs text-slate-400 block font-medium">
                          {isBreakfast ? "Bal / Reçel / Tatlı" : "3. Kap (Yardımcı Yemek)"}
                        </span>
                        <strong className="text-slate-800 font-semibold">{menu.items.sideRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 4. Öğe */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md font-bold text-2xs flex items-center justify-center shrink-0 ${
                          isBreakfast ? "bg-blue-100 text-blue-900" : "bg-teal-100 text-teal-900"
                        }`}
                      >
                        4
                      </span>
                      <div>
                        <span className="text-3xs text-slate-400 block font-medium">
                          {isBreakfast ? "İçecek & Unlu Mamul" : "4. Kap (Tatlı / Salata / Meyve)"}
                        </span>
                        <strong className="text-slate-800 font-semibold">{menu.items.dessertOrSaladRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ek İkramlar */}
                  {menu.items.additionalItemNames && menu.items.additionalItemNames.length > 0 && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-amber-50/50 border border-amber-100 text-2xs text-slate-600 flex items-center justify-between">
                      <span className="text-3xs text-slate-400 font-medium">Ekmek & Ekstra:</span>
                      <span className="font-semibold text-amber-900">{menu.items.additionalItemNames.join(" + ")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Alt Metrikler */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-3xs text-slate-500 block">Porsiyon</span>
                    <span className="font-bold text-slate-800">{formatCurrency(menu.totalCostPerPortion)}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-slate-500 block">{portionMultiplier} Kişi Toplam</span>
                    <span className="font-bold text-amber-900">{formatCurrency(costForTarget)}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-slate-500 block">Kâr Marjı</span>
                    <span className="font-bold text-emerald-700">%{profitMargin}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-2xs text-slate-500 px-1">
                  <span className="flex items-center gap-1 font-semibold text-amber-800">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {menu.totalCalorie} kcal
                  </span>
                  {menu.allergensList && menu.allergensList.length > 0 && (
                    <span className="text-3xs text-slate-400 truncate max-w-[170px]" title={menu.allergensList.join(", ")}>
                      ⚠️ {menu.allergensList.join(", ")}
                    </span>
                  )}
                </div>

                {onTriggerWorkOrder && (
                  <button
                    type="button"
                    onClick={() => onTriggerWorkOrder(menu)}
                    className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Mutfak İş Emri Oluştur ({portionMultiplier} Kişi)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 30 Günlük Aylık Menü Tablosu Modal */}
      {isMonthTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span>250 Kişilik 1 Aylık Tam Yemek Listesi (30 Gün • 3 Öğün)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Endüstriyel mutfak ve şantiye şartnamesine uygun 30 günlük Kahvaltı, Öğle ve Akşam menü dağılımı.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Yazdır</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMonthCsv}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel İndir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonthTableModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content / Table */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Tablo */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3 w-16 text-center">Gün</th>
                      <th className="p-3 w-28">Tarih</th>
                      <th className="p-3 w-1/3 bg-amber-50/60 text-amber-950">🍳 Kahvaltı Menüsü</th>
                      <th className="p-3 w-1/3 bg-orange-50/60 text-orange-950">🍲 Öğle Yemeği (4 Kap)</th>
                      <th className="p-3 w-1/3 bg-indigo-50/60 text-indigo-950">🌙 Akşam Yemeği (4 Kap)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {ONE_MONTH_SCHEDULE_RAW.map((row) => (
                      <tr key={row.dayIndex} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-center bg-slate-50/50">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto text-xs">
                            {row.dayIndex}
                          </span>
                        </td>
                        <td className="p-3">
                          <strong className="block text-slate-900">{row.dayName}</strong>
                          <span className="text-3xs text-slate-500">{row.date}</span>
                        </td>
                        {/* Kahvaltı */}
                        <td className="p-3 bg-amber-50/20">
                          <span className="font-bold text-amber-900 block">{row.breakfast.title}</span>
                          <span className="text-2xs text-slate-700 block mt-0.5">
                            {row.breakfast.mainItem} • {row.breakfast.sideItem} • {row.breakfast.extraItem} • {row.breakfast.beverageItem}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-3xs font-semibold text-slate-500">
                            <span>🔥 {row.breakfast.calorie} kcal</span>
                            <span>•</span>
                            <span className="text-amber-800">Maliyet: {row.breakfast.cost.toFixed(2)} TL</span>
                          </div>
                        </td>
                        {/* Öğle */}
                        <td className="p-3 bg-orange-50/20">
                          <span className="font-bold text-orange-950 block">{row.lunch.title}</span>
                          <span className="text-2xs text-slate-700 block mt-0.5">
                            1. {row.lunch.soup} | 2. {row.lunch.main} | 3. {row.lunch.side} | 4. {row.lunch.dessertOrSalad}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-3xs font-semibold text-slate-500">
                            <span>🔥 {row.lunch.calorie} kcal</span>
                            <span>•</span>
                            <span className="text-orange-800">Maliyet: {row.lunch.cost.toFixed(2)} TL</span>
                          </div>
                        </td>
                        {/* Akşam */}
                        <td className="p-3 bg-indigo-50/20">
                          <span className="font-bold text-indigo-950 block">{row.dinner.title}</span>
                          <span className="text-2xs text-slate-700 block mt-0.5">
                            1. {row.dinner.soup} | 2. {row.dinner.main} | 3. {row.dinner.side} | 4. {row.dinner.dessertOrSalad}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-3xs font-semibold text-slate-500">
                            <span>🔥 {row.dinner.calorie} kcal</span>
                            <span>•</span>
                            <span className="text-indigo-800">Maliyet: {row.dinner.cost.toFixed(2)} TL</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
