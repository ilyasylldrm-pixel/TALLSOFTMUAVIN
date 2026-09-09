import React, { useState } from "react";
import {
  Gift,
  Coins,
  Sparkles,
  RefreshCw,
  Target,
  CheckCircle2,
  Scissors,
  Pin,
  Trash2,
  Clock,
} from "lucide-react";
import { Employee, AdditionalPaymentItem } from "../types";

export interface OvertimeLaborLawStats {
  overtimeNormalHours: number;
  overtimeWeekendHours: number;
  overtimeHolidayHours: number;
  overtimeHolidayDays: number;
  totalOvertimeHours: number;
  hourlyGross: number;
  dailyGross: number;
  normalOvertimePay: number;
  weekendOvertimePay: number;
  holidayHoursOvertimePay: number;
  holidayDaysOvertimePay: number;
  calculatedOvertimePay: number;
}

export interface PayrollAdjustmentsTwinPanelsProps {
  employee: Employee;
  form: {
    salaryType?: "net" | "gross";
    baseSalary?: number;
    bonusAmount?: number;
    overtimePay?: number;
    overtimeNormalHours?: number;
    overtimeWeekendHours?: number;
    overtimeHolidayDays?: number;
    overtimeHolidayHours?: number;
    foodAllowance?: number;
    roadAllowance?: number;
    customPayments?: AdditionalPaymentItem[];
    customPaymentsTotal?: number;
    advanceDeduction?: number;
    advanceReason?: string;
    unpaidLeaveDays?: number;
    missingDayReason?: string;
    missingDayCode?: string;
    besDeduction?: number;
    besReason?: string;
    executionDeduction?: number;
    executionReason?: string;
    alimonyDeduction?: number;
    alimonyReason?: string;
    otherDeductions?: number;
    otherReason?: string;
    deductionReason?: string;
    puantajDays?: Record<number, { code?: string; normalHours?: number; overtimeHours?: number }>;
  };
  onChangeForm: (updater: (prev: any) => any) => void;
  showToast: (msg: string) => void;
  formatTRY: (amount: number) => string;
  onOpenAdditionalPaymentsModal: () => void;
  getAutoAdvance: (empId: string) => { totalAdvance: number; reasons: string[] };
  getAutoLeaves: (empId: string) => { unpaidDays: number; primaryCode: string; reasons: string[] };
  getAutoLegalDeductions: (
    empId: string,
    approxNet: number
  ) => {
    besDeduction: number;
    executionDeduction: number;
    alimonyDeduction: number;
    otherDeductions: number;
    reasonsSummary: string;
  };
  otStats?: OvertimeLaborLawStats;
}

