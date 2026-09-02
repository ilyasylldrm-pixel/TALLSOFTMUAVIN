import React, { useState } from "react";
import { InvoiceItem } from "../types";
import {
  GIB_WITHHOLDING_CODES,
  GIB_SPECIAL_TAX_BASE_CODES,
  GIB_EXEMPTION_CODES,
  getWithholdingCodeInfo,
  getExemptionCodeInfo,
} from "../data/gibTaxCodes";
import { computeInvoiceItem } from "../utils/taxCalculationService";
import { formatCurrency } from "../utils/exportUtils";
import {
  X,
  Percent,
  Calculator,
  ShieldCheck,
  HelpCircle,
  Check,
  RotateCcw,
  Sliders,
  Car,
} from "lucide-react";

export interface InvoiceTaxSettingsModalProps {
  isOpen: boolean;
  item: InvoiceItem | null;
  currency?: string;
  onClose: () => void;
  onApply: (updatedItem: InvoiceItem) => void;
}

type TabType = "tevkifat" | "ozel_matrah" | "istisna" | "ek_vergiler";

export const InvoiceTaxSettingsModal: React.FC<InvoiceTaxSettingsModalProps> = ({
  isOpen,
  item,
  currency = "TRY",
  onClose,
  onApply,
}) => {
  if (!isOpen || !item) return null;

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (item.withholdingCode || (item.withholdingRate && item.withholdingRate > 0)) return "tevkifat";
    if (item.specialTaxBaseCode || (item.specialTaxBase !== undefined && item.specialTaxBase !== null)) return "ozel_matrah";
    if (item.exemptionCode || item.vatRate === 0) return "istisna";
    return "tevkifat";
  });

  // Local State
  const [withholdingEnabled, setWithholdingEnabled] = useState<boolean>(
    Boolean(item.withholdingCode || (item.withholdingRate && item.withholdingRate > 0))
  );
  const [withholdingCode, setWithholdingCode] = useState<string>(item.withholdingCode || "618");
  const [numerator, setNumerator] = useState<number>(item.withholdingRateNumerator || 5);
  const [denominator, setDenominator] = useState<number>(item.withholdingRateDenominator || 10);

  // Özel Matrah State
  const [specialTaxBaseEnabled, setSpecialTaxBaseEnabled] = useState<boolean>(
    Boolean(item.specialTaxBaseCode || (item.specialTaxBase !== undefined && item.specialTaxBase !== null))
  );
  const [specialTaxBaseCode, setSpecialTaxBaseCode] = useState<string>(item.specialTaxBaseCode || "809");
  const [costPrice, setCostPrice] = useState<number>(item.costPrice || 0);
  const [customTaxBase, setCustomTaxBase] = useState<string>(
    item.specialTaxBase !== undefined && item.specialTaxBase !== null ? String(item.specialTaxBase) : ""
  );

  // İstisna State
  const [exemptionEnabled, setExemptionEnabled] = useState<boolean>(
    Boolean(item.exemptionCode || item.vatRate === 0)
  );
  const [exemptionCode, setExemptionCode] = useState<string>(item.exemptionCode || "301");
  const [exemptionReason, setExemptionReason] = useState<string>(item.exemptionReason || "");

  // Ek Vergiler State
  const [otvRate, setOtvRate] = useState<number>(item.otvRate || 0);
  const [oivRate, setOivRate] = useState<number>(item.oivRate || 0);
  const [accommodationTaxRate, setAccommodationTaxRate] = useState<number>(item.accommodationTaxRate || 0);
  const [stopajRate, setStopajRate] = useState<number>(item.stopajRate || 0);

  // Handle Tab Switch & Auto-enable corresponding tax profile
  const handleTabChange = (targetTab: TabType) => {
    setActiveTab(targetTab);
    if (targetTab === "tevkifat") {
      setWithholdingEnabled(true);
      setSpecialTaxBaseEnabled(false);
      setExemptionEnabled(false);
      if (!withholdingCode) {
        setWithholdingCode("618");
        setNumerator(5);
        setDenominator(10);
      }
    } else if (targetTab === "ozel_matrah") {
      setSpecialTaxBaseEnabled(true);
      setWithholdingEnabled(false);
      setExemptionEnabled(false);
      if (!specialTaxBaseCode) {
        setSpecialTaxBaseCode("809");
      }
    } else if (targetTab === "istisna") {
      setExemptionEnabled(true);
      setWithholdingEnabled(false);
      setSpecialTaxBaseEnabled(false);
      if (!exemptionCode) {
        setExemptionCode("301");
        setExemptionReason("301 - Mal İhracatı");
      }
    }
  };

  // Handle Withholding Code Change
  const handleSelectWithholdingCode = (code: string) => {
    setWithholdingCode(code);
    const info = getWithholdingCodeInfo(code);
    if (info) {
      setNumerator(info.numerator);
      setDenominator(info.denominator);
    }
  };

  // Quick select preset numerator
  const handleSelectQuickRatio = (num: number, den = 10) => {
    setWithholdingEnabled(true);
    setNumerator(num);
    setDenominator(den);
    // Find matching code if any
    const match = GIB_WITHHOLDING_CODES.find((w) => w.numerator === num && w.denominator === den);
    if (match) {
      setWithholdingCode(match.code);
    }
  };

  // Compute Live Item preview
  const previewItem: InvoiceItem = {
    ...item,
    vatRate: exemptionEnabled ? 0 : item.vatRate === 0 ? 20 : item.vatRate,
    withholdingCode: withholdingEnabled ? withholdingCode : undefined,
    withholdingRateNumerator: withholdingEnabled ? numerator : undefined,
    withholdingRateDenominator: withholdingEnabled ? denominator : undefined,
    withholdingRate: withholdingEnabled ? (numerator / denominator) : 0,
    specialTaxBaseCode: specialTaxBaseEnabled ? specialTaxBaseCode : undefined,
    specialTaxBase: specialTaxBaseEnabled
      ? customTaxBase !== ""
        ? Number(customTaxBase)
        : Math.max(0, (item.quantity * item.unitPrice) - costPrice)
      : undefined,
    costPrice: specialTaxBaseEnabled ? costPrice : undefined,
    exemptionCode: exemptionEnabled ? exemptionCode : undefined,
    exemptionReason: exemptionEnabled ? (exemptionReason || getExemptionCodeInfo(exemptionCode)?.name) : undefined,
    otvRate: otvRate > 0 ? otvRate : undefined,
    oivRate: oivRate > 0 ? oivRate : undefined,
    accommodationTaxRate: accommodationTaxRate > 0 ? accommodationTaxRate : undefined,
    stopajRate: stopajRate > 0 ? stopajRate : undefined,
  };

  const computed = computeInvoiceItem(previewItem);

  // Handle Save
  const handleSave = () => {
    onApply(previewItem);
    onClose();
  };

  // Reset all
  const handleReset = () => {
    setWithholdingEnabled(false);
    setSpecialTaxBaseEnabled(false);
    setExemptionEnabled(false);
    setOtvRate(0);
    setOivRate(0);
    setAccommodationTaxRate(0);
    setStopajRate(0);
    onApply({
      ...item,
      withholdingCode: undefined,
      withholdingRateNumerator: undefined,
      withholdingRateDenominator: undefined,
      withholdingRate: undefined,
      specialTaxBaseCode: undefined,
      specialTaxBase: undefined,
      costPrice: undefined,
      exemptionCode: undefined,
      exemptionReason: undefined,
      otvRate: undefined,
      oivRate: undefined,
      accommodationTaxRate: undefined,
      stopajRate: undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-3.5 sm:p-4 shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Kalem Vergi &amp; Tevkifat / Özel Matrah Ayarları</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-md">
                Kalem: <span className="font-bold text-slate-700">{item.description || "Hizmet / Ürün Kalemi"}</span> ({item.quantity} {item.unit || "Adet"} × {formatCurrency(item.unitPrice, currency)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 group shrink-0"
            title="Kapat"
          >
            <X className="w-4 h-4 text-slate-500 group-hover:text-rose-600 transition-transform group-hover:rotate-90" />
            <span className="font-extrabold">Kapat</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100/70 p-1.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange("tevkifat")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tevkifat"
                ? "bg-white text-purple-700 shadow-2xs border border-purple-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>KDV Tevkifatı</span>
            {withholdingEnabled && (
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("ozel_matrah")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ozel_matrah"
                ? "bg-white text-amber-700 shadow-2xs border border-amber-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Özel Matrah (2. El / Kâr Marjı)</span>
            {specialTaxBaseEnabled && (
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("istisna")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "istisna"
                ? "bg-white text-emerald-700 shadow-2xs border border-emerald-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KDV İstisnası (%0)</span>
            {exemptionEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("ek_vergiler")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ek_vergiler"
                ? "bg-white text-indigo-700 shadow-2xs border border-indigo-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Ek Vergiler (ÖTV / Stopaj)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* TAB 1: TEVKİFAT */}
          {activeTab === "tevkifat" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/80 border border-purple-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="withholding-toggle"
                    checked={withholdingEnabled}
                    onChange={(e) => setWithholdingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="withholding-toggle" className="font-bold text-purple-950 cursor-pointer text-xs">
                    Bu Kalemde KDV Tevkifatı Uygula
                  </label>
                </div>
                {withholdingEnabled && (
                  <span className="text-[11px] font-mono font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    {numerator}/{denominator} Oranında
                  </span>
                )}
              </div>

              {withholdingEnabled && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 animate-fadeIn">
                  {/* Hızlı Oran Seçimi */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Sık Kullanılan Tevkifat Oranları:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { num: 2, label: "2/10" },
                        { num: 3, label: "3/10" },
                        { num: 4, label: "4/10" },
                        { num: 5, label: "5/10" },
                        { num: 7, label: "7/10" },
                        { num: 9, label: "9/10" },
                        { num: 10, label: "10/10 (Tam)" },
                      ].map((itemRatio) => (
                        <button
                          key={itemRatio.num}
                          type="button"
                          onClick={() => handleSelectQuickRatio(itemRatio.num, 10)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            numerator === itemRatio.num && denominator === 10
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                          }`}
                        >
                          {itemRatio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resmi GİB Kodu Seçimi */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Resmi GİB Tevkifat Kodu ve İşlem Türü:
                      </label>
                    </div>
                    <select
                      value={withholdingCode}
                      onChange={(e) => handleSelectWithholdingCode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                    >
                      {GIB_WITHHOLDING_CODES.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {w.name} [{w.rateLabel}] ({w.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Açıklama */}
                  {getWithholdingCodeInfo(withholdingCode)?.description && (
                    <div className="p-2 bg-purple-50/50 border border-purple-100 rounded-lg text-[11px] text-purple-900 flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>{getWithholdingCodeInfo(withholdingCode)?.description}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ÖZEL MATRAH */}
          {activeTab === "ozel_matrah" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="special-tax-base-toggle"
                    checked={specialTaxBaseEnabled}
                    onChange={(e) => setSpecialTaxBaseEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="special-tax-base-toggle" className="font-bold text-amber-950 cursor-pointer text-xs">
                    Özel Matrah (Kâr Marjı / 2. El / Kıymetli Maden) Uygula
                  </label>
                </div>
                {specialTaxBaseEnabled && (
                  <span className="text-[11px] font-mono font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full">
                    KDV Kanunu Md. 23
                  </span>
                )}
              </div>

              {specialTaxBaseEnabled && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 animate-fadeIn">
                  {/* Özel Matrah Türü Seçimi */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Özel Matrah Nedeni (GİB Kodu):
                    </label>
                    <select
                      value={specialTaxBaseCode}
                      onChange={(e) => setSpecialTaxBaseCode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      {GIB_SPECIAL_TAX_BASE_CODES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} - {s.name} ({s.lawArticle})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kâr Marjı Hesaplama Kutusu (Örn 2. El Araç) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Satış Fiyatı (Toplam)
                      </label>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs">
                        {formatCurrency(item.quantity * item.unitPrice, currency)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1">
                        Alış Maliyeti (Gider)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        placeholder="ör: 900000"
                        value={costPrice || ""}
                        onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-1">
                        Kâr Marjı (KDV Matrahı)
                      </label>
                      <div className="p-2 bg-amber-100/90 border border-amber-300 rounded-lg font-mono font-black text-amber-950 text-xs">
                        {formatCurrency(Math.max(0, (item.quantity * item.unitPrice) - costPrice), currency)}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                    <p className="font-semibold text-slate-800">📌 GİB Fatura Dip Notu:</p>
                    <p className="italic">
                      "3065 Sayılı KDV Kanunu 23/f Maddesi Uyarınca KDV Yalnızca Kâr Marjı ({formatCurrency(Math.max(0, (item.quantity * item.unitPrice) - costPrice), currency)}) Üzerinden Hesaplanmıştır."
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: İSTİSNA (%0 KDV) */}
          {activeTab === "istisna" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exemption-toggle"
                    checked={exemptionEnabled}
                    onChange={(e) => setExemptionEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="exemption-toggle" className="font-bold text-emerald-950 cursor-pointer text-xs">
                    KDV İstisnası / Muafiyeti Uygula (%0 KDV)
                  </label>
                </div>
                {exemptionEnabled && (
                  <span className="text-[11px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    KDV %0
                  </span>
                )}
              </div>

              {exemptionEnabled && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      GİB KDV İstisna Kodu ve Maddesi:
                    </label>
                    <select
                      value={exemptionCode}
                      onChange={(e) => setExemptionCode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                    >
                      {GIB_EXEMPTION_CODES.map((e) => (
                        <option key={e.code} value={e.code}>
                          {e.code} - {e.name} ({e.lawArticle})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Özel İstisna Açıklaması (İsteğe Bağlı):
                    </label>
                    <input
                      type="text"
                      placeholder="ör: 3065 SK. 11/1-a Mal İhracatı Kapsamında KDV'siz Teslim"
                      value={exemptionReason}
                      onChange={(e) => setExemptionReason(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EK VERGİLER */}
          {activeTab === "ek_vergiler" && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {/* ÖTV */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ÖTV Oranı (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    placeholder="ör: 20"
                    value={otvRate || ""}
                    onChange={(e) => setOtvRate(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* ÖİV */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ÖİV Oranı (% - Özel İletişim)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="ör: 10"
                    value={oivRate || ""}
                    onChange={(e) => setOivRate(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Konaklama Vergisi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Konaklama Vergisi (% - Otel/Tesis)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    placeholder="ör: 2"
                    value={accommodationTaxRate || ""}
                    onChange={(e) => setAccommodationTaxRate(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Stopaj */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gelir Stopajı (% - Stopaj Kesintisi)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    placeholder="ör: 20"
                    value={stopajRate || ""}
                    onChange={(e) => setStopajRate(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CANLI HESAPLAMA ÖZET KARTI */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 space-y-2.5 shadow-lg border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kalem Canlı Hesaplama Özeti</span>
              </span>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                KDV %{computed.vatRate}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Mal/Hizmet Tutarı:</span>
                <span className="font-mono font-bold">{formatCurrency(computed.totalWithoutVat, currency)}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">KDV Matrahı:</span>
                <span className="font-mono font-bold text-amber-300">{formatCurrency(computed.effectiveTaxableAmount, currency)}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Hesaplanan KDV:</span>
                <span className="font-mono font-bold text-indigo-300">{formatCurrency(computed.calculatedVatAmount, currency)}</span>
              </div>

              <div>
                <span className="text-rose-400 block text-[10px]">Tevkif Edilen KDV:</span>
                <span className="font-mono font-bold text-rose-300">
                  {computed.withholdingAmount > 0 ? ("-" + formatCurrency(computed.withholdingAmount, currency)) : "0,00 ₺"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-300">
                Tahsil Edilecek Satır Tutarı:
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                {formatCurrency(computed.totalWithoutVat + computed.payableVatAmount, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tümünü Sıfırla</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Ayarları Uygula</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
