import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Save,
  CheckCircle2,
  Calculator,
  Coins,
  ShieldCheck,
  Building,
  TrendingUp,
  Info,
  Edit2,
  X,
  Search,
  Sliders,
  Check,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";
import {
  PayrollYearlyParameters,
  CURRENT_PAYROLL_PARAMS_2026,
  OFFICIAL_PAYROLL_PARAMS_2025,
  OFFICIAL_PAYROLL_PARAMS_2024,
  ALL_PAYROLL_PARAMS_ARCHIVE,
  CottGroupSocialSecurity,
  CottGroupTaxBracket,
  CottGroupMonthlyExemption,
  getActivePayrollParameters,
  saveActivePayrollParameters,
  resetPayrollParametersToDefault,
} from "../data/payrollParametersData";
import {
  saveCentralPayrollParameters,
  fetchCentralPayrollParameters,
  subscribeToCentralPayrollParameters,
} from "../services/systemSyncService";
import { CottGroupPayrollTables } from "./CottGroupPayrollTables";

interface PayrollParametersPanelProps {
  canEdit?: boolean;
  currentUser?: {
    id?: string;
    name?: string;
    role?: string;
    email?: string;
  };
}

type EditTarget =
  | {
      type: "field";
      field: keyof PayrollYearlyParameters;
      label: string;
      description: string;
      category: string;
      unit: "currency" | "percent" | "permille" | "text";
      step?: number;
      min?: number;
      max?: number;
      legalBasis?: string;
    }
  | {
      type: "taxBracket";
      index: number;
      label: string;
      description: string;
      category: string;
      legalBasis?: string;
    };

