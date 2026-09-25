import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Building,
  TrendingUp,
  Percent,
  Calculator,
  ExternalLink,
  Edit2,
  Check,
  RotateCcw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Sliders,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Save,
  Undo2,
  Zap,
} from "lucide-react";
import {
  PayrollYearlyParameters,
  CottGroupSocialSecurity,
  CottGroupTaxBracket,
  CottGroupMonthlyExemption,
  COTTGROUP_WAGE_TAX_TARIFF_2026,
  COTTGROUP_NON_WAGE_TAX_TARIFF_2026,
  COTTGROUP_MONTHLY_EXEMPTIONS_2026,
} from "../data/payrollParametersData";

export interface ValidationError {
  id: string;
  section: "sgk" | "wage_tax" | "non_wage_tax" | "exemptions";
  field: string;
  message: string;
  severity: "error" | "warning";
}

interface CottGroupPayrollTablesProps {
  formData: PayrollYearlyParameters;
  canEdit?: boolean;
  onFieldChange: (field: keyof PayrollYearlyParameters, value: any) => void;
  onSocialSecurityChange?: (newSgk: CottGroupSocialSecurity) => void;
  onWageTaxTariffChange?: (newTariff: CottGroupTaxBracket[]) => void;
  onNonWageTaxTariffChange?: (newTariff: CottGroupTaxBracket[]) => void;
  onMonthlyExemptionsChange?: (newExemptions: CottGroupMonthlyExemption[]) => void;
  onResetToCottGroupDefaults?: () => void;
  onSave?: () => void;
  hasChanges?: boolean;
  saveSuccess?: boolean;
}

