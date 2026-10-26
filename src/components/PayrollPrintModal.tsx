import React, { useState, useMemo, useEffect } from "react";
import {
  XCircle,
  Printer,
  Download,
  Calendar,
  User,
  Users,
  Building2,
  FileText,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Layers,
  ChevronDown,
  FileCheck2,
} from "lucide-react";
import { Employee, CompanySettings, PayrollRecord, LeaveRequest, AdvanceRequest, LegalDeduction, PuantajCode } from "../types";
import { exportElementToPDF, printHtmlElement } from "../utils/exportUtils";
import { formatPayrollWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import { Zap, MessageCircle } from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { calculatePayrollRecordHelper, generateDefaultPuantaj, calculatePuantajStats, PUANTAJ_CODE_CONFIG, getTurkishOfficialHoliday, getHrCompanyTitle } from "../utils/puantajUtils";
import { MissingDayNotificationForm, DeductionAuthorizationForm, AdvanceRequestPrintForm } from "./PayrollSupplementalForms";
import { PayrollPuantajVisual } from "./PayrollPuantajVisual";

export type PayrollPrintMode =
  | "single_monthly_slip"    // Seçilen Personel - Seçilen Ay Ücret Pusulası
  | "single_annual_card"     // Seçilen Personel - Tüm Yıl (12 Ay) Kümülatif Bordro Kartı
  | "all_monthly_summary"    // Tüm Personeller - Seçilen Ay Bordro İcmal Tablosu
  | "all_annual_summary"     // Tüm Personeller - Tüm Yıl (12 Ay) Şirket Bordro İcmali
  | "all_monthly_slips";     // Tüm Personeller - Toplu Aylık Ücret Pusulaları (Sayfa Başına Personel)

interface PayrollPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  companySettings: CompanySettings;
  selectedMonth: string; // e.g. "2026-07"
  initialEmployeeId?: string;
  initialMode?: "month" | "year";
  initialOrientation?: "portrait" | "landscape";
  payrollCustomizations?: Record<string, any>;
  advanceRequests?: AdvanceRequest[];
  leaveRequests?: LeaveRequest[];
  legalDeductions?: LegalDeduction[];
  autoPrint?: boolean;
}

