import {
  Employee,
  PayrollRecord,
  LeaveRequest,
  AdvanceRequest,
  LegalDeduction,
  PuantajCode,
  DayPuantajDetail,
  CustomPayrollAdjustment,
} from "../types";

export const PUANTAJ_CODE_CONFIG: Record<
  PuantajCode,
  { label: string; shortDesc: string; bgClass: string; textClass: string; borderClass: string; badgeClass: string }
> = {
  N: {
    label: "Normal Çalışma",
    shortDesc: "Normal Çalışma Günü",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-900",
    borderClass: "border-emerald-300",
    badgeClass: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  HT: {
    label: "Hafta Tatili",
    shortDesc: "Cumartesi / Pazar Hafta Tatili",
    bgClass: "bg-purple-50",
    textClass: "text-purple-900",
    borderClass: "border-purple-300",
    badgeClass: "bg-purple-600 text-white hover:bg-purple-700",
  },
  RT: {
    label: "Resmi Tatil",
    shortDesc: "Milli & Dini Bayramlar / Resmi Tatil",
    bgClass: "bg-red-50",
    textClass: "text-red-900",
    borderClass: "border-red-300",
    badgeClass: "bg-red-600 text-white hover:bg-red-700",
  },
  Yİ: {
    label: "Yıllık İzin",
    shortDesc: "Yıllık Ücretli İzin",
    bgClass: "bg-teal-50",
    textClass: "text-teal-900",
    borderClass: "border-teal-300",
    badgeClass: "bg-teal-600 text-white hover:bg-teal-700",
  },
  Üİ: {
    label: "Ücretli İzin",
    shortDesc: "Mazeret / Evlilik / Vefat / İdari İzin",
    bgClass: "bg-blue-50",
    textClass: "text-blue-900",
    borderClass: "border-blue-300",
    badgeClass: "bg-blue-600 text-white hover:bg-blue-700",
  },
  Dİ: {
    label: "Doğum İzni",
    shortDesc: "4857 S.K. Erkek Doğum (Babalık) & Analık İzni (Tam Ücretli)",
    bgClass: "bg-sky-50",
    textClass: "text-sky-900",
    borderClass: "border-sky-300",
    badgeClass: "bg-sky-600 text-white hover:bg-sky-700",
  },
  R: {
    label: "Sıhhi İzin (Rapor)",
    shortDesc: "Hastalık / Sağlık Raporu (2 güne kadar ücretli)",
    bgClass: "bg-amber-50",
    textClass: "text-amber-900",
    borderClass: "border-amber-300",
    badgeClass: "bg-amber-600 text-white hover:bg-amber-700",
  },
  M: {
    label: "Ücretsiz İzin",
    shortDesc: "Ücretsiz İzin / Mazeretsiz (Eksik Gün Kesintisi)",
    bgClass: "bg-rose-50",
    textClass: "text-rose-900",
    borderClass: "border-rose-300",
    badgeClass: "bg-rose-600 text-white hover:bg-rose-700",
  },
};

export const getTurkishOfficialHoliday = (year: number, month: number, day: number): string | null => {
  // month is 1-indexed (1: Ocak, 12: Aralık)
  if (month === 1 && day === 1) return "Yılbaşı";
  if (month === 4 && day === 23) return "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı";
  if (month === 5 && day === 1) return "1 Mayıs Emek ve Dayanışma Günü";
  if (month === 5 && day === 19) return "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı";
  if (month === 7 && day === 15) return "15 Temmuz Demokrasi ve Milli Birlik Günü";
  if (month === 8 && day === 30) return "30 Ağustos Zafer Bayramı";
  if (month === 10 && day === 28) return "28 Ekim Cumhuriyet Bayramı Arifesi";
  if (month === 10 && day === 29) return "29 Ekim Cumhuriyet Bayramı";

  // Dini Bayramlar
  if (year === 2024) {
    if (month === 4 && day >= 9 && day <= 12) return "Ramazan Bayramı";
    if (month === 6 && day >= 15 && day <= 19) return "Kurban Bayramı";
  } else if (year === 2025) {
    if (month === 3 && day >= 29 && day <= 31) return "Ramazan Bayramı";
    if (month === 4 && day === 1) return "Ramazan Bayramı";
    if (month === 6 && day >= 5 && day <= 9) return "Kurban Bayramı";
  } else if (year === 2026) {
    if (month === 3 && day >= 19 && day <= 22) return "Ramazan Bayramı";
    if (month === 5 && day >= 26 && day <= 30) return "Kurban Bayramı";
  } else if (year === 2027) {
    if (month === 3 && day >= 9 && day <= 12) return "Ramazan Bayramı";
    if (month === 5 && day >= 16 && day <= 20) return "Kurban Bayramı";
  } else if (year === 2028) {
    if (month === 2 && day >= 26 && day <= 29) return "Ramazan Bayramı";
    if (month === 5 && day >= 4 && day <= 8) return "Kurban Bayramı";
  }

  return null;
};

export const generateDefaultPuantaj = (
  empId: string,
  monthYear: string,
  leaves: LeaveRequest[]
): Record<number, DayPuantajDetail> => {
  const [yearStr, monthStr] = monthYear.split("-");
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  // İzin yönetiminde talep edilmiş (onaylı veya bekleyen) personelin izinleri (onaylı olanlar öncelikli)
  const empLeaves = leaves
    .filter((l) => l.employeeId === empId && (l.status === "approved" || l.status === "pending"))
    .sort((a, b) => (a.status === "approved" ? -1 : 1));

  const map: Record<number, DayPuantajDetail> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // 1. İzin Talebi Kontrolü (Yeni İzin Talebi ve Onaylı İzinler)
    const matchLeave = empLeaves.find(
      (l) => l.startDate <= dateStr && l.endDate >= dateStr
    );

    if (matchLeave) {
      const type = (matchLeave.type || (matchLeave as any).leaveType || "").toLowerCase();
      const reason = matchLeave.reason || matchLeave.description || "";
      let code: PuantajCode = "Üİ";

      if (type.includes("yıllık") || type.includes("annual")) {
        code = "Yİ";
      } else if (type.includes("ücretsiz") || type.includes("mazeretsiz") || type.includes("unpaid")) {
        code = "M";
      } else if (
        type.includes("babalık") ||
        type.includes("erkek doğum") ||
        type.includes("babalik") ||
        type.includes("analık") ||
        type.includes("analik") ||
        type.includes("doğum") ||
        type.includes("dogum")
      ) {
        code = "Dİ";
      } else if (type.includes("evlilik") || type.includes("vefat")) {
        code = "Üİ";
      } else if (type.includes("sıhhi") || type.includes("rapor") || type.includes("hastalık") || type.includes("sick")) {
        code = "R";
      } else {
        code = "Üİ";
      }

      map[day] = {
        code,
        leaveReason: reason || matchLeave.type,
        leaveType: matchLeave.type,
        leaveId: matchLeave.id,
        leaveStatus: matchLeave.status,
      };
      continue;
    }

    // 2. Resmi Tatil Kontrolü
    const holiday = getTurkishOfficialHoliday(year, month, day);
    if (holiday) {
      map[day] = { code: "RT" };
      continue;
    }

    // 3. Hafta Tatili Kontrolü (Cumartesi / Pazar)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      map[day] = { code: "HT" };
      continue;
    }

    // 4. Normal Çalışma Günü
    map[day] = { code: "N" };
  }

  return map;
};

