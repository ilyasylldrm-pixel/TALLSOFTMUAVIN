import React, { useState } from "react";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency } from "../utils/exportUtils";
import {
  Users,
  UserPlus,
  Search,
  Plus,
  Building,
  Calendar,
  CreditCard,
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Phone,
  Mail,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  Trash2,
  Edit,
  Award,
  ChevronRight,
  TrendingUp,
  Receipt,
  UserCheck,
  UserX,
  Printer,
  Building2,
  Paperclip,
  Camera,
  AlertTriangle,
  MapPin,
  User,
  Upload,
  LogOut,
  Store,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { Employee, PayrollRecord, LeaveRequest, AdvanceRequest, LegalDeduction, CompanySettings, Branch, Warehouse } from "../types";
import { sgkOccupations } from "../data/sgkOccupations";
import { sgkTerminationReasons } from "../data/sgkTerminationReasons";

interface HRManagementProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  advanceRequests: AdvanceRequest[];
  legalDeductions?: LegalDeduction[];
  companySettings: CompanySettings;
  branches?: Branch[];
  warehouses?: Warehouse[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onAddLeaveRequest: (req: LeaveRequest) => void;
  onUpdateLeaveStatus: (id: string, status: "approved" | "rejected") => void;
  onAddAdvanceRequest: (req: AdvanceRequest) => void;
  onUpdateAdvanceStatus: (id: string, status: "paid" | "approved" | "rejected") => void;
  onAddLegalDeduction?: (deduction: LegalDeduction) => void;
  onUpdateLegalDeduction?: (deduction: LegalDeduction) => void;
  onDeleteLegalDeduction?: (id: string) => void;
}

export const HRManagement: React.FC<HRManagementProps> = ({
  employees,
  leaveRequests,
  advanceRequests,
  legalDeductions = [],
  companySettings,
  branches = [],
  warehouses = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddLeaveRequest,
  onUpdateLeaveStatus,
  onAddAdvanceRequest,
  onUpdateAdvanceStatus,
  onAddLegalDeduction,
  onUpdateLegalDeduction,
  onDeleteLegalDeduction,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"employees" | "payroll" | "leaves" | "advances" | "sgk">("employees");
  const [advanceInnerTab, setAdvanceInnerTab] = useState<"requests" | "legal_deductions">("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  // Modals & Selection States
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<PayrollRecord | null>(null);

  // Legal Deductions Modal & Form States
  const [isAddLegalDeductionOpen, setIsAddLegalDeductionOpen] = useState(false);
  const [editingLegalDeduction, setEditingLegalDeduction] = useState<LegalDeduction | null>(null);
  const [legalForm, setLegalForm] = useState<{
    employeeId: string;
    type: "İcra Kesintisi" | "Nafaka Kesintisi" | "Diğer Yasal Kesinti";
    fileNumber: string;
    creditorName: string;
    iban: string;
    totalDebtAmount: number;
    paidAmount: number;
    monthlyAmount: number;
    calculationType: "quarter_salary" | "fixed";
    priorityOrder: number;
    status: "active" | "queued" | "completed" | "passive";
    notes: string;
  }>({
    employeeId: "",
    type: "İcra Kesintisi",
    fileNumber: "",
    creditorName: "",
    iban: "",
    totalDebtAmount: 0,
    paidAmount: 0,
    monthlyAmount: 0,
    calculationType: "quarter_salary",
    priorityOrder: 1,
    status: "active",
    notes: "",
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalDeduction, setPaymentModalDeduction] = useState<LegalDeduction | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification(null);
    }, 6000);
  };

  // Editable Payroll Customization States
  type CustomPayrollAdjustment = {
    salaryType?: "net" | "gross";
    baseSalary?: number;
    bonusAmount?: number;
    overtimePay?: number;
    foodAllowance?: number;
    roadAllowance?: number;
    advanceDeduction?: number;
    unpaidLeaveDays?: number;
    besDeduction?: number;
    executionDeduction?: number;
    alimonyDeduction?: number;
    otherDeductions?: number;
    isCustomized?: boolean;
    notes?: string;
  };

  const [payrollCustomizations, setPayrollCustomizations] = useState<Record<string, CustomPayrollAdjustment>>({});
  const [editingPayrollEmp, setEditingPayrollEmp] = useState<Employee | null>(null);
  const [editingPayrollForm, setEditingPayrollForm] = useState<CustomPayrollAdjustment>({});

  // Payroll Period State
  const [payrollMonth, setPayrollMonth] = useState("2026-07");

  // Age Calculation Helper
  const calculateAge = (birthDateStr?: string): number | null => {
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Lütfen 5MB'tan küçük bir fotoğraf seçin.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEmpForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Form States
  const [newEmpForm, setNewEmpForm] = useState<Partial<Employee>>({
    fullName: "",
    tckn: "",
    title: "",
    department: "Yazılım & IT",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    terminationCode: "",
    terminationReason: "",
    birthDate: "",
    homeAddress: "",
    photoUrl: "",
    phone: "",
    email: "",
    salaryType: "net",
    salaryAmount: 50000,
    foodAllowance: 4500,
    roadAllowance: 2000,
    hasBes: true,
    sgkOccupationCode: "2512.01",
    iban: "TR",
    bankName: "Garanti BBVA",
    emergencyContact: "",
    emergencyPhone: "",
    status: "active",
    annualLeaveAllowance: 14,
    usedAnnualLeave: 0,
    notes: "",
  });

  const [newLeaveForm, setNewLeaveForm] = useState<Partial<LeaveRequest>>({
    employeeId: employees[0]?.id || "",
    type: "Yıllık İzin",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    daysCount: 1,
    reason: "",
  });

  const [newAdvanceForm, setNewAdvanceForm] = useState<Partial<AdvanceRequest>>({
    employeeId: employees[0]?.id || "",
    type: "Avans",
    amount: 5000,
    requestDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  // Filtered Employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.tckn.includes(searchQuery) ||
      emp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.branchName && emp.branchName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.warehouseName && emp.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDepartment === "all" || emp.department === selectedDepartment;
    const matchesStatus = selectedStatus === "all" || emp.status === selectedStatus;
    const matchesBranch = selectedBranch === "all" || emp.branchId === selectedBranch;
    const matchesWarehouse = selectedWarehouse === "all" || emp.warehouseId === selectedWarehouse;
    return matchesSearch && matchesDept && matchesStatus && matchesBranch && matchesWarehouse;
  });

  // Stats
  const activeCount = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter((e) => e.status === "on_leave").length;
  
  // Total Net Salary Load
  const totalMonthlyNetSalary = employees.reduce((sum, emp) => {
    if (emp.status === "terminated") return sum;
    if (emp.salaryType === "net") return sum + emp.salaryAmount;
    // Estimated net if gross
    return sum + emp.salaryAmount * 0.72;
  }, 0);

  // Helper: Auto-detect approved advances for an employee
  const getAutoAdvanceForEmployee = (empId: string) => {
    const empAdvances = advanceRequests.filter(
      (a) => a.employeeId === empId && (a.status === "paid" || a.status === "approved") && (a.type === "Avans" || a.type === "Masraf")
    );
    const totalAdvance = empAdvances.reduce((sum, a) => sum + a.amount, 0);
    return { totalAdvance, count: empAdvances.length, items: empAdvances };
  };

  // Helper: Auto-detect approved unpaid leaves for an employee according to HR rules
  const getAutoLeavesForEmployee = (empId: string) => {
    const empLeaves = leaveRequests.filter(
      (l) => l.employeeId === empId && l.status === "approved"
    );
    let unpaidDays = 0;
    empLeaves.forEach((l) => {
      if (l.type === "Ücretsiz İzin" || l.type === "Mazeretsiz İzin") {
        unpaidDays += l.daysCount;
      } else if (l.type === "Sıhhi İzin" || l.type === "Hastalık/Rapor") {
        if (l.daysCount > 2) {
          unpaidDays += (l.daysCount - 2);
        }
      }
    });
    return { unpaidDays, count: empLeaves.length, items: empLeaves };
  };

  // Helper: Auto-detect active legal deductions (icra/nafaka) for an employee
  const getAutoLegalDeductionsForEmployee = (empId: string, approxNet: number) => {
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
        amt = Math.round(approxNet / 4); // Maaşın 1/4'ü
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

  // Helper Turkish Payroll Calculator (Standard SGK formulas with Leave & Advance & Legal Deductions Integration)
  const calculatePayrollForEmployee = (emp: Employee): PayrollRecord => {
    const custom = payrollCustomizations[emp.id] || {};
    const autoAdv = getAutoAdvanceForEmployee(emp.id);
    const autoLvs = getAutoLeavesForEmployee(emp.id);

    const salaryType = custom.salaryType ?? emp.salaryType;
    const baseSalary = custom.baseSalary ?? emp.salaryAmount;
    const bonusAmount = custom.bonusAmount ?? 0;
    const overtimePay = custom.overtimePay ?? 0;
    const foodAllowance = custom.foodAllowance ?? (emp.foodAllowance || 0);
    const roadAllowance = custom.roadAllowance ?? (emp.roadAllowance || 0);

    const advanceDeduction = custom.advanceDeduction !== undefined ? custom.advanceDeduction : autoAdv.totalAdvance;
    const unpaidLeaveDays = custom.unpaidLeaveDays !== undefined ? custom.unpaidLeaveDays : autoLvs.unpaidDays;

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

    const autoLegal = getAutoLegalDeductionsForEmployee(emp.id, netSalary);

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
      isCustomized: Boolean(custom.isCustomized) || autoAdv.totalAdvance > 0 || autoLvs.unpaidDays > 0,
    };
  };

  const payrollRecords = employees.map(calculatePayrollForEmployee);
  const totalEmployerMonthlyCost = payrollRecords.reduce((sum, r) => sum + r.totalEmployerCost, 0);

  // Form Submit Handlers
  const handleCreateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.fullName || !newEmpForm.tckn) return;

    const isTerminated = Boolean(newEmpForm.endDate || newEmpForm.terminationCode);

    const created: Employee = {
      id: `emp_${Date.now()}`,
      tckn: newEmpForm.tckn || "10000000000",
      fullName: newEmpForm.fullName || "",
      title: newEmpForm.title || "Uzman",
      department: newEmpForm.department || "Yazılım & IT",
      startDate: newEmpForm.startDate || new Date().toISOString().split("T")[0],
      endDate: newEmpForm.endDate || undefined,
      terminationCode: newEmpForm.terminationCode || undefined,
      terminationReason: newEmpForm.terminationReason || undefined,
      birthDate: newEmpForm.birthDate || undefined,
      homeAddress: newEmpForm.homeAddress || undefined,
      photoUrl: newEmpForm.photoUrl || undefined,
      phone: newEmpForm.phone || "",
      email: newEmpForm.email || "",
      salaryType: newEmpForm.salaryType || "net",
      salaryAmount: Number(newEmpForm.salaryAmount) || 50000,
      foodAllowance: Number(newEmpForm.foodAllowance) || 0,
      roadAllowance: Number(newEmpForm.roadAllowance) || 0,
      hasBes: newEmpForm.hasBes ?? true,
      sgkOccupationCode: newEmpForm.sgkOccupationCode || "2512.01",
      iban: newEmpForm.iban || "TR",
      bankName: newEmpForm.bankName || "Garanti BBVA",
      emergencyContact: newEmpForm.emergencyContact || "",
      emergencyPhone: newEmpForm.emergencyPhone || "",
      status: isTerminated ? "terminated" : (newEmpForm.status || "active"),
      annualLeaveAllowance: Number(newEmpForm.annualLeaveAllowance) || 14,
      usedAnnualLeave: 0,
      notes: newEmpForm.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      branchId: newEmpForm.branchId || undefined,
      branchName: newEmpForm.branchName || undefined,
      warehouseId: newEmpForm.warehouseId || undefined,
      warehouseName: newEmpForm.warehouseName || undefined,
    };

    onAddEmployee(created);
    setIsAddEmployeeOpen(false);
    setNewEmpForm({
      fullName: "",
      tckn: "",
      title: "",
      department: "Yazılım & IT",
      branchId: "",
      branchName: "",
      warehouseId: "",
      warehouseName: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      terminationCode: "",
      terminationReason: "",
      birthDate: "",
      homeAddress: "",
      photoUrl: "",
      phone: "",
      email: "",
      salaryType: "net",
      salaryAmount: 50000,
      foodAllowance: 4500,
      roadAllowance: 2000,
      hasBes: true,
      sgkOccupationCode: "2512.01",
      iban: "TR",
      bankName: "Garanti BBVA",
      emergencyContact: "",
      emergencyPhone: "",
      status: "active",
      annualLeaveAllowance: 14,
      usedAnnualLeave: 0,
      notes: "",
    });
  };

  const handleCreateLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === newLeaveForm.employeeId);
    if (!emp) return;

    const created: LeaveRequest = {
      id: `lv_${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      type: newLeaveForm.type as any || "Yıllık İzin",
      startDate: newLeaveForm.startDate || new Date().toISOString().split("T")[0],
      endDate: newLeaveForm.endDate || new Date().toISOString().split("T")[0],
      daysCount: Number(newLeaveForm.daysCount) || 1,
      status: "pending",
      reason: newLeaveForm.reason || "",
      createdAt: new Date().toISOString().split("T")[0],
    };

    onAddLeaveRequest(created);
    setIsAddLeaveOpen(false);
  };

  const handleCreateAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === newAdvanceForm.employeeId);
    if (!emp) return;

    const created: AdvanceRequest = {
      id: `adv_${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      type: newAdvanceForm.type as any || "Avans",
      amount: Number(newAdvanceForm.amount) || 1000,
      requestDate: newAdvanceForm.requestDate || new Date().toISOString().split("T")[0],
      description: newAdvanceForm.description || "",
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    onAddAdvanceRequest(created);
    setIsAddAdvanceOpen(false);
  };

  // Legal Deductions Core Logic & Handlers
  const processDebtCompletionAndQueue = (completedDeduction: LegalDeduction) => {
    const updatedCompleted = { ...completedDeduction, status: "completed" as const };
    if (onUpdateLegalDeduction) onUpdateLegalDeduction(updatedCompleted);

    if (completedDeduction.type === "İcra Kesintisi") {
      const queuedExecutions = legalDeductions
        .filter(
          (d) =>
            d.employeeId === completedDeduction.employeeId &&
            d.id !== completedDeduction.id &&
            d.type === "İcra Kesintisi" &&
            d.status === "queued"
        )
        .sort((a, b) => a.priorityOrder - b.priorityOrder);

      if (queuedExecutions.length > 0) {
        const nextInQueue = queuedExecutions[0];
        const promotedDeduction: LegalDeduction = {
          ...nextInQueue,
          status: "active" as const,
          priorityOrder: 1,
        };
        if (onUpdateLegalDeduction) onUpdateLegalDeduction(promotedDeduction);

        showToast(
          `🎉 ${completedDeduction.employeeName} için "${completedDeduction.fileNumber}" icra borcu kapandı ve kesinti kaldırıldı! Sıradaki icra kesintisi ("${nextInQueue.fileNumber}") otomatik olarak 1. sıraya alındı ve AKTİFLEŞTİRİLDİ!`
        );
      } else {
        showToast(
          `🎉 ${completedDeduction.employeeName} için "${completedDeduction.fileNumber}" icra borcu tamamen kapandı ve kesinti kaldırıldı. Sırada bekleyen başka icra dosyası bulunmuyor.`
        );
      }
    } else {
      showToast(
        `✅ ${completedDeduction.employeeName} için "${completedDeduction.fileNumber}" kesintisi tamamlandı olarak işaretlendi.`
      );
    }
  };

  const handleOpenAddLegalDeduction = () => {
    setEditingLegalDeduction(null);
    setLegalForm({
      employeeId: employees[0]?.id || "",
      type: "İcra Kesintisi",
      fileNumber: "",
      creditorName: "",
      iban: "TR",
      totalDebtAmount: 50000,
      paidAmount: 0,
      monthlyAmount: 0,
      calculationType: "quarter_salary",
      priorityOrder: 1,
      status: "active",
      notes: "",
    });
    setIsAddLegalDeductionOpen(true);
  };

  const handleOpenEditLegalDeduction = (deduction: LegalDeduction) => {
    setEditingLegalDeduction(deduction);
    setLegalForm({
      employeeId: deduction.employeeId,
      type: deduction.type,
      fileNumber: deduction.fileNumber,
      creditorName: deduction.creditorName || "",
      iban: deduction.iban,
      totalDebtAmount: deduction.totalDebtAmount,
      paidAmount: deduction.paidAmount,
      monthlyAmount: deduction.monthlyAmount,
      calculationType: deduction.calculationType,
      priorityOrder: deduction.priorityOrder,
      status: deduction.status,
      notes: deduction.notes || "",
    });
    setIsAddLegalDeductionOpen(true);
  };

  const handleSaveLegalDeductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === legalForm.employeeId);
    if (!emp) return;

    let targetStatus = legalForm.status;
    let targetOrder = legalForm.priorityOrder;

    if (legalForm.type === "İcra Kesintisi" && legalForm.status === "active") {
      const existingActiveExec = legalDeductions.find(
        (d) =>
          d.employeeId === emp.id &&
          d.type === "İcra Kesintisi" &&
          d.status === "active" &&
          (!editingLegalDeduction || d.id !== editingLegalDeduction.id)
      );

      if (existingActiveExec) {
        const existingQueued = legalDeductions.filter(
          (d) => d.employeeId === emp.id && d.type === "İcra Kesintisi"
        );
        targetStatus = "queued";
        targetOrder = existingQueued.length + 1;
        showToast(
          `⚠️ ${emp.fullName} için aktif 1. sıra icra dosyası zaten mevcut (${existingActiveExec.fileNumber}). Bu yeni dosya ${targetOrder}. Sıraya ("Sırada Bekliyor") olarak eklendi.`
        );
      }
    }

    if (editingLegalDeduction) {
      const updated: LegalDeduction = {
        ...editingLegalDeduction,
        ...legalForm,
        status: targetStatus,
        priorityOrder: targetOrder,
        employeeName: emp.fullName,
      };
      if (onUpdateLegalDeduction) onUpdateLegalDeduction(updated);

      if (updated.totalDebtAmount > 0 && updated.paidAmount >= updated.totalDebtAmount && updated.status !== "completed") {
        processDebtCompletionAndQueue(updated);
      } else {
        showToast(`✅ "${updated.fileNumber}" yasal kesinti kaydı güncellendi.`);
      }
    } else {
      const newDeduction: LegalDeduction = {
        id: `leg_${Date.now()}`,
        ...legalForm,
        status: targetStatus,
        priorityOrder: targetOrder,
        employeeName: emp.fullName,
        createdAt: new Date().toISOString().split("T")[0],
      };

      if (onAddLegalDeduction) onAddLegalDeduction(newDeduction);

      if (newDeduction.totalDebtAmount > 0 && newDeduction.paidAmount >= newDeduction.totalDebtAmount) {
        processDebtCompletionAndQueue(newDeduction);
      } else {
        showToast(`✅ "${newDeduction.fileNumber}" kesinti kaydı başarıyla oluşturuldu.`);
      }
    }

    setIsAddLegalDeductionOpen(false);
    setEditingLegalDeduction(null);
  };

  const handleExecutePaymentModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDeduction) return;

    const newPaid = (paymentModalDeduction.paidAmount || 0) + Number(paymentAmountInput);
    const isFinished = paymentModalDeduction.totalDebtAmount > 0 && newPaid >= paymentModalDeduction.totalDebtAmount;

    const updated: LegalDeduction = {
      ...paymentModalDeduction,
      paidAmount: newPaid,
      status: isFinished ? "completed" : paymentModalDeduction.status,
    };

    if (onUpdateLegalDeduction) onUpdateLegalDeduction(updated);

    if (isFinished) {
      processDebtCompletionAndQueue(updated);
    } else {
      showToast(
        `💳 ${paymentModalDeduction.fileNumber} dosyasına ₺${Number(paymentAmountInput).toLocaleString("tr-TR")} ödeme işlendi. Kalan Borç: ₺${Math.max(0, paymentModalDeduction.totalDebtAmount - newPaid).toLocaleString("tr-TR")}`
      );
    }

    setIsPaymentModalOpen(false);
    setPaymentModalDeduction(null);
    setPaymentAmountInput(0);
  };

  // Editable Payroll Handlers
  const handleOpenEditPayroll = (emp: Employee) => {
    const autoAdv = getAutoAdvanceForEmployee(emp.id);
    const autoLvs = getAutoLeavesForEmployee(emp.id);
    const existing = payrollCustomizations[emp.id] || {};

    setEditingPayrollEmp(emp);
    setEditingPayrollForm({
      salaryType: existing.salaryType ?? emp.salaryType,
      baseSalary: existing.baseSalary ?? emp.salaryAmount,
      bonusAmount: existing.bonusAmount ?? 0,
      overtimePay: existing.overtimePay ?? 0,
      foodAllowance: existing.foodAllowance ?? (emp.foodAllowance || 0),
      roadAllowance: existing.roadAllowance ?? (emp.roadAllowance || 0),
      advanceDeduction: existing.advanceDeduction !== undefined ? existing.advanceDeduction : autoAdv.totalAdvance,
      unpaidLeaveDays: existing.unpaidLeaveDays !== undefined ? existing.unpaidLeaveDays : autoLvs.unpaidDays,
      besDeduction: existing.besDeduction !== undefined ? existing.besDeduction : (emp.hasBes ? Math.round((emp.salaryAmount * (emp.salaryType === "net" ? 1.38 : 1)) * 0.03) : 0),
      executionDeduction: existing.executionDeduction ?? 0,
      alimonyDeduction: existing.alimonyDeduction ?? 0,
      otherDeductions: existing.otherDeductions ?? 0,
      notes: existing.notes ?? "",
    });
  };

  const handleSaveEditPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayrollEmp) return;

    setPayrollCustomizations((prev) => ({
      ...prev,
      [editingPayrollEmp.id]: {
        ...editingPayrollForm,
        isCustomized: true,
      },
    }));

    setEditingPayrollEmp(null);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs">
        {/* Lila Bal Peteği Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Geometrik Vektör Şekiller */}
        <svg
          className="absolute -right-6 -bottom-10 w-48 h-48 pointer-events-none text-purple-400/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="100,35 155,67 155,133 100,165 45,133 45,67" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="55" x2="180" y2="145" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="145" x2="180" y2="55" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        </svg>

        <svg
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-500/20"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-purple-100/90 text-purple-900 border border-purple-300/80 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                İnsan Kaynakları & Personel Yönetimi
              </span>
              <span className="bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                SGK & Bordro Uyumlu
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-slate-950 flex items-center gap-2">
              <span>Personel, Bordro ve Özlük Takibi</span>
            </h1>
            <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed max-w-2xl">
              Çalışan özlük dosyaları, kanuni SGK bordro matrahları, yıllık izin hakkı ve masraf/avans taleplerini tek ekrandan yönetin.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAddEmployeeOpen(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Yeni Personel Ekle
            </button>
            <button
              onClick={() => setIsAddLeaveOpen(true)}
              className="bg-white hover:bg-purple-50 text-purple-950 border border-purple-200/80 font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-purple-700" />
              İzin Talebi
            </button>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-purple-200/60 relative z-10">
          <div className="bg-white/80 backdrop-blur-xs border border-purple-200/70 rounded-xl p-3.5 shadow-2xs">
            <div className="text-purple-900 text-xs font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-700" /> Toplam Kadro
            </div>
            <div className="text-xl font-black text-slate-950 mt-1">{employees.length} Çalışan</div>
            <div className="text-[11px] text-emerald-700 mt-0.5 font-bold">{activeCount} Aktif · {onLeaveCount} İzinli</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs border border-purple-200/70 rounded-xl p-3.5 shadow-2xs">
            <div className="text-purple-900 text-xs font-bold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Aylık Net Maaş Toplamı
            </div>
            <div className="text-xl font-black text-slate-950 mt-1">
              ₺{totalMonthlyNetSalary.toLocaleString("tr-TR")}
            </div>
            <div className="text-[11px] text-purple-900/70 font-semibold mt-0.5">Net ödenen toplam personel hakedişi</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs border border-purple-200/70 rounded-xl p-3.5 shadow-2xs">
            <div className="text-purple-900 text-xs font-bold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-amber-600" /> Toplam İşveren Maliyeti
            </div>
            <div className="text-xl font-black text-slate-950 mt-1">
              ₺{totalEmployerMonthlyCost.toLocaleString("tr-TR")}
            </div>
            <div className="text-[11px] text-purple-900/70 font-semibold mt-0.5">Maaş + SGK İşveren + Yan Haklar</div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs border border-purple-200/70 rounded-xl p-3.5 shadow-2xs">
            <div className="text-purple-900 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" /> SGK İşyeri Dosyası
            </div>
            <div className="text-xs font-bold text-slate-950 mt-1 truncate">
              {companySettings.sgkCredentials?.workplaceRegistrationNo || "SGK Sicil Tanımlı"}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5 font-bold">5510 %5 Teşvik Aktif</div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-1.5 border border-purple-200/60 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setActiveSubTab("employees")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "employees"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-purple-950/80 hover:text-purple-950 hover:bg-purple-50/60"
            }`}
          >
            <Users className="w-4 h-4" />
            Personel Listesi ({employees.length})
          </button>

          <button
            onClick={() => setActiveSubTab("payroll")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "payroll"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-purple-950/80 hover:text-purple-950 hover:bg-purple-50/60"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Bordro & Maaş Hesaplama
          </button>

          <button
            onClick={() => setActiveSubTab("leaves")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "leaves"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-purple-950/80 hover:text-purple-950 hover:bg-purple-50/60"
            }`}
          >
            <Calendar className="w-4 h-4" />
            İzin Yönetimi ({leaveRequests.length})
          </button>

          <button
            onClick={() => setActiveSubTab("advances")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "advances"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-purple-950/80 hover:text-purple-950 hover:bg-purple-50/60"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Avans & Masraflar ({advanceRequests.length})
          </button>

          <button
            onClick={() => setActiveSubTab("sgk")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "sgk"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-purple-950/80 hover:text-purple-950 hover:bg-purple-50/60"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            SGK & Özlük Belgeleri
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PERSONEL LISTESI */}
      {activeSubTab === "employees" && (
        <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
          {/* Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ad Soyad, TCKN veya Unvan ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-white border border-purple-200/60 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all">Tüm Departmanlar</option>
                <option value="Yazılım & IT">Yazılım & IT</option>
                <option value="Muhasebe & Finans">Muhasebe & Finans</option>
                <option value="Satış & Pazarlama">Satış & Pazarlama</option>
                <option value="İnsan Kaynakları">İnsan Kaynakları</option>
                <option value="Operasyon & Lojistik">Operasyon & Lojistik</option>
              </select>

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white border border-purple-200/60 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all">Tüm Şubeler</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-white border border-purple-200/60 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all">Tüm Depolar</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-purple-200/60 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="on_leave">İzinli</option>
                <option value="terminated">Ayrıldı</option>
              </select>

              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs text-purple-900/80 font-semibold bg-purple-50/60 px-3 py-2 rounded-xl border border-purple-200/50 whitespace-nowrap">
                  Toplam <span className="font-bold text-purple-950">{filteredEmployees.length}</span> personel
                </div>
                <ExportButtons
                  getExportData={() => ({
                    filename: `Personel_Listesi_${new Date().toISOString().split("T")[0]}`,
                    title: "İNSAN KAYNAKLARI - PERSONEL LİSTESİ",
                    subtitle: `Toplam ${filteredEmployees.length} Çalışan Kaydı`,
                    headers: [
                      "TCKN",
                      "Ad Soyad",
                      "Departman",
                      "Unvan / Görev",
                      "SGK Meslek Kodu",
                      "İşe Giriş Tarihi",
                      "Telefon",
                      "E-Posta",
                      "Net Maaş",
                      "Brüt Maaş",
                      "Para Birimi",
                      "SGK Sicil No",
                      "Çalışma Durumu",
                    ],
                    rows: filteredEmployees.map((e) => [
                      e.tcNo || "-",
                      `${e.firstName} ${e.lastName}`,
                      e.department || "-",
                      e.title || "-",
                      e.sgkOccupationCode || "-",
                      e.startDate || "-",
                      e.phone || "-",
                      e.email || "-",
                      formatCurrency(e.salary || 0, "TRY"),
                      formatCurrency(e.grossSalary || 0, "TRY"),
                      "TRY",
                      e.sgkNo || "-",
                      e.status === "active" ? "Aktif Çalışan" : e.status === "on_leave" ? "İzinli" : "Ayrıldı",
                    ]),
                  })}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[800px]">
              <thead>
                <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="pb-2 px-3">Çalışan Bilgisi</th>
                  <th className="pb-2 px-3">Departman & Unvan</th>
                  <th className="pb-2 px-3">İşe Giriş Tarihi</th>
                  <th className="pb-2 px-3">Anlaşma & Maaş</th>
                  <th className="pb-2 px-3">İzin Hakkı</th>
                  <th className="pb-2 px-3">Durum</th>
                  <th className="pb-2 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-sm border border-purple-200 overflow-hidden shrink-0">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                          ) : (
                            emp.fullName.split(" ").map((n) => n[0]).join("")
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-purple-950 text-sm flex items-center gap-1.5 wrap flex-wrap">
                            <span>{emp.fullName}</span>
                            {calculateAge(emp.birthDate) !== null && (
                              <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {calculateAge(emp.birthDate)} Yaş
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>TCKN: {emp.tckn}</span>
                            {calculateAge(emp.birthDate) !== null && calculateAge(emp.birthDate)! < 18 && (
                              <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md border border-rose-200">
                                18 Yaş Altı
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-semibold text-slate-800">{emp.title}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="inline-block bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-100">
                          {emp.department}
                        </span>
                        {emp.branchName && (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-200">
                            <Store className="w-3 h-3 text-indigo-600" />
                            {emp.branchName}
                          </span>
                        )}
                        {emp.warehouseName && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-amber-200">
                            <WarehouseIcon className="w-3 h-3 text-amber-600" />
                            {emp.warehouseName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-slate-600 text-xs font-semibold">
                      {new Date(emp.startDate).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-bold text-slate-900">
                        ₺{emp.salaryAmount.toLocaleString("tr-TR")}
                        <span className="text-[10px] text-slate-500 uppercase ml-1">
                          ({emp.salaryType})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Yemek: ₺{emp.foodAllowance || 0} · Yol: ₺{emp.roadAllowance || 0}
                      </div>
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="text-xs font-bold text-slate-800">
                        Kalan: {emp.annualLeaveAllowance - emp.usedAnnualLeave} Gün
                      </div>
                      <div className="w-24 bg-purple-100/60 rounded-full h-1.5 mt-1 overflow-hidden border border-purple-200/40">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, ((emp.annualLeaveAllowance - emp.usedAnnualLeave) / emp.annualLeaveAllowance) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {emp.status === "active" && (
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </span>
                      )}
                      {emp.status === "on_leave" && (
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full">
                          İzinli
                        </span>
                      )}
                      {emp.status === "terminated" && (
                        <span className="bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-full">
                          Ayrıldı
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-right">
                      <button
                        onClick={() => setSelectedEmployeeForDetail(emp)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/70 font-bold px-3 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-700" />
                        Özlük Detayı
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      Aranan kriterlere uygun personel kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BORDRO & MAAŞ HESAPLAMA */}
      {activeSubTab === "payroll" && (
        <div className="space-y-4">
          {/* Top KPI Cards for Payroll Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Toplam Brüt Maaş Yükü</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                ₺{payrollRecords.reduce((sum, r) => sum + r.grossSalary, 0).toLocaleString("tr-TR")}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Bordro dönemindeki toplam brüt hakediş</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Toplam Net Ödenecek Maaş</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">
                ₺{payrollRecords.reduce((sum, r) => sum + r.payableNetSalary, 0).toLocaleString("tr-TR")}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Avans & Kesintiler Düşülmüş Net Tutar</span>
            </div>

            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Entegre Avans Kesintileri</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">
                ₺{payrollRecords.reduce((sum, r) => sum + (r.advanceDeduction || 0), 0).toLocaleString("tr-TR")}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Avans Yönetiminden Otomatik Aktarıldı</span>
            </div>

            <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 shadow-xs">
              <span className="text-[11px] font-bold text-purple-900 uppercase block">Toplam İşveren Maliyeti</span>
              <span className="text-xl font-black text-purple-950 mt-1 block">
                ₺{totalEmployerMonthlyCost.toLocaleString("tr-TR")}
              </span>
              <span className="text-[11px] text-purple-800 font-medium">SGK İşveren + Yan Haklar Dahil</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-purple-950 uppercase">Hakediş & Bordro Dönemi:</label>
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="bg-white border border-purple-200/60 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-3">
                <ExportButtons
                  getExportData={() => ({
                    filename: `Bordro_Icmali_${payrollMonth}_${new Date().toISOString().split("T")[0]}`,
                    title: `BORDRO İCMALİ VE HAKEDİŞ LİSTESİ (${payrollMonth})`,
                    subtitle: `Toplam ${payrollRecords.length} Personel Bordro Hesabı`,
                    headers: [
                      "Personel Ad Soyad",
                      "Departman",
                      "Brüt Maaş",
                      "SGK İşçi Payı",
                      "Gelir Vergisi",
                      "Damga Vergisi",
                      "Avans Kesintisi",
                      "Nafaka/İcra Kesintisi",
                      "Net Ödenen Maaş",
                      "İşveren Toplam Maliyeti",
                    ],
                    rows: payrollRecords.map((r) => [
                      r.employeeName,
                      r.department || "-",
                      formatCurrency(r.grossSalary || 0, "TRY"),
                      formatCurrency(r.sgkEmployeeShare || 0, "TRY"),
                      formatCurrency(r.incomeTax || 0, "TRY"),
                      formatCurrency(r.stampTax || 0, "TRY"),
                      formatCurrency(r.advanceDeduction || 0, "TRY"),
                      formatCurrency(r.legalGarnishDeduction || 0, "TRY"),
                      formatCurrency(r.netPaid || 0, "TRY"),
                      formatCurrency(r.employerTotalCost || 0, "TRY"),
                    ]),
                  })}
                  size="sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
              <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[900px]">
                <thead>
                  <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="pb-2 px-3">Personel</th>
                    <th className="pb-2 px-3">Brüt Ücret</th>
                    <th className="pb-2 px-3">Yasal Kesinti (SGK+Vergi)</th>
                    <th className="pb-2 px-3 text-amber-900">Entegre Avans Kesintisi</th>
                    <th className="pb-2 px-3">Ücretsiz İzin / Eksik Gün</th>
                    <th className="pb-2 px-3 text-rose-900">İcra / Nafaka / Kesinti</th>
                    <th className="pb-2 px-3 text-emerald-900 font-extrabold">Net Ele Geçen</th>
                    <th className="pb-2 px-3 text-purple-950 font-black">Toplam Maliyet</th>
                    <th className="pb-2 px-3 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.map((rec) => {
                    const empObj = employees.find((e) => e.id === rec.employeeId);
                    const totalLegalDeductions = rec.sgkEmployeeShare + rec.unemploymentEmployeeShare + rec.incomeTax + rec.stampTax;

                    return (
                      <tr
                        key={rec.id}
                        className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                      >
                        <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <div className="font-bold text-slate-900 group-hover:text-purple-950 text-sm flex items-center gap-1.5">
                            <span>{rec.employeeName}</span>
                            {rec.isCustomized && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-purple-200">
                                Düzenlendi
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{rec.department}</div>
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-bold text-slate-800">
                          ₺{rec.grossSalary.toLocaleString("tr-TR")}
                          {Boolean(rec.bonusAmount || rec.overtimePay) && (
                            <div className="text-[10px] text-emerald-600 font-medium">
                              +{((rec.bonusAmount || 0) + (rec.overtimePay || 0)).toLocaleString("tr-TR")} ₺ Ek
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-slate-600">
                          <div>₺{totalLegalDeductions.toLocaleString("tr-TR")}</div>
                          <div className="text-[10px] text-slate-400">SGK: ₺{rec.sgkEmployeeShare.toLocaleString("tr-TR")} · GV: ₺{rec.incomeTax.toLocaleString("tr-TR")}</div>
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {rec.advanceDeduction && rec.advanceDeduction > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100/80 text-amber-900 font-bold px-2 py-1 rounded-lg border border-amber-300 text-xs">
                              <Receipt className="w-3 h-3 text-amber-700" />
                              -₺{rec.advanceDeduction.toLocaleString("tr-TR")}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {rec.unpaidLeaveDays && rec.unpaidLeaveDays > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 font-bold px-2 py-1 rounded-lg border border-rose-200 text-xs">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              {rec.unpaidLeaveDays} Gün (-₺{(rec.unpaidLeaveDeduction || 0).toLocaleString("tr-TR")})
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {Boolean((rec.executionDeduction || 0) + (rec.alimonyDeduction || 0) + (rec.otherDeductions || 0)) ? (
                            <div className="space-y-1">
                              {Boolean(rec.executionDeduction) && (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded-md border border-red-200 text-[11px] block w-fit">
                                  İcra: -₺{rec.executionDeduction?.toLocaleString("tr-TR")}
                                </span>
                              )}
                              {Boolean(rec.alimonyDeduction) && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md border border-purple-200 text-[11px] block w-fit">
                                  Nafaka: -₺{rec.alimonyDeduction?.toLocaleString("tr-TR")}
                                </span>
                              )}
                              {Boolean(rec.otherDeductions) && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200 text-[11px] block w-fit">
                                  Diğer: -₺{rec.otherDeductions?.toLocaleString("tr-TR")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-black text-emerald-800 text-sm">
                          ₺{rec.payableNetSalary.toLocaleString("tr-TR")}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-black text-purple-950 text-sm">
                          ₺{rec.totalEmployerCost.toLocaleString("tr-TR")}
                        </td>

                        <td className="py-3 px-3 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {empObj && (
                              <button
                                onClick={() => handleOpenEditPayroll(empObj)}
                                className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Bordro ve Maaş Kesintilerini Düzenle"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Düzenle
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedPayrollRecord(rec)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200/70 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Bordro Pusulası Görüntüle ve Yazdır"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Pusula
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: IZIN YONETIMI */}
      {activeSubTab === "leaves" && (
        <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-purple-900/80 font-semibold bg-purple-50/60 px-3 py-1.5 rounded-xl border border-purple-200/50">
                İzin Talepleri ve Yıllık İzin Hakları ({leaveRequests.length})
              </div>
              <ExportButtons
                getExportData={() => ({
                  filename: `Izin_Talepleri_${new Date().toISOString().split("T")[0]}`,
                  title: "İNSAN KAYNAKLARI - İZİN TALEPLERİ LİSTESİ",
                  subtitle: `Toplam ${leaveRequests.length} İzin Kaydı`,
                  headers: ["Personel Adı", "İzin Türü", "Başlangıç Tarihi", "Bitiş Tarihi", "Gün Sayısı", "Durum", "Açıklama"],
                  rows: leaveRequests.map((l) => [
                    l.employeeName,
                    l.leaveType === "annual" ? "Yıllık İzin" : l.leaveType === "sick" ? "Raporlu / Sağlık" : l.leaveType === "unpaid" ? "Ücretsiz İzin" : "Mazeret İzni",
                    l.startDate,
                    l.endDate,
                    l.daysCount,
                    l.status === "approved" ? "Onaylandı" : l.status === "rejected" ? "Reddedildi" : "Onay Bekliyor",
                    l.description || "-",
                  ]),
                })}
                size="sm"
              />
            </div>
            <button
              onClick={() => setIsAddLeaveOpen(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni İzin Talebi
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[750px]">
              <thead>
                <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="pb-2 px-3">Çalışan</th>
                  <th className="pb-2 px-3">İzin Türü</th>
                  <th className="pb-2 px-3">Tarih Aralığı</th>
                  <th className="pb-2 px-3">Gün</th>
                  <th className="pb-2 px-3">Açıklama</th>
                  <th className="pb-2 px-3">Durum</th>
                  <th className="pb-2 px-3 text-right">Onay İşlemi</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-bold text-slate-900 group-hover:text-purple-950">
                      {req.employeeName}
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-bold text-purple-950 text-xs">{req.type}</div>
                      {req.type === "Ücretsiz İzin" || req.type === "Mazeretsiz İzin" ? (
                        <span className="inline-block mt-0.5 text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                          Maaştan Kesilir ({req.daysCount} Gün)
                        </span>
                      ) : req.type === "Sıhhi İzin" || req.type === "Hastalık/Rapor" ? (
                        req.daysCount > 2 ? (
                          <span className="inline-block mt-0.5 text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                            Maaştan Kesilir ({req.daysCount - 2} Gün Kesintili)
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                            Ücretli (2 Güne Kadar)
                          </span>
                        )
                      ) : (
                        <span className="inline-block mt-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                          Ücretli İzin (Kesintisiz)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-xs font-semibold text-slate-700">
                      {req.startDate} — {req.endDate}
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-bold text-slate-800">
                      {req.daysCount} Gün
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-slate-600 text-xs">
                      {req.reason || "—"}
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {req.status === "approved" && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                          Onaylandı
                        </span>
                      )}
                      {req.status === "pending" && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                          Bekliyor
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full">
                          Reddedildi
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-right">
                      {req.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onUpdateLeaveStatus(req.id, "approved")}
                            className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-xl text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => onUpdateLeaveStatus(req.id, "rejected")}
                            className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded-xl text-xs hover:bg-rose-700 transition-all cursor-pointer shadow-2xs"
                          >
                            Reddet
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AVANS, MASRAFLAR VE YASAL KESİNTİLER */}
      {activeSubTab === "advances" && (
        <div className="space-y-4">
          {/* Toast Notification Banner */}
          {toastNotification && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn border border-emerald-500">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
                <span className="font-bold text-sm">{toastNotification}</span>
              </div>
              <button
                onClick={() => setToastNotification(null)}
                className="text-emerald-200 hover:text-white font-black text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Inner Sub-Tab Switching Buttons */}
          <div className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-purple-200/60 shadow-2xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAdvanceInnerTab("requests")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  advanceInnerTab === "requests"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "text-purple-950/80 hover:text-purple-950 hover:bg-purple-50/60"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Avans & Masraf Talepleri ({advanceRequests.length})
              </button>

              <button
                onClick={() => setAdvanceInnerTab("legal_deductions")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  advanceInnerTab === "legal_deductions"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "text-purple-950/80 hover:text-purple-950 hover:bg-purple-50/60"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Kesintiler Bölümü (İcra & Nafaka) ({legalDeductions.length})
              </button>
            </div>

            {advanceInnerTab === "requests" ? (
              <div className="flex items-center gap-2">
                <ExportButtons
                  getExportData={() => ({
                    filename: `Avans_Masraf_Talepleri_${new Date().toISOString().split("T")[0]}`,
                    title: "İNSAN KAYNAKLARI - AVANS & MASRAF TALEPLERİ LİSTESİ",
                    subtitle: `Toplam ${advanceRequests.length} Talep Kaydı`,
                    headers: ["Personel Adı", "Talep Türü", "Talep Tarihi", "Tutar", "Para Birimi", "Durum", "Açıklama"],
                    rows: advanceRequests.map((a) => [
                      a.employeeName,
                      a.type === "advance" ? "Maaş Avansı" : "Saha Masrafı",
                      a.requestDate,
                      formatCurrency(a.amount || 0, "TRY"),
                      "TRY",
                      a.status === "approved" ? "Onaylandı" : a.status === "rejected" ? "Reddedildi" : "Beklemede",
                      a.description || "-",
                    ]),
                  })}
                  size="sm"
                />
                <button
                  onClick={() => setIsAddAdvanceOpen(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Yeni Talep Ekle
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ExportButtons
                  getExportData={() => ({
                    filename: `Yasal_Kesintiler_Icra_Nafaka_${new Date().toISOString().split("T")[0]}`,
                    title: "İNSAN KAYNAKLARI - YASAL KESİNTİLER (İCRA & NAFAKA)",
                    subtitle: `Toplam ${legalDeductions.length} Kesinti Kaydı`,
                    headers: ["Personel Adı", "Kesinti Türü", "İcra Dairesi / Dosya No", "Toplam Borç", "Aylık Kesinti", "Kalan Borç", "Para Birimi", "Durum"],
                    rows: legalDeductions.map((d) => [
                      d.employeeName,
                      d.type === "icra" ? "İcra Takibi" : d.type === "nafaka" ? "Nafaka" : "Diğer Yasal Kesinti",
                      d.fileNo || "-",
                      formatCurrency(d.totalAmount || 0, "TRY"),
                      formatCurrency(d.monthlyAmount || 0, "TRY"),
                      formatCurrency(d.remainingAmount || 0, "TRY"),
                      "TRY",
                      d.status === "active" ? "Devam Ediyor" : "Tamamlandı",
                    ]),
                  })}
                  size="sm"
                />
                <button
                  onClick={handleOpenAddLegalDeduction}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Yeni Yasal Kesinti Ekle
                </button>
              </div>
            )}
          </div>

          {/* INNER VIEW 1: AVANS & MASRAF TALEPLERİ */}
          {advanceInnerTab === "requests" && (
            <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
              <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
                <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[750px]">
                  <thead>
                    <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="pb-2 px-3">Çalışan</th>
                      <th className="pb-2 px-3">Tür</th>
                      <th className="pb-2 px-3">Tutar</th>
                      <th className="pb-2 px-3">Talep Tarihi</th>
                      <th className="pb-2 px-3">Açıklama</th>
                      <th className="pb-2 px-3">Durum</th>
                      <th className="pb-2 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advanceRequests.map((adv) => (
                      <tr
                        key={adv.id}
                        className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                      >
                        <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-bold text-slate-900 group-hover:text-purple-950">
                          {adv.employeeName}
                        </td>
                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-semibold text-purple-900">
                          {adv.type}
                        </td>
                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-black text-slate-900">
                          ₺{adv.amount.toLocaleString("tr-TR")}
                        </td>
                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-xs font-semibold text-slate-700">
                          {adv.requestDate}
                        </td>
                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-xs text-slate-600">
                          {adv.description || "—"}
                        </td>
                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {adv.status === "paid" && (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                              Ödendi
                            </span>
                          )}
                          {adv.status === "pending" && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                              Onay Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-right">
                          {adv.status === "pending" && (
                            <button
                              onClick={() => onUpdateAdvanceStatus(adv.id, "paid")}
                              className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                            >
                              Ödemeyi Onayla
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INNER VIEW 2: YASAL KESİNTİLER BÖLÜMÜ (İCRA & NAFAKA TAKİBİ) */}
          {advanceInnerTab === "legal_deductions" && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/30">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800 uppercase">
                    <span>Aktif İcra Kesintileri</span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {legalDeductions.filter((d) => d.type === "İcra Kesintisi" && d.status === "active").length} Dosya
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Aktif maaş kesintisi yapılan icra dosyaları
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-purple-200 bg-purple-50/30">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-800 uppercase">
                    <span>Aktif Nafaka Kesintileri</span>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {legalDeductions.filter((d) => d.type === "Nafaka Kesintisi" && d.status === "active").length} Dosya
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Maaştan düzenli düşülen nafaka kararları
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/30">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase">
                    <span>Sırada Bekleyen İcralar</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {legalDeductions.filter((d) => d.status === "queued").length} Dosya
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    1. sıra bitince otomatikleştirecek sıradaki dosyalar
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                    <span>Toplam Takipteki Borç</span>
                    <DollarSign className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    ₺
                    {legalDeductions
                      .filter((d) => d.status === "active" || d.status === "queued")
                      .reduce((sum, d) => sum + Math.max(0, d.totalDebtAmount - d.paidAmount), 0)
                      .toLocaleString("tr-TR")}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Aktif & Sıradaki dosyalarda kalan bakiye
                  </div>
                </div>
              </div>

              {/* Deductions Main Table */}
              <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Personel İcra, Nafaka ve Yasal Kesinti Dosyaları Listesi
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      1. sıradaki icra borcu bittiğinde sıradaki dosya otomatik olarak 1. sıraya alınır ve bordroya yansıtılır.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
                  <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[800px]">
                    <thead>
                      <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="pb-2 px-3">Çalışan</th>
                        <th className="pb-2 px-3">Kesinti Türü & Dosya No</th>
                        <th className="pb-2 px-3">Yatırılacağı IBAN & Alacaklı</th>
                        <th className="pb-2 px-3">Sıra & Tutar Tipi</th>
                        <th className="pb-2 px-3">Borç & Ödeme Durumu</th>
                        <th className="pb-2 px-3">Durum</th>
                        <th className="pb-2 px-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {legalDeductions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                            Henüz yasal kesinti (icra veya nafaka) kaydı bulunmamaktadır.
                          </td>
                        </tr>
                      ) : (
                        legalDeductions.map((ded) => {
                          const remainingDebt = Math.max(0, ded.totalDebtAmount - ded.paidAmount);
                          const progress = ded.totalDebtAmount > 0 ? Math.min(100, Math.round((ded.paidAmount / ded.totalDebtAmount) * 100)) : 0;

                          return (
                            <tr
                              key={ded.id}
                              className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                            >
                              <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-bold text-slate-900 group-hover:text-purple-950">
                                <div>{ded.employeeName}</div>
                              </td>

                              <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                                <div className="flex items-center gap-2 mb-1">
                                  {ded.type === "İcra Kesintisi" && (
                                    <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-rose-200">
                                      İcra Kesintisi
                                    </span>
                                  )}
                                  {ded.type === "Nafaka Kesintisi" && (
                                    <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-purple-200">
                                      Nafaka Kesintisi
                                    </span>
                                  )}
                                  {ded.type === "Diğer Yasal Kesinti" && (
                                    <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                      Diğer Kesinti
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-slate-900 text-xs font-mono">
                                  {ded.fileNumber}
                                </div>
                              </td>

                              <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                                <div className="font-mono text-xs text-slate-900 font-bold bg-purple-50/50 px-2 py-1 rounded-lg border border-purple-200/60 inline-block">
                                  {ded.iban}
                                </div>
                                {ded.creditorName && (
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    Alacaklı: <span className="font-semibold text-slate-700">{ded.creditorName}</span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                                <div className="text-xs font-bold text-slate-800">
                                  {ded.status === "active" && (
                                    <span className="text-emerald-700 font-black flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> 1. Sıra (Aktif Kesinti)
                                    </span>
                                  )}
                                  {ded.status === "queued" && (
                                    <span className="text-amber-700 font-bold flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" /> {ded.priorityOrder}. Sıra (Beklemede)
                                    </span>
                                  )}
                                  {ded.status === "completed" && (
                                    <span className="text-slate-500 font-medium">Borç Bitti (Sıradan Çıkarıldı)</span>
                                  )}
                                  {ded.status === "passive" && <span className="text-slate-400">Pasif</span>}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  {ded.calculationType === "quarter_salary" ? "Maaşın 1/4'ü (%25)" : `Sabit ₺${(ded.monthlyAmount || 0).toLocaleString("tr-TR")}`}
                                </div>
                              </td>

                              <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                                {ded.totalDebtAmount > 0 ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500">Borç: ₺{ded.totalDebtAmount.toLocaleString("tr-TR")}</span>
                                      <span className="font-extrabold text-slate-900">
                                        Kalan: ₺{remainingDebt.toLocaleString("tr-TR")}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className={`h-full transition-all ${
                                          ded.status === "completed"
                                            ? "bg-slate-400"
                                            : ded.status === "active"
                                            ? "bg-rose-500"
                                            : "bg-amber-500"
                                        }`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <div className="text-[10px] text-slate-400 text-right">Ödenen: ₺{ded.paidAmount.toLocaleString("tr-TR")} ({progress}%)</div>
                                  </div>
                                ) : (
                                  <div className="text-xs font-semibold text-purple-700">
                                    Aylık Sabit: ₺{(ded.monthlyAmount || 0).toLocaleString("tr-TR")} (Sürekli)
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                                {ded.status === "active" && (
                                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                    Aktif Kesiliyor
                                  </span>
                                )}
                                {ded.status === "queued" && (
                                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                    Sırada Bekliyor
                                  </span>
                                )}
                                {ded.status === "completed" && (
                                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                    Borç Bitti
                                  </span>
                                )}
                                {ded.status === "passive" && (
                                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full">
                                    Pasif
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {ded.status !== "completed" && (
                                    <button
                                      onClick={() => {
                                        setPaymentModalDeduction(ded);
                                        setPaymentAmountInput(ded.monthlyAmount || Math.round(remainingDebt / 4) || remainingDebt);
                                        setIsPaymentModalOpen(true);
                                      }}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-emerald-200 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="Ödeme İşle veya Borç Düşüşü Yap"
                                    >
                                      <DollarSign className="w-3.5 h-3.5" />
                                      Ödeme İşle
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleOpenEditLegalDeduction(ded)}
                                    className="p-1.5 hover:bg-purple-100/70 rounded-lg text-purple-900 transition-colors cursor-pointer"
                                    title="Kesinti Detaylarını Düzenle"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  {onDeleteLegalDeduction && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`"${ded.fileNumber}" kesinti kaydını silmek istediğinize emin misiniz?`)) {
                                          onDeleteLegalDeduction(ded.id);
                                          showToast(`"${ded.fileNumber}" kesinti kaydı silindi.`);
                                        }
                                      }}
                                      className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors cursor-pointer"
                                      title="Sil"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: SGK & OZLUK BELGELERI */}
      {activeSubTab === "sgk" && (
        <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-purple-200/60 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  SGK İşyeri Sicil ve e-Bildirge Durumu
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-purple-200/50 shadow-2xs">
                    <div className="text-xs text-purple-950/70 font-semibold">SGK İşyeri Sicil Numarası</div>
                    <div className="text-sm font-black text-slate-950 font-mono mt-1">
                      {companySettings.sgkCredentials?.workplaceRegistrationNo || "2.8470.01.01.1029384.034.01-12"}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-purple-200/50 shadow-2xs">
                    <div className="text-xs text-purple-950/70 font-semibold">e-Bildirge Kullanıcı Kodu</div>
                    <div className="text-sm font-black text-slate-950 font-mono mt-1">
                      {companySettings.sgkCredentials?.userCode || "28470291038"}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50/80 rounded-xl border border-purple-200/70 text-purple-950 text-xs space-y-1 shadow-2xs">
                  <div className="font-bold flex items-center gap-1.5 text-purple-950">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    5510 Sayılı Kanun %5 Hazine Teşviki Durumu:
                  </div>
                  <p className="text-purple-900/90 font-medium">
                    Şirketinizin SGK prim borcu bulunmadığı için aylık Muhtasar ve Prim Hizmet Beyannamesinde %5 malullük, yaşlılık ve ölüm sigortası primi indiriminden faydalanılmaktadır.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/60 rounded-2xl p-5 border border-purple-200/60 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-purple-700" />
                  Standart Özlük Dosyası Evrak Kontrol Listesi
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-slate-800">
                  <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> T.C. Kimlik Kartı Fotokopisi
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Yerleşim Yeri (İkametgah) Belgesi
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Adli Sicil Kaydı (E-Devlet)
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Sağlık Raporu (Akciğer Grafisi vb.)
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> SGK İşe Giriş Bildirgesi
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> İş Sözleşmesi (Belirsiz Süreli)
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50/60 rounded-2xl p-5 border border-purple-200/60 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  İşten Çıkış Kodları (SGK Referans)
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <span className="font-extrabold text-purple-900">Kod 03:</span> Belirsiz süreli sözleşmenin işçi tarafından feshi (İstifa)
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <span className="font-extrabold text-purple-900">Kod 04:</span> Belirsiz süreli sözleşmenin işveren tarafından feshi
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-purple-200/50 shadow-2xs">
                    <span className="font-extrabold text-purple-900">Kod 22:</span> Diğer nedenler
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YENI PERSONEL EKLE */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Yeni Personel Kartı Oluştur</h3>
                <p className="text-xs text-slate-500">Çalışanın kişisel, özlük ve maaş bilgilerini eksiksiz girin.</p>
              </div>
              <button
                onClick={() => setIsAddEmployeeOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-4">
              {/* Photo Upload Header */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="relative w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-purple-400 shrink-0 shadow-xs">
                  {newEmpForm.photoUrl ? (
                    <img src={newEmpForm.photoUrl} alt="Vesikalık" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Personel Vesikalık Fotoğrafı</label>
                  <div className="flex items-center gap-2">
                    <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
                      <Camera className="w-3.5 h-3.5" />
                      Fotoğraf Yükle
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {newEmpForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setNewEmpForm({ ...newEmpForm, photoUrl: "" })}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
                      >
                        Fotoğrafı Kaldır
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">PNG, JPG veya WEBP formatında profil fotoğrafı yükleyebilirsiniz.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    placeholder="ör: Ahmet Yılmaz"
                    value={newEmpForm.fullName}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">T.C. Kimlik No (TCKN) *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="11 haneli TCKN"
                    value={newEmpForm.tckn}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, tckn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefon Numarası</label>
                  <input
                    type="tel"
                    placeholder="0532 000 00 00"
                    value={newEmpForm.phone}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-Posta Adresi</label>
                  <input
                    type="email"
                    placeholder="ör: ahmet@sirket.com"
                    value={newEmpForm.email}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900"
                  />
                </div>

                {/* Birth Date with 18 Year Old Warning */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={newEmpForm.birthDate}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, birthDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900"
                  />
                  {newEmpForm.birthDate && calculateAge(newEmpForm.birthDate) !== null && (
                    calculateAge(newEmpForm.birthDate)! < 18 ? (
                      <div className="mt-2.5 bg-rose-50 border border-rose-300 p-3 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs shadow-xs animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold block text-rose-900 text-xs">⚠️ UYARI: Çalışan 18 Yaşından Küçüktür! ({calculateAge(newEmpForm.birthDate)} Yaşında)</span>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-rose-800">
                            4857 Sayılı İş Kanunu uyarınca 18 yaşını doldurmamış çocuk ve genç işçilerin çalıştırılmasında veli/vasi muvafakatnamesi, sağlık raporu ve yasal çalışma süresi sınırlarına (günlük azami 7-8 saat) uyulması zorunludur.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-700 mt-1 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Hesaplanan Yaş: {calculateAge(newEmpForm.birthDate)} yaşında (Reşit)
                      </p>
                    )
                  )}
                </div>

                {/* Home Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ev / İkametgah Adresi</label>
                  <textarea
                    rows={2}
                    placeholder="Mahalle, cadde, sokak, dış kapı/daire no, ilçe ve il bilgisi..."
                    value={newEmpForm.homeAddress}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, homeAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unvan / Görevi</label>
                  <input
                    type="text"
                    placeholder="ör: Kıdemli Muhasebe Uzmanı"
                    value={newEmpForm.title}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departman</label>
                  <select
                    value={newEmpForm.department}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold cursor-pointer"
                  >
                    <option value="Yazılım & IT">Yazılım & IT</option>
                    <option value="Muhasebe & Finans">Muhasebe & Finans</option>
                    <option value="Satış & Pazarlama">Satış & Pazarlama</option>
                    <option value="İnsan Kaynakları">İnsan Kaynakları</option>
                    <option value="Operasyon & Lojistik">Operasyon & Lojistik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bağlı Olduğu Şube</label>
                  <select
                    value={newEmpForm.branchId || ""}
                    onChange={(e) => {
                      const selectedBr = branches.find((b) => b.id === e.target.value);
                      setNewEmpForm({
                        ...newEmpForm,
                        branchId: e.target.value,
                        branchName: selectedBr ? selectedBr.name : "",
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="">-- Şube Seçiniz (Opsiyonel / Merkez) --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Çalıştığı / Sorumlu Olduğu Depo</label>
                  <select
                    value={newEmpForm.warehouseId || ""}
                    onChange={(e) => {
                      const selectedWh = warehouses.find((w) => w.id === e.target.value);
                      setNewEmpForm({
                        ...newEmpForm,
                        warehouseId: e.target.value,
                        warehouseName: selectedWh ? selectedWh.name : "",
                        ...(selectedWh && selectedWh.branchId ? {
                          branchId: selectedWh.branchId,
                          branchName: selectedWh.branchName || branches.find((b) => b.id === selectedWh.branchId)?.name || "",
                        } : {}),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="">-- Depo Seçiniz (Opsiyonel) --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Maaş Tipi & Tutarı (₺)</label>
                  <div className="flex gap-2">
                    <select
                      value={newEmpForm.salaryType}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, salaryType: e.target.value as any })}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer w-28"
                    >
                      <option value="net">Net</option>
                      <option value="gross">Brüt</option>
                    </select>
                    <input
                      type="number"
                      required
                      value={newEmpForm.salaryAmount}
                      onChange={(e) => setNewEmpForm({ ...newEmpForm, salaryAmount: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">İşe Giriş Tarihi</label>
                  <input
                    type="date"
                    value={newEmpForm.startDate}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banka & IBAN</label>
                  <input
                    type="text"
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    value={newEmpForm.iban}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, iban: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">SGK Meslek Kodu ve Adı (Resmi SGK Listesi)</label>
                  <select
                    value={newEmpForm.sgkOccupationCode}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      const found = sgkOccupations.find((o) => o.code === selectedCode);
                      setNewEmpForm({
                        ...newEmpForm,
                        sgkOccupationCode: selectedCode,
                        title: found ? found.name : newEmpForm.title,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="">-- SGK Meslek Seçin --</option>
                    {sgkOccupations.map((occ) => (
                      <option key={occ.code} value={occ.code}>
                        {occ.code} - {occ.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Exit/Termination Section */}
                <div className="sm:col-span-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <LogOut className="w-4 h-4 text-amber-600" />
                    <span>İşten Çıkış / Fesih Bilgileri (Ayrılan Personel İçin)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">İşten Çıkış Tarihi</label>
                      <input
                        type="date"
                        value={newEmpForm.endDate}
                        onChange={(e) => setNewEmpForm({ ...newEmpForm, endDate: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SGK İşten Çıkış Kodu ve Nedeni</label>
                      <select
                        value={newEmpForm.terminationCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          const found = sgkTerminationReasons.find((r) => r.code === code);
                          setNewEmpForm({
                            ...newEmpForm,
                            terminationCode: code,
                            terminationReason: found ? found.reason : "",
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold cursor-pointer"
                      >
                        <option value="">-- SGK Çıkış Kodu Seçin --</option>
                        {sgkTerminationReasons.map((item) => (
                          <option key={item.code} value={item.code}>
                            Kod {item.code}: {item.reason.length > 55 ? item.reason.slice(0, 55) + "..." : item.reason}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {newEmpForm.terminationReason && (
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                      <span className="font-bold block">Seçilen Fesih Açıklaması:</span>
                      Kod {newEmpForm.terminationCode} — {newEmpForm.terminationReason}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  Kaydet ve Kartı Aç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BORDRO DÜZENLE (EDIT PAYROLL) */}
      {editingPayrollEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                  <Edit className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Bordro & Maaş Düzenle</h3>
                  <p className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800">{editingPayrollEmp.fullName}</span> · {editingPayrollEmp.department} · {payrollMonth} Dönemi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPayrollEmp(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Auto-Transfer Info Banners */}
            {(() => {
              const autoAdv = getAutoAdvanceForEmployee(editingPayrollEmp.id);
              const autoLvs = getAutoLeavesForEmployee(editingPayrollEmp.id);
              return (
                <div className="space-y-2">
                  {autoAdv.totalAdvance > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Avans Yönetiminden Aktarıldı:</span>
                          <span>Personelin onaylı ₺{autoAdv.totalAdvance.toLocaleString("tr-TR")} tutarında avansı bulundu ve kesintilere aktarıldı.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingPayrollForm((prev) => ({ ...prev, advanceDeduction: autoAdv.totalAdvance }))}
                        className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
                      >
                        Yeniden Aktar
                      </button>
                    </div>
                  )}

                  {autoLvs.unpaidDays > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold block">İzin Yönetiminden Aktarıldı:</span>
                          <span>Personelin onaylı {autoLvs.unpaidDays} gün ücretsiz izni bulundu ve eksik gün kesintisine aktarıldı.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingPayrollForm((prev) => ({ ...prev, unpaidLeaveDays: autoLvs.unpaidDays }))}
                        className="text-[11px] font-bold text-rose-800 underline hover:text-rose-950 cursor-pointer"
                      >
                        Yeniden Aktar
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <form onSubmit={handleSaveEditPayroll} className="space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                {/* Salary Type & Amount */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">Maaş Anlaşma Tipi & Temel Ücret</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={editingPayrollForm.salaryType || "net"}
                      onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, salaryType: e.target.value as any })}
                      className="bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="net">NET</option>
                      <option value="gross">BRÜT</option>
                    </select>
                    <input
                      type="number"
                      required
                      value={editingPayrollForm.baseSalary ?? 0}
                      onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, baseSalary: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Bonus / Prim / İkramiye */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">Prim / İkramiye (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.bonusAmount ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, bonusAmount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="0"
                  />
                </div>

                {/* Overtime Pay */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">Fazla Mesai Tutarı (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.overtimePay ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, overtimePay: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="0"
                  />
                </div>

                {/* Food Allowance */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">Yemek Yardımı (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.foodAllowance ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, foodAllowance: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Road Allowance */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">Yol / Ulaşım Yardımı (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.roadAllowance ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, roadAllowance: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Advance Deduction (Entegre) */}
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-amber-900 uppercase text-[11px]">Avans Kesintisi (₺)</label>
                    <span className="text-[10px] text-amber-700 font-bold">Avans Yönetimi Entegre</span>
                  </div>
                  <input
                    type="number"
                    value={editingPayrollForm.advanceDeduction ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, advanceDeduction: Number(e.target.value) })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2 font-black text-amber-900 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Unpaid Leave Days (Entegre) */}
                <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-rose-900 uppercase text-[11px]">Ücretsiz İzin / Eksik Gün (Gün)</label>
                    <span className="text-[10px] text-rose-700 font-bold">İzin Yönetimi Entegre</span>
                  </div>
                  <input
                    type="number"
                    value={editingPayrollForm.unpaidLeaveDays ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, unpaidLeaveDays: Number(e.target.value) })}
                    className="w-full bg-white border border-rose-300 rounded-xl p-2 font-black text-rose-900 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* BES Kesintisi */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">BES Kesintisi (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.besDeduction ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, besDeduction: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* İcra Kesintisi */}
                <div className="bg-red-50/60 p-3.5 rounded-2xl border border-red-200 space-y-2">
                  <label className="block font-bold text-red-900 uppercase text-[11px]">İcra Kesintisi (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.executionDeduction ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, executionDeduction: Number(e.target.value) })}
                    className="w-full bg-white border border-red-300 rounded-xl p-2 font-black text-red-900 text-sm focus:outline-none focus:border-red-500"
                    placeholder="0"
                  />
                </div>

                {/* Nafaka Kesintisi */}
                <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200 space-y-2">
                  <label className="block font-bold text-purple-900 uppercase text-[11px]">Nafaka Kesintisi (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.alimonyDeduction ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, alimonyDeduction: Number(e.target.value) })}
                    className="w-full bg-white border border-purple-300 rounded-xl p-2 font-black text-purple-900 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="0"
                  />
                </div>

                {/* Diğer Kesintiler */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">Diğer Kesintiler (₺)</label>
                  <input
                    type="number"
                    value={editingPayrollForm.otherDeductions ?? 0}
                    onChange={(e) => setEditingPayrollForm({ ...editingPayrollForm, otherDeductions: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Calculated Live Breakdown Summary */}
              {(() => {
                const baseSal = editingPayrollForm.baseSalary ?? 0;
                const salType = editingPayrollForm.salaryType ?? "net";
                const bonus = editingPayrollForm.bonusAmount ?? 0;
                const overtime = editingPayrollForm.overtimePay ?? 0;
                const food = editingPayrollForm.foodAllowance ?? 0;
                const road = editingPayrollForm.roadAllowance ?? 0;
                const advDeduct = editingPayrollForm.advanceDeduction ?? 0;
                const lvsDays = editingPayrollForm.unpaidLeaveDays ?? 0;

                const baseGross = salType === "gross" ? baseSal : baseSal * 1.38;
                const unpaidLeaveDeduction = Math.round((baseGross / 30) * lvsDays);
                const grossSal = Math.max(0, baseGross + bonus + overtime + food + road - unpaidLeaveDeduction);

                const sgkEmp = Math.round(grossSal * 0.14);
                const unempEmp = Math.round(grossSal * 0.01);
                const taxBase = Math.round(grossSal - (sgkEmp + unempEmp));
                const incTax = Math.round(Math.max(0, taxBase * 0.15 - 2950));
                const stamp = Math.round(grossSal * 0.00759);
                const netHak = Math.round(grossSal - (sgkEmp + unempEmp + incTax + stamp));
                const besDed = editingPayrollForm.besDeduction ?? 0;
                const execDed = editingPayrollForm.executionDeduction ?? 0;
                const aliDed = editingPayrollForm.alimonyDeduction ?? 0;
                const othDed = editingPayrollForm.otherDeductions ?? 0;
                const payableNet = Math.max(0, netHak - advDeduct - besDed - execDed - aliDed - othDed);

                return (
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-purple-300 block">Canlı Hesaplama Özeti</span>
                      {(execDed > 0 || aliDed > 0 || othDed > 0) && (
                        <span className="text-[10px] bg-red-500/30 text-red-200 border border-red-400/40 px-2 py-0.5 rounded-full font-bold">
                          Özel Kesintiler Mevcut (-₺{(execDed + aliDed + othDed).toLocaleString("tr-TR")})
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hesaplanan Brüt</span>
                        <span className="font-bold text-white text-sm">₺{grossSal.toLocaleString("tr-TR")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Eksik Gün Kesintisi</span>
                        <span className="font-bold text-rose-300 text-sm">₺{unpaidLeaveDeduction.toLocaleString("tr-TR")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">SGK + Vergi Kesintisi</span>
                        <span className="font-bold text-amber-300 text-sm">₺{(sgkEmp + unempEmp + incTax + stamp).toLocaleString("tr-TR")}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 block text-[10px] font-bold">NET ÖDENECEK MAAŞ</span>
                        <span className="font-black text-emerald-300 text-base">₺{payableNet.toLocaleString("tr-TR")}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const autoAdv = getAutoAdvanceForEmployee(editingPayrollEmp.id);
                    const autoLvs = getAutoLeavesForEmployee(editingPayrollEmp.id);
                    setEditingPayrollForm({
                      salaryType: editingPayrollEmp.salaryType,
                      baseSalary: editingPayrollEmp.salaryAmount,
                      bonusAmount: 0,
                      overtimePay: 0,
                      foodAllowance: editingPayrollEmp.foodAllowance || 0,
                      roadAllowance: editingPayrollEmp.roadAllowance || 0,
                      advanceDeduction: autoAdv.totalAdvance,
                      unpaidLeaveDays: autoLvs.unpaidDays,
                      besDeduction: editingPayrollEmp.hasBes ? Math.round((editingPayrollEmp.salaryAmount * (editingPayrollEmp.salaryType === "net" ? 1.38 : 1)) * 0.03) : 0,
                      executionDeduction: 0,
                      alimonyDeduction: 0,
                      otherDeductions: 0,
                      notes: "",
                    });
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Varsayılanlara Sıfırla
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPayrollEmp(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BORDRO PUSULASI POPUP */}
      {selectedPayrollRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Ücret Hesap Pusulası</h3>
                <p className="text-xs text-slate-500 font-medium">Bordro Dönemi: {selectedPayrollRecord.monthYear}</p>
              </div>
              <button
                onClick={() => setSelectedPayrollRecord(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-semibold">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Personel Adı Soyadı:</span>
                <span className="font-bold text-slate-900">{selectedPayrollRecord.employeeName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Departman:</span>
                <span className="font-bold text-slate-800">{selectedPayrollRecord.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Temel Brüt Ücret:</span>
                <span className="font-bold text-slate-900">₺{selectedPayrollRecord.grossSalary.toLocaleString("tr-TR")}</span>
              </div>

              {Boolean(selectedPayrollRecord.bonusAmount) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                  <span>+ Prim / İkramiye:</span>
                  <span className="font-bold">₺{(selectedPayrollRecord.bonusAmount || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.overtimePay) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                  <span>+ Fazla Mesai:</span>
                  <span className="font-bold">₺{(selectedPayrollRecord.overtimePay || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">SGK İşçi Payı (%14):</span>
                <span className="text-slate-800">₺{selectedPayrollRecord.sgkEmployeeShare.toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">İşsizlik Sigortası İşçi (%1):</span>
                <span className="text-slate-800">₺{selectedPayrollRecord.unemploymentEmployeeShare.toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Gelir Vergisi:</span>
                <span className="text-slate-800">₺{selectedPayrollRecord.incomeTax.toLocaleString("tr-TR")}</span>
              </div>

              {Boolean(selectedPayrollRecord.advanceDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-amber-800 bg-amber-50/50 px-2 py-1 rounded-lg">
                  <span>- Avans Kesintisi (Entegre):</span>
                  <span className="font-bold">-₺{(selectedPayrollRecord.advanceDeduction || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.unpaidLeaveDays) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-rose-800 bg-rose-50/50 px-2 py-1 rounded-lg">
                  <span>- Ücretsiz İzin Kesintisi ({selectedPayrollRecord.unpaidLeaveDays} Gün):</span>
                  <span className="font-bold">-₺{(selectedPayrollRecord.unpaidLeaveDeduction || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.besDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                  <span>- BES Kesintisi:</span>
                  <span className="font-bold">-₺{(selectedPayrollRecord.besDeduction || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.executionDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-red-800 bg-red-50/50 px-2 py-1 rounded-lg">
                  <span className="font-bold">- İcra Kesintisi:</span>
                  <span className="font-extrabold">-₺{(selectedPayrollRecord.executionDeduction || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.alimonyDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-purple-800 bg-purple-50/50 px-2 py-1 rounded-lg">
                  <span className="font-bold">- Nafaka Kesintisi:</span>
                  <span className="font-extrabold">-₺{(selectedPayrollRecord.alimonyDeduction || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.otherDeductions) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-800 bg-slate-100/70 px-2 py-1 rounded-lg">
                  <span>- Diğer Kesintiler:</span>
                  <span className="font-bold">-₺{(selectedPayrollRecord.otherDeductions || 0).toLocaleString("tr-TR")}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-slate-300 font-black text-sm text-emerald-800 bg-emerald-50 px-3 rounded-xl mt-2">
                <span>NET ÖDENECEK MAAŞ:</span>
                <span>₺{selectedPayrollRecord.payableNetSalary.toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between py-1 pt-1">
                <span className="text-slate-500">Toplam İşveren Maliyeti:</span>
                <span className="font-bold text-purple-900">₺{selectedPayrollRecord.totalEmployerCost.toLocaleString("tr-TR")}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Yazdır / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IZIN TALEBI */}
      {isAddLeaveOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Yeni İzin Talebi Oluştur</h3>
                <p className="text-xs text-slate-500 font-medium">İzin Kaydı ve Otomatik Bordro Kesinti Hesaplaması</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLeaveOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeaveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personel Seçin</label>
                <select
                  value={newLeaveForm.employeeId}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">İzin Türü</label>
                <select
                  value={newLeaveForm.type || "Yıllık İzin"}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-purple-900 cursor-pointer"
                >
                  <option value="Yıllık İzin">Yıllık İzin (Ücretli)</option>
                  <option value="Ücretli İzin">Ücretli İzin (Maaş Kesintisiz)</option>
                  <option value="Ücretsiz İzin">Ücretsiz İzin (Gün Sayısı Kadar Kesinti)</option>
                  <option value="Mazeretsiz İzin">Mazeretsiz İzin (Gün Sayısı Kadar Kesinti)</option>
                  <option value="Sıhhi İzin">Sıhhi İzin (2 Günden Fazlaysa Kesinti)</option>
                  <option value="Mazeret İzni">Mazeret İzni</option>
                  <option value="Hastalık/Rapor">Hastalık / Rapor İzni</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.startDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.endDate}
                    onChange={(e) => setNewLeaveForm({ ...newLeaveForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">İzin Gün Sayısı</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newLeaveForm.daysCount}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, daysCount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-extrabold text-slate-900"
                />
              </div>

              {/* Dynamic Calculation Notice Box */}
              {(() => {
                const selectedType = newLeaveForm.type || "Yıllık İzin";
                const days = Number(newLeaveForm.daysCount) || 1;

                if (selectedType === "Ücretsiz İzin" || selectedType === "Mazeretsiz İzin") {
                  return (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-950 font-medium space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 font-black text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Maaştan Gün Sayısına Göre Kesinti Yapılır ({days} Gün)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-800">
                        <strong>{selectedType}</strong> talebi onaylandığında kullanılan <strong>{days} günün tamamı</strong> ay sonu bordrosunda eksik gün olarak maaştan otomatik düşülecektir.
                      </p>
                    </div>
                  );
                }

                if (selectedType === "Sıhhi İzin") {
                  const deductedDays = days > 2 ? days - 2 : 0;
                  if (days > 2) {
                    return (
                      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 font-medium space-y-1 shadow-xs">
                        <div className="flex items-center gap-1.5 font-black text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Maaştan Kesinti Yapılır (2 Günü Aşan {deductedDays} Gün)</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-900">
                          Sıhhi izin 2 günden fazla ({days} gün) olduğu için ilk 2 gün ücretli sayılacak, 2 günü aşan <strong>{deductedDays} gün</strong> bordroda eksik gün olarak maaştan düşülecektir.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 font-medium space-y-1 shadow-xs">
                        <div className="flex items-center gap-1.5 font-black text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Maaş Kesintisi Yok (2 Gün ve Altı)</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-emerald-800">
                          Sıhhi izin 2 gün veya daha az olduğu için işveren tarafından ücretli izin sayılır, maaştan kesinti yapılmaz.
                        </p>
                      </div>
                    );
                  }
                }

                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 font-medium space-y-1 shadow-xs">
                    <div className="flex items-center gap-1.5 font-black text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ücretli İzin (Maaş Kesintisi Yapılmaz)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      <strong>{selectedType}</strong> kapsamında kullanılan gün sayısı tam maaş ödemesine tabidir, bordroda kesinti yapılmaz.
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama / İzin Nedeni</label>
                <input
                  type="text"
                  placeholder="ör: Kişisel işler, doktor raporu vb."
                  value={newLeaveForm.reason || ""}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLeaveOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Talebi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AVANS TALEBI */}
      {isAddAdvanceOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-base">Yeni Avans / Masraf Talepleri</h3>
            <form onSubmit={handleCreateAdvanceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personel</label>
                <select
                  value={newAdvanceForm.employeeId}
                  onChange={(e) => setNewAdvanceForm({ ...newAdvanceForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Talep Türü</label>
                <select
                  value={newAdvanceForm.type}
                  onChange={(e) => setNewAdvanceForm({ ...newAdvanceForm, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
                >
                  <option value="Avans">Maaş Avansı</option>
                  <option value="Masraf">İş Masrafı (Fatura / Fişli)</option>
                  <option value="Prim">Performans Primi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  required
                  value={newAdvanceForm.amount}
                  onChange={(e) => setNewAdvanceForm({ ...newAdvanceForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama / Nedeni</label>
                <input
                  type="text"
                  placeholder="ör: Şehir dışı müşteri ziyareti konaklama masrafı"
                  value={newAdvanceForm.description}
                  onChange={(e) => setNewAdvanceForm({ ...newAdvanceForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdvanceOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OZLUK DETAYI VIEW */}
      {selectedEmployeeForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-xl shadow-md border-2 border-purple-200 overflow-hidden shrink-0">
                  {selectedEmployeeForDetail.photoUrl ? (
                    <img src={selectedEmployeeForDetail.photoUrl} alt={selectedEmployeeForDetail.fullName} className="w-full h-full object-cover" />
                  ) : (
                    selectedEmployeeForDetail.fullName.split(" ").map((n) => n[0]).join("")
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">{selectedEmployeeForDetail.fullName}</h3>
                  <p className="text-xs text-purple-700 font-bold">{selectedEmployeeForDetail.title} · {selectedEmployeeForDetail.department}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedEmployeeForDetail.status === "active" && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">Aktif Çalışan</span>
                    )}
                    {selectedEmployeeForDetail.status === "terminated" && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">İşten Ayrıldı</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">T.C. Kimlik No</span>
                <span className="font-mono text-slate-900 font-bold text-sm">{selectedEmployeeForDetail.tckn}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">İşe Giriş Tarihi</span>
                <span className="text-slate-900 font-bold">{selectedEmployeeForDetail.startDate}</span>
              </div>

              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80">
                <span className="text-indigo-800 block text-[11px] font-bold">Bağlı Şube</span>
                <span className="text-indigo-950 font-extrabold flex items-center gap-1.5 mt-0.5">
                  <Store className="w-4 h-4 text-indigo-600" />
                  {selectedEmployeeForDetail.branchName || "Genel / Merkez"}
                </span>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
                <span className="text-amber-800 block text-[11px] font-bold">Görevli Depo</span>
                <span className="text-amber-950 font-extrabold flex items-center gap-1.5 mt-0.5">
                  <WarehouseIcon className="w-4 h-4 text-amber-600" />
                  {selectedEmployeeForDetail.warehouseName || "Atanmış Depo Yok"}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Telefon & E-Posta</span>
                <span className="text-slate-900 font-bold block">{selectedEmployeeForDetail.phone || "—"}</span>
                <span className="text-slate-500 text-[10px]">{selectedEmployeeForDetail.email || "—"}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Doğum Tarihi & Yaş</span>
                <span className="text-slate-900 font-bold">
                  {selectedEmployeeForDetail.birthDate ? (
                    <>
                      {selectedEmployeeForDetail.birthDate} ({calculateAge(selectedEmployeeForDetail.birthDate)} Yaş)
                      {calculateAge(selectedEmployeeForDetail.birthDate)! < 18 && (
                        <span className="block text-rose-600 font-bold text-[10px] mt-0.5">⚠️ 18 Yaş Altı (Genç İşçi)</span>
                      )}
                    </>
                  ) : "Belirtilmedi"}
                </span>
              </div>

              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Ev / İkametgah Adresi</span>
                <span className="text-slate-900 font-medium">{selectedEmployeeForDetail.homeAddress || "Adres kaydı bulunmuyor."}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Maaş Anlaşması</span>
                <span className="text-slate-900 font-bold">₺{selectedEmployeeForDetail.salaryAmount.toLocaleString("tr-TR")} ({selectedEmployeeForDetail.salaryType.toUpperCase()})</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">SGK Meslek Kodu</span>
                <span className="font-mono text-slate-900 font-bold block">
                  {selectedEmployeeForDetail.sgkOccupationCode || "Belirtilmedi"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {sgkOccupations.find((o) => o.code === selectedEmployeeForDetail.sgkOccupationCode)?.name || selectedEmployeeForDetail.title}
                </span>
              </div>

              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Banka IBAN ({selectedEmployeeForDetail.bankName})</span>
                <span className="font-mono text-slate-900 font-bold">{selectedEmployeeForDetail.iban || "—"}</span>
              </div>

              {/* Termination Details if existed */}
              {(selectedEmployeeForDetail.endDate || selectedEmployeeForDetail.terminationCode) && (
                <div className="col-span-2 bg-amber-50 p-3 rounded-xl border border-amber-300 text-amber-900">
                  <span className="font-bold text-xs block text-amber-950 mb-1">
                    İşten Çıkış / SGK Fesih Kaydı:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-amber-800 text-[10px] block">Çıkış Tarihi:</span>
                      <span className="font-bold">{selectedEmployeeForDetail.endDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-amber-800 text-[10px] block">SGK Fesih Kodu:</span>
                      <span className="font-bold font-mono">Kod {selectedEmployeeForDetail.terminationCode || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-amber-800 text-[10px] block">SGK Fesih Nedeni:</span>
                      <span className="font-semibold">{selectedEmployeeForDetail.terminationReason || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="col-span-2 bg-purple-50/60 p-3 rounded-xl border border-purple-200">
                <span className="text-purple-900 font-bold block">Acil Durum İletişim Kişisi</span>
                <span className="text-slate-800">{selectedEmployeeForDetail.emergencyContact || "Belirtilmedi"} — {selectedEmployeeForDetail.emergencyPhone}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YASAL KESİNTİ (İCRA & NAFAKA) EKLE / DÜZENLE */}
      {isAddLegalDeductionOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {editingLegalDeduction ? "Yasal Kesinti Dosyasını Düzenle" : "Yeni Yasal Kesinti Kaydı Ekle"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">İcra, Nafaka ve Diğer Resmi Kesintilerin Yönetimi</p>
              </div>
              <button
                onClick={() => {
                  setIsAddLegalDeductionOpen(false);
                  setEditingLegalDeduction(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLegalDeductionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Personel Seçin</label>
                  <select
                    required
                    value={legalForm.employeeId}
                    onChange={(e) => setLegalForm({ ...legalForm, employeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="">-- Personel Seçin --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kesinti Türü</label>
                  <select
                    value={legalForm.type}
                    onChange={(e) => setLegalForm({ ...legalForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
                  >
                    <option value="İcra Kesintisi">İcra Kesintisi</option>
                    <option value="Nafaka Kesintisi">Nafaka Kesintisi</option>
                    <option value="Diğer Yasal Kesinti">Diğer Yasal Kesinti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hesaplama Mantığı</label>
                  <select
                    value={legalForm.calculationType}
                    onChange={(e) => setLegalForm({ ...legalForm, calculationType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
                  >
                    <option value="quarter_salary">Maaşın 1/4'ü (%25)</option>
                    <option value="fixed">Sabit Aylık Tutar (₺)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">İcra / Mahkeme Dosya Numarası</label>
                  <input
                    type="text"
                    required
                    placeholder="ör: İstanbul 8. İcra Dairesi 2025/11204 Esas"
                    value={legalForm.fileNumber}
                    onChange={(e) => setLegalForm({ ...legalForm, fileNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alacaklı / Kurum Unvanı</label>
                  <input
                    type="text"
                    placeholder="ör: Garanti BBVA A.Ş. Vekili"
                    value={legalForm.creditorName}
                    onChange={(e) => setLegalForm({ ...legalForm, creditorName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yatırılacağı IBAN Numarası</label>
                  <input
                    type="text"
                    required
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    value={legalForm.iban}
                    onChange={(e) => setLegalForm({ ...legalForm, iban: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Toplam Borç Tutarı (₺) <span className="text-[10px] text-slate-400 font-normal">(Nafakada 0 bırakın)</span>
                  </label>
                  <input
                    type="number"
                    value={legalForm.totalDebtAmount}
                    onChange={(e) => setLegalForm({ ...legalForm, totalDebtAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Şimdiye Kadar Ödenen (₺)</label>
                  <input
                    type="number"
                    value={legalForm.paidAmount}
                    onChange={(e) => setLegalForm({ ...legalForm, paidAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aylık Sabit Kesinti Tutarı (₺)</label>
                  <input
                    type="number"
                    value={legalForm.monthlyAmount}
                    onChange={(e) => setLegalForm({ ...legalForm, monthlyAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-purple-700"
                    placeholder="1/4 maaş dışında sabitse girin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durum / Sıralama</label>
                  <select
                    value={legalForm.status}
                    onChange={(e) => setLegalForm({ ...legalForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="active">1. Sıra (Aktif Kesilen)</option>
                    <option value="queued">Sırada Bekliyor (Sıradaki Dosya)</option>
                    <option value="completed">Borç Bitti / Tamamlandı</option>
                    <option value="passive">Pasif / Durduruldu</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama / Notlar</label>
                  <input
                    type="text"
                    placeholder="ör: Maaş haczi müzekkeresi tarih ve karar nosu"
                    value={legalForm.notes}
                    onChange={(e) => setLegalForm({ ...legalForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddLegalDeductionOpen(false);
                    setEditingLegalDeduction(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingLegalDeduction ? "Değişiklikleri Kaydet" : "Kesinti Kaydını Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ÖDEME İŞLE & BORÇ DÜŞÜŞÜ */}
      {isPaymentModalOpen && paymentModalDeduction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">İcra / Yasal Kesinti Ödemesi İşle</h3>
                <p className="text-xs text-slate-500 font-medium">{paymentModalDeduction.employeeName}</p>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentModalDeduction(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-500">Dosya No:</span>
                <span className="font-mono font-bold text-slate-900">{paymentModalDeduction.fileNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IBAN:</span>
                <span className="font-mono text-indigo-700 font-bold">{paymentModalDeduction.iban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Toplam Borç:</span>
                <span className="font-bold text-slate-900">₺{paymentModalDeduction.totalDebtAmount.toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mevcut Ödenen:</span>
                <span className="font-bold text-emerald-700">₺{paymentModalDeduction.paidAmount.toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between text-rose-800 pt-1 border-t border-slate-200 font-bold">
                <span>Kalan Borç Bakiye:</span>
                <span>₺{Math.max(0, paymentModalDeduction.totalDebtAmount - paymentModalDeduction.paidAmount).toLocaleString("tr-TR")}</span>
              </div>
            </div>

            <form onSubmit={handleExecutePaymentModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Şimdi Düşülecek / Yatırılacak Ödeme Tutarı (₺)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-white border border-purple-300 rounded-xl p-3 font-black text-slate-900 text-base focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium">
                ⚡ <strong>Otomasyon Bilgisi:</strong> Eğer bu ödeme ile kalan borç tamamen kapanırsa, bu dosya otomatik olarak <strong>"Borç Bitti"</strong> olarak işaretlenir, kesinti kaldırılır ve varsa sıradaki icra kesintisi otomatik olarak 1. sıraya alınarak aktifleşir!
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentModalDeduction(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  Ödemeyi Uygula & Borç Düşüşü Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