export const CottGroupPayrollTables: React.FC<CottGroupPayrollTablesProps> = ({
  formData,
  canEdit = true,
  onFieldChange,
  onSocialSecurityChange,
  onWageTaxTariffChange,
  onNonWageTaxTariffChange,
  onMonthlyExemptionsChange,
  onResetToCottGroupDefaults,
  onSave,
  hasChanges = false,
  saveSuccess = false,
}) => {
  // Active Sub-Table Tab
  const [activeTableTab, setActiveTableTab] = useState<
    "sgk" | "wage_tax" | "non_wage_tax" | "exemptions" | "payroll_sample"
  >("sgk");

  // Format TRY Helper
  const formatTRY = (val: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  // Safe Initial Data from formData or defaults
  const initialSgk: CottGroupSocialSecurity = useMemo(() => {
    return (
      formData.cottGroupSocialSecurity || {
        employeeSgkRate: formData.sgkEmployeeRate ?? 0.14,
        employerSgkRate: formData.sgkEmployerStandardRate ?? 0.205,
        employeeUnemploymentRate: formData.unemploymentEmployeeRate ?? 0.01,
        employerUnemploymentRate: formData.unemploymentEmployerRate ?? 0.02,
        employerDiscountRate: 0.02,
        employerMfgDiscountRate: 0.05,
        monthlySgkFloor: formData.sgkBaseFloor ?? 33030.0,
        monthlySgkCeiling: formData.sgkBaseCeiling ?? 297270.0,
        dailySgkFloor: formData.dailyMinWage ?? 1101.0,
      }
    );
  }, [
    formData.cottGroupSocialSecurity,
    formData.sgkEmployeeRate,
    formData.sgkEmployerStandardRate,
    formData.unemploymentEmployeeRate,
    formData.unemploymentEmployerRate,
    formData.sgkBaseFloor,
    formData.sgkBaseCeiling,
    formData.dailyMinWage,
  ]);

  const initialWageTariff: CottGroupTaxBracket[] = useMemo(() => {
    return formData.cottGroupWageTaxTariff || COTTGROUP_WAGE_TAX_TARIFF_2026;
  }, [formData.cottGroupWageTaxTariff]);

  const initialNonWageTariff: CottGroupTaxBracket[] = useMemo(() => {
    return formData.cottGroupNonWageTaxTariff || COTTGROUP_NON_WAGE_TAX_TARIFF_2026;
  }, [formData.cottGroupNonWageTaxTariff]);

  const initialMonthlyExemptions: CottGroupMonthlyExemption[] = useMemo(() => {
    return formData.cottGroupMonthlyExemptions || COTTGROUP_MONTHLY_EXEMPTIONS_2026;
  }, [formData.cottGroupMonthlyExemptions]);

  // Working / Draft Local State for Instant Editing
  const [draftSgk, setDraftSgk] = useState<CottGroupSocialSecurity>(initialSgk);
  const [draftWageTariff, setDraftWageTariff] = useState<CottGroupTaxBracket[]>(initialWageTariff);
  const [draftNonWageTariff, setDraftNonWageTariff] = useState<CottGroupTaxBracket[]>(initialNonWageTariff);
  const [draftMonthlyExemptions, setDraftMonthlyExemptions] = useState<CottGroupMonthlyExemption[]>(initialMonthlyExemptions);

  // Sync draft when external formData changes (e.g. on reset or reload)
  useEffect(() => {
    setDraftSgk(initialSgk);
  }, [initialSgk]);

  useEffect(() => {
    setDraftWageTariff(initialWageTariff);
  }, [initialWageTariff]);

  useEffect(() => {
    setDraftNonWageTariff(initialNonWageTariff);
  }, [initialNonWageTariff]);

  useEffect(() => {
    setDraftMonthlyExemptions(initialMonthlyExemptions);
  }, [initialMonthlyExemptions]);

  // Live Auto-Apply Toggle
  const [liveCalculationMode, setLiveCalculationMode] = useState<boolean>(false);

  // Applied Confirmation Banner / Toast State
  const [appliedSuccessMessage, setAppliedSuccessMessage] = useState<string | null>(null);
  const [lastAppliedAt, setLastAppliedAt] = useState<string | null>(null);

  // =========================================================================
  // 🔍 FORM VALIDATION LOGIC
  // =========================================================================
  const validationResults = useMemo(() => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. SGK Rates Validation
    if (draftSgk.employeeSgkRate <= 0 || draftSgk.employeeSgkRate > 0.5) {
      errors.push({
        id: "sgk-employee-rate",
        section: "sgk",
        field: "employeeSgkRate",
        message: "Çalışan SGK prim oranı %0 ile %50 arasında olmalıdır (Mevzuat standardı: %14).",
        severity: "error",
      });
    }

    if (draftSgk.employerSgkRate <= 0 || draftSgk.employerSgkRate > 0.6) {
      errors.push({
        id: "sgk-employer-rate",
        section: "sgk",
        field: "employerSgkRate",
        message: "İşveren SGK prim oranı %0 ile %60 arasında olmalıdır (Mevzuat standardı: %20,5).",
        severity: "error",
      });
    }

    if (draftSgk.employeeUnemploymentRate < 0 || draftSgk.employeeUnemploymentRate > 0.1) {
      errors.push({
        id: "sgk-employee-unemp",
        section: "sgk",
        field: "employeeUnemploymentRate",
        message: "Çalışan işsizlik sigortası primi %0 ile %10 arasında olmalıdır (Mevzuat standardı: %1).",
        severity: "error",
      });
    }

    if (draftSgk.employerUnemploymentRate < 0 || draftSgk.employerUnemploymentRate > 0.1) {
      errors.push({
        id: "sgk-employer-unemp",
        section: "sgk",
        field: "employerUnemploymentRate",
        message: "İşveren işsizlik sigortası primi %0 ile %10 arasında olmalıdır (Mevzuat standardı: %2).",
        severity: "error",
      });
    }

    if (draftSgk.employerDiscountRate < 0 || draftSgk.employerDiscountRate > draftSgk.employerSgkRate) {
      errors.push({
        id: "sgk-discount-rate",
        section: "sgk",
        field: "employerDiscountRate",
        message: "Standart prim teşviki (5510 S.K.) işveren SGK payından büyük olamaz.",
        severity: "error",
      });
    }

    // 2. PEK (Prime Esas Kazanç) Sınırları
    if (draftSgk.dailySgkFloor <= 0) {
      errors.push({
        id: "sgk-daily-floor",
        section: "sgk",
        field: "dailySgkFloor",
        message: "Günlük SGK taban tutarı 0'dan büyük olmalıdır (Örn: 1.101,00 TL).",
        severity: "error",
      });
    }

    if (draftSgk.monthlySgkFloor <= 0) {
      errors.push({
        id: "sgk-monthly-floor",
        section: "sgk",
        field: "monthlySgkFloor",
        message: "Aylık SGK tabanı (Brüt Asgari Ücret) 0'dan büyük olmalıdır (Örn: 33.030,00 TL).",
        severity: "error",
      });
    }

    if (draftSgk.monthlySgkCeiling < draftSgk.monthlySgkFloor) {
      errors.push({
        id: "sgk-ceiling-floor-conflict",
        section: "sgk",
        field: "monthlySgkCeiling",
        message: "Aylık SGK tavanı (azami PEK), aylık tabandan (brüt asgari ücret) küçük olamaz.",
        severity: "error",
      });
    } else {
      const ratio = draftSgk.monthlySgkCeiling / (draftSgk.monthlySgkFloor || 1);
      if (ratio < 6.5 || ratio > 10.5) {
        warnings.push({
          id: "sgk-ratio-warning",
          section: "sgk",
          field: "monthlySgkCeiling",
          message: `PEK tavan/taban katsayısı ${ratio.toFixed(1)}x seviyesindedir (Kanuni oran genelde 7,5x veya 9x'tir).`,
          severity: "warning",
        });
      }
    }

    // 3. Ücretliler Gelir Vergisi Tarifesi Doğrulaması
    let prevWageLimit = 0;
    draftWageTariff.forEach((bracket, idx) => {
      if (bracket.toLimit !== Infinity) {
        if (bracket.toLimit <= prevWageLimit) {
          errors.push({
            id: `wage-tariff-limit-${idx}`,
            section: "wage_tax",
            field: `wageTariff-${idx}`,
            message: `Ücretliler ${bracket.bracketId}. Dilim tavanı (${formatTRY(bracket.toLimit)}), önceki dilim tavanından (${formatTRY(prevWageLimit)}) büyük olmalıdır.`,
            severity: "error",
          });
        }
        prevWageLimit = bracket.toLimit;
      }
      if (bracket.rate <= 0 || bracket.rate > 1) {
        errors.push({
          id: `wage-tariff-rate-${idx}`,
          section: "wage_tax",
          field: `wageTariff-rate-${idx}`,
          message: `Ücretliler ${bracket.bracketId}. Dilim vergi oranı %0 ile %100 arasında olmalıdır.`,
          severity: "error",
        });
      }
      if (bracket.baseTaxAmount < 0) {
        errors.push({
          id: `wage-tariff-base-${idx}`,
          section: "wage_tax",
          field: `wageTariff-base-${idx}`,
          message: `Ücretliler ${bracket.bracketId}. Dilim sabit taban vergisi negatif olamaz.`,
          severity: "error",
        });
      }
    });

    // 4. Ücret Dışı Gelir Vergisi Tarifesi Doğrulaması
    let prevNonWageLimit = 0;
    draftNonWageTariff.forEach((bracket, idx) => {
      if (bracket.toLimit !== Infinity) {
        if (bracket.toLimit <= prevNonWageLimit) {
          errors.push({
            id: `non-wage-tariff-limit-${idx}`,
            section: "non_wage_tax",
            field: `nonWageTariff-${idx}`,
            message: `Ücret Dışı ${bracket.bracketId}. Dilim tavanı (${formatTRY(bracket.toLimit)}), önceki dilim tavanından (${formatTRY(prevNonWageLimit)}) büyük olmalıdır.`,
            severity: "error",
          });
        }
        prevNonWageLimit = bracket.toLimit;
      }
      if (bracket.rate <= 0 || bracket.rate > 1) {
        errors.push({
          id: `non-wage-tariff-rate-${idx}`,
          section: "non_wage_tax",
          field: `nonWageTariff-rate-${idx}`,
          message: `Ücret Dışı ${bracket.bracketId}. Dilim vergi oranı %0 ile %100 arasında olmalıdır.`,
          severity: "error",
        });
      }
      if (bracket.baseTaxAmount < 0) {
        errors.push({
          id: `non-wage-tariff-base-${idx}`,
          section: "non_wage_tax",
          field: `nonWageTariff-base-${idx}`,
          message: `Ücret Dışı ${bracket.bracketId}. Dilim sabit taban vergisi negatif olamaz.`,
          severity: "error",
        });
      }
    });

    // 5. 12 Aylık Asgari Ücret Vergi İstisnaları Doğrulaması
    draftMonthlyExemptions.forEach((m, idx) => {
      if (m.incomeTaxExemption < 0) {
        errors.push({
          id: `exemption-gv-${idx}`,
          section: "exemptions",
          field: `exemption-gv-${idx}`,
          message: `${m.month} ayı Gelir Vergisi istisnası negatif olamaz.`,
          severity: "error",
        });
      }
      if (m.stampTaxExemption < 0) {
        errors.push({
          id: `exemption-dv-${idx}`,
          section: "exemptions",
          field: `exemption-dv-${idx}`,
          message: `${m.month} ayı Damga Vergisi istisnası negatif olamaz.`,
          severity: "error",
        });
      }
    });

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
    };
  }, [draftSgk, draftWageTariff, draftNonWageTariff, draftMonthlyExemptions]);

  // Track if there are unapplied changes between working draft and parent formData
  const hasUnappliedChanges = useMemo(() => {
    const sgkChanged = JSON.stringify(draftSgk) !== JSON.stringify(initialSgk);
    const wageChanged = JSON.stringify(draftWageTariff) !== JSON.stringify(initialWageTariff);
    const nonWageChanged = JSON.stringify(draftNonWageTariff) !== JSON.stringify(initialNonWageTariff);
    const exemptionsChanged = JSON.stringify(draftMonthlyExemptions) !== JSON.stringify(initialMonthlyExemptions);
    return sgkChanged || wageChanged || nonWageChanged || exemptionsChanged;
  }, [draftSgk, initialSgk, draftWageTariff, initialWageTariff, draftNonWageTariff, initialNonWageTariff, draftMonthlyExemptions, initialMonthlyExemptions]);

  // Count unapplied fields
  const unappliedCount = useMemo(() => {
    let count = 0;
    if (draftSgk.employeeSgkRate !== initialSgk.employeeSgkRate) count++;
    if (draftSgk.employerSgkRate !== initialSgk.employerSgkRate) count++;
    if (draftSgk.employeeUnemploymentRate !== initialSgk.employeeUnemploymentRate) count++;
    if (draftSgk.employerUnemploymentRate !== initialSgk.employerUnemploymentRate) count++;
    if (draftSgk.employerDiscountRate !== initialSgk.employerDiscountRate) count++;
    if (draftSgk.monthlySgkFloor !== initialSgk.monthlySgkFloor) count++;
    if (draftSgk.monthlySgkCeiling !== initialSgk.monthlySgkCeiling) count++;
    if (draftSgk.dailySgkFloor !== initialSgk.dailySgkFloor) count++;
    if (JSON.stringify(draftWageTariff) !== JSON.stringify(initialWageTariff)) count++;
    if (JSON.stringify(draftNonWageTariff) !== JSON.stringify(initialNonWageTariff)) count++;
    if (JSON.stringify(draftMonthlyExemptions) !== JSON.stringify(initialMonthlyExemptions)) count++;
    return count;
  }, [draftSgk, initialSgk, draftWageTariff, initialWageTariff, draftNonWageTariff, initialNonWageTariff, draftMonthlyExemptions, initialMonthlyExemptions]);

  // =========================================================================
  // 🚀 CORE HANDLER: "DEĞİŞİKLİKLERİ UYGULA" (APPLY CHANGES & RECALCULATE)
  // =========================================================================
  const handleApplyChanges = (options?: { forceSgk?: CottGroupSocialSecurity; forceWage?: CottGroupTaxBracket[]; forceNonWage?: CottGroupTaxBracket[]; forceExemptions?: CottGroupMonthlyExemption[] }) => {
    const currentSgk = options?.forceSgk || draftSgk;
    const currentWageTariff = options?.forceWage || draftWageTariff;
    const currentNonWageTariff = options?.forceNonWage || draftNonWageTariff;
    const currentMonthlyExemptions = options?.forceExemptions || draftMonthlyExemptions;

    // Run validation
    if (!validationResults.isValid) {
      // Find the first section with an error and switch to that tab for immediate user correction
      const firstError = validationResults.errors[0];
      if (firstError) {
        setActiveTableTab(firstError.section);
      }
      return false;
    }

    // 1. Apply SGK changes to parent
    if (onSocialSecurityChange) {
      onSocialSecurityChange(currentSgk);
    } else {
      onFieldChange("cottGroupSocialSecurity" as any, currentSgk);
    }
    onFieldChange("sgkEmployeeRate", currentSgk.employeeSgkRate);
    onFieldChange("sgkEmployerStandardRate", currentSgk.employerSgkRate);
    onFieldChange("unemploymentEmployeeRate", currentSgk.employeeUnemploymentRate);
    onFieldChange("unemploymentEmployerRate", currentSgk.employerUnemploymentRate);
    onFieldChange("sgkBaseFloor", currentSgk.monthlySgkFloor);
    onFieldChange("sgkBaseCeiling", currentSgk.monthlySgkCeiling);
    onFieldChange("grossMinWage", currentSgk.monthlySgkFloor);
    onFieldChange("dailyMinWage", currentSgk.dailySgkFloor);

    // 2. Apply Wage Tax Tariff changes to parent
    if (onWageTaxTariffChange) {
      onWageTaxTariffChange(currentWageTariff);
    } else {
      onFieldChange("cottGroupWageTaxTariff" as any, currentWageTariff);
    }
    onFieldChange(
      "taxBrackets",
      currentWageTariff.map((t) => ({
        bracket: t.label,
        limit: t.toLimit,
        rate: t.rate,
        rateLabel: t.rateLabel,
      }))
    );

    // 3. Apply Non-Wage Tax Tariff changes to parent
    if (onNonWageTaxTariffChange) {
      onNonWageTaxTariffChange(currentNonWageTariff);
    } else {
      onFieldChange("cottGroupNonWageTaxTariff" as any, currentNonWageTariff);
    }

    // 4. Apply Monthly Exemptions changes to parent
    if (onMonthlyExemptionsChange) {
      onMonthlyExemptionsChange(currentMonthlyExemptions);
    } else {
      onFieldChange("cottGroupMonthlyExemptions" as any, currentMonthlyExemptions);
    }
    if (currentMonthlyExemptions[0]) {
      onFieldChange("minWageTaxExemption", currentMonthlyExemptions[0].incomeTaxExemption);
      onFieldChange("minWageStampTaxExemption", currentMonthlyExemptions[0].stampTaxExemption);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLastAppliedAt(timeStr);
    setAppliedSuccessMessage(`Değişiklikler başarıyla doğrulandı ve hesaplama tablolarına anında uygulandı (${timeStr}).`);

    // Auto clear notification after 4 seconds
    setTimeout(() => {
      setAppliedSuccessMessage(null);
    }, 4500);

    return true;
  };

  // Discard draft changes and restore to initial formData
  const handleDiscardDraft = () => {
    setDraftSgk(initialSgk);
    setDraftWageTariff(initialWageTariff);
    setDraftNonWageTariff(initialNonWageTariff);
    setDraftMonthlyExemptions(initialMonthlyExemptions);
    setAppliedSuccessMessage(null);
  };

  // Handle SGK Draft Input Changes
  const handleDraftSgkChange = (field: keyof CottGroupSocialSecurity, value: number) => {
    const updated: CottGroupSocialSecurity = {
      ...draftSgk,
      [field]: value,
    };
    if (field === "monthlySgkFloor") {
      updated.dailySgkFloor = Number((value / 30).toFixed(2));
    } else if (field === "dailySgkFloor") {
      updated.monthlySgkFloor = Number((value * 30).toFixed(2));
    }
    setDraftSgk(updated);

    if (liveCalculationMode) {
      handleApplyChanges({ forceSgk: updated });
    }
  };

  // Handle Wage Tax Tariff Draft Input Changes
  const handleDraftWageTariffChange = (
    index: number,
    field: "toLimit" | "rate" | "baseTaxAmount",
    value: number
  ) => {
    const updated = [...draftWageTariff];
    const item = { ...updated[index], [field]: value };
    if (field === "rate") {
      item.rateLabel = `%${Number((value * 100).toFixed(1))}`;
    }
    updated[index] = item;
    setDraftWageTariff(updated);

    if (liveCalculationMode) {
      handleApplyChanges({ forceWage: updated });
    }
  };

  // Handle Non-Wage Tax Tariff Draft Input Changes
  const handleDraftNonWageTariffChange = (
    index: number,
    field: "toLimit" | "rate" | "baseTaxAmount",
    value: number
  ) => {
    const updated = [...draftNonWageTariff];
    const item = { ...updated[index], [field]: value };
    if (field === "rate") {
      item.rateLabel = `%${Number((value * 100).toFixed(1))}`;
    }
    updated[index] = item;
    setDraftNonWageTariff(updated);

    if (liveCalculationMode) {
      handleApplyChanges({ forceNonWage: updated });
    }
  };

  // Handle Monthly Exemptions Draft Input Changes
  const handleDraftExemptionChange = (
    index: number,
    field: "incomeTaxExemption" | "stampTaxExemption",
    value: number
  ) => {
    const updated = [...draftMonthlyExemptions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setDraftMonthlyExemptions(updated);

    if (liveCalculationMode) {
      handleApplyChanges({ forceExemptions: updated });
    }
  };

  // Apply January Exemption to All 12 Months
  const handleApplyJanExemptionToAll = () => {
    const jan = draftMonthlyExemptions[0];
    if (!jan) return;
    const updated = draftMonthlyExemptions.map((m) => ({
      ...m,
      incomeTaxExemption: jan.incomeTaxExemption,
      stampTaxExemption: jan.stampTaxExemption,
    }));
    setDraftMonthlyExemptions(updated);
    if (liveCalculationMode) {
      handleApplyChanges({ forceExemptions: updated });
    }
  };

  // 12 Ayı Resmi Tarifeye Göre Otomatik Yeniden Hesapla (Mevzuata Göre)
  const handleAutoCalculateAll12Months = () => {
    const grossMin = draftSgk.monthlySgkFloor || 33030.0;
    const sgkRate = draftSgk.employeeSgkRate || 0.14;
    const unempRate = draftSgk.employeeUnemploymentRate || 0.01;
    const totalDeductionRate = sgkRate + unempRate;

    const monthlySgkWorker = Number((grossMin * totalDeductionRate).toFixed(2));
    const monthlyIncomeTaxBase = Number((grossMin - monthlySgkWorker).toFixed(2));
    const monthlyStampTaxExemption = Number((grossMin * (formData.stampTaxRate || 0.00759)).toFixed(2));

    let cumulativeMatrah = 0;
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    // Helper to calculate total tax on a cumulative matrah using current draft wage tariff
    const calcTaxOnCumulative = (cum: number) => {
      let tax = 0;
      let remaining = cum;
      let prevLimit = 0;

      for (let i = 0; i < draftWageTariff.length; i++) {
        const bracket = draftWageTariff[i];
        const span = bracket.toLimit === Infinity ? Infinity : bracket.toLimit - prevLimit;
        if (remaining <= 0) break;

        const taxableInSpan = Math.min(remaining, span);
        tax += taxableInSpan * bracket.rate;
        remaining -= taxableInSpan;
        if (bracket.toLimit !== Infinity) {
          prevLimit = bracket.toLimit;
        }
      }
      return Number(tax.toFixed(2));
    };

    const newExemptions: CottGroupMonthlyExemption[] = months.map((m, idx) => {
      const prevCum = cumulativeMatrah;
      cumulativeMatrah = Number((cumulativeMatrah + monthlyIncomeTaxBase).toFixed(2));
      const taxBefore = calcTaxOnCumulative(prevCum);
      const taxAfter = calcTaxOnCumulative(cumulativeMatrah);
      const monthlyTax = Number((taxAfter - taxBefore).toFixed(2));

      return {
        month: m,
        grossMinimumWage: grossMin,
        sgkWorkerDeduction: monthlySgkWorker,
        incomeTaxBase: monthlyIncomeTaxBase,
        cumulativeIncomeTaxBase: cumulativeMatrah,
        incomeTaxExemption: monthlyTax,
        stampTaxExemption: monthlyStampTaxExemption,
      };
    });

    setDraftMonthlyExemptions(newExemptions);
    handleApplyChanges({ forceExemptions: newExemptions });
  };

  // Exemption Totals
  const totalIncomeTaxExemption = useMemo(() => {
    return draftMonthlyExemptions.reduce((sum, m) => sum + (m.incomeTaxExemption || 0), 0);
  }, [draftMonthlyExemptions]);

  const totalStampTaxExemption = useMemo(() => {
    return draftMonthlyExemptions.reduce((sum, m) => sum + (m.stampTaxExemption || 0), 0);
  }, [draftMonthlyExemptions]);

  const grandTotalExemption = totalIncomeTaxExemption + totalStampTaxExemption;

  // =========================================================================
  // 🧮 INTERACTIVE PAYROLL SIMULATOR ENGINE (Uses active draft or applied values)
  // =========================================================================
  const [simGrossWage, setSimGrossWage] = useState<number>(50000.0);
  const [simDiscountType, setSimDiscountType] = useState<"none" | "standard2p" | "mfg5p">("standard2p");
  const [simMonthIndex, setSimMonthIndex] = useState<number>(0); // 0 = Ocak

  const calcInteractivePayroll = (
    gross: number,
    discountType: "none" | "standard2p" | "mfg5p",
    monthIdx: number
  ) => {
    const validGross = Math.max(0, gross || 0);
    // SGK Base capped by floor and ceiling
    const sgkBase = Math.min(Math.max(validGross, draftSgk.monthlySgkFloor), draftSgk.monthlySgkCeiling);
    const sgkEmployee = Number((sgkBase * draftSgk.employeeSgkRate).toFixed(2));
    const unempEmployee = Number((sgkBase * draftSgk.employeeUnemploymentRate).toFixed(2));
    const totalSgkEmployee = Number((sgkEmployee + unempEmployee).toFixed(2));

    const incomeTaxBase = Math.max(0, Number((validGross - totalSgkEmployee).toFixed(2)));

    // Tax calculation according to bracket 1 (or cumulative)
    const rawIncomeTax = Number((incomeTaxBase * (draftWageTariff[0]?.rate || 0.15)).toFixed(2));
    const activeExemption = draftMonthlyExemptions[monthIdx] || draftMonthlyExemptions[0];
    const gvExemption = activeExemption ? activeExemption.incomeTaxExemption : 4211.33;
    const dvExemption = activeExemption ? activeExemption.stampTaxExemption : 250.7;

    const payableIncomeTax = Math.max(0, Number((rawIncomeTax - gvExemption).toFixed(2)));

    const rawStampTax = Number((validGross * (formData.stampTaxRate || 0.00759)).toFixed(2));
    const payableStampTax = Math.max(0, Number((rawStampTax - dvExemption).toFixed(2)));

    const totalEmployeeDeductions = Number((totalSgkEmployee + payableIncomeTax + payableStampTax).toFixed(2));
    const netWage = Number((validGross - totalEmployeeDeductions).toFixed(2));

    // Employer shares
    let employerSgkRateUsed = draftSgk.employerSgkRate;
    if (discountType === "standard2p") {
      employerSgkRateUsed = Math.max(0, draftSgk.employerSgkRate - draftSgk.employerDiscountRate);
    } else if (discountType === "mfg5p") {
      employerSgkRateUsed = Math.max(0, draftSgk.employerSgkRate - draftSgk.employerMfgDiscountRate);
    }

    const employerSgk = Number((sgkBase * employerSgkRateUsed).toFixed(2));
    const employerUnemp = Number((sgkBase * draftSgk.employerUnemploymentRate).toFixed(2));
    const totalEmployerCost = Number((validGross + employerSgk + employerUnemp).toFixed(2));

    return {
      validGross,
      sgkBase,
      sgkEmployee,
      unempEmployee,
      totalSgkEmployee,
      incomeTaxBase,
      rawIncomeTax,
      gvExemption,
      payableIncomeTax,
      rawStampTax,
      dvExemption,
      payableStampTax,
      totalEmployeeDeductions,
      netWage,
      employerSgkRateUsed,
      employerSgk,
      employerUnemp,
      totalEmployerCost,
    };
  };

  const simResult = calcInteractivePayroll(simGrossWage, simDiscountType, simMonthIndex);

  // Official CottGroup Sample 1: Minimum Wage (calculated with active floor)
  const minWageSample = calcInteractivePayroll(draftSgk.monthlySgkFloor, "none", 0);
  const minWageSample2p = calcInteractivePayroll(draftSgk.monthlySgkFloor, "standard2p", 0);
  const minWageSample5p = calcInteractivePayroll(draftSgk.monthlySgkFloor, "mfg5p", 0);

  // Helper for checking if a field has an error
  const getFieldError = (fieldId: string) => {
    return validationResults.errors.find((e) => e.field === fieldId);
  };

  return (
    <div className="space-y-5">
      {/* 🏛️ Official CottGroup Citation & Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                2026 Yasal Mevzuat Rehberi
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                332 Sıra No'lu GVK Tebliği
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Canlı Form Doğrulama
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>SGK ve Personel Vergilendirme Yönetimi</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sosyal Güvenlik Yükümlülükleri, 2026 Gelir Vergisi Tarifeleri (Ücretli ve Ücret Dışı), Asgari Ücret Vergi İstisnaları ve Bordro Hesaplama Simülatörünü dilediğinizce düzenleyebilir; <strong>Değişiklikleri Uygula</strong> butonu ile anında tüm hesaplama tablolarına yansıtabilirsiniz.
            </p>
          </div>

          {/* Action Buttons & Status Indicators */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Live Calculation Mode Toggle */}
            <button
              type="button"
              onClick={() => setLiveCalculationMode(!liveCalculationMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                liveCalculationMode
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-white/10 text-slate-300 border-white/15 hover:bg-white/20"
              }`}
              title="Açıkken her girdi anında hesaplama tablolarına ve simülatöre yansır"
            >
              <Zap className={`w-3.5 h-3.5 ${liveCalculationMode ? "text-emerald-400" : "text-slate-400"}`} />
              <span>Canlı Mod: {liveCalculationMode ? "AÇIK" : "KAPALI"}</span>
            </button>

            {/* Değişiklikleri Geri Al (Eğer taslak değişiklik varsa) */}
            {hasUnappliedChanges && canEdit && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-xs"
                title="Yapılan taslak değişiklikleri geri alır ve geçerli değerlere döner"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Geri Al</span>
              </button>
            )}

            {/* 🚀 DEĞİŞİKLİKLERİ UYGULA BUTONU */}
            {canEdit && (
              <button
                type="button"
                id="btn-apply-payroll-changes"
                onClick={() => handleApplyChanges()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
                  hasUnappliedChanges
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ring-2 ring-emerald-400/50 animate-pulse"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                title="Yapılan tüm form değişikliklerini doğrular ve hesaplama tablolarını anında günceller"
              >
                <RefreshCw className={`w-4 h-4 ${hasUnappliedChanges ? "rotate-45" : ""}`} />
                <span>
                  {hasUnappliedChanges
                    ? `Değişiklikleri Uygula (${unappliedCount} Alan)`
                    : "Değişiklikleri Uygula"}
                </span>
              </button>
            )}

            {/* Değişiklikleri Kaydet (Kalıcı ERP / Veritabanı Kaydı) */}
            {canEdit && onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={!hasChanges && !hasUnappliedChanges}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  hasChanges
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-amber-400 shadow-sm"
                    : "bg-white/10 text-slate-400 border-white/10 hover:bg-white/15"
                }`}
                title="Tüm parametreleri ERP sistemine ve yerel depolamaya kaydeder"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{hasChanges ? "Sisteme Kaydet" : "Kayıtlı"}</span>
              </button>
            )}

            {/* Kanuni Değerleri İnternetten Güncelle */}
            {canEdit && onResetToCottGroupDefaults && (
              <button
                type="button"
                onClick={onResetToCottGroupDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white text-xs font-bold transition-all border border-white/15 cursor-pointer shadow-xs"
                title="Tüm 5 tabloyu resmi kanuni değerlere ve internet mevzuatına göre günceller"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kanuni Değerleri İnternetten Güncelle</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Success Notification */}
        {appliedSuccessMessage && (
          <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{appliedSuccessMessage}</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-md">
              Hesaplamalar Güncel
            </span>
          </div>
        )}

        {/* Validation Errors Notice */}
        {!validationResults.isValid && (
          <div className="mt-3 p-3.5 bg-rose-500/20 border border-rose-400/50 rounded-xl text-xs text-rose-200 space-y-1.5 animate-shake">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Form Doğrulama Hatası ({validationResults.errors.length} Hata Tespit Edildi):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-100 pl-1">
              {validationResults.errors.map((err) => (
                <li key={err.id}>
                  <strong>[{err.section === "sgk" ? "SGK & PEK" : err.section === "wage_tax" ? "Ücretliler GV" : err.section === "non_wage_tax" ? "Ücret Dışı GV" : "İstisnalar"}]:</strong> {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 🧭 5 Official Tables Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTableTab("sgk")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTableTab === "sgk"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>1. Sosyal Güvenlik Yükümlülüğü & PEK</span>
          {validationResults.errors.some((e) => e.section === "sgk") && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTableTab("wage_tax")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTableTab === "wage_tax"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>2. Ücretliler Gelir Vergisi Tarifesi</span>
          {validationResults.errors.some((e) => e.section === "wage_tax") && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTableTab("non_wage_tax")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTableTab === "non_wage_tax"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>3. Ücret Dışı Gelir Vergisi Tarifesi</span>
          {validationResults.errors.some((e) => e.section === "non_wage_tax") && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTableTab("exemptions")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTableTab === "exemptions"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>4. 2026 Asgari Ücret Vergi İstisnaları (12 Ay)</span>
          {validationResults.errors.some((e) => e.section === "exemptions") && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTableTab("payroll_sample")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTableTab === "payroll_sample"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>5. Bordro Hesaplama Süreci & Canlı Simülatör</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📌 TABLO 1: SOSYAL GÜVENLİK YÜKÜMLÜLÜĞÜ & PEK TUTARLARI */}
      {/* ========================================================================= */}
      {activeTableTab === "sgk" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Sosyal Güvenlik Yükümlülüğü - Prim Oranları Tablosu</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  5510 Sayılı Kanun gereğince çalışan ve işveren sigorta prim kesinti ve teşvik oranları (Değiştirilebilir Form)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasUnappliedChanges && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Uygulanmayı Bekleyen Değişiklikler Var</span>
                  </span>
                )}
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                  2026 Yürürlük
                </span>
              </div>
            </div>

            {/* Official Rates Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 rounded-l-lg">Prim Türü / Katkı Payı</th>
                    <th className="py-2.5 px-3 text-center">Çalışan Payı (%)</th>
                    <th className="py-2.5 px-3 text-center">İşveren Payı (%)</th>
                    <th className="py-2.5 px-3 text-center">Toplam Oran (%)</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Yasal Açıklama & İndirimler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Row 1: SGK Katkı Payı */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      SGK Katkı Payı (Malullük, Yaşlılık, Ölüm, GSS)
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-slate-400 font-bold">%</span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canEdit}
                          value={Number((draftSgk.employeeSgkRate * 100).toFixed(2))}
                          onChange={(e) =>
                            handleDraftSgkChange("employeeSgkRate", (parseFloat(e.target.value) || 0) / 100)
                          }
                          className={`w-16 text-center font-mono font-bold bg-slate-50 border rounded-lg py-1 px-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none ${
                            getFieldError("employeeSgkRate")
                              ? "border-rose-500 ring-1 ring-rose-400"
                              : "border-slate-200 focus:border-indigo-500"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-slate-400 font-bold">%</span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canEdit}
                          value={Number((draftSgk.employerSgkRate * 100).toFixed(2))}
                          onChange={(e) =>
                            handleDraftSgkChange("employerSgkRate", (parseFloat(e.target.value) || 0) / 100)
                          }
                          className={`w-16 text-center font-mono font-bold bg-slate-50 border rounded-lg py-1 px-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none ${
                            getFieldError("employerSgkRate")
                              ? "border-rose-500 ring-1 ring-rose-400"
                              : "border-slate-200 focus:border-indigo-500"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                      %{Number(((draftSgk.employeeSgkRate + draftSgk.employerSgkRate) * 100).toFixed(2))}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      5510 Sayılı Kanun Md. 81
                    </td>
                  </tr>

                  {/* Row 2: İşsizlik Sigortası */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      İşsizlik Sigortası Katkı Payı
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-slate-400 font-bold">%</span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canEdit}
                          value={Number((draftSgk.employeeUnemploymentRate * 100).toFixed(2))}
                          onChange={(e) =>
                            handleDraftSgkChange("employeeUnemploymentRate", (parseFloat(e.target.value) || 0) / 100)
                          }
                          className="w-16 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-slate-400 font-bold">%</span>
                        <input
                          type="number"
                          step="0.1"
                          disabled={!canEdit}
                          value={Number((draftSgk.employerUnemploymentRate * 100).toFixed(2))}
                          onChange={(e) =>
                            handleDraftSgkChange("employerUnemploymentRate", (parseFloat(e.target.value) || 0) / 100)
                          }
                          className="w-16 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                      %{Number(((draftSgk.employeeUnemploymentRate + draftSgk.employerUnemploymentRate) * 100).toFixed(2))}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      4447 Sayılı İşsizlik Sigortası Kanunu
                    </td>
                  </tr>

                  {/* Row 3: Toplam (İndirimsiz) */}
                  <tr className="bg-slate-50/60 font-bold">
                    <td className="py-2.5 px-3 text-slate-900">
                      Toplam Prim Oranı (Yasal Standart)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-950">
                      %{Number(((draftSgk.employeeSgkRate + draftSgk.employeeUnemploymentRate) * 100).toFixed(2))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-950">
                      %{Number(((draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate) * 100).toFixed(2))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-indigo-800">
                      %{Number(((draftSgk.employeeSgkRate + draftSgk.employeeUnemploymentRate + draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate) * 100).toFixed(2))}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      Herhangi bir hazine teşviki uygulanmadığındaki brüt kesinti
                    </td>
                  </tr>

                  {/* Row 4: İndirim Oranları */}
                  <tr className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-emerald-800">
                      SGK Prim Teşvik İndirimi*
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">-</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="inline-flex items-center gap-1" title="Standart Hazine İndirimi (5 Puan)">
                          <span className="text-emerald-600 font-bold text-[10px]">Std: -%</span>
                          <input
                            type="number"
                            step="0.5"
                            disabled={!canEdit}
                            value={Number((draftSgk.employerDiscountRate * 100).toFixed(2))}
                            onChange={(e) =>
                              handleDraftSgkChange("employerDiscountRate", (parseFloat(e.target.value) || 0) / 100)
                            }
                            className="w-14 text-center font-mono font-bold bg-white border border-emerald-300 rounded-lg py-0.5 px-1 text-xs text-emerald-900 focus:outline-none"
                          />
                        </div>
                        <div className="inline-flex items-center gap-1" title="İmalat Sektörü İndirimi">
                          <span className="text-teal-600 font-bold text-[10px]">İml: -%</span>
                          <input
                            type="number"
                            step="0.5"
                            disabled={!canEdit}
                            value={Number((draftSgk.employerMfgDiscountRate * 100).toFixed(2))}
                            onChange={(e) =>
                              handleDraftSgkChange("employerMfgDiscountRate", (parseFloat(e.target.value) || 0) / 100)
                            }
                            className="w-14 text-center font-mono font-bold bg-white border border-teal-300 rounded-lg py-0.5 px-1 text-xs text-teal-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-700">
                      -%{Number((draftSgk.employerDiscountRate * 100).toFixed(2))} (Std)
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      5510 S.K. Md. 81/ı (%5 Hazine Teşvik İndirimi)
                    </td>
                  </tr>

                  {/* Row 5: İndirim Dâhil Toplam */}
                  <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                    <td className="py-2.5 px-3">
                      İndirim Dâhil Toplam İşveren Oranı
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      %{Number(((draftSgk.employeeSgkRate + draftSgk.employeeUnemploymentRate) * 100).toFixed(2))}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-800">
                      <div>
                        %{Number(((draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate - draftSgk.employerDiscountRate) * 100).toFixed(2))}{" "}
                        <span className="text-[10px] text-slate-500 font-normal">(Standart Teşvikli)</span>
                      </div>
                      <div className="text-[10px] text-teal-700 font-semibold">
                        %{Number(((draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate - draftSgk.employerMfgDiscountRate) * 100).toFixed(2))} (İmalat)
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-900">
                      %{Number(((draftSgk.employeeSgkRate + draftSgk.employeeUnemploymentRate + draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate - draftSgk.employerDiscountRate) * 100).toFixed(2))}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-emerald-800">
                      Mevzuata uygun prim teşviki düşüldükten sonraki net işveren yükümlülüğü
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sub-table: Prime Esas Kazanç (PEK) Taban ve Tavan Tutarları */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Prime Esas Kazanç (PEK) Taban ve Tavan Tutarları (2026)</span>
                </h5>
                <span className="text-[10px] text-slate-500">
                  Tavan / Taban Oranı: <strong>{(draftSgk.monthlySgkCeiling / (draftSgk.monthlySgkFloor || 1)).toFixed(1)}x</strong>
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Aylık Taban */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  getFieldError("monthlySgkFloor")
                    ? "bg-rose-50/50 border-rose-300"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="text-[11px] font-bold text-slate-600">Aylık SGK Tabanı (Brüt Asgari Ücret)</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">₺</span>
                    <input
                      type="number"
                      step="1"
                      disabled={!canEdit}
                      value={draftSgk.monthlySgkFloor}
                      onChange={(e) =>
                        handleDraftSgkChange("monthlySgkFloor", parseFloat(e.target.value) || 0)
                      }
                      className="w-full font-mono text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">1 Ocak 2026 İtibarıyla Yürürlük</span>
                </div>

                {/* Aylık Tavan */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  getFieldError("monthlySgkCeiling")
                    ? "bg-rose-50/50 border-rose-300"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className="text-[11px] font-bold text-slate-600">Aylık SGK Tavanı (Azami PEK)</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">₺</span>
                    <input
                      type="number"
                      step="100"
                      disabled={!canEdit}
                      value={draftSgk.monthlySgkCeiling}
                      onChange={(e) =>
                        handleDraftSgkChange("monthlySgkCeiling", parseFloat(e.target.value) || 0)
                      }
                      className="w-full font-mono text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Azami prime esas kazanç sınırı</span>
                </div>

                {/* Günlük Taban */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="text-[11px] font-bold text-slate-600">Günlük SGK Tabanı</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">₺</span>
                    <input
                      type="number"
                      step="0.1"
                      disabled={!canEdit}
                      value={draftSgk.dailySgkFloor}
                      onChange={(e) =>
                        handleDraftSgkChange("dailySgkFloor", parseFloat(e.target.value) || 0)
                      }
                      className="w-full font-mono text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{formatTRY(draftSgk.monthlySgkFloor)} / 30 gün</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 TABLO 2: ÜCRETLİLER İÇİN UYGULANACAK 2026 YILI GELİR VERGİSİ TARİFESİ */}
      {/* ========================================================================= */}
      {activeTableTab === "wage_tax" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Ücretliler İçin Uygulanacak 2026 Yılı Gelir Vergisi Tarifesi</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  193 Sayılı Gelir Vergisi Kanunu 332 Seri No'lu Tebliği uyarınca ücret gelirlerine uygulanacak artan oranlı vergi dilimleri (Değiştirilebilir Form)
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                193 S.K. Md. 103
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 rounded-l-lg">Dilim</th>
                    <th className="py-2.5 px-3">Gelir Dilimi Sınırı (TL)</th>
                    <th className="py-2.5 px-3 text-center">Vergi Oranı (%)</th>
                    <th className="py-2.5 px-3">Sabit / Taban Vergi (TL)</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Resmi Hesaplanan Vergi Formülü</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {draftWageTariff.map((bracket, idx) => (
                    <tr key={bracket.bracketId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-indigo-700">
                        {bracket.bracketId}. Dilim
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Tavan:</span>
                          {bracket.toLimit === Infinity ? (
                            <span className="font-mono font-bold text-slate-800">4.300.000 TL ve üzeri (Sınırsız)</span>
                          ) : (
                            <input
                              type="number"
                              step="5000"
                              disabled={!canEdit}
                              value={bracket.toLimit}
                              onChange={(e) =>
                                handleDraftWageTariffChange(idx, "toLimit", parseFloat(e.target.value) || 0)
                              }
                              className={`w-36 font-mono font-bold bg-slate-50 border rounded-lg py-1 px-2 text-xs text-slate-900 focus:bg-white focus:outline-none ${
                                getFieldError(`wageTariff-${idx}`)
                                  ? "border-rose-500 ring-1 ring-rose-400"
                                  : "border-slate-200 focus:border-indigo-500"
                              }`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400 font-bold">%</span>
                          <input
                            type="number"
                            step="1"
                            disabled={!canEdit}
                            value={Number((bracket.rate * 100).toFixed(0))}
                            onChange={(e) =>
                              handleDraftWageTariffChange(idx, "rate", (parseFloat(e.target.value) || 0) / 100)
                            }
                            className="w-14 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₺</span>
                          <input
                            type="number"
                            step="500"
                            disabled={!canEdit}
                            value={bracket.baseTaxAmount}
                            onChange={(e) =>
                              handleDraftWageTariffChange(idx, "baseTaxAmount", parseFloat(e.target.value) || 0)
                            }
                            className="w-28 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600 font-medium">
                        {bracket.formulaDescription}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Ücret Gelirleri Özelliği:</strong> 3. dilim tavanı ücret geliri elde eden çalışanlar için <strong>800.000,00 TL</strong> olarak uygulanmaktadır (193 sayılı Gelir Vergisi Kanunu 332 Seri No'lu Tebliği).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 TABLO 3: ÜCRET DIŞINDAKİ GELİRLER İÇİN UYGULANACAK 2026 YILI GELİR VERGİSİ */}
      {/* ========================================================================= */}
      {activeTableTab === "non_wage_tax" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-600" />
                  <span>Ücret Dışındaki Gelirler İçin Uygulanacak 2026 Yılı Gelir Vergisi Tarifesi</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ticari kazanç, serbest meslek kazancı, kira ve zirai kazançlar için 2026 yasal tarifesi (Değiştirilebilir Form)
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                Ücret Dışı Tarife
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 rounded-l-lg">Dilim</th>
                    <th className="py-2.5 px-3">Gelir Dilimi (TL)</th>
                    <th className="py-2.5 px-3 text-center">Vergi Oranı (%)</th>
                    <th className="py-2.5 px-3">Sabit Taban Vergi (TL)</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Hesaplanan Vergi Açıklaması</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {draftNonWageTariff.map((bracket, idx) => (
                    <tr key={bracket.bracketId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-teal-700">
                        {bracket.bracketId}. Dilim
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Tavan:</span>
                          {bracket.toLimit === Infinity ? (
                            <span className="font-mono font-bold text-slate-800">4.300.000 TL ve üzeri (Sınırsız)</span>
                          ) : (
                            <input
                              type="number"
                              step="5000"
                              disabled={!canEdit}
                              value={bracket.toLimit}
                              onChange={(e) =>
                                handleDraftNonWageTariffChange(idx, "toLimit", parseFloat(e.target.value) || 0)
                              }
                              className={`w-36 font-mono font-bold bg-slate-50 border rounded-lg py-1 px-2 text-xs text-slate-900 focus:bg-white focus:outline-none ${
                                getFieldError(`nonWageTariff-${idx}`)
                                  ? "border-rose-500 ring-1 ring-rose-400"
                                  : "border-slate-200 focus:border-teal-500"
                              }`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400 font-bold">%</span>
                          <input
                            type="number"
                            step="1"
                            disabled={!canEdit}
                            value={Number((bracket.rate * 100).toFixed(0))}
                            onChange={(e) =>
                              handleDraftNonWageTariffChange(idx, "rate", (parseFloat(e.target.value) || 0) / 100)
                            }
                            className="w-14 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₺</span>
                          <input
                            type="number"
                            step="500"
                            disabled={!canEdit}
                            value={bracket.baseTaxAmount}
                            onChange={(e) =>
                              handleDraftNonWageTariffChange(idx, "baseTaxAmount", parseFloat(e.target.value) || 0)
                            }
                            className="w-28 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600 font-medium">
                        {bracket.formulaDescription}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2 text-xs text-teal-900">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong>Tarife Karşılaştırması:</strong> Ücret dışındaki gelirlerde 2. dilim tavanı <strong>380.000,00 TL</strong>, 3. dilim tavanı <strong>1.300.000,00 TL</strong>'dir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 TABLO 4: 2026 ASGARİ ÜCRET VERGİ İSTİSNALARI (12 AY) */}
      {/* ========================================================================= */}
      {activeTableTab === "exemptions" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>2026 Asgari Ücret Vergi İstisnaları (12 Aylık Yasal Tablo)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  7349 sayılı Kanun gereği asgari ücrete kadar olan kazançların Gelir ve Damga Vergisi istisna tutarları (Değiştirilebilir Form)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleAutoCalculateAll12Months}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
                    title="Brüt asgari ücret ve güncel vergi tarifesine göre 12 ayın GV ve DV istisnalarını tek tıkla otomatik hesaplar"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>12 Ayı Otomatik Yeniden Hesapla</span>
                  </button>
                )}

                {canEdit && (
                  <button
                    type="button"
                    onClick={handleApplyJanExemptionToAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
                    title="Ocak ayı istisna tutarlarını tüm aylara kopyalar"
                  >
                    <span>Ocak Tutarını Tüm Aylara Uygula</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 rounded-l-lg">Dönem / Ay</th>
                    <th className="py-2.5 px-3">Brüt Asgari Ücret (TL)</th>
                    <th className="py-2.5 px-3">SGK İşçi Payı (%15)</th>
                    <th className="py-2.5 px-3">GV Matrahı</th>
                    <th className="py-2.5 px-3">Kümülatif GV Matrahı</th>
                    <th className="py-2.5 px-3">Gelir Vergisi İstisnası (TL)</th>
                    <th className="py-2.5 px-3">Damga Vergisi İstisnası (TL)</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Toplam Aylık İstisna (TL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {draftMonthlyExemptions.map((monthData, idx) => (
                    <tr key={monthData.month} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{monthData.month}</span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700">
                        {formatTRY(monthData.grossMinimumWage || draftSgk.monthlySgkFloor)}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700">
                        {formatTRY(monthData.sgkWorkerDeduction || Number((draftSgk.monthlySgkFloor * 0.15).toFixed(2)))}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700">
                        {formatTRY(monthData.incomeTaxBase || Number((draftSgk.monthlySgkFloor * 0.85).toFixed(2)))}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-700">
                        {monthData.cumulativeIncomeTaxBase ? formatTRY(monthData.cumulativeIncomeTaxBase) : "-"}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₺</span>
                          <input
                            type="number"
                            step="0.01"
                            disabled={!canEdit}
                            value={monthData.incomeTaxExemption}
                            onChange={(e) =>
                              handleDraftExemptionChange(idx, "incomeTaxExemption", parseFloat(e.target.value) || 0)
                            }
                            className={`w-28 font-mono font-bold bg-slate-50 border rounded-lg py-1 px-2 text-xs text-slate-900 focus:bg-white focus:outline-none ${
                              getFieldError(`exemption-gv-${idx}`)
                                ? "border-rose-500 ring-1 ring-rose-400"
                                : "border-slate-200 focus:border-indigo-500"
                            }`}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₺</span>
                          <input
                            type="number"
                            step="0.01"
                            disabled={!canEdit}
                            value={monthData.stampTaxExemption}
                            onChange={(e) =>
                              handleDraftExemptionChange(idx, "stampTaxExemption", parseFloat(e.target.value) || 0)
                            }
                            className="w-24 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                        {formatTRY((monthData.incomeTaxExemption || 0) + (monthData.stampTaxExemption || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-50/80 font-black text-indigo-950 border-t-2 border-indigo-200">
                    <td className="py-3 px-3" colSpan={5}>
                      Yıllık Kümülatif Toplam
                    </td>
                    <td className="py-3 px-3 font-mono text-sm">
                      {formatTRY(totalIncomeTaxExemption)}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm">
                      {formatTRY(totalStampTaxExemption)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-indigo-900">
                      {formatTRY(grandTotalExemption)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
              <strong>Yasal İstisna Geçişleri (7349 S.K.):</strong> Asgari ücret kümülatif matrahı 1. vergi dilimini aştığı aylarda (Haziran-Temmuz ve sonrası) Gelir Vergisi istisnası artan oranlı tarifeye paralel olarak <strong>5.615,10 TL</strong> ve <strong>5.864,28 TL</strong> seviyesine yükselmektedir.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📌 TABLO 5: 2026 BORDRO HESAPLAMA SÜRECİ ÖRNEĞİ & CANLI SİMÜLATÖR */}
      {/* ========================================================================= */}
      {activeTableTab === "payroll_sample" && (
        <div className="space-y-5">
          {/* Section 1: Official Step-by-Step Payroll Calculation Process Guide */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>2026 Bordro Hesaplama Süreci Adımları ve Formülleri</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Resmi kanuni mevzuat standartlarına göre brütten nete yasal kesinti hesaplama algoritması
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700">1. SGK İşçi Kesintisi (%14)</span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  = PEK Matrahı × %{Number((draftSgk.employeeSgkRate * 100).toFixed(1))}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700">2. İşsizlik İşçi Kesintisi (%1)</span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  = PEK Matrahı × %{Number((draftSgk.employeeUnemploymentRate * 100).toFixed(1))}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700">3. Gelir Vergisi Matrahı</span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  = Brüt Ücret - (SGK İşçi + İşsizlik)
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700">4. Ödenecek Gelir Vergisi</span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  = (GV Matrahı × Dilim Oranı) - A.Ü. GV İstisnası
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700">5. Ödenecek Damga Vergisi</span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  = (Brüt Ücret × 0,00759) - A.Ü. DV İstisnası
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-indigo-700">6. Net Ücret (Ele Geçen)</span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  = Brüt - (SGK + İşsizlik + Ödenecek GV + Ödenecek DV)
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Official CottGroup Example 1 - Minimum Wage */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Resmi Örnek 1: Asgari Ücretlinin Bordrosu ve İşveren Maliyeti</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Brüt Asgari Ücret: <strong>{formatTRY(draftSgk.monthlySgkFloor)}</strong> | Net Ele Geçen: <strong>{formatTRY(minWageSample.netWage)}</strong>
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                Net Ücret: {formatTRY(minWageSample.netWage)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 rounded-l-lg">Bordro Kalemi</th>
                    <th className="py-2.5 px-3">Hesaplama Formülü / Açıklama</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Tutar (TL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800">Brüt Ücret (Asgari Ücret)</td>
                    <td className="py-2 px-3 text-slate-500">Aylık Yasal Asgari Ücret Tabanı</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatTRY(minWageSample.validGross)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">SGK İşçi Primi (%14)</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(minWageSample.sgkBase)} × %14</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600">
                      -{formatTRY(minWageSample.sgkEmployee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">İşsizlik Sigortası İşçi Primi (%1)</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(minWageSample.sgkBase)} × %1</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600">
                      -{formatTRY(minWageSample.unempEmployee)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-slate-800">Gelir Vergisi Matrahı</td>
                    <td className="py-2 px-3 text-slate-500">Brüt Ücret - SGK Kesintileri</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatTRY(minWageSample.incomeTaxBase)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Hesaplanan Gelir Vergisi (%15)</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(minWageSample.incomeTaxBase)} × %15</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatTRY(minWageSample.rawIncomeTax)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-emerald-800">Asgari Ücret Gelir Vergisi İstisnası</td>
                    <td className="py-2 px-3 text-emerald-700">7349 Sayılı Kanun gereği tam istisna</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      -{formatTRY(minWageSample.gvExemption)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/30">
                    <td className="py-2 px-3 font-bold text-emerald-900">Ödenecek Gelir Vergisi</td>
                    <td className="py-2 px-3 text-emerald-700">Hesaplanan GV - GV İstisnası</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                      0,00 TL
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Hesaplanan Damga Vergisi</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(minWageSample.validGross)} × %0,759</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatTRY(minWageSample.rawStampTax)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-emerald-800">Asgari Ücret Damga Vergisi İstisnası</td>
                    <td className="py-2 px-3 text-emerald-700">7349 Sayılı Kanun gereği tam istisna</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      -{formatTRY(minWageSample.dvExemption)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/30">
                    <td className="py-2 px-3 font-bold text-emerald-900">Ödenecek Damga Vergisi</td>
                    <td className="py-2 px-3 text-emerald-700">Hesaplanan DV - DV İstisnası</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                      0,00 TL
                    </td>
                  </tr>
                  <tr className="bg-emerald-600 text-white font-black text-sm">
                    <td className="py-3 px-3 rounded-l-xl">NET ASGARİ ÜCRET (Ele Geçen)</td>
                    <td className="py-3 px-3 font-normal text-xs text-emerald-100">
                      Asgari ücretlinin banka hesabına yatan tutar
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base rounded-r-xl">
                      {formatTRY(minWageSample.netWage)}
                    </td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-black text-sm">
                    <td className="py-3 px-3 rounded-l-xl">TOPLAM İŞVEREN MALİYETİ (Standart Teşviksiz)</td>
                    <td className="py-3 px-3 font-normal text-xs text-slate-300">
                      Brüt + SGK İşveren (%{Number((draftSgk.employerSgkRate * 100).toFixed(1))}) + İşsizlik İşveren (%{Number((draftSgk.employerUnemploymentRate * 100).toFixed(1))})
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base text-emerald-400 rounded-r-xl">
                      {formatTRY(minWageSample.totalEmployerCost)}
                    </td>
                  </tr>
                  <tr className="bg-indigo-950 text-indigo-100 font-bold text-xs">
                    <td className="py-2.5 px-3 rounded-l-lg">İŞVEREN MALİYETİ (5510 S.K. %5 Hazine Teşvikli)</td>
                    <td className="py-2.5 px-3 text-indigo-300 text-[11px]">
                      Hazine indirimi düşüldükten sonraki indirimli maliyet
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-300 rounded-r-lg font-black text-sm">
                      {formatTRY(minWageSample5p.totalEmployerCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Interactive Live Payroll Calculator */}
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Canlı Bordro Hesaplama Simülatörü</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Herhangi bir brüt ücret girerek yukarıda yapılandırdığınız yasal parametrelerle anında hesaplayın
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-100/80 text-indigo-800">
                  Canlı Simülasyon
                </span>
              </div>
            </div>

            {/* Input Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brüt Ücret (TL)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₺
                  </span>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={simGrossWage}
                    onChange={(e) => setSimGrossWage(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hesaplama Dönemi / Ay
                </label>
                <select
                  value={simMonthIndex}
                  onChange={(e) => setSimMonthIndex(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                >
                  {draftMonthlyExemptions.map((m, idx) => (
                    <option key={m.month} value={idx}>
                      {idx + 1}. {m.month} (İstisna: {formatTRY(m.incomeTaxExemption)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  İşveren Teşvik İndirimi
                </label>
                <select
                  value={simDiscountType}
                  onChange={(e) => setSimDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                >
                  <option value="none">İndirimsiz Standart Prim (%{Number(((draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate) * 100).toFixed(1))})</option>
                  <option value="standard2p">Standart Teşvikli (%{Number(((draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate - draftSgk.employerDiscountRate) * 100).toFixed(1))})</option>
                  <option value="mfg5p">5510 S.K. %5 Hazine İndirimli (%{Number(((draftSgk.employerSgkRate + draftSgk.employerUnemploymentRate - draftSgk.employerMfgDiscountRate) * 100).toFixed(1))})</option>
                </select>
              </div>
            </div>

            {/* Calculated Breakdown Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left border-collapse bg-white rounded-xl border border-slate-200 shadow-2xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-2 px-3 rounded-l-lg">Bordro Kalemi</th>
                    <th className="py-2 px-3">Açıklama / Formül</th>
                    <th className="py-2 px-3 text-right rounded-r-lg">Hesaplanan Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800">Brüt Kazanç</td>
                    <td className="py-2 px-3 text-slate-500">Girilen aylık brüt ücret</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatTRY(simResult.validGross)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800">Prime Esas Kazanç (PEK)</td>
                    <td className="py-2 px-3 text-slate-500">
                      Taban: {formatTRY(draftSgk.monthlySgkFloor)} | Tavan: {formatTRY(draftSgk.monthlySgkCeiling)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                      {formatTRY(simResult.sgkBase)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">SGK İşçi Primi (%{Number((draftSgk.employeeSgkRate * 100).toFixed(1))})</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(simResult.sgkBase)} × %{Number((draftSgk.employeeSgkRate * 100).toFixed(1))}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600">
                      -{formatTRY(simResult.sgkEmployee)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">İşsizlik Sigortası Primi (%{Number((draftSgk.employeeUnemploymentRate * 100).toFixed(1))})</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(simResult.sgkBase)} × %{Number((draftSgk.employeeUnemploymentRate * 100).toFixed(1))}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600">
                      -{formatTRY(simResult.unempEmployee)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70">
                    <td className="py-2 px-3 font-bold text-slate-800">Gelir Vergisi Matrahı</td>
                    <td className="py-2 px-3 text-slate-500">Brüt - SGK İşçi Kesintileri</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatTRY(simResult.incomeTaxBase)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800">Hesaplanan Gelir Vergisi (Tarife 1. Dilim)</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(simResult.incomeTaxBase)} × %{Number(((draftWageTariff[0]?.rate || 0.15) * 100).toFixed(0))}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      {formatTRY(simResult.rawIncomeTax)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-emerald-800">Asgari Ücret Gelir Vergisi İstisnası</td>
                    <td className="py-2 px-3 text-emerald-700">Seçilen ayın ({draftMonthlyExemptions[simMonthIndex]?.month}) yasal istisnası</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      -{formatTRY(simResult.gvExemption)}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="py-2 px-3 font-bold text-amber-900">Ödenecek Gelir Vergisi</td>
                    <td className="py-2 px-3 text-slate-500">Hesaplanan GV - GV İstisnası</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                      {formatTRY(simResult.payableIncomeTax)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-slate-800">Hesaplanan Damga Vergisi</td>
                    <td className="py-2 px-3 text-slate-500">{formatTRY(simResult.validGross)} × %0,759</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      {formatTRY(simResult.rawStampTax)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-emerald-800">Asgari Ücret Damga Vergisi İstisnası</td>
                    <td className="py-2 px-3 text-emerald-700">{formatTRY(draftSgk.monthlySgkFloor)} × %0,759 yasal istisna</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      -{formatTRY(simResult.dvExemption)}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="py-2 px-3 font-bold text-amber-900">Ödenecek Damga Vergisi</td>
                    <td className="py-2 px-3 text-slate-500">Hesaplanan DV - İstisna Tutarı</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                      {formatTRY(simResult.payableStampTax)}
                    </td>
                  </tr>
                  <tr className="bg-rose-50/50 font-bold text-rose-950">
                    <td className="py-2.5 px-3">Toplam Çalışan Kesinti Tutarı</td>
                    <td className="py-2.5 px-3">SGK + İşsizlik + Ödenecek GV + Ödenecek DV</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      -{formatTRY(simResult.totalEmployeeDeductions)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-600 text-white font-black text-sm">
                    <td className="py-3 px-3 rounded-l-xl">NET ÜCRET (Ele Geçen)</td>
                    <td className="py-3 px-3 font-normal text-xs text-emerald-100">
                      Çalışana bankadan ödenecek net tutar
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base rounded-r-xl">
                      {formatTRY(simResult.netWage)}
                    </td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-black text-sm">
                    <td className="py-3 px-3 rounded-l-xl">TOPLAM İŞVEREN MALİYETİ</td>
                    <td className="py-3 px-3 font-normal text-xs text-slate-300">
                      Brüt + SGK İşveren (%{Number((simResult.employerSgkRateUsed * 100).toFixed(2))}) + İşsizlik İşveren (%{Number((draftSgk.employerUnemploymentRate * 100).toFixed(2))})
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base text-emerald-400 rounded-r-xl">
                      {formatTRY(simResult.totalEmployerCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