export const calculatePuantajStats = (
  puantaj: Record<number, DayPuantajDetail | PuantajCode>,
  totalDays: number,
  baseGross: number = 0
) => {
  let countN = 0;
  let countHT = 0;
  let countRT = 0;
  let countYI = 0;
  let countUI = 0;
  let countDI = 0;
  let countR = 0;
  let countM = 0;

  // Fazla mesai sayaçları (4857 Sayılı İş Kanunu)
  let overtimeNormalHours = 0;
  let overtimeWeekendHours = 0;
  let overtimeHolidayHours = 0;
  let overtimeHolidayDays = 0;

  for (let day = 1; day <= totalDays; day++) {
    const raw = puantaj[day];
    const code: PuantajCode = typeof raw === "string" ? raw : raw ? raw.code : "N";
    const otHours = typeof raw === "object" && raw ? raw.overtimeHours || 0 : 0;
    const isHolOt = typeof raw === "object" && raw ? Boolean(raw.isHolidayOvertime) : false;

    if (code === "N") {
      countN++;
      if (otHours > 0) overtimeNormalHours += otHours;
    } else if (code === "HT") {
      countHT++;
      if (otHours > 0) overtimeWeekendHours += otHours;
      if (isHolOt) overtimeWeekendHours += 7.5;
    } else if (code === "RT") {
      countRT++;
      if (isHolOt) {
        overtimeHolidayDays += 1;
      }
      if (otHours > 0) {
        overtimeHolidayHours += otHours;
      }
    } else if (code === "Yİ") {
      countYI++;
    } else if (code === "Üİ") {
      countUI++;
    } else if (code === "Dİ") {
      countDI++;
    } else if (code === "R") {
      countR++;
    } else if (code === "M") {
      countM++;
    }
  }

  const sickDeduction = countR > 2 ? countR - 2 : 0;
  const unpaidDays = countM + sickDeduction;
  const sgkDays = Math.max(0, Math.min(30, 30 - unpaidDays));

  const hourlyGross = baseGross > 0 ? baseGross / 225 : 0;
  const dailyGross = baseGross > 0 ? baseGross / 30 : 0;

  const normalOvertimePay = Math.round(hourlyGross * 1.5 * overtimeNormalHours);
  const weekendOvertimePay = Math.round(hourlyGross * 2.0 * overtimeWeekendHours);
  const holidayHoursOvertimePay = Math.round(hourlyGross * 2.0 * overtimeHolidayHours);
  const holidayDaysOvertimePay = Math.round(dailyGross * 1.0 * overtimeHolidayDays);

  const calculatedOvertimePay = normalOvertimePay + weekendOvertimePay + holidayHoursOvertimePay + holidayDaysOvertimePay;
  const totalOvertimeHours = overtimeNormalHours + overtimeWeekendHours + overtimeHolidayHours;

  return {
    countN,
    countHT,
    countRT,
    countYI,
    countUI,
    countDI,
    countR,
    countM,
    totalDays,
    unpaidDays,
    sgkDays,
    paidDays: countN + countHT + countRT + countYI + countUI + countDI + (countR <= 2 ? countR : 2),
    overtimeNormalHours,
    overtimeWeekendHours,
    overtimeHolidayHours,
    overtimeHolidayDays,
    totalOvertimeHours,
    hourlyGross,
    dailyGross,
    normalOvertimePay,
    weekendOvertimePay,
    holidayHoursOvertimePay,
    holidayDaysOvertimePay,
    calculatedOvertimePay,
  };
};

