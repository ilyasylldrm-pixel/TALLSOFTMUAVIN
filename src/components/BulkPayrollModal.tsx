import React, { useState, useMemo } from "react";
import {
  Employee,
  LeaveRequest,
  AdvanceRequest,
  LegalDeduction,
  CustomPayrollAdjustment,
  PayrollRecord,
  PuantajCode,
  DayPuantajDetail,
  CompanySettings,
} from "../types";
import {
  PUANTAJ_CODE_CONFIG,
  getTurkishOfficialHoliday,
  generateDefaultPuantaj,
  calculatePuantajStats,
  getAutoAdvanceForEmployee,
  getAutoLeavesForEmployee,
  getAutoLegalDeductionsForEmployee,
  calculatePayrollRecordHelper,
} from "../utils/puantajUtils";
import { formatCurrency, exportToExcel } from "../utils/exportUtils";
import { DetailPageLayout } from "./common/DetailPageLayout";
import {
  X,
  Layers,
  Calculator,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Printer,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Download,
  Info,
  Scale,
  Sliders,
  Edit3,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  Wallet,
  Check,
  Gift,
  Utensils,
  Bus,
} from "lucide-react";
import { AdditionalPaymentsModal } from "./AdditionalPaymentsModal";

interface BulkPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  companySettings?: CompanySettings;
  payrollMonth: string;
  onMonthChange?: (month: string) => void;
  leaveRequests: LeaveRequest[];
  advanceRequests: AdvanceRequest[];
  legalDeductions: LegalDeduction[];
  payrollCustomizations: Record<string, CustomPayrollAdjustment>;
  onApplyBatchPayroll: (
    updatedCustomizations: Record<string, CustomPayrollAdjustment>,
    processedCount: number,
    totalNet: number,
    totalCost: number
  ) => void;
  onOpenPayrollPrintModal?: () => void;
}

