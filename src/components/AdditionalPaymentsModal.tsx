import React, { useState, useEffect } from "react";
import {
  Coins,
  Utensils,
  Bus,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  Gift,
  HelpCircle,
  Calculator,
  CalendarDays,
  ArrowRight,
  Info
} from "lucide-react";
import { AdditionalPaymentItem } from "../types";
import { formatCurrency } from "../utils/exportUtils";

export interface AdditionalPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  actualWorkDays?: number; // Fiili çalışma günü (örn: puantajdaki normal çalışma gün sayısı)
  initialFoodAllowance?: number;
  initialRoadAllowance?: number;
  initialCustomPayments?: AdditionalPaymentItem[];
  onApply: (data: {
    foodAllowance: number;
    roadAllowance: number;
    customPayments: AdditionalPaymentItem[];
    customPaymentsTotal: number;
    notesSummary?: string;
  }) => void;
}

const QUICK_PAYMENT_TEMPLATES = [
  { name: "Performans Primi", defaultAmount: 2500, desc: "Aylık KPI / hedef başarı primi" },
  { name: "Bayram İkramiyesi", defaultAmount: 5000, desc: "Resmi/Dini bayram ikramiyesi" },
  { name: "Yakacak Yardımı", defaultAmount: 1500, desc: "Kış dönemi ısınma/yakacak desteği" },
  { name: "Çocuk / Aile Yardımı", defaultAmount: 1000, desc: "SGK muafiyetli aile/çocuk yardımı" },
  { name: "Kasa Tazminatı", defaultAmount: 1200, desc: "Nakit/kasa sorumluluğu risk tazminatı" },
  { name: "Eğitim / Kırtasiye Yardımı", defaultAmount: 2000, desc: "Personel ve çocuk eğitim desteği" },
  { name: "Harcırah / Seyahat Yardımı", defaultAmount: 3000, desc: "Şehir dışı görev / seyahat harcırahı" },
  { name: "Yabancı Dil Tazminatı", defaultAmount: 1500, desc: "Yabancı dil bilgisi yetkinlik tazminatı" },
];

