import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Save,
  Tag,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  Sparkles,
  Info,
} from "lucide-react";
import { FixedAsset, FixedAssetCategory, DepreciationMethod, Employee } from "../../types";
import { VUK_ASSET_TEMPLATES, VukAssetTemplate } from "../../data/fixedAssetsData";
import { useTheme } from "../../context/ThemeContext";

interface FixedAssetFormModalProps {
  asset?: FixedAsset | null; // If provided, edit mode
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (assetData: Omit<FixedAsset, "id" | "createdAt" | "updatedAt">) => void;
}

export const FixedAssetFormModal: React.FC<FixedAssetFormModalProps> = ({
  asset,
  employees,
  isOpen,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const isEdit = Boolean(asset);

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FixedAssetCategory>("255_demirbaslar");
  const [categoryLabel, setCategoryLabel] = useState("255 Demirbaşlar");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [barcode, setBarcode] = useState("");

  // Dates & Purchase Info
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [activatedDate, setActivatedDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendorName, setVendorName] = useState("");
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(20);
  const [currency, setCurrency] = useState("TRY");
  const [additionalExpenses, setAdditionalExpenses] = useState<number>(0);

  // Depreciation Info
  const [depreciationMethod, setDepreciationMethod] = useState<DepreciationMethod>("normal");
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(5);
  const [depreciationRate, setDepreciationRate] = useState<number>(20);
  const [isPartialYear, setIsPartialYear] = useState<boolean>(false);
  const [accumulatedDepreciation, setAccumulatedDepreciation] = useState<number>(0);

  // Accounting Codes
  const [assetAccountCode, setAssetAccountCode] = useState("255.01.001");
  const [depreciationAccountCode, setDepreciationAccountCode] = useState("257.01.001");
  const [expenseAccountCode, setExpenseAccountCode] = useState("770.01.005");

  // Custody & Assignment
  const [location, setLocation] = useState("Genel Merkez");
  const [department, setDepartment] = useState("Yönetim");
  const [custodyEmployeeId, setCustodyEmployeeId] = useState<string>("");
  const [warrantyEndDate, setWarrantyEndDate] = useState<string>("");
  const [description, setDescription] = useState("");

  // Initialize or Populate Form
  useEffect(() => {
    if (asset) {
      setCode(asset.code || "");
      setName(asset.name || "");
      setCategory(asset.category || "255_demirbaslar");
      setCategoryLabel(asset.categoryLabel || "255 Demirbaşlar");
      setSubCategory(asset.subCategory || "");
      setBrand(asset.brand || "");
      setModel(asset.model || "");
      setSerialNumber(asset.serialNumber || "");
      setPlateNumber(asset.plateNumber || "");
      setBarcode(asset.barcode || "");
      setAcquisitionDate(asset.acquisitionDate || new Date().toISOString().slice(0, 10));
      setActivatedDate(asset.activatedDate || asset.acquisitionDate || new Date().toISOString().slice(0, 10));
      setInvoiceNo(asset.invoiceNo || "");
      setInvoiceDate(asset.invoiceDate || asset.acquisitionDate || new Date().toISOString().slice(0, 10));
      setVendorName(asset.vendorName || "");
      setPurchaseCost(asset.purchaseCost || 0);
      setVatRate(asset.vatRate ?? 20);
      setCurrency(asset.currency || "TRY");
      setAdditionalExpenses(asset.additionalExpenses || 0);
      setDepreciationMethod(asset.depreciationMethod || "normal");
      setUsefulLifeYears(asset.usefulLifeYears || 5);
      setDepreciationRate(asset.depreciationRate || 20);
      setIsPartialYear(asset.isPartialYear || false);
      setAccumulatedDepreciation(asset.accumulatedDepreciation || 0);
      setAssetAccountCode(asset.assetAccountCode || "255.01.001");
      setDepreciationAccountCode(asset.depreciationAccountCode || "257.01.001");
      setExpenseAccountCode(asset.expenseAccountCode || "770.01.005");
      setLocation(asset.location || "Genel Merkez");
      setDepartment(asset.department || "Yönetim");
      setCustodyEmployeeId(asset.custodyEmployeeId || "");
      setWarrantyEndDate(asset.warrantyEndDate || "");
      setDescription(asset.description || "");
    } else {
      // Auto-generate next code
      setCode(`DMR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [asset]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const tmpl = VUK_ASSET_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSelectedTemplateId(tmpl.id);
    setName(tmpl.name);
    setCategory(tmpl.category);
    setCategoryLabel(tmpl.categoryLabel);
    setUsefulLifeYears(tmpl.usefulLifeYears);
    setDepreciationRate(tmpl.depreciationRate);
    setAssetAccountCode(tmpl.recommendedAssetAccount);
    setDepreciationAccountCode(tmpl.recommendedDeprAccount);
    setExpenseAccountCode(tmpl.recommendedExpenseAccount);
    setIsPartialYear(tmpl.isPartialYear);

    if (tmpl.isPartialYear) {
      setDepreciationMethod("normal");
    }
  };

  const handleUsefulLifeChange = (years: number) => {
    setUsefulLifeYears(years);
    if (years > 0) {
      if (depreciationMethod === "declining_balance") {
        const rate = Math.min(50, Number(((100 / years) * 2).toFixed(2)));
        setDepreciationRate(rate);
      } else {
        const rate = Number((100 / years).toFixed(2));
        setDepreciationRate(rate);
      }
    }
  };

  if (!isOpen) return null;

  const totalCostCalc = (Number(purchaseCost) || 0) + (Number(additionalExpenses) || 0);
  const vatAmountCalc = Number(((totalCostCalc * (vatRate || 0)) / 100).toFixed(2));
  const grandTotalCalc = totalCostCalc + vatAmountCalc;
  const netBookValueCalc = Math.max(0, totalCostCalc - (accumulatedDepreciation || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const assignedEmp = employees.find((e) => e.id === custodyEmployeeId);

    onSave({
      code: code.trim(),
      name: name.trim(),
      category,
      categoryLabel,
      subCategory: subCategory.trim(),
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      plateNumber: plateNumber.trim(),
      barcode: barcode.trim() || code.replace(/[^0-9]/g, ""),
      acquisitionDate,
      activatedDate,
      invoiceNo: invoiceNo.trim(),
      invoiceDate,
      vendorName: vendorName.trim(),
      purchaseCost: totalCostCalc,
      vatRate,
      vatAmount: vatAmountCalc,
      totalCost: grandTotalCalc,
      currency,
      additionalExpenses,
      assetAccountCode,
      depreciationAccountCode,
      expenseAccountCode,
      depreciationMethod,
      usefulLifeYears,
      depreciationRate,
      isPartialYear,
      accumulatedDepreciation: Number(accumulatedDepreciation) || 0,
      netBookValue: netBookValueCalc,
      location,
      department,
      custodyEmployeeId: custodyEmployeeId || undefined,
      custodyEmployeeName: assignedEmp
        ? `${assignedEmp.firstName} ${assignedEmp.lastName}`
        : undefined,
      custodyDate: custodyEmployeeId ? activatedDate : undefined,
      status: custodyEmployeeId ? "in_custody" : "active",
      warrantyEndDate: warrantyEndDate || undefined,
      description: description.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div
        className="rounded-2xl shadow-2xl max-w-4xl w-full border overflow-hidden my-8 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] transition-colors"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white shadow-2xs"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {isEdit ? "Demirbaş Kartını Düzenle" : "Yeni Demirbaş Kartı Tanımla"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                VUK standart amortisman oranları ve Tek Düzen Hesap Planı entegrasyonu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs flex-1">
          {/* Quick Template Picker (Only for new) */}
          {!isEdit && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Hazır VUK Amortisman Şablonu Seçin (Otomatik Doldurma):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {VUK_ASSET_TEMPLATES.slice(0, 6).map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedTemplateId === tmpl.id
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs font-semibold"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-indigo-100 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                  >
                    <div className="font-bold truncate">{tmpl.name}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        selectedTemplateId === tmpl.id ? "text-indigo-100" : "text-slate-400"
                      }`}
                    >
                      {tmpl.usefulLifeYears} Yıl (%{tmpl.depreciationRate}) · {tmpl.categoryLabel}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Basic Identifiers */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              1. Demirbaş Temel ve Kimlik Bilgileri
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Demirbaş Kodu *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Demirbaş Adı & Tanımı *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Apple MacBook Pro 16 veya Renault Megane 1.3 TCe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hesap Grubu *</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as any);
                    const label = e.target.options[e.target.selectedIndex].text;
                    setCategoryLabel(label);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="255_demirbaslar">255 Demirbaşlar</option>
                  <option value="254_tasitlar">254 Taşıtlar</option>
                  <option value="253_tesis_makine">253 Tesis, Makine ve Cihazlar</option>
                  <option value="264_ozel_maliyetler">264 Özel Maliyetler</option>
                  <option value="260_haklar_lisans">260 Haklar ve Lisanslar</option>
                  <option value="252_binalar">252 Binalar & Tesisler</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Marka</label>
                <input
                  type="text"
                  placeholder="Örn: Apple, Dell, Ford"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Model / Tip</label>
                <input
                  type="text"
                  placeholder="Örn: M3 Max 64GB"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seri No / Plaka No
                </label>
                <input
                  type="text"
                  placeholder="Seri no veya araç plakası"
                  value={plateNumber || serialNumber}
                  onChange={(e) => {
                    if (category === "254_tasitlar") {
                      setPlateNumber(e.target.value);
                    } else {
                      setSerialNumber(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Costs */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              2. Satın Alma & Maliyet Bilgileri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Alış Tarihi *</label>
                <input
                  type="date"
                  value={acquisitionDate}
                  onChange={(e) => setAcquisitionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aktife Giriş Tarihi *
                </label>
                <input
                  type="date"
                  value={activatedDate}
                  onChange={(e) => setActivatedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fatura Numarası</label>
                <input
                  type="text"
                  placeholder="Örn: GIB2024000129"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Satıcı / Tedarikçi</label>
                <input
                  type="text"
                  placeholder="Satıcı Firma Ünvanı"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alış Bedeli (KDV Hariç ₺) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchaseCost || ""}
                  onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ek Maliyet / Montaj (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalExpenses || ""}
                  onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">KDV Oranı (%)</label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={20}>%20 (Standart)</option>
                  <option value={10}>%10</option>
                  <option value={1}>%1</option>
                  <option value={0}>%0 (Muaf / İstisna)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Toplam Aktif Maliyeti (KDV Dahil)
                </label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold font-mono text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                  {grandTotalCalc.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Depreciation Parameters */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              3. VUK Amortisman ve İtfa Parametreleri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amortisman Yöntemi *
                </label>
                <select
                  value={depreciationMethod}
                  onChange={(e) => {
                    const m = e.target.value as DepreciationMethod;
                    setDepreciationMethod(m);
                    if (m === "declining_balance") {
                      setDepreciationRate(
                        Math.min(50, Number(((100 / usefulLifeYears) * 2).toFixed(2)))
                      );
                    } else {
                      setDepreciationRate(Number((100 / usefulLifeYears).toFixed(2)));
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="normal">Normal (Doğrusal / Eşit Tutarlı)</option>
                  <option value="declining_balance">Azalan Bakiyeler (Hızlandırılmış)</option>
                  <option value="none">Amortismana Tabi Değil</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faydalı Ömür (Yıl) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={usefulLifeYears}
                  onChange={(e) => handleUsefulLifeChange(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Yıllık Amortisman Oranı (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={depreciationRate}
                  onChange={(e) => setDepreciationRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Geçmiş Birikmiş Amortisman (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={accumulatedDepreciation || ""}
                  onChange={(e) => setAccumulatedDepreciation(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Kıst Amortisman Checkbox */}
            <div className="flex items-center gap-3 bg-amber-50/70 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              <input
                type="checkbox"
                id="isPartialYear"
                checked={isPartialYear}
                onChange={(e) => setIsPartialYear(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isPartialYear" className="cursor-pointer text-amber-900 dark:text-amber-200">
                <span className="font-bold block">
                  VUK 320. Madde Kıst Amortisman Uygula (Binek Otomobiller İçin Zorunludur)
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                  Aktife girdiği aydan yıl sonuna kadar ay esasıyla hesaplanır, kalan amortisman son yıla devredilir.
                </span>
              </label>
            </div>
          </div>

          {/* Section 4: Accounting Codes & Custody */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
              4. Muhasebe Hesap Kodları & Zimmet Bilgileri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Varlık Hesabı (Borç)
                </label>
                <input
                  type="text"
                  value={assetAccountCode}
                  onChange={(e) => setAssetAccountCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Birikmiş Amortisman Hesabı
                </label>
                <input
                  type="text"
                  value={depreciationAccountCode}
                  onChange={(e) => setDepreciationAccountCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amortisman Gider Hesabı
                </label>
                <input
                  type="text"
                  value={expenseAccountCode}
                  onChange={(e) => setExpenseAccountCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Lokasyon / Şube</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Departman</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Zimmetlenecek Personel
                </label>
                <select
                  value={custodyEmployeeId}
                  onChange={(e) => setCustodyEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Zimmet Yok (Ortak Kullanım / Depo) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.department || "Genel"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Açıklama / Notlar</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Demirbaşla ilgili özel kullanım notları, aksesuarlar vb."
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              * ile işaretli alanların doldurulması zorunludur.
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-white font-bold rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Save className="w-4 h-4" />
                <span>{isEdit ? "Değişiklikleri Kaydet" : "Demirbaşı Kaydet"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
