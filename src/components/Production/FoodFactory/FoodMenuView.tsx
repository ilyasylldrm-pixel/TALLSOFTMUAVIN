import React, { useState } from "react";
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
} from "lucide-react";
import { FoodMenuPlan, FoodRecipe } from "../../../types";
import { formatCurrency } from "../../../utils/exportUtils";

interface FoodMenuViewProps {
  menus: FoodMenuPlan[];
  recipes: FoodRecipe[];
  onOpenNewMenuModal: () => void;
  onEditMenu: (menu: FoodMenuPlan) => void;
  onDeleteMenu: (menuId: string) => void;
  onToggleMenuLock: (menuId: string) => void;
}

export const FoodMenuView: React.FC<FoodMenuViewProps> = ({
  menus,
  recipes,
  onOpenNewMenuModal,
  onEditMenu,
  onDeleteMenu,
  onToggleMenuLock,
}) => {
  const [selectedWeek, setSelectedWeek] = useState("2026-W36");

  // Format menu for WhatsApp sharing
  const handleShareWhatsApp = (menu: FoodMenuPlan) => {
    const text =
      `📋 *GÜNLÜK TABLDOT MENÜSÜ* - ${menu.dayOfWeek} (${menu.date})\n` +
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

    const encodedText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span>4 Kap Tabldot Menü Planlama</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Şantiyeler, fabrikalar ve kurumsal ofisler için günlük ve haftalık tabldot menü planı, kalori ve maliyet kontrolü.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewMenuModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Günlük Menü Planla</span>
          </button>
        </div>
      </div>

      {/* Menü Kartları Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {menus.map((menu) => {
          const profit = menu.sellingPricePerPortion - menu.totalCostPerPortion;
          const profitMargin = Math.round((profit / menu.sellingPricePerPortion) * 100);

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
                    <span className="w-9 h-9 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                      {menu.dayOfWeek.slice(0, 3)}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{menu.dayOfWeek}</h3>
                      <span className="text-2xs text-slate-500">{menu.date} • {menu.mealType === "lunch" ? "Öğle Yemeği" : "Akşam"}</span>
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
                      title="Müşterilere WhatsApp ile Paylaş"
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

                <p className="text-xs font-semibold text-slate-700 mt-2.5 mb-3">{menu.title}</p>

                {/* 4 Kap Yemek İçeriği */}
                <div className="space-y-2 text-xs">
                  {/* 1. Kap */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-bold text-2xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div>
                        <span className="text-2xs text-slate-400 block">1. Kap (Çorba)</span>
                        <strong className="text-slate-800 font-semibold">{menu.items.soupRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. Kap */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-orange-100 text-orange-900 font-bold text-2xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div>
                        <span className="text-2xs text-slate-400 block">2. Kap (Ana Yemek)</span>
                        <strong className="text-slate-800 font-semibold">{menu.items.mainRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3. Kap */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-bold text-2xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div>
                        <span className="text-2xs text-slate-400 block">3. Kap (Yardımcı Yemek)</span>
                        <strong className="text-slate-800 font-semibold">{menu.items.sideRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 4. Kap */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-900 font-bold text-2xs flex items-center justify-center shrink-0">
                        4
                      </span>
                      <div>
                        <span className="text-2xs text-slate-400 block">4. Kap (Tatlı / Salata)</span>
                        <strong className="text-slate-800 font-semibold">{menu.items.dessertOrSaladRecipeName}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ek İkramlar */}
                  {menu.items.additionalItemNames && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-amber-50/50 border border-amber-100 text-2xs text-slate-600 flex items-center justify-between">
                      <span>Ekmek & İçecek:</span>
                      <span className="font-semibold text-amber-900">{menu.items.additionalItemNames.join(" + ")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Alt Metrikler */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-2xs text-slate-500 block">Maliyet</span>
                    <span className="font-bold text-slate-800">{formatCurrency(menu.totalCostPerPortion)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-500 block">Satış</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(menu.sellingPricePerPortion)}</span>
                  </div>
                  <div>
                    <span className="text-2xs text-slate-500 block">Kâr / Porsiyon</span>
                    <span className="font-bold text-amber-700">+{formatCurrency(profit)} (%{profitMargin})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-2xs text-slate-500 px-1">
                  <span className="flex items-center gap-1 font-semibold text-amber-800">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {menu.totalCalorie} kcal
                  </span>
                  <span className="font-medium text-slate-600">
                    Hedef: <strong>{menu.targetPortionsTotal} Porsiyon</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