export const getAutoAdvanceForEmployee = (
  empId: string,
  advanceRequests: AdvanceRequest[]
) => {
  const empAdvances = advanceRequests.filter(
    (a) => a.employeeId === empId && (a.status === "paid" || a.status === "approved") && (a.type === "Avans" || a.type === "Masraf")
  );
  const totalAdvance = empAdvances.reduce((sum, a) => sum + a.amount, 0);
  return { totalAdvance, count: empAdvances.length, items: empAdvances };
};

export const getAutoLeavesForEmployee = (
  empId: string,
  leaveRequests: LeaveRequest[]
) => {
  const empLeaves = leaveRequests.filter(
    (l) => l.employeeId === empId && (l.status === "approved" || l.status === "pending")
  );
  let unpaidDays = 0;
  empLeaves.forEach((l) => {
    if (l.type === "Ücretsiz İzin" || l.type === "Mazeretsiz İzin") {
      unpaidDays += l.daysCount;
    } else if (l.type === "Sıhhi İzin" || l.type === "Hastalık/Rapor") {
      if (l.daysCount > 2) {
        unpaidDays += l.daysCount - 2;
      }
    }
  });
  return { unpaidDays, count: empLeaves.length, items: empLeaves };
};

export const getAutoLegalDeductionsForEmployee = (
  empId: string,
  approxNet: number,
  legalDeductions: LegalDeduction[]
) => {
  const activeDeductions = legalDeductions.filter(
    (d) => d.employeeId === empId && d.status === "active"
  );

  let executionDeduction = 0;
  let alimonyDeduction = 0;

  const execs = activeDeductions.filter((d) => d.type === "İcra Kesintisi");
  const alimonies = activeDeductions.filter((d) => d.type === "Nafaka Kesintisi");

  execs.forEach((d) => {
    let amt = 0;
    if (d.calculationType === "quarter_salary") {
      amt = Math.round(approxNet / 4);
    } else {
      amt = d.monthlyAmount || 0;
    }
    if (d.totalDebtAmount > 0) {
      const rem = Math.max(0, d.totalDebtAmount - d.paidAmount);
      if (amt > rem) amt = rem;
    }
    executionDeduction += amt;
  });

  alimonies.forEach((d) => {
    alimonyDeduction += d.monthlyAmount || 0;
  });

  return { executionDeduction, alimonyDeduction, activeDeductions, execs, alimonies };
};

