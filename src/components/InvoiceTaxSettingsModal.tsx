import React, { useState } from "react";
import { InvoiceItem, ItemAdditionalTax } from "../types";
import {
  GIB_WITHHOLDING_CODES,
  GIB_SPECIAL_TAX_BASE_CODES,
  GIB_EXEMPTION_CODES,
  GIB_ADDITIONAL_TAX_CODES,
  getWithholdingCodeInfo,
  getExemptionCodeInfo,
  getSpecialTaxBaseCodeInfo,
  getAdditionalTaxCodeInfo,
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
  Plus,
  Trash2,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";

export interface InvoiceTaxSettingsModalProps {
  isOpen: boolean;
  item: InvoiceItem | null;
  currency?: string;
  initialTab?: "tevkifat" | "ozel_matrah" | "istisna" | "ek_vergiler";
  onClose: () => void;
  onApply: (updatedItem: InvoiceItem) => void;
}

type TabType = "tevkifat" | "ozel_matrah" | "istisna" | "ek_vergiler";

const extractItemAdditionalTaxes = (targetItem: InvoiceItem): ItemAdditionalTax[] => {
  if (targetItem.additionalTaxes && Array.isArray(targetItem.additionalTaxes) && targetItem.additionalTaxes.length > 0) {
    return [...targetItem.additionalTaxes];
  }
  const list: ItemAdditionalTax[] = [];
  if (targetItem.otvRate && targetItem.otvRate > 0) {
    list.push({
      id: "legacy_otv",
      code: "0074",
      name: "ÖTV 4.LİSTE",
      calculationType: "percent",
      rate: targetItem.otvRate,
      amount: targetItem.otvAmount || 0,
      isDeduction: false,
    });
  }
  if (targetItem.oivRate && targetItem.oivRate > 0) {
    list.push({
      id: "legacy_oiv",
      code: "4080",
      name: "Ö.İLETİŞİM V",
      calculationType: "percent",
      rate: targetItem.oivRate,
      amount: targetItem.oivAmount || 0,
      isDeduction: false,
    });
  }
  if (targetItem.accommodationTaxRate && targetItem.accommodationTaxRate > 0) {
    list.push({
      id: "legacy_acc",
      code: "0059",
      name: "KONAKLAMA VERGİSİ",
      calculationType: "percent",
      rate: targetItem.accommodationTaxRate,
      amount: targetItem.accommodationTaxAmount || 0,
      isDeduction: false,
    });
  }
  if (targetItem.stopajRate && targetItem.stopajRate > 0) {
    list.push({
      id: "legacy_stopaj",
      code: "0003",
      name: "GV STOPAJI",
      calculationType: "percent",
      rate: targetItem.stopajRate,
      amount: targetItem.stopajAmount || 0,
      isDeduction: true,
    });
  }
  return list;
};

export const InvoiceTaxSettingsModal: React.FC<InvoiceTaxSettingsModalProps> = ({
  isOpen,
  item,
  currency = "TRY",
  initialTab,
  onClose,
  onApply,
}) => {
  if (!isOpen || !item) return null;

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialTab) return initialTab;
    if (item.withholdingCode || (item.withholdingRate && item.withholdingRate > 0)) return "tevkifat";
    if (item.specialTaxBaseCode || (item.specialTaxBase !== undefined && item.specialTaxBase !== null)) return "ozel_matrah";
    if (item.exemptionCode || item.vatRate === 0) return "istisna";
    if (item.additionalTaxes && item.additionalTaxes.length > 0) return "ek_vergiler";
    return "tevkifat";
  });

  // Local State
  const [withholdingEnabled, setWithholdingEnabled] = useState<boolean>(
    Boolean(item.withholdingCode || (item.withholdingRate && item.withholdingRate > 0))
  );
  const [withholdingCode, setWithholdingCode] = useState<string>(item.withholdingCode || "601");
  const [numerator, setNumerator] = useState<number>(item.withholdingRateNumerator || 4);
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

  // Ek Vergiler State (GİB Listesine Göre)
  const [additionalTaxes, setAdditionalTaxes] = useState<ItemAdditionalTax[]>(() =>
    extractItemAdditionalTaxes(item)
  );

  // Ek Vergi Ekleme Form Alanları
  const [selectedTaxCode, setSelectedTaxCode] = useState<string>("0074");
  const [selectedCalcType, setSelectedCalcType] = useState<"percent" | "fixed">("percent");
  const [inputRate, setInputRate] = useState<number>(20);
  const [inputFixedAmount, setInputFixedAmount] = useState<number>(0);
  const [inputIsDeduction, setInputIsDeduction] = useState<boolean>(false);

  // Handle Tab Switch & Auto-enable corresponding tax profile
  const handleTabChange = (targetTab: TabType) => {
    setActiveTab(targetTab);
    if (targetTab === "tevkifat") {
      setWithholdingEnabled(true);
      setSpecialTaxBaseEnabled(false);
      setExemptionEnabled(false);
      if (!withholdingCode) {
        setWithholdingCode("601");
        setNumerator(4);
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

  // Ek Vergi Seçimi ve Ekleme İşlemleri
  const handleSelectTaxCode = (code: string) => {
    setSelectedTaxCode(code);
    const info = getAdditionalTaxCodeInfo(code);
    if (info) {
      setSelectedCalcType(info.type);
      setInputRate(info.defaultRate || 0);
      setInputFixedAmount(info.defaultAmount || 0);
      setInputIsDeduction(info.isDeduction);
    }
  };

  const handleAddTax = () => {
    const info = getAdditionalTaxCodeInfo(selectedTaxCode);
    const name = info?.name || selectedTaxCode;

    const newTax: ItemAdditionalTax = {
      id: "tax_" + selectedTaxCode + "_" + Date.now(),
      code: selectedTaxCode,
      name,
      calculationType: selectedCalcType,
      rate: selectedCalcType === "percent" ? inputRate : undefined,
      amount: selectedCalcType === "fixed" ? inputFixedAmount : 0,
      isDeduction: inputIsDeduction,
    };

    setAdditionalTaxes((prev) => {
      const filtered = prev.filter((t) => t.code !== selectedTaxCode);
      return [...filtered, newTax];
    });
  };

  const handleQuickAddTax = (
    code: string,
    rate: number,
    isDeduct = false,
    type: "percent" | "fixed" = "percent"
  ) => {
    const info = getAdditionalTaxCodeInfo(code);
    const newTax: ItemAdditionalTax = {
      id: "tax_" + code + "_" + Date.now(),
      code,
      name: info?.name || code,
      calculationType: type,
      rate: type === "percent" ? rate : undefined,
      amount: type === "fixed" ? rate : 0,
      isDeduction: isDeduct,
    };
    setAdditionalTaxes((prev) => {
      const filtered = prev.filter((t) => t.code !== code);
      return [...filtered, newTax];
    });
  };

  const handleRemoveTax = (code: string) => {
    setAdditionalTaxes((prev) => prev.filter((t) => t.code !== code));
  };

  const handleUpdateTaxRate = (code: string, newRate: number) => {
    setAdditionalTaxes((prev) =>
      prev.map((t) => (t.code === code ? { ...t, rate: newRate } : t))
    );
  };

  // Compute Live Item preview
  const previewItem: InvoiceItem = {
    ...item,
    vatRate: exemptionEnabled ? 0 : item.vatRate === 0 ? 20 : item.vatRate,
    withholdingCode: withholdingEnabled ? withholdingCode : undefined,
    withholdingRateNumerator: withholdingEnabled ? numerator : undefined,
    withholdingRateDenominator: withholdingEnabled ? denominator : undefined,
    withholdingRate: withholdingEnabled ? numerator / denominator : 0,
    specialTaxBaseCode: specialTaxBaseEnabled ? specialTaxBaseCode : undefined,
    specialTaxBase: specialTaxBaseEnabled
      ? customTaxBase !== ""
        ? Number(customTaxBase)
        : Math.max(0, item.quantity * item.unitPrice - costPrice)
      : undefined,
    costPrice: specialTaxBaseEnabled ? costPrice : undefined,
    exemptionCode: exemptionEnabled ? exemptionCode : undefined,
    exemptionReason: exemptionEnabled
      ? exemptionReason || getExemptionCodeInfo(exemptionCode)?.name
      : undefined,
    additionalTaxes,
    // Geriye dönük alan senkronizasyonu
    otvRate: additionalTaxes.find((t) => t.code.startsWith("007") || t.code === "9077")?.rate,
    otvAmount: additionalTaxes.find((t) => t.code.startsWith("007") || t.code === "9077")?.amount,
    oivRate: additionalTaxes.find((t) => t.code === "4080" || t.code === "4081")?.rate,
    oivAmount: additionalTaxes.find((t) => t.code === "4080" || t.code === "4081")?.amount,
    accommodationTaxRate: additionalTaxes.find((t) => t.code === "0059")?.rate,
    accommodationTaxAmount: additionalTaxes.find((t) => t.code === "0059")?.amount,
    stopajRate: additionalTaxes.find((t) => t.code === "0003" || t.code === "0011")?.rate,
    stopajAmount: additionalTaxes.find((t) => t.code === "0003" || t.code === "0011")?.amount,
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
    setAdditionalTaxes([]);
    const clearedItem: InvoiceItem = {
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
      additionalTaxes: [],
      otvRate: undefined,
      otvAmount: undefined,
      oivRate: undefined,
      oivAmount: undefined,
      accommodationTaxRate: undefined,
      accommodationTaxAmount: undefined,
      stopajRate: undefined,
      stopajAmount: undefined,
    };
    onApply(clearedItem);
    onClose();
  };

  return (
    <DetailPageLayout
      title="Kalem Vergi & Tevkifat / Özel Matrah Ayarları"
      subtitle={`Seçili Kalem: ${item.description || "Hizmet / Ürün Kalemi"} (${item.quantity} ${item.unit || "Adet"} × ${formatCurrency(item.unitPrice, currency)})`}
      breadcrumbs={[
        { label: "Faturalar", onClick: onClose },
        { label: "Vergi & Tevkifat Ayarları", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
          GİB VERGİ DÜZENLEMESİ
        </span>
      }
      headerIcon={<Sliders className="w-5 h-5 text-purple-600" />}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Ayarları Uygula</span>
          </button>
        </div>
      }
    >
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-3xl mx-auto shadow-sm overflow-hidden flex flex-col">

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
            <Coins className="w-3.5 h-3.5" />
            <span>Ek Vergiler (GİB)</span>
            {additionalTaxes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px]">
                {additionalTaxes.length}
              </span>
            )}
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

          {/* TAB 4: EK VERGİLER (GİB LİSTESİNDEN SEÇİM) */}
          {activeTab === "ek_vergiler" && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Kalem Bilgi Kartı */}
              <div className="p-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-xl border border-indigo-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Seçili Kalem:</span>
                  </span>
                  <span className="text-xs font-extrabold text-indigo-900 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    {item.description || "Hizmet / Ürün Kalemi"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Miktar &amp; Fiyat: <span className="font-bold text-slate-800">{item.quantity} {item.unit || "Adet"}</span> × <span className="font-bold text-slate-800">{formatCurrency(item.unitPrice, currency)}</span> = <span className="font-extrabold text-indigo-900">{formatCurrency(item.quantity * item.unitPrice, currency)} Matrah</span>
                </p>
              </div>

              {/* Bilgi ve Hızlı Ekleme Paneli */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hızlı Ek Vergi Ekle (Popüler GİB Oranları):</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">31 GİB Ek Vergisi Tanımlı</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAddTax("0074", 20, false, "percent")}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    + ÖTV 4.Liste (%20)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTax("0003", 20, true, "percent")}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    + GV Stopajı (%20 - Kesinti)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTax("4080", 10, false, "percent")}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    + Ö.İletişim (%10)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTax("0059", 2, false, "percent")}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    + Konaklama Vergisi (%2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTax("1047", 0.948, false, "percent")}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    + Damga Vergisi (%0.948)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTax("8001", 2, false, "percent")}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    + TRT Payı (%2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTax("SGK_PRIM", 2, true, "percent")}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    + SGK Primi (%2 - Kesinti)
                  </button>
                </div>
              </div>

              {/* Ek Vergi Ekleme Seçim Alanı */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Listeden Ek Vergi Seç ve Kaleme Tanımla:
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  {/* Vergi Seçimi (Açılır Liste - 31 Kod) */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      GİB Ek Vergi Türü:
                    </label>
                    <select
                      value={selectedTaxCode}
                      onChange={(e) => handleSelectTaxCode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <optgroup label="Özel Tüketim Vergisi (ÖTV)">
                        {GIB_ADDITIONAL_TAX_CODES.filter((t) => t.category.includes("ÖTV")).map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.code} - {t.name} ({t.type === "fixed" ? "Sabit TL" : `%${t.defaultRate || ""}`})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Stopaj & Kesintiler (Netten İndirilir)">
                        {GIB_ADDITIONAL_TAX_CODES.filter((t) => t.isDeduction).map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.code} - {t.name} (Stopaj Kesintisi)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="İletişim, Telsiz & Damga">
                        {GIB_ADDITIONAL_TAX_CODES.filter((t) => t.category.includes("İletişim") || t.category.includes("Damga")).map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.code} - {t.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Konaklama, Banka, Sigorta & Diğer">
                        {GIB_ADDITIONAL_TAX_CODES.filter(
                          (t) =>
                            !t.category.includes("ÖTV") &&
                            !t.isDeduction &&
                            !t.category.includes("İletişim") &&
                            !t.category.includes("Damga")
                        ).map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.code} - {t.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Hesaplama Türü (Yüzde veya Sabit) */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hesaplama Tipi:
                    </label>
                    <div className="flex rounded-xl border border-slate-300 p-0.5 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setSelectedCalcType("percent")}
                        className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          selectedCalcType === "percent"
                            ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Yüzde (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCalcType("fixed")}
                        className={`flex-1 py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          selectedCalcType === "fixed"
                            ? "bg-white text-indigo-700 shadow-2xs border border-slate-200"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sabit (₺)
                      </button>
                    </div>
                  </div>

                  {/* Oran veya Tutar Girdisi */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {selectedCalcType === "percent" ? "Vergi Oranı (%)" : "Vergi Tutarı (₺)"}
                    </label>
                    {selectedCalcType === "percent" ? (
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        step={0.01}
                        value={inputRate}
                        onChange={(e) => setInputRate(Number(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={inputFixedAmount}
                        onChange={(e) => setInputFixedAmount(Number(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    )}
                  </div>
                </div>

                {/* İlave / Kesinti Seçimi ve Ekle Butonu */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInputIsDeduction(false)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        !inputIsDeduction
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Faturaya Ekle (İlave Vergi)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputIsDeduction(true)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        inputIsDeduction
                          ? "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
                      <span>- Netten Düş (Stopaj / Kesinti)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTax}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Kaleme Vergi Ekle</span>
                  </button>
                </div>
              </div>

              {/* Kaleme Eklenmiş Vergiler Listesi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Bu Kaleme Tanımlı Ek Vergiler ({additionalTaxes.length}):</span>
                  </span>
                  {additionalTaxes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAdditionalTaxes([])}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Tüm Ek Vergileri Temizle
                    </button>
                  )}
                </div>

                {additionalTaxes.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs">
                    Bu kaleme henüz ek vergi eklenmedi. Yukarıdaki listeden veya hızlı butonlardan dilediğiniz vergileri ekleyebilirsiniz.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {additionalTaxes.map((tax) => {
                      const isDeduct = tax.isDeduction;
                      let calculatedAmount = 0;
                      if (tax.calculationType === "fixed") {
                        calculatedAmount = Number(tax.amount) || 0;
                      } else {
                        calculatedAmount = (computed.effectiveTaxableAmount * (tax.rate || 0)) / 100;
                      }

                      return (
                        <div
                          key={tax.code}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isDeduct
                              ? "bg-amber-50/70 border-amber-200 text-amber-950"
                              : "bg-indigo-50/70 border-indigo-200 text-indigo-950"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-md font-mono font-extrabold text-[11px] ${
                                isDeduct ? "bg-amber-200 text-amber-900" : "bg-indigo-200 text-indigo-900"
                              }`}
                            >
                              {tax.code}
                            </span>
                            <div>
                              <div className="font-bold text-xs flex items-center gap-1.5">
                                <span>{tax.name}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                                    isDeduct ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {isDeduct ? "- Netten Kesinti" : "+ Faturaya İlave"}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>
                                  {tax.calculationType === "percent"
                                    ? `Oran: %${tax.rate}`
                                    : `Sabit: ${formatCurrency(tax.amount || 0, currency)}`}
                                </span>
                                <span>•</span>
                                <span>Matrah: {formatCurrency(computed.effectiveTaxableAmount, currency)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {tax.calculationType === "percent" && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-500">%</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={1000}
                                  step={0.01}
                                  value={tax.rate || ""}
                                  onChange={(e) => handleUpdateTaxRate(tax.code, Number(e.target.value) || 0)}
                                  className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-right text-slate-900"
                                />
                              </div>
                            )}

                            <div className="text-right">
                              <span
                                className={`font-mono font-black text-xs block ${
                                  isDeduct ? "text-amber-700" : "text-indigo-700"
                                }`}
                              >
                                {isDeduct ? "-" : "+"}
                                {formatCurrency(calculatedAmount, currency)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveTax(tax.code)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Ek Vergiyi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              <div className="flex items-center gap-1.5">
                {additionalTaxes.length > 0 && (
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                    +{additionalTaxes.length} Ek Vergi
                  </span>
                )}
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  KDV %{computed.vatRate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Mal/Hizmet Bedeli:</span>
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

            {/* Ek Vergiler Satırı (Varsa) */}
            {(computed.additionalTaxesAdditions > 0 || computed.additionalTaxesDeductions > 0) && (
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-800/60">
                <div>
                  <span className="text-indigo-300 block text-[10px]">İlave Ek Vergiler (ÖTV, ÖİV vb.):</span>
                  <span className="font-mono font-bold text-indigo-200">
                    +{formatCurrency(computed.additionalTaxesAdditions, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-amber-300 block text-[10px]">Stopaj ve Kesintiler:</span>
                  <span className="font-mono font-bold text-amber-200">
                    -{formatCurrency(computed.additionalTaxesDeductions, currency)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-xs font-bold text-slate-300">
                Tahsil Edilecek Net Satır Tutarı:
              </span>
              <span className="text-sm font-black font-mono text-emerald-400">
                {formatCurrency(
                  computed.lineGrandTotal - computed.withholdingAmount - computed.additionalTaxesDeductions,
                  currency
                )}
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
    </DetailPageLayout>
  );
};