export const PayrollParametersPanel: React.FC<PayrollParametersPanelProps> = ({
  canEdit = true,
  currentUser,
}) => {
  const [activeParams, setActiveParams] = useState<PayrollYearlyParameters>(() =>
    getActivePayrollParameters()
  );
  const [selectedYear, setSelectedYear] = useState<number>(activeParams.year || 2026);
  const [formData, setFormData] = useState<PayrollYearlyParameters>(activeParams);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingCentral, setIsSavingCentral] = useState(false);
  const [isPullingCentral, setIsPullingCentral] = useState(false);
  const [centralSyncMessage, setCentralSyncMessage] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [panelViewMode, setPanelViewMode] = useState<"cottgroup_tables" | "cards">("cottgroup_tables");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<EditTarget | null>(null);
  const [editValue, setEditValue] = useState<number | string>("");
  const [editSecondaryValue, setEditSecondaryValue] = useState<number>(0);

  // Sync state when selected year changes or reset, and listen to central updates
  useEffect(() => {
    const loaded = getActivePayrollParameters();
    setActiveParams(loaded);
    setFormData(loaded);
    setSelectedYear(loaded.year);

    // Initial check from central Firestore
    fetchCentralPayrollParameters().then((res) => {
      if (res.params && res.lastUpdated) {
        setActiveParams(res.params);
        setFormData(res.params);
        setSelectedYear(res.params.year);
      }
    });

    // Real-time listener for central updates from other sessions/admins
    const unsubscribe = subscribeToCentralPayrollParameters((newParams, meta) => {
      setActiveParams(newParams);
      setFormData(newParams);
      setSelectedYear(newParams.year);
      setCentralSyncMessage(`Merkezi sistemden güncellendi (${meta.updatedBy})`);
      setTimeout(() => setCentralSyncMessage(null), 4000);
    });

    return () => unsubscribe();
  }, []);

  const handlePullCentral = async () => {
    setIsPullingCentral(true);
    try {
      const res = await fetchCentralPayrollParameters();
      if (res.params) {
        setActiveParams(res.params);
        setFormData(res.params);
        setSelectedYear(res.params.year);
        setHasChanges(false);
        setCentralSyncMessage("Merkezi veritabanındaki son parametreler başarıyla çekildi.");
        setTimeout(() => setCentralSyncMessage(null), 3000);
      }
    } finally {
      setIsPullingCentral(false);
    }
  };

  const handleYearPresetSelect = (year: number) => {
    const preset = ALL_PAYROLL_PARAMS_ARCHIVE[year] || CURRENT_PAYROLL_PARAMS_2026;
    setSelectedYear(year);
    setFormData(JSON.parse(JSON.stringify(preset)));
    setHasChanges(true);
  };

  const handleInputChange = (field: keyof PayrollYearlyParameters, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto recalculate linked values if grossMinWage changes
      if (field === "grossMinWage") {
        const gross = Number(value) || 0;
        updated.dailyMinWage = Number((gross / 30).toFixed(2));
        updated.sgkBaseFloor = gross;
        updated.sgkBaseCeiling = Number((gross * 7.5).toFixed(2));
        // Recalculate estimated stamp tax exemption
        updated.minWageStampTaxExemption = Number((gross * (prev.stampTaxRate || 0.00759)).toFixed(2));
        // Estimated tax exemption at 15% bracket: (Gross - SGK%14 - Unemployment%1) * 0.15
        const netBase = gross * 0.85;
        updated.minWageTaxExemption = Number((netBase * 0.15).toFixed(2));
        // Recalculate child and family exemption allowances
        updated.childAllowanceExemption = Number((gross * 0.02).toFixed(2));
        updated.familyAllowanceExemption = Number((gross * 0.1).toFixed(2));
      }

      return updated;
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleTaxBracketChange = (index: number, field: "limit" | "rate", value: number) => {
    setFormData((prev) => {
      const nextBrackets = [...prev.taxBrackets];
      nextBrackets[index] = {
        ...nextBrackets[index],
        [field]: value,
        rateLabel: field === "rate" ? `%${Math.round(value * 100)}` : nextBrackets[index].rateLabel,
      };
      return { ...prev, taxBrackets: nextBrackets };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    const nowIso = new Date().toISOString();
    const updaterName = currentUser?.name || currentUser?.email || "Admin";

    // Build updated parameterAudit dictionary
    const updatedParameterAudit = { ...(formData.parameterAudit || {}) };

    // Register all fields modified in this editing session into parameterAudit
    Object.entries(pendingAudits).forEach(([fieldKey, change]: [string, { previousValue?: any; newValue?: any }]) => {
      updatedParameterAudit[fieldKey] = {
        updatedAt: nowIso,
        updatedBy: updaterName,
        previousValue: change.previousValue,
        newValue: change.newValue,
      };
    });

    const payload: PayrollYearlyParameters = {
      ...formData,
      lastUpdated: nowIso,
      updatedBy: updaterName,
      parameterAudit: updatedParameterAudit,
    };

    setIsSavingCentral(true);
    try {
      const result = await saveCentralPayrollParameters(payload, updaterName);
      setActiveParams(payload);
      setFormData(payload);
      setPendingAudits({});
      setHasChanges(false);
      setSaveSuccess(true);
      if (result.success) {
        setCentralSyncMessage("Parametreler merkezi veritabanına kaydedildi ve tüm kullanıcılara canlı olarak dağıtıldı.");
      } else {
        setCentralSyncMessage("Yerel olarak kaydedildi, merkezi senkronizasyon kuyruğa alındı.");
      }
      setTimeout(() => {
        setSaveSuccess(false);
        setCentralSyncMessage(null);
      }, 4500);
    } catch (err) {
      console.error("Central save error:", err);
      setActiveParams(payload);
      setFormData(payload);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSavingCentral(false);
    }
  };

  const handleResetCurrentYear = () => {
    const resetted = resetPayrollParametersToDefault(selectedYear);
    setActiveParams(resetted);
    setFormData(JSON.parse(JSON.stringify(resetted)));
    setHasChanges(false);
  };

  const handleResetToCottGroupDefaults = () => {
    const resetted = resetPayrollParametersToDefault(2026);
    setActiveParams(resetted);
    setFormData(JSON.parse(JSON.stringify(resetted)));
    setSelectedYear(2026);
    setHasChanges(false);
  };

  // Track modified fields for audit trail
  const [pendingAudits, setPendingAudits] = useState<Record<string, { previousValue?: any; newValue?: any }>>({});

  // Helper to format audit date nicely in Turkish format
  const formatAuditDate = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Card audit badge displaying last updated timestamp and author
  const renderCardAuditBadge = (fieldKey: string) => {
    const specificAudit = formData.parameterAudit?.[fieldKey];
    const dateStr = specificAudit?.updatedAt || formData.lastUpdated;
    const userStr = specificAudit?.updatedBy || formData.updatedBy || "Sistem / Mevzuat";

    if (!dateStr) return null;

    return (
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 truncate max-w-[130px]" title={`İşlem Yapan: ${userStr}`}>
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate font-medium text-slate-500">{userStr}</span>
        </span>
        <span className="font-mono font-medium text-slate-400 shrink-0 text-[9.5px]">
          {formatAuditDate(dateStr)}
        </span>
      </div>
    );
  };

  const formatTRY = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  // Open Edit Modal for a Field
  const openFieldEditor = (
    field: keyof PayrollYearlyParameters,
    label: string,
    description: string,
    category: string,
    unit: "currency" | "percent" | "permille" | "text",
    step?: number,
    min?: number,
    max?: number,
    legalBasis?: string
  ) => {
    let rawVal = formData[field];
    if (unit === "percent") {
      rawVal = Number(((rawVal as number) * 100).toFixed(4));
    } else if (unit === "permille") {
      rawVal = Number(((rawVal as number) * 1000).toFixed(4));
    }

    setEditingItem({
      type: "field",
      field,
      label,
      description,
      category,
      unit,
      step,
      min,
      max,
      legalBasis,
    });
    setEditValue(rawVal as any);
  };

  // Open Edit Modal for a Tax Bracket
  const openTaxBracketEditor = (index: number) => {
    const tb = formData.taxBrackets[index];
    if (!tb) return;

    setEditingItem({
      type: "taxBracket",
      index,
      label: `${tb.bracket}`,
      description: `Kümülatif gelir vergisi matrah dilim tavanı ve uygulanacak kesinti oranı.`,
      category: "Gelir Vergisi Dilimleri",
      legalBasis: "193 Sayılı GVK Md. 103",
    });
    setEditValue(tb.limit === Infinity ? 0 : tb.limit);
    setEditSecondaryValue(Number((tb.rate * 100).toFixed(2)));
  };

  // Commit Modal Edit
  const handleCommitEdit = () => {
    if (!editingItem) return;

    if (editingItem.type === "field") {
      let finalVal: any = editValue;
      if (editingItem.unit === "percent") {
        finalVal = (parseFloat(String(editValue)) || 0) / 100;
      } else if (editingItem.unit === "permille") {
        finalVal = (parseFloat(String(editValue)) || 0) / 1000;
      } else if (editingItem.unit === "currency") {
        finalVal = parseFloat(String(editValue)) || 0;
      }
      const prevVal = formData[editingItem.field];
      setPendingAudits((prev) => ({
        ...prev,
        [editingItem.field as string]: { previousValue: prevVal, newValue: finalVal },
      }));
      handleInputChange(editingItem.field, finalVal);
    } else if (editingItem.type === "taxBracket") {
      const tb = formData.taxBrackets[editingItem.index];
      if (tb) {
        const newLimit = tb.limit === Infinity ? Infinity : parseFloat(String(editValue)) || 0;
        const newRate = (parseFloat(String(editSecondaryValue)) || 0) / 100;
        const bracketKey = `taxBracket_${editingItem.index + 1}`;
        setPendingAudits((prev) => ({
          ...prev,
          [bracketKey]: {
            previousValue: `${tb.limit === Infinity ? 'Sınırsız' : tb.limit} ₺ (%${Math.round(tb.rate * 100)})`,
            newValue: `${newLimit === Infinity ? 'Sınırsız' : newLimit} ₺ (%${Math.round(newRate * 100)})`,
          },
        }));
        setFormData((prev) => {
          const nextBrackets = [...prev.taxBrackets];
          nextBrackets[editingItem.index] = {
            ...nextBrackets[editingItem.index],
            limit: newLimit,
            rate: newRate,
            rateLabel: `%${Math.round(newRate * 100)}`,
          };
          return { ...prev, taxBrackets: nextBrackets };
        });
        setHasChanges(true);
      }
    }

    setEditingItem(null);
  };

  // Filter categories
  const categories = [
    { id: "all", label: "Tüm Parametreler" },
    { id: "wage", label: "Asgari Ücret & SGK Tabanı" },
    { id: "sgk", label: "SGK & Prim Oranları" },
    { id: "tax", label: "Gelir Vergisi Dilimleri" },
    { id: "exemptions", label: "İstisnalar & Muafiyetler" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🌟 Header Banner & Year Switcher */}
      <div className="card-elevation-1 bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Resmi Bordro ve SGK Hesaplama Parametreleri
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {formData.year} Yılı Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              SGK tavan/taban matrahları, asgari ücret istisnaları, gelir vergisi dilimleri ve işveren maliyet katsayılarını kart tasarımıyla inceleyip anında düzenleyebilirsiniz.
            </p>
            {formData.lastUpdated && (
              <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Son Güncelleme:</span>
                  <strong className="font-mono text-slate-800">{formatAuditDate(formData.lastUpdated)}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>İşlemi Yapan:</span>
                  <strong className="text-slate-800">{formData.updatedBy || "Sistem / Mevzuat"}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Year preset selectors & Action buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <span className="text-[10px] text-slate-600 px-2 uppercase font-bold label-caps">
              Dönem:
            </span>
            {[2026, 2025, 2024].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => handleYearPresetSelect(yr)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedYear === yr
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {yr} {yr === 2026 ? "★ (Güncel)" : ""}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePullCentral}
            disabled={isPullingCentral}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Merkezi veritabanındaki en güncel parametreleri çek"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isPullingCentral ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Merkezden Çek</span>
          </button>

          <button
            type="button"
            onClick={handleResetCurrentYear}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Bu yılın yasal standart değerlerine geri dön"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Varsayılana Sıfırla</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSavingCentral}
              className={`px-4 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                hasChanges
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
            >
              {isSavingCentral ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSavingCentral ? "Merkeze Dağıtılıyor..." : hasChanges ? "Merkeze Kaydet & Dağıt" : "Kayıtlı & Dağıtıldı"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 📡 Merkezi Senkronizasyon Canlı Bildirim Rozeti */}
      <div className="card-elevation-1 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="text-slate-700">
            <span className="font-bold text-slate-900">Tek Noktadan Dağıtım (Single Source of Truth):</span>
            <span className="ml-1 text-slate-600">
              Bu panelde yapılan SGK ve vergi güncellemeleri anında bulut veritabanına işlenir ve bağlı tüm kullanıcıların bordro hesaplayıcılarına gerçek zamanlı yansıtılır.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 bg-white border border-blue-200 text-blue-800 font-bold rounded-lg text-[11px] font-mono">
            {formData.year} Sürümü Aktif
          </span>
        </div>
      </div>

      {centralSyncMessage && (
        <div className="card-elevation-1 bg-blue-50 text-blue-900 border border-blue-200 p-3.5 rounded-2xl flex items-center gap-3 animate-in fade-in text-xs font-medium">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{centralSyncMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="card-elevation-1 bg-emerald-50 text-emerald-900 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-medium">
            <strong>Bordro ve SGK parametreleri başarıyla kaydedildi!</strong> Güncellenen parametreler merkezi bulut veritabanına yazıldı ve tüm kullanıcıların hesaplama motorlarına tek merkezden ulaştırıldı.
          </div>
        </div>
      )}

      {/* 🧭 Görünüm Seçici: Kanuni Değerleri İnternetten Güncelle vs Tüm Kartlar */}
      <div className="card-elevation-1 bg-white p-2 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPanelViewMode("cottgroup_tables")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
              panelViewMode === "cottgroup_tables"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Kanuni Değerleri İnternetten Güncelle</span>
          </button>

          <button
            type="button"
            onClick={() => setPanelViewMode("cards")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
              panelViewMode === "cards"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-600" />
            <span>Parametre Kartları & Arama</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 text-right hidden md:block">
          Mevzuat Kaynağı: <strong className="text-slate-700">Resmi Gazete ve 2026 Yasal Kesintiler</strong>
        </div>
      </div>

      {panelViewMode === "cottgroup_tables" ? (
        <CottGroupPayrollTables
          formData={formData}
          canEdit={canEdit}
          onFieldChange={handleInputChange}
          onSocialSecurityChange={(newSgk) => {
            setFormData((prev) => ({
              ...prev,
              cottGroupSocialSecurity: newSgk,
              sgkEmployeeRate: newSgk.employeeSgkRate,
              sgkEmployerStandardRate: newSgk.employerSgkRate,
              unemploymentEmployeeRate: newSgk.employeeUnemploymentRate,
              unemploymentEmployerRate: newSgk.employerUnemploymentRate,
              sgkBaseFloor: newSgk.monthlySgkFloor,
              sgkBaseCeiling: newSgk.monthlySgkCeiling,
              grossMinWage: newSgk.monthlySgkFloor,
              dailyMinWage: newSgk.dailySgkFloor,
            }));
            setHasChanges(true);
            setSaveSuccess(false);
          }}
          onWageTaxTariffChange={(newTariff) => {
            setFormData((prev) => ({
              ...prev,
              cottGroupWageTaxTariff: newTariff,
              taxBrackets: newTariff.map((t) => ({
                bracket: t.label,
                limit: t.toLimit,
                rate: t.rate,
                rateLabel: t.rateLabel,
              })),
            }));
            setHasChanges(true);
            setSaveSuccess(false);
          }}
          onNonWageTaxTariffChange={(newTariff) => {
            setFormData((prev) => ({
              ...prev,
              cottGroupNonWageTaxTariff: newTariff,
            }));
            setHasChanges(true);
            setSaveSuccess(false);
          }}
          onMonthlyExemptionsChange={(newExemptions) => {
            setFormData((prev) => ({
              ...prev,
              cottGroupMonthlyExemptions: newExemptions,
              minWageTaxExemption: newExemptions[0]?.incomeTaxExemption || prev.minWageTaxExemption,
              minWageStampTaxExemption: newExemptions[0]?.stampTaxExemption || prev.minWageStampTaxExemption,
            }));
            setHasChanges(true);
            setSaveSuccess(false);
          }}
          onResetToCottGroupDefaults={handleResetToCottGroupDefaults}
          onSave={handleSave}
          hasChanges={hasChanges}
          saveSuccess={saveSuccess}
        />
      ) : (
        <>
          {/* 🔍 Search & Category Filters */}
          <div className="card-elevation-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategoryFilter === cat.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Parametre veya kanun maddesi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📦 KART BÖLÜMÜ 1: ASGARİ ÜCRET & SGK MATRAH PARAMETRELERİ */}
      {/* ========================================================================= */}
      {(activeCategoryFilter === "all" || activeCategoryFilter === "wage") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider label-caps">
                1. Asgari Ücret ve SGK Taban / Tavan Matrahları
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              Yürürlük: {formData.effectiveDate}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Brüt Asgari Ücret */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                    ₺
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Aylık Taban
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800 mt-3">Brüt Asgari Ücret</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  SGK prime esas taban tutar ve yasal brüt çalışma tabanı
                </p>
                <div className="mt-3 font-mono font-black text-lg text-slate-950">
                  {formatTRY(formData.grossMinWage)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Günlük Taban: {formatTRY(formData.dailyMinWage)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">4857 S.K. Md. 39</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "grossMinWage",
                        "Brüt Asgari Ücret",
                        "Aylık resmi brüt asgari ücret tutarı. Güncellendiğinde SGK tavanı ve istisnalar orantılı hesaplanır.",
                        "Asgari Ücret & Taban",
                        "currency",
                        0.5,
                        0,
                        1000000,
                        "4857 Sayılı İş Kanunu Md. 39"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("grossMinWage")}
            </div>

            {/* Net Asgari Ücret */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100">
                    Net
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Ele Geçen
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800 mt-3">Net Asgari Ücret</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Standart bekar çalışan için net ödenen yasal aylık tutar
                </p>
                <div className="mt-3 font-mono font-black text-lg text-emerald-700">
                  {formatTRY(formData.netMinWage)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Kesintiler Düşülmüş Net
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Bekar / Çocuksuz</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "netMinWage",
                        "Net Asgari Ücret",
                        "Ele geçen net asgari ücret tutarı.",
                        "Asgari Ücret & Taban",
                        "currency",
                        0.5,
                        0,
                        1000000,
                        "Asgari Ücret Tespit Komisyonu"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors cursor-pointer border border-emerald-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("netMinWage")}
            </div>

            {/* SGK Prime Esas Tavanı */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-100">
                    7.5x
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100">
                    Azami Tavan
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800 mt-3">SGK Tavan Matrahı</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  SGK prime esas kazancın üst sınırı (Brüt x 7.5 katı)
                </p>
                <div className="mt-3 font-mono font-black text-lg text-slate-950">
                  {formatTRY(formData.sgkBaseCeiling)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Tavanı aşan tutardan SGK kesilmez
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">5510 S.K. Md. 82</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "sgkBaseCeiling",
                        "SGK Tavan Matrahı",
                        "SGK primine esas kazanç üst sınırı. Bu tutarın üzerindeki brüt kazançlar SGK prim matrahına dahil edilmez.",
                        "SGK Tavan & Taban",
                        "currency",
                        1,
                        0,
                        2000000,
                        "5510 Sayılı Kanun Md. 82"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("sgkBaseCeiling")}
            </div>

            {/* Asgari Ücret Vergi İstisnası */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">
                    GV
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    Vergi Muafiyeti
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800 mt-3">Asgari Ücret GV İstisnası</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Tüm çalışanların ücretinden düşülen aylık gelir vergisi muafiyeti
                </p>
                <div className="mt-3 font-mono font-black text-lg text-blue-700">
                  {formatTRY(formData.minWageTaxExemption)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  DV İstisnası: {formatTRY(formData.minWageStampTaxExemption)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">193 S.K. Md. 23/18</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "minWageTaxExemption",
                        "Asgari Ücret Gelir Vergisi İstisnası",
                        "Asgari ücret tutarına isabet eden aylık gelir vergisi istisna tutarı.",
                        "Vergi İstisnaları",
                        "currency",
                        1,
                        0,
                        100000,
                        "193 Sayılı GVK Md. 23/18"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("minWageTaxExemption")}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ KART BÖLÜMÜ 2: SGK VE YASAL PRİM ORANLARI */}
      {/* ========================================================================= */}
      {(activeCategoryFilter === "all" || activeCategoryFilter === "sgk") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider label-caps">
                2. SGK, İşsizlik, BES ve Yasal Prim Oranları
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              5510 Sayılı Kanun Hükümleri
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* SGK İşçi Payı */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">SGK İşçi Primi Payı</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-100 text-slate-900">
                    %{(formData.sgkEmployeeRate * 100).toFixed(1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Brüt ücretten işçi adına kesilen genel SGK prim payı
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Örnek (30.000 ₺): {formatTRY(30000 * formData.sgkEmployeeRate)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">İşçi Kesintisi</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "sgkEmployeeRate",
                        "SGK İşçi Primi Payı",
                        "İşçi ücretinden kesilen Sosyal Güvenlik Kurumu prim oranı (Standart: %14).",
                        "SGK Oranları",
                        "percent",
                        0.1,
                        0,
                        100,
                        "5510 Sayılı Kanun Md. 81"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("sgkEmployeeRate")}
            </div>

            {/* İşsizlik İşçi Payı */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">İşsizlik Sigortası (İşçi)</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-100 text-slate-900">
                    %{(formData.unemploymentEmployeeRate * 100).toFixed(1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  4447 Sayılı Kanun uyarınca kesilen işsizlik fonu payı
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Örnek (30.000 ₺): {formatTRY(30000 * formData.unemploymentEmployeeRate)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">4447 S.K. Md. 49</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "unemploymentEmployeeRate",
                        "İşsizlik Sigortası İşçi Payı",
                        "İşçi adına kesilen işsizlik fonu prim oranı (Standart: %1).",
                        "SGK Oranları",
                        "percent",
                        0.1,
                        0,
                        10,
                        "4447 Sayılı Kanun Md. 49"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("unemploymentEmployeeRate")}
            </div>

            {/* SGK İşveren Teşvikli Pay (%15.5) */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">İşveren (5 Puan Teşvikli)</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                    %{(formData.sgkEmployerDiscountedRate * 100).toFixed(1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  5510 S.K. 81/ı maddesi düzenli ödeme yapan işveren 5 puan indirimi
                </p>
                <div className="mt-3 p-2.5 bg-emerald-50/50 rounded-xl text-[11px] text-emerald-800 font-mono">
                  Örnek (30.000 ₺): {formatTRY(30000 * formData.sgkEmployerDiscountedRate)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-700 font-bold">5510 S.K. 81/ı</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "sgkEmployerDiscountedRate",
                        "SGK İşveren Payı (5 Puan İndirimli)",
                        "Hazine tarafından karşılanan 5 puanlık prim teşviki sonrası işveren payı (Standart: %15.5).",
                        "İşveren Maliyeti",
                        "percent",
                        0.1,
                        0,
                        50,
                        "5510 Sayılı Kanun Md. 81/ı"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors cursor-pointer border border-emerald-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("sgkEmployerDiscountedRate")}
            </div>

            {/* SGK İşveren Standart Payı (%20.5) */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">İşveren Standart Payı</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-100 text-slate-900">
                    %{(formData.sgkEmployerStandardRate * 100).toFixed(1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Teşviksiz standart SGK işveren sigorta primi hissesi
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Örnek (30.000 ₺): {formatTRY(30000 * formData.sgkEmployerStandardRate)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">İndirimsiz Oran</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "sgkEmployerStandardRate",
                        "SGK İşveren Standart Payı",
                        "İndirimsiz genel işveren SGK hissesi (Standart: %20.5).",
                        "İşveren Maliyeti",
                        "percent",
                        0.1,
                        0,
                        50,
                        "5510 Sayılı Kanun Md. 81"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("sgkEmployerStandardRate")}
            </div>

            {/* İşsizlik İşveren Payı */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">İşsizlik (İşveren Payı)</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-100 text-slate-900">
                    %{(formData.unemploymentEmployerRate * 100).toFixed(1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  İşveren tarafından karşılanan işsizlik sigortası fon payı
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Örnek (30.000 ₺): {formatTRY(30000 * formData.unemploymentEmployerRate)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">4447 S.K. Md. 49</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "unemploymentEmployerRate",
                        "İşsizlik Sigortası İşveren Payı",
                        "İşveren maliyetine eklenen işsizlik fonu prim oranı (Standart: %2).",
                        "İşveren Maliyeti",
                        "percent",
                        0.1,
                        0,
                        10,
                        "4447 Sayılı Kanun Md. 49"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("unemploymentEmployerRate")}
            </div>

            {/* Kısa Vadeli Sigorta Kolları (KVSK) */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Kısa Vadeli Risk (KVSK)</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-100 text-slate-900">
                    %{(formData.shortTermRiskRate * 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  İş kazası ve meslek hastalığı prim oranı (İşveren payı içindedir)
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Sabit Yasal Oran: %2.25
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">5510 S.K. Md. 81/c</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "shortTermRiskRate",
                        "Kısa Vadeli Sigorta Kolları Primi (KVSK)",
                        "İş kazası ve meslek hastalıkları prim oranı.",
                        "SGK Oranları",
                        "percent",
                        0.05,
                        0,
                        10,
                        "5510 Sayılı Kanun Md. 81/c"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("shortTermRiskRate")}
            </div>

            {/* BES Otomatik Katılım */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">BES Otomatik Katılım</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-100 text-slate-900">
                    %{(formData.besAutoEnrollmentRate * 100).toFixed(1)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Bireysel emeklilik otomatik katılım sistemi kesinti katsayısı
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Örnek (30.000 ₺): {formatTRY(30000 * formData.besAutoEnrollmentRate)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">4632 S.K. Ek 2</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "besAutoEnrollmentRate",
                        "BES Otomatik Katılım Payı",
                        "Zorunlu Bireysel Emeklilik Sistemi (BES) çalışan kesintisi oranı (Standart: %3).",
                        "Bireysel Emeklilik",
                        "percent",
                        0.5,
                        0,
                        20,
                        "4632 Sayılı Kanun Ek Madde 2"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("besAutoEnrollmentRate")}
            </div>

            {/* Damga Vergisi */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Damga Vergisi (Binde)</span>
                  <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-100 text-slate-900">
                    ‰{(formData.stampTaxRate * 1000).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Maaş bordrolarında brüt tutar üzerinden hesaplanan yasal damga vergisi
                </p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-mono">
                  Binde 7.59 (%0.759)
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">488 S.K. 1 Sayılı Tablo</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "stampTaxRate",
                        "Damga Vergisi Oranı",
                        "Ücret bordrolarında uygulanan damga vergisi oranı (Binde cinsinden giriniz).",
                        "Vergi Kesintileri",
                        "permille",
                        0.01,
                        0,
                        20,
                        "488 Sayılı Damga Vergisi Kanunu"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("stampTaxRate")}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📈 KART BÖLÜMÜ 3: GELİR VERGİSİ DİLİMLERİ */}
      {/* ========================================================================= */}
      {(activeCategoryFilter === "all" || activeCategoryFilter === "tax") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider label-caps">
                3. Ücret Gelir Vergisi Dilimleri (GVK Md. 103)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              Kümülatif Vergi Baremleri
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {formData.taxBrackets.map((tb, idx) => (
              <div
                key={idx}
                className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{idx + 1}. Dilim</span>
                    <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-indigo-50 border border-indigo-200 text-indigo-800">
                      {tb.rateLabel}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-700 mt-2">{tb.bracket}</h4>
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Matrah Tavanı</div>
                    <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                      {tb.limit === Infinity ? "Sınırsız (Aşan Kısım)" : formatTRY(tb.limit)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">193 S.K.</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => openTaxBracketEditor(idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>
                  )}
                </div>
                {renderCardAuditBadge(`taxBracket_${idx + 1}`)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💼 KART BÖLÜMÜ 4: İSTİSNALAR VE TAZMİNAT TAVANLARI */}
      {/* ========================================================================= */}
      {(activeCategoryFilter === "all" || activeCategoryFilter === "exemptions") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider label-caps">
                4. Günlük İstisnalar, Tazminat Tavanları ve Sosyal Yardımlar
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              Sosyal Haklar & Muafiyetler
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Günlük Yemek İstisnası */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Günlük Yemek İstisnası</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Günlük
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nakit veya yemek kartı günlük SGK ve Gelir Vergisi muafiyet tutarı (KDV hariç)
                </p>
                <div className="mt-3 font-mono font-black text-lg text-slate-950">
                  {formatTRY(formData.dailyFoodExemptionLimit)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Aylık (~22 Gün): {formatTRY(formData.dailyFoodExemptionLimit * 22)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">GVK Md. 23/8</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "dailyFoodExemptionLimit",
                        "Günlük Yemek İstisnası (KDV Hariç)",
                        "Çalışılan her gün için nakit ve kart yemek yardımında uygulanan vergi/SGK istisnası.",
                        "Yemek İstisnası",
                        "currency",
                        1,
                        0,
                        5000,
                        "193 Sayılı GVK Md. 23/8"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("dailyFoodExemptionLimit")}
            </div>

            {/* Günlük Yol İstisnası */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Günlük Ulaşım İstisnası</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Günlük
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Toplu taşıma kartı veya bilet sağlanan her iş günü için vergi istisnası
                </p>
                <div className="mt-3 font-mono font-black text-lg text-slate-950">
                  {formatTRY(formData.dailyRoadExemptionLimit)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Aylık (~22 Gün): {formatTRY(formData.dailyRoadExemptionLimit * 22)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">GVK Md. 23/10</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "dailyRoadExemptionLimit",
                        "Günlük Yol İstisnası",
                        "Toplu taşıma kartı ve bilet sağlanan günlerdeki gelir vergisi istisnası.",
                        "Ulaşım İstisnası",
                        "currency",
                        1,
                        0,
                        5000,
                        "193 Sayılı GVK Md. 23/10"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("dailyRoadExemptionLimit")}
            </div>

            {/* Kıdem Tazminatı Tavanı (1. Yarıyıl) */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Kıdem Tavanı (1. Yarıyıl)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Ocak - Haziran
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Yılın ilk altı ayı için uygulanacak kıdem tazminatı azami yıllık tavan tutarı
                </p>
                <div className="mt-3 font-mono font-black text-lg text-slate-950">
                  {formatTRY(formData.severanceCeilingH1)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Her tam kıdem yılı için azami tavan
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">1475 S.K. Md. 14</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "severanceCeilingH1",
                        "Kıdem Tazminatı Tavanı (1. Yarıyıl)",
                        "Ocak - Haziran dönemi azami kıdem tazminatı tavan tutarı.",
                        "Tazminat Tavanları",
                        "currency",
                        1,
                        0,
                        200000,
                        "1475 Sayılı Kanun Md. 14"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("severanceCeilingH1")}
            </div>

            {/* Kıdem Tazminatı Tavanı (2. Yarıyıl) */}
            <div className="card-elevation-1 bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Kıdem Tavanı (2. Yarıyıl)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Temmuz - Aralık
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Yılın ikinci altı ayı için güncellenen kıdem tazminatı yıllık tavan tutarı
                </p>
                <div className="mt-3 font-mono font-black text-lg text-slate-950">
                  {formatTRY(formData.severanceCeilingH2)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Her tam kıdem yılı için azami tavan
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">1475 S.K. Md. 14</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openFieldEditor(
                        "severanceCeilingH2",
                        "Kıdem Tazminatı Tavanı (2. Yarıyıl)",
                        "Temmuz - Aralık dönemi azami kıdem tazminatı tavan tutarı.",
                        "Tazminat Tavanları",
                        "currency",
                        1,
                        0,
                        200000,
                        "1475 Sayılı Kanun Md. 14"
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>
                )}
              </div>
              {renderCardAuditBadge("severanceCeilingH2")}
            </div>
          </div>
        </div>
      )}

      {/* Yasal Dipnot */}
      <div className="card-elevation-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Yasal Mevzuat ve Entegrasyon Dayanağı:</strong> {formData.legalNotice} Bu panelde yapılan değişiklikler sistem genelindeki tüm İK puantaj ve maaş pusulası hesaplamalarında anında referans alınır.
        </div>
      </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 🛑 PARAMETRE DÜZENLEME MODALI */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Parametreyi Düzenle</h3>
                  <p className="text-[11px] text-slate-400">{editingItem.category}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {editingItem.label}
                </label>
                <p className="text-[11px] text-slate-500 mb-3">{editingItem.description}</p>

                {editingItem.type === "field" ? (
                  <div className="relative">
                    <input
                      type={editingItem.unit === "text" ? "text" : "number"}
                      step={editingItem.step || 1}
                      min={editingItem.min}
                      max={editingItem.max}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="w-full font-mono text-base font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      {editingItem.unit === "currency"
                        ? "₺"
                        : editingItem.unit === "percent"
                        ? "%"
                        : editingItem.unit === "permille"
                        ? "‰"
                        : ""}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Limit for Tax Bracket */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Matrah Tavanı (TL)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        disabled={formData.taxBrackets[editingItem.index]?.limit === Infinity}
                        className="w-full font-mono text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      {formData.taxBrackets[editingItem.index]?.limit === Infinity && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          En üst dilim için tavan sınırsızdır.
                        </p>
                      )}
                    </div>

                    {/* Rate for Tax Bracket */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Vergi Oranı (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={1}
                          min={0}
                          max={100}
                          value={editSecondaryValue}
                          onChange={(e) => setEditSecondaryValue(parseFloat(e.target.value) || 0)}
                          className="w-full font-mono text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {editingItem.legalBasis && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2 text-[11px] text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Yasal Dayanak:</strong> {editingItem.legalBasis}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCommitEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Uygula</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