export const calculatePayrollRecordHelper = (
  emp: Employee,
  payrollMonth: string,
  custom: CustomPayrollAdjustment = {},
  advanceRequests: AdvanceRequest[] = [],
  leaveRequests: LeaveRequest[] = [],
  legalDeductions: LegalDeduction[] = []
): PayrollRecord => {
  const autoAdv = getAutoAdvanceForEmployee(emp.id, advanceRequests);
  const autoLvs = getAutoLeavesForEmployee(emp.id, leaveRequests);

  const salaryType = custom.salaryType ?? emp.salaryType;
  const baseSalary = custom.baseSalary ?? emp.salaryAmount;
  const bonusAmount = custom.bonusAmount ?? 0;
  let baseGross = 0;
  if (salaryType === "gross") {
    baseGross = baseSalary;
  } else {
    baseGross = baseSalary * 1.38;
  }

  let overtimePay = custom.overtimePay ?? 0;
  let overtimeNormalHours = custom.overtimeNormalHours ?? 0;
  let overtimeWeekendHours = custom.overtimeWeekendHours ?? 0;
  let overtimeHolidayDays = custom.overtimeHolidayDays ?? 0;
  let overtimeHolidayHours = custom.overtimeHolidayHours ?? 0;

  if (custom.puantajDays) {
    const parts = (payrollMonth || "").split("-");
    const y = parseInt(parts[0], 10) || 2026;
    const m = parseInt(parts[1], 10) || 7;
    const daysInMonth = new Date(y, m, 0).getDate();
    const stats = calculatePuantajStats(custom.puantajDays, daysInMonth, baseGross);
    if (custom.overtimePay === undefined || custom.overtimePay === null) {
      overtimePay = stats.calculatedOvertimePay;
    }
    if (custom.overtimeNormalHours === undefined || custom.overtimeNormalHours === null) {
      overtimeNormalHours = stats.overtimeNormalHours;
    }
    if (custom.overtimeWeekendHours === undefined || custom.overtimeWeekendHours === null) {
      overtimeWeekendHours = stats.overtimeWeekendHours;
    }
    if (custom.overtimeHolidayDays === undefined || custom.overtimeHolidayDays === null) {
      overtimeHolidayDays = stats.overtimeHolidayDays;
    }
    if (custom.overtimeHolidayHours === undefined || custom.overtimeHolidayHours === null) {
      overtimeHolidayHours = stats.overtimeHolidayHours;
    }
  }

  const foodAllowance = custom.foodAllowance ?? (emp.foodAllowance || 0);
  const roadAllowance = custom.roadAllowance ?? (emp.roadAllowance || 0);
  const customPayments = custom.customPayments || [];
  const customPaymentsTotal = custom.customPaymentsTotal !== undefined
    ? custom.customPaymentsTotal
    : customPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const advanceDeduction = custom.advanceDeduction !== undefined ? custom.advanceDeduction : autoAdv.totalAdvance;
  const unpaidLeaveDays = custom.unpaidLeaveDays !== undefined ? custom.unpaidLeaveDays : autoLvs.unpaidDays;

  const unpaidLeaveDeduction = Math.round((baseGross / 30) * unpaidLeaveDays);
  const grossSalary = Math.max(0, baseGross + bonusAmount + overtimePay + foodAllowance + roadAllowance + customPaymentsTotal - unpaidLeaveDeduction);

  const sgkEmployeeShare = Math.round(grossSalary * 0.14);
  const unemploymentEmployeeShare = Math.round(grossSalary * 0.01);
  const incomeTaxBase = Math.round(grossSalary - (sgkEmployeeShare + unemploymentEmployeeShare));
  const minWageTaxExemption = 2950;
  const rawIncomeTax = incomeTaxBase * 0.15;
  const incomeTax = Math.round(Math.max(0, rawIncomeTax - minWageTaxExemption));
  const stampTax = Math.round(grossSalary * 0.00759);

  const netSalary = Math.round(grossSalary - (sgkEmployeeShare + unemploymentEmployeeShare + incomeTax + stampTax));

  const autoLegal = getAutoLegalDeductionsForEmployee(emp.id, netSalary, legalDeductions);

  const besDeduction = custom.besDeduction !== undefined
    ? custom.besDeduction
    : (emp.hasBes ? Math.round(baseGross * 0.03) : 0);

  const executionDeduction = custom.executionDeduction !== undefined ? custom.executionDeduction : autoLegal.executionDeduction;
  const alimonyDeduction = custom.alimonyDeduction !== undefined ? custom.alimonyDeduction : autoLegal.alimonyDeduction;
  const otherDeductions = custom.otherDeductions ?? 0;

  const payableNetSalary = Math.max(0, netSalary - advanceDeduction - besDeduction - executionDeduction - alimonyDeduction - otherDeductions);

  const sgkEmployerShare = Math.round(grossSalary * 0.155);
  const unemploymentEmployerShare = Math.round(grossSalary * 0.02);
  const totalEmployerCost = Math.round(grossSalary + sgkEmployerShare + unemploymentEmployerShare + foodAllowance + roadAllowance);

  // Otomatik / Elle girilen açıklamalar
  let advanceReason = custom.advanceReason;
  if (!advanceReason && autoAdv.items.length > 0) {
    advanceReason = autoAdv.items
      .map((a) => `${a.type || "Avans"}: ${a.description || "Personel Talebi"} (${a.amount} ₺)`)
      .join("; ");
  } else if (!advanceReason && advanceDeduction > 0) {
    advanceReason = "Personelin talebine istinaden bordroya işlenen maaş avansı mahsubu";
  }

  let deductionReason = custom.deductionReason;
  if (!deductionReason) {
    const deductionParts: string[] = [];
    if (autoLegal.execs.length > 0) {
      deductionParts.push(
        ...autoLegal.execs.map(
          (e) => `İcra Maaş Haczi (${e.courtOffice || "İcra Dairesi"} Dosya: ${e.fileNumber || "-"})`
        )
      );
    }
    if (autoLegal.alimonies.length > 0) {
      deductionParts.push(
        ...autoLegal.alimonies.map(
          (a) => `Nafaka Kesintisi (${a.courtOffice || "Aile Mahkemesi"} Dosya: ${a.fileNumber || "-"})`
        )
      );
    }
    if (otherDeductions > 0) {
      deductionParts.push("Diğer Yasal ve Özel Kesintiler");
    }
    deductionReason = deductionParts.join("; ");
  }

  const missingDayCode = custom.missingDayCode || (unpaidLeaveDays > 0 ? "21" : undefined);
  let missingDayReason = custom.missingDayReason;
  if (!missingDayReason && autoLvs.items.length > 0) {
    missingDayReason = autoLvs.items
      .map((l) => `${l.type}: ${l.reason || l.description || "İzin Talebi"}`)
      .join("; ");
  } else if (!missingDayReason && unpaidLeaveDays > 0) {
    missingDayReason = "Puantaj kayıtlarındaki ücretsiz izin / devamsızlık kaynaklı eksik gün";
  }

  return {
    id: `pay_${emp.id}_${payrollMonth}`,
    employeeId: emp.id,
    employeeName: emp.fullName,
    department: emp.department,
    monthYear: payrollMonth,
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
    customPayments,
    customPaymentsTotal,
    advanceDeduction,
    advanceReason,
    unpaidLeaveDays,
    unpaidLeaveDeduction,
    missingDayReason,
    missingDayCode,
    besDeduction,
    besReason: custom.besReason,
    executionDeduction,
    executionReason: custom.executionReason,
    alimonyDeduction,
    alimonyReason: custom.alimonyReason,
    otherDeductions,
    otherReason: custom.otherReason,
    deductionReason,
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
    isCustomized: Boolean(custom.isCustomized) || autoAdv.totalAdvance > 0 || autoLvs.unpaidDays > 0,
  };
};
