import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { Employee, CompanySettings, PayrollRecord, LeaveRequest, AdvanceRequest, LegalDeduction } from "../types";
import { exportElementToPDF } from "../utils/exportUtils";

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
  payrollCustomizations?: Record<string, any>;
  advanceRequests?: AdvanceRequest[];
  leaveRequests?: LeaveRequest[];
  legalDeductions?: LegalDeduction[];
}

export const PayrollPrintModal: React.FC<PayrollPrintModalProps> = ({
  isOpen,
  onClose,
  employees,
  companySettings,
  selectedMonth,
  initialEmployeeId,
  initialMode = "month",
  payrollCustomizations = {},
  advanceRequests = [],
  leaveRequests = [],
  legalDeductions = [],
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
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showEmployerCost, setShowEmployerCost] = useState<boolean>(true);
  const [showCompanyHeader, setShowCompanyHeader] = useState<boolean>(true);

  if (!isOpen) return null;

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
    const custom = (targetMonth === monthStr ? payrollCustomizations[emp.id] : undefined) || {};

    // Auto advances
    let autoAdvance = 0;
    advanceRequests
      .filter((a) => a.employeeId === emp.id && (a.status === "approved" || a.status === "paid") && a.requestDate?.startsWith(targetMonth))
      .forEach((a) => {
        autoAdvance += a.amount;
      });

    // Auto unpaid leaves
    let autoUnpaidDays = 0;
    leaveRequests
      .filter((l) => l.employeeId === emp.id && l.status === "approved" && (l.type === "Ücretsiz İzin" || l.type === "Mazeretsiz İzin"))
      .forEach((l) => {
        if (l.startDate?.startsWith(targetMonth) || l.endDate?.startsWith(targetMonth)) {
          autoUnpaidDays += l.daysCount;
        }
      });

    const salaryType = custom.salaryType ?? emp.salaryType;
    const baseSalary = custom.baseSalary ?? emp.salaryAmount;
    const bonusAmount = custom.bonusAmount ?? 0;
    const overtimePay = custom.overtimePay ?? 0;
    const overtimeNormalHours = custom.overtimeNormalHours ?? 0;
    const overtimeWeekendHours = custom.overtimeWeekendHours ?? 0;
    const overtimeHolidayDays = custom.overtimeHolidayDays ?? 0;
    const overtimeHolidayHours = custom.overtimeHolidayHours ?? 0;
    const foodAllowance = custom.foodAllowance ?? (emp.foodAllowance || 0);
    const roadAllowance = custom.roadAllowance ?? (emp.roadAllowance || 0);

    const advanceDeduction = custom.advanceDeduction !== undefined ? custom.advanceDeduction : autoAdvance;
    const unpaidLeaveDays = custom.unpaidLeaveDays !== undefined ? custom.unpaidLeaveDays : autoUnpaidDays;

    let baseGross = 0;
    if (salaryType === "gross") {
      baseGross = baseSalary;
    } else {
      baseGross = baseSalary * 1.38;
    }

    const unpaidLeaveDeduction = Math.round((baseGross / 30) * unpaidLeaveDays);
    const grossSalary = Math.max(0, baseGross + bonusAmount + overtimePay + foodAllowance + roadAllowance - unpaidLeaveDeduction);

    const sgkEmployeeShare = Math.round(grossSalary * 0.14);
    const unemploymentEmployeeShare = Math.round(grossSalary * 0.01);
    const incomeTaxBase = Math.round(grossSalary - (sgkEmployeeShare + unemploymentEmployeeShare));
    const minWageTaxExemption = 2950;
    const rawIncomeTax = incomeTaxBase * 0.15;
    const incomeTax = Math.round(Math.max(0, rawIncomeTax - minWageTaxExemption));
    const stampTax = Math.round(grossSalary * 0.00759);

    const netSalary = Math.round(grossSalary - (sgkEmployeeShare + unemploymentEmployeeShare + incomeTax + stampTax));

    // Legal deductions
    let executionDeduction = 0;
    let alimonyDeduction = 0;
    legalDeductions
      .filter((d) => d.employeeId === emp.id && d.status === "active")
      .forEach((d) => {
        if (d.type === "İcra Kesintisi") {
          let amt = 0;
          if (d.calculationType === "quarter_salary") {
            amt = Math.round(netSalary / 4);
          } else {
            amt = d.monthlyAmount || 0;
          }
          if (d.totalDebtAmount && d.totalDebtAmount > 0) {
            const rem = Math.max(0, d.totalDebtAmount - d.paidAmount);
            if (amt > rem) amt = rem;
          }
          executionDeduction += amt;
        } else if (d.type === "Nafaka Kesintisi") {
          alimonyDeduction += d.monthlyAmount || 0;
        }
      });

    const besDeduction = custom.besDeduction !== undefined
      ? custom.besDeduction
      : (emp.hasBes ? Math.round(baseGross * 0.03) : 0);

    const otherDeductions = custom.otherDeductions ?? 0;
    const payableNetSalary = Math.max(0, netSalary - advanceDeduction - besDeduction - executionDeduction - alimonyDeduction - otherDeductions);

    const sgkEmployerShare = Math.round(grossSalary * 0.155);
    const unemploymentEmployerShare = Math.round(grossSalary * 0.02);
    const totalEmployerCost = Math.round(grossSalary + sgkEmployerShare + unemploymentEmployerShare + foodAllowance + roadAllowance);

    return {
      id: `pay_${emp.id}_${targetMonth}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      monthYear: targetMonth,
      baseSalary,
      salaryType,
      bonusAmount,
      overtimePay,
      overtimeNormalHours,
      overtimeWeekendHours,
      overtimeHolidayDays,
      overtimeHolidayHours,
      foodAllowance,
      roadAllowance,
      advanceDeduction,
      unpaidLeaveDays,
      unpaidLeaveDeduction,
      besDeduction,
      executionDeduction,
      alimonyDeduction,
      otherDeductions,
      grossSalary: Math.round(grossSalary),
      sgkEmployeeShare,
      unemploymentEmployeeShare,
      incomeTaxBase,
      incomeTax,
      stampTax,
      minWageTaxExemption,
      netSalary,
      payableNetSalary,
      sgkEmployerShare,
      unemploymentEmployerShare,
      totalEmployerCost,
      paymentStatus: "pending",
    };
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

  // Print execution handler
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      let fileName = "Bordro_Raporu.pdf";
      if (scope === "single" && currentEmp) {
        const sanitizedName = currentEmp.fullName.trim().replace(/\s+/g, "_");
        fileName = periodType === "month"
          ? `Maas_Pusulasi_${sanitizedName}_${monthStr}.pdf`
          : `Yillik_Bordro_Karti_${sanitizedName}_${selectedYear}.pdf`;
      } else {
        fileName = periodType === "month"
          ? `Sirket_Bordro_Icmali_${monthStr}.pdf`
          : `Yillik_Sirket_Bordro_Icmali_${selectedYear}.pdf`;
      }
      await exportElementToPDF("printable-payroll-area", fileName);
    } catch (err) {
      console.error("Bordro PDF İndirme Hatası:", err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      {/* Container with Print Specific Styling */}
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-purple-200/80">
        {/* MODAL CONTROLS & HEADER (Hidden during print) */}
        <div className="p-4 sm:p-5 border-b border-purple-100 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white flex flex-col gap-3 shrink-0 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-purple-200 flex items-center justify-center border border-white/10 shadow-inner">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Bordro & Maaş Pusulası Yazdırma
                  <span className="text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-full">
                    Resmi Format (4857 S.K. Md. 37)
                  </span>
                </h2>
                <p className="text-xs text-purple-200/80">
                  Seçilen ay veya tüm yıl (12 ay) kümülatif bordrolarını resmi şablonda önizleyin ve yazdırın.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-purple-200" />
                <span className="hidden sm:inline">{isDownloadingPDF ? "PDF Hazırlanıyor..." : "PDF İndir"}</span>
                <span className="sm:hidden">PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Yazdır</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-purple-200 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
                title="Kapat"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* FILTER & OPTION BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-white/10 text-xs">
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
                  Tüm Yıl (12 Ay)
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
          </div>

          {/* Quick Display Options Toggles */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-purple-200 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showCompanyHeader}
                onChange={(e) => setShowCompanyHeader(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>Şirket Resmi Başlığı ve SGK Sicil Bilgileri</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showEmployerCost}
                onChange={(e) => setShowEmployerCost(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>İşveren Maliyet Özeti (SGK İşveren & İşsizlik)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span>İmza & Tebellüğ Blokları (İşveren Kaşe ve Personel İmzası)</span>
            </label>
          </div>
        </div>

        {/* PRINTABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          {/* Print Style Injector for standard A4 formatting */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-payroll-area, #printable-payroll-area * {
                visibility: visible;
              }
              #printable-payroll-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 10mm;
                background: white !important;
              }
              .page-break-always {
                page-break-after: always;
                break-after: page;
              }
            }
          `}</style>

          <div id="printable-payroll-area" className="max-w-4xl mx-auto space-y-8 print:max-w-none print:w-full print:space-y-6">
            {/* ========================================================= */}
            {/* CASE 1: TEK PERSONEL - SEÇİLEN AY ÜCRET HESAP PUSULASI     */}
            {/* ========================================================= */}
            {scope === "single" && periodType === "month" && currentEmp && singleMonthlyRecord && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0">
                {/* Şirket Başlığı */}
                {showCompanyHeader && (
                  <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                        {companySettings.companyTitle || companySettings.companyName || "ŞİRKET ÜNVANI"}
                      </h1>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {companySettings.address} {companySettings.district ? `${companySettings.district} / ` : ""}{companySettings.city}
                      </p>
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5 mt-1 font-medium">
                        <span><strong>V.D. / VKN:</strong> {companySettings.taxOffice || "—"} / {companySettings.taxNumber || "—"}</span>
                        <span><strong>SGK İşyeri Sicil No:</strong> {companySettings.sgkCredentials?.workplaceRegistrationNo || "2.8470.01.01.1029384.034.01-12"}</span>
                        {companySettings.mersisNo && <span><strong>MERSİS:</strong> {companySettings.mersisNo}</span>}
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
                        Ücret Hesap Pusulası
                      </div>
                      <div className="text-xs font-black text-purple-950 mt-1">
                        Bordro Dönemi: {getMonthLabel(monthStr)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Düzenleme Tarihi: {formatTRDate(new Date().toISOString().split("T")[0])}
                      </div>
                    </div>
                  </div>
                )}

                {/* Personel Bilgi Kartı */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Personel Ad Soyad</span>
                    <span className="font-extrabold text-slate-950">{currentEmp.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">T.C. Kimlik No</span>
                    <span className="font-mono font-bold text-slate-900">{currentEmp.tckn || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Departman & Görev</span>
                    <span className="font-semibold text-slate-800">{currentEmp.department} · {currentEmp.title}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">İşe Giriş Tarihi</span>
                    <span className="font-semibold text-slate-800">{formatTRDate(currentEmp.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">SGK Meslek Kodu</span>
                    <span className="font-mono text-slate-700">{currentEmp.sgkOccupationCode || "5223.01"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Ücret Sözleşme Tipi</span>
                    <span className="font-bold text-purple-900 uppercase">
                      {singleMonthlyRecord.salaryType === "gross" ? "Brüt Ücret" : "Net Ücret"} ({formatTRY(singleMonthlyRecord.baseSalary)})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Şube / Depo</span>
                    <span className="text-slate-800">{currentEmp.branchName || currentEmp.warehouseName || "Merkez"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Banka & IBAN</span>
                    <span className="font-mono text-[10px] text-slate-700 truncate block" title={currentEmp.iban}>
                      {currentEmp.iban ? `${currentEmp.bankName || ""}: ${currentEmp.iban}` : "Elden / Nakit"}
                    </span>
                  </div>
                </div>

                {/* Kazançlar & Kesintiler 2 Sütunlu Detay Tablosu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Sol Sütun: Kazançlar & Ek Ödemeler */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <div className="bg-slate-800 text-white px-3 py-1.5 font-bold text-xs flex justify-between items-center">
                      <span>KAZANÇLAR & HAKEDİŞLER</span>
                      <span className="text-[10px] font-normal text-slate-300">Tutar (₺)</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 text-slate-700">Temel Brüt Maaş Hakedişi:</td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {formatTRY(singleMonthlyRecord.salaryType === "gross" ? singleMonthlyRecord.baseSalary : singleMonthlyRecord.baseSalary * 1.38)}
                          </td>
                        </tr>
                        {Boolean(singleMonthlyRecord.bonusAmount) && (
                          <tr className="border-b border-slate-200 bg-emerald-50/50">
                            <td className="p-2 text-emerald-800 font-semibold">+ Prim / İkramiye:</td>
                            <td className="p-2 text-right font-bold text-emerald-900">+{formatTRY(singleMonthlyRecord.bonusAmount)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.overtimePay) && (
                          <tr className="border-b border-slate-200 bg-purple-50/50">
                            <td className="p-2 text-purple-900 font-semibold">
                              + Fazla Mesai Toplamı
                              {((singleMonthlyRecord.overtimeNormalHours || 0) + (singleMonthlyRecord.overtimeWeekendHours || 0)) > 0 && (
                                <span className="text-[10px] block text-purple-700">
                                  ({(singleMonthlyRecord.overtimeNormalHours || 0) + (singleMonthlyRecord.overtimeWeekendHours || 0)} saat / {singleMonthlyRecord.overtimeHolidayDays || 0} gün)
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right font-bold text-purple-950">+{formatTRY(singleMonthlyRecord.overtimePay)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.foodAllowance) && (
                          <tr className="border-b border-slate-200">
                            <td className="p-2 text-slate-700">+ Yemek Yardımı:</td>
                            <td className="p-2 text-right font-semibold text-slate-900">+{formatTRY(singleMonthlyRecord.foodAllowance)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.roadAllowance) && (
                          <tr className="border-b border-slate-200">
                            <td className="p-2 text-slate-700">+ Yol / Ulaşım Yardımı:</td>
                            <td className="p-2 text-right font-semibold text-slate-900">+{formatTRY(singleMonthlyRecord.roadAllowance)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.unpaidLeaveDays) && (
                          <tr className="border-b border-slate-200 bg-rose-50/60 text-rose-900">
                            <td className="p-2">
                              - Eksik Gün / Ücretsiz İzin ({singleMonthlyRecord.unpaidLeaveDays} Gün):
                            </td>
                            <td className="p-2 text-right font-bold text-rose-900">
                              -{formatTRY(singleMonthlyRecord.unpaidLeaveDeduction || 0)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-black text-slate-950">
                          <td className="p-2.5">TOPLAM BRÜT KAZANÇ (SPEK):</td>
                          <td className="p-2.5 text-right text-sm">{formatTRY(singleMonthlyRecord.grossSalary)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                    {/* Sağ Sütun: Yasal & Özel Kesintiler */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <div className="bg-slate-800 text-white px-3 py-1.5 font-bold text-xs flex justify-between items-center">
                      <span>YASAL VE ÖZEL KESİNTİLER</span>
                      <span className="text-[10px] font-normal text-slate-300">Tutar (₺)</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 text-slate-700">SGK İşçi Primi (%14):</td>
                          <td className="p-2 text-right text-slate-900">{formatTRY(singleMonthlyRecord.sgkEmployeeShare)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 text-slate-700">İşsizlik Sigortası Primi (%1):</td>
                          <td className="p-2 text-right text-slate-900">{formatTRY(singleMonthlyRecord.unemploymentEmployeeShare)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 text-slate-700">Gelir Vergisi Matrahı:</td>
                          <td className="p-2 text-right text-slate-700">{formatTRY(singleMonthlyRecord.incomeTaxBase)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 text-slate-700">
                            Hesaplanan Gelir Vergisi:
                            <span className="text-[10px] block text-slate-500">Asgari Ücret İstisnası (-{formatTRY(singleMonthlyRecord.minWageTaxExemption)}) Dahil</span>
                          </td>
                          <td className="p-2 text-right text-slate-900">{formatTRY(singleMonthlyRecord.incomeTax)}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 text-slate-700">Damga Vergisi (%0.759):</td>
                          <td className="p-2 text-right text-slate-900">{formatTRY(singleMonthlyRecord.stampTax)}</td>
                        </tr>

                        {/* Özel Kesintiler */}
                        {Boolean(singleMonthlyRecord.advanceDeduction) && (
                          <tr className="border-b border-slate-200 bg-amber-50 text-amber-900">
                            <td className="p-2 font-bold">- Avans Kesintisi:</td>
                            <td className="p-2 text-right font-bold">-{formatTRY(singleMonthlyRecord.advanceDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.besDeduction) && (
                          <tr className="border-b border-slate-200">
                            <td className="p-2 text-slate-700">- Otomatik BES Kesintisi (%3):</td>
                            <td className="p-2 text-right text-slate-900">-{formatTRY(singleMonthlyRecord.besDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.executionDeduction) && (
                          <tr className="border-b border-slate-200 bg-red-50 text-red-900">
                            <td className="p-2 font-bold">- İcra Maaş Haczi Kesintisi:</td>
                            <td className="p-2 text-right font-bold">-{formatTRY(singleMonthlyRecord.executionDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.alimonyDeduction) && (
                          <tr className="border-b border-slate-200 bg-purple-50 text-purple-900">
                            <td className="p-2 font-bold">- Nafaka Kesintisi:</td>
                            <td className="p-2 text-right font-bold">-{formatTRY(singleMonthlyRecord.alimonyDeduction)}</td>
                          </tr>
                        )}
                        {Boolean(singleMonthlyRecord.otherDeductions) && (
                          <tr className="border-b border-slate-200">
                            <td className="p-2 text-slate-700">- Diğer Kesintiler:</td>
                            <td className="p-2 text-right text-slate-900">-{formatTRY(singleMonthlyRecord.otherDeductions)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-bold text-slate-900">
                          <td className="p-2.5">TOPLAM KESİNTİ:</td>
                          <td className="p-2.5 text-right">
                            {formatTRY(
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
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NET ÖDENEN BÜYÜK ALAN & YAZIYLA TUTAR */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-purple-300 font-bold block">
                      NET ELE GEÇEN / ÖDENECEK MAAŞ
                    </span>
                    <span className="text-xs text-slate-300 mt-1 block italic font-medium">
                      Yalnız: {numberToTurkishWords(singleMonthlyRecord.payableNetSalary)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {formatTRY(singleMonthlyRecord.payableNetSalary)}
                    </span>
                  </div>
                </div>

                {/* İŞVEREN MALİYETİ BÖLÜMÜ (Opsiyonel) */}
                {showEmployerCost && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                      <span className="font-bold text-slate-800">İşveren SGK Payı (%15.5): {formatTRY(singleMonthlyRecord.sgkEmployerShare)}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">İşveren İşsizlik (%2): {formatTRY(singleMonthlyRecord.unemploymentEmployerShare)}</span>
                    </div>
                    <div className="font-black text-purple-950">
                      Toplam İşveren Aylık Maliyeti: {formatTRY(singleMonthlyRecord.totalEmployerCost)}
                    </div>
                  </div>
                )}

                {/* YASAL ŞERH VE İMZA ALANLARI */}
                {showSignatures && (
                  <div className="pt-2 border-t border-slate-300 text-xs">
                    <p className="text-[10px] text-slate-500 leading-relaxed italic mb-4">
                      * 4857 Sayılı İş Kanunu'nun 37. maddesi uyarınca düzenlenmiştir. Yukarıda ayrıntısı gösterilen {getMonthLabel(monthStr)} dönemine ait tahakkuk etmiş net ücretimi ve yasal haklarımı banka/nakit olarak eksiksiz teslim aldım.
                    </p>

                    <div className="grid grid-cols-2 gap-8 pt-2">
                      <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[100px] flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800">İŞVEREN / YETKİLİ KAŞE & İMZA</span>
                        <div className="text-[10px] text-slate-400 mt-8">Kaşe / İmza Tarihi</div>
                      </div>

                      <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[100px] flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800">PERSONEL ADI SOYADI & İMZA</span>
                        <div className="text-[10px] text-slate-500 font-semibold mt-4">{currentEmp.fullName}</div>
                        <div className="text-[10px] text-slate-400 mt-2">İmza / Tarih: .... / .... / 2026</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* CASE 2: TEK PERSONEL - TÜM YIL (12 AY) KÜMÜLATİF BORDRO VE ÜCRET KARTI    */}
            {/* ========================================================================= */}
            {scope === "single" && periodType === "year" && currentEmp && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0">
                {/* Şirket Başlığı */}
                {showCompanyHeader && (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                        {companySettings.companyTitle || companySettings.companyName || "ŞİRKET ÜNVANI"}
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

                {/* Yıllık Özet Notu & İmzalar */}
                {showSignatures && (
                  <div className="pt-2 border-t border-slate-300 text-xs">
                    <div className="grid grid-cols-2 gap-8 pt-2">
                      <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[90px] flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800">ŞİRKET YÖNETİMİ / İK ONAYI</span>
                        <div className="text-[10px] text-slate-400 mt-6">Kaşe / Yetkili İmza</div>
                      </div>

                      <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[90px] flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800">ÇALIŞAN TEBELLÜĞ İMZASI</span>
                        <div className="text-[10px] text-slate-500 font-semibold mt-2">{currentEmp.fullName}</div>
                        <div className="text-[10px] text-slate-400 mt-2">İmza / Tarih: .... / .... / {selectedYear}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================================= */}
            {/* CASE 3: TÜM PERSONELLER - SEÇİLEN AY ŞİRKET BORDRO İCMALİ TABLOSU                 */}
            {/* ================================================================================= */}
            {scope === "all" && periodType === "month" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0">
                {/* Şirket Başlığı */}
                {showCompanyHeader && (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                        {companySettings.companyTitle || companySettings.companyName || "ŞİRKET ÜNVANI"}
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

                {/* İmzalar */}
                {showSignatures && (
                  <div className="pt-2 border-t border-slate-300 text-xs">
                    <div className="grid grid-cols-3 gap-6 pt-2">
                      <div className="border border-slate-300 rounded-xl p-3 text-center">
                        <span className="text-[11px] font-bold text-slate-800 block">DÜZENLEYEN</span>
                        <span className="text-[10px] text-slate-500">İnsan Kaynakları / Bordro Uzmanı</span>
                        <div className="text-[10px] text-slate-400 mt-6">İmza / Tarih</div>
                      </div>

                      <div className="border border-slate-300 rounded-xl p-3 text-center">
                        <span className="text-[11px] font-bold text-slate-800 block">KONTROL EDEN</span>
                        <span className="text-[10px] text-slate-500">Mali İşler / Muhasebe Müdürü</span>
                        <div className="text-[10px] text-slate-400 mt-6">İmza / Tarih</div>
                      </div>

                      <div className="border border-slate-300 rounded-xl p-3 text-center">
                        <span className="text-[11px] font-bold text-slate-800 block">ONAYLAYAN</span>
                        <span className="text-[10px] text-slate-500">Genel Müdür / Şirket Yetkilisi</span>
                        <div className="text-[10px] text-slate-400 mt-6">Kaşe / İmza</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================================================= */}
            {/* CASE 4: TÜM PERSONELLER - TÜM YIL (12 AY) ŞİRKET BORDRO VE MALİYET İCMALİ         */}
            {/* ================================================================================= */}
            {scope === "all" && periodType === "year" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-300/80 text-slate-900 print:shadow-none print:border-0 print:p-0">
                {/* Şirket Başlığı */}
                {showCompanyHeader && (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                        {companySettings.companyTitle || companySettings.companyName || "ŞİRKET ÜNVANI"}
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

                {/* İmzalar */}
                {showSignatures && (
                  <div className="pt-2 border-t border-slate-300 text-xs">
                    <div className="grid grid-cols-2 gap-8 pt-2">
                      <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[90px] flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800">MALİ İŞLER / İK DİREKTÖRÜ</span>
                        <div className="text-[10px] text-slate-400 mt-6">İmza / Tarih</div>
                      </div>

                      <div className="border border-slate-300 rounded-xl p-4 text-center min-h-[90px] flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-800">YÖNETİM KURULU / ŞİRKET SAHİBİ</span>
                        <div className="text-[10px] text-slate-400 mt-6">Kaşe / İmza</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