export const PayrollPrintModal: React.FC<PayrollPrintModalProps> = ({
  isOpen,
  onClose,
  employees,
  companySettings,
  selectedMonth,
  initialEmployeeId,
  initialMode = "month",
  initialOrientation = "landscape",
  payrollCustomizations = {},
  advanceRequests = [],
  leaveRequests = [],
  legalDeductions = [],
  autoPrint = false,
}) => {
  // Sorted employees list (Turkish alphabetical)
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
  }, [employees]);

  // Selected Scope & State
  const [scope, setScope] = useState<"single" | "all">(initialEmployeeId ? "single" : "all");
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialEmployeeId || (sortedEmployees.length > 0 ? sortedEmployees[0].id : "")
  );

  const [periodType, setPeriodType] = useState<"month" | "year">(initialMode);

  // Month & Year selection
  const [monthStr, setMonthStr] = useState<string>(selectedMonth || "2026-07");
  const currentYear = useMemo(() => {
    const p = (monthStr || selectedMonth || "2026-07").split("-");
    return parseInt(p[0], 10) || 2026;
  }, [monthStr, selectedMonth]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Print customization toggles
  const [showSignatures, setShowSignatures] = useState<boolean>(false);
  const [showEmployerCost, setShowEmployerCost] = useState<boolean>(true);
  const [showCompanyHeader, setShowCompanyHeader] = useState<boolean>(true);
  const [includeMissingDayForm, setIncludeMissingDayForm] = useState<boolean>(true);
  const [includeDeductionForm, setIncludeDeductionForm] = useState<boolean>(true);
  const [includeAdvanceForm, setIncludeAdvanceForm] = useState<boolean>(true);
  const pageOrientation: "landscape" = "landscape";
  const [includePuantaj, setIncludePuantaj] = useState<boolean>(true);

  // Active Employee
  const currentEmp = employees.find((e) => e.id === selectedEmpId) || sortedEmployees[0];

  // Helper date & currency formatters
  const formatTRY = (val: number | null | undefined): string => {
    const num = typeof val === "number" && !isNaN(val) ? val : Number(val || 0);
    return "₺" + num.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatTRDate = (dStr?: string) => {
    if (!dStr) return "—";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  // Convert numbers to Turkish words
  const numberToTurkishWords = (num: number): string => {
    if (!num || isNaN(num) || num <= 0) return "Sıfır Türk Lirası";
    const ones = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
    const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];

    const convertGroup = (n: number): string => {
      let res = "";
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const o = n % 10;
      if (h > 0) {
        if (h === 1) res += "Yüz ";
        else res += ones[h] + " Yüz ";
      }
      if (t > 0) res += tens[t] + " ";
      if (o > 0) res += ones[o] + " ";
      return res.trim();
    };

    const intPart = Math.floor(num);
    const kurus = Math.round((num - intPart) * 100);

    let result = "";
    const millions = Math.floor(intPart / 1000000);
    const thousands = Math.floor((intPart % 1000000) / 1000);
    const remainder = intPart % 1000;

    if (millions > 0) {
      result += convertGroup(millions) + " Milyon ";
    }
    if (thousands > 0) {
      if (thousands === 1) result += "Bin ";
      else result += convertGroup(thousands) + " Bin ";
    }
    if (remainder > 0) {
      result += convertGroup(remainder) + " ";
    }

    result = result.trim() + " Türk Lirası";
    if (kurus > 0) {
      result += " " + convertGroup(kurus) + " Kuruş";
    }
    return result.trim();
  };

  // Helper to calculate payroll for an employee for ANY given month
  const calculatePayrollForMonth = (emp: Employee, targetMonth: string): PayrollRecord => {
    const custom =
      (targetMonth === monthStr
        ? (payrollCustomizations[targetMonth]?.[emp.id] ||
           payrollCustomizations[`${targetMonth}_${emp.id}`] ||
           payrollCustomizations[emp.id])
        : (payrollCustomizations[targetMonth]?.[emp.id] ||
           payrollCustomizations[`${targetMonth}_${emp.id}`])) || {};

    return calculatePayrollRecordHelper(
      emp,
      targetMonth,
      custom,
      advanceRequests,
      leaveRequests,
      legalDeductions
    );
  };

  // Month names in Turkish
  const MONTH_NAMES_TR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // Helper to get formatted month label (e.g. "2026-07" -> "Temmuz 2026")
  const getMonthLabel = (mStr: string) => {
    const parts = mStr.split("-");
    if (parts.length !== 2) return mStr;
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${MONTH_NAMES_TR[mIdx] || parts[1]} ${parts[0]}`;
  };

  // Calculations for current selected mode
  // 1. Single Employee Selected Month
  const singleMonthlyRecord = useMemo(() => {
    if (!currentEmp) return null;
    return calculatePayrollForMonth(currentEmp, monthStr);
  }, [currentEmp, monthStr, payrollCustomizations, advanceRequests, leaveRequests, legalDeductions]);

  const currentEmployeePuantaj = useMemo(() => {
    if (!currentEmp) return undefined;
    return (
      payrollCustomizations[monthStr]?.[currentEmp.id]?.puantajDays ||
      payrollCustomizations[`${monthStr}_${currentEmp.id}`]?.puantajDays ||
      payrollCustomizations[currentEmp.id]?.puantajDays ||
      generateDefaultPuantaj(currentEmp.id, monthStr, leaveRequests)
    );
  }, [currentEmp, monthStr, payrollCustomizations, leaveRequests]);

  // Overtime calculations & breakdown for the singleMonthlyRecord
  const overtimeInfo = useMemo(() => {
    if (!singleMonthlyRecord) return null;

    const baseGross =
      singleMonthlyRecord.salaryType === "gross"
        ? singleMonthlyRecord.baseSalary
        : singleMonthlyRecord.baseSalary * 1.38;
    const hourlyGross = baseGross > 0 ? baseGross / 225 : 0;
    const dailyGross = baseGross > 0 ? baseGross / 30 : 0;

    let normalHours = singleMonthlyRecord.overtimeNormalHours || 0;
    let extensionHours = (singleMonthlyRecord as any).overtimeExtensionHours || 0;
    let weekendDays = (singleMonthlyRecord as any).overtimeWeekendDays || 0;
    let weekendHours = singleMonthlyRecord.overtimeWeekendHours || 0;
    let holidayDays = singleMonthlyRecord.overtimeHolidayDays || 0;
    let holidayHours = singleMonthlyRecord.overtimeHolidayHours || 0;
    let totalPay = singleMonthlyRecord.overtimePay || 0;

    // Eğer puantajdan henüz aktarılmamış saatler varsa puantaj günlerinden de kontrol et
    if (normalHours === 0 && extensionHours === 0 && weekendDays === 0 && weekendHours === 0 && holidayDays === 0 && holidayHours === 0 && currentEmployeePuantaj) {
      const parts = (monthStr || "").split("-");
      const y = parseInt(parts[0], 10) || 2026;
      const m = parseInt(parts[1], 10) || 7;
      const daysInMonth = new Date(y, m, 0).getDate();
      const stats = calculatePuantajStats(currentEmployeePuantaj, daysInMonth, baseGross);
      if (stats.calculatedOvertimePay > 0 || stats.totalOvertimeHours > 0 || stats.overtimeHolidayDays > 0 || (stats as any).overtimeWeekendDays > 0) {
        normalHours = stats.overtimeNormalHours;
        extensionHours = (stats as any).overtimeExtensionHours || 0;
        weekendDays = (stats as any).overtimeWeekendDays || 0;
        weekendHours = stats.overtimeWeekendHours;
        holidayHours = stats.overtimeHolidayHours;
        holidayDays = stats.overtimeHolidayDays;
        if (totalPay === 0) {
          totalPay = stats.calculatedOvertimePay;
        }
      }
    }

    // 1. Fazla Çalışma (%50 Zamlı): Saatlik ücret 1,5 katı
    const normalPay = Math.round(hourlyGross * 1.5 * normalHours);
    // 2. Fazla Sürelerle Çalışma (%25 Zamlı): 40-45 saat arası için 1,25 katı
    const extensionPay = Math.round(hourlyGross * 1.25 * extensionHours);
    // 3. Hafta Tatili Çalışması (Toplam 2,5 Yevmiye): Hak edilen 1 ücrete ek +1,5 yevmiye ilave ödenir
    const weekendDaysPay = Math.round(dailyGross * 1.5 * weekendDays);
    const weekendHoursPay = Math.round(hourlyGross * 1.5 * weekendHours);
    const weekendPay = weekendDaysPay + weekendHoursPay;
    // 4. Genel Tatil / Bayram Çalışması (%100 Zamlı): Normal ücrete ilave +1 tam yevmiye (toplam 2 yevmiye)
    const holidayHoursPay = Math.round(hourlyGross * 1.0 * holidayHours);
    const holidayDaysPay = Math.round(dailyGross * 1.0 * holidayDays);

    const calculatedSum = normalPay + extensionPay + weekendPay + holidayHoursPay + holidayDaysPay;
    if (totalPay === 0 && calculatedSum > 0) {
      totalPay = calculatedSum;
    }

    const hasOvertime = totalPay > 0 || normalHours > 0 || extensionHours > 0 || weekendDays > 0 || weekendHours > 0 || holidayDays > 0 || holidayHours > 0;

    return {
      hasOvertime,
      normalHours,
      extensionHours,
      weekendDays,
      weekendHours,
      holidayDays,
      holidayHours,
      normalPay,
      extensionPay,
      weekendPay,
      weekendDaysPay,
      weekendHoursPay,
      holidayHoursPay,
      holidayDaysPay,
      totalPay,
      totalHours: normalHours + extensionHours + weekendHours + holidayHours,
      hourlyGross,
      dailyGross,
    };
  }, [singleMonthlyRecord, currentEmployeePuantaj, monthStr]);

  const { daysInMonth, monthYearParts } = useMemo(() => {
    const parts = (monthStr || "2026-07").split("-");
    const y = parseInt(parts[0], 10) || 2026;
    const m = parseInt(parts[1], 10) || 7;
    return {
      daysInMonth: new Date(y, m, 0).getDate(),
      monthYearParts: { year: y, month: m },
    };
  }, [monthStr]);

  const puantajStats = useMemo(() => {
    if (!currentEmployeePuantaj) return null;
    return calculatePuantajStats(
      currentEmployeePuantaj,
      daysInMonth,
      singleMonthlyRecord?.grossSalary || singleMonthlyRecord?.baseSalary || 0
    );
  }, [currentEmployeePuantaj, daysInMonth, singleMonthlyRecord]);

  const missingPuantajCount = useMemo(() => {
    if (!currentEmployeePuantaj) return 0;
    return Object.values(currentEmployeePuantaj).filter(
      (d: any) => d && (d.code === "M" || d.code === "R" || d.code === "Üİ")
    ).length;
  }, [currentEmployeePuantaj]);

  const hasMissingDays = Boolean(
    singleMonthlyRecord &&
    ((singleMonthlyRecord.unpaidLeaveDays || 0) > 0 || missingPuantajCount > 0)
  );
  const hasAdvances = Boolean(singleMonthlyRecord && (singleMonthlyRecord.advanceDeduction || 0) > 0);
  const hasDeductionsOrAdvances = Boolean(
    singleMonthlyRecord &&
    ((singleMonthlyRecord.advanceDeduction || 0) > 0 ||
     (singleMonthlyRecord.executionDeduction || 0) > 0 ||
     (singleMonthlyRecord.alimonyDeduction || 0) > 0 ||
     (singleMonthlyRecord.besDeduction || 0) > 0 ||
     (singleMonthlyRecord.otherDeductions || 0) > 0)
  );

  const hasAnySupplementalForm = Boolean(
    (hasMissingDays && includeMissingDayForm) ||
    (hasAdvances && includeAdvanceForm) ||
    (hasDeductionsOrAdvances && includeDeductionForm)
  );

  // 2. Single Employee 12 Months (Entire Year)
  const singleAnnualRecords = useMemo(() => {
    if (!currentEmp) return [];
    const records: { monthIdx: number; monthName: string; monthKey: string; record: PayrollRecord; cumTaxBase: number }[] = [];
    let cumulativeTaxBase = 0;

    for (let m = 1; m <= 12; m++) {
      const mStrKey = `${selectedYear}-${String(m).padStart(2, "0")}`;
      const rec = calculatePayrollForMonth(currentEmp, mStrKey);
      cumulativeTaxBase += rec.incomeTaxBase;
      records.push({
        monthIdx: m,
        monthName: MONTH_NAMES_TR[m - 1],
        monthKey: mStrKey,
        record: rec,
        cumTaxBase: cumulativeTaxBase,
      });
    }
    return records;
  }, [currentEmp, selectedYear, payrollCustomizations, advanceRequests, leaveRequests, legalDeductions]);

  // 3. All Employees Selected Month
  const allMonthlyRecords = useMemo(() => {
    return sortedEmployees.map((emp) => calculatePayrollForMonth(emp, monthStr));
  }, [sortedEmployees, monthStr, payrollCustomizations, advanceRequests, leaveRequests, legalDeductions]);

  // 4. All Employees 12 Months Summary (Company Wide Annual)
  const allAnnualMonthlySummaries = useMemo(() => {
    const list: {
      monthIdx: number;
      monthName: string;
      monthKey: string;
      totalGross: number;
      totalSgkEmp: number;
      totalTaxBase: number;
      totalIncomeTax: number;
      totalStampTax: number;
      totalAdvance: number;
      totalNet: number;
      totalEmployerCost: number;
      employeeCount: number;
    }[] = [];

    for (let m = 1; m <= 12; m++) {
      const mStrKey = `${selectedYear}-${String(m).padStart(2, "0")}`;
      const recs = sortedEmployees.map((emp) => calculatePayrollForMonth(emp, mStrKey));
      list.push({
        monthIdx: m,
        monthName: MONTH_NAMES_TR[m - 1],
        monthKey: mStrKey,
        totalGross: recs.reduce((sum, r) => sum + r.grossSalary, 0),
        totalSgkEmp: recs.reduce((sum, r) => sum + (r.sgkEmployeeShare + r.unemploymentEmployeeShare), 0),
        totalTaxBase: recs.reduce((sum, r) => sum + r.incomeTaxBase, 0),
        totalIncomeTax: recs.reduce((sum, r) => sum + r.incomeTax, 0),
        totalStampTax: recs.reduce((sum, r) => sum + r.stampTax, 0),
        totalAdvance: recs.reduce((sum, r) => sum + (r.advanceDeduction || 0), 0),
        totalNet: recs.reduce((sum, r) => sum + r.payableNetSalary, 0),
        totalEmployerCost: recs.reduce((sum, r) => sum + r.totalEmployerCost, 0),
        employeeCount: recs.length,
      });
    }
    return list;
  }, [sortedEmployees, selectedYear, payrollCustomizations, advanceRequests, leaveRequests, legalDeductions]);

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [activePrintSection, setActivePrintSection] = useState<"all" | "slip_only" | "forms_only">("all");

  // Print execution handler with section filtering (strictly A4 landscape)
  const handlePrint = (
    mode: "all" | "slip_only" | "forms_only" = "all"
  ) => {
    setIsPrintMenuOpen(false);
    setActivePrintSection(mode);
    setIncludePuantaj(true);
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn("Bordro yazdırma hatası:", err);
      }
    }, 100);
  };

  // Auto-print effect when triggered from "Sayfadan Ayrılmadan Yazdır"
  useEffect(() => {
    if (isOpen && autoPrint) {
      const timer = setTimeout(() => {
        handlePrint("all");
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  const handleDownloadPDF = async (
    mode: "all" | "slip_only" | "forms_only" = "all"
  ) => {
    setIsDownloadingPDF(true);
    setIsPdfMenuOpen(false);
    setActivePrintSection(mode);
    setIncludePuantaj(true);
    // Yield to allow React to update DOM visibility classes matching the active mode
    await new Promise((resolve) => setTimeout(resolve, 80));
    try {
      let fileName = "Bordro_Raporu.pdf";
      if (scope === "single" && currentEmp) {
        const sanitizedName = String(currentEmp.fullName || (currentEmp as any).name || "Personel").trim().replace(/\s+/g, "_");
        if (mode === "slip_only") {
          fileName = periodType === "month"
            ? `Bordro_Pusulasi_${sanitizedName}_${monthStr}.pdf`
            : `Yillik_Bordro_Karti_${sanitizedName}_${selectedYear}.pdf`;
        } else if (mode === "forms_only") {
          fileName = `Ek_Formlar_${sanitizedName}_${monthStr}.pdf`;
        } else {
          fileName = periodType === "month"
            ? `Bordro_ve_Ek_Formlar_${sanitizedName}_${monthStr}.pdf`
            : `Yillik_Bordro_Karti_${sanitizedName}_${selectedYear}.pdf`;
        }
      } else {
        fileName = periodType === "month"
          ? `Sirket_Bordro_Icmali_${monthStr}.pdf`
          : `Yillik_Sirket_Bordro_Icmali_${selectedYear}.pdf`;
      }
      await exportElementToPDF("printable-payroll-area", fileName, {
        orientation: "l",
        margin: 3,
        pageMode: mode,
        fitToSinglePage: true,
        scale: 2,
      });
    } catch (err) {
      console.error("Bordro PDF İndirme Hatası:", err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (!isOpen) return null;

  return (
    <DetailPageLayout
      title="Bordro & Maaş Pusulası Yazdırma ve Önizleme"
      subtitle="Seçilen ay veya tüm yıl (12 ay) kümülatif bordrolarını resmi şablonda önizleyin ve yazdırın"
      breadcrumbs={[
        { label: "İnsan Kaynakları", onClick: onClose },
        { label: "Bordro Yazdırma & Önizleme", active: true },
      ]}
      onBack={onClose}
      fullWidth={true}
      statusBadge={
        <span className="text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl">
          RESMİ FORMAT (4857 S.K.)
        </span>
      }
      headerIcon={<Printer className="w-5 h-5 text-purple-600" />}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {scope === "single" && currentEmp && (
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
              <span>WhatsApp ile Gönder</span>
            </button>
          )}

          {/* PDF DOWNLOAD BUTTON & SPLIT DROPDOWN */}
          <div className="relative inline-flex items-center rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => handleDownloadPDF("all")}
              disabled={isDownloadingPDF}
              className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 rounded-l-xl"
              title="Bordroyu A4 Yatay PDF olarak indir"
            >
              <Download className="w-4 h-4 text-purple-200" />
              <span className="hidden sm:inline">
                {isDownloadingPDF ? "PDF Hazırlanıyor..." : "PDF İndir (A4 Yan)"}
              </span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPdfMenuOpen((prev) => !prev)}
              disabled={isDownloadingPDF}
              className="bg-purple-700 hover:bg-purple-600 text-white px-2 py-2.5 rounded-r-xl border-l border-purple-500/50 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="A4 Yatay PDF indirme seçenekleri"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPdfMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu for PDF */}
            {isPdfMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-xl shadow-xl z-50 py-1.5 text-xs text-slate-800 dark:text-slate-100 animate-fadeIn"
                onMouseLeave={() => setIsPdfMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                  A4 Yatay PDF Seçenekleri
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPDF("all")}
                  className="w-full text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>A4 Yan PDF (Puantaj Görseli Dahil)</span>
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-extrabold">Resmi Format</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Yatay tam sayfa, puantaj takvimi ve bordro</div>
                  </div>
                </button>
                {hasAnySupplementalForm && (
                  <>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF("slip_only")}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">Yalnızca Bordro Pusulası</div>
                        <div className="text-[10px] text-slate-500">Tek sayfa maaş hesap pusulası (PDF)</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPDF("forms_only")}
                      className="w-full text-left px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Layers className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <div className="font-bold">Yalnızca Ek Formlar</div>
                        <div className="text-[10px] text-slate-500">SGK Eksik Gün / Avans Formları (PDF)</div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* PRINT BUTTON & SPLIT DROPDOWN */}
          <div className="relative inline-flex items-center rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => handlePrint("all")}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 transition-all flex items-center gap-2 cursor-pointer rounded-l-xl"
              title="Bordroyu yazdır (A4 Yan)"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır (A4 Yan)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintMenuOpen((prev) => !prev)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-2.5 rounded-r-xl border-l border-emerald-400/50 transition-all cursor-pointer flex items-center justify-center"
              title="A4 Yatay yazdırma seçenekleri"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPrintMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu for Print */}
            {isPrintMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-xl z-50 py-1.5 text-xs text-slate-800 dark:text-slate-100 animate-fadeIn"
                onMouseLeave={() => setIsPrintMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                  A4 Yatay Yazdırma Seçenekleri
                </div>
                <button
                  type="button"
                  onClick={() => handlePrint("all")}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🖨️ A4 Yan Yazdır (Puantaj Görseli ile)</span>
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-extrabold">Resmi Format</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Yatay tam sayfa, puantaj takvimi ve bordro</div>
                  </div>
                </button>
                {hasAnySupplementalForm && (
                  <>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => handlePrint("slip_only")}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">Yalnızca Bordro Pusulası</div>
                        <div className="text-[10px] text-slate-500">Tek sayfa maaş hesap pusulası</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrint("forms_only")}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Layers className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <div className="font-bold">Yalnızca Ek Formlar</div>
                        <div className="text-[10px] text-slate-500">SGK Eksik Gün / Avans Formları</div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Geri Dön
          </button>
        </div>
      }
    >
      <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-purple-200/80 print:max-w-none print:w-full print:border-none print:shadow-none print:overflow-visible print:p-0 print:m-0">
        {/* MODAL CONTROLS & HEADER (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-purple-100 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white flex flex-col gap-3 shrink-0 print:hidden">
          {/* FILTER & OPTION BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-white/10 text-xs">
            {/* 1. Kapsam (Personel vs Tüm Şirket) */}
            <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="font-semibold text-purple-200 text-[11px]">Kapsam:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setScope("single")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    scope === "single"
                      ? "bg-white text-purple-950 shadow-xs"
                      : "text-purple-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <User className="w-3 h-3 inline mr-1" />
                  Tek Personel
                </button>
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    scope === "all"
                      ? "bg-white text-purple-950 shadow-xs"
                      : "text-purple-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Users className="w-3 h-3 inline mr-1" />
                  Tüm Şirket
                </button>
              </div>
            </div>

            {/* 2. Dönem Türü (Seçilen Ay vs Tüm Yıl) */}
            <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="font-semibold text-purple-200 text-[11px]">Dönem:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPeriodType("month")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    periodType === "month"
                      ? "bg-purple-400 text-purple-950 shadow-xs"
                      : "text-purple-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Seçilen Ay
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType("year")}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    periodType === "year"
                      ? "bg-purple-400 text-purple-950 shadow-xs"
                      : "text-purple-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Layers className="w-3 h-3 inline mr-1" />
                  Tüm Yıl
                </button>
              </div>
            </div>

            {/* 3. Ay / Yıl Seçicisi */}
            <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 flex items-center justify-between gap-2">
              <span className="font-semibold text-purple-200 text-[11px] shrink-0">
                {periodType === "month" ? "Ay:" : "Yıl:"}
              </span>
              {periodType === "month" ? (
                <input
                  type="month"
                  value={monthStr}
                  onChange={(e) => setMonthStr(e.target.value)}
                  className="bg-purple-950/80 text-white font-bold px-2 py-1 rounded-lg border border-purple-400/40 text-xs w-full focus:outline-none"
                />
              ) : (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-purple-950/80 text-white font-bold px-2 py-1 rounded-lg border border-purple-400/40 text-xs w-full focus:outline-none cursor-pointer"
                >
                  <option value={2026}>2026 Yılı</option>
                  <option value={2025}>2025 Yılı</option>
                  <option value={2024}>2024 Yılı</option>
                  <option value={2027}>2027 Yılı</option>
                </select>
              )}
            </div>

            {/* 4. Personel Seçici (Tek Personel Modunda) veya Toplu Seçenek */}
            {scope === "single" ? (
              <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                <span className="font-semibold text-purple-200 text-[11px] shrink-0">Personel:</span>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="bg-purple-950/80 text-white font-bold px-2 py-1 rounded-lg border border-purple-400/40 text-xs w-full focus:outline-none cursor-pointer"
                >
                  {sortedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="font-semibold text-purple-200 text-[11px]">Şirket Personeli:</span>
                <span className="font-bold text-white bg-purple-600/60 px-2 py-0.5 rounded-lg border border-purple-400/30">
                  {sortedEmployees.length} Çalışan
                </span>
              </div>
            )}

            {/* 5. Sayfa Formatı: Sabit A4 Yatay Format */}
            <div className="bg-white/10 backdrop-blur-xs p-2 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="font-semibold text-purple-200 text-[11px] shrink-0">Sayfa Formatı:</span>
              <span className="px-2.5 py-1 rounded-lg font-black text-[11px] bg-amber-400 text-purple-950 shadow-xs ring-2 ring-amber-300/60 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                A4 Yatay (Resmi Format)
              </span>
            </div>
          </div>

          {/* Quick Display Options Toggles */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-purple-200 pt-1">
            {/* Puantaj Görseli Toggle */}
            <label className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded-lg border transition-colors ${
              includePuantaj
                ? "bg-amber-950/70 border-amber-400/50 text-amber-200 font-bold"
                : "bg-white/5 border-white/10 text-purple-200 hover:text-white"
            }`}>
              <input
                type="checkbox"
                checked={includePuantaj}
                onChange={(e) => setIncludePuantaj(e.target.checked)}
                className="rounded text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span>
                🗓️ Puantaj Görseli & Günlük Çizelge
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showCompanyHeader}
                onChange={(e) => setShowCompanyHeader(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>Şirket Resmi Başlığı</span>
            </label>

            {scope === "single" && periodType === "month" && hasMissingDays && (
              <label className="flex items-center gap-1.5 cursor-pointer bg-rose-950/60 hover:bg-rose-900/80 px-2 py-0.5 rounded-lg border border-rose-400/40 text-rose-200 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={includeMissingDayForm}
                  onChange={(e) => setIncludeMissingDayForm(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-bold">
                  📄 SGK Eksik Gün Bildirim Formu Eki ({singleMonthlyRecord?.unpaidLeaveDays} Gün)
                </span>
              </label>
            )}

            {scope === "single" && periodType === "month" && hasAdvances && (
              <label className="flex items-center gap-1.5 cursor-pointer bg-amber-950/60 hover:bg-amber-900/80 px-2 py-0.5 rounded-lg border border-amber-400/40 text-amber-200 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={includeAdvanceForm}
                  onChange={(e) => setIncludeAdvanceForm(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-bold">
                  💳 Personel Avans Talep & Mahsup Formu ({formatTRY(singleMonthlyRecord?.advanceDeduction)})
                </span>
              </label>
            )}

            {scope === "single" && periodType === "month" && hasDeductionsOrAdvances && (
              <label className="flex items-center gap-1.5 cursor-pointer bg-purple-950/60 hover:bg-purple-900/80 px-2 py-0.5 rounded-lg border border-purple-400/40 text-purple-200 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={includeDeductionForm}
                  onChange={(e) => setIncludeDeductionForm(e.target.checked)}
                  className="rounded text-purple-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-bold">
                  📋 Kesinti ve Mahsup Muvafakatnamesi
                </span>
              </label>
            )}
          </div>
        </div>

        {/* PRINTABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 bg-slate-100/70 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          {/* Print Style Injector for standard A4 landscape formatting */}
          <style>{`
            @media print {
              @page {
                size: A4 landscape;
                margin: 3mm 3mm 3mm 3mm;
              }
              html, body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                height: auto !important;
                min-height: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              header, nav, aside, .no-print, [data-no-print="true"] {
                display: none !important;
              }
              #printable-payroll-area {
                visibility: visible !important;
                display: block !important;
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              .payroll-main-slip-a4 {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-before: avoid !important;
                break-before: avoid !important;
                margin: 0 !important;
                padding: 1.5mm 2.5mm !important;
                font-size: 8.5px !important;
                line-height: 1.3 !important;
              }
              .payroll-main-slip-a4.landscape-mode {
                font-size: 8.5px !important;
                padding: 1.5mm 2.5mm !important;
              }
              .payroll-main-slip-a4.landscape-mode .payroll-company-header {
                padding-bottom: 2px !important;
                margin-bottom: 2.5px !important;
              }
              .payroll-main-slip-a4.landscape-mode .payroll-company-header h1 {
                font-size: 13px !important;
                font-weight: bold !important;
                line-height: 1.2 !important;
                text-align: center !important;
              }
              .payroll-main-slip-a4.landscape-mode .payroll-company-header p {
                font-size: 8px !important;
                line-height: 1.2 !important;
              }
              .payroll-main-slip-a4.landscape-mode .payroll-employee-card {
                padding: 2px 4px !important;
                margin-bottom: 2.5px !important;
                gap: 2px !important;
                font-size: 8px !important;
                line-height: 1.25 !important;
              }
              .payroll-main-slip-a4.landscape-mode .payroll-employee-card span {
                line-height: 1.25 !important;
              }
              .payroll-main-slip-a4.landscape-mode table {
                font-size: 8px !important;
                line-height: 1.35 !important;
              }
              .payroll-main-slip-a4.landscape-mode table td,
              .payroll-main-slip-a4.landscape-mode table th {
                padding: 1.5px 3px !important;
                line-height: 1.35 !important;
                vertical-align: middle !important;
              }
              .payroll-main-slip-a4.landscape-mode .puantaj-visual-container {
                margin-bottom: 2.5px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                overflow: visible !important;
              }
              .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table {
                table-layout: fixed !important;
                width: 100% !important;
                border-collapse: collapse !important;
              }
              .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table th,
              .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table td {
                padding: 2px 0.5px !important;
                font-size: 7.5px !important;
                line-height: 1.25 !important;
                height: auto !important;
                vertical-align: middle !important;
                overflow: visible !important;
              }
              .payroll-main-slip-a4.landscape-mode .puantaj-visual-container table tr {
                height: auto !important;
              }
              .payroll-main-slip-a4.landscape-mode .net-salary-banner {
                padding: 3px 6px !important;
              }
              .payroll-main-slip-a4.has-supplemental {
                page-break-after: always !important;
                break-after: page !important;
              }
              .payroll-supplemental-form-a4 {
                width: 100% !important;
                box-sizing: border-box !important;
                page-break-before: always !important;
                break-before: page !important;
                page-break-after: auto !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin-top: 0 !important;
                padding: 4px 6px !important;
              }
              .page-break-always {
                page-break-after: always !important;
                break-after: page !important;
              }
              .page-break-before {
                page-break-before: always !important;
                break-before: page !important;
              }
            }
          `}</style>

          <div
            id="printable-payroll-area"
            className="w-full max-w-none space-y-4 print:max-w-none print:w-full print:space-y-0"
          >
            {/* ========================================================= */}
            {/* CASE 1: TEK PERSONEL - SEÇİLEN AY ÜCRET HESAP PUSULASI     */}
            {/* ========================================================= */}
            {scope === "single" && periodType === "month" && currentEmp && singleMonthlyRecord && (
              <>
                <div
                  className={`w-full bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0 print:m-0 payroll-main-slip-a4 landscape-mode ${
                    hasAnySupplementalForm
                      ? "has-supplemental page-break-always"
                      : ""
                  } ${activePrintSection === "forms_only" ? "print:hidden" : ""}`}
                >
                {/* Şirket Başlığı (Kompakt ve A4 Uyumlu) */}
                {showCompanyHeader && (
                  <div className="payroll-company-header border-b-2 border-slate-900 pb-1.5 mb-2 print:pb-1 print:mb-1 flex flex-col sm:flex-row items-start justify-between gap-2 print:gap-1">
                    <div className="flex-1 min-w-0">
                    {/* Şirket Kaşesi Formatında Bilgi Alanı */}
                    <div className="max-w-md border-2 border-dashed border-slate-700/80 rounded-lg p-1.5 sm:p-2 bg-slate-50/60 shadow-2xs font-mono leading-tight">
                      <h1 className="text-[16px] font-bold text-center uppercase text-slate-950 tracking-tight leading-snug font-sans border-b border-slate-400 pb-0.5 mb-1">
                        {getHrCompanyTitle(companySettings)}
                      </h1>
                      <p className="text-[9px] text-slate-700 font-medium leading-tight line-clamp-2">
                        {companySettings.address} {companySettings.district ? `${companySettings.district} / ` : ""}{companySettings.city}
                      </p>
                      <div className="text-[8.5px] text-slate-700 flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 font-semibold">
                        <span><strong>V.D. / VKN:</strong> {companySettings.taxOffice || "—"} / {companySettings.taxNumber || "—"}</span>
                        <span><strong>SGK Sicil:</strong> {companySettings.sgkCredentials?.workplaceRegistrationNo || "2.8470.01.01.1029384.034.01-12"}</span>
                        {companySettings.mersisNo && <span><strong>MERSİS:</strong> {companySettings.mersisNo}</span>}
                      </div>
                    </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-block bg-slate-900 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                        Ücret Hesap Pusulası
                      </div>
                      <div className="text-[10px] font-black text-purple-950 mt-0.5">
                        Bordro Dönemi: {getMonthLabel(monthStr)}
                      </div>
                      <div className="text-[8.5px] text-slate-500">
                        Düzenleme Tarihi: {formatTRDate(new Date().toISOString().split("T")[0])}
                      </div>
                    </div>
                  </div>
                )}

                {/* Personel Bilgi Kartı - Her Koşulda Tam ve Kesintisiz Görünüm */}
                <div className="payroll-employee-card w-full block shrink-0 break-inside-avoid grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-300 text-[10.5px] mb-2 print:p-1.5 print:mb-1 print:gap-1 print:break-inside-avoid print:visible print:opacity-100 overflow-visible">
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">Personel Ad Soyad</span>
                    <span className="font-extrabold text-slate-950 text-xs block break-words">{currentEmp.fullName}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">T.C. Kimlik No</span>
                    <span className="font-mono font-bold text-slate-900 block">{currentEmp.tckn || "—"}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">Departman & Görev</span>
                    <span className="font-semibold text-slate-800 block break-words">{currentEmp.department} · {currentEmp.title}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">İşe Giriş Tarihi</span>
                    <span className="font-semibold text-slate-800 block">{formatTRDate(currentEmp.startDate)}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">SGK Meslek Kodu</span>
                    <span className="font-mono text-slate-700 block">{currentEmp.sgkOccupationCode || "5223.01"}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">Ücret Sözleşme Tipi</span>
                    <span className="font-bold text-purple-900 uppercase inline-block">
                      {singleMonthlyRecord.salaryType === "gross" ? "Brüt Ücret" : "Net Ücret"} ({formatTRY(singleMonthlyRecord.baseSalary)})
                    </span>
                    {singleMonthlyRecord.isRetired && (
                      <span className="inline-block ml-1 px-1 py-0.2 bg-blue-100 text-blue-800 text-[8.5px] font-extrabold rounded">
                        SGDP
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">Şube / Depo</span>
                    <span className="text-slate-800 block break-words">{currentEmp.branchName || currentEmp.warehouseName || "Merkez"}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase block whitespace-nowrap">Banka & IBAN</span>
                    <span className="font-mono text-[9px] sm:text-[9.5px] text-slate-700 break-all block" title={currentEmp.iban}>
                      {currentEmp.iban ? `${currentEmp.bankName ? currentEmp.bankName + ": " : ""}${currentEmp.iban}` : "Elden / Nakit"}
                    </span>
                  </div>
                </div>

                {/* PUANTAJ GÖRSELİ VE RESMİ ÇALIŞMA ÇİZELGESİ */}
                {includePuantaj && currentEmp && (
                  <PayrollPuantajVisual
                    puantajDays={currentEmployeePuantaj}
                    monthStr={monthStr}
                    employee={currentEmp}
                    puantajStats={puantajStats}
                    overtimeInfo={overtimeInfo}
                    isLandscape={pageOrientation === "landscape"}
                    hideKpiBadges={false}
                  />
                )}

                {/* Kazançlar & Kesintiler 2 Sütunlu Detay Tablosu */}
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-2.5 sm:gap-3 mb-2.5 print:gap-2 print:mb-1.5 items-start">
                  {/* Sol Sütun: Kazançlar & Ek Ödemeler */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-800 text-white px-3 py-1.5 font-bold text-xs flex justify-between items-center print:py-1">
                      <span className="tracking-wide uppercase font-black text-[11px]">KAZANÇLAR & HAKEDİŞLER</span>
                      <span className="text-[10px] font-medium text-slate-300">Tutar (₺)</span>
                    </div>

                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                            <div className="font-semibold">Temel Brüt Maaş Hakedişi:</div>
                            <div className="text-[9.5px] print:text-[7.5px] text-slate-500 font-medium leading-normal mt-0.5">
                              ↳ Fiili Çalışma: {puantajStats?.countN ?? 22} Gün · Hafta Tatili: {puantajStats?.countHT ?? 8} Gün
                              {(puantajStats?.countRT || 0) > 0 ? ` · Resmi Tatil: ${puantajStats.countRT} Gün` : ""}
                              {((puantajStats?.countYI || 0) + (puantajStats?.countUI || 0) + (puantajStats?.countDI || 0)) > 0 ? ` · İzin: ${(puantajStats?.countYI || 0) + (puantajStats?.countUI || 0) + (puantajStats?.countDI || 0)} Gün` : ""}
                            </div>
                          </td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-slate-900 align-top">
                            {formatTRY(singleMonthlyRecord.salaryType === "gross" ? singleMonthlyRecord.baseSalary : singleMonthlyRecord.baseSalary * 1.38)}
                          </td>
                        </tr>
                        {Boolean(singleMonthlyRecord.bonusAmount) && (
                          <tr className="border-b border-slate-200 bg-emerald-50/50">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-emerald-800 font-semibold">+ Prim / İkramiye:</td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-emerald-900">+{formatTRY(singleMonthlyRecord.bonusAmount)}</td>
                          </tr>
                        )}
                        {/* FAZLA MESAİ VE ÇALIŞMA HAKEDİŞLERİ */}
                        {overtimeInfo?.hasOvertime && (
                          <>
                            {overtimeInfo.normalHours > 0 && (
                              <tr className="border-b border-slate-200 bg-purple-50/40">
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-purple-950 font-semibold">
                                  <span>+ Fazla Çalışma (Haftalık 45s Üzeri / %50 Zamlı):</span>
                                  <span className="text-[10px] print:text-[7.5px] text-purple-700 font-normal block mt-0.5">
                                    {overtimeInfo.normalHours} Saat × {formatTRY(overtimeInfo.hourlyGross * 1.5)} / saat
                                  </span>
                                </td>
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-purple-950 align-top">
                                  +{formatTRY(overtimeInfo.normalPay > 0 ? overtimeInfo.normalPay : overtimeInfo.totalPay)}
                                </td>
                              </tr>
                            )}
                            {(overtimeInfo.extensionHours || 0) > 0 && (
                              <tr className="border-b border-slate-200 bg-teal-50/40">
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-teal-950 font-semibold">
                                  <span>+ Fazla Sürelerle Çalışma (%25 Zamlı):</span>
                                  <span className="text-[10px] print:text-[7.5px] text-teal-700 font-normal block mt-0.5">
                                    {overtimeInfo.extensionHours} Saat × {formatTRY(overtimeInfo.hourlyGross * 1.25)} / saat
                                  </span>
                                </td>
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-teal-950 align-top">
                                  +{formatTRY(overtimeInfo.extensionPay || 0)}
                                </td>
                              </tr>
                            )}
                            {((overtimeInfo.weekendDays || 0) > 0 || (overtimeInfo.weekendHours || 0) > 0) && (
                              <tr className="border-b border-slate-200 bg-purple-50/40">
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-purple-950 font-semibold">
                                  <span>+ Hafta Tatili Çalışması (Toplam 2,5 Yevmiye / +1,5 Ek):</span>
                                  <span className="text-[10px] print:text-[7.5px] text-purple-700 font-normal block mt-0.5">
                                    {overtimeInfo.weekendDays ? `${overtimeInfo.weekendDays} Gün (× ${formatTRY(overtimeInfo.dailyGross * 1.5)}) ` : ""}
                                    {overtimeInfo.weekendHours ? `${overtimeInfo.weekendHours} Saat (× ${formatTRY(overtimeInfo.hourlyGross * 1.5)})` : ""}
                                  </span>
                                </td>
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-purple-950 align-top">
                                  +{formatTRY(overtimeInfo.weekendPay)}
                                </td>
                              </tr>
                            )}
                            {overtimeInfo.holidayDays > 0 && (
                              <tr className="border-b border-slate-200 bg-purple-50/40">
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-purple-950 font-semibold">
                                  <span>+ Genel Tatil / Bayram Günlük Çalışma (%100 Zamlı / Toplam 2 Yevmiye):</span>
                                  <span className="text-[10px] print:text-[7.5px] text-purple-700 font-normal block mt-0.5">
                                    {overtimeInfo.holidayDays} Gün × {formatTRY(overtimeInfo.dailyGross * 1.0)} / gün
                                  </span>
                                </td>
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-purple-950 align-top">
                                  +{formatTRY(overtimeInfo.holidayDaysPay)}
                                </td>
                              </tr>
                            )}
                            {overtimeInfo.holidayHours > 0 && (
                              <tr className="border-b border-slate-200 bg-purple-50/40">
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-purple-950 font-semibold">
                                  <span>+ Genel Tatil / Bayram Saatlik Çalışma (%100 Zamlı):</span>
                                  <span className="text-[10px] print:text-[7.5px] text-purple-700 font-normal block mt-0.5">
                                    {overtimeInfo.holidayHours} Saat × {formatTRY(overtimeInfo.hourlyGross * 1.0)} / saat
                                  </span>
                                </td>
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-purple-950 align-top">
                                  +{formatTRY(overtimeInfo.holidayHoursPay)}
                                </td>
                              </tr>
                            )}
                            {overtimeInfo.normalHours === 0 &&
                              (overtimeInfo.extensionHours || 0) === 0 &&
                              (overtimeInfo.weekendDays || 0) === 0 &&
                              overtimeInfo.weekendHours === 0 &&
                              overtimeInfo.holidayDays === 0 &&
                              overtimeInfo.holidayHours === 0 &&
                              overtimeInfo.totalPay > 0 && (
                                <tr className="border-b border-slate-200 bg-purple-50/50">
                                  <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-purple-900 font-semibold">
                                    + Fazla Mesai Hakedişi:
                                  </td>
                                  <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-purple-950">
                                    +{formatTRY(overtimeInfo.totalPay)}
                                  </td>
                                </tr>
                              )}
                            {[
                              overtimeInfo.normalHours > 0,
                              (overtimeInfo.extensionHours || 0) > 0,
                              ((overtimeInfo.weekendDays || 0) > 0 || overtimeInfo.weekendHours > 0),
                              overtimeInfo.holidayDays > 0,
                              overtimeInfo.holidayHours > 0,
                            ].filter(Boolean).length > 1 && (
                              <tr className="border-b border-slate-200 bg-purple-100/60 text-xs font-bold">
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-purple-950">
                                  ↳ Toplam Fazla Mesai ({overtimeInfo.totalHours} Saat{((overtimeInfo.holidayDays || 0) + (overtimeInfo.weekendDays || 0)) > 0 ? ` + ${(overtimeInfo.holidayDays || 0) + (overtimeInfo.weekendDays || 0)} Gün` : ""}):
                                </td>
                                <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-black text-purple-950">
                                  +{formatTRY(overtimeInfo.totalPay)}
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                        {Boolean(singleMonthlyRecord.foodAllowance) && (
                          <tr className="border-b border-slate-200">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">+ Yemek Yardımı:</td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-semibold text-slate-900">+{formatTRY(singleMonthlyRecord.foodAllowance)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.roadAllowance) && (
                          <tr className="border-b border-slate-200">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">+ Yol / Ulaşım Yardımı:</td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-semibold text-slate-900">+{formatTRY(singleMonthlyRecord.roadAllowance)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.customPayments && singleMonthlyRecord.customPayments.length > 0) &&
                          singleMonthlyRecord.customPayments.map((cp) => (
                            <tr key={cp.id} className="border-b border-slate-200">
                              <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">+ {cp.name} (Ek Ödeme):</td>
                              <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-semibold text-slate-900">+{formatTRY(cp.amount)}</td>
                            </tr>
                          ))}
                        {Boolean(!singleMonthlyRecord.customPayments?.length && singleMonthlyRecord.customPaymentsTotal) && (
                          <tr className="border-b border-slate-200">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">+ Diğer Ek Ödemeler:</td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-semibold text-slate-900">+{formatTRY(singleMonthlyRecord.customPaymentsTotal)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.unpaidLeaveDays) && (
                          <tr className="border-b border-slate-200 bg-rose-50/60 text-rose-900">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5">
                              - Eksik Gün / Ücretsiz İzin ({singleMonthlyRecord.unpaidLeaveDays} Gün):
                            </td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-rose-900">
                              -{formatTRY(singleMonthlyRecord.unpaidLeaveDeduction || 0)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                          <td className="py-1.5 px-2 print:py-1 print:px-1.5">TOPLAM BRÜT KAZANÇ (SPEK):</td>
                          <td className="py-1.5 px-2 print:py-1 print:px-1.5 text-right text-xs sm:text-sm font-black">
                            {formatTRY(
                              singleMonthlyRecord.overtimePay
                                ? singleMonthlyRecord.grossSalary
                                : singleMonthlyRecord.grossSalary + (overtimeInfo?.totalPay || 0)
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sağ Sütun: Yasal & Özel Kesintiler + SGK İşveren Payları */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-800 text-white px-3 py-1.5 font-bold text-xs flex justify-between items-center print:py-1">
                      <span className="tracking-wide uppercase font-black text-[11px]">YASAL VE ÖZEL KESİNTİLER</span>
                      <span className="text-[10px] font-medium text-slate-300">Tutar (₺)</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                            {singleMonthlyRecord.isRetired ? "SGDP İşçi Primi (%7.5):" : "SGK İşçi Primi (%14):"}
                          </td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right text-slate-900 font-medium">{formatTRY(singleMonthlyRecord.sgkEmployeeShare)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                            {singleMonthlyRecord.isRetired ? "İşsizlik Primi (Muaf %0):" : "İşsizlik Sigortası Primi (%1):"}
                          </td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right text-slate-900 font-medium">{formatTRY(singleMonthlyRecord.unemploymentEmployeeShare)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">Gelir Vergisi Matrahı:</td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right text-slate-700">{formatTRY(singleMonthlyRecord.incomeTaxBase)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                            Hesaplanan Gelir Vergisi:
                            <span className="text-[10px] print:text-[7.5px] block text-slate-500 mt-0.5">Asgari Ücret İstisnası (-{formatTRY(singleMonthlyRecord.minWageTaxExemption)}) Dahil</span>
                          </td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right text-slate-900 font-medium">{formatTRY(singleMonthlyRecord.incomeTax)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">Damga Vergisi (%0.759):</td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right text-slate-900 font-medium">{formatTRY(singleMonthlyRecord.stampTax)}</td>
                        </tr>

                        {/* Özel Kesintiler */}
                        {Boolean(singleMonthlyRecord.advanceDeduction) && (
                          <tr className="border-b border-slate-200 bg-amber-50 text-amber-900">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 font-bold">
                              <div>- Avans Kesintisi:</div>
                              {singleMonthlyRecord.advanceReason && (
                                <div className="text-[10px] print:text-[7.5px] text-amber-700 font-normal mt-0.5">↳ {singleMonthlyRecord.advanceReason}</div>
                              )}
                            </td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold align-top">-{formatTRY(singleMonthlyRecord.advanceDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.besDeduction) && (
                          <tr className="border-b border-slate-200">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                              <div>- Otomatik BES Kesintisi (%3):</div>
                              {singleMonthlyRecord.besReason && (
                                <div className="text-[10px] print:text-[7.5px] text-slate-500 font-normal mt-0.5">↳ {singleMonthlyRecord.besReason}</div>
                              )}
                            </td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right text-slate-900 align-top">-{formatTRY(singleMonthlyRecord.besDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.executionDeduction) && (
                          <tr className="border-b border-slate-200 bg-red-50 text-red-900">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 font-bold">
                              <div>- İcra Maaş Haczi Kesintisi:</div>
                              {singleMonthlyRecord.executionReason && (
                                <div className="text-[10px] print:text-[7.5px] text-red-700 font-normal mt-0.5">↳ {singleMonthlyRecord.executionReason}</div>
                              )}
                            </td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold align-top">-{formatTRY(singleMonthlyRecord.executionDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.alimonyDeduction) && (
                          <tr className="border-b border-slate-200 bg-purple-50 text-purple-900">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 font-bold">
                              <div>- Nafaka Kesintisi:</div>
                              {singleMonthlyRecord.alimonyReason && (
                                <div className="text-[10px] print:text-[7.5px] text-purple-700 font-normal mt-0.5">↳ {singleMonthlyRecord.alimonyReason}</div>
                              )}
                            </td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold align-top">-{formatTRY(singleMonthlyRecord.alimonyDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.otherDeductions) && (
                          <tr className="border-b border-slate-200">
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                              <div>- Diğer Kesintiler:</div>
                              {(singleMonthlyRecord.otherReason || singleMonthlyRecord.deductionReason) && (
                                <div className="text-[10px] print:text-[7.5px] text-slate-500 font-normal mt-0.5">
                                  ↳ {singleMonthlyRecord.otherReason || singleMonthlyRecord.deductionReason}
                                </div>
                              )}
                            </td>
                            <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right text-slate-900 align-top">-{formatTRY(singleMonthlyRecord.otherDeductions)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-bold text-slate-900 border-b border-t border-slate-300">
                          <td className="py-1.5 px-2 print:py-1 print:px-1.5">TOPLAM İŞÇİ KESİNTİLERİ:</td>
                          <td className="py-1.5 px-2 print:py-1 print:px-1.5 text-right font-black text-rose-900">
                            -{formatTRY(
                              singleMonthlyRecord.sgkEmployeeShare +
                              singleMonthlyRecord.unemploymentEmployeeShare +
                              singleMonthlyRecord.incomeTax +
                              singleMonthlyRecord.stampTax +
                              (singleMonthlyRecord.advanceDeduction || 0) +
                              (singleMonthlyRecord.besDeduction || 0) +
                              (singleMonthlyRecord.executionDeduction || 0) +
                              (singleMonthlyRecord.alimonyDeduction || 0) +
                              (singleMonthlyRecord.otherDeductions || 0)
                            )}
                          </td>
                        </tr>

                        {/* SGK İŞVEREN PAYLARI (YASAL VE ÖZEL KESİNTİLER BÖLÜMÜNDE) */}
                        <tr className="bg-purple-100/80 font-bold text-purple-950 border-t border-purple-200">
                          <td className="p-1.5 print:p-0.5 text-purple-950 font-black text-[10.5px] print:text-[8px]" colSpan={2}>
                            SGK & İŞVEREN YASAL PAYLARI
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200 bg-purple-50/40">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                            {singleMonthlyRecord.isRetired ? "İşveren SGDP Payı (%24.5):" : "SGK İşveren Primi (%15.5):"}
                          </td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-purple-950">{formatTRY(singleMonthlyRecord.sgkEmployerShare)}</td>
                        </tr>
                        <tr className="border-b border-slate-200 bg-purple-50/40">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-slate-700">
                            {singleMonthlyRecord.isRetired ? "İşveren İşsizlik Sigortası (Muaf %0):" : "İşsizlik Sigortası İşveren Primi (%2):"}
                          </td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-bold text-purple-950">{formatTRY(singleMonthlyRecord.unemploymentEmployerShare)}</td>
                        </tr>
                        <tr className="bg-purple-100/90 font-bold text-purple-950">
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5">TOPLAM SGK İŞVEREN PRİMİ:</td>
                          <td className="py-1 px-2 print:py-0.5 print:px-1.5 text-right font-black text-purple-950">
                            {formatTRY(singleMonthlyRecord.sgkEmployerShare + singleMonthlyRecord.unemploymentEmployerShare)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* TAM NET ELE GEÇEN / ÖDENECEK MAAŞ ÖZET ŞERİDİ (TAM GENİŞLİK & KRİSTAL NETLİK) */}
                {/* ========================================================================= */}
                <div
                  style={{
                    backgroundColor: "#83b8ff",
                    color: "#0f172a",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                  className="w-full text-slate-950 rounded-xl p-3 sm:p-4 print:p-2 border-2 border-[#60a5fa] shadow-sm print:shadow-none net-salary-banner mb-2 print:mb-1 print:bg-[#83b8ff]"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-950 bg-white/80 px-2 py-0.5 rounded border border-[#60a5fa]/70">
                          TAM NET ELE GEÇEN / ÖDENECEK MAAŞ
                        </span>
                        <span className="text-[9px] text-slate-900 font-bold bg-white/50 px-2 py-0.5 rounded">
                          {getMonthLabel(monthStr)} Dönemi
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-950 font-bold mt-1.5 leading-snug">
                        <span className="text-slate-900 font-black">YALNIZ: </span>
                        <span className="italic font-extrabold">{numberToTurkishWords(singleMonthlyRecord.payableNetSalary)}</span>
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-slate-900 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-medium leading-normal">
                        <span>
                          Brüt Kazanç: <strong className="text-slate-950 font-bold">
                            {formatTRY(
                              singleMonthlyRecord.overtimePay
                                ? singleMonthlyRecord.grossSalary
                                : singleMonthlyRecord.grossSalary + (overtimeInfo?.totalPay || 0)
                            )}
                          </strong>
                        </span>
                        <span>
                          - Kesintiler: <strong className="text-rose-950 font-bold">
                            -{formatTRY(
                              singleMonthlyRecord.sgkEmployeeShare +
                              singleMonthlyRecord.unemploymentEmployeeShare +
                              singleMonthlyRecord.incomeTax +
                              singleMonthlyRecord.stampTax +
                              (singleMonthlyRecord.advanceDeduction || 0) +
                              (singleMonthlyRecord.besDeduction || 0) +
                              (singleMonthlyRecord.executionDeduction || 0) +
                              (singleMonthlyRecord.alimonyDeduction || 0) +
                              (singleMonthlyRecord.otherDeductions || 0)
                            )}
                          </strong>
                        </span>
                        <span>
                          = <strong className="text-slate-950 font-black">Net Ele Geçen: {formatTRY(singleMonthlyRecord.payableNetSalary)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 flex flex-col items-start sm:items-end">
                      <div className="text-xl sm:text-2xl print:text-lg font-black text-slate-950 tracking-tight leading-none font-mono">
                        {formatTRY(singleMonthlyRecord.payableNetSalary)}
                      </div>
                      <div className="mt-1 text-[9px] sm:text-[10px] text-slate-900 bg-white/80 border border-[#60a5fa]/60 px-2.5 py-1 rounded font-bold">
                        Toplam İşveren Maliyeti: <strong className="text-slate-950 font-black">{formatTRY(singleMonthlyRecord.totalEmployerCost)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resmi Onay & İmza Alanı */}
                <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-4 text-center text-[9px] print:text-[8px] text-slate-700">
                  <div className="p-1.5 border border-dashed border-slate-300 rounded-lg bg-slate-50/60">
                    <div className="font-bold text-slate-900 mb-0.5">İŞVEREN / YETKİLİ KAŞE & İMZA</div>
                    <div className="text-[8px] text-slate-500">{getHrCompanyTitle(companySettings)}</div>
                    <div className="h-7 print:h-5"></div>
                  </div>
                  <div className="p-1.5 border border-dashed border-slate-300 rounded-lg bg-slate-50/60">
                    <div className="font-bold text-slate-900 mb-0.5">PERSONEL TESLİM ALDIM İMZA</div>
                    <div className="text-[8px] text-slate-500">{currentEmp.fullName} · TCKN: {currentEmp.tckn || "—"}</div>
                    <div className="h-7 print:h-5"></div>
                    <div className="text-[7.5px] text-slate-400 italic">Yukarıdaki tahakkuk eden net ücreti eksiksiz teslim aldım.</div>
                  </div>
                </div>
              </div>

            <div className={activePrintSection === "slip_only" ? "print:hidden" : ""}>
                  {/* OTOMATİK EKLENEN SGK EKSİK GÜN BİLDİRİM FORMU */}
                  {hasMissingDays && includeMissingDayForm && (
                    <MissingDayNotificationForm
                      companySettings={companySettings}
                      employee={currentEmp}
                      record={singleMonthlyRecord}
                      monthStr={monthStr}
                      puantajDays={currentEmployeePuantaj}
                      showSignatures={showSignatures}
                    />
                  )}

                  {/* OTOMATİK EKLENEN PERSONEL AVANS TALEP VE MAHSUP FORMU */}
                  {hasAdvances && includeAdvanceForm && (
                    <AdvanceRequestPrintForm
                      companySettings={companySettings}
                      employee={currentEmp}
                      record={singleMonthlyRecord}
                      monthStr={monthStr}
                      showSignatures={showSignatures}
                    />
                  )}

                  {/* OTOMATİK EKLENEN KESİNTİ VE AVANS MAHSUP BİLDİRİM FORMU (MUVAFAKATNAME) */}
                  {hasDeductionsOrAdvances && includeDeductionForm && (
                    <DeductionAuthorizationForm
                      companySettings={companySettings}
                      employee={currentEmp}
                      record={singleMonthlyRecord}
                      monthStr={monthStr}
                      showSignatures={showSignatures}
                    />
                  )}
                </div>
            </>
          )}

            {/* ========================================================================= */}
            {/* CASE 2: TEK PERSONEL - TÜM YIL (12 AY) KÜMÜLATİF BORDRO VE ÜCRET KARTI    */}
            {/* ========================================================================= */}
            {scope === "single" && periodType === "year" && currentEmp && (
              <div className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0 payroll-main-slip-a4 landscape-mode">
                {/* Şirket Başlığı */}
                {showCompanyHeader && (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                        {getHrCompanyTitle(companySettings)}
                      </h1>
                      <p className="text-xs text-slate-600">
                        {companySettings.address} {companySettings.city} · VKN: {companySettings.taxNumber} · SGK: {companySettings.sgkCredentials?.workplaceRegistrationNo || "—"}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-block bg-purple-900 text-white font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
                        {selectedYear} Yıllık Personel Ücret & Bordro Kartı
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">12 Aylık Kümülatif Vergi & Maaş Dökümü</div>
                    </div>
                  </div>
                )}

                {/* Personel Özet Başlığı */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-purple-50/80 rounded-xl border border-purple-200 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 font-medium">Personel: </span>
                    <span className="font-black text-purple-950 text-sm">{currentEmp.fullName}</span>
                    <span className="text-slate-600 ml-2">(TCKN: {currentEmp.tckn || "—"})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Departman: </span>
                    <span className="font-bold text-slate-800">{currentEmp.department} · {currentEmp.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">İşe Giriş: </span>
                    <span className="font-bold text-slate-800">{formatTRDate(currentEmp.startDate)}</span>
                  </div>
                </div>

                {/* 12 Aylık Tablo */}
                <div className="overflow-x-auto custom-scrollbar border border-slate-300 rounded-xl mb-4">
                  <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase">
                        <th className="p-2 border-r border-slate-700">Dönem / Ay</th>
                        <th className="p-2 border-r border-slate-700 text-right">Brüt Kazanç</th>
                        <th className="p-2 border-r border-slate-700 text-right">SGK İşçi (%15)</th>
                        <th className="p-2 border-r border-slate-700 text-right">GV Matrahı</th>
                        <th className="p-2 border-r border-slate-700 text-right">Küm. GV Matrahı</th>
                        <th className="p-2 border-r border-slate-700 text-right">Gelir Vergisi</th>
                        <th className="p-2 border-r border-slate-700 text-right">Damga V.</th>
                        <th className="p-2 border-r border-slate-700 text-right text-amber-300">Kesintiler / Avans</th>
                        <th className="p-2 border-r border-slate-700 text-right text-emerald-300 font-black">Net Ödenen</th>
                        <th className="p-2 text-right text-purple-200">Toplam Maliyet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {singleAnnualRecords.map((item, idx) => {
                        const rec = item.record;
                        const otherDeds = (rec.advanceDeduction || 0) + (rec.besDeduction || 0) + (rec.executionDeduction || 0) + (rec.alimonyDeduction || 0) + (rec.otherDeductions || 0);
                        return (
                          <tr key={item.monthKey} className={idx % 2 === 1 ? "bg-slate-50/80" : "bg-white"}>
                            <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{item.monthName}</td>
                            <td className="p-2 text-right font-medium text-slate-800 border-r border-slate-200">{formatTRY(rec.grossSalary)}</td>
                            <td className="p-2 text-right text-slate-600 border-r border-slate-200">{formatTRY(rec.sgkEmployeeShare + rec.unemploymentEmployeeShare)}</td>
                            <td className="p-2 text-right text-slate-600 border-r border-slate-200">{formatTRY(rec.incomeTaxBase)}</td>
                            <td className="p-2 text-right font-mono font-semibold text-purple-900 border-r border-slate-200">{formatTRY(item.cumTaxBase)}</td>
                            <td className="p-2 text-right text-slate-700 border-r border-slate-200">{formatTRY(rec.incomeTax)}</td>
                            <td className="p-2 text-right text-slate-700 border-r border-slate-200">{formatTRY(rec.stampTax)}</td>
                            <td className="p-2 text-right text-amber-900 font-semibold border-r border-slate-200">{otherDeds > 0 ? `-${formatTRY(otherDeds)}` : "—"}</td>
                            <td className="p-2 text-right font-black text-emerald-800 border-r border-slate-200">{formatTRY(rec.payableNetSalary)}</td>
                            <td className="p-2 text-right font-bold text-purple-950">{formatTRY(rec.totalEmployerCost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Dip Toplam Satırı */}
                    <tfoot>
                      {(() => {
                        const totGross = singleAnnualRecords.reduce((sum, i) => sum + i.record.grossSalary, 0);
                        const totSgk = singleAnnualRecords.reduce((sum, i) => sum + (i.record.sgkEmployeeShare + i.record.unemploymentEmployeeShare), 0);
                        const totGvBase = singleAnnualRecords.reduce((sum, i) => sum + i.record.incomeTaxBase, 0);
                        const totGv = singleAnnualRecords.reduce((sum, i) => sum + i.record.incomeTax, 0);
                        const totStamp = singleAnnualRecords.reduce((sum, i) => sum + i.record.stampTax, 0);
                        const totOther = singleAnnualRecords.reduce((sum, i) => sum + ((i.record.advanceDeduction || 0) + (i.record.besDeduction || 0) + (i.record.executionDeduction || 0) + (i.record.alimonyDeduction || 0) + (i.record.otherDeductions || 0)), 0);
                        const totNet = singleAnnualRecords.reduce((sum, i) => sum + i.record.payableNetSalary, 0);
                        const totCost = singleAnnualRecords.reduce((sum, i) => sum + i.record.totalEmployerCost, 0);

                        return (
                          <tr className="bg-slate-900 text-white font-black text-xs">
                            <td className="p-2.5 border-r border-slate-700">YILLIK TOPLAM:</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totGross)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totSgk)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totGvBase)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700 font-mono text-purple-300">{formatTRY(totGvBase)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totGv)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totStamp)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700 text-amber-300">-{formatTRY(totOther)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700 text-emerald-400 text-sm">{formatTRY(totNet)}</td>
                            <td className="p-2.5 text-right text-purple-300 text-sm">{formatTRY(totCost)}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================================= */}
            {/* CASE 3: TÜM PERSONELLER - SEÇİLEN AY ŞİRKET BORDRO İCMALİ TABLOSU                 */}
            {/* ================================================================================= */}
            {scope === "all" && periodType === "month" && (
              <div className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0 payroll-main-slip-a4 landscape-mode">
                {/* Şirket Başlığı */}
                {showCompanyHeader && (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                        {getHrCompanyTitle(companySettings)}
                      </h1>
                      <p className="text-xs text-slate-600">
                        {companySettings.address} {companySettings.city} · VKN: {companySettings.taxNumber} · SGK İşyeri No: {companySettings.sgkCredentials?.workplaceRegistrationNo || "—"}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
                        Aylık Genel Bordro İcmal Listesi
                      </div>
                      <div className="text-xs font-black text-purple-950 mt-1">
                        Bordro Dönemi: {getMonthLabel(monthStr)}
                      </div>
                      <div className="text-[10px] text-slate-500">Toplam {allMonthlyRecords.length} Çalışan</div>
                    </div>
                  </div>
                )}

                {/* İcmal Tablosu */}
                <div className="overflow-x-auto custom-scrollbar border border-slate-300 rounded-xl mb-4">
                  <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase">
                        <th className="p-2 border-r border-slate-700 w-8 text-center">#</th>
                        <th className="p-2 border-r border-slate-700">Personel Ad Soyad</th>
                        <th className="p-2 border-r border-slate-700">Departman / Görev</th>
                        <th className="p-2 border-r border-slate-700 text-right">Brüt Maaş</th>
                        <th className="p-2 border-r border-slate-700 text-right">SGK İşçi (%15)</th>
                        <th className="p-2 border-r border-slate-700 text-right">Gelir Vergisi</th>
                        <th className="p-2 border-r border-slate-700 text-right">Damga V.</th>
                        <th className="p-2 border-r border-slate-700 text-right text-amber-300">Avans / Kesinti</th>
                        <th className="p-2 border-r border-slate-700 text-right text-emerald-300 font-black">Net Ödenen</th>
                        <th className="p-2 text-right text-purple-200">İşveren Maliyeti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allMonthlyRecords.map((rec, idx) => {
                        const totalDeductions = (rec.advanceDeduction || 0) + (rec.besDeduction || 0) + (rec.executionDeduction || 0) + (rec.alimonyDeduction || 0) + (rec.otherDeductions || 0);
                        return (
                          <tr key={rec.id} className={idx % 2 === 1 ? "bg-slate-50/80" : "bg-white"}>
                            <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                              {rec.employeeName}
                            </td>
                            <td className="p-2 text-slate-600 border-r border-slate-200">{rec.department}</td>
                            <td className="p-2 text-right font-medium text-slate-800 border-r border-slate-200">{formatTRY(rec.grossSalary)}</td>
                            <td className="p-2 text-right text-slate-600 border-r border-slate-200">{formatTRY(rec.sgkEmployeeShare + rec.unemploymentEmployeeShare)}</td>
                            <td className="p-2 text-right text-slate-700 border-r border-slate-200">{formatTRY(rec.incomeTax)}</td>
                            <td className="p-2 text-right text-slate-700 border-r border-slate-200">{formatTRY(rec.stampTax)}</td>
                            <td className="p-2 text-right text-amber-900 font-semibold border-r border-slate-200">
                              {totalDeductions > 0 ? `-${formatTRY(totalDeductions)}` : "—"}
                            </td>
                            <td className="p-2 text-right font-black text-emerald-800 border-r border-slate-200">{formatTRY(rec.payableNetSalary)}</td>
                            <td className="p-2 text-right font-bold text-purple-950">{formatTRY(rec.totalEmployerCost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Dip Toplam Satırı */}
                    <tfoot>
                      {(() => {
                        const totGross = allMonthlyRecords.reduce((sum, r) => sum + r.grossSalary, 0);
                        const totSgk = allMonthlyRecords.reduce((sum, r) => sum + (r.sgkEmployeeShare + r.unemploymentEmployeeShare), 0);
                        const totGv = allMonthlyRecords.reduce((sum, r) => sum + r.incomeTax, 0);
                        const totStamp = allMonthlyRecords.reduce((sum, r) => sum + r.stampTax, 0);
                        const totDeds = allMonthlyRecords.reduce((sum, r) => sum + ((r.advanceDeduction || 0) + (r.besDeduction || 0) + (r.executionDeduction || 0) + (r.alimonyDeduction || 0) + (r.otherDeductions || 0)), 0);
                        const totNet = allMonthlyRecords.reduce((sum, r) => sum + r.payableNetSalary, 0);
                        const totCost = allMonthlyRecords.reduce((sum, r) => sum + r.totalEmployerCost, 0);

                        return (
                          <tr className="bg-slate-900 text-white font-black text-xs">
                            <td colSpan={3} className="p-2.5 border-r border-slate-700 text-right">GENEL İCMAL TOPLAMI:</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totGross)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totSgk)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totGv)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totStamp)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700 text-amber-300">-{formatTRY(totDeds)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700 text-emerald-400 text-sm">{formatTRY(totNet)}</td>
                            <td className="p-2.5 text-right text-purple-300 text-sm">{formatTRY(totCost)}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ================================================================================= */}
            {/* CASE 4: TÜM PERSONELLER - TÜM YIL (12 AY) ŞİRKET BORDRO VE MALİYET İCMALİ         */}
            {/* ================================================================================= */}
            {scope === "all" && periodType === "year" && (
              <div className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0 payroll-main-slip-a4 landscape-mode">
                {/* Şirket Başlığı */}
                {showCompanyHeader && (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                        {getHrCompanyTitle(companySettings)}
                      </h1>
                      <p className="text-xs text-slate-600">
                        {companySettings.address} {companySettings.city} · VKN: {companySettings.taxNumber} · SGK: {companySettings.sgkCredentials?.workplaceRegistrationNo || "—"}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-block bg-purple-900 text-white font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
                        {selectedYear} Yıllık Şirket Bordro & Maliyet İcmali
                      </div>
                      <div className="text-xs font-black text-purple-950 mt-1">12 Aylık Genel Şirket Bordro Bütçesi</div>
                      <div className="text-[10px] text-slate-500">{sortedEmployees.length} Personel Toplamı</div>
                    </div>
                  </div>
                )}

                {/* 12 Ay Şirket İcmal Tablosu */}
                <div className="overflow-x-auto custom-scrollbar border border-slate-300 rounded-xl mb-4">
                  <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase">
                        <th className="p-2 border-r border-slate-700">Ay / Dönem</th>
                        <th className="p-2 border-r border-slate-700 text-center">Çalışan</th>
                        <th className="p-2 border-r border-slate-700 text-right">Toplam Brüt</th>
                        <th className="p-2 border-r border-slate-700 text-right">SGK İşçi Payı</th>
                        <th className="p-2 border-r border-slate-700 text-right">Gelir Vergisi</th>
                        <th className="p-2 border-r border-slate-700 text-right">Damga Vergisi</th>
                        <th className="p-2 border-r border-slate-700 text-right text-amber-300">Avans Kesintisi</th>
                        <th className="p-2 border-r border-slate-700 text-right text-emerald-300 font-black">Net Ödenen</th>
                        <th className="p-2 text-right text-purple-200">Toplam İşveren Maliyeti</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allAnnualMonthlySummaries.map((m, idx) => (
                        <tr key={m.monthKey} className={idx % 2 === 1 ? "bg-slate-50/80" : "bg-white"}>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{m.monthName}</td>
                          <td className="p-2 text-center text-slate-600 border-r border-slate-200 font-semibold">{m.employeeCount}</td>
                          <td className="p-2 text-right font-medium text-slate-800 border-r border-slate-200">{formatTRY(m.totalGross)}</td>
                          <td className="p-2 text-right text-slate-600 border-r border-slate-200">{formatTRY(m.totalSgkEmp)}</td>
                          <td className="p-2 text-right text-slate-700 border-r border-slate-200">{formatTRY(m.totalIncomeTax)}</td>
                          <td className="p-2 text-right text-slate-700 border-r border-slate-200">{formatTRY(m.totalStampTax)}</td>
                          <td className="p-2 text-right text-amber-900 font-semibold border-r border-slate-200">
                            {m.totalAdvance > 0 ? `-${formatTRY(m.totalAdvance)}` : "—"}
                          </td>
                          <td className="p-2 text-right font-black text-emerald-800 border-r border-slate-200">{formatTRY(m.totalNet)}</td>
                          <td className="p-2 text-right font-bold text-purple-950">{formatTRY(m.totalEmployerCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Yıllık Dip Toplam */}
                    <tfoot>
                      {(() => {
                        const totGross = allAnnualMonthlySummaries.reduce((sum, m) => sum + m.totalGross, 0);
                        const totSgk = allAnnualMonthlySummaries.reduce((sum, m) => sum + m.totalSgkEmp, 0);
                        const totGv = allAnnualMonthlySummaries.reduce((sum, m) => sum + m.totalIncomeTax, 0);
                        const totStamp = allAnnualMonthlySummaries.reduce((sum, m) => sum + m.totalStampTax, 0);
                        const totAdv = allAnnualMonthlySummaries.reduce((sum, m) => sum + m.totalAdvance, 0);
                        const totNet = allAnnualMonthlySummaries.reduce((sum, m) => sum + m.totalNet, 0);
                        const totCost = allAnnualMonthlySummaries.reduce((sum, m) => sum + m.totalEmployerCost, 0);

                        return (
                          <tr className="bg-slate-900 text-white font-black text-xs">
                            <td colSpan={2} className="p-2.5 border-r border-slate-700 text-right">{selectedYear} GENEL YILLIK TOPLAM:</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totGross)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totSgk)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totGv)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700">{formatTRY(totStamp)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700 text-amber-300">-{formatTRY(totAdv)}</td>
                            <td className="p-2.5 text-right border-r border-slate-700 text-emerald-400 text-sm">{formatTRY(totNet)}</td>
                            <td className="p-2.5 text-right text-purple-300 text-sm">{formatTRY(totCost)}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {currentEmp && (
        <UniversalWhatsAppModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          title="WhatsApp ile Maaş Bordrosu Gönder"
          documentTypeLabel="Maaş Hesap Pusulası (4857 S.K. Md. 37)"
          recipientName={currentEmp.fullName}
          recipientPhone={currentEmp.phone || ""}
          defaultMessage={formatPayrollWhatsAppMessage(
            singleMonthlyRecord,
            currentEmp,
            companySettings
          )}
          documentFileName={`Maas_Pusulasi_${String(currentEmp?.fullName || (currentEmp as any)?.name || "Personel").trim().replace(/\s+/g, "_")}_${monthStr}.pdf`}
          companySettings={companySettings}
          onGeneratePdf={async () => {
            const { exportElementToPDFWithPrintStyling } = await import("../utils/pdfService");
            const fileName = `Maas_Pusulasi_${String(currentEmp?.fullName || (currentEmp as any)?.name || "Personel").trim().replace(/\s+/g, "_")}_${monthStr}.pdf`;
            return exportElementToPDFWithPrintStyling("printable-payroll-area", fileName, {
              orientation: pageOrientation === "landscape" ? "l" : "p",
              margin: pageOrientation === "landscape" ? 3 : 6,
              scale: 2,
              fitToSinglePage: true,
            });
          }}
        />
      )}
    </DetailPageLayout>
  );
};