export const PayrollAdjustmentsTwinPanels: React.FC<PayrollAdjustmentsTwinPanelsProps> = ({
  employee,
  form,
  onChangeForm,
  showToast,
  formatTRY,
  onOpenAdditionalPaymentsModal,
  getAutoAdvance,
  getAutoLeaves,
  getAutoLegalDeductions,
  otStats,
}) => {
  // Sol Panel (Ek Ödemeler) Seçim State'leri
  const [selectedAddition, setSelectedAddition] = useState<
    "food" | "road" | "bonus" | "overtime" | "addCustom" | "customList"
  >("food");
  const [quickCustomPayName, setQuickCustomPayName] = useState("");
  const [quickCustomPayAmount, setQuickCustomPayAmount] = useState<number | "">("");
  const [quickCustomPayDesc, setQuickCustomPayDesc] = useState("");

  // Sağ Panel (Kesintiler) Seçim State'leri
  const [selectedDeduction, setSelectedDeduction] = useState<
    "advance" | "unpaidLeave" | "bes" | "execution" | "alimony" | "other"
  >("advance");

  // Fiili çalışma gün sayısı
  const actualWorkDays = form.puantajDays
    ? Object.values(form.puantajDays).filter((d: any) => d?.code === "N").length || 22
    : 22;

  // Ek Ödemeler Toplamı
  const customPaymentsTotal =
    form.customPaymentsTotal !== undefined
      ? form.customPaymentsTotal
      : form.customPayments
      ? form.customPayments.reduce((s, p) => s + (p.amount || 0), 0)
      : 0;

  const totalAdditions =
    (form.foodAllowance ?? 0) +
    (form.roadAllowance ?? 0) +
    (form.bonusAmount ?? 0) +
    (form.overtimePay ?? 0) +
    customPaymentsTotal;

  const additionsActiveCount =
    ((form.foodAllowance ?? 0) > 0 ? 1 : 0) +
    ((form.roadAllowance ?? 0) > 0 ? 1 : 0) +
    ((form.bonusAmount ?? 0) > 0 ? 1 : 0) +
    ((form.overtimePay ?? 0) > 0 ? 1 : 0) +
    (form.customPayments && form.customPayments.length > 0 ? 1 : 0);

  // Kesintiler Toplamı
  const totalDeductions =
    (form.advanceDeduction ?? 0) +
    (form.besDeduction ?? 0) +
    (form.executionDeduction ?? 0) +
    (form.alimonyDeduction ?? 0) +
    (form.otherDeductions ?? 0);

  const deductionsActiveCount =
    ((form.advanceDeduction ?? 0) > 0 ? 1 : 0) +
    ((form.unpaidLeaveDays ?? 0) > 0 ? 1 : 0) +
    ((form.besDeduction ?? 0) > 0 ? 1 : 0) +
    ((form.executionDeduction ?? 0) > 0 ? 1 : 0) +
    ((form.alimonyDeduction ?? 0) > 0 ? 1 : 0) +
    ((form.otherDeductions ?? 0) > 0 ? 1 : 0);

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* -------------------------------------------------------------------------------- */}
      {/* SOL PANEL: EK ÖDEMELER & YAN HAKLAR (UYGULAMA TASARIMI İLE BİREBİR UYUMLU) */}
      {/* -------------------------------------------------------------------------------- */}
      <div
        id="pinned-additional-payments-panel"
        className="bg-white rounded-3xl border border-emerald-200/90 p-4 space-y-3.5 shadow-2xs text-slate-800 flex flex-col justify-between"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    Ek Ödemeler & Yan Haklar
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                    Yemek, Yol, Prim & Haklar
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Ek kazançları seçin, anında hesaplayıp bordroya aktarın
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  const calcFood = employee.foodAllowance
                    ? employee.foodAllowance
                    : actualWorkDays * 170;
                  const calcRoad = employee.roadAllowance
                    ? employee.roadAllowance
                    : actualWorkDays * 75;
                  const calcOt = otStats?.calculatedOvertimePay || 0;

                  onChangeForm((prev) => ({
                    ...prev,
                    foodAllowance: calcFood,
                    roadAllowance: calcRoad,
                    ...(calcOt > 0
                      ? {
                          overtimePay: calcOt,
                          overtimeNormalHours: otStats?.overtimeNormalHours,
                          overtimeWeekendHours: otStats?.overtimeWeekendHours,
                          overtimeHolidayDays: otStats?.overtimeHolidayDays,
                          overtimeHolidayHours: otStats?.overtimeHolidayHours,
                        }
                      : {}),
                  }));
                  showToast(
                    `⚡ Yemek (${formatTRY(calcFood)}), Yol (${formatTRY(
                      calcRoad
                    )})${
                      calcOt > 0 ? ` ve Mesai (${formatTRY(calcOt)})` : ""
                    } puantaja göre hesaplandı.`
                  );
                }}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Puantaj fiili günlerine göre otomatik hesapla"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Oto-Hesapla</span>
              </button>

              <button
                type="button"
                onClick={onOpenAdditionalPaymentsModal}
                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Gelişmiş ek ödeme seçim penceresini aç"
              >
                <Coins className="w-2.5 h-2.5" />
                <span>Detaylı Seç</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeForm((prev) => ({
                    ...prev,
                    foodAllowance: 0,
                    roadAllowance: 0,
                    bonusAmount: 0,
                    overtimePay: 0,
                    customPayments: [],
                    customPaymentsTotal: 0,
                  }));
                  showToast("🧹 Ek ödemeler sıfırlandı.");
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                title="Tüm ek ödemeleri sıfırla (0 ₺)"
              >
                Sıfırla
              </button>
            </div>
          </div>

          {/* 1. Ek Ödeme Tipi Seçici Çipler */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Ek Ödeme Türü:
              </span>
              <span className="text-[10px] font-bold text-emerald-700">
                Hızlı Giriş
              </span>
            </div>

            {/* Hızlı Seçim Çipleri */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1">
              {[
                { id: "food", label: "Yemek", icon: "🍱" },
                { id: "road", label: "Yol", icon: "🚌" },
                { id: "bonus", label: "Prim", icon: "🏆" },
                { id: "overtime", label: "Mesai", icon: "⏱️" },
                { id: "addCustom", label: "Yeni Ekle", icon: "➕" },
                {
                  id: "customList",
                  label: `Ek (${form.customPayments?.length || 0})`,
                  icon: "📋",
                },
              ].map((item) => {
                const isSelected = selectedAddition === item.id;
                const hasOtAlert = item.id === "overtime" && (otStats?.calculatedOvertimePay ?? 0) > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAddition(item.id as any)}
                    className={`relative py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400 shadow-xs scale-[1.02]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {hasOtAlert && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 ring-1 ring-white animate-pulse" title="Puantajda hesaplanan mesai var" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Puantajda hesaplanmış mesai varsa ve mesai sekmesinde değilse hızlı yönlendirme kartı */}
          {otStats && (otStats.calculatedOvertimePay ?? 0) > 0 && selectedAddition !== "overtime" && (
            <div className="bg-purple-50/90 border border-purple-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <span className="font-bold text-purple-950 text-[11px] block">
                    Puantajda Yasal Fazla Mesai Mevcut:
                  </span>
                  <span className="text-[10px] text-purple-800">
                    {otStats.totalOvertimeHours} Saat + {otStats.overtimeHolidayDays} Gün ({formatTRY(otStats.calculatedOvertimePay)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAddition("overtime")}
                className="px-2.5 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-black transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                Mesaiye Git & Aktar
              </button>
            </div>
          )}

          {/* 2. Seçili Ek Ödemeyi Panel İçinde Doğrudan Düzenleme */}
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/90 p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-700" />
                Seçili Ek Ödeme Değeri (Canlı Giriş):
              </span>
              <span className="text-[10px] font-bold text-emerald-700">
                Anında Bordroya Yansır
              </span>
            </div>

            {/* Dinamik Canlı İnputlar */}
            {selectedAddition === "food" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">Aylık Yemek Yardımı Tutarı:</span>
                    <span className="text-[10px] text-emerald-700 font-bold">₺ Cinsinden</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="input-addition-food"
                      type="number"
                      min="0"
                      value={form.foodAllowance ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          foodAllowance: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-emerald-100">
                  <span>
                    Fiili Çalışma: <strong>{actualWorkDays} gün</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeForm((prev) => ({
                        ...prev,
                        foodAllowance: actualWorkDays * 170,
                      }));
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Günlük 170₺ Uygula ({formatTRY(actualWorkDays * 170)})
                  </button>
                </div>
              </div>
            )}

            {selectedAddition === "road" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">Aylık Yol / Ulaşım Desteği:</span>
                    <span className="text-[10px] text-blue-700 font-bold">₺ Cinsinden</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="input-addition-road"
                      type="number"
                      min="0"
                      value={form.roadAllowance ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          roadAllowance: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-emerald-100">
                  <span>
                    Fiili Çalışma: <strong>{actualWorkDays} gün</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeForm((prev) => ({
                        ...prev,
                        roadAllowance: actualWorkDays * 75,
                      }));
                    }}
                    className="text-blue-700 font-bold hover:underline cursor-pointer"
                  >
                    Günlük 75₺ Uygula ({formatTRY(actualWorkDays * 75)})
                  </button>
                </div>
              </div>
            )}

            {selectedAddition === "bonus" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">Prim & İkramiye Tutarı:</span>
                    <span className="text-[10px] text-amber-700 font-bold">Ödül / Kota</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="input-addition-bonus"
                      type="number"
                      min="0"
                      value={form.bonusAmount ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          bonusAmount: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Performans primi, satış komisyonu veya dönemsel ikramiye tutarı.
                </p>
              </div>
            )}

            {selectedAddition === "overtime" && (
              <div className="space-y-3">
                {/* Mesai Giriş ve Yasal Başlık */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-purple-700" />
                      <span>Fazla Mesai Tutarı (₺):</span>
                    </div>
                    <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full font-bold">
                      4857 Sayılı İş Kanunu
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="input-addition-overtime"
                      type="number"
                      min="0"
                      value={form.overtimePay ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          overtimePay: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-purple-200 rounded-xl py-1.5 pl-7 pr-3 font-black text-purple-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-2xs"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    T.C. İş Kanunu Esasları: Saatlik Brüt = Brüt/225 · Günlük Yevmiye = Brüt/30 · Hafta İçi %50 Zamlı · Hafta Tatili/Resmi Tatil %100 Zamlı
                  </p>
                </div>

                {/* 4857 Sayılı Kanun Dağılım Kartları */}
                {otStats && (
                  <div className="space-y-2 pt-2 border-t border-emerald-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-purple-950">
                        Yasal Mesai Dağılımı (Puantaj)
                      </span>
                      <span className="text-[9.5px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded">
                        Toplam: {otStats.totalOvertimeHours} Saat + {otStats.overtimeHolidayDays} Gün
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* 1. Hafta İçi Mesai */}
                      <div className="bg-white p-2 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 uppercase">
                          <span>Hafta İçi Mesai</span>
                          <span className="bg-emerald-100 text-emerald-900 px-1 py-0.2 rounded text-[8px]">%50 Zamlı</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black text-emerald-950">{otStats.overtimeNormalHours} Saat</span>
                          <span className="text-[11px] font-black text-emerald-700">{formatTRY(otStats.normalOvertimePay)}</span>
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium truncate">
                          Saat Başı: {formatTRY(otStats.hourlyGross * 1.5)}
                        </div>
                      </div>

                      {/* 2. Hafta Tatili Mesai */}
                      <div className="bg-white p-2 rounded-xl border border-purple-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-purple-800 uppercase">
                          <span>Hafta Tatili Mesai</span>
                          <span className="bg-purple-100 text-purple-900 px-1 py-0.2 rounded text-[8px]">%100 Zamlı</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black text-purple-950">{otStats.overtimeWeekendHours} Saat</span>
                          <span className="text-[11px] font-black text-purple-700">{formatTRY(otStats.weekendOvertimePay)}</span>
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium truncate">
                          Saat Başı: {formatTRY(otStats.hourlyGross * 2.0)}
                        </div>
                      </div>

                      {/* 3. Resmi Tatil (Saat) */}
                      <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 uppercase">
                          <span>Resmi Tatil (Saat)</span>
                          <span className="bg-amber-100 text-amber-900 px-1 py-0.2 rounded text-[8px]">%100 Zamlı</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black text-amber-950">{otStats.overtimeHolidayHours} Saat</span>
                          <span className="text-[11px] font-black text-amber-700">{formatTRY(otStats.holidayHoursOvertimePay)}</span>
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium truncate">
                          Saat Başı: {formatTRY(otStats.hourlyGross * 2.0)}
                        </div>
                      </div>

                      {/* 4. Resmi Tatil (Gün) */}
                      <div className="bg-white p-2 rounded-xl border border-red-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-red-800 uppercase">
                          <span>Resmi Tatil (Gün)</span>
                          <span className="bg-red-100 text-red-900 px-1 py-0.2 rounded text-[8px]">1 Yevmiye</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black text-red-950">{otStats.overtimeHolidayDays} Gün</span>
                          <span className="text-[11px] font-black text-red-700">{formatTRY(otStats.holidayDaysOvertimePay)}</span>
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-medium truncate">
                          Günlük Yevmiye: {formatTRY(otStats.dailyGross)}
                        </div>
                      </div>
                    </div>

                    {/* İcmal ve Otomatik Aktar Butonu */}
                    <div className="bg-purple-900/5 border border-purple-200 p-2 rounded-xl flex items-center justify-between gap-2 text-[10px] text-purple-950 font-bold">
                      <div className="truncate">
                        <span>Saatlik Brüt: {formatTRY(otStats.hourlyGross)}</span>
                        <span className="mx-1 text-slate-400">|</span>
                        <span>Günlük: {formatTRY(otStats.dailyGross)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onChangeForm((prev) => ({
                            ...prev,
                            overtimePay: otStats.calculatedOvertimePay,
                            overtimeNormalHours: otStats.overtimeNormalHours,
                            overtimeWeekendHours: otStats.overtimeWeekendHours,
                            overtimeHolidayDays: otStats.overtimeHolidayDays,
                            overtimeHolidayHours: otStats.overtimeHolidayHours,
                          }));
                          showToast(`Yasal fazla mesai tutarı (${formatTRY(otStats.calculatedOvertimePay)}) aktarıldı.`);
                        }}
                        className="text-[10px] font-black bg-purple-700 hover:bg-purple-800 text-white px-2 py-1 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs"
                      >
                        Otomatik Aktar ({formatTRY(otStats.calculatedOvertimePay)})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedAddition === "addCustom" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">Kalem Adı:</label>
                    <input
                      type="text"
                      value={quickCustomPayName}
                      onChange={(e) => setQuickCustomPayName(e.target.value)}
                      placeholder="Örn: Çocuk Yardımı, Yakacak..."
                      className="w-full bg-white border border-slate-300 rounded-xl py-1 px-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">Tutar (₺):</label>
                    <input
                      type="number"
                      min="0"
                      value={quickCustomPayAmount}
                      onChange={(e) =>
                        setQuickCustomPayAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl py-1 px-2 text-xs font-black text-emerald-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-right"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickCustomPayDesc}
                    onChange={(e) => setQuickCustomPayDesc(e.target.value)}
                    placeholder="Açıklama (İsteğe bağlı)"
                    className="flex-1 bg-white border border-slate-300 rounded-xl py-1 px-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!quickCustomPayName.trim() || !quickCustomPayAmount || Number(quickCustomPayAmount) <= 0) {
                        showToast("⚠️ Lütfen geçerli bir kalem adı ve tutar girin.");
                        return;
                      }
                      const newItem: AdditionalPaymentItem = {
                        id: `custom-pay-${Date.now()}`,
                        name: quickCustomPayName.trim(),
                        amount: Number(quickCustomPayAmount),
                        description: quickCustomPayDesc.trim(),
                      };
                      const updated = [...(form.customPayments || []), newItem];
                      const total = updated.reduce((s, p) => s + (p.amount || 0), 0);
                      onChangeForm((prev) => ({
                        ...prev,
                        customPayments: updated,
                        customPaymentsTotal: total,
                      }));
                      setQuickCustomPayName("");
                      setQuickCustomPayAmount("");
                      setQuickCustomPayDesc("");
                      setSelectedAddition("customList");
                      showToast(`✓ "${newItem.name}" (${formatTRY(newItem.amount)}) eklendi.`);
                    }}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}

            {selectedAddition === "customList" && (
              <div className="space-y-1.5">
                {!form.customPayments || form.customPayments.length === 0 ? (
                  <div className="text-center py-3 text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
                    Tanımlı serbest ek ödeme kalemi bulunmamaktadır.
                    <button
                      type="button"
                      onClick={() => setSelectedAddition("addCustom")}
                      className="block mx-auto mt-1 text-emerald-700 font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      + Yeni Kalem Ekle
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {form.customPayments.map((cp) => (
                      <div
                        key={cp.id}
                        className="flex items-center justify-between p-1.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{cp.name}</span>
                          {cp.description && (
                            <span className="text-[10px] text-slate-500">({cp.description})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-700">{formatTRY(cp.amount)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (form.customPayments || []).filter((p) => p.id !== cp.id);
                              const total = updated.reduce((s, p) => s + (p.amount || 0), 0);
                              onChangeForm((prev) => ({
                                ...prev,
                                customPayments: updated,
                                customPaymentsTotal: total,
                              }));
                            }}
                            className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BORDROYA AKTAR BUTONU */}
            <button
              type="button"
              id="transfer-additions-to-payroll-button"
              onClick={() => {
                showToast(`📥 Ek ödemeler (${formatTRY(totalAdditions)}) bordroya aktarıldı!`);

                const target = document.getElementById("payroll-deductions-summary-section");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Ek Ödemeleri Bordroya Aktar</span>
            </button>
          </div>

          {/* 3. Tüm Ek Ödemelerin Canlı İcmali (Tıklanıp Seçilebilir Liste) */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1">
              <span>EK ÖDEME LİSTESİ</span>
              <span>TUTAR (₺)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1.5 text-xs">
              {/* Yemek */}
              <button
                type="button"
                onClick={() => setSelectedAddition("food")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAddition === "food"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">🍱 Yemek</span>
                <span className="text-[11px] font-black text-emerald-700">
                  {formatTRY(form.foodAllowance ?? 0)}
                </span>
              </button>

              {/* Yol */}
              <button
                type="button"
                onClick={() => setSelectedAddition("road")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAddition === "road"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">🚌 Yol</span>
                <span className="text-[11px] font-black text-blue-700">
                  {formatTRY(form.roadAllowance ?? 0)}
                </span>
              </button>

              {/* Prim */}
              <button
                type="button"
                onClick={() => setSelectedAddition("bonus")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAddition === "bonus"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">🏆 Prim</span>
                <span className="text-[11px] font-black text-amber-700">
                  {formatTRY(form.bonusAmount ?? 0)}
                </span>
              </button>

              {/* Mesai */}
              <button
                type="button"
                onClick={() => setSelectedAddition("overtime")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAddition === "overtime"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">⏱️ Mesai</span>
                <span className="text-[11px] font-black text-purple-700">
                  {formatTRY(form.overtimePay ?? 0)}
                </span>
              </button>

              {/* Serbest Ek Kalemler */}
              <button
                type="button"
                onClick={() => setSelectedAddition("customList")}
                className={`col-span-2 sm:col-span-1 lg:col-span-2 p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedAddition === "customList" || selectedAddition === "addCustom"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">
                  🎁 Diğer Ek ({form.customPayments?.length || 0})
                </span>
                <span className="text-[11px] font-black text-emerald-800">
                  {formatTRY(customPaymentsTotal)}
                </span>
              </button>
            </div>
          </div>

          {/* 4. Alt Toplam */}
          <div className="pt-2 border-t border-emerald-100 flex items-center justify-between gap-2">
            <div>
              <span className="block text-[9px] text-slate-500 uppercase font-extrabold">
                TOPLAM EK ÖDEME:
              </span>
              <span className="text-sm font-black text-emerald-700">
                {formatTRY(totalAdditions)}
              </span>
            </div>

            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {additionsActiveCount} Kalem Aktif
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------------- */}
      {/* SAĞ PANEL: MANUEL KESİNTİ PANELİ (UYGULAMA TASARIMI İLE BİREBİR UYUMLU) */}
      {/* -------------------------------------------------------------------------------- */}
      <div
        id="pinned-manual-deduction-panel"
        className="bg-white rounded-3xl border border-rose-200/90 p-4 space-y-3.5 shadow-2xs text-slate-800 flex flex-col justify-between"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    Manuel Kesinti Paneli
                  </h4>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5 text-rose-600" />
                    Avans, SGK, BES & İcra
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Kesintileri girin, anında hesaplayıp bordroya aktarın
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  const autoAdv = getAutoAdvance(employee.id);
                  const autoLvs = getAutoLeaves(employee.id);
                  const baseGrossVal =
                    (form.salaryType ?? employee.salaryType) === "gross"
                      ? form.baseSalary ?? employee.salaryAmount
                      : (form.baseSalary ?? employee.salaryAmount) * 1.38;
                  const approxNet =
                    (form.salaryType ?? employee.salaryType) === "net"
                      ? form.baseSalary ?? employee.salaryAmount
                      : Math.round(baseGrossVal * 0.71);
                  const autoLegal = getAutoLegalDeductions(employee.id, approxNet);

                  onChangeForm((prev) => ({
                    ...prev,
                    advanceDeduction: autoAdv.totalAdvance,
                    advanceReason:
                      autoAdv.reasons.length > 0
                        ? autoAdv.reasons.join(", ")
                        : "Personel maaş avansı mahsubu",
                    unpaidLeaveDays: autoLvs.unpaidDays,
                    missingDayReason:
                      autoLvs.reasons.length > 0 ? autoLvs.reasons.join(", ") : "",
                    missingDayCode: autoLvs.primaryCode || "21",
                    besDeduction:
                      autoLegal.besDeduction > 0
                        ? autoLegal.besDeduction
                        : employee.hasBes
                        ? Math.round(
                            (employee.salaryAmount * (employee.salaryType === "net" ? 1.38 : 1)) *
                              0.03
                          )
                        : 0,
                    executionDeduction: autoLegal.executionDeduction,
                    alimonyDeduction: autoLegal.alimonyDeduction,
                    otherDeductions: autoLegal.otherDeductions,
                    deductionReason: autoLegal.reasonsSummary,
                  }));
                  showToast("⚡ Tüm kesintiler sistem kayıtlarından otomatik yenilendi.");
                }}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                title="İzin, Avans ve İcra kayıtlarından otomatik doldur"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Oto-Doldur</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeForm((prev) => ({
                    ...prev,
                    advanceDeduction: 0,
                    unpaidLeaveDays: 0,
                    besDeduction: 0,
                    executionDeduction: 0,
                    alimonyDeduction: 0,
                    otherDeductions: 0,
                    deductionReason: "",
                  }));
                  showToast("🧹 Tüm kesintiler sıfırlandı.");
                }}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                title="Tüm kesintileri sıfırla (0 ₺)"
              >
                Sıfırla
              </button>
            </div>
          </div>

          {/* 1. Kesinti Tipi Seçici Çipler */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Kesinti Türü:
              </span>
              <span className="text-[10px] font-bold text-rose-700">
                Hızlı Giriş
              </span>
            </div>

            {/* Hızlı Seçim Çipleri */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1">
              {[
                { id: "advance", label: "Avans", icon: "💰" },
                { id: "unpaidLeave", label: "Eksik Gün", icon: "📅" },
                { id: "bes", label: "BES", icon: "🛡️" },
                { id: "execution", label: "İcra", icon: "⚖️" },
                { id: "alimony", label: "Nafaka", icon: "🏛️" },
                { id: "other", label: "Diğer", icon: "📋" },
              ].map((item) => {
                const isSelected = selectedDeduction === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDeduction(item.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400 shadow-xs scale-[1.02]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Seçili Kesintiyi Panel İçinde Doğrudan Düzenleme */}
          <div className="bg-rose-50/50 rounded-2xl border border-rose-200/90 p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-rose-950 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-700" />
                Seçili Kesinti Değeri (Canlı Giriş):
              </span>
              <span className="text-[10px] font-bold text-rose-700">
                Anında Bordroya Yansır
              </span>
            </div>

            {/* Dinamik Canlı İnput & Açıklama */}
            {selectedDeduction === "advance" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">Avans Kesinti Tutarı:</span>
                    <span className="text-[10px] text-amber-700 font-bold">₺ Cinsinden</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="floating-deduction-value-input"
                      type="number"
                      min="0"
                      value={form.advanceDeduction ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          advanceDeduction: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Avans Açıklaması / Mahsup Gerekçesi:
                  </label>
                  <input
                    type="text"
                    value={form.advanceReason || ""}
                    onChange={(e) =>
                      onChangeForm((prev) => ({
                        ...prev,
                        advanceReason: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    placeholder="Örn: Personel maaş avansı mahsubu"
                  />
                </div>

                <p className="text-[10px] text-slate-500">
                  {getAutoAdvance(employee.id).totalAdvance > 0
                    ? `✓ Sistem Kaydı: ${formatTRY(getAutoAdvance(employee.id).totalAdvance)}`
                    : "Manuel avans kesintisi girilmektedir."}
                </p>
              </div>
            )}

            {selectedDeduction === "unpaidLeave" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-bold">Eksik Gün:</span>
                      <span className="text-[10px] text-rose-700 font-bold">Gün</span>
                    </div>
                    <input
                      id="floating-deduction-value-input"
                      type="number"
                      min="0"
                      max="30"
                      value={form.unpaidLeaveDays ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          unpaidLeaveDays: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">SGK Kodu:</span>
                    <select
                      value={form.missingDayCode || "21"}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          missingDayCode: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    >
                      <option value="21">21 - Ücretsiz İzin</option>
                      <option value="01">01 - İstirahat / Rapor</option>
                      <option value="03">03 - Disiplin Cezası</option>
                      <option value="07">07 - Puantaj Kaydı</option>
                      <option value="13">13 - Diğer Nedenler</option>
                      <option value="15">15 - Devamsızlık</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Eksik Gün Gerekçesi / Rapor Açıklaması:
                  </label>
                  <input
                    type="text"
                    value={form.missingDayReason || ""}
                    onChange={(e) =>
                      onChangeForm((prev) => ({
                        ...prev,
                        missingDayReason: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    placeholder="Örn: 3 gün ücretsiz mazeret izni"
                  />
                </div>
              </div>
            )}

            {selectedDeduction === "bes" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">Bireysel Emeklilik (BES):</span>
                    <span className="text-[10px] text-indigo-700 font-bold">%3 Otomatik</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="floating-deduction-value-input"
                      type="number"
                      min="0"
                      value={form.besDeduction ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          besDeduction: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    BES Planı / Kesinti Açıklaması:
                  </label>
                  <input
                    type="text"
                    value={form.besReason || ""}
                    onChange={(e) =>
                      onChangeForm((prev) => ({
                        ...prev,
                        besReason: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    placeholder="Örn: Otomatik Katılım BES (%3)"
                  />
                </div>
              </div>
            )}

            {selectedDeduction === "execution" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">İcra / Maaş Haczi Tutarı:</span>
                    <span className="text-[10px] text-red-700 font-bold">1/4 Haciz</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="floating-deduction-value-input"
                      type="number"
                      min="0"
                      value={form.executionDeduction ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          executionDeduction: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    İcra Dairesi, Dosya No & Gerekçe:
                  </label>
                  <input
                    type="text"
                    value={form.executionReason || ""}
                    onChange={(e) =>
                      onChangeForm((prev) => ({
                        ...prev,
                        executionReason: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    placeholder="Örn: İstanbul 4. İcra 2026/142 Esas"
                  />
                </div>
              </div>
            )}

            {selectedDeduction === "alimony" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">Nafaka Kesintisi Tutarı:</span>
                    <span className="text-[10px] text-purple-700 font-bold">Öncelikli</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="floating-deduction-value-input"
                      type="number"
                      min="0"
                      value={form.alimonyDeduction ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          alimonyDeduction: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Mahkeme İlamı & Dosya Açıklaması:
                  </label>
                  <input
                    type="text"
                    value={form.alimonyReason || ""}
                    onChange={(e) =>
                      onChangeForm((prev) => ({
                        ...prev,
                        alimonyReason: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    placeholder="Örn: Ankara 2. Aile Mahkemesi 2025/314 K."
                  />
                </div>
              </div>
            )}

            {selectedDeduction === "other" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-bold">Diğer Kesinti Tutarı:</span>
                    <span className="text-[10px] text-slate-600 font-bold">₺ Cinsinden</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      id="floating-deduction-value-input"
                      type="number"
                      min="0"
                      value={form.otherDeductions ?? 0}
                      onChange={(e) =>
                        onChangeForm((prev) => ({
                          ...prev,
                          otherDeductions: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl py-1.5 pl-7 pr-3 font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">
                    Kesinti Türü ve Açıklaması:
                  </label>
                  <input
                    type="text"
                    value={form.otherReason || ""}
                    onChange={(e) =>
                      onChangeForm((prev) => ({
                        ...prev,
                        otherReason: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl py-1.5 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    placeholder="Örn: Sendika aidatı, lojman/yemek kesintisi vb."
                  />
                </div>
              </div>
            )}

            {/* BORDROYA AÇIKLAMALARI İLE BİRLİKTE AKTAR BUTONU */}
            <button
              type="button"
              id="transfer-deductions-to-payroll-button"
              onClick={() => {
                const reasons: string[] = [];
                if ((form.advanceDeduction ?? 0) > 0) {
                  reasons.push(
                    `Avans: ${form.advanceReason || "Personel maaş avansı mahsubu"} (${formatTRY(
                      form.advanceDeduction ?? 0
                    )})`
                  );
                }
                if ((form.unpaidLeaveDays ?? 0) > 0) {
                  reasons.push(
                    `Eksik Gün (${form.missingDayCode || "21"}): ${
                      form.missingDayReason || "Ücretsiz İzin"
                    } (${form.unpaidLeaveDays} Gün)`
                  );
                }
                if ((form.besDeduction ?? 0) > 0) {
                  reasons.push(
                    `BES (%3): ${form.besReason || "Otomatik Katılım BES"} (${formatTRY(
                      form.besDeduction ?? 0
                    )})`
                  );
                }
                if ((form.executionDeduction ?? 0) > 0) {
                  reasons.push(
                    `İcra: ${form.executionReason || "İcra Dairesi Haciz Müzekkeresi"} (${formatTRY(
                      form.executionDeduction ?? 0
                    )})`
                  );
                }
                if ((form.alimonyDeduction ?? 0) > 0) {
                  reasons.push(
                    `Nafaka: ${form.alimonyReason || "Aile Mahkemesi Nafaka İlamı"} (${formatTRY(
                      form.alimonyDeduction ?? 0
                    )})`
                  );
                }
                if ((form.otherDeductions ?? 0) > 0) {
                  reasons.push(
                    `Diğer: ${form.otherReason || "Diğer kesintiler"} (${formatTRY(
                      form.otherDeductions ?? 0
                    )})`
                  );
                }

                const compiledSummary = reasons.join(" | ");
                onChangeForm((prev) => ({
                  ...prev,
                  deductionReason: compiledSummary || prev.deductionReason,
                }));

                showToast("📥 Kesintiler ve açıklamaları bordroya başarıyla aktarıldı!");

                const target = document.getElementById("payroll-deductions-summary-section");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 text-rose-200" />
              <span>Bordroya Açıklamaları ile Birlikte Aktar</span>
            </button>
          </div>

          {/* 3. Tüm Kesintilerin Canlı İcmali (Tıklanıp Seçilebilir Liste) */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1">
              <span>KESİNTİ LİSTESİ</span>
              <span>TUTAR / GÜN</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-1.5 text-xs">
              {/* Avans */}
              <button
                type="button"
                onClick={() => setSelectedDeduction("advance")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedDeduction === "advance"
                    ? "bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">💰 Avans</span>
                <span className="text-[11px] font-black text-amber-700">
                  {formatTRY(form.advanceDeduction ?? 0)}
                </span>
              </button>

              {/* Eksik Gün */}
              <button
                type="button"
                onClick={() => setSelectedDeduction("unpaidLeave")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedDeduction === "unpaidLeave"
                    ? "bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">📅 Eksik Gün</span>
                <span className="text-[11px] font-black text-rose-700">
                  {form.unpaidLeaveDays ?? 0} Gün
                </span>
              </button>

              {/* BES */}
              <button
                type="button"
                onClick={() => setSelectedDeduction("bes")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedDeduction === "bes"
                    ? "bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">🛡️ BES (%3)</span>
                <span className="text-[11px] font-black text-indigo-700">
                  {formatTRY(form.besDeduction ?? 0)}
                </span>
              </button>

              {/* İcra */}
              <button
                type="button"
                onClick={() => setSelectedDeduction("execution")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedDeduction === "execution"
                    ? "bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">⚖️ İcra</span>
                <span className="text-[11px] font-black text-red-700">
                  {formatTRY(form.executionDeduction ?? 0)}
                </span>
              </button>

              {/* Nafaka */}
              <button
                type="button"
                onClick={() => setSelectedDeduction("alimony")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedDeduction === "alimony"
                    ? "bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">🏛️ Nafaka</span>
                <span className="text-[11px] font-black text-purple-700">
                  {formatTRY(form.alimonyDeduction ?? 0)}
                </span>
              </button>

              {/* Diğer */}
              <button
                type="button"
                onClick={() => setSelectedDeduction("other")}
                className={`p-1.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  selectedDeduction === "other"
                    ? "bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-[10px] font-medium">📋 Diğer</span>
                <span className="text-[11px] font-black text-slate-700">
                  {formatTRY(form.otherDeductions ?? 0)}
                </span>
              </button>
            </div>
          </div>

          {/* 4. Alt Toplam */}
          <div className="pt-2 border-t border-rose-100 flex items-center justify-between gap-2">
            <div>
              <span className="block text-[9px] text-slate-500 uppercase font-extrabold">
                TOPLAM KESİNTİ:
              </span>
              <span className="text-sm font-black text-rose-700">
                {formatTRY(totalDeductions)}
              </span>
            </div>

            <span className="text-[10px] text-rose-800 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              {deductionsActiveCount} Kalem Aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
