import React, { useState } from "react";
import { X, Gift, Utensils, Bus, Plus, Trash2, CheckCircle2, Calculator } from "lucide-react";
import { AdditionalPaymentItem } from "../types";
import { formatCurrency } from "../utils/exportUtils";

export interface AdditionalPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  actualWorkDays: number;
  initialFoodAllowance: number;
  initialRoadAllowance: number;
  initialCustomPayments: AdditionalPaymentItem[];
  onApply: (data: {
    foodAllowance: number;
    roadAllowance: number;
    customPayments: AdditionalPaymentItem[];
    customPaymentsTotal: number;
    notesSummary?: string;
  }) => void;
}

export const AdditionalPaymentsModal: React.FC<AdditionalPaymentsModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  actualWorkDays,
  initialFoodAllowance,
  initialRoadAllowance,
  initialCustomPayments,
  onApply,
}) => {
  if (!isOpen) return null;

  // Modlar: "daily" (Günlük birim tutar * Fiili çalışma günü) veya "fixed" (Aylık sabit net tutar)
  const [foodMode, setFoodMode] = useState<"daily" | "fixed">("daily");
  const defaultDailyFood = actualWorkDays > 0 ? Math.round(initialFoodAllowance / actualWorkDays) || 170 : 170;
  const [dailyFoodRate, setDailyFoodRate] = useState<number>(defaultDailyFood);
  const [fixedFoodAmount, setFixedFoodAmount] = useState<number>(initialFoodAllowance);

  const [roadMode, setRoadMode] = useState<"daily" | "fixed">("daily");
  const defaultDailyRoad = actualWorkDays > 0 ? Math.round(initialRoadAllowance / actualWorkDays) || 75 : 75;
  const [dailyRoadRate, setDailyRoadRate] = useState<number>(defaultDailyRoad);
  const [fixedRoadAmount, setFixedRoadAmount] = useState<number>(initialRoadAllowance);

  // Serbest ek ödeme kalemleri (Prim, Yakacak, Bayram Harçlığı, Performans Ödülü vb.)
  const [customList, setCustomList] = useState<AdditionalPaymentItem[]>(
    initialCustomPayments && initialCustomPayments.length > 0
      ? JSON.parse(JSON.stringify(initialCustomPayments))
      : []
  );

  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState<number | "">("");
  const [newItemDescription, setNewItemDescription] = useState("");

  const computedFoodAllowance =
    foodMode === "daily" ? Math.max(0, dailyFoodRate * Math.max(0, actualWorkDays)) : Math.max(0, fixedFoodAmount);

  const computedRoadAllowance =
    roadMode === "daily" ? Math.max(0, dailyRoadRate * Math.max(0, actualWorkDays)) : Math.max(0, fixedRoadAmount);

  const customPaymentsTotal = customList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const grandTotal = computedFoodAllowance + computedRoadAllowance + customPaymentsTotal;

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return;
    const amt = Number(newItemAmount) || 0;
    if (amt <= 0) return;

    const newItem: AdditionalPaymentItem = {
      id: "pay_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: newItemName.trim(),
      amount: amt,
      type: "custom",
      description: newItemDescription.trim() || undefined,
    };

    setCustomList([...customList, newItem]);
    setNewItemName("");
    setNewItemAmount("");
    setNewItemDescription("");
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomList(customList.filter((item) => item.id !== id));
  };

  const handleSaveAndApply = () => {
    // Notlar için özet metin oluştur
    const notesParts: string[] = [];
    if (computedFoodAllowance > 0) {
      notesParts.push(
        `Yemek: ${formatCurrency(computedFoodAllowance, "TRY")} (${foodMode === "daily" ? `${actualWorkDays} gün x ${dailyFoodRate}₺` : "Sabit"})`
      );
    }
    if (computedRoadAllowance > 0) {
      notesParts.push(
        `Yol: ${formatCurrency(computedRoadAllowance, "TRY")} (${roadMode === "daily" ? `${actualWorkDays} gün x ${dailyRoadRate}₺` : "Sabit"})`
      );
    }
    if (customList.length > 0) {
      const customsSummary = customList.map((c) => `${c.name}: ${formatCurrency(c.amount, "TRY")}`).join(", ");
      notesParts.push(`Ek Kalemler: ${customsSummary}`);
    }

    onApply({
      foodAllowance: computedFoodAllowance,
      roadAllowance: computedRoadAllowance,
      customPayments: customList,
      customPaymentsTotal,
      notesSummary: notesParts.join(" | "),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Gift className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Ek Ödemeler & Yan Haklar Modülü</h3>
                <span className="text-[10px] bg-amber-400 text-purple-950 px-2 py-0.5 rounded-full font-black">
                  Bordro Entegre
                </span>
              </div>
              <p className="text-xs text-purple-200">
                Personel: <strong className="text-white font-semibold">{employeeName}</strong> &bull; Puantaj Fiili Çalışma:{" "}
                <strong className="text-amber-300 font-bold">{actualWorkDays} Gün</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gövde - Scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* 1. Yemek Yardımı */}
          <div className="p-3.5 rounded-2xl border border-orange-200 bg-orange-50/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-orange-950 text-xs sm:text-sm">Yemek Yardımı / Nakdi Yemek</h4>
                  <span className="text-[10px] text-orange-700">Fiili puantaj çalışma gününe endeksli veya sabit</span>
                </div>
              </div>

              <div className="inline-flex rounded-xl bg-orange-200/60 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFoodMode("daily")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    foodMode === "daily" ? "bg-white text-orange-950 shadow-xs font-black" : "text-orange-800 hover:text-orange-950"
                  }`}
                >
                  Günlük x Fiili ({actualWorkDays}G)
                </button>
                <button
                  type="button"
                  onClick={() => setFoodMode("fixed")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    foodMode === "fixed" ? "bg-white text-orange-950 shadow-xs font-black" : "text-orange-800 hover:text-orange-950"
                  }`}
                >
                  Sabit Aylık
                </button>
              </div>
            </div>

            {foodMode === "daily" ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-orange-900 mb-1">Günlük Yemek Bedeli (₺)</label>
                  <input
                    type="number"
                    min="0"
                    value={dailyFoodRate || ""}
                    onChange={(e) => setDailyFoodRate(Number(e.target.value))}
                    placeholder="170"
                    className="w-full bg-white border border-orange-300 rounded-xl p-2 text-xs sm:text-sm font-bold text-orange-950 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-orange-900 mb-1">
                    Hesaplanan Yemek Toplamı ({actualWorkDays} gün x {dailyFoodRate}₺)
                  </label>
                  <div className="w-full bg-orange-100/70 border border-orange-300 rounded-xl p-2 text-xs sm:text-sm font-black text-orange-950 flex items-center justify-between">
                    <span>{formatCurrency(computedFoodAllowance, "TRY")}</span>
                    <span className="text-[10px] text-orange-700 font-bold">Otomatik</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-orange-900 mb-1">Aylık Sabit Yemek Tutarı (₺)</label>
                <input
                  type="number"
                  min="0"
                  value={fixedFoodAmount || ""}
                  onChange={(e) => setFixedFoodAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white border border-orange-300 rounded-xl p-2 text-xs sm:text-sm font-bold text-orange-950 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}
          </div>

          {/* 2. Yol Yardımı / Ulaşım */}
          <div className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sky-950 text-xs sm:text-sm">Yol / Ulaşım Yardımı</h4>
                  <span className="text-[10px] text-sky-700">Aylık akbil / nakdi ulaşım veya günlük yol ücreti</span>
                </div>
              </div>

              <div className="inline-flex rounded-xl bg-sky-200/60 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRoadMode("daily")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    roadMode === "daily" ? "bg-white text-sky-950 shadow-xs font-black" : "text-sky-800 hover:text-sky-950"
                  }`}
                >
                  Günlük x Fiili ({actualWorkDays}G)
                </button>
                <button
                  type="button"
                  onClick={() => setRoadMode("fixed")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    roadMode === "fixed" ? "bg-white text-sky-950 shadow-xs font-black" : "text-sky-800 hover:text-sky-950"
                  }`}
                >
                  Sabit Aylık
                </button>
              </div>
            </div>

            {roadMode === "daily" ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-sky-900 mb-1">Günlük Yol Bedeli (₺)</label>
                  <input
                    type="number"
                    min="0"
                    value={dailyRoadRate || ""}
                    onChange={(e) => setDailyRoadRate(Number(e.target.value))}
                    placeholder="75"
                    className="w-full bg-white border border-sky-300 rounded-xl p-2 text-xs sm:text-sm font-bold text-sky-950 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-sky-900 mb-1">
                    Hesaplanan Yol Toplamı ({actualWorkDays} gün x {dailyRoadRate}₺)
                  </label>
                  <div className="w-full bg-sky-100/70 border border-sky-300 rounded-xl p-2 text-xs sm:text-sm font-black text-sky-950 flex items-center justify-between">
                    <span>{formatCurrency(computedRoadAllowance, "TRY")}</span>
                    <span className="text-[10px] text-sky-700 font-bold">Otomatik</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-sky-900 mb-1">Aylık Sabit Yol / Ulaşım Tutarı (₺)</label>
                <input
                  type="number"
                  min="0"
                  value={fixedRoadAmount || ""}
                  onChange={(e) => setFixedRoadAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white border border-sky-300 rounded-xl p-2 text-xs sm:text-sm font-bold text-sky-950 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* 3. Serbest Tanımlı Ek Ödemeler (Prim, Yakacak, Bayram Yardımı vb.) */}
          <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-xs">
                  <Gift className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="font-bold text-purple-950 text-xs sm:text-sm">
                    Serbest Ek Ödemeler ({customList.length} Kalem)
                  </h4>
                  <span className="text-[10px] text-purple-700">
                    Örn: Satış Primi, Yakacak Yardımı, Bayram Harçlığı, Kasa Tazminatı
                  </span>
                </div>
              </div>

              <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200">
                Toplam: {formatCurrency(customPaymentsTotal, "TRY")}
              </span>
            </div>

            {/* Kalem Ekleme Formu */}
            <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Kalem Adı (örn: Bayram Harçlığı, Prim)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Tutar (₺)"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="sm:col-span-4 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Açıklama (opsiyonel)"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    disabled={!newItemName.trim() || !newItemAmount}
                    className="px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white text-xs font-bold shrink-0 cursor-pointer transition-all flex items-center gap-1"
                    title="Ek Kalem Ekle"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mevcut Kalemler Listesi */}
            {customList.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {customList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-950">{item.name}</span>
                      {item.description && (
                        <span className="text-[11px] text-slate-500 italic">({item.description})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-700">{formatCurrency(item.amount, "TRY")}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        title="Kalemi Çıkar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toplam Ek Ödeme Özeti */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md">
            <div className="space-y-0.5">
              <span className="text-[11px] text-purple-200 font-semibold block">TOPLAM BORDROYA AKTARILACAK EK ÖDEME</span>
              <div className="flex items-center gap-3 text-xs text-purple-300">
                <span>Yemek: {formatCurrency(computedFoodAllowance, "TRY")}</span>
                <span>&bull;</span>
                <span>Yol: {formatCurrency(computedRoadAllowance, "TRY")}</span>
                <span>&bull;</span>
                <span>Ek Kalemler: {formatCurrency(customPaymentsTotal, "TRY")}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-black text-amber-300">{formatCurrency(grandTotal, "TRY")}</span>
            </div>
          </div>
        </div>

        {/* Modal Alt Aksiyonlar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>Hesaplamayı Bordroya Aktar ({formatCurrency(grandTotal, "TRY")})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