export const BulkPayrollModal: React.FC<BulkPayrollModalProps> = ({
  isOpen,
  onClose,
  employees,
  companySettings,
  payrollMonth,
  onMonthChange,
  leaveRequests,
  advanceRequests,
  legalDeductions,
  payrollCustomizations,
  onApplyBatchPayroll,
  onOpenPayrollPrintModal,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(payrollMonth || "2026-07");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"detail" | "summary">("detail");

  // Integration batch rules
  const [integrateCalendarPuantaj, setIntegrateCalendarPuantaj] = useState<boolean>(true);
  const [integrateApprovedLeaves, setIntegrateApprovedLeaves] = useState<boolean>(true);
  const [integrateAdvances, setIntegrateAdvances] = useState<boolean>(true);
  const [integrateLegalDeductions, setIntegrateLegalDeductions] = useState<boolean>(true);
  const [integrateBes, setIntegrateBes] = useState<boolean>(true);
  const [bulkBonusAmount, setBulkBonusAmount] = useState<number>(0);
  const [isBatchToolsExpanded, setIsBatchToolsExpanded] = useState<boolean>(false);

  // Active employees
  const activeEmployees = useMemo(() => {
    return employees.filter((e) => (e.status ?? "active") === "active");
  }, [employees]);

  // Selected employees for payroll generation
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(() => {
    return new Set(activeEmployees.map((e) => e.id));
  });

  // Active employee being inspected / edited in the "Bordro Hazırla" view
  const [activeEmpId, setActiveEmpId] = useState<string>(() => {
    return activeEmployees.length > 0 ? activeEmployees[0].id : "";
  });

  const [isAdditionalPaymentsModalOpen, setIsAdditionalPaymentsModalOpen] = useState<boolean>(false);

  // Manual adjustments per employee
  const [manualAdjustments, setManualAdjustments] = useState<
    Record<string, CustomPayrollAdjustment>
  >(() => {
    const initial: Record<string, CustomPayrollAdjustment> = {};
    activeEmployees.forEach((emp) => {
      const existing = payrollCustomizations[emp.id];
      if (existing) {
        initial[emp.id] = { ...existing };
      }
    });
    return initial;
  });

  // Month date helpers
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const currentMonthTurkish = `${monthNames[month - 1] || ""} ${year}`;

  // Department options
  const departments = useMemo(() => {
    const set = new Set<string>();
    activeEmployees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [activeEmployees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter((emp) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.title && emp.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept =
        selectedDepartment === "all" || emp.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [activeEmployees, searchTerm, selectedDepartment]);

  // Ensure activeEmpId is valid
  React.useEffect(() => {
    if (activeEmployees.length > 0 && (!activeEmpId || !activeEmployees.some((e) => e.id === activeEmpId))) {
      setActiveEmpId(activeEmployees[0].id);
    }
  }, [activeEmployees, activeEmpId]);

  // Active employee object
  const currentActiveEmp = useMemo(() => {
    return activeEmployees.find((e) => e.id === activeEmpId) || activeEmployees[0] || null;
  }, [activeEmployees, activeEmpId]);

  // Helper to compute / get effective adjustment for an employee
  const getEffectiveAdjustment = (emp: Employee): CustomPayrollAdjustment => {
    const userManual = manualAdjustments[emp.id] || {};
    const existingCustom = payrollCustomizations[emp.id] || {};

    // Auto data
    const autoAdv = integrateAdvances ? getAutoAdvanceForEmployee(emp.id, advanceRequests) : { totalAdvance: 0, count: 0, items: [] };
    const autoLvs = integrateApprovedLeaves ? getAutoLeavesForEmployee(emp.id, leaveRequests) : { unpaidDays: 0, count: 0, items: [] };

    // Puantaj days map
    let puantajDays = userManual.puantajDays || existingCustom.puantajDays;
    if (!puantajDays) {
      if (integrateCalendarPuantaj) {
        puantajDays = generateDefaultPuantaj(
          emp.id,
          selectedMonth,
          integrateApprovedLeaves ? leaveRequests : []
        );
      } else {
        // Simple default puantaj
        puantajDays = {};
        for (let d = 1; d <= daysInMonth; d++) {
          puantajDays[d] = { code: "N" };
        }
      }
    }

    const baseSalary = userManual.baseSalary ?? existingCustom.baseSalary ?? emp.salaryAmount;
    const salaryType = userManual.salaryType ?? existingCustom.salaryType ?? emp.salaryType;

    const baseGrossVal = salaryType === "gross" ? baseSalary : baseSalary * 1.38;
    const stats = calculatePuantajStats(puantajDays, daysInMonth, baseGrossVal);

    // Overtime
    const overtimeNormalHours = userManual.overtimeNormalHours ?? existingCustom.overtimeNormalHours ?? stats.overtimeNormalHours;
    const overtimeWeekendHours = userManual.overtimeWeekendHours ?? existingCustom.overtimeWeekendHours ?? stats.overtimeWeekendHours;
    const overtimeHolidayDays = userManual.overtimeHolidayDays ?? existingCustom.overtimeHolidayDays ?? stats.overtimeHolidayDays;
    const overtimeHolidayHours = userManual.overtimeHolidayHours ?? existingCustom.overtimeHolidayHours ?? stats.overtimeHolidayHours;
    const overtimePay = userManual.overtimePay !== undefined
      ? userManual.overtimePay
      : (existingCustom.overtimePay !== undefined ? existingCustom.overtimePay : stats.calculatedOvertimePay);

    // Bonus
    const bonusAmount = userManual.bonusAmount ?? (existingCustom.bonusAmount !== undefined ? existingCustom.bonusAmount : bulkBonusAmount);

    // Food & Road
    const foodAllowance = userManual.foodAllowance ?? existingCustom.foodAllowance ?? (emp.foodAllowance || 0);
    const roadAllowance = userManual.roadAllowance ?? existingCustom.roadAllowance ?? (emp.roadAllowance || 0);

    // Deductions
    const advanceDeduction = userManual.advanceDeduction !== undefined
      ? userManual.advanceDeduction
      : (existingCustom.advanceDeduction !== undefined ? existingCustom.advanceDeduction : autoAdv.totalAdvance);

    const unpaidLeaveDays = userManual.unpaidLeaveDays !== undefined
      ? userManual.unpaidLeaveDays
      : (existingCustom.unpaidLeaveDays !== undefined ? existingCustom.unpaidLeaveDays : (stats.unpaidDays > 0 ? stats.unpaidDays : autoLvs.unpaidDays));

    const besDeduction = userManual.besDeduction !== undefined
      ? userManual.besDeduction
      : (existingCustom.besDeduction !== undefined
          ? existingCustom.besDeduction
          : (integrateBes && emp.hasBes ? Math.round(baseGrossVal * 0.03) : 0));

    // Legal deductions (İcra & Nafaka)
    const approxNet = salaryType === "net" ? baseSalary : Math.round(baseGrossVal * 0.72);
    const autoLegal = integrateLegalDeductions ? getAutoLegalDeductionsForEmployee(emp.id, approxNet, legalDeductions) : { executionDeduction: 0, alimonyDeduction: 0, activeDeductions: [], execs: [], alimonies: [] };

    const executionDeduction = userManual.executionDeduction !== undefined
      ? userManual.executionDeduction
      : (existingCustom.executionDeduction !== undefined ? existingCustom.executionDeduction : autoLegal.executionDeduction);

    const alimonyDeduction = userManual.alimonyDeduction !== undefined
      ? userManual.alimonyDeduction
      : (existingCustom.alimonyDeduction !== undefined ? existingCustom.alimonyDeduction : autoLegal.alimonyDeduction);

    const otherDeductions = userManual.otherDeductions ?? existingCustom.otherDeductions ?? 0;
    const notes = userManual.notes ?? existingCustom.notes ?? "";

    const isCustomized = Boolean(
      manualAdjustments[emp.id] ||
      existingCustom.isCustomized ||
      advanceDeduction > 0 ||
      unpaidLeaveDays > 0 ||
      bonusAmount > 0 ||
      overtimePay > 0
    );

    return {
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
      besDeduction,
      executionDeduction,
      alimonyDeduction,
      otherDeductions,
      notes,
      puantajDays,
      isCustomized,
    };
  };

  // Compute records for all active employees
  const allCalculations = useMemo(() => {
    return activeEmployees.map((emp) => {
      const customAdj = getEffectiveAdjustment(emp);
      const isSelected = selectedEmpIds.has(emp.id);
      const isManuallyEdited = Boolean(manualAdjustments[emp.id]);
      const hasExistingCustom = Boolean(payrollCustomizations[emp.id]?.isCustomized);

      const record = calculatePayrollRecordHelper(
        emp,
        selectedMonth,
        customAdj,
        integrateAdvances ? advanceRequests : [],
        integrateApprovedLeaves ? leaveRequests : [],
        integrateLegalDeductions ? legalDeductions : []
      );

      const autoAdv = getAutoAdvanceForEmployee(emp.id, advanceRequests);
      const autoLvs = getAutoLeavesForEmployee(emp.id, leaveRequests);

      return {
        employee: emp,
        customAdjustment: customAdj,
        record,
        isSelected,
        isManuallyEdited,
        hasExistingCustom,
        autoAdv,
        autoLvs,
      };
    });
  }, [
    activeEmployees,
    selectedEmpIds,
    manualAdjustments,
    payrollCustomizations,
    selectedMonth,
    integrateAdvances,
    integrateApprovedLeaves,
    integrateLegalDeductions,
    integrateBes,
    bulkBonusAmount,
    integrateCalendarPuantaj,
    advanceRequests,
    leaveRequests,
    legalDeductions,
  ]);

  // Calculations only for selected employees
  const selectedCalculations = useMemo(() => {
    return allCalculations.filter((c) => c.isSelected);
  }, [allCalculations]);

  // Aggregate Batch Totals
  const totals = useMemo(() => {
    return selectedCalculations.reduce(
      (acc, curr) => {
        acc.gross += curr.record.grossSalary;
        acc.net += curr.record.payableNetSalary;
        acc.employerCost += curr.record.totalEmployerCost;
        acc.sgkEmployee += curr.record.sgkEmployeeShare + curr.record.unemploymentEmployeeShare;
        acc.taxes += curr.record.incomeTax + curr.record.stampTax;
        acc.advances += curr.record.advanceDeduction || 0;
        acc.legalDeductions += (curr.record.executionDeduction || 0) + (curr.record.alimonyDeduction || 0);
        acc.bes += curr.record.besDeduction || 0;
        acc.bonus += curr.record.bonusAmount || 0;
        acc.overtime += curr.record.overtimePay || 0;
        return acc;
      },
      {
        gross: 0,
        net: 0,
        employerCost: 0,
        sgkEmployee: 0,
        taxes: 0,
        advances: 0,
        legalDeductions: 0,
        bes: 0,
        bonus: 0,
        overtime: 0,
      }
    );
  }, [selectedCalculations]);

  // Current active employee's calculated data
  const currentActiveData = useMemo(() => {
    if (!currentActiveEmp) return null;
    return allCalculations.find((c) => c.employee.id === currentActiveEmp.id) || null;
  }, [currentActiveEmp, allCalculations]);

  // Handlers for modifying manual adjustments
  const handleUpdateCurrentManual = (field: keyof CustomPayrollAdjustment, value: any) => {
    if (!currentActiveEmp) return;
    setManualAdjustments((prev) => {
      const current = prev[currentActiveEmp.id] || getEffectiveAdjustment(currentActiveEmp);
      return {
        ...prev,
        [currentActiveEmp.id]: {
          ...current,
          [field]: value,
          isCustomized: true,
        },
      };
    });
  };

  const handlePuantajDayClick = (dayNum: number) => {
    if (!currentActiveEmp || !currentActiveData) return;
    const currentMap = currentActiveData.customAdjustment.puantajDays || {};
    const existingDay = currentMap[dayNum] || { code: "N" };
    const currentCode = existingDay.code;

    // Cycle: N -> HT -> RT -> Yİ -> Üİ -> Dİ -> R -> M -> N
    const codesCycle: PuantajCode[] = ["N", "HT", "RT", "Yİ", "Üİ", "Dİ", "R", "M"];
    const currIdx = codesCycle.indexOf(currentCode);
    const nextCode = codesCycle[(currIdx + 1) % codesCycle.length];

    const updatedDay: DayPuantajDetail = {
      ...existingDay,
      code: nextCode,
    };

    const newMap: Record<number, DayPuantajDetail> = {
      ...currentMap,
      [dayNum]: updatedDay,
    };

    // Recalculate stats for overtime & unpaid days
    const baseGrossVal =
      currentActiveData.customAdjustment.salaryType === "gross"
        ? currentActiveData.customAdjustment.baseSalary || currentActiveEmp.salaryAmount
        : (currentActiveData.customAdjustment.baseSalary || currentActiveEmp.salaryAmount) * 1.38;

    const stats = calculatePuantajStats(newMap, daysInMonth, baseGrossVal);

    setManualAdjustments((prev) => {
      const current = prev[currentActiveEmp.id] || getEffectiveAdjustment(currentActiveEmp);
      return {
        ...prev,
        [currentActiveEmp.id]: {
          ...current,
          puantajDays: newMap,
          unpaidLeaveDays: stats.unpaidDays,
          overtimeNormalHours: stats.overtimeNormalHours,
          overtimeWeekendHours: stats.overtimeWeekendHours,
          overtimeHolidayHours: stats.overtimeHolidayHours,
          overtimeHolidayDays: stats.overtimeHolidayDays,
          overtimePay: stats.calculatedOvertimePay,
          isCustomized: true,
        },
      };
    });
  };

  const handlePuantajDayOvertimeChange = (dayNum: number, hours: number) => {
    if (!currentActiveEmp || !currentActiveData) return;
    const currentMap = currentActiveData.customAdjustment.puantajDays || {};
    const existingDay = currentMap[dayNum] || { code: "N" };

    const newMap: Record<number, DayPuantajDetail> = {
      ...currentMap,
      [dayNum]: {
        ...existingDay,
        overtimeHours: Math.max(0, hours),
      },
    };

    const baseGrossVal =
      currentActiveData.customAdjustment.salaryType === "gross"
        ? currentActiveData.customAdjustment.baseSalary || currentActiveEmp.salaryAmount
        : (currentActiveData.customAdjustment.baseSalary || currentActiveEmp.salaryAmount) * 1.38;

    const stats = calculatePuantajStats(newMap, daysInMonth, baseGrossVal);

    setManualAdjustments((prev) => {
      const current = prev[currentActiveEmp.id] || getEffectiveAdjustment(currentActiveEmp);
      return {
        ...prev,
        [currentActiveEmp.id]: {
          ...current,
          puantajDays: newMap,
          overtimeNormalHours: stats.overtimeNormalHours,
          overtimeWeekendHours: stats.overtimeWeekendHours,
          overtimeHolidayHours: stats.overtimeHolidayHours,
          overtimeHolidayDays: stats.overtimeHolidayDays,
          overtimePay: stats.calculatedOvertimePay,
          isCustomized: true,
        },
      };
    });
  };

  const handleToggleHolidayOvertime = (dayNum: number) => {
    if (!currentActiveEmp || !currentActiveData) return;
    const currentMap = currentActiveData.customAdjustment.puantajDays || {};
    const existingDay = currentMap[dayNum] || { code: "RT" };

    const newMap: Record<number, DayPuantajDetail> = {
      ...currentMap,
      [dayNum]: {
        ...existingDay,
        isHolidayOvertime: !existingDay.isHolidayOvertime,
      },
    };

    const baseGrossVal =
      currentActiveData.customAdjustment.salaryType === "gross"
        ? currentActiveData.customAdjustment.baseSalary || currentActiveEmp.salaryAmount
        : (currentActiveData.customAdjustment.baseSalary || currentActiveEmp.salaryAmount) * 1.38;

    const stats = calculatePuantajStats(newMap, daysInMonth, baseGrossVal);

    setManualAdjustments((prev) => {
      const current = prev[currentActiveEmp.id] || getEffectiveAdjustment(currentActiveEmp);
      return {
        ...prev,
        [currentActiveEmp.id]: {
          ...current,
          puantajDays: newMap,
          overtimeHolidayDays: stats.overtimeHolidayDays,
          overtimeWeekendHours: stats.overtimeWeekendHours,
          overtimePay: stats.calculatedOvertimePay,
          isCustomized: true,
        },
      };
    });
  };

  const handleResetCurrentEmployee = () => {
    if (!currentActiveEmp) return;
    setManualAdjustments((prev) => {
      const copy = { ...prev };
      delete copy[currentActiveEmp.id];
      return copy;
    });
  };

  const handleRegenerateCurrentPuantaj = () => {
    if (!currentActiveEmp) return;
    const newPuantaj = generateDefaultPuantaj(
      currentActiveEmp.id,
      selectedMonth,
      integrateApprovedLeaves ? leaveRequests : []
    );
    const baseGrossVal =
      currentActiveEmp.salaryType === "gross"
        ? currentActiveEmp.salaryAmount
        : currentActiveEmp.salaryAmount * 1.38;
    const stats = calculatePuantajStats(newPuantaj, daysInMonth, baseGrossVal);

    setManualAdjustments((prev) => {
      const current = prev[currentActiveEmp.id] || getEffectiveAdjustment(currentActiveEmp);
      return {
        ...prev,
        [currentActiveEmp.id]: {
          ...current,
          puantajDays: newPuantaj,
          unpaidLeaveDays: stats.unpaidDays,
          overtimeNormalHours: stats.overtimeNormalHours,
          overtimeWeekendHours: stats.overtimeWeekendHours,
          overtimeHolidayHours: stats.overtimeHolidayHours,
          overtimeHolidayDays: stats.overtimeHolidayDays,
          overtimePay: stats.calculatedOvertimePay,
          isCustomized: true,
        },
      };
    });
  };

  // Employee Selection handlers
  const handleToggleSelectEmp = (empId: string) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      filteredEmployees.forEach((e) => next.add(e.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      filteredEmployees.forEach((e) => next.delete(e.id));
      return next;
    });
  };

  // Alphabetical navigation between employees
  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "tr")
    );
  }, [filteredEmployees]);

  const currentEmpIndex = useMemo(() => {
    return sortedEmployees.findIndex((e) => e.id === activeEmpId);
  }, [sortedEmployees, activeEmpId]);

  const handleNavigatePrevious = () => {
    if (currentEmpIndex > 0) {
      setActiveEmpId(sortedEmployees[currentEmpIndex - 1].id);
    }
  };

  const handleNavigateNext = () => {
    if (currentEmpIndex !== -1 && currentEmpIndex < sortedEmployees.length - 1) {
      setActiveEmpId(sortedEmployees[currentEmpIndex + 1].id);
    }
  };

  // Batch application of bonus to all selected
  const handleApplyBulkBonus = () => {
    if (bulkBonusAmount < 0) return;
    setManualAdjustments((prev) => {
      const next = { ...prev };
      activeEmployees.forEach((emp) => {
        if (selectedEmpIds.has(emp.id)) {
          const current = next[emp.id] || getEffectiveAdjustment(emp);
          next[emp.id] = {
            ...current,
            bonusAmount: bulkBonusAmount,
            isCustomized: true,
          };
        }
      });
      return next;
    });
  };

  // Final execution of batch payroll
  const handleExecuteBatchGeneration = () => {
    if (selectedCalculations.length === 0) return;

    const finalCustomizations: Record<string, CustomPayrollAdjustment> = {
      ...payrollCustomizations,
    };

    selectedCalculations.forEach((item) => {
      finalCustomizations[item.employee.id] = {
        ...item.customAdjustment,
        isCustomized: true,
      };
    });

    onApplyBatchPayroll(
      finalCustomizations,
      selectedCalculations.length,
      totals.net,
      totals.employerCost
    );
  };

  // Excel Export
  const handleExportSummaryExcel = () => {
    const headers = [
      "Personel Adı",
      "Departman",
      "Unvan",
      "Sözleşme Tipi",
      "Taban Ücret",
      "Hesaplanan Brüt",
      "SGK İşçi Payı",
      "İşsizlik İşçi",
      "Gelir Vergisi",
      "Damga Vergisi",
      "Prim / İkramiye",
      "Fazla Mesai Tutarı",
      "Avans Kesintisi",
      "İcra Kesintisi",
      "Nafaka Kesintisi",
      "BES Kesintisi",
      "Eksik Gün",
      "Net Ödenen",
      "İşveren SGK",
      "Toplam İşveren Maliyeti",
    ];

    const rows = selectedCalculations.map((item) => [
      item.employee.fullName,
      item.employee.department || "—",
      item.employee.title || "—",
      item.customAdjustment.salaryType === "net" ? "Net" : "Brüt",
      item.customAdjustment.baseSalary || item.employee.salaryAmount,
      item.record.grossSalary,
      item.record.sgkEmployeeShare,
      item.record.unemploymentEmployeeShare,
      item.record.incomeTax,
      item.record.stampTax,
      item.record.bonusAmount || 0,
      item.record.overtimePay || 0,
      item.record.advanceDeduction || 0,
      item.record.executionDeduction || 0,
      item.record.alimonyDeduction || 0,
      item.record.besDeduction || 0,
      item.record.unpaidLeaveDays || 0,
      item.record.payableNetSalary,
      item.record.sgkEmployerShare,
      item.record.totalEmployerCost,
    ]);

    exportToExcel({
      filename: `Toplu_Bordro_Icmali_${selectedMonth}_${new Date().toISOString().split("T")[0]}`,
      title: `TOPLU BORDRO VE PUANTAJ İCMALİ (${currentMonthTurkish})`,
      subtitle: `Toplam ${selectedCalculations.length} Personel Bordro Hesabı`,
      headers,
      rows,
    });
  };

  // Active puantaj stats calculation for the active employee
  const activePuantajStats = useMemo(() => {
    if (!currentActiveData) {
      return {
        countN: 0,
        countHT: 0,
        countRT: 0,
        countYI: 0,
        countUI: 0,
        countDI: 0,
        countR: 0,
        countM: 0,
        unpaidDays: 0,
        sgkDays: 30,
        overtimeNormalHours: 0,
        overtimeWeekendHours: 0,
        overtimeHolidayHours: 0,
        overtimeHolidayDays: 0,
        hourlyGross: 0,
        dailyGross: 0,
        normalOvertimePay: 0,
        weekendOvertimePay: 0,
        holidayHoursOvertimePay: 0,
        holidayDaysOvertimePay: 0,
        calculatedOvertimePay: 0,
      };
    }
    const baseGrossVal =
      currentActiveData.customAdjustment.salaryType === "gross"
        ? currentActiveData.customAdjustment.baseSalary || currentActiveData.employee.salaryAmount
        : (currentActiveData.customAdjustment.baseSalary || currentActiveData.employee.salaryAmount) * 1.38;

    return calculatePuantajStats(
      currentActiveData.customAdjustment.puantajDays || {},
      daysInMonth,
      baseGrossVal
    );
  }, [currentActiveData, daysInMonth]);

  const activeEmployeePuantajMap = currentActiveData?.customAdjustment.puantajDays || {};

  if (!isOpen) return null;

  return (
    <DetailPageLayout
      title="Toplu Bordro & Puantaj Hazırlama"
      subtitle={`${currentMonthTurkish} Dönemi • Toplam ${activeEmployees.length} Personel • 4857 S.K. Puantaj & Yasal Kesinti Entegrasyonu`}
      breadcrumbs={[
        { label: "İnsan Kaynakları", onClick: onClose },
        { label: "Bordrolar", onClick: onClose },
        { label: "Toplu Bordro Hazırla", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
          <span>{currentMonthTurkish}</span>
          <span className="font-extrabold ml-1 bg-purple-200/80 text-purple-900 px-1.5 py-0.2 rounded-full text-[10px]">
            {selectedEmpIds.size} / {activeEmployees.length} Personel
          </span>
        </span>
      }
      headerIcon={<Calculator className="w-5 h-5 text-purple-700" />}
      actions={
        <div className="flex items-center gap-2">
          {/* View Mode Tabs */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("detail")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "detail"
                  ? "bg-white text-purple-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-700" />
              <span>Personel Puantaj & Bordro Hazırla</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "summary"
                  ? "bg-white text-purple-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-700" />
              <span>Toplu İcmal & Hakediş Listesi</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleExecuteBatchGeneration}
            disabled={selectedCalculations.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4" />
            <span>{selectedCalculations.length} Bordroyu Kaydet & Onayla</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        {/* 1. TOPLU KURALLAR VE AKILLI ENTEGRASYON ŞERİDİ */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shadow-2xs">
                <Sparkles className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Mevzuata Uygun Akıllı Toplu Entegrasyon Seçenekleri</span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                    4857 S.K. & 5510 S.K.
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Resmi tatiller, izinler, avanslar ve icra kesintileri toplu bordrolara otomatik yansıtılır.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchToolsExpanded(!isBatchToolsExpanded)}
                className="px-3 py-1.5 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{isBatchToolsExpanded ? "Kuralları Gizle" : "Toplu Kurallar & Prim"}</span>
                {isBatchToolsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tümünü Seç ({filteredEmployees.length})</span>
              </button>

              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Seçimi Kaldır</span>
              </button>
            </div>
          </div>

          {/* Quick toggle chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-50">
            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              integrateCalendarPuantaj ? "bg-purple-50 border-purple-300 text-purple-900" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <input
                type="checkbox"
                checked={integrateCalendarPuantaj}
                onChange={(e) => setIntegrateCalendarPuantaj(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
              />
              <span>🗓️ Takvim Puantajı (4857 S.K.)</span>
            </label>

            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              integrateApprovedLeaves ? "bg-teal-50 border-teal-300 text-teal-900" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <input
                type="checkbox"
                checked={integrateApprovedLeaves}
                onChange={(e) => setIntegrateApprovedLeaves(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
              />
              <span>🏖️ Onaylı İzin Entegrasyonu</span>
            </label>

            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              integrateAdvances ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <input
                type="checkbox"
                checked={integrateAdvances}
                onChange={(e) => setIntegrateAdvances(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span>💳 Avans Mahsubu Entegrasyonu</span>
            </label>

            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              integrateLegalDeductions ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <input
                type="checkbox"
                checked={integrateLegalDeductions}
                onChange={(e) => setIntegrateLegalDeductions(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>⚖️ İcra & Nafaka Kesintileri</span>
            </label>

            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              integrateBes ? "bg-sky-50 border-sky-300 text-sky-900" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <input
                type="checkbox"
                checked={integrateBes}
                onChange={(e) => setIntegrateBes(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
              />
              <span>🛡️ BES (%3) Kesintisi</span>
            </label>
          </div>

          {/* Expanded Batch Tools: Period Selector & Bulk Bonus */}
          {isBatchToolsExpanded && (
            <div className="pt-3 border-t border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/40 p-3 rounded-2xl">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Hakediş Bordro Dönemi (Yıl-Ay):
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    if (onMonthChange) onMonthChange(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-purple-950 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Toplu Prim / Bayram İkramiyesi (₺ - Tüm Seçililere):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    placeholder="Örn: 2500"
                    value={bulkBonusAmount || ""}
                    onChange={(e) => setBulkBonusAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkBonus}
                    disabled={bulkBonusAmount <= 0}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    Uygula
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Departman Filtresi:
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">Tüm Departmanlar ({activeEmployees.length})</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 2. PERSONEL SEÇİM VE GEZİNME ŞERİDİ */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleNavigatePrevious}
                  disabled={currentEmpIndex <= 0}
                  className="p-1.5 rounded-xl border border-purple-200 text-purple-900 bg-white hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
                  title="Önceki Personel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-purple-950 px-2">
                  {currentEmpIndex !== -1 ? `${currentEmpIndex + 1} / ${sortedEmployees.length}` : "—"}
                </span>
                <button
                  type="button"
                  onClick={handleNavigateNext}
                  disabled={currentEmpIndex === -1 || currentEmpIndex >= sortedEmployees.length - 1}
                  className="p-1.5 rounded-xl border border-purple-200 text-purple-900 bg-white hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
                  title="Sonraki Personel"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="h-5 w-px bg-purple-100" />

              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span>Personel İnceleme & Puantaj Düzenleme Şeridi</span>
                <span className="text-[10px] text-slate-400">
                  (Düzenlemek istediğiniz personelin kartına tıklayabilirsiniz)
                </span>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Personel ara..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Horizontal scrollable employee cards */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1">
            {sortedEmployees.map((emp, idx) => {
              const isActive = emp.id === activeEmpId;
              const isSelected = selectedEmpIds.has(emp.id);
              const isEdited = Boolean(manualAdjustments[emp.id]);
              const calc = allCalculations.find((c) => c.employee.id === emp.id);
              const netPayable = calc ? calc.record.payableNetSalary : emp.salaryAmount;

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setActiveEmpId(emp.id);
                    if (activeTab !== "detail") setActiveTab("detail");
                  }}
                  className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white border-purple-800 shadow-md ring-2 ring-purple-400/40"
                      : isSelected
                      ? isEdited
                        ? "bg-purple-50/80 border-purple-300 text-purple-950 hover:bg-purple-100"
                        : "bg-white border-slate-200 text-slate-800 hover:border-purple-200 hover:bg-purple-50/30"
                      : "bg-slate-50/80 border-slate-200 text-slate-400 opacity-60 hover:opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelectEmp(emp.id);
                    }}
                    className={`rounded focus:ring-0 w-3.5 h-3.5 cursor-pointer ${
                      isActive ? "text-purple-900 bg-white" : "text-purple-600"
                    }`}
                    title={isSelected ? "Bordroya dahil edilecek" : "Bordroya dahil edilmeyecek"}
                  />

                  <div className="text-left">
                    <div className="font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap">
                      <span>{emp.fullName}</span>
                      {isEdited && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-purple-200 text-purple-900"
                          }`}
                        >
                          ⚙️ Düzenlendi
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] flex items-center gap-2 whitespace-nowrap ${
                        isActive ? "text-purple-100" : "text-slate-500"
                      }`}
                    >
                      <span>{emp.department || "Genel"}</span>
                      <span>•</span>
                      <span className="font-bold">
                        {formatCurrency(netPayable, "TRY")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. ANA GÖRÜNÜM BÖLÜMÜ */}
        {activeTab === "detail" && currentActiveEmp && currentActiveData ? (
          /* ========================================================================= */
          /* GÖRÜNÜM 1: BORDRO HAZIRLA EKRANI (BİREBİR AYNI DETAYLI FORM & PUANTAJ)    */
          /* ========================================================================= */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6">
            {/* Personel Kimlik & Dönem Başlığı */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {currentActiveEmp.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-slate-950">
                      {currentActiveEmp.fullName}
                    </h2>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {currentActiveEmp.department} • {currentActiveEmp.title}
                    </span>
                    {currentActiveData.isManuallyEdited && (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-amber-700" />
                        <span>Elle Düzenlendi</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                    <span>TCKN: <strong>{currentActiveEmp.tckn || "—"}</strong></span>
                    <span>•</span>
                    <span>Sözleşme: <strong>{formatCurrency(currentActiveEmp.salaryAmount, "TRY")} ({currentActiveEmp.salaryType === "net" ? "NET" : "BRÜT"})</strong></span>
                    <span>•</span>
                    <span>İşe Giriş: <strong>{currentActiveEmp.startDate || "—"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Navigation & Reset for current employee */}
              <div className="flex items-center gap-2">
                {currentActiveData.isManuallyEdited && (
                  <button
                    type="button"
                    onClick={handleResetCurrentEmployee}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Bu personelin elle yapılan düzenlemelerini sıfırla ve otomatik mevzuata döndür"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Bu Personeli Sıfırla</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRegenerateCurrentPuantaj}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-900 bg-purple-50 hover:bg-purple-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Takvim ve onaylı izinlere göre puantajı yeniden oluştur"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
                  <span>Puantajı Otomatik Yenile</span>
                </button>
              </div>
            </div>

            {/* Otomatik Aktarım Bilgilendirme Bannerları */}
            {(currentActiveData.autoAdv.totalAdvance > 0 || currentActiveData.autoLvs.unpaidDays > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentActiveData.autoAdv.totalAdvance > 0 && (
                  <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950">
                    <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-extrabold block">Avans Yönetiminden Aktarıldı:</span>
                      <span>
                        Personelin bu dönemde <strong>{currentActiveData.autoAdv.count} adet</strong> onaylı avansı (Toplam:{" "}
                        <strong>{formatCurrency(currentActiveData.autoAdv.totalAdvance, "TRY")}</strong>) bordrodan otomatik düşülecek.
                      </span>
                    </div>
                  </div>
                )}
                {currentActiveData.autoLvs.unpaidDays > 0 && (
                  <div className="flex items-center gap-3 bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3.5 text-xs text-rose-950">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-extrabold block">İzin Yönetiminden Aktarıldı:</span>
                      <span>
                        Personelin bu dönemde <strong>{currentActiveData.autoLvs.unpaidDays} gün</strong> ücretsiz izin / mazeretsiz eksik günü puantaja aktarıldı.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PUANTAJ TAKVİMİ & GÜN DAĞILIMI BÖLÜMÜ (2 SATIR DÜZENİ) */}
            <div className="bg-slate-50/80 rounded-3xl p-5 border border-purple-200/70 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/70 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 text-sm flex items-center gap-2">
                      <span>Puantaj Takvimi & Fazla Mesai Çizelgesi (2 Satır Görünüm)</span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                        {currentMonthTurkish} ({daysInMonth} Gün)
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Günün kutucuğuna tıklayarak çalışma durumunu (Normal Çalışma, Hafta Tatili, Resmi Tatil, İzinler, Rapor) döngüsel olarak değiştirebilir; kutucuklara mesai saatlerini girebilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdditionalPaymentsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-black hover:bg-purple-800 transition-all cursor-pointer shadow-xs hover:shadow-md"
                    title="Yemek yardımı, yol yardımı ve serbest ek ödemeleri yapılandır ve bordroya aktar"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-300" />
                    Ek Ödemeler
                    {((currentActiveData.customAdjustment.foodAllowance || 0) > 0 ||
                      (currentActiveData.customAdjustment.roadAllowance || 0) > 0 ||
                      (currentActiveData.customAdjustment.customPaymentsTotal || 0) > 0 ||
                      (currentActiveData.customAdjustment.customPayments?.length || 0) > 0) && (
                      <span className="bg-amber-400 text-purple-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                        {formatCurrency(
                          (currentActiveData.customAdjustment.foodAllowance || 0) +
                            (currentActiveData.customAdjustment.roadAllowance || 0) +
                            (currentActiveData.customAdjustment.customPaymentsTotal ||
                              currentActiveData.customAdjustment.customPayments?.reduce((s, p) => s + p.amount, 0) ||
                              0),
                          "TRY"
                        )}
                      </span>
                    )}
                  </button>

                  <span className="text-xs font-bold text-purple-900 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
                    SGK Prim Günü: <strong>{activePuantajStats.sgkDays} / 30</strong>
                  </span>
                </div>
              </div>

              {/* Puantaj Kodları ve Renk Anlamları Lejantı */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white/90 rounded-2xl border border-purple-100">
                <span className="text-[11px] font-black text-purple-950 mr-1 flex items-center gap-1 shrink-0">
                  <Info className="w-3.5 h-3.5 text-purple-700" />
                  Kodlar:
                </span>
                {(Object.keys(PUANTAJ_CODE_CONFIG) as PuantajCode[]).map((code) => {
                  const cfg = PUANTAJ_CODE_CONFIG[code];
                  let count = 0;
                  if (code === "N") count = activePuantajStats.countN;
                  else if (code === "HT") count = activePuantajStats.countHT;
                  else if (code === "RT") count = activePuantajStats.countRT;
                  else if (code === "Yİ") count = activePuantajStats.countYI;
                  else if (code === "Üİ") count = activePuantajStats.countUI;
                  else if (code === "Dİ") count = activePuantajStats.countDI;
                  else if (code === "R") count = activePuantajStats.countR;
                  else if (code === "M") count = activePuantajStats.countM;

                  return (
                    <div
                      key={code}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all shadow-2xs ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                      title={`${cfg.label} (${count} gün)`}
                    >
                      <span className="font-extrabold">{cfg.label}</span>
                      <span className="opacity-80 font-black text-[11px]">({count})</span>
                    </div>
                  );
                })}
              </div>

              {/* 2 Satır Puantaj Takvim Izgarası */}
              <div className="space-y-3">
                {/* 1. Satır: Ayın 1 - 15. Günleri */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-purple-900/70 pl-1">
                    1. Satır: 1 - 15 {monthNames[month - 1]}
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-1.5">
                    {Array.from({ length: Math.min(15, daysInMonth) }, (_, i) => i + 1).map((dayNum) => {
                      const dayDetail = activeEmployeePuantajMap[dayNum] || { code: "N" };
                      const code = dayDetail.code || "N";
                      const cfg = PUANTAJ_CODE_CONFIG[code] || PUANTAJ_CODE_CONFIG.N;
                      const d = new Date(year, month - 1, dayNum);
                      const dayNamesShort = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
                      const dayName = dayNamesShort[d.getDay()];
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const holidayName = getTurkishOfficialHoliday(year, month, dayNum);

                      return (
                        <div
                          key={dayNum}
                          className={`rounded-xl p-1.5 flex flex-col items-center justify-between border transition-all text-center min-h-[96px] ${cfg.bgClass} ${cfg.borderClass}`}
                        >
                          <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500">
                            <span className={isWeekend ? "text-purple-700 font-extrabold" : ""}>{dayName}</span>
                            <span className="font-black text-slate-800">{dayNum}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePuantajDayClick(dayNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-black transition-transform active:scale-90 cursor-pointer shadow-2xs flex items-center justify-center ${cfg.badgeClass}`}
                            title={`${cfg.label} (Tıkla ve değiştir)`}
                          >
                            {code}
                          </button>

                          {holidayName ? (
                            <span className="text-[8px] font-extrabold text-red-700 truncate w-full" title={holidayName}>
                              {holidayName}
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-500 truncate w-full">
                              {cfg.label.split(" ")[0]}
                            </span>
                          )}

                          {/* Hourly Overtime Input or Full Holiday Toggle */}
                          {code === "RT" || code === "HT" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleHolidayOvertime(dayNum)}
                              className={`w-full text-[8px] font-black py-0.5 rounded border transition-all cursor-pointer ${
                                dayDetail.isHolidayOvertime
                                  ? "bg-purple-700 text-white border-purple-800"
                                  : "bg-white/80 text-purple-900 border-purple-200 hover:bg-purple-100"
                              }`}
                              title="Tatil mesaisi yapıldı mı? (+1 Tam Yevmiye veya Mesai)"
                            >
                              {dayDetail.isHolidayOvertime ? "✓ Mesaili" : "+ Tam Gün"}
                            </button>
                          ) : (
                            <div className="w-full flex items-center gap-0.5 bg-white/90 px-1 py-0.5 rounded border border-slate-200 text-[10px]">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <input
                                type="number"
                                min="0"
                                max="16"
                                step="0.5"
                                placeholder="0s"
                                value={dayDetail.overtimeHours || ""}
                                onChange={(e) =>
                                  handlePuantajDayOvertimeChange(dayNum, Number(e.target.value))
                                }
                                className="w-full text-center font-bold text-slate-800 focus:outline-none text-[9px]"
                                title="Gündüz Fazla Mesai Saati"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Satır: Ayın 16 - Ay Sonu Günleri */}
                {daysInMonth > 15 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-900/70 pl-1">
                      2. Satır: 16 - {daysInMonth} {monthNames[month - 1]}
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-16 gap-1.5">
                      {Array.from({ length: daysInMonth - 15 }, (_, i) => i + 16).map((dayNum) => {
                        const dayDetail = activeEmployeePuantajMap[dayNum] || { code: "N" };
                        const code = dayDetail.code || "N";
                        const cfg = PUANTAJ_CODE_CONFIG[code] || PUANTAJ_CODE_CONFIG.N;
                        const d = new Date(year, month - 1, dayNum);
                        const dayNamesShort = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
                        const dayName = dayNamesShort[d.getDay()];
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const holidayName = getTurkishOfficialHoliday(year, month, dayNum);

                        return (
                          <div
                            key={dayNum}
                            className={`rounded-xl p-1.5 flex flex-col items-center justify-between border transition-all text-center min-h-[96px] ${cfg.bgClass} ${cfg.borderClass}`}
                          >
                            <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500">
                              <span className={isWeekend ? "text-purple-700 font-extrabold" : ""}>{dayName}</span>
                              <span className="font-black text-slate-800">{dayNum}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handlePuantajDayClick(dayNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-transform active:scale-90 cursor-pointer shadow-2xs flex items-center justify-center ${cfg.badgeClass}`}
                              title={`${cfg.label} (Tıkla ve değiştir)`}
                            >
                              {code}
                            </button>

                            {holidayName ? (
                              <span className="text-[8px] font-extrabold text-red-700 truncate w-full" title={holidayName}>
                                {holidayName}
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-slate-500 truncate w-full">
                                {cfg.label.split(" ")[0]}
                              </span>
                            )}

                            {/* Hourly Overtime Input or Full Holiday Toggle */}
                            {code === "RT" || code === "HT" ? (
                              <button
                                type="button"
                                onClick={() => handleToggleHolidayOvertime(dayNum)}
                                className={`w-full text-[8px] font-black py-0.5 rounded border transition-all cursor-pointer ${
                                  dayDetail.isHolidayOvertime
                                    ? "bg-purple-700 text-white border-purple-800"
                                    : "bg-white/80 text-purple-900 border-purple-200 hover:bg-purple-100"
                                }`}
                                title="Tatil mesaisi yapıldı mı? (+1 Tam Yevmiye veya Mesai)"
                              >
                                {dayDetail.isHolidayOvertime ? "✓ Mesaili" : "+ Tam Gün"}
                              </button>
                            ) : (
                              <div className="w-full flex items-center gap-0.5 bg-white/90 px-1 py-0.5 rounded border border-slate-200 text-[10px]">
                                <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <input
                                  type="number"
                                  min="0"
                                  max="16"
                                  step="0.5"
                                  placeholder="0s"
                                  value={dayDetail.overtimeHours || ""}
                                  onChange={(e) =>
                                    handlePuantajDayOvertimeChange(dayNum, Number(e.target.value))
                                  }
                                  className="w-full text-center font-bold text-slate-800 focus:outline-none text-[9px]"
                                  title="Gündüz Fazla Mesai Saati"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Puantaj Özet Hakediş İcmali */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 border-t border-purple-200/70 text-center">
                <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-bold">Normal Çalışma</span>
                  <span className="text-xs font-black text-emerald-700">{activePuantajStats.countN} Gün</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-bold">Hafta Tatili</span>
                  <span className="text-xs font-black text-purple-700">{activePuantajStats.countHT} Gün</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-bold">Resmi Tatil</span>
                  <span className="text-xs font-black text-red-700">{activePuantajStats.countRT} Gün</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-bold">Ücretli İzin</span>
                  <span className="text-xs font-black text-teal-700">{activePuantajStats.countYI + activePuantajStats.countUI} Gün</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-bold">Doğum İzni</span>
                  <span className="text-xs font-black text-sky-700">{activePuantajStats.countDI} Gün</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-purple-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-bold">Eksik Gün</span>
                  <span className="text-xs font-black text-rose-700">{activePuantajStats.unpaidDays} Gün</span>
                </div>
                <div className="bg-purple-100/70 p-2 rounded-xl border border-purple-300 shadow-2xs">
                  <span className="text-[10px] text-purple-900 block font-extrabold">SGK Prim Günü</span>
                  <span className="text-xs font-black text-purple-950">{activePuantajStats.sgkDays} Gün</span>
                </div>
              </div>
            </div>

            {/* FORM ALANLARI: KAZANÇLAR, MESAİ, YAN HAKLAR VE KESİNTİLER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. KAZANÇLAR & SÖZLEŞME */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-100 pb-2 text-xs font-black text-purple-950 uppercase">
                  <Wallet className="w-4 h-4 text-purple-700" />
                  <span>1. Taban Ücret & Primler</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Maaş Anlaşma Tipi & Temel Ücret:
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={currentActiveData.customAdjustment.salaryType}
                      onChange={(e) =>
                        handleUpdateCurrentManual("salaryType", e.target.value as "net" | "gross")
                      }
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="net">NET</option>
                      <option value="gross">BRÜT</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={currentActiveData.customAdjustment.baseSalary || ""}
                      onChange={(e) =>
                        handleUpdateCurrentManual("baseSalary", Number(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-950 focus:bg-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Prim / İkramiye Tutarı (₺):
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentActiveData.customAdjustment.bonusAmount || ""}
                    onChange={(e) =>
                      handleUpdateCurrentManual("bonusAmount", Math.max(0, Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Performans primi, bayram ikramiyesi vb.
                  </span>
                </div>

                <div className="space-y-2.5 p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      Ek Ödemeler & Yan Haklar
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAdditionalPaymentsModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-black transition-all cursor-pointer shadow-2xs"
                    >
                      <Gift className="w-3 h-3 text-amber-300" />
                      Ek Ödemeler Seç & Aktar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Yemek Yardımı (₺):
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={currentActiveData.customAdjustment.foodAllowance || ""}
                        onChange={(e) =>
                          handleUpdateCurrentManual("foodAllowance", Math.max(0, Number(e.target.value)))
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Yol Yardımı (₺):
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={currentActiveData.customAdjustment.roadAllowance || ""}
                        onChange={(e) =>
                          handleUpdateCurrentManual("roadAllowance", Math.max(0, Number(e.target.value)))
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Elle Yazılan Ek Ödeme Kalemleri Varsa Göster */}
                  {currentActiveData.customAdjustment.customPayments && currentActiveData.customAdjustment.customPayments.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase block">
                        Elle Girilen Ek Ödemeler ({currentActiveData.customAdjustment.customPayments.length} Kalem):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {currentActiveData.customAdjustment.customPayments.map((cp) => (
                          <span
                            key={cp.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-purple-200 text-[11px] font-bold text-purple-950"
                          >
                            <span>{cp.name}:</span>
                            <span className="text-emerald-700 font-black">{formatCurrency(cp.amount, "TRY")}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. FAZLA MESAİ (4857 S.K.) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-100 pb-2 text-xs font-black text-purple-950 uppercase">
                  <Clock className="w-4 h-4 text-purple-700" />
                  <span>2. Fazla Mesai (4857 S.K.)</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Manuel Fazla Mesai Tutarı (₺):
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCurrentManual("overtimePay", activePuantajStats.calculatedOvertimePay)
                      }
                      className="text-[10px] text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
                    >
                      Puantajdan Aktar
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Otomatik: ${formatCurrency(activePuantajStats.calculatedOvertimePay, "TRY")}`}
                    value={currentActiveData.customAdjustment.overtimePay !== undefined ? currentActiveData.customAdjustment.overtimePay : ""}
                    onChange={(e) =>
                      handleUpdateCurrentManual(
                        "overtimePay",
                        e.target.value === "" ? undefined : Math.max(0, Number(e.target.value))
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Puantaj Hesabı: {formatCurrency(activePuantajStats.calculatedOvertimePay, "TRY")}
                  </span>
                </div>

                {/* 4 Detay Kartı (Hafta İçi, Hafta Sonu, Resmi Tatil Saat, Resmi Tatil Gün) */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Hafta İçi (%50)</span>
                    <div className="font-extrabold text-slate-900">{activePuantajStats.overtimeNormalHours} Saat</div>
                    <div className="text-[10px] text-indigo-700 font-bold">{formatCurrency(activePuantajStats.normalOvertimePay, "TRY")}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Hafta Tatili (%100)</span>
                    <div className="font-extrabold text-slate-900">{activePuantajStats.overtimeWeekendHours} Saat</div>
                    <div className="text-[10px] text-indigo-700 font-bold">{formatCurrency(activePuantajStats.weekendOvertimePay, "TRY")}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Resmi Tatil Saat (%100)</span>
                    <div className="font-extrabold text-slate-900">{activePuantajStats.overtimeHolidayHours} Saat</div>
                    <div className="text-[10px] text-indigo-700 font-bold">{formatCurrency(activePuantajStats.holidayHoursOvertimePay, "TRY")}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">Resmi Tatil Gün (1 Yev.)</span>
                    <div className="font-extrabold text-slate-900">{activePuantajStats.overtimeHolidayDays} Gün</div>
                    <div className="text-[10px] text-indigo-700 font-bold">{formatCurrency(activePuantajStats.holidayDaysOvertimePay, "TRY")}</div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bordro Özel Notu:
                  </label>
                  <input
                    type="text"
                    value={currentActiveData.customAdjustment.notes || ""}
                    onChange={(e) => handleUpdateCurrentManual("notes", e.target.value)}
                    placeholder="Ek hakediş gerekçesi veya muhasebe notu..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. KESİNTİLER (AVANS, EKSİK GÜN, İCRA, BES) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-100 pb-2 text-xs font-black text-rose-950 uppercase">
                  <Scale className="w-4 h-4 text-rose-700" />
                  <span>3. Kesintiler & Yasal Kesintiler</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Avans Mahsubu (₺):
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentActiveData.customAdjustment.advanceDeduction || ""}
                      onChange={(e) =>
                        handleUpdateCurrentManual("advanceDeduction", Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-800 focus:bg-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Eksik Gün / İzin:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={currentActiveData.customAdjustment.unpaidLeaveDays || ""}
                      onChange={(e) =>
                        handleUpdateCurrentManual(
                          "unpaidLeaveDays",
                          Math.max(0, Math.min(30, Number(e.target.value)))
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-800 focus:bg-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      İcra Kesintisi (₺):
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentActiveData.customAdjustment.executionDeduction || ""}
                      onChange={(e) =>
                        handleUpdateCurrentManual("executionDeduction", Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nafaka Kesintisi (₺):
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentActiveData.customAdjustment.alimonyDeduction || ""}
                      onChange={(e) =>
                        handleUpdateCurrentManual("alimonyDeduction", Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-800 focus:bg-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      BES (%3) Kesintisi:
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentActiveData.customAdjustment.besDeduction || ""}
                      onChange={(e) =>
                        handleUpdateCurrentManual("besDeduction", Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-sky-800 focus:bg-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Diğer Kesintiler (₺):
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentActiveData.customAdjustment.otherDeductions || ""}
                      onChange={(e) =>
                        handleUpdateCurrentManual("otherDeductions", Math.max(0, Number(e.target.value)))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-800 focus:bg-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CANLI BORDRO HAKEDİŞ ÖZETİ KARTI */}
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50/50 to-purple-50 rounded-3xl p-5 border border-purple-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider block">
                  {currentActiveEmp.fullName} — Hakediş Özeti
                </span>
                <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                  <span>Hesaplanan Brüt: <strong>{formatCurrency(currentActiveData.record.grossSalary, "TRY")}</strong></span>
                  <span>•</span>
                  <span>SGK + Vergi Kesintisi: <strong className="text-rose-700">-{formatCurrency(currentActiveData.record.sgkEmployeeShare + currentActiveData.record.unemploymentEmployeeShare + currentActiveData.record.incomeTax + currentActiveData.record.stampTax, "TRY")}</strong></span>
                  <span>•</span>
                  <span>İşveren Maliyeti: <strong>{formatCurrency(currentActiveData.record.totalEmployerCost, "TRY")}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-purple-900 block uppercase">
                    Net Ödenecek Maaş
                  </span>
                  <span className="text-2xl font-black text-emerald-700">
                    {formatCurrency(currentActiveData.record.payableNetSalary, "TRY")}
                  </span>
                </div>

                {/* Next Employee Button */}
                {currentEmpIndex < sortedEmployees.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNavigateNext}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <span>Sıradakine Geç ({sortedEmployees[currentEmpIndex + 1]?.fullName.split(" ")[0]})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* GÖRÜNÜM 2: TOPLU İCMAL & HAKEDİŞ LİSTESİ TABLOSU                          */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Toplu KPI Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs">
                <div className="text-purple-900 text-xs font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" /> Seçili Personel
                </div>
                <div className="text-2xl font-black text-slate-950 mt-1">
                  {selectedEmpIds.size} <span className="text-xs font-normal text-slate-400">/ {activeEmployees.length}</span>
                </div>
                <div className="text-[11px] text-purple-900/70 font-semibold mt-0.5">Bordro hesaplanacak çalışan sayısı</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs">
                <div className="text-purple-900 text-xs font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Toplam Brüt Ücret
                </div>
                <div className="text-2xl font-black text-slate-950 mt-1">
                  {formatCurrency(totals.gross, "TRY")}
                </div>
                <div className="text-[11px] text-purple-900/70 font-semibold mt-0.5">Taban maaş + mesai + primler</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs">
                <div className="text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Toplam Net Hakediş
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {formatCurrency(totals.net, "TRY")}
                </div>
                <div className="text-[11px] text-emerald-900/70 font-semibold mt-0.5">Personele ödenecek net maaş</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs">
                <div className="text-purple-900 text-xs font-bold flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-600" /> Toplam İşveren Maliyeti
                </div>
                <div className="text-2xl font-black text-slate-950 mt-1">
                  {formatCurrency(totals.employerCost, "TRY")}
                </div>
                <div className="text-[11px] text-purple-900/70 font-semibold mt-0.5">Brüt maaş + SGK işveren + primler</div>
              </div>
            </div>

            {/* İcmal Tablosu Kontrolleri */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-purple-100 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  {filteredEmployees.length} Personel Listeleniyor
                </span>
                <span className="text-[10px] text-slate-400">
                  (Düzenle butonuna basarak personelin 2 satırlık puantaj ekranına geçebilirsiniz)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSummaryExcel}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-900 bg-purple-50 hover:bg-purple-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-purple-700" />
                  <span>Excel'e Aktar</span>
                </button>

                {onOpenPayrollPrintModal && (
                  <button
                    type="button"
                    onClick={onOpenPayrollPrintModal}
                    className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-900 bg-purple-50 hover:bg-purple-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-700" />
                    <span>İcmal Yazdır</span>
                  </button>
                )}
              </div>
            </div>

            {/* İcmal Tablosu */}
            <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-white border border-purple-200/70 shadow-xs">
              <table className="w-full text-left text-xs border-collapse min-w-[960px]">
                <thead className="bg-purple-50/95 border-b border-purple-200 text-purple-950 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredEmployees.length > 0 &&
                          filteredEmployees.every((e) => selectedEmpIds.has(e.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) handleSelectAllFiltered();
                          else handleDeselectAllFiltered();
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Personel</th>
                    <th className="py-2.5 px-3">Taban Sözleşme</th>
                    <th className="py-2.5 px-3">Hesaplanan Brüt</th>
                    <th className="py-2.5 px-3">SGK + Vergi</th>
                    <th className="py-2.5 px-3 text-amber-900">Avans & Kesintiler</th>
                    <th className="py-2.5 px-3 text-rose-900">Eksik Gün</th>
                    <th className="py-2.5 px-3 text-emerald-900 font-extrabold">Net Ödenecek</th>
                    <th className="py-2.5 px-3 text-purple-950 font-black">Toplam Maliyet</th>
                    <th className="py-2.5 px-3 text-center">Durum</th>
                    <th className="py-2.5 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {filteredEmployees.map((emp) => {
                    const calc = allCalculations.find((c) => c.employee.id === emp.id);
                    if (!calc) return null;
                    const { record, isSelected, isManuallyEdited } = calc;
                    const totalLegal =
                      record.sgkEmployeeShare +
                      record.unemploymentEmployeeShare +
                      record.incomeTax +
                      record.stampTax;

                    return (
                      <tr
                        key={emp.id}
                        className={`transition-colors ${
                          isSelected
                            ? isManuallyEdited
                              ? "bg-purple-50/70 hover:bg-purple-100/60"
                              : "bg-white hover:bg-purple-50/40"
                            : "opacity-60 bg-slate-50/50 hover:opacity-90"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectEmp(emp.id)}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          />
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{emp.fullName}</span>
                            {isManuallyEdited && (
                              <span className="text-[9px] bg-purple-700 text-white font-extrabold px-1.5 py-0.2 rounded shadow-2xs flex items-center gap-0.5">
                                <Edit3 className="w-2.5 h-2.5" /> Elle Düzenlendi
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {emp.department} • {emp.title}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          <div>{formatCurrency(emp.salaryAmount, "TRY")}</div>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {emp.salaryType === "net" ? "Net Sözleşme" : "Brüt Sözleşme"}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          <div>{formatCurrency(record.grossSalary, "TRY")}</div>
                          {(record.bonusAmount || 0) > 0 && (
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              +{formatCurrency(record.bonusAmount, "TRY")} Prim
                            </span>
                          )}
                          {(record.overtimePay || 0) > 0 && (
                            <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200 ml-1">
                              +{formatCurrency(record.overtimePay, "TRY")} Mesai
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-600">
                          <div>{formatCurrency(totalLegal, "TRY")}</div>
                          <div className="text-[10px] text-slate-400">
                            SGK: {formatCurrency(record.sgkEmployeeShare, "TRY")}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5 items-start text-[10px]">
                            {(record.advanceDeduction || 0) > 0 && (
                              <span className="text-amber-800 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                                Avans: -{formatCurrency(record.advanceDeduction, "TRY")}
                              </span>
                            )}
                            {(record.executionDeduction || 0) > 0 && (
                              <span className="text-indigo-800 font-bold bg-indigo-50 px-1 rounded border border-indigo-200">
                                İcra: -{formatCurrency(record.executionDeduction, "TRY")}
                              </span>
                            )}
                            {(record.besDeduction || 0) > 0 && (
                              <span className="text-sky-800 font-bold bg-sky-50 px-1 rounded border border-sky-200">
                                BES: -{formatCurrency(record.besDeduction, "TRY")}
                              </span>
                            )}
                            {!(record.advanceDeduction || 0) &&
                              !(record.executionDeduction || 0) &&
                              !(record.besDeduction || 0) && (
                                <span className="text-slate-300">—</span>
                              )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {(record.unpaidLeaveDays || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-800 font-bold text-[11px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              {record.unpaidLeaveDays} Gün
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-black text-emerald-700 text-xs">
                          {formatCurrency(record.payableNetSalary, "TRY")}
                        </td>

                        <td className="py-2.5 px-3 font-black text-purple-950 text-xs">
                          {formatCurrency(record.totalEmployerCost, "TRY")}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Hazırlanacak
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Dahil Değil
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveEmpId(emp.id);
                              setActiveTab("detail");
                            }}
                            className="px-2.5 py-1 rounded-lg font-bold text-xs bg-white hover:bg-purple-50 text-purple-950 border border-purple-200 transition-all cursor-pointer flex items-center gap-1 ml-auto shadow-2xs"
                          >
                            <Sliders className="w-3.5 h-3.5 text-purple-700" />
                            <span>Puantaj & Bordro</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. SABİT ALT AKSİYON BARI (STICKY BOTTOM BAR) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-700">
            <span className="font-extrabold text-purple-950 bg-purple-100 px-2.5 py-1 rounded-xl">
              {selectedCalculations.length} Personel Seçildi
            </span>
            <div className="hidden md:flex items-center gap-2">
              <span>Toplam Net: <strong className="text-emerald-700 font-black">{formatCurrency(totals.net, "TRY")}</strong></span>
              <span>•</span>
              <span>İşveren Maliyeti: <strong className="text-purple-950 font-black">{formatCurrency(totals.employerCost, "TRY")}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Vazgeç
            </button>

            {onOpenPayrollPrintModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayrollPrintModal();
                }}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-purple-700" />
                <span>İcmal Yazdır</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExecuteBatchGeneration}
              disabled={selectedCalculations.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-4 h-4" />
              <span>{selectedCalculations.length} Personel Bordrosunu Kaydet ve Tamamla</span>
            </button>
          </div>
        </div>
      </div>

      {isAdditionalPaymentsModalOpen && currentActiveData && (
        <AdditionalPaymentsModal
          isOpen={isAdditionalPaymentsModalOpen}
          onClose={() => setIsAdditionalPaymentsModalOpen(false)}
          employeeName={currentActiveData.employee.fullName}
          actualWorkDays={activePuantajStats.countN || 22}
          initialFoodAllowance={
            currentActiveData.customAdjustment.foodAllowance !== undefined
              ? currentActiveData.customAdjustment.foodAllowance
              : (currentActiveData.employee.foodAllowance || 0)
          }
          initialRoadAllowance={
            currentActiveData.customAdjustment.roadAllowance !== undefined
              ? currentActiveData.customAdjustment.roadAllowance
              : (currentActiveData.employee.roadAllowance || 0)
          }
          initialCustomPayments={currentActiveData.customAdjustment.customPayments ?? []}
          onApply={({ foodAllowance, roadAllowance, customPayments, customPaymentsTotal, notesSummary }) => {
            setManualAdjustments((prev) => {
              const current = prev[currentActiveData.employee.id] || {};
              return {
                ...prev,
                [currentActiveData.employee.id]: {
                  ...current,
                  foodAllowance,
                  roadAllowance,
                  customPayments,
                  customPaymentsTotal,
                  notes: notesSummary ? (current.notes ? `${current.notes} | ${notesSummary}` : notesSummary) : current.notes,
                  isCustomized: true,
                },
              };
            });
          }}
        />
      )}
    </DetailPageLayout>
  );
};