export const AdditionalPaymentsModal: React.FC<AdditionalPaymentsModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  actualWorkDays = 22,
  initialFoodAllowance = 0,
  initialRoadAllowance = 0,
  initialCustomPayments = [],
  onApply,
}) => {
  // Yemek Yardımı State
  const [enableFood, setEnableFood] = useState(initialFoodAllowance > 0);
  const [foodMethod, setFoodMethod] = useState<"fixed" | "daily">("fixed");
  const [foodDailyRate, setFoodDailyRate] = useState<number>(220);
  const [foodAmount, setFoodAmount] = useState<number>(initialFoodAllowance);

  // Yol Yardımı State
  const [enableRoad, setEnableRoad] = useState(initialRoadAllowance > 0);
  const [roadMethod, setRoadMethod] = useState<"fixed" | "daily">("fixed");
  const [roadDailyRate, setRoadDailyRate] = useState<number>(80);
  const [roadAmount, setRoadAmount] = useState<number>(initialRoadAllowance);

  // Elle Yazılan Serbest Ek Ödemeler State
  const [customPayments, setCustomPayments] = useState<AdditionalPaymentItem[]>([]);

  // Modal her açıldığında ilk değerleri senkronize et
  useEffect(() => {
    if (isOpen) {
      setEnableFood(initialFoodAllowance > 0);
      setFoodAmount(initialFoodAllowance);
      if (initialFoodAllowance > 0 && actualWorkDays > 0 && initialFoodAllowance % actualWorkDays === 0) {
        setFoodDailyRate(Math.round(initialFoodAllowance / actualWorkDays));
      }

      setEnableRoad(initialRoadAllowance > 0);
      setRoadAmount(initialRoadAllowance);
      if (initialRoadAllowance > 0 && actualWorkDays > 0 && initialRoadAllowance % actualWorkDays === 0) {
        setRoadDailyRate(Math.round(initialRoadAllowance / actualWorkDays));
      }

      setCustomPayments(
        initialCustomPayments && initialCustomPayments.length > 0
          ? [...initialCustomPayments]
          : []
      );
    }
  }, [isOpen, initialFoodAllowance, initialRoadAllowance, initialCustomPayments, actualWorkDays]);

  if (!isOpen) return null;

  // Hesaplamalar
  const effectiveFoodAmount = enableFood ? Math.max(0, foodAmount) : 0;
  const effectiveRoadAmount = enableRoad ? Math.max(0, roadAmount) : 0;
  const customPaymentsTotal = customPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const grandTotal = effectiveFoodAmount + effectiveRoadAmount + customPaymentsTotal;

  // Yemek Metot Değişimi
  const handleFoodDailyRateChange = (rate: number) => {
    setFoodDailyRate(rate);
    setFoodAmount(Math.round(rate * Math.max(1, actualWorkDays)));
  };

  // Yol Metot Değişimi
  const handleRoadDailyRateChange = (rate: number) => {
    setRoadDailyRate(rate);
    setRoadAmount(Math.round(rate * Math.max(1, actualWorkDays)));
  };

  // Yeni Serbest Ek Ödeme Kalemi Ekleme
  const handleAddCustomPayment = (template?: { name: string; defaultAmount: number; desc: string }) => {
    const newItem: AdditionalPaymentItem = {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: template ? template.name : "Serbest Ek Ödeme",
      amount: template ? template.defaultAmount : 1000,
      description: template ? template.desc : "",
      type: "custom",
    };
    setCustomPayments((prev) => [...prev, newItem]);
  };

  const handleUpdateCustomPayment = (id: string, field: keyof AdditionalPaymentItem, value: any) => {
    setCustomPayments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveCustomPayment = (id: string) => {
    setCustomPayments((prev) => prev.filter((item) => item.id !== id));
  };

  // Bordroya Aktarma
  const handleTransferToPayroll = () => {
    // Açıklama özeti hazırla
    const summaryParts: string[] = [];
    if (effectiveFoodAmount > 0) {
      summaryParts.push(`Yemek: ${formatCurrency(effectiveFoodAmount, "TRY")}`);
    }
    if (effectiveRoadAmount > 0) {
      summaryParts.push(`Yol: ${formatCurrency(effectiveRoadAmount, "TRY")}`);
    }
    if (customPayments.length > 0) {
      const customsDesc = customPayments
        .filter((p) => (p.amount || 0) > 0)
        .map((p) => `${p.name}: ${formatCurrency(p.amount, "TRY")}`)
        .join(", ");
      if (customsDesc) summaryParts.push(customsDesc);
    }

    onApply({
      foodAllowance: effectiveFoodAmount,
      roadAllowance: effectiveRoadAmount,
      customPayments: customPayments.filter((p) => (p.amount || 0) > 0),
      customPaymentsTotal,
      notesSummary: summaryParts.join(" | "),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-linear-to-r from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Ek Ödemeler & Yan Haklar Seçimi
                </h3>
                <span className="bg-amber-400 text-purple-950 text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
                  Bordroya Entegre
                </span>
              </div>
              <p className="text-xs text-purple-200 flex items-center gap-2">
                <span>Personel: <strong className="text-white">{employeeName}</strong></span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.2 rounded-md font-medium text-[11px]">
                  <CalendarDays className="w-3 h-3 text-purple-300" />
                  Fiili Çalışma: <strong className="text-amber-200">{actualWorkDays} Gün</strong>
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/50">
          {/* BİLGİ KARTI */}
          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3 text-xs text-purple-950 flex items-start gap-2.5 shadow-2xs">
            <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-purple-900 block">Bordro Ek Ödeme Modülü Hakkında:</span>
              <span>
                Yemek ve ulaşım yardımlarını aylık sabit tutar veya <strong>puantajdaki fiili gün sayısı</strong> ile çarpımlı olarak hesaplayabilir;
                aşağıdaki serbest ek ödeme alanından prim, ikramiye, yakacak, çocuk yardımı veya elle yazdığınız özel tazminatları bordroya aktarabilirsiniz.
              </span>
            </div>
          </div>

          {/* 1. YEMEK YARDIMI */}
          <div className={`p-4 rounded-2xl border transition-all ${
            enableFood ? "bg-white border-purple-200 shadow-sm" : "bg-slate-100/70 border-slate-200 opacity-85"
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableFood}
                  onChange={(e) => {
                    const chk = e.target.checked;
                    setEnableFood(chk);
                    if (chk && foodAmount === 0) setFoodAmount(4000);
                  }}
                  className="w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-slate-900 text-sm block">Yemek Yardımı (Ayni / Nakdi)</span>
                  <span className="text-[11px] text-slate-500">Günlük istisna veya aylık yemek kartı / nakit desteği</span>
                </div>
              </label>

              {enableFood && (
                <span className="text-sm font-black text-orange-950 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200">
                  {formatCurrency(effectiveFoodAmount, "TRY")}
                </span>
              )}
            </div>

            {enableFood && (
              <div className="mt-3.5 space-y-3 pt-1">
                {/* Yöntem Seçimi */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFoodMethod("fixed");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      foodMethod === "fixed"
                        ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Aylık Sabit Tutar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFoodMethod("daily");
                      handleFoodDailyRateChange(foodDailyRate || 220);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      foodMethod === "daily"
                        ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Günlük Tutar × Fiili Çalışma ({actualWorkDays} Gün)
                  </button>
                </div>

                {foodMethod === "daily" ? (
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-orange-950">Günlük Yemek Bedeli (₺):</span>
                      {/* Hızlı Butonlar */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold">Örnekler:</span>
                        {[170, 200, 220, 250].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handleFoodDailyRateChange(rate)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                              foodDailyRate === rate
                                ? "bg-orange-600 text-white border-orange-700"
                                : "bg-white text-orange-950 border-orange-200 hover:bg-orange-100"
                            }`}
                          >
                            {rate} ₺
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          value={foodDailyRate || ""}
                          onChange={(e) => handleFoodDailyRateChange(Math.max(0, Number(e.target.value)))}
                          placeholder="Günlük tutar örn: 220"
                          className="w-full bg-white border border-orange-200 rounded-xl p-2 font-black text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₺ / gün</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">× {actualWorkDays} gün =</span>
                      <span className="text-base font-black text-orange-700 bg-white px-3 py-1.5 rounded-xl border border-orange-200 min-w-28 text-center">
                        {formatCurrency(effectiveFoodAmount, "TRY")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Aylık Toplam Yemek Yardımı Tutarı (₺):</label>
                    <input
                      type="number"
                      min="0"
                      value={foodAmount || ""}
                      onChange={(e) => setFoodAmount(Math.max(0, Number(e.target.value)))}
                      placeholder="Örn: 4500"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-black text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. YOL / ULAŞIM YARDIMI */}
          <div className={`p-4 rounded-2xl border transition-all ${
            enableRoad ? "bg-white border-purple-200 shadow-sm" : "bg-slate-100/70 border-slate-200 opacity-85"
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableRoad}
                  onChange={(e) => {
                    const chk = e.target.checked;
                    setEnableRoad(chk);
                    if (chk && roadAmount === 0) setRoadAmount(1800);
                  }}
                  className="w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bus className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-slate-900 text-sm block">Ulaşım / Yol Yardımı</span>
                  <span className="text-[11px] text-slate-500">Aylık akbil/abonman desteği veya günlük yol ücreti</span>
                </div>
              </label>

              {enableRoad && (
                <span className="text-sm font-black text-blue-950 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                  {formatCurrency(effectiveRoadAmount, "TRY")}
                </span>
              )}
            </div>

            {enableRoad && (
              <div className="mt-3.5 space-y-3 pt-1">
                {/* Yöntem Seçimi */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRoadMethod("fixed");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      roadMethod === "fixed"
                        ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Aylık Sabit Tutar (Abonman vb.)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoadMethod("daily");
                      handleRoadDailyRateChange(roadDailyRate || 80);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      roadMethod === "daily"
                        ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Günlük Tutar × Fiili Çalışma ({actualWorkDays} Gün)
                  </button>
                </div>

                {roadMethod === "daily" ? (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-blue-950">Günlük Ulaşım Bedeli (₺):</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold">Örnekler:</span>
                        {[50, 70, 80, 100, 120].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handleRoadDailyRateChange(rate)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                              roadDailyRate === rate
                                ? "bg-blue-600 text-white border-blue-700"
                                : "bg-white text-blue-950 border-blue-200 hover:bg-blue-100"
                            }`}
                          >
                            {rate} ₺
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          value={roadDailyRate || ""}
                          onChange={(e) => handleRoadDailyRateChange(Math.max(0, Number(e.target.value)))}
                          placeholder="Günlük yol örn: 80"
                          className="w-full bg-white border border-blue-200 rounded-xl p-2 font-black text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₺ / gün</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">× {actualWorkDays} gün =</span>
                      <span className="text-base font-black text-blue-700 bg-white px-3 py-1.5 rounded-xl border border-blue-200 min-w-28 text-center">
                        {formatCurrency(effectiveRoadAmount, "TRY")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Aylık Toplam Yol Yardımı Tutarı (₺):</label>
                    <input
                      type="number"
                      min="0"
                      value={roadAmount || ""}
                      onChange={(e) => setRoadAmount(Math.max(0, Number(e.target.value)))}
                      placeholder="Örn: 1500"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-black text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. ELLE YAZILABİLECEK VE SEÇİLEBİLECEK SERBEST EK ÖDEMELER */}
          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    Elle Yazılabilecek Serbest Ek Ödemeler
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full border border-emerald-300">
                      {customPayments.length} Kalem
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Prim, ikramiye, yakacak, çocuk yardımı veya elle dilediğiniz ek ödeme adını yazıp tutarını belirleyebilirsiniz.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddCustomPayment()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni Kalem Ekle
              </button>
            </div>

            {/* Hızlı Şablonlar / Örnek Seçim Butonları */}
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1.5">
                Hızlı Ekleme Şablonları (Tıklayarak Listeye Ekleyebilirsiniz):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PAYMENT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => handleAddCustomPayment(tmpl)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-300 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                    title={`${tmpl.name} (${tmpl.defaultAmount} ₺) - ${tmpl.desc}`}
                  >
                    <Plus className="w-3 h-3 text-purple-600" />
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ek Ödemeler Tablo / Liste */}
            {customPayments.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <Coins className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">
                  Henüz elle girilen bir ek ödeme kalemi eklenmedi.
                </p>
                <p className="text-[11px] text-slate-400">
                  Yukarıdaki hızlı şablonlara tıklayabilir veya &quot;Yeni Kalem Ekle&quot; butonuyla serbest bir ödeme adı tanımlayabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {customPayments.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Ödeme Adı */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateCustomPayment(item.id, "name", e.target.value)}
                        placeholder="Örn: Proje Tamamlama Primi, Çocuk Yardımı..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Tutar */}
                    <div className="w-36 relative">
                      <input
                        type="number"
                        min="0"
                        value={item.amount || ""}
                        onChange={(e) =>
                          handleUpdateCustomPayment(item.id, "amount", Math.max(0, Number(e.target.value)))
                        }
                        placeholder="0"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-emerald-800 focus:outline-none focus:border-emerald-500 text-right pr-6"
                      />
                      <span className="absolute right-2 top-2 text-[11px] font-bold text-slate-400">₺</span>
                    </div>

                    {/* Açıklama / Not */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => handleUpdateCustomPayment(item.id, "description", e.target.value)}
                        placeholder="Bordro açıklaması (isteğe bağlı)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:border-purple-500 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Sil Butonu */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomPayment(item.id)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Kalemi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER & AKTAR BUTONU */}
        <div className="px-5 py-3.5 bg-white border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-lg">
          {/* İCMAL */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="text-slate-600">
              <span>Yemek: <strong className="text-slate-900">{formatCurrency(effectiveFoodAmount, "TRY")}</strong></span>
              <span className="mx-2 text-slate-300">|</span>
              <span>Yol: <strong className="text-slate-900">{formatCurrency(effectiveRoadAmount, "TRY")}</strong></span>
              <span className="mx-2 text-slate-300">|</span>
              <span>Diğer Ek ({customPayments.length}): <strong className="text-slate-900">{formatCurrency(customPaymentsTotal, "TRY")}</strong></span>
            </div>
            <div className="bg-purple-100/80 px-3 py-1 rounded-xl border border-purple-200 font-extrabold text-purple-950">
              Toplam Ek Ödeme: <span className="text-sm font-black text-purple-900">{formatCurrency(grandTotal, "TRY")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleTransferToPayroll}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              Bordro Hesaplamasına Aktar ({formatCurrency(grandTotal, "TRY")})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
