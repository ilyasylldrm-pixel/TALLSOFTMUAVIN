import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency, formatDate } from "../utils/exportUtils";
import {
  Users,
  UserPlus,
  Search,
  Plus,
  MessageCircle,
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
  Calculator,
  CalendarDays,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Scale,
  ArrowUpDown,
  Laptop,
  Layers,
  Coins,
  Gift,
  Utensils,
  Bus,
  ArrowDownCircle,
  RefreshCw,
  Sparkles,
  X,
  ArrowDown,
  ArrowUp,
  Target,
  LocateFixed,
  Scissors,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Pin,
} from "lucide-react";
import { Employee, PayrollRecord, LeaveRequest, AdvanceRequest, LegalDeduction, CompanySettings, Branch, Warehouse, CostProject, AssetCustody, AdditionalPaymentItem } from "../types";
import { sgkOccupations } from "../data/sgkOccupations";
import { sgkTerminationReasons } from "../data/sgkTerminationReasons";
import { HRDocumentFormsModal, HRFormType } from "./HRDocumentFormsModal";
import { SeveranceNoticeCalculator } from "./SeveranceNoticeCalculator";
import { PayrollPrintModal } from "./PayrollPrintModal";
import { BulkPayrollModal } from "./BulkPayrollModal";
import { AssetCustodyManagement } from "./AssetCustodyManagement";
import { AdditionalPaymentsModal } from "./AdditionalPaymentsModal";
import { PayrollAdjustmentsTwinPanels } from "./PayrollAdjustmentsTwinPanels";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { useTheme } from "../context/ThemeContext";
import { ASSET_ICONS, getContactAvatar } from "../utils/assetIcons";

interface HRManagementProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  advanceRequests: AdvanceRequest[];
  legalDeductions?: LegalDeduction[];
  assetCustodies?: AssetCustody[];
  companySettings: CompanySettings;
  branches?: Branch[];
  warehouses?: Warehouse[];
  costProjects?: CostProject[];
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
  onAddAsset?: (asset: AssetCustody) => void;
  onUpdateAsset?: (asset: AssetCustody) => void;
  onDeleteAsset?: (assetId: string) => void;
}

export const HRManagement: React.FC<HRManagementProps> = ({
  employees,
  leaveRequests,
  advanceRequests,
  legalDeductions = [],
  assetCustodies = [],
  companySettings,
  branches = [],
  warehouses = [],
  costProjects = [],
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
  onAddAsset = () => {},
  onUpdateAsset = () => {},
  onDeleteAsset = () => {},
}) => {
  const { theme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<"employees" | "payroll" | "leaves" | "advances" | "sgk" | "severance" | "zimmet">("employees");
  const [advanceInnerTab, setAdvanceInnerTab] = useState<"requests" | "legal_deductions">("requests");

  // Para Birimi Formatlayıcı (Lira ve Kuruş: ₺12.500,00)
  const formatTRY = (val: number | null | undefined): string => {
    const num = typeof val === "number" && !isNaN(val) ? val : Number(val || 0);
    return "₺" + num.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [employeeSortBy, setEmployeeSortBy] = useState<
    "name_asc" | "name_desc" | "date_desc" | "date_asc" | "salary_desc" | "salary_asc"
  >("name_asc");

  // Modals & Selection States
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [isFormsModalOpen, setIsFormsModalOpen] = useState(false);
  const [formsModalEmployeeId, setFormsModalEmployeeId] = useState<string | undefined>(undefined);
  const [formsModalType, setFormsModalType] = useState<HRFormType>("annual_leave");
  const [formsModalLeaveRequest, setFormsModalLeaveRequest] = useState<LeaveRequest | undefined>(undefined);
  const [formsModalAdvanceRequest, setFormsModalAdvanceRequest] = useState<AdvanceRequest | undefined>(undefined);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<PayrollRecord | null>(null);
  const [isPayrollPrintModalOpen, setIsPayrollPrintModalOpen] = useState(false);
  const [payrollPrintSelectedEmpId, setPayrollPrintSelectedEmpId] = useState<string | undefined>(undefined);
  const [payrollPrintInitialMode, setPayrollPrintInitialMode] = useState<"month" | "year">("month");

  // Legal Deductions Modal & Form States
  const [isAddLegalDeductionOpen, setIsAddLegalDeductionOpen] = useState(false);
  const [editingLegalDeduction, setEditingLegalDeduction] = useState<LegalDeduction | null>(null);
  const [legalForm, setLegalForm] = useState<{
    employeeId: string;
    type: "İcra Kesintisi" | "Nafaka Kesintisi" | "Diğer Yasal Kesinti" | string;
    fileNumber: string;
    creditorName: string;
    iban: string;
    totalDebtAmount: number;
    paidAmount: number;
    monthlyAmount: number;
    calculationType: "quarter_salary" | "fixed" | string;
    priorityOrder: number;
    status: "active" | "queued" | "completed" | "passive" | string;
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

  // Auto-scroll & Highlight States for Leaves, Deductions & Advances
  const [highlightedLeaveId, setHighlightedLeaveId] = useState<string | null>(null);
  const [highlightedDeductionId, setHighlightedDeductionId] = useState<string | null>(null);
  const [highlightedAdvanceId, setHighlightedAdvanceId] = useState<string | null>(null);

  // Reusable Smooth Auto-Scroll & Focus Helper
  const scrollToElement = useCallback((elementId: string, onFocus?: () => void) => {
    const attemptScroll = () => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (onFocus) onFocus();
        return true;
      }
      return false;
    };

    if (!attemptScroll()) {
      setTimeout(attemptScroll, 120);
      setTimeout(attemptScroll, 350);
    }
  }, []);

  useEffect(() => {
    if (highlightedLeaveId) {
      const timer = setTimeout(() => setHighlightedLeaveId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedLeaveId]);

  useEffect(() => {
    if (highlightedDeductionId) {
      const timer = setTimeout(() => setHighlightedDeductionId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedDeductionId]);

  useEffect(() => {
    if (highlightedAdvanceId) {
      const timer = setTimeout(() => setHighlightedAdvanceId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedAdvanceId]);

  // ----------------------------------------------------
  // PUANTAJ TAKVİMİ & RESMİ TATİL & FAZLA MESAİ YÖNETİMİ
  // ----------------------------------------------------
  type PuantajCode = "N" | "HT" | "RT" | "Yİ" | "Üİ" | "Dİ" | "R" | "M";

  // Günlük Puantaj Detay Kaydı (Mesai Saati & Mesai Türü ile)
  interface DayPuantajDetail {
    code: PuantajCode;
    overtimeHours?: number; // Günlük yapılan fazla mesai saati (örn: 2.5 saat)
    isHolidayOvertime?: boolean; // Resmi tatil veya Hafta tatili günü tam gün çalışma
  }

  const PUANTAJ_CODE_CONFIG: Record<
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

  const getTurkishOfficialHoliday = (year: number, month: number, day: number): string | null => {
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

  const generateDefaultPuantaj = (
    empId: string,
    monthYear: string,
    leaves: LeaveRequest[]
  ): Record<number, DayPuantajDetail> => {
    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr, 10) || 2026;
    const month = parseInt(monthStr, 10) || 7;
    const daysInMonth = new Date(year, month, 0).getDate();

    const empApprovedLeaves = leaves.filter(
      (l) => l.employeeId === empId && l.status === "approved"
    );

    const map: Record<number, DayPuantajDetail> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // 1. Onaylı İzin Kontrolü
      const matchLeave = empApprovedLeaves.find(
        (l) => l.startDate <= dateStr && l.endDate >= dateStr
      );

      if (matchLeave) {
        const type = (matchLeave.type || (matchLeave as any).leaveType || "").toLowerCase();
        if (type.includes("yıllık") || type.includes("annual")) {
          map[day] = { code: "Yİ" };
        } else if (type.includes("ücretsiz") || type.includes("mazeretsiz") || type.includes("unpaid")) {
          map[day] = { code: "M" };
        } else if (type.includes("babalık") || type.includes("erkek doğum") || type.includes("babalik") || type.includes("analık") || type.includes("analik") || type.includes("doğum") || type.includes("dogum")) {
          map[day] = { code: "Dİ" };
        } else if (type.includes("evlilik") || type.includes("vefat")) {
          map[day] = { code: "Üİ" };
        } else if (type.includes("sıhhi") || type.includes("rapor") || type.includes("hastalık") || type.includes("sick")) {
          map[day] = { code: "R" };
        } else {
          map[day] = { code: "Üİ" };
        }
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

  const calculatePuantajStats = (
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
    let overtimeNormalHours = 0; // Hafta içi mesai (%50 zamlı saat)
    let overtimeWeekendHours = 0; // Hafta tatili mesai (%100 zamlı saat)
    let overtimeHolidayHours = 0; // Resmi tatilde saatlik mesai (%100 zamlı saat)
    let overtimeHolidayDays = 0; // Resmi tatilde tam gün çalışma (1 günlük tam yevmiye ilave)

    for (let day = 1; day <= totalDays; day++) {
      const raw = puantaj[day];
      const code: PuantajCode = typeof raw === "string" ? raw : raw ? raw.code : "N";
      const otHours = typeof raw === "object" && raw ? (raw.overtimeHours || 0) : 0;
      const isHolOt = typeof raw === "object" && raw ? Boolean(raw.isHolidayOvertime) : false;

      if (code === "N") {
        countN++;
        if (otHours > 0) overtimeNormalHours += otHours;
      } else if (code === "HT") {
        countHT++;
        if (otHours > 0) overtimeWeekendHours += otHours;
        if (isHolOt) overtimeWeekendHours += 7.5; // Hafta tatili tam gün çalışma 7.5 saat kabul edilir
      } else if (code === "RT") {
        countRT++;
        if (isHolOt) {
          overtimeHolidayDays += 1; // 4857 Sayılı Kanun Madde 47: Resmi tatil tam gün 1 ek yevmiye
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

    // Sıhhi raporda ilk 2 gün işverence ödenir, 2 günü aşan kısım SGK iş göremezlik kapsamındadır
    const sickDeduction = countR > 2 ? countR - 2 : 0;
    const unpaidDays = countM + sickDeduction;
    // SGK prim gün sayısı 30 gün esasına tabidir
    const sgkDays = Math.max(0, Math.min(30, 30 - unpaidDays));

    // Türkiye Cumhuriyeti 4857 Sayılı İş Kanunu Mesai Ücreti Formülleri:
    // Aylık çalışma saati standardı = 225 saat
    // Saatlik Brüt Ücret = Brüt Ücret / 225
    // Günlük Brüt Ücret (Yevmiye) = Brüt Ücret / 30
    // 1. Hafta içi Fazla Mesai Saati = Saatlik Ücret * 1.5 * Saat (İş Kanunu Md. 41)
    // 2. Hafta Tatili / Resmi Tatil Saatlik Mesai = Saatlik Ücret * 2.0 * Saat
    // 3. Resmi Tatil Tam Gün Çalışma = Günlük Yevmiye (Brüt/30) * Gün Sayısı (İş Kanunu Md. 47)
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
      // Overtime Stats
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

  // Editable Payroll Customization States
  type CustomPayrollAdjustment = {
    salaryType?: "net" | "gross";
    baseSalary?: number;
    bonusAmount?: number;
    overtimePay?: number;
    overtimeNormalHours?: number;
    overtimeWeekendHours?: number;
    overtimeHolidayDays?: number;
    overtimeHolidayHours?: number;
    foodAllowance?: number;
    roadAllowance?: number;
    customPayments?: AdditionalPaymentItem[];
    customPaymentsTotal?: number;
    advanceDeduction?: number;
    advanceReason?: string;
    unpaidLeaveDays?: number;
    missingDayReason?: string;
    missingDayCode?: string;
    besDeduction?: number;
    besReason?: string;
    executionDeduction?: number;
    executionReason?: string;
    alimonyDeduction?: number;
    alimonyReason?: string;
    otherDeductions?: number;
    otherReason?: string;
    deductionReason?: string;
    isCustomized?: boolean;
    notes?: string;
    puantajDays?: Record<number, DayPuantajDetail>;
  };

  const [payrollCustomizations, setPayrollCustomizations] = useState<Record<string, CustomPayrollAdjustment>>({});
  const [editingPayrollEmp, setEditingPayrollEmp] = useState<Employee | null>(null);
  const [editingPayrollForm, setEditingPayrollForm] = useState<CustomPayrollAdjustment>({});
  const [isPayrollFullscreen, setIsPayrollFullscreen] = useState(true);
  const [isBulkPayrollModalOpen, setIsBulkPayrollModalOpen] = useState(false);
  const [isAdditionalPaymentsModalOpen, setIsAdditionalPaymentsModalOpen] = useState(false);

  // Post-save modal / quick print dialog state
  const [savedPayrollForPrintModal, setSavedPayrollForPrintModal] = useState<{
    emp: Employee;
    form: CustomPayrollAdjustment;
    hasAdvance: boolean;
    hasUnpaidLeave: boolean;
    hasLegalDeductions: boolean;
    advAmount: number;
    unpaidDays: number;
    nextEmp: Employee | null;
  } | null>(null);

  const handleApplyBatchPayroll = (
    updatedCustomizations: Record<string, CustomPayrollAdjustment>,
    processedCount: number,
    totalNet: number,
    totalCost: number
  ) => {
    setPayrollCustomizations(updatedCustomizations);
    setIsBulkPayrollModalOpen(false);
    showToast(
      `🎉 ${processedCount} personelin ${payrollMonth} dönemi bordrosu başarıyla hazırlandı! Toplam Net: ${formatTRY(totalNet)} • İşveren Maliyeti: ${formatTRY(totalCost)}`
    );
  };

  const nav = useDetailNavigation<Employee>({ moduleKey: "hr" });

  const handleBackToList = useCallback(() => {
    setIsAddEmployeeOpen(false);
    setSelectedEmployeeForDetail(null);
    setEditingPayrollEmp(null);
    setSelectedPayrollRecord(null);
    setIsBulkPayrollModalOpen(false);
    nav.backToList();
  }, [nav]);

  useEffect(() => {
    if (nav.mode === "list") {
      setIsAddEmployeeOpen(false);
      setSelectedEmployeeForDetail(null);
      setEditingPayrollEmp(null);
      setSelectedPayrollRecord(null);
    }
  }, [nav.mode]);

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

  // Date Helpers for Leave Calculations
  const addDaysToDate = (dateStr: string, days: number): string => {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + Math.max(0, days - 1));
    return d.toISOString().split("T")[0];
  };

  const calculateDaysDiff = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
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
    gender: "Erkek",
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

  // Filtered & Sorted Employees (Default: Turkish Alphabetical Order)
  const filteredEmployees = employees
    .filter((emp) => {
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
    })
    .sort((a, b) => {
      if (employeeSortBy === "name_asc") {
        return a.fullName.localeCompare(b.fullName, "tr");
      }
      if (employeeSortBy === "name_desc") {
        return b.fullName.localeCompare(a.fullName, "tr");
      }
      if (employeeSortBy === "date_desc") {
        return (b.startDate || "").localeCompare(a.startDate || "");
      }
      if (employeeSortBy === "date_asc") {
        return (a.startDate || "").localeCompare(b.startDate || "");
      }
      if (employeeSortBy === "salary_desc") {
        return (b.salaryAmount || 0) - (a.salaryAmount || 0);
      }
      if (employeeSortBy === "salary_asc") {
        return (a.salaryAmount || 0) - (b.salaryAmount || 0);
      }
      return a.fullName.localeCompare(b.fullName, "tr");
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
    const reasons = empAdvances.map((a) => a.description || a.type || "Avans").filter(Boolean);
    return { totalAdvance, count: empAdvances.length, items: empAdvances, reasons };
  };

  // Helper: Auto-detect approved unpaid leaves for an employee according to HR rules
  const getAutoLeavesForEmployee = (empId: string) => {
    const empLeaves = leaveRequests.filter(
      (l) => l.employeeId === empId && l.status === "approved"
    );
    let unpaidDays = 0;
    const reasons: string[] = [];
    let primaryCode = "21";

    empLeaves.forEach((l) => {
      if (l.type === "Ücretsiz İzin" || l.type === "Mazeretsiz İzin") {
        unpaidDays += l.daysCount;
        reasons.push(`${l.type}: ${l.reason || "Yazılı izin talebi"}`);
        primaryCode = l.type === "Mazeretsiz İzin" ? "15" : "21";
      } else if (l.type === "Sıhhi İzin" || l.type === "Hastalık/Rapor") {
        if (l.daysCount > 2) {
          unpaidDays += (l.daysCount - 2);
          reasons.push(`İstirahat/Rapor (${l.daysCount} gün - ${l.reason || "Sağlık raporu"})`);
          primaryCode = "01";
        }
      }
    });
    return { unpaidDays, count: empLeaves.length, items: empLeaves, reasons, primaryCode };
  };

  // Helper: Auto-detect active legal deductions (icra/nafaka/bes/diğer) for an employee
  const getAutoLegalDeductionsForEmployee = (empId: string, approxNet: number) => {
    const activeDeductions = (legalDeductions || []).filter(
      (d) => d.employeeId === empId && d.status === "active"
    );

    let executionDeduction = 0;
    let alimonyDeduction = 0;
    let besDeduction = 0;
    let otherDeductions = 0;

    const execs = activeDeductions.filter((d) => (d.type || "").toLowerCase().includes("icra"));
    const alimonies = activeDeductions.filter((d) => (d.type || "").toLowerCase().includes("nafaka"));
    const besItems = activeDeductions.filter((d) => (d.type || "").toLowerCase().includes("bes"));
    const others = activeDeductions.filter(
      (d) => !execs.includes(d) && !alimonies.includes(d) && !besItems.includes(d)
    );

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

    besItems.forEach((d) => {
      besDeduction += d.monthlyAmount || 0;
    });

    others.forEach((d) => {
      otherDeductions += d.monthlyAmount || 0;
    });

    const reasonsList = activeDeductions
      .map((d) => {
        return [d.type, d.fileNumber ? `Dosya No: ${d.fileNumber}` : "", d.courtOffice || ""].filter(Boolean).join(" - ");
      })
      .filter(Boolean);

    return {
      executionDeduction,
      alimonyDeduction,
      besDeduction,
      otherDeductions,
      activeDeductions,
      execs,
      alimonies,
      besItems,
      others,
      reasonsSummary: reasonsList.join(" | "),
    };
  };

  // Helper Turkish Payroll Calculator (Standard SGK formulas with Leave & Advance & Legal Deductions Integration)
  const calculatePayrollForEmployee = (emp: Employee): PayrollRecord => {
    const custom = (payrollCustomizations[payrollMonth]?.[emp.id] || payrollCustomizations[emp.id]) || {};
    const autoAdv = getAutoAdvanceForEmployee(emp.id);
    const autoLvs = getAutoLeavesForEmployee(emp.id);

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

    const autoLegal = getAutoLegalDeductionsForEmployee(emp.id, netSalary);

    const besDeduction = custom.besDeduction !== undefined
      ? custom.besDeduction
      : (autoLegal.besDeduction > 0 ? autoLegal.besDeduction : (emp.hasBes ? Math.round(baseGross * 0.03) : 0));

    const executionDeduction = custom.executionDeduction !== undefined ? custom.executionDeduction : autoLegal.executionDeduction;
    const alimonyDeduction = custom.alimonyDeduction !== undefined ? custom.alimonyDeduction : autoLegal.alimonyDeduction;
    const otherDeductions = custom.otherDeductions !== undefined ? custom.otherDeductions : autoLegal.otherDeductions;

    const advanceReason = custom.advanceReason !== undefined
      ? custom.advanceReason
      : (autoAdv.reasons.length > 0 ? autoAdv.reasons.join(", ") : "");
    const missingDayReason = custom.missingDayReason !== undefined
      ? custom.missingDayReason
      : (autoLvs.reasons.length > 0 ? autoLvs.reasons.join(", ") : "");
    const missingDayCode = custom.missingDayCode !== undefined
      ? custom.missingDayCode
      : (autoLvs.primaryCode || "21");
    const besReason = custom.besReason !== undefined
      ? custom.besReason
      : (emp.hasBes ? "%3 BES Otomatik Katılım" : "");
    const executionReason = custom.executionReason !== undefined
      ? custom.executionReason
      : (autoLegal.executionDeduction > 0 ? autoLegal.reasonsSummary : "");
    const alimonyReason = custom.alimonyReason !== undefined
      ? custom.alimonyReason
      : (autoLegal.alimonyDeduction > 0 ? autoLegal.reasonsSummary : "");
    const otherReason = custom.otherReason !== undefined ? custom.otherReason : "";
    const deductionReason = custom.deductionReason !== undefined
      ? custom.deductionReason
      : autoLegal.reasonsSummary;

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
      besReason,
      executionDeduction,
      executionReason,
      alimonyDeduction,
      alimonyReason,
      otherDeductions,
      otherReason,
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

  const sortedPayrollEmployees = [...employees].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "tr")
  );
  const payrollRecords = sortedPayrollEmployees.map(calculatePayrollForEmployee);
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
      gender: newEmpForm.gender || "Erkek",
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
      projectId: newEmpForm.projectId || undefined,
      projectName: newEmpForm.projectName || undefined,
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
    setActiveSubTab("leaves");
    setHighlightedLeaveId(created.id);
    showToast(`✅ "${created.employeeName}" için ${created.daysCount} günlük ${created.type} kaydı oluşturuldu. Yeni kayda odaklanıldı.`);
    setTimeout(() => {
      scrollToElement(`leave-row-${created.id}`);
    }, 150);
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
    setActiveSubTab("advances");
    setAdvanceInnerTab("requests");
    setHighlightedAdvanceId(created.id);
    showToast(`✅ "${created.employeeName}" için ${formatTRY(created.amount)} tutarında ${created.type} talebi oluşturuldu. Yeni kayda odaklanıldı.`);
    setTimeout(() => {
      scrollToElement(`advance-row-${created.id}`);
    }, 150);
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
        showToast(`✅ "${updated.fileNumber}" yasal kesinti kaydı güncellendi. Yeni kayda odaklanıldı.`);
      }

      setIsAddLegalDeductionOpen(false);
      setEditingLegalDeduction(null);
      setActiveSubTab("advances");
      setAdvanceInnerTab("legal_deductions");
      setHighlightedDeductionId(updated.id);
      setTimeout(() => {
        scrollToElement(`deduction-row-${updated.id}`);
      }, 150);
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
        showToast(`✅ "${newDeduction.fileNumber}" kesinti kaydı başarıyla oluşturuldu. Yeni kayda odaklanıldı.`);
      }

      setIsAddLegalDeductionOpen(false);
      setEditingLegalDeduction(null);
      setActiveSubTab("advances");
      setAdvanceInnerTab("legal_deductions");
      setHighlightedDeductionId(newDeduction.id);
      setTimeout(() => {
        scrollToElement(`deduction-row-${newDeduction.id}`);
      }, 150);
    }
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
        `💳 ${paymentModalDeduction.fileNumber} dosyasına ${formatTRY(Number(paymentAmountInput))} ödeme işlendi. Kalan Borç: ${formatTRY(Math.max(0, paymentModalDeduction.totalDebtAmount - newPaid))}`
      );
    }

    setIsPaymentModalOpen(false);
    setPaymentModalDeduction(null);
    setPaymentAmountInput(0);
    setActiveSubTab("advances");
    setAdvanceInnerTab("legal_deductions");
    setHighlightedDeductionId(updated.id);
    setTimeout(() => {
      scrollToElement(`deduction-row-${updated.id}`);
    }, 150);
  };

  // Editable Payroll Handlers
  const handleOpenEditPayroll = (emp: Employee) => {
    const autoAdv = getAutoAdvanceForEmployee(emp.id);
    const autoLvs = getAutoLeavesForEmployee(emp.id);
    const existing = payrollCustomizations[emp.id] || {};

    const [yearStr, monthStr] = payrollMonth.split("-");
    const year = parseInt(yearStr, 10) || 2026;
    const month = parseInt(monthStr, 10) || 7;
    const daysInMonth = new Date(year, month, 0).getDate();

    const puantajMap = existing.puantajDays && Object.keys(existing.puantajDays).length > 0
      ? existing.puantajDays
      : generateDefaultPuantaj(emp.id, payrollMonth, leaveRequests);

    const baseGrossVal = (existing.salaryType ?? emp.salaryType) === "gross"
      ? (existing.baseSalary ?? emp.salaryAmount)
      : (existing.baseSalary ?? emp.salaryAmount) * 1.38;

    const stats = calculatePuantajStats(puantajMap, daysInMonth, baseGrossVal);

    // Approximate net salary for legal deductions (e.g. 1/4 quarter salary calculation)
    const approxNet = (existing.salaryType ?? emp.salaryType) === "net"
      ? (existing.baseSalary ?? emp.salaryAmount)
      : Math.round(baseGrossVal * 0.71);
    const autoLegal = getAutoLegalDeductionsForEmployee(emp.id, approxNet);

    setEditingPayrollEmp(emp);
    setEditingPayrollForm({
      salaryType: existing.salaryType ?? emp.salaryType,
      baseSalary: existing.baseSalary ?? emp.salaryAmount,
      bonusAmount: existing.bonusAmount ?? 0,
      overtimePay: existing.overtimePay !== undefined ? existing.overtimePay : stats.calculatedOvertimePay,
      overtimeNormalHours: existing.overtimeNormalHours !== undefined ? existing.overtimeNormalHours : stats.overtimeNormalHours,
      overtimeWeekendHours: existing.overtimeWeekendHours !== undefined ? existing.overtimeWeekendHours : stats.overtimeWeekendHours,
      overtimeHolidayDays: existing.overtimeHolidayDays !== undefined ? existing.overtimeHolidayDays : stats.overtimeHolidayDays,
      overtimeHolidayHours: existing.overtimeHolidayHours !== undefined ? existing.overtimeHolidayHours : stats.overtimeHolidayHours,
      foodAllowance: existing.foodAllowance ?? (emp.foodAllowance || 0),
      roadAllowance: existing.roadAllowance ?? (emp.roadAllowance || 0),
      advanceDeduction: existing.advanceDeduction !== undefined ? existing.advanceDeduction : autoAdv.totalAdvance,
      advanceReason: existing.advanceReason ?? (autoAdv.reasons.length > 0 ? autoAdv.reasons.join(", ") : "Personel maaş avansı mahsubu"),
      unpaidLeaveDays: existing.unpaidLeaveDays !== undefined ? existing.unpaidLeaveDays : (stats.unpaidDays > 0 ? stats.unpaidDays : autoLvs.unpaidDays),
      missingDayReason: existing.missingDayReason ?? (autoLvs.reasons.length > 0 ? autoLvs.reasons.join(", ") : ""),
      missingDayCode: existing.missingDayCode ?? (autoLvs.primaryCode || "21"),
      besDeduction: existing.besDeduction !== undefined
        ? existing.besDeduction
        : (autoLegal.besDeduction > 0 ? autoLegal.besDeduction : (emp.hasBes ? Math.round((emp.salaryAmount * (emp.salaryType === "net" ? 1.38 : 1)) * 0.03) : 0)),
      besReason: existing.besReason ?? (emp.hasBes ? "%3 Otomatik BES Katılımı" : ""),
      executionDeduction: existing.executionDeduction !== undefined ? existing.executionDeduction : autoLegal.executionDeduction,
      executionReason: existing.executionReason ?? (autoLegal.executionDeduction > 0 ? autoLegal.reasonsSummary : ""),
      alimonyDeduction: existing.alimonyDeduction !== undefined ? existing.alimonyDeduction : autoLegal.alimonyDeduction,
      alimonyReason: existing.alimonyReason ?? (autoLegal.alimonyDeduction > 0 ? autoLegal.reasonsSummary : ""),
      otherDeductions: existing.otherDeductions !== undefined ? existing.otherDeductions : autoLegal.otherDeductions,
      otherReason: existing.otherReason ?? "",
      deductionReason: existing.deductionReason ?? autoLegal.reasonsSummary,
      notes: existing.notes ?? "",
      puantajDays: puantajMap,
      customPayments: existing.customPayments || [],
      customPaymentsTotal: existing.customPaymentsTotal || 0,
    });
  };

  const handleSaveEditPayroll = (
    e?: React.FormEvent,
    shouldAdvanceToNext: boolean = false,
    openPrintAfterSave: boolean = false
  ) => {
    if (e) e.preventDefault();
    if (!editingPayrollEmp) return;

    const currentEmp = editingPayrollEmp;
    const currentForm = { ...editingPayrollForm };

    // 1. Manuel girilen veya güncellenen Avans Kesintisi varsa Avans Yönetimine otomatik aktar & kaydet
    const advAmount = currentForm.advanceDeduction ?? 0;
    if (advAmount > 0) {
      const existingAdv = advanceRequests.find(
        (a) => a.employeeId === currentEmp.id && Math.abs(a.amount - advAmount) < 1
      );
      if (!existingAdv && onAddAdvanceRequest) {
        onAddAdvanceRequest({
          id: `adv-auto-${currentEmp.id}-${Date.now()}`,
          employeeId: currentEmp.id,
          employeeName: currentEmp.fullName,
          type: "Avans",
          amount: advAmount,
          requestDate: new Date().toISOString().split("T")[0],
          description: currentForm.advanceReason || `${payrollMonth} maaş hakedişinden mahsup edilmek üzere avans`,
          status: "approved",
          installmentCount: 1,
          notes: `${payrollMonth} bordrosundan otomatik senkronize edildi`,
        });
      }
    }

    // 2. Manuel girilen veya güncellenen Ücretsiz İzin varsa İzin Yönetimine otomatik aktar & kaydet
    const unpaidDays = currentForm.unpaidLeaveDays ?? 0;
    if (unpaidDays > 0) {
      const existingLeave = leaveRequests.find(
        (l) => l.employeeId === currentEmp.id && l.type === "unpaid" && l.daysCount === unpaidDays
      );
      if (!existingLeave && onAddLeaveRequest) {
        onAddLeaveRequest({
          id: `leave-auto-${currentEmp.id}-${Date.now()}`,
          employeeId: currentEmp.id,
          employeeName: currentEmp.fullName,
          type: "unpaid",
          startDate: `${payrollMonth}-01`,
          endDate: `${payrollMonth}-${String(Math.min(28, unpaidDays)).padStart(2, "0")}`,
          daysCount: unpaidDays,
          reason: currentForm.missingDayReason || "Ücretsiz mazeret izni / bordro puantaj eksik günü",
          status: "approved",
        });
      }
    }

    // 3. Kesinti açıklamalarını bordroya aktar ve birleşik açıklama oluştur
    const reasonParts: string[] = [];
    if ((currentForm.advanceDeduction ?? 0) > 0 && currentForm.advanceReason) {
      reasonParts.push(`Avans: ${currentForm.advanceReason}`);
    }
    if ((currentForm.unpaidLeaveDays ?? 0) > 0 && currentForm.missingDayReason) {
      reasonParts.push(`Eksik Gün (${currentForm.missingDayCode || "21"}): ${currentForm.missingDayReason}`);
    }
    if ((currentForm.executionDeduction ?? 0) > 0 && currentForm.executionReason) {
      reasonParts.push(`İcra: ${currentForm.executionReason}`);
    }
    if ((currentForm.alimonyDeduction ?? 0) > 0 && currentForm.alimonyReason) {
      reasonParts.push(`Nafaka: ${currentForm.alimonyReason}`);
    }
    if ((currentForm.besDeduction ?? 0) > 0 && currentForm.besReason) {
      reasonParts.push(`BES: ${currentForm.besReason}`);
    }
    if ((currentForm.otherDeductions ?? 0) > 0 && currentForm.otherReason) {
      reasonParts.push(`Diğer: ${currentForm.otherReason}`);
    }
    if (!currentForm.deductionReason && reasonParts.length > 0) {
      currentForm.deductionReason = reasonParts.join(" | ");
    }

    // 4. Mevcut personelin bordro ve puantaj ayarlarını kaydet
    setPayrollCustomizations((prev) => ({
      ...prev,
      [currentEmp.id]: {
        ...currentForm,
        isCustomized: true,
      },
    }));

    // 4. Doğrudan veya butonla hemen yazdırma istenmişse
    if (openPrintAfterSave) {
      setPayrollPrintSelectedEmpId(currentEmp.id);
      setPayrollPrintInitialMode("month");
      setIsPayrollPrintModalOpen(true);
      showToast(`✅ ${currentEmp.fullName} bordrosu kaydedildi. Bordro ve ekli evraklar yazdırmaya hazır.`);
      return;
    }

    // 5. Post-Save Print Dialog: Avans, İzin veya Kesinti varsa hemen yazdırma penceresi sun
    const hasAdvance = advAmount > 0;
    const hasUnpaidLeave = unpaidDays > 0;
    const hasLegalDeductions =
      (currentForm.executionDeduction ?? 0) > 0 ||
      (currentForm.alimonyDeduction ?? 0) > 0 ||
      (currentForm.otherDeductions ?? 0) > 0;

    // Personelleri Türkçe alfabeye göre sırala
    const sortedEmployeesAlphabetical = [...employees].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "tr")
    );
    const currentIndex = sortedEmployeesAlphabetical.findIndex((emp) => emp.id === currentEmp.id);
    const nextEmployee =
      currentIndex !== -1 && currentIndex + 1 < sortedEmployeesAlphabetical.length
        ? sortedEmployeesAlphabetical[currentIndex + 1]
        : null;

    setSavedPayrollForPrintModal({
      emp: currentEmp,
      form: currentForm,
      hasAdvance,
      hasUnpaidLeave,
      hasLegalDeductions,
      advAmount,
      unpaidDays,
      nextEmp: nextEmployee,
    });

    if (shouldAdvanceToNext && nextEmployee) {
      handleOpenEditPayroll(nextEmployee);
      showToast(
        `✅ ${currentEmp.fullName} bordrosu kaydedildi. Alfabetik sıradaki sonraki personel (${nextEmployee.fullName}) açıldı (${currentIndex + 2}/${sortedEmployeesAlphabetical.length}).`
      );
    } else if (!shouldAdvanceToNext) {
      showToast(`✅ ${currentEmp.fullName} bordrosu başarıyla kaydedildi. Belge ve yazdırma seçenekleri açıldı.`);
    } else {
      setEditingPayrollEmp(null);
      showToast(`🎉 ${currentEmp.fullName} bordrosu kaydedildi. Listedeki tüm personellerin bordroları hazır!`);
    }
  };

  if (isAddEmployeeOpen) {
    return (
        <DetailPageLayout
          title="Yeni Personel Kartı Oluştur"
          subtitle="Çalışanın kişisel, özlük ve maaş bilgilerini eksiksiz girin"
          breadcrumbs={[
            { label: "İnsan Kaynakları", onClick: handleBackToList },
            { label: "Yeni Personel Kartı", active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              Yeni Kayıt
            </span>
          }
          headerIcon={<UserPlus className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="add-employee-form"
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Kaydet ve Kartı Aç</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
            <form id="add-employee-form" onSubmit={handleCreateEmployeeSubmit} className="space-y-4">
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cinsiyet</label>
                  <select
                    value={newEmpForm.gender || "Erkek"}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="Erkek">Erkek ♂</option>
                    <option value="Kadın">Kadın ♀</option>
                  </select>
                </div>

                {/* Birth Date with 18 Year Old Warning */}
                <div>
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
                  <label className="block text-xs font-bold text-purple-900 mb-1">Görev Yaptığı Proje (Maliyet Ataması)</label>
                  <select
                    value={newEmpForm.projectId || ""}
                    onChange={(e) => {
                      const selectedPrj = costProjects.find((p) => p.id === e.target.value);
                      setNewEmpForm({
                        ...newEmpForm,
                        projectId: e.target.value,
                        projectName: selectedPrj ? selectedPrj.name : "",
                      });
                    }}
                    className="w-full bg-purple-50/50 border border-purple-200 rounded-xl p-2.5 text-sm font-semibold text-slate-900 cursor-pointer focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Proje Seçiniz (Yok / Genel Merkez) --</option>
                    {costProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
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
                  onClick={handleBackToList}
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
        </DetailPageLayout>
    );
  }

  // FULL-PAGE DETAIL VIEW: TOPLU BORDRO & PUANTAJ HAZIRLAMA
  if (isBulkPayrollModalOpen) {
    return (
      <BulkPayrollModal
        isOpen={isBulkPayrollModalOpen}
        onClose={() => setIsBulkPayrollModalOpen(false)}
        employees={employees}
        companySettings={companySettings}
        payrollMonth={payrollMonth}
        onMonthChange={(m) => setPayrollMonth(m)}
        leaveRequests={leaveRequests}
        advanceRequests={advanceRequests}
        legalDeductions={legalDeductions}
        payrollCustomizations={payrollCustomizations}
        onApplyBatchPayroll={handleApplyBatchPayroll}
        onOpenPayrollPrintModal={() => {
          setIsBulkPayrollModalOpen(false);
          setIsPayrollPrintModalOpen(true);
        }}
      />
    );
  }

  // FULL-PAGE DETAIL VIEW: BORDRO & PUANTAJ HESAPLAMA
  if (editingPayrollEmp) {
    return (
      <DetailPageLayout
          title={`Bordro & Puantaj Hesaplama - ${editingPayrollEmp.fullName}`}
          subtitle={`${payrollMonth} Dönemi • ${editingPayrollEmp.department} (${editingPayrollEmp.title}) • TC: ${editingPayrollEmp.tckn || "—"}`}
          breadcrumbs={[
            { label: "İnsan Kaynakları", onClick: handleBackToList },
            { label: "Bordrolar", onClick: handleBackToList },
            { label: editingPayrollEmp.fullName, active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              {payrollMonth} Dönemi
            </span>
          }
          headerIcon={<Calculator className="w-5 h-5 text-purple-700" />}
          actions={
            <div className="flex items-center gap-2">
              {/* Alfabetik Sıra ve Gezinme Butonları */}
              {(() => {
                const sortedAlphabetical = [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
                const currIdx = sortedAlphabetical.findIndex((e) => e.id === editingPayrollEmp.id);
                const prevEmp = currIdx > 0 ? sortedAlphabetical[currIdx - 1] : null;
                const nextEmp = currIdx !== -1 && currIdx + 1 < sortedAlphabetical.length ? sortedAlphabetical[currIdx + 1] : null;

                return (
                  <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl border border-purple-200 text-xs">
                    <button
                      type="button"
                      disabled={!prevEmp}
                      onClick={() => prevEmp && handleOpenEditPayroll(prevEmp)}
                      className="px-2.5 py-1 rounded-lg text-purple-900 font-bold hover:bg-purple-200/70 disabled:opacity-30 transition-all flex items-center gap-1 text-[11px] cursor-pointer disabled:cursor-not-allowed"
                      title={prevEmp ? `Önceki: ${prevEmp.fullName}` : "İlk personel"}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Önceki</span>
                    </button>

                    <span className="px-2 py-0.5 text-[11px] font-black text-purple-950 bg-white rounded-md border border-purple-200/80 shadow-2xs">
                      {currIdx !== -1 ? currIdx + 1 : 1} / {sortedAlphabetical.length}
                    </span>

                    <button
                      type="button"
                      disabled={!nextEmp}
                      onClick={() => nextEmp && handleOpenEditPayroll(nextEmp)}
                      className="px-2.5 py-1 rounded-lg text-purple-900 font-bold hover:bg-purple-200/70 disabled:opacity-30 transition-all flex items-center gap-1 text-[11px] cursor-pointer disabled:cursor-not-allowed"
                      title={nextEmp ? `Sonraki: ${nextEmp.fullName}` : "Son personel"}
                    >
                      <span className="hidden sm:inline">Sonraki</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={handleBackToList}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={() => handleSaveEditPayroll(undefined, false, true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:shadow-md"
                title="Bordroyu kaydet ve hemen ardından Bordro, Avans ve Ek Formlar yazdırma penceresini aç"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kaydet &</span> Hemen Yazdır
              </button>

              <button
                type="button"
                onClick={() => handleSaveEditPayroll(undefined, false, false)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                title="Bordroyu kaydet"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl w-full p-6 sm:p-8 border border-purple-100 shadow-sm space-y-6 max-w-7xl mx-auto">

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
                          <span>Personelin onaylı {formatTRY(autoAdv.totalAdvance)} tutarında avansı bulundu ve kesintilere aktarıldı.</span>
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

            {/* ---------------------------------------------------- */}
            {/* PUANTAJ TAKVİMİ & GÜN DAĞILIMI BÖLÜMÜ (2 SATIR DÜZENİ) */}
            {/* ---------------------------------------------------- */}
            {(() => {
              const [pYearStr, pMonthStr] = payrollMonth.split("-");
              const pYear = parseInt(pYearStr, 10) || 2026;
              const pMonth = parseInt(pMonthStr, 10) || 7;
              const daysInMonth = new Date(pYear, pMonth, 0).getDate();
              const monthNamesTr = [
                "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
              ];
              const dayNamesShortTr = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

              const currentPuantaj = editingPayrollForm.puantajDays || generateDefaultPuantaj(editingPayrollEmp.id, payrollMonth, leaveRequests);
              const curSalaryType = editingPayrollForm.salaryType ?? editingPayrollEmp.salaryType;
              const curBaseSalary = editingPayrollForm.baseSalary ?? editingPayrollEmp.salaryAmount;
              const curBaseGross = curSalaryType === "gross" ? curBaseSalary : curBaseSalary * 1.38;
              const stats = calculatePuantajStats(currentPuantaj, daysInMonth, curBaseGross);

              const handleDayCodeChange = (dayNum: number, newCode: PuantajCode) => {
                const existing = currentPuantaj[dayNum] || { code: "N" };
                const updatedDay: DayPuantajDetail = {
                  ...existing,
                  code: newCode,
                };
                const updated = {
                  ...currentPuantaj,
                  [dayNum]: updatedDay,
                };
                const newStats = calculatePuantajStats(updated, daysInMonth, curBaseGross);
                setEditingPayrollForm((prev) => ({
                  ...prev,
                  puantajDays: updated,
                  unpaidLeaveDays: newStats.unpaidDays,
                  overtimePay: newStats.calculatedOvertimePay,
                  overtimeNormalHours: newStats.overtimeNormalHours,
                  overtimeWeekendHours: newStats.overtimeWeekendHours,
                  overtimeHolidayDays: newStats.overtimeHolidayDays,
                  overtimeHolidayHours: newStats.overtimeHolidayHours,
                }));
              };

              const handleDayOvertimeChange = (dayNum: number, hours: number) => {
                const existing = currentPuantaj[dayNum] || { code: "N" };
                const updatedDay: DayPuantajDetail = {
                  ...existing,
                  overtimeHours: hours > 0 ? hours : undefined,
                };
                const updated = {
                  ...currentPuantaj,
                  [dayNum]: updatedDay,
                };
                const newStats = calculatePuantajStats(updated, daysInMonth, curBaseGross);
                setEditingPayrollForm((prev) => ({
                  ...prev,
                  puantajDays: updated,
                  overtimePay: newStats.calculatedOvertimePay,
                  overtimeNormalHours: newStats.overtimeNormalHours,
                  overtimeWeekendHours: newStats.overtimeWeekendHours,
                  overtimeHolidayDays: newStats.overtimeHolidayDays,
                  overtimeHolidayHours: newStats.overtimeHolidayHours,
                }));
              };

              const handleToggleHolidayFullDayOvertime = (dayNum: number) => {
                const existing = currentPuantaj[dayNum] || { code: "N" };
                const updatedDay: DayPuantajDetail = {
                  ...existing,
                  isHolidayOvertime: !existing.isHolidayOvertime,
                };
                const updated = {
                  ...currentPuantaj,
                  [dayNum]: updatedDay,
                };
                const newStats = calculatePuantajStats(updated, daysInMonth, curBaseGross);
                setEditingPayrollForm((prev) => ({
                  ...prev,
                  puantajDays: updated,
                  overtimePay: newStats.calculatedOvertimePay,
                  overtimeNormalHours: newStats.overtimeNormalHours,
                  overtimeWeekendHours: newStats.overtimeWeekendHours,
                  overtimeHolidayDays: newStats.overtimeHolidayDays,
                  overtimeHolidayHours: newStats.overtimeHolidayHours,
                }));
              };

              const handleCycleDayCode = (dayNum: number) => {
                const codeOrder: PuantajCode[] = ["N", "HT", "RT", "Yİ", "Üİ", "Dİ", "R", "M"];
                const raw = currentPuantaj[dayNum];
                const currentCode: PuantajCode = typeof raw === "string" ? raw : raw ? raw.code : "N";
                const nextIdx = (codeOrder.indexOf(currentCode) + 1) % codeOrder.length;
                handleDayCodeChange(dayNum, codeOrder[nextIdx]);
              };

              const handleResetToAutoPuantaj = () => {
                const fresh = generateDefaultPuantaj(editingPayrollEmp.id, payrollMonth, leaveRequests);
                const newStats = calculatePuantajStats(fresh, daysInMonth, curBaseGross);
                setEditingPayrollForm((prev) => ({
                  ...prev,
                  puantajDays: fresh,
                  unpaidLeaveDays: newStats.unpaidDays,
                  overtimePay: newStats.calculatedOvertimePay,
                  overtimeNormalHours: newStats.overtimeNormalHours,
                  overtimeWeekendHours: newStats.overtimeWeekendHours,
                  overtimeHolidayDays: newStats.overtimeHolidayDays,
                  overtimeHolidayHours: newStats.overtimeHolidayHours,
                }));
              };

              // 2 Satıra bölme (1. Satır: 1 - 15/16. gün, 2. Satır: kalan günler)
              const halfCount = Math.ceil(daysInMonth / 2);
              const row1Days = Array.from({ length: halfCount }, (_, i) => i + 1);
              const row2Days = Array.from({ length: daysInMonth - halfCount }, (_, i) => halfCount + i + 1);

              const renderDayCard = (dayNum: number) => {
                const d = new Date(pYear, pMonth - 1, dayNum);
                const dayOfWeek = d.getDay();
                const dayName = dayNamesShortTr[dayOfWeek];
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const raw = currentPuantaj[dayNum];
                const code: PuantajCode = typeof raw === "string" ? raw : raw ? raw.code : "N";
                const otHours = typeof raw === "object" && raw ? (raw.overtimeHours || 0) : 0;
                const isHolOt = typeof raw === "object" && raw ? Boolean(raw.isHolidayOvertime) : false;
                const cfg = PUANTAJ_CODE_CONFIG[code] || PUANTAJ_CODE_CONFIG["N"];
                const holiday = getTurkishOfficialHoliday(pYear, pMonth, dayNum);

                const isSpecialDay = code === "RT" || code === "HT";

                return (
                  <div
                    key={dayNum}
                    className={`group relative flex flex-col justify-between p-1.5 rounded-xl border transition-all hover:shadow-md ${cfg.bgClass} ${cfg.borderClass} min-w-[54px]`}
                  >
                    {/* Üst Kısım: Gün Adı & Gün Numarası */}
                    <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 border-b border-black/5 pb-0.5 mb-1">
                      <span className={isWeekend ? "text-purple-700 font-extrabold" : "text-slate-600"}>
                        {dayName}
                      </span>
                      <span className="font-black text-slate-900 text-[11px] bg-white/90 px-1 rounded shadow-2xs">
                        {dayNum}
                      </span>
                    </div>

                    {/* Orta Kısım: Kod Rozeti & Tıklama ile Değiştirme */}
                    <div
                      onClick={() => handleCycleDayCode(dayNum)}
                      className={`w-full py-1 rounded-lg font-black text-xs flex items-center justify-center shadow-2xs cursor-pointer select-none transition-transform active:scale-95 hover:opacity-90 ${cfg.badgeClass}`}
                      title={`${dayNum} ${monthNamesTr[pMonth - 1]} (${dayName}) - ${cfg.label}. Tıklayarak kodu değiştirin.`}
                    >
                      {code}
                    </div>

                    {/* Tatil / Açıklama Metni */}
                    <div className="w-full truncate text-[8.5px] font-extrabold text-slate-700 mt-0.5 text-center">
                      {holiday ? (
                        <span className="text-red-700 font-black truncate block" title={holiday}>
                          {holiday.length > 7 ? holiday.slice(0, 6) + ".." : holiday}
                        </span>
                      ) : (
                        <span className="truncate block opacity-80">{cfg.label}</span>
                      )}
                    </div>

                    {/* Alt Kısım: Fazla Mesai Saati Girişi & Tam Gün Tatil Çalışması */}
                    <div className="mt-1 pt-1 border-t border-black/5 flex flex-col gap-1">
                      {/* Saatlik Mesai Giriş Alanı */}
                      <div className="flex items-center gap-0.5 justify-center" title="Bu güne ait fazla mesai saati (örn: 2 veya 3.5)">
                        <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={otHours > 0 ? otHours : ""}
                          placeholder="0s"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleDayOvertimeChange(dayNum, isNaN(val) ? 0 : val);
                          }}
                          className="w-9 h-5 text-[10px] font-black text-center bg-white border border-slate-300 rounded px-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 placeholder:text-slate-300 shadow-2xs"
                        />
                      </div>

                      {/* Tatil veya Hafta Tatilinde Tam Gün Çalışma Butonu */}
                      {isSpecialDay && (
                        <button
                          type="button"
                          onClick={() => handleToggleHolidayFullDayOvertime(dayNum)}
                          className={`w-full text-[8px] font-black py-0.5 px-0.5 rounded transition-all cursor-pointer text-center leading-tight shadow-2xs ${
                            isHolOt
                              ? "bg-amber-600 text-white ring-1 ring-amber-700 font-black"
                              : "bg-white/80 border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-900"
                          }`}
                          title={code === "RT" ? "4857 Sayılı Kanun Md. 47: Resmi tatil günü tam gün çalışma (+1 yevmiye)" : "Hafta tatili tam gün çalışma"}
                        >
                          {isHolOt ? "✓ Mesaili" : "+ Tam Gün"}
                        </button>
                      )}
                    </div>

                    {/* Açılır Kod Seçici */}
                    <select
                      value={code}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleDayCodeChange(dayNum, e.target.value as PuantajCode);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-none"
                      title="Puantaj Kodunu Değiştir"
                      tabIndex={-1}
                    >
                      {(Object.keys(PUANTAJ_CODE_CONFIG) as PuantajCode[]).map((c) => (
                        <option key={c} value={c}>
                          {dayNum} {monthNamesTr[pMonth - 1]} ({dayName}) : {c} - {PUANTAJ_CODE_CONFIG[c].label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              };

              return (
                <div className="bg-purple-50/40 rounded-3xl border border-purple-200/80 p-4 sm:p-5 space-y-4 shadow-2xs">
                  {/* Puantaj Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          Puantaj Takvimi & Fazla Mesai Çizelgesi (2 Satır Görünüm)
                          <span className="bg-purple-100 text-purple-900 text-[11px] font-bold px-2 py-0.5 rounded-md border border-purple-300">
                            {monthNamesTr[pMonth - 1]} {pYear} ({daysInMonth} Gün)
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Kutucuğa tıklayarak puantaj kodunu değiştirebilir, altındaki kutudan o güne ait <strong>fazla mesai saatini</strong> girebilirsiniz.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAdditionalPaymentsModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-black hover:bg-purple-800 transition-all cursor-pointer shadow-xs hover:shadow-md"
                        title="Yemek yardımı, ulaşım ve serbest ek ödemeleri yapılandır ve bordroya aktar"
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-300" />
                        Ek Ödemeler
                        {((editingPayrollForm.foodAllowance || 0) > 0 ||
                          (editingPayrollForm.roadAllowance || 0) > 0 ||
                          (editingPayrollForm.customPaymentsTotal || 0) > 0 ||
                          (editingPayrollForm.customPayments?.length || 0) > 0) && (
                          <span className="bg-amber-400 text-purple-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                            {formatTRY(
                              (editingPayrollForm.foodAllowance || 0) +
                                (editingPayrollForm.roadAllowance || 0) +
                                (editingPayrollForm.customPaymentsTotal ||
                                  editingPayrollForm.customPayments?.reduce((s, p) => s + p.amount, 0) ||
                                  0)
                            )}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetToAutoPuantaj}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer shadow-2xs"
                        title="Resmi tatil ve onaylı izinlere göre puantajı yeniden oluşturur"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Puantajı Otomatik Yenile
                      </button>
                    </div>
                  </div>

                  {/* PUANTAJ KODLARI & AÇIKLAMA LEJANTI (LEGEND) */}
                  <div className="bg-white rounded-2xl border border-purple-100 p-3 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-purple-950 tracking-wider">
                        Puantaj Kodları ve Renk Anlamları
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                        Koda tıklayarak veya kart üzerinden tek tıkla değiştirebilirsiniz
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {(Object.keys(PUANTAJ_CODE_CONFIG) as PuantajCode[]).map((c) => {
                        const cfg = PUANTAJ_CODE_CONFIG[c];
                        let count = 0;
                        if (c === "N") count = stats.countN;
                        else if (c === "HT") count = stats.countHT;
                        else if (c === "RT") count = stats.countRT;
                        else if (c === "Yİ") count = stats.countYI;
                        else if (c === "Üİ") count = stats.countUI;
                        else if (c === "Dİ") count = stats.countDI;
                        else if (c === "R") count = stats.countR;
                        else if (c === "M") count = stats.countM;

                        return (
                          <div
                            key={c}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${cfg.badgeClass}`}>
                                {c}
                              </span>
                              <div className="truncate">
                                <span className="block text-[11px] font-black truncate">{cfg.label}</span>
                              </div>
                            </div>
                            <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-white/80 border border-black/5 shadow-2xs shrink-0">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PUANTAJ TAKVİM GÜNLERİ IZGARASI - İKİ SATIR OLARAK DÜZENLENDİ */}
                  <div className="bg-white rounded-2xl border border-purple-200/70 p-3.5 shadow-2xs space-y-3 overflow-x-auto">
                    {/* Satır 1: Ayın 1. Yarısı (1 - 15/16. Gün) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-black text-purple-950 px-1 border-b border-purple-100 pb-1">
                        <span>1. Satır · 1 - {halfCount} {monthNamesTr[pMonth - 1]}</span>
                        <span className="text-slate-400 font-semibold text-[10px]">İlk Yarı</span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-16 gap-1.5">
                        {row1Days.map((dayNum) => renderDayCard(dayNum))}
                      </div>
                    </div>

                    {/* Satır 2: Ayın 2. Yarısı (16/17 - 30/31. Gün) */}
                    <div className="space-y-1.5 pt-2 border-t border-purple-100">
                      <div className="flex items-center justify-between text-[11px] font-black text-purple-950 px-1 border-b border-purple-100 pb-1">
                        <span>2. Satır · {halfCount + 1} - {daysInMonth} {monthNamesTr[pMonth - 1]}</span>
                        <span className="text-slate-400 font-semibold text-[10px]">İkinci Yarı</span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-16 gap-1.5">
                        {row2Days.map((dayNum) => renderDayCard(dayNum))}
                      </div>
                    </div>
                  </div>

                  {/* PUANTAJ ÖZET HAKEDİŞ İCMALİ */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-emerald-950 shadow-2xs">
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase">Normal Çalışma (N)</span>
                      <span className="text-base font-black text-emerald-900">{stats.countN} Gün</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-purple-950 shadow-2xs">
                      <span className="block text-[10px] font-bold text-purple-700 uppercase">Hafta Tatili (HT)</span>
                      <span className="text-base font-black text-purple-900">{stats.countHT} Gün</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-red-200 text-red-950 shadow-2xs">
                      <span className="block text-[10px] font-bold text-red-700 uppercase">Resmi Tatil (RT)</span>
                      <span className="text-base font-black text-red-900">{stats.countRT} Gün</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-teal-200 text-teal-950 shadow-2xs">
                      <span className="block text-[10px] font-bold text-teal-700 uppercase">Ücretli İzin (Yİ+Üİ)</span>
                      <span className="text-base font-black text-teal-900">{stats.countYI + stats.countUI} Gün</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-sky-200 text-sky-950 shadow-2xs">
                      <span className="block text-[10px] font-bold text-sky-700 uppercase">Doğum İzni (Dİ)</span>
                      <span className="text-base font-black text-sky-900">{stats.countDI} Gün</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-rose-200 text-rose-950 shadow-2xs">
                      <span className="block text-[10px] font-bold text-rose-700 uppercase">Eksik Gün (M+R)</span>
                      <span className="text-base font-black text-rose-900">{stats.unpaidDays} Gün</span>
                    </div>

                    <div className="bg-purple-900 text-white p-2.5 rounded-xl border border-purple-950 shadow-2xs">
                      <span className="block text-[10px] font-bold text-purple-200 uppercase">SGK Prim Günü</span>
                      <span className="text-base font-black text-white">{stats.sgkDays} / 30 Gün</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSaveEditPayroll} className="space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
                {/* Salary Type & Amount */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800 uppercase text-[11px]">Maaş Anlaşma Tipi & Temel Ücret</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={editingPayrollForm.salaryType || "net"}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        const curSal = editingPayrollForm.baseSalary ?? 0;
                        const newGross = newType === "gross" ? curSal : curSal * 1.38;
                        const [pYearStr, pMonthStr] = payrollMonth.split("-");
                        const pYear = parseInt(pYearStr, 10) || 2026;
                        const pMonth = parseInt(pMonthStr, 10) || 7;
                        const daysInMonth = new Date(pYear, pMonth, 0).getDate();
                        const curPuantaj = editingPayrollForm.puantajDays || generateDefaultPuantaj(editingPayrollEmp.id, payrollMonth, leaveRequests);
                        const newStats = calculatePuantajStats(curPuantaj, daysInMonth, newGross);
                        setEditingPayrollForm({
                          ...editingPayrollForm,
                          salaryType: newType,
                          overtimePay: newStats.calculatedOvertimePay,
                        });
                      }}
                      className="bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="net">NET</option>
                      <option value="gross">BRÜT</option>
                    </select>
                    <input
                      type="number"
                      required
                      value={editingPayrollForm.baseSalary ?? 0}
                      onChange={(e) => {
                        const newSal = Number(e.target.value);
                        const curType = editingPayrollForm.salaryType || "net";
                        const newGross = curType === "gross" ? newSal : newSal * 1.38;
                        const [pYearStr, pMonthStr] = payrollMonth.split("-");
                        const pYear = parseInt(pYearStr, 10) || 2026;
                        const pMonth = parseInt(pMonthStr, 10) || 7;
                        const daysInMonth = new Date(pYear, pMonth, 0).getDate();
                        const curPuantaj = editingPayrollForm.puantajDays || generateDefaultPuantaj(editingPayrollEmp.id, payrollMonth, leaveRequests);
                        const newStats = calculatePuantajStats(curPuantaj, daysInMonth, newGross);
                        setEditingPayrollForm({
                          ...editingPayrollForm,
                          baseSalary: newSal,
                          overtimePay: newStats.calculatedOvertimePay,
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Ek Ödemeler & Yan Haklar ve Sabit Manuel Kesinti Paneli (Yan Yana Birebir Uyumlu Twin Paneller) */}
                {(() => {
                  const curSalType = editingPayrollForm.salaryType ?? "net";
                  const curBaseSal = editingPayrollForm.baseSalary ?? 0;
                  const curBaseGross = curSalType === "gross" ? curBaseSal : curBaseSal * 1.38;
                  const [pYearStr, pMonthStr] = payrollMonth.split("-");
                  const pYear = parseInt(pYearStr, 10) || 2026;
                  const pMonth = parseInt(pMonthStr, 10) || 7;
                  const daysInMonth = new Date(pYear, pMonth, 0).getDate();
                  const curPuantaj = editingPayrollForm.puantajDays || generateDefaultPuantaj(editingPayrollEmp.id, payrollMonth, leaveRequests);
                  const otStats = calculatePuantajStats(curPuantaj, daysInMonth, curBaseGross);

                  return (
                    <PayrollAdjustmentsTwinPanels
                      employee={editingPayrollEmp}
                      form={editingPayrollForm}
                      onChangeForm={setEditingPayrollForm}
                      showToast={showToast}
                      formatTRY={formatTRY}
                      onOpenAdditionalPaymentsModal={() => setIsAdditionalPaymentsModalOpen(true)}
                      getAutoAdvance={getAutoAdvanceForEmployee}
                      getAutoLeaves={getAutoLeavesForEmployee}
                      getAutoLegalDeductions={getAutoLegalDeductionsForEmployee}
                      otStats={otStats}
                    />
                  );
                })()}

              </div>

              {/* Calculated Live Breakdown Summary */}
              {(() => {
                const baseSal = editingPayrollForm.baseSalary ?? 0;
                const salType = editingPayrollForm.salaryType ?? "net";
                const bonus = editingPayrollForm.bonusAmount ?? 0;
                const overtime = editingPayrollForm.overtimePay ?? 0;
                const food = editingPayrollForm.foodAllowance ?? 0;
                const road = editingPayrollForm.roadAllowance ?? 0;
                const customPaymentsTotal = editingPayrollForm.customPaymentsTotal !== undefined
                  ? editingPayrollForm.customPaymentsTotal
                  : (editingPayrollForm.customPayments ? editingPayrollForm.customPayments.reduce((s, p) => s + (p.amount || 0), 0) : 0);
                const advDeduct = editingPayrollForm.advanceDeduction ?? 0;
                const lvsDays = editingPayrollForm.unpaidLeaveDays ?? 0;

                const baseGross = salType === "gross" ? baseSal : baseSal * 1.38;
                const unpaidLeaveDeduction = Math.round((baseGross / 30) * lvsDays);
                const grossSal = Math.max(0, baseGross + bonus + overtime + food + road + customPaymentsTotal - unpaidLeaveDeduction);

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
                  <div
                    id="payroll-deductions-summary-section"
                    className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] uppercase font-bold text-purple-300 block">Canlı Bordro Hakediş Özeti</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {lvsDays > 0 && (
                          <span className="text-[10px] bg-rose-500/30 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded-full font-bold">
                            ✓ SGK Eksik Gün Formu Eklendi ({lvsDays} Gün)
                          </span>
                        )}
                        {(food > 0 || road > 0 || customPaymentsTotal > 0) && (
                          <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                            ✓ Ek Ödemeler Dahil (+{formatTRY(food + road + customPaymentsTotal)})
                          </span>
                        )}
                        {(advDeduct > 0 || execDed > 0 || aliDed > 0 || othDed > 0) && (
                          <span className="text-[10px] bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                            ✓ Kesinti / Avans Formu Eklendi (-{formatTRY(advDeduct + execDed + aliDed + othDed)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hesaplanan Brüt</span>
                        <span className="font-bold text-white text-sm sm:text-base">{formatTRY(grossSal)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Eksik Gün Kesintisi ({lvsDays} Gün)</span>
                        <span className="font-bold text-rose-300 text-sm sm:text-base">{formatTRY(unpaidLeaveDeduction)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">SGK + Vergi Kesintisi</span>
                        <span className="font-bold text-amber-300 text-sm sm:text-base">{formatTRY(sgkEmp + unempEmp + incTax + stamp)}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 block text-[10px] font-bold">NET ÖDENECEK MAAŞ</span>
                        <span className="font-black text-emerald-300 text-base sm:text-lg">{formatTRY(payableNet)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const autoAdv = getAutoAdvanceForEmployee(editingPayrollEmp.id);
                    const autoLvs = getAutoLeavesForEmployee(editingPayrollEmp.id);
                    const freshPuantaj = generateDefaultPuantaj(editingPayrollEmp.id, payrollMonth, leaveRequests);
                    const [yearStr, monthStr] = payrollMonth.split("-");
                    const year = parseInt(yearStr, 10) || 2026;
                    const month = parseInt(monthStr, 10) || 7;
                    const daysInMonth = new Date(year, month, 0).getDate();
                    const freshStats = calculatePuantajStats(freshPuantaj, daysInMonth);

                    setEditingPayrollForm({
                      salaryType: editingPayrollEmp.salaryType,
                      baseSalary: editingPayrollEmp.salaryAmount,
                      bonusAmount: 0,
                      overtimePay: 0,
                      foodAllowance: editingPayrollEmp.foodAllowance || 0,
                      roadAllowance: editingPayrollEmp.roadAllowance || 0,
                      advanceDeduction: autoAdv.totalAdvance,
                      advanceReason: autoAdv.reasons.join(", "),
                      unpaidLeaveDays: freshStats.unpaidDays > 0 ? freshStats.unpaidDays : autoLvs.unpaidDays,
                      missingDayReason: autoLvs.reasons.join(", "),
                      missingDayCode: autoLvs.primaryCode || "21",
                      besDeduction: editingPayrollEmp.hasBes ? Math.round((editingPayrollEmp.salaryAmount * (editingPayrollEmp.salaryType === "net" ? 1.38 : 1)) * 0.03) : 0,
                      executionDeduction: 0,
                      alimonyDeduction: 0,
                      otherDeductions: 0,
                      deductionReason: "",
                      notes: "",
                      puantajDays: freshPuantaj,
                    });
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Varsayılanlara Sıfırla
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveEditPayroll(undefined, false, true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg"
                    title="Bordroyu kaydet ve hemen ardından Bordro, Avans ve Ek Formlar yazdırma penceresini aç"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Kaydet & Hemen Yazdır</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveEditPayroll(undefined, false, false)}
                    className="px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    title="Bu personeli kaydet ve evrak yazdırma seçeneklerini göster"
                  >
                    Kaydet
                  </button>

                  {(() => {
                    const sortedAlphabetical = [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
                    const currIdx = sortedAlphabetical.findIndex((e) => e.id === editingPayrollEmp.id);
                    const nextEmp = currIdx !== -1 && currIdx + 1 < sortedAlphabetical.length ? sortedAlphabetical[currIdx + 1] : null;

                    return (
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
                        title={
                          nextEmp
                            ? `Kaydet ve alfabetik sıradaki sonraki personel (${nextEmp.fullName}) için bordroyu aç`
                            : "Bordroyu kaydet ve tamamla"
                        }
                      >
                        <span>{nextEmp ? `Kaydet & Sıradakine Geç (${nextEmp.fullName.split(" ")[0]})` : "Kaydet ve Tamamla"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </form>
          </div>

          {isAdditionalPaymentsModalOpen && editingPayrollEmp && (
            <AdditionalPaymentsModal
              isOpen={isAdditionalPaymentsModalOpen}
              onClose={() => setIsAdditionalPaymentsModalOpen(false)}
              employeeName={editingPayrollEmp.fullName}
              actualWorkDays={
                editingPayrollForm.puantajDays
                  ? Object.values(editingPayrollForm.puantajDays as Record<string, { code?: string }>).filter((d) => d.code === "N").length || 22
                  : 22
              }
              initialFoodAllowance={editingPayrollForm.foodAllowance ?? editingPayrollEmp.foodAllowance ?? 0}
              initialRoadAllowance={editingPayrollForm.roadAllowance ?? editingPayrollEmp.roadAllowance ?? 0}
              initialCustomPayments={editingPayrollForm.customPayments ?? []}
              onApply={({ foodAllowance, roadAllowance, customPayments, customPaymentsTotal, notesSummary }) => {
                setEditingPayrollForm((prev) => ({
                  ...prev,
                  foodAllowance,
                  roadAllowance,
                  customPayments,
                  customPaymentsTotal,
                  notes: notesSummary ? (prev.notes ? `${prev.notes} | ${notesSummary}` : notesSummary) : prev.notes,
                }));
                showToast("🎁 Ek ödemeler bordro hesaplamasına başarıyla aktarıldı!");
              }}
            />
          )}

          {/* -------------------------------------------------------------------- */}
        </DetailPageLayout>
    );
  }

  // FULL-PAGE DETAIL VIEW: BORDRO PUSULASI
  if (selectedPayrollRecord) {
    return (
      <DetailPageLayout
          title={`Ücret Hesap Pusulası - ${selectedPayrollRecord.employeeName}`}
          subtitle={`Bordro Dönemi: ${selectedPayrollRecord.monthYear} • Departman: ${selectedPayrollRecord.department} • Net Maaş: ${formatTRY(selectedPayrollRecord.payableNetSalary)}`}
          breadcrumbs={[
            { label: "İnsan Kaynakları", onClick: handleBackToList },
            { label: "Bordrolar", onClick: handleBackToList },
            { label: `${selectedPayrollRecord.employeeName} (${selectedPayrollRecord.monthYear})`, active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">
              {formatTRY(selectedPayrollRecord.payableNetSalary)}
            </span>
          }
          headerIcon={<Receipt className="w-5 h-5 text-purple-700" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> <span>Yazdır / PDF</span>
              </button>
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Geri Dön
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 mx-auto">

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
                <span className="font-bold text-slate-900">{formatTRY(selectedPayrollRecord.grossSalary)}</span>
              </div>

              {Boolean(selectedPayrollRecord.bonusAmount) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                  <span>+ Prim / İkramiye:</span>
                  <span className="font-bold">+{formatTRY(selectedPayrollRecord.bonusAmount || 0)}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.overtimePay) && (
                <div className="border-b border-slate-200 py-1 text-emerald-700 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold">+ Fazla Mesai Toplamı:</span>
                    <span className="font-black">+{formatTRY(selectedPayrollRecord.overtimePay || 0)}</span>
                  </div>
                  {(Boolean(selectedPayrollRecord.overtimeNormalHours) ||
                    Boolean(selectedPayrollRecord.overtimeWeekendHours) ||
                    Boolean(selectedPayrollRecord.overtimeHolidayHours) ||
                    Boolean(selectedPayrollRecord.overtimeHolidayDays)) && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50/70 p-1.5 rounded-lg space-y-0.5 font-semibold">
                      {Boolean(selectedPayrollRecord.overtimeNormalHours) && (
                        <div className="flex justify-between">
                          <span>· Hafta İçi (%50 zamlı):</span>
                          <span>{selectedPayrollRecord.overtimeNormalHours} Saat</span>
                        </div>
                      )}
                      {Boolean(selectedPayrollRecord.overtimeWeekendHours) && (
                        <div className="flex justify-between">
                          <span>· Hafta Tatili (%100 zamlı):</span>
                          <span>{selectedPayrollRecord.overtimeWeekendHours} Saat</span>
                        </div>
                      )}
                      {Boolean(selectedPayrollRecord.overtimeHolidayHours) && (
                        <div className="flex justify-between">
                          <span>· Resmi Tatil Saat (%100 zamlı):</span>
                          <span>{selectedPayrollRecord.overtimeHolidayHours} Saat</span>
                        </div>
                      )}
                      {Boolean(selectedPayrollRecord.overtimeHolidayDays) && (
                        <div className="flex justify-between">
                          <span>· Resmi Tatil Tam Gün (1 Yevmiye):</span>
                          <span>{selectedPayrollRecord.overtimeHolidayDays} Gün</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">SGK İşçi Payı (%14):</span>
                <span className="text-slate-800">{formatTRY(selectedPayrollRecord.sgkEmployeeShare)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">İşsizlik Sigortası İşçi (%1):</span>
                <span className="text-slate-800">{formatTRY(selectedPayrollRecord.unemploymentEmployeeShare)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Gelir Vergisi:</span>
                <span className="text-slate-800">{formatTRY(selectedPayrollRecord.incomeTax)}</span>
              </div>

              {Boolean(selectedPayrollRecord.advanceDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-amber-800 bg-amber-50/50 px-2 py-1 rounded-lg">
                  <span>- Avans Kesintisi (Entegre):</span>
                  <span className="font-bold">-{formatTRY(selectedPayrollRecord.advanceDeduction || 0)}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.unpaidLeaveDays) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-rose-800 bg-rose-50/50 px-2 py-1 rounded-lg">
                  <span>- Ücretsiz İzin Kesintisi ({selectedPayrollRecord.unpaidLeaveDays} Gün):</span>
                  <span className="font-bold">-{formatTRY(selectedPayrollRecord.unpaidLeaveDeduction || 0)}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.besDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                  <span>- BES Kesintisi:</span>
                  <span className="font-bold">-{formatTRY(selectedPayrollRecord.besDeduction || 0)}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.executionDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-red-800 bg-red-50/50 px-2 py-1 rounded-lg">
                  <span className="font-bold">- İcra Kesintisi:</span>
                  <span className="font-extrabold">-{formatTRY(selectedPayrollRecord.executionDeduction || 0)}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.alimonyDeduction) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-purple-800 bg-purple-50/50 px-2 py-1 rounded-lg">
                  <span className="font-bold">- Nafaka Kesintisi:</span>
                  <span className="font-extrabold">-{formatTRY(selectedPayrollRecord.alimonyDeduction || 0)}</span>
                </div>
              )}

              {Boolean(selectedPayrollRecord.otherDeductions) && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-800 bg-slate-100/70 px-2 py-1 rounded-lg">
                  <span>- Diğer Kesintiler:</span>
                  <span className="font-bold">-{formatTRY(selectedPayrollRecord.otherDeductions || 0)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-slate-300 font-black text-sm text-emerald-800 bg-emerald-50 px-3 rounded-xl mt-2">
                <span>NET ÖDENECEK MAAŞ:</span>
                <span>{formatTRY(selectedPayrollRecord.payableNetSalary)}</span>
              </div>
              <div className="flex justify-between py-1 pt-1">
                <span className="text-slate-500">Toplam İşveren Maliyeti:</span>
                <span className="font-bold text-purple-900">{formatTRY(selectedPayrollRecord.totalEmployerCost)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer"
              >
                Geri Dön
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Yazdır / PDF
              </button>
            </div>
          </div>
        </DetailPageLayout>
    );
  }

  // FULL-PAGE DETAIL VIEW: IZIN TALEBI
  if (isAddLeaveOpen) {
    return (
      <DetailPageLayout
          title="Yeni İzin Talebi Oluştur"
          subtitle="Yıllık ücretli izin, analık, babalık, mazeret ve ücretsiz izin kayıtları"
          breadcrumbs={[
            { label: "İnsan Kaynakları", onClick: handleBackToList },
            { label: "İzin Talepleri", onClick: handleBackToList },
            { label: "Yeni İzin", active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              Yeni Talep
            </span>
          }
          headerIcon={<Calendar className="w-5 h-5 text-purple-700" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="add-leave-form"
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>Talebi Oluştur</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 mx-auto">
            <form id="add-leave-form" onSubmit={handleCreateLeaveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personel Seçin *</label>
                <select
                  value={newLeaveForm.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const emp = employees.find((x) => x.id === empId);
                    setNewLeaveForm((prev) => ({
                      ...prev,
                      employeeId: empId,
                      // If selecting male and currently female maternity, adjust or vice versa
                      type: prev.type,
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 cursor-pointer"
                >
                  {[...employees]
                    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.gender === "Kadın" ? "Kadın ♀" : "Erkek ♂"} · {emp.department} - {emp.title})
                      </option>
                    ))}
                </select>

                {(() => {
                  const selEmp = employees.find((e) => e.id === newLeaveForm.employeeId) || employees[0];
                  if (!selEmp) return null;
                  return (
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <span>Seçilen Çalışan:</span>
                      <strong className="text-slate-900">{selEmp.fullName}</strong>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        selEmp.gender === "Kadın"
                          ? "bg-pink-100 text-pink-800 border-pink-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>
                        {selEmp.gender === "Kadın" ? "Kadın ♀" : "Erkek ♂"}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-purple-700 font-bold">{selEmp.department}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Hızlı İzin Şablonları */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hızlı Yasal İzin Şablonları</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const start = newLeaveForm.startDate || new Date().toISOString().split("T")[0];
                      const end = addDaysToDate(start, 5);
                      setNewLeaveForm({
                        ...newLeaveForm,
                        type: "Babalık İzni (Erkek Doğum İzni)",
                        daysCount: 5,
                        startDate: start,
                        endDate: end,
                        reason: "4857 Sayılı İş Kanunu Ek Md. 2 Uyarınca Eşi Doğum Yapan Erkek Personel Babalık İzni",
                      });
                    }}
                    className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                      newLeaveForm.type === "Babalık İzni (Erkek Doğum İzni)"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200"
                    }`}
                  >
                    <span>🍼</span>
                    <span>Babalık İzni (Erkek Doğum - 5 Gün)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const start = newLeaveForm.startDate || new Date().toISOString().split("T")[0];
                      const end = addDaysToDate(start, 112);
                      setNewLeaveForm({
                        ...newLeaveForm,
                        type: "Analık / Doğum İzni",
                        daysCount: 112,
                        startDate: start,
                        endDate: end,
                        reason: "4857 Sayılı İş Kanunu Md. 74 Uyarınca Kadın Personel Doğum (Analık) İzni",
                      });
                    }}
                    className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                      newLeaveForm.type === "Analık / Doğum İzni"
                        ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                        : "bg-pink-50 hover:bg-pink-100 text-pink-900 border-pink-200"
                    }`}
                  >
                    <span>🤰</span>
                    <span>Analık İzni (Kadın - 16 Hafta)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const start = newLeaveForm.startDate || new Date().toISOString().split("T")[0];
                      const end = addDaysToDate(start, 3);
                      setNewLeaveForm({
                        ...newLeaveForm,
                        type: "Evlilik İzni",
                        daysCount: 3,
                        startDate: start,
                        endDate: end,
                        reason: "4857 Sayılı İş Kanunu Ek Md. 2 Uyarınca Evlilik İzni (3 Gün Ücretli)",
                      });
                    }}
                    className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                      newLeaveForm.type === "Evlilik İzni"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200"
                    }`}
                  >
                    <span>💍</span>
                    <span>Evlilik (3 Gün)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const start = newLeaveForm.startDate || new Date().toISOString().split("T")[0];
                      const end = addDaysToDate(start, 3);
                      setNewLeaveForm({
                        ...newLeaveForm,
                        type: "Vefat İzni",
                        daysCount: 3,
                        startDate: start,
                        endDate: end,
                        reason: "4857 Sayılı İş Kanunu Ek Md. 2 Uyarınca Vefat İzni (3 Gün Ücretli)",
                      });
                    }}
                    className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                      newLeaveForm.type === "Vefat İzni"
                        ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                    }`}
                  >
                    <span>🕊️</span>
                    <span>Vefat (3 Gün)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const start = newLeaveForm.startDate || new Date().toISOString().split("T")[0];
                      const end = addDaysToDate(start, 5);
                      setNewLeaveForm({
                        ...newLeaveForm,
                        type: "Yıllık İzin",
                        daysCount: 5,
                        startDate: start,
                        endDate: end,
                        reason: "Yıllık Ücretli İzin Kullanımı",
                      });
                    }}
                    className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                      newLeaveForm.type === "Yıllık İzin"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200"
                    }`}
                  >
                    <span>🏖️</span>
                    <span>Yıllık İzin</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">İzin Türü *</label>
                <select
                  value={newLeaveForm.type || "Yıllık İzin"}
                  onChange={(e) => {
                    const selected = e.target.value as any;
                    const start = newLeaveForm.startDate || new Date().toISOString().split("T")[0];
                    let days = Number(newLeaveForm.daysCount) || 1;
                    let autoReason = newLeaveForm.reason;

                    if (selected === "Babalık İzni (Erkek Doğum İzni)") {
                      days = 5;
                      autoReason = "4857 Sayılı İş Kanunu Ek Md. 2 Uyarınca Eşi Doğum Yapan Erkek Personel Babalık İzni";
                    } else if (selected === "Analık / Doğum İzni") {
                      days = 112;
                      autoReason = "4857 Sayılı İş Kanunu Md. 74 Uyarınca Kadın Personel Doğum (Analık) İzni";
                    } else if (selected === "Evlilik İzni") {
                      days = 3;
                      autoReason = "4857 Sayılı İş Kanunu Ek Md. 2 Uyarınca Evlilik İzni";
                    } else if (selected === "Vefat İzni") {
                      days = 3;
                      autoReason = "4857 Sayılı İş Kanunu Ek Md. 2 Uyarınca Vefat İzni";
                    }

                    const end = addDaysToDate(start, days);
                    setNewLeaveForm({
                      ...newLeaveForm,
                      type: selected,
                      daysCount: days,
                      endDate: end,
                      reason: autoReason,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-purple-900 cursor-pointer"
                >
                  <option value="Babalık İzni (Erkek Doğum İzni)">🍼 Babalık İzni (Erkek Doğum İzni - 5 Gün Ücretli)</option>
                  <option value="Analık / Doğum İzni">🤰 Analık / Doğum İzni (Kadın Personel - 16 Hafta / 112 Gün)</option>
                  <option value="Yıllık İzin">🏖️ Yıllık İzin (Ücretli İzin)</option>
                  <option value="Evlilik İzni">💍 Evlilik İzni (3 Gün Ücretli)</option>
                  <option value="Vefat İzni">🕊️ Vefat İzni (3 Gün Ücretli)</option>
                  <option value="Ücretli İzin">📋 Ücretli İzin (Mazeret / İdari İzin)</option>
                  <option value="Ücretsiz İzin">⏳ Ücretsiz İzin (Maaş Kesintili)</option>
                  <option value="Mazeretsiz İzin">🚫 Mazeretsiz İzin (Maaş Kesintili)</option>
                  <option value="Sıhhi İzin">🩺 Sıhhi İzin (Rapor - 2 Güne Kadar Ücretli)</option>
                  <option value="Hastalık/Rapor">🏥 Hastalık / SGK İstirahat Raporu</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const days = Number(newLeaveForm.daysCount) || 1;
                      const newEnd = addDaysToDate(newStart, days);
                      setNewLeaveForm({
                        ...newLeaveForm,
                        startDate: newStart,
                        endDate: newEnd,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.endDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const start = newLeaveForm.startDate || newEnd;
                      const diff = calculateDaysDiff(start, newEnd);
                      setNewLeaveForm({
                        ...newLeaveForm,
                        endDate: newEnd,
                        daysCount: diff,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">İzin Gün Sayısı *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newLeaveForm.daysCount}
                  onChange={(e) => {
                    const days = Math.max(1, Number(e.target.value) || 1);
                    const start = newLeaveForm.startDate || new Date().toISOString().split("T")[0];
                    const end = addDaysToDate(start, days);
                    setNewLeaveForm({
                      ...newLeaveForm,
                      daysCount: days,
                      endDate: end,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-extrabold text-slate-900"
                />
              </div>

              {/* Dynamic Calculation Notice Box with Law Reference */}
              {(() => {
                const selectedType = newLeaveForm.type || "Yıllık İzin";
                const days = Number(newLeaveForm.daysCount) || 1;
                const selEmp = employees.find((e) => e.id === newLeaveForm.employeeId) || employees[0];
                const isMale = selEmp?.gender !== "Kadın";

                if (selectedType.toLowerCase().includes("babalık") || selectedType.toLowerCase().includes("erkek doğum")) {
                  return (
                    <div className="bg-blue-50 border border-blue-300 rounded-2xl p-3 text-xs text-blue-950 font-medium space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-1.5 font-black text-blue-900 text-xs">
                        <span className="text-base">🍼</span>
                        <span>4857 Sayılı İş Kanunu Ek Md. 2: Erkek Personel Babalık İzni</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-blue-900">
                        Eşi doğum yapan <strong>erkek personele 5 gün yasal ücretli babalık izni</strong> verilir. Bu süre boyunca çalışanın <strong>maaşından, priminden veya yıllık izin bakiyesinden hiçbir kesinti yapılmaz</strong>.
                      </p>
                      {isMale ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Seçilen Personel: Erkek ♂ (5 Günlük yasal babalık izni bordroya tam ücretli yansıtılacaktır)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-1 rounded-lg border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Bilgilendirme: Seçilen personel kadın olarak kayıtlıdır. Doğum yapacak kadın çalışanlar için 'Analık / Doğum İzni (16 Hafta)' türü tavsiye edilir.</span>
                        </div>
                      )}
                    </div>
                  );
                }

                if (selectedType.toLowerCase().includes("analık") || (selectedType.toLowerCase().includes("doğum") && !selectedType.toLowerCase().includes("erkek"))) {
                  return (
                    <div className="bg-pink-50 border border-pink-300 rounded-2xl p-3 text-xs text-pink-950 font-medium space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-1.5 font-black text-pink-900 text-xs">
                        <span className="text-base">🤰</span>
                        <span>4857 Sayılı İş Kanunu Md. 74: Kadın Personel Analık / Doğum İzni</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-pink-900">
                        Kadın işçilere doğumdan önce 8 ve doğumdan sonra 8 hafta olmak üzere toplam <strong>16 hafta (112 gün) yasal analık izni</strong> kullandırılır. SGK geçici iş göremezlik ödeneği kapsamındadır.
                      </p>
                    </div>
                  );
                }

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
                  placeholder="ör: Eşi doğum yaptı (4857 S.K. Ek Md. 2), doktor raporu vb."
                  value={newLeaveForm.reason || ""}
                  onChange={(e) => setNewLeaveForm({ ...newLeaveForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleBackToList}
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
        </DetailPageLayout>
    );
  }

  // FULL-PAGE DETAIL VIEW: AVANS TALEBI
  if (isAddAdvanceOpen) {
    return (
      <DetailPageLayout
          title="Yeni Avans & Masraf Talebi"
          subtitle="Personel maaş avansı, harcırah ve iş seyahati masraf talepleri"
          breadcrumbs={[
            { label: "İnsan Kaynakları", onClick: handleBackToList },
            { label: "Avans & Kesintiler", onClick: handleBackToList },
            { label: "Yeni Avans", active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              Yeni Avans Talebi
            </span>
          }
          headerIcon={<CreditCard className="w-5 h-5 text-purple-700" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="add-advance-form"
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>Avansı Kaydet</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 mx-auto">
            <form id="add-advance-form" onSubmit={handleCreateAdvanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personel</label>
                <select
                  value={newAdvanceForm.employeeId}
                  onChange={(e) => setNewAdvanceForm({ ...newAdvanceForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold cursor-pointer"
                >
                  {[...employees]
                    .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"))
                    .map((emp) => (
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
                  <option value="Masraf Avansı">Masraf Avansı (Saha / İş Avansı)</option>
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

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Avansı Kaydet
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

  // FULL-PAGE DETAIL VIEW: OZLUK DETAYI VIEW
  if (selectedEmployeeForDetail) {
    return (
      <DetailPageLayout
          title={`${selectedEmployeeForDetail.fullName} - Personel Özlük Dosyası`}
          subtitle={`${selectedEmployeeForDetail.department} • ${selectedEmployeeForDetail.title} • TCKN: ${selectedEmployeeForDetail.tckn || "—"}`}
          breadcrumbs={[
            { label: "İnsan Kaynakları", onClick: handleBackToList },
            { label: "Personeller", onClick: handleBackToList },
            { label: selectedEmployeeForDetail.fullName, active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span
              className={`px-3 py-1 text-xs font-bold rounded-xl border ${
                selectedEmployeeForDetail.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {selectedEmployeeForDetail.status === "active" ? "Aktif Çalışan" : "Ayrıldı"}
            </span>
          }
          headerIcon={<User className="w-5 h-5 text-purple-700" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const emp = selectedEmployeeForDetail;
                  setSelectedEmployeeForDetail(null);
                  handleOpenEditPayroll(emp);
                }}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Bordro Düzenle</span>
              </button>
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Geri Dön
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 mx-auto">
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
                    {selectedEmployeeForDetail.gender && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        selectedEmployeeForDetail.gender === "Kadın"
                          ? "bg-pink-100 text-pink-800 border-pink-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>
                        {selectedEmployeeForDetail.gender === "Kadın" ? "Kadın ♀" : "Erkek ♂"}
                      </span>
                    )}
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
                <span className="text-slate-900 font-bold">{formatDate(selectedEmployeeForDetail.startDate)}</span>
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
                <span className="text-slate-900 font-bold">{formatTRY(selectedEmployeeForDetail.salaryAmount)} ({selectedEmployeeForDetail.salaryType.toUpperCase()})</span>
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

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBackToList}
                className="bg-slate-100 text-slate-700 font-bold px-5 py-2 rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </DetailPageLayout>
    );
  }

  // DETAIL VIEW: YASAL KESİNTİ (İCRA & NAFAKA) EKLE / DÜZENLE
  if (isAddLegalDeductionOpen) {
    return (
      <DetailPageLayout
          title={editingLegalDeduction ? "Yasal Kesinti Dosyasını Düzenle" : "Yeni Yasal Kesinti Kaydı Ekle"}
          subtitle="İcra, Nafaka ve Diğer Resmi Kesintilerin Yönetimi"
          breadcrumbs={[
            {
              label: "İnsan Kaynakları",
              onClick: () => {
                setIsAddLegalDeductionOpen(false);
                setEditingLegalDeduction(null);
              },
            },
            { label: "Yasal Kesinti", active: true },
          ]}
          onBack={() => {
            setIsAddLegalDeductionOpen(false);
            setEditingLegalDeduction(null);
          }}
          statusBadge={
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-xl">
              RESMİ KESİNTİ
            </span>
          }
          headerIcon={<Scale className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddLegalDeductionOpen(false);
                  setEditingLegalDeduction(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-2xl mx-auto p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">

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
                    {[...employees]
                      .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"))
                      .map((emp) => (
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
        </DetailPageLayout>
    );
  }

  // DETAIL VIEW: ÖDEME İŞLE & BORÇ DÜŞÜŞÜ
  if (isPaymentModalOpen && paymentModalDeduction) {
    return (
      <DetailPageLayout
          title="İcra / Yasal Kesinti Ödemesi İşle"
          subtitle={`${paymentModalDeduction.employeeName} • Dosya No: ${paymentModalDeduction.fileNumber}`}
          breadcrumbs={[
            {
              label: "İnsan Kaynakları",
              onClick: () => {
                setIsPaymentModalOpen(false);
                setPaymentModalDeduction(null);
              },
            },
            { label: "Kesinti Ödemesi", active: true },
          ]}
          onBack={() => {
            setIsPaymentModalOpen(false);
            setPaymentModalDeduction(null);
          }}
          statusBadge={
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl">
              İCRA ÖDEMESİ
            </span>
          }
          headerIcon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentModalDeduction(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-xl mx-auto p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">

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
                <span className="font-bold text-slate-900">{formatTRY(paymentModalDeduction.totalDebtAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mevcut Ödenen:</span>
                <span className="font-bold text-emerald-700">{formatTRY(paymentModalDeduction.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-800 pt-1 border-t border-slate-200 font-bold">
                <span>Kalan Borç Bakiye:</span>
                <span>{formatTRY(Math.max(0, paymentModalDeduction.totalDebtAmount - paymentModalDeduction.paidAmount))}</span>
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
        </DetailPageLayout>
    );
  }




  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP TITLE & ACTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
              İnsan Kaynakları & Personel Yönetimi
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              SGK & Bordro Uyumlu
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.pageText }}>
            Personel, Bordro ve Özlük Takibi
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Çalışan özlük dosyaları, kanuni SGK bordro matrahları, yıllık izin hakkı ve masraf/avans taleplerini tek ekrandan yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddEmployeeOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-2xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Yeni Personel</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBulkPayrollModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Tüm Aktif Personeller İçin Toplu Puantaj ve Bordro Hakedişi Hazırla"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Toplu Bordro</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddLeaveOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>İzin Talebi</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Kadro */}
        <div
          className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Toplam Kadro</span>
              <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: theme.pageText }}>
                {employees.length} Çalışan
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <img src={ASSET_ICONS.toplamAlacak} alt="" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {activeCount} Aktif
            </span>
            <span className="text-slate-400 text-[11px]">· {onLeaveCount} İzinli personel</span>
          </div>
        </div>

        {/* Card 2: Aylık Net Maaş Toplamı */}
        <div
          className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Aylık Net Maaş Hakedişi</span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600">
                {formatTRY(totalMonthlyNetSalary)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <img src={ASSET_ICONS.nakit} alt="" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-emerald-600">
              Net Ödeme
            </span>
            <span className="text-slate-400 text-[11px]">• Personel net hakedişleri</span>
          </div>
        </div>

        {/* Card 3: Toplam İşveren Maliyeti */}
        <div
          className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Toplam İşveren Maliyeti</span>
              <div className="text-2xl font-bold font-mono tracking-tight text-rose-600">
                {formatTRY(totalEmployerMonthlyCost)}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <img src={ASSET_ICONS.toplamBorc} alt="" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-rose-600">
              Maaş + SGK + Yan Hak
            </span>
            <span className="text-slate-400 text-[11px]">• Toplam şirket yükü</span>
          </div>
        </div>

        {/* Card 4: SGK İşyeri Dosyası */}
        <div
          className="rounded-2xl p-5 border shadow-2xs transition-all hover:shadow-md"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">SGK İşyeri Dosyası</span>
              <div className="text-sm font-bold font-mono tracking-tight truncate max-w-[180px]" style={{ color: theme.pageText }}>
                {companySettings.sgkCredentials?.workplaceRegistrationNo || "SGK Sicil Tanımlı"}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <img src={ASSET_ICONS.alacak} alt="" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              5510 %5 Teşvik Aktif
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div
        className="flex items-center justify-between rounded-2xl p-1.5 border shadow-2xs overflow-x-auto"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setActiveSubTab("employees")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "employees"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            SGK & Özlük Belgeleri
          </button>

          <button
            onClick={() => setActiveSubTab("severance")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "severance"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Kıdem & İhbar Tazminatı</span>
          </button>

          <button
            onClick={() => setActiveSubTab("zimmet")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "zimmet"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Zimmet & Demirbaş Takibi</span>
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

              <div className="flex items-center gap-1.5 bg-white border border-purple-200/60 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 shrink-0 hidden md:inline">Sıralama:</span>
                <select
                  value={employeeSortBy}
                  onChange={(e) => setEmployeeSortBy(e.target.value as any)}
                  className="bg-transparent border-0 text-slate-800 text-xs font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="name_asc">Alfabetik (A → Z)</option>
                  <option value="name_desc">Alfabetik (Z → A)</option>
                  <option value="date_desc">İşe Giriş (Yeniden Eskiye)</option>
                  <option value="date_asc">İşe Giriş (Eskiden Yeniye)</option>
                  <option value="salary_desc">Maaş (Yüksekten Düşüğe)</option>
                  <option value="salary_asc">Maaş (Düşükten Yükseğe)</option>
                </select>
              </div>

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
                  <th className="pb-2 px-3 text-right">İşlemler</th>
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
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <img src={getContactAvatar(emp.fullName)} alt={emp.fullName} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 group-hover:text-purple-950 text-sm flex items-center gap-1.5 wrap flex-wrap">
                            <span>{emp.fullName}</span>
                            {emp.gender && (
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap border ${
                                emp.gender === "Kadın"
                                  ? "bg-pink-50 text-pink-700 border-pink-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {emp.gender === "Kadın" ? "Kadın ♀" : "Erkek ♂"}
                              </span>
                            )}
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
                      {formatDate(emp.startDate)}
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-bold text-slate-900">
                        {formatTRY(emp.salaryAmount)}
                        <span className="text-[10px] text-slate-500 uppercase ml-1">
                          ({emp.salaryType})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Yemek: {formatTRY(emp.foodAllowance || 0)} · Yol: {formatTRY(emp.roadAllowance || 0)}
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPayroll(emp)}
                          className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                          title={`${emp.fullName} için Puantaj ve Bordro Hazırla`}
                        >
                          <Calculator className="w-3.5 h-3.5 text-purple-200" />
                          <span>Bordro Hazırla</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedEmployeeForDetail(emp)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/70 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Özlük Dosyası ve Personel Bilgilerini Görüntüle"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-700" />
                          <span>Özlük Detayı</span>
                        </button>
                      </div>
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
                {formatTRY(payrollRecords.reduce((sum, r) => sum + r.grossSalary, 0))}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Bordro dönemindeki toplam brüt hakediş</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">Toplam Net Ödenecek Maaş</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">
                {formatTRY(payrollRecords.reduce((sum, r) => sum + r.payableNetSalary, 0))}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">Avans & Kesintiler Düşülmüş Net Tutar</span>
            </div>

            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase block">Entegre Avans Kesintileri</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">
                {formatTRY(payrollRecords.reduce((sum, r) => sum + (r.advanceDeduction || 0), 0))}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Avans Yönetiminden Otomatik Aktarıldı</span>
            </div>

            <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 shadow-xs">
              <span className="text-[11px] font-bold text-purple-900 uppercase block">Toplam İşveren Maliyeti</span>
              <span className="text-xl font-black text-purple-950 mt-1 block">
                {formatTRY(totalEmployerMonthlyCost)}
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkPayrollModalOpen(true)}
                  className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Tüm Aktif Personeller İçin Toplu Puantaj ve Bordro Hakedişi Hazırla"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-200" />
                  <span>Toplu Bordro Hazırla</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPayrollPrintSelectedEmpId(undefined);
                    setPayrollPrintInitialMode("month");
                    setIsPayrollPrintModalOpen(true);
                  }}
                  className="bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Seçilen Ay veya Tüm Yıl Bordro İcmalini Resmi Şablonda Yazdır / PDF İndir"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Bordro Yazdır / İcmal</span>
                </button>

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
                      formatCurrency((r.executionDeduction || 0) + (r.alimonyDeduction || 0), "TRY"),
                      formatCurrency(r.payableNetSalary || 0, "TRY"),
                      formatCurrency(r.totalEmployerCost || 0, "TRY"),
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
                          {formatTRY(rec.grossSalary)}
                          {Boolean(rec.bonusAmount || rec.overtimePay) && (
                            <div className="space-y-0.5 mt-0.5">
                              {Boolean(rec.bonusAmount) && (
                                <div className="text-[10px] text-emerald-600 font-medium">
                                  +{formatTRY(rec.bonusAmount)} Prim
                                </div>
                              )}
                              {Boolean(rec.overtimePay) && (
                                <div className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1 py-0.5 rounded border border-purple-200/70" title={`Fazla Mesai: ${((rec.overtimeNormalHours || 0) + (rec.overtimeWeekendHours || 0) + (rec.overtimeHolidayHours || 0))} Saat / ${rec.overtimeHolidayDays || 0} Gün`}>
                                  +{formatTRY(rec.overtimePay)} Mesai
                                  {((rec.overtimeNormalHours || 0) + (rec.overtimeWeekendHours || 0) + (rec.overtimeHolidayHours || 0)) > 0 && (
                                    <span className="text-[9px] text-purple-900 font-black ml-1">
                                      ({((rec.overtimeNormalHours || 0) + (rec.overtimeWeekendHours || 0) + (rec.overtimeHolidayHours || 0))}s{rec.overtimeHolidayDays ? ` + ${rec.overtimeHolidayDays}g` : ""})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-slate-600">
                          <div>{formatTRY(totalLegalDeductions)}</div>
                          <div className="text-[10px] text-slate-400">SGK: {formatTRY(rec.sgkEmployeeShare)} · GV: {formatTRY(rec.incomeTax)}</div>
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {rec.advanceDeduction && rec.advanceDeduction > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100/80 text-amber-900 font-bold px-2 py-1 rounded-lg border border-amber-300 text-xs">
                              <Receipt className="w-3 h-3 text-amber-700" />
                              -{formatTRY(rec.advanceDeduction)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {rec.unpaidLeaveDays && rec.unpaidLeaveDays > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 font-bold px-2 py-1 rounded-lg border border-rose-200 text-xs">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              {rec.unpaidLeaveDays} Gün (-{formatTRY(rec.unpaidLeaveDeduction || 0)})
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
                                  İcra: -{formatTRY(rec.executionDeduction)}
                                </span>
                              )}
                              {Boolean(rec.alimonyDeduction) && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md border border-purple-200 text-[11px] block w-fit">
                                  Nafaka: -{formatTRY(rec.alimonyDeduction)}
                                </span>
                              )}
                              {Boolean(rec.otherDeductions) && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200 text-[11px] block w-fit">
                                  Diğer: -{formatTRY(rec.otherDeductions)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-black text-emerald-800 text-sm">
                          {formatTRY(rec.payableNetSalary)}
                        </td>

                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-black text-purple-950 text-sm">
                          {formatTRY(rec.totalEmployerCost)}
                        </td>

                        <td className="py-3 px-3 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {empObj && (
                              <button
                                onClick={() => handleOpenEditPayroll(empObj)}
                                className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Personel Puantaj Takvimi ve Bordro Hazırla"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                                Bordro Hazırla
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setPayrollPrintSelectedEmpId(rec.employeeId);
                                setPayrollPrintInitialMode("month");
                                setIsPayrollPrintModalOpen(true);
                              }}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200/70 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title={`${rec.employeeName} için Seçilen Ay veya Tüm Yıl Bordrosunu Yazdır`}
                            >
                              <Printer className="w-3.5 h-3.5 text-purple-700" />
                              Bordro Yazdır
                            </button>

                            <button
                              onClick={() => {
                                setPayrollPrintSelectedEmpId(rec.employeeId);
                                setPayrollPrintInitialMode("month");
                                setIsPayrollPrintModalOpen(true);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 font-bold px-2.5 py-1.5 rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title={`${rec.employeeName} için WhatsApp Maaş Pusulası Gönder`}
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              WhatsApp
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

      {/* SUB-TAB 3: IZIN YONETIMI & KIDEME GORE YILLIK IZIN HAK EDIS TAKIBI */}
      {activeSubTab === "leaves" && (
        <div className="space-y-6">
          {/* 1. YASAL KIDEM VE YILLIK IZIN HAK EDIS BILGILENDIRME PANELI */}
          {(() => {
            // Personellerin kıdem ve yıllık izin hak ediş hesaplamaları (Alfabetik Sıralı)
            const employeeLeaveDetails = [...employees]
              .sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"))
              .map((emp) => {
              const sDate = new Date(emp.startDate || "2024-01-01");
              const today = new Date();
              const diffTime = Math.max(0, today.getTime() - sDate.getTime());
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

              let years = today.getFullYear() - sDate.getFullYear();
              let months = today.getMonth() - sDate.getMonth();
              if (today.getDate() < sDate.getDate()) {
                months -= 1;
              }
              if (months < 0) {
                years -= 1;
                months += 12;
              }
              const completedYears = Math.max(0, years);
              const completedMonths = Math.max(0, months);

              // Yaş Hesabı
              let age = 30;
              if (emp.birthDate) {
                const bDate = new Date(emp.birthDate);
                age = today.getFullYear() - bDate.getFullYear();
              }

              // 4857 S.K. Madde 53 Yasal Yıllık Ücretli İzin Baremleri:
              // a) 1 yıldan 5 yıla kadar (5 yıl dahil): 14 gün
              // b) 5 yıldan fazla 15 yıldan az: 20 gün
              // c) 15 yıl (dahil) ve daha fazla: 26 gün
              // 18 ve daha küçük yaştaki işçiler ile 50 ve daha yukarı yaştaki işçilere verilecek yıllık izin 20 günden az olamaz.
              let currentTierPerYear = 14;
              if (completedYears >= 15) {
                currentTierPerYear = 26;
              } else if (completedYears > 5) {
                currentTierPerYear = 20;
              } else if (age <= 18 || age >= 50) {
                currentTierPerYear = 20;
              } else {
                currentTierPerYear = 14;
              }

              // Kümülatif Hak Edilen Toplam İzin Gün Sayısı (Her tamamlanan çalışma yılı için)
              let cumulativeEarnedDays = 0;
              if (completedYears >= 1) {
                for (let y = 1; y <= completedYears; y++) {
                  if (y >= 15) {
                    cumulativeEarnedDays += 26;
                  } else if (y > 5) {
                    cumulativeEarnedDays += 20;
                  } else if (age <= 18 || age >= 50) {
                    cumulativeEarnedDays += 20;
                  } else {
                    cumulativeEarnedDays += 14;
                  }
                }
              }

              // Kullanılan Onaylı Yıllık İzinler
              const approvedUsed = leaveRequests
                .filter(
                  (lr) =>
                    (lr.employeeId === emp.id || lr.employeeName === emp.fullName) &&
                    lr.status === "approved" &&
                    (lr.leaveType === "annual" ||
                      lr.type.toLowerCase().includes("yıllık") ||
                      lr.type.toLowerCase().includes("yillik"))
                )
                .reduce((sum, lr) => sum + (Number(lr.daysCount) || 0), 0);

              const totalUsedDays = approvedUsed + (emp.usedAnnualLeave || 0);
              const remainingDays = Math.max(0, cumulativeEarnedDays - totalUsedDays);
              const usagePercent =
                cumulativeEarnedDays > 0 ? Math.min(100, Math.round((totalUsedDays / cumulativeEarnedDays) * 100)) : 0;

              return {
                emp,
                sDate,
                diffDays,
                completedYears,
                completedMonths,
                age,
                currentTierPerYear,
                cumulativeEarnedDays,
                totalUsedDays,
                remainingDays,
                usagePercent,
                isEligible: completedYears >= 1,
              };
            });

            const totalCompanyEarned = employeeLeaveDetails.reduce((sum, item) => sum + item.cumulativeEarnedDays, 0);
            const totalCompanyUsed = employeeLeaveDetails.reduce((sum, item) => sum + item.totalUsedDays, 0);
            const totalCompanyRemaining = employeeLeaveDetails.reduce((sum, item) => sum + item.remainingDays, 0);

            return (
              <div className="space-y-4">
                {/* 4 Özet Kartı */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm border border-purple-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-300 uppercase">Kazanılan İzin Havuzu</span>
                      <Award className="w-4 h-4 text-purple-300" />
                    </div>
                    <div className="text-2xl font-black">{totalCompanyEarned} Gün</div>
                    <div className="text-[11px] text-purple-200/80 font-medium">
                      4857 S.K. Md. 53 kıdeme göre toplam hak
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-2xs border border-purple-200/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Kullanılan Yıllık İzin</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{totalCompanyUsed} Gün</div>
                    <div className="text-[11px] text-slate-500 font-medium">Onaylanan izin talepleri toplamı</div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-700 to-teal-900 text-white rounded-2xl p-4 shadow-sm border border-emerald-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-200 uppercase">Kalan İzin Bakiyesi</span>
                      <CalendarDays className="w-4 h-4 text-emerald-200" />
                    </div>
                    <div className="text-2xl font-black">{totalCompanyRemaining} Gün</div>
                    <div className="text-[11px] text-emerald-100 font-medium">Kullanılabilir toplam bakiye</div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 shadow-2xs border border-purple-200/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 uppercase">Yasal Baremler</span>
                      <Scale className="w-4 h-4 text-purple-700" />
                    </div>
                    <div className="text-xs font-black text-purple-950 space-y-0.5 pt-0.5">
                      <div>· 1 - 5 Yıl Kıdem: <span className="text-purple-700">14 Gün/Yıl</span></div>
                      <div>· 5 - 15 Yıl Kıdem: <span className="text-purple-700">20 Gün/Yıl</span></div>
                      <div>· 15+ Yıl (veya ≤18, ≥50 Yaş): <span className="text-purple-700">26 Gün/Yıl</span></div>
                    </div>
                  </div>
                </div>

                {/* KIDEME GÖRE KALAN YILLIK İZİN HAK EDİŞ TABLOSU */}
                <div id="leave-entitlements-table" className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-700" />
                      <div>
                        <h3 className="font-black text-slate-900 text-sm sm:text-base">
                          Personel Kıdem & Kalan Yıllık İzin Hak Ediş Takip Tablosu
                        </h3>
                        <p className="text-xs text-slate-500">
                          Personellerin işe giriş tarihine ve çalıştığı yıl/ay süresine göre 4857 Sayılı İş Kanunu Md. 53 uyarınca hak kazandığı ve kalan izin günleri.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ExportButtons
                        getExportData={() => ({
                          filename: `Personel_Yillik_Izin_Haklari_${new Date().toISOString().split("T")[0]}`,
                          title: "PERSONEL KIDEM VE YILLIK İZİN HAK EDİŞ LİSTESİ (4857 S.K.)",
                          subtitle: `Toplam ${employees.length} Personel`,
                          headers: [
                            "Personel Adı",
                            "Departman / Unvan",
                            "İşe Giriş Tarihi",
                            "Kıdem Süresi",
                            "Yıllık İzin Baremi",
                            "Kazanılan Toplam İzin",
                            "Kullanılan İzin",
                            "Kalan İzin Hakkı",
                            "Durum",
                          ],
                          rows: employeeLeaveDetails.map((d) => [
                            d.emp.fullName,
                            `${d.emp.department} - ${d.emp.title}`,
                            d.emp.startDate || "—",
                            `${d.completedYears} Yıl, ${d.completedMonths} Ay (${d.diffDays} Gün)`,
                            `${d.currentTierPerYear} Gün/Yıl`,
                            `${d.cumulativeEarnedDays} Gün`,
                            `${d.totalUsedDays} Gün`,
                            `${d.remainingDays} Gün`,
                            d.isEligible ? "İzin Hakkı Var" : "1 Yılı Dolmadı",
                          ]),
                        })}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
                    <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[920px]">
                      <thead>
                        <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                          <th className="pb-2 px-3">Personel</th>
                          <th className="pb-2 px-3">İşe Giriş Tarihi</th>
                          <th className="pb-2 px-3">Çalıştığı Süre (Kıdem)</th>
                          <th className="pb-2 px-3">Kanuni Baremi</th>
                          <th className="pb-2 px-3">Kazanılan İzin</th>
                          <th className="pb-2 px-3">Kullanılan</th>
                          <th className="pb-2 px-3">Kalan İzin Hakkı</th>
                          <th className="pb-2 px-3">Kullanım Durumu</th>
                          <th className="pb-2 px-3 text-right">Hızlı İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeLeaveDetails.map((d) => (
                          <tr
                            key={d.emp.id}
                            className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                          >
                            <td className="py-3 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-bold text-slate-900 group-hover:text-purple-950">
                              <div className="flex items-center gap-2.5">
                                {d.emp.photoUrl ? (
                                  <img
                                    src={d.emp.photoUrl}
                                    alt={d.emp.fullName}
                                    className="w-8 h-8 rounded-full object-cover border border-purple-300 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {d.emp.fullName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-extrabold text-slate-900 text-xs group-hover:text-purple-950">
                                    {d.emp.fullName}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal">
                                    {d.emp.department} · {d.emp.title} {d.age ? `(${d.age} Yaş)` : ""}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-medium text-slate-800 text-xs">
                              {d.emp.startDate || "—"}
                            </td>

                            <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                              <div className="font-black text-purple-950 text-xs">
                                {d.completedYears} Yıl, {d.completedMonths} Ay
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Toplam: {d.diffDays} Gün Hizmet
                              </div>
                            </td>

                            <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                              <span className="bg-purple-100 text-purple-900 font-extrabold px-2 py-0.5 rounded-md text-[11px] border border-purple-200">
                                {d.currentTierPerYear} Gün / Yıl
                              </span>
                            </td>

                            <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-black text-slate-800 text-xs">
                              {d.isEligible ? (
                                <span>{d.cumulativeEarnedDays} Gün</span>
                              ) : (
                                <span className="text-amber-700 text-[11px] font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  1 Yılı Dolmadı ({12 - d.completedMonths} ay kaldı)
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-bold text-slate-600 text-xs">
                              {d.totalUsedDays} Gün
                            </td>

                            <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1 shadow-2xs ${
                                  d.remainingDays > 5
                                    ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                    : d.remainingDays > 0
                                    ? "bg-amber-100 text-amber-950 border border-amber-300"
                                    : "bg-slate-100 text-slate-700 border border-slate-300"
                                }`}
                              >
                                <span>{d.remainingDays} Gün Kaldı</span>
                              </span>
                            </td>

                            <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                              <div className="space-y-1 w-24">
                                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                  <span>%{d.usagePercent}</span>
                                  <span>{d.remainingDays} kalan</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      d.usagePercent > 80
                                        ? "bg-rose-500"
                                        : d.usagePercent > 50
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${d.usagePercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewLeaveForm((prev) => ({
                                      ...prev,
                                      employeeId: d.emp.id,
                                      employeeName: d.emp.fullName,
                                      leaveType: "annual",
                                      type: "Yıllık İzin",
                                    }));
                                    setIsAddLeaveOpen(true);
                                  }}
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200/70 font-bold px-2.5 py-1 rounded-lg text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Bu personel için yeni yıllık izin talebi aç"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>İzin Aç</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormsModalEmployeeId(d.emp.id);
                                    setFormsModalType("annual_leave");
                                    setFormsModalLeaveRequest(undefined);
                                    setIsFormsModalOpen(true);
                                  }}
                                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Resmi Yıllık İzin Talep / Onay Formu Yazdır"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Form</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. MEVCUT İZİN TALEPLERİ LİSTESİ */}
          <div id="leave-requests-section" className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="text-xs text-purple-900/80 font-semibold bg-purple-50/60 px-3 py-1.5 rounded-xl border border-purple-200/50">
                  İzin Talepleri ve Onay Hareketleri ({leaveRequests.length})
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setFormsModalEmployeeId(employees[0]?.id);
                    setFormsModalType("annual_leave");
                    setFormsModalLeaveRequest(undefined);
                    setIsFormsModalOpen(true);
                  }}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-300 font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
                  title="Yıllık İzin, Babalık/Doğum İzni, Ücretsiz İzin ve İşe Gelmeme Tutanak Formları Oluştur ve Yazdır"
                >
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>İzin & Devamsızlık Formları</span>
                  <span className="bg-purple-200 text-purple-900 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    4 Form
                  </span>
                </button>

                <button
                  onClick={() => setIsAddLeaveOpen(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Yeni İzin Talebi
                </button>
              </div>
            </div>

            {/* AUTO-SCROLL & HIZLI ODAKLANMA REHBER ÇUBUĞU */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3 sm:p-3.5 border border-purple-700/60 shadow-md">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/80 text-white flex items-center justify-center shadow-xs">
                    <LocateFixed className="w-4 h-4 text-purple-200 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">Auto-Scroll & Akıllı Odaklanma</span>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                        Çoklu İzin Rehberi
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/70">
                      Çok sayıda kayıt arasında aradığınız izin öğesine anında otomatik kaydırın ve görsel odaklama ile tespit edin.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Son Eklenen İzin */}
                  {leaveRequests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const latest = leaveRequests[leaveRequests.length - 1];
                        if (latest) {
                          setHighlightedLeaveId(latest.id);
                          scrollToElement(`leave-row-${latest.id}`);
                          showToast(`🎯 Son eklenen izin kaydına odaklanıldı (${latest.employeeName}).`);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-white text-[11px] font-bold border border-purple-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                      title="Son eklenen izin talebine otomatik kaydır ve odaklan"
                    >
                      <Target className="w-3.5 h-3.5 text-purple-300" />
                      <span>Son Eklenen İzin</span>
                    </button>
                  )}

                  {/* Onay Bekleyenler */}
                  {leaveRequests.some((l) => l.status === "pending") && (
                    <button
                      type="button"
                      onClick={() => {
                        const pendingItem = leaveRequests.find((l) => l.status === "pending");
                        if (pendingItem) {
                          setHighlightedLeaveId(pendingItem.id);
                          scrollToElement(`leave-row-${pendingItem.id}`);
                          showToast(`🎯 Onay bekleyen izin talebine odaklanıldı (${pendingItem.employeeName}).`);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-[11px] font-bold border border-amber-600/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                      title="İlk onay bekleyen izin talebine otomatik kaydır"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Bekleyenler ({leaveRequests.filter((l) => l.status === "pending").length})</span>
                    </button>
                  )}

                  {/* Ücretsiz İzinler (Maaş Kesintililer) */}
                  {leaveRequests.some((l) => l.type === "Ücretsiz İzin" || l.type === "unpaid") && (
                    <button
                      type="button"
                      onClick={() => {
                        const unpaidItem = leaveRequests.find((l) => l.type === "Ücretsiz İzin" || l.type === "unpaid");
                        if (unpaidItem) {
                          setHighlightedLeaveId(unpaidItem.id);
                          scrollToElement(`leave-row-${unpaidItem.id}`);
                          showToast(`🎯 Ücretsiz izin / bordro puantaj kesintisi kaydına odaklanıldı.`);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[11px] font-bold border border-rose-600/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                      title="Maaştan kesilen ücretsiz izin kaydına otomatik kaydır"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                      <span>Ücretsiz İzinler</span>
                    </button>
                  )}

                  {/* Hak Ediş Tablosuna Git */}
                  <button
                    type="button"
                    onClick={() => {
                      scrollToElement("leave-entitlements-table");
                      showToast("📊 Kıdem & Yıllık İzin Hak Ediş Tablosuna kaydırıldı.");
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Kıdem ve Kalan İzin Hak Ediş Takip Tablosuna git"
                  >
                    <Award className="w-3.5 h-3.5 text-purple-300" />
                    <span>Hak Ediş Tablosu</span>
                  </button>

                  {/* Listenin Sonu & Başa Dön */}
                  <button
                    type="button"
                    onClick={() => scrollToElement("leave-requests-table-bottom")}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shadow-2xs"
                    title="Listenin en altına kaydır"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToElement("leave-requests-section")}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shadow-2xs"
                    title="Listenin başına kaydır"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
              <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[800px]">
                <thead>
                  <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="pb-2 px-3">Çalışan</th>
                    <th className="pb-2 px-3">İzin Türü</th>
                    <th className="pb-2 px-3">Tarih Aralığı</th>
                    <th className="pb-2 px-3">Gün</th>
                    <th className="pb-2 px-3">Açıklama</th>
                    <th className="pb-2 px-3">Durum</th>
                    <th className="pb-2 px-3 text-right">İşlemler & Form</th>
                  </tr>
                </thead>
                <tbody>
                {leaveRequests.map((req) => {
                  const isHighlighted = highlightedLeaveId === req.id;
                  return (
                  <tr
                    key={req.id}
                    id={`leave-row-${req.id}`}
                    className={`transition-all duration-300 group rounded-xl relative ${
                      isHighlighted
                        ? "bg-purple-100 ring-2 ring-purple-600 shadow-xl z-20 scale-[1.006]"
                        : "bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 z-0 hover:z-10"
                    }`}
                  >
                    <td className={`py-3 px-3 rounded-l-xl border-y border-l transition-all font-bold ${
                      isHighlighted
                        ? "border-purple-500 bg-purple-100/90 text-purple-950"
                        : "border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 text-slate-900 group-hover:text-purple-950"
                    }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{req.employeeName}</span>
                        {isHighlighted && (
                          <span className="inline-flex items-center gap-1 bg-purple-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                            <Target className="w-3 h-3" />
                            <span>Odaklandı</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-bold text-purple-950 text-xs flex items-center gap-1.5 flex-wrap">
                        {req.type.toLowerCase().includes("babalık") || req.type.toLowerCase().includes("erkek doğum") ? (
                          <span>🍼</span>
                        ) : req.type.toLowerCase().includes("analık") || req.type.toLowerCase().includes("doğum") ? (
                          <span>🤰</span>
                        ) : req.type.toLowerCase().includes("evlilik") ? (
                          <span>💍</span>
                        ) : req.type.toLowerCase().includes("vefat") ? (
                          <span>🕊️</span>
                        ) : req.type.toLowerCase().includes("yıllık") ? (
                          <span>🏖️</span>
                        ) : null}
                        <span>{req.type}</span>
                      </div>
                      {req.type.toLowerCase().includes("babalık") || req.type.toLowerCase().includes("erkek doğum") ? (
                        <span className="inline-block mt-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                          4857 S.K. Ek Md. 2 (5 Gün Babalık İzni - Puantaj: Dİ)
                        </span>
                      ) : req.type.toLowerCase().includes("analık") ? (
                        <span className="inline-block mt-0.5 text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md border border-pink-200">
                          4857 S.K. Md. 74 (16 Hafta Ücretli - Puantaj: Dİ)
                        </span>
                      ) : req.type === "Ücretsiz İzin" || req.type === "Mazeretsiz İzin" ? (
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
                      {formatDate(req.startDate)} — {formatDate(req.endDate)}
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
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Hızlı Form Yazdır Butonu */}
                        <button
                          type="button"
                          onClick={() => {
                            const reqEmp = employees.find((e) => e.fullName === req.employeeName || e.id === req.employeeId);
                            setFormsModalEmployeeId(reqEmp?.id || req.employeeId || employees[0]?.id);
                            if (req.type.toLowerCase().includes("babalık") || req.type.toLowerCase().includes("erkek doğum") || req.type.toLowerCase().includes("babalik") || req.type.toLowerCase().includes("dogum") || req.type.toLowerCase().includes("doğum")) {
                              setFormsModalType("paternity_leave");
                            } else if (req.type === "Ücretsiz İzin" || req.type === "Mazeretsiz İzin" || req.type.toLowerCase().includes("ücretsiz") || req.type.toLowerCase().includes("ucretsiz")) {
                              setFormsModalType("unpaid_leave");
                            } else {
                              setFormsModalType("annual_leave");
                            }
                            setFormsModalLeaveRequest(req);
                            setIsFormsModalOpen(true);
                          }}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold px-2.5 py-1 rounded-lg text-xs transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Bu izin için resmi dilekçe / izin formu oluştur ve yazdır"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-700" />
                          <span>Form Yazdır</span>
                        </button>

                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                onUpdateLeaveStatus(req.id, "approved");
                                setHighlightedLeaveId(req.id);
                                showToast(`✅ "${req.employeeName}" izin talebi onaylandı.`);
                                setTimeout(() => scrollToElement(`leave-row-${req.id}`), 100);
                              }}
                              className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-xl text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => {
                                onUpdateLeaveStatus(req.id, "rejected");
                                setHighlightedLeaveId(req.id);
                                showToast(`❌ "${req.employeeName}" izin talebi reddedildi.`);
                                setTimeout(() => scrollToElement(`leave-row-${req.id}`), 100);
                              }}
                              className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded-xl text-xs hover:bg-rose-700 transition-all cursor-pointer shadow-2xs"
                            >
                              Reddet
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <div id="leave-requests-table-bottom" />
          </div>

          {/* FLOATING QUICK AUTO-SCROLL GUIDANCE ACTION */}
          {leaveRequests.length >= 4 && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100/60">
              <span className="text-[11px] text-slate-500 font-medium">Hızlı Gezinme:</span>
              <button
                type="button"
                onClick={() => {
                  const latest = leaveRequests[leaveRequests.length - 1];
                  if (latest) {
                    setHighlightedLeaveId(latest.id);
                    scrollToElement(`leave-row-${latest.id}`);
                    showToast(`🎯 Son eklenen izin talebine kaydırıldı (${latest.employeeName}).`);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Target className="w-3.5 h-3.5 text-purple-200" />
                <span>Son Eklenen İzne Git</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToElement("leave-requests-section")}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Listenin Başı</span>
              </button>
            </div>
          )}
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
                      a.type,
                      a.requestDate,
                      formatCurrency(a.amount || 0, "TRY"),
                      "TRY",
                      a.status === "paid" ? "Ödendi" : a.status === "approved" ? "Onaylandı" : "Onay Bekliyor",
                      a.description || "-",
                    ]),
                  })}
                  size="sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormsModalType("expense_request");
                    setFormsModalEmployeeId(employees.length > 0 ? employees[0].id : undefined);
                    setFormsModalAdvanceRequest(undefined);
                    setIsFormsModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  title="Resmi Masraf Talep Formu (Fiş/Fatura Tablolu ve Avans Mahsuplu)"
                >
                  <FileText className="w-4 h-4" />
                  <span>Masraf Talep Formu</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormsModalType("advance_request");
                    setFormsModalEmployeeId(employees.length > 0 ? employees[0].id : undefined);
                    setFormsModalAdvanceRequest(undefined);
                    setIsFormsModalOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  title="Resmi Avans Talep Formu / Dilekçesi Hazırla ve Yazdır"
                >
                  <FileText className="w-4 h-4" />
                  <span>Avans Talep Formu</span>
                </button>
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
            <div id="advance-requests-section" className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
              {/* AUTO-SCROLL & HIZLI ODAKLANMA REHBER ÇUBUĞU */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3 sm:p-3.5 border border-purple-700/60 shadow-md">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/80 text-white flex items-center justify-center shadow-xs">
                      <LocateFixed className="w-4 h-4 text-purple-200 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">Auto-Scroll & Avans Odaklanma</span>
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          Avans & Masraf Rehberi
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-200/70">
                        Çok sayıda avans ve masraf talebi arasında yeni eklenen veya onay bekleyen kayda anında otomatik kaydırın.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Son Eklenen Avans */}
                    {advanceRequests.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const latest = advanceRequests[advanceRequests.length - 1];
                          if (latest) {
                            setHighlightedAdvanceId(latest.id);
                            scrollToElement(`advance-row-${latest.id}`);
                            showToast(`🎯 Son eklenen avans kaydına odaklanıldı (${latest.employeeName}).`);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-white text-[11px] font-bold border border-purple-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                        title="Son eklenen avans/masraf talebine otomatik kaydır ve odaklan"
                      >
                        <Target className="w-3.5 h-3.5 text-purple-300" />
                        <span>Son Eklenen Avans</span>
                      </button>
                    )}

                    {/* Onay Bekleyen Avanslar */}
                    {advanceRequests.some((a) => a.status === "pending") && (
                      <button
                        type="button"
                        onClick={() => {
                          const pendingAdv = advanceRequests.find((a) => a.status === "pending");
                          if (pendingAdv) {
                            setHighlightedAdvanceId(pendingAdv.id);
                            scrollToElement(`advance-row-${pendingAdv.id}`);
                            showToast(`🎯 Onay bekleyen avans talebine odaklanıldı (${pendingAdv.employeeName}).`);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-[11px] font-bold border border-amber-600/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                        title="İlk onay bekleyen avans talebine otomatik kaydır"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span>Bekleyenler ({advanceRequests.filter((a) => a.status === "pending").length})</span>
                      </button>
                    )}

                    {/* Listenin Sonu & Başa Dön */}
                    <button
                      type="button"
                      onClick={() => scrollToElement("advance-requests-table-bottom")}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shadow-2xs"
                      title="Avans listesinin en altına kaydır"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToElement("advance-requests-section")}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shadow-2xs"
                      title="Avans listesinin başına kaydır"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

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
                    {advanceRequests.map((adv) => {
                      const isHighlighted = highlightedAdvanceId === adv.id;
                      return (
                      <tr
                        key={adv.id}
                        id={`advance-row-${adv.id}`}
                        className={`transition-all duration-300 group rounded-xl relative ${
                          isHighlighted
                            ? "bg-amber-100 ring-2 ring-amber-600 shadow-xl z-20 scale-[1.006]"
                            : "bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 z-0 hover:z-10"
                        }`}
                      >
                        <td className={`py-3 px-3 rounded-l-xl border-y border-l transition-all font-bold ${
                          isHighlighted
                            ? "border-amber-500 bg-amber-100/90 text-amber-950"
                            : "border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 text-slate-900 group-hover:text-purple-950"
                        }`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{adv.employeeName}</span>
                            {isHighlighted && (
                              <span className="inline-flex items-center gap-1 bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                <Target className="w-3 h-3" />
                                <span>Odaklandı</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-semibold text-purple-900">
                          {adv.type}
                        </td>
                        <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all font-black text-slate-900">
                          {formatTRY(adv.amount)}
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
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {adv.type === "Masraf Avansı" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormsModalType("expense_request");
                                    setFormsModalEmployeeId(adv.employeeId);
                                    setFormsModalAdvanceRequest(adv);
                                    setIsFormsModalOpen(true);
                                  }}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 font-bold px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                  title="Masraf Talep Formuna Aktar ve Yazdır (Avans Mahsuplu)"
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Masraf Formu</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormsModalType("advance_request");
                                    setFormsModalEmployeeId(adv.employeeId);
                                    setFormsModalAdvanceRequest(adv);
                                    setIsFormsModalOpen(true);
                                  }}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold px-2 py-1 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                  title="Resmi Avans Dilekçesi / Talep Formu"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Avans Formu</span>
                                </button>
                              </>
                            ) : adv.type === "Masraf" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormsModalType("expense_request");
                                  setFormsModalEmployeeId(adv.employeeId);
                                  setFormsModalAdvanceRequest(adv);
                                  setIsFormsModalOpen(true);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 font-bold px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                title="Masraf Talep Formu Görüntüle ve Yazdır"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Masraf Formu</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormsModalType("advance_request");
                                  setFormsModalEmployeeId(adv.employeeId);
                                  setFormsModalAdvanceRequest(adv);
                                  setIsFormsModalOpen(true);
                                }}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                title="Resmi Avans Talep Formunu Görüntüle ve Yazdır"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-700" />
                                <span>Avans Formu</span>
                              </button>
                            )}
                            {adv.status === "pending" && (
                              <button
                                onClick={() => {
                                  onUpdateAdvanceStatus(adv.id, "paid");
                                  setHighlightedAdvanceId(adv.id);
                                  showToast(`✅ "${adv.employeeName}" avans ödemesi onaylandı.`);
                                  setTimeout(() => scrollToElement(`advance-row-${adv.id}`), 100);
                                }}
                                className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-2xs"
                              >
                                Ödemeyi Onayla
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div id="advance-requests-table-bottom" />
              </div>

              {/* FLOATING QUICK SCROLL ACTION */}
              {advanceRequests.length >= 4 && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100/60">
                  <span className="text-[11px] text-slate-500 font-medium">Hızlı Gezinme:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const latest = advanceRequests[advanceRequests.length - 1];
                      if (latest) {
                        setHighlightedAdvanceId(latest.id);
                        scrollToElement(`advance-row-${latest.id}`);
                        showToast(`🎯 Son eklenen avans kaydına kaydırıldı (${latest.employeeName}).`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Target className="w-3.5 h-3.5 text-purple-200" />
                    <span>Son Eklenen Avanse Git</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToElement("advance-requests-section")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>Listenin Başı</span>
                  </button>
                </div>
              )}
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
                    {formatTRY(
                      legalDeductions
                        .filter((d) => d.status === "active" || d.status === "queued")
                        .reduce((sum, d) => sum + Math.max(0, d.totalDebtAmount - d.paidAmount), 0)
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Aktif & Sıradaki dosyalarda kalan bakiye
                  </div>
                </div>
              </div>

              {/* Deductions Main Table */}
              <div id="legal-deductions-section" className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
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

                {/* AUTO-SCROLL & HIZLI ODAKLANMA REHBER ÇUBUĞU */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3 sm:p-3.5 border border-purple-700/60 shadow-md">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-600/80 text-white flex items-center justify-center shadow-xs">
                        <LocateFixed className="w-4 h-4 text-purple-200 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">Auto-Scroll & Kesinti Odaklanma</span>
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full">
                            İcra & Nafaka Rehberi
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-200/70">
                          Personel yasal kesinti ve icra dosyaları arasında aradığınız dosyaya veya yeni eklenen kayda doğrudan odaklanın.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Son Eklenen Kesinti */}
                      {legalDeductions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const latest = legalDeductions[legalDeductions.length - 1];
                            if (latest) {
                              setHighlightedDeductionId(latest.id);
                              scrollToElement(`deduction-row-${latest.id}`);
                              showToast(`🎯 Son eklenen kesinti dosyasına odaklanıldı (${latest.employeeName} - ${latest.fileNumber}).`);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-white text-[11px] font-bold border border-purple-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                          title="Son eklenen icra/nafaka dosyasına otomatik kaydır ve odaklan"
                        >
                          <Target className="w-3.5 h-3.5 text-purple-300" />
                          <span>Son Eklenen Kesinti</span>
                        </button>
                      )}

                      {/* Aktif İcralar */}
                      {legalDeductions.some((d) => d.type === "İcra Kesintisi" && d.status === "active") && (
                        <button
                          type="button"
                          onClick={() => {
                            const activeIcra = legalDeductions.find((d) => d.type === "İcra Kesintisi" && d.status === "active");
                            if (activeIcra) {
                              setHighlightedDeductionId(activeIcra.id);
                              scrollToElement(`deduction-row-${activeIcra.id}`);
                              showToast(`🎯 1. sıra aktif icra kesintisine odaklanıldı (${activeIcra.employeeName}).`);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[11px] font-bold border border-rose-600/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                          title="Maaştan aktif kesilen icra dosyasına otomatik kaydır"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                          <span>Aktif İcralar ({legalDeductions.filter((d) => d.type === "İcra Kesintisi" && d.status === "active").length})</span>
                        </button>
                      )}

                      {/* Aktif Nafakalar */}
                      {legalDeductions.some((d) => d.type === "Nafaka Kesintisi" && d.status === "active") && (
                        <button
                          type="button"
                          onClick={() => {
                            const activeNafaka = legalDeductions.find((d) => d.type === "Nafaka Kesintisi" && d.status === "active");
                            if (activeNafaka) {
                              setHighlightedDeductionId(activeNafaka.id);
                              scrollToElement(`deduction-row-${activeNafaka.id}`);
                              showToast(`🎯 Aktif nafaka kesintisi dosyasına odaklanıldı (${activeNafaka.employeeName}).`);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 text-[11px] font-bold border border-indigo-600/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                          title="Aktif nafaka kesintisi dosyasına otomatik kaydır"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Aktif Nafaka ({legalDeductions.filter((d) => d.type === "Nafaka Kesintisi" && d.status === "active").length})</span>
                        </button>
                      )}

                      {/* Sırada Bekleyenler */}
                      {legalDeductions.some((d) => d.status === "queued") && (
                        <button
                          type="button"
                          onClick={() => {
                            const queued = legalDeductions.find((d) => d.status === "queued");
                            if (queued) {
                              setHighlightedDeductionId(queued.id);
                              scrollToElement(`deduction-row-${queued.id}`);
                              showToast(`🎯 Sırada bekleyen icra dosyasına odaklanıldı (${queued.employeeName}).`);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-[11px] font-bold border border-amber-600/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                          title="Sırada bekleyen sonraki icra dosyasına otomatik kaydır"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-300" />
                          <span>Sıradakiler ({legalDeductions.filter((d) => d.status === "queued").length})</span>
                        </button>
                      )}

                      {/* Listenin Sonu & Başa Dön */}
                      <button
                        type="button"
                        onClick={() => scrollToElement("legal-deductions-table-bottom")}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shadow-2xs"
                        title="Kesinti listesinin en altına kaydır"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToElement("legal-deductions-section")}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shadow-2xs"
                        title="Kesinti listesinin başına kaydır"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    </div>
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
                          const isHighlighted = highlightedDeductionId === ded.id;

                          return (
                            <tr
                              key={ded.id}
                              id={`deduction-row-${ded.id}`}
                              className={`transition-all duration-300 group rounded-xl relative ${
                                isHighlighted
                                  ? "bg-rose-100 ring-2 ring-rose-600 shadow-xl z-20 scale-[1.006]"
                                  : "bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 z-0 hover:z-10"
                              }`}
                            >
                              <td className={`py-3 px-3 rounded-l-xl border-y border-l transition-all font-bold ${
                                isHighlighted
                                  ? "border-rose-500 bg-rose-100/90 text-rose-950"
                                  : "border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 text-slate-900 group-hover:text-purple-950"
                              }`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{ded.employeeName}</span>
                                  {isHighlighted && (
                                    <span className="inline-flex items-center gap-1 bg-rose-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                      <Target className="w-3 h-3" />
                                      <span>Odaklandı</span>
                                    </span>
                                  )}
                                </div>
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
                                  {ded.calculationType === "quarter_salary" ? "Maaşın 1/4'ü (%25)" : `Sabit ${formatTRY(ded.monthlyAmount || 0)}`}
                                </div>
                              </td>

                              <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                                {ded.totalDebtAmount > 0 ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500">Borç: {formatTRY(ded.totalDebtAmount)}</span>
                                      <span className="font-extrabold text-slate-900">
                                        Kalan: {formatTRY(remainingDebt)}
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
                                    <div className="text-[10px] text-slate-400 text-right">Ödenen: {formatTRY(ded.paidAmount)} ({progress}%)</div>
                                  </div>
                                ) : (
                                  <div className="text-xs font-semibold text-purple-700">
                                    Aylık Sabit: {formatTRY(ded.monthlyAmount || 0)} (Sürekli)
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
                  <div id="legal-deductions-table-bottom" />
                </div>

                {/* FLOATING QUICK SCROLL ACTION */}
                {legalDeductions.length >= 4 && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100/60">
                    <span className="text-[11px] text-slate-500 font-medium">Hızlı Gezinme:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const latest = legalDeductions[legalDeductions.length - 1];
                        if (latest) {
                          setHighlightedDeductionId(latest.id);
                          scrollToElement(`deduction-row-${latest.id}`);
                          showToast(`🎯 Son eklenen kesinti dosyasına kaydırıldı (${latest.employeeName}).`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Target className="w-3.5 h-3.5 text-purple-200" />
                      <span>Son Eklenen Kesintiye Git</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToElement("legal-deductions-section")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Listenin Başı</span>
                    </button>
                  </div>
                )}
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

      {/* SUB-TAB 6: KIDEM & IHBAR TAZMINATI HESAPLAMA */}
      {activeSubTab === "severance" && (
        <SeveranceNoticeCalculator
          employees={employees}
          leaveRequests={leaveRequests}
          companySettings={companySettings}
        />
      )}

      {/* SUB-TAB 7: ZİMMET & DEMİRBAŞ TAKİBİ (ARAÇ, BİLGİSAYAR, TELEFON, TABLET VB.) */}
      {activeSubTab === "zimmet" && (
        <AssetCustodyManagement
          assets={assetCustodies}
          employees={employees}
          companySettings={companySettings}
          branches={branches}
          warehouses={warehouses}
          onAddAsset={onAddAsset}
          onUpdateAsset={onUpdateAsset}
          onDeleteAsset={onDeleteAsset}
        />
      )}

      {/* MODAL: RESMİ İZİN, DEVAMSIZLIK & AVANS FORMLARI YAZDIRMA & DÜZENLEME */}
      {isFormsModalOpen && (
        <HRDocumentFormsModal
          isOpen={isFormsModalOpen}
          onClose={() => {
            setIsFormsModalOpen(false);
            setFormsModalLeaveRequest(undefined);
            setFormsModalAdvanceRequest(undefined);
          }}
          employees={employees}
          companySettings={companySettings}
          advanceRequests={advanceRequests}
          initialEmployeeId={formsModalEmployeeId}
          initialFormType={formsModalType}
          leaveRequest={formsModalLeaveRequest}
          advanceRequest={formsModalAdvanceRequest}
        />
      )}

      {/* MODAL: RESMİ BORDRO VE MAAŞ PUSULASI YAZDIRMA (AYLIK & TÜM YIL) */}
      {isPayrollPrintModalOpen && (
        <PayrollPrintModal
          isOpen={isPayrollPrintModalOpen}
          onClose={() => {
            setIsPayrollPrintModalOpen(false);
            setPayrollPrintSelectedEmpId(undefined);
          }}
          employees={employees}
          companySettings={companySettings}
          selectedMonth={payrollMonth}
          initialEmployeeId={payrollPrintSelectedEmpId}
          initialMode={payrollPrintInitialMode}
          payrollCustomizations={payrollCustomizations}
          advanceRequests={advanceRequests}
          leaveRequests={leaveRequests}
          legalDeductions={legalDeductions}
        />
      )}

      {/* POST-SAVE DIALOG: BORDRO KAYIT SONRASI OTOMATİK BELGE & YAZDIRMA AKIŞI */}
      {savedPayrollForPrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Bordro Başarıyla Kaydedildi!
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-bold text-purple-900">{savedPayrollForPrintModal.emp.fullName}</span> • {payrollMonth} Dönemi Bordrosu ve İlgili Kesinti/Talep Evrakları Hazırlandı
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSavedPayrollForPrintModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Otomatik Doldurulan Belgeler Bilgi Kutusu */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="font-black text-purple-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Otomatik Doldurulan ve Bağlanan Belgeler:
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    Resmi Bordro / Maaş Pusulası
                  </span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Hazır
                  </span>
                </div>

                {savedPayrollForPrintModal.hasAdvance && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-200 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold text-amber-950 block">
                          Personel Avans Talep & Mahsup Formu
                        </span>
                        <span className="text-[10px] text-amber-800">
                          Tutar: {formatTRY(savedPayrollForPrintModal.advAmount)} • Avans Yönetimine otomatik işlendi
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Otomatik Eklendi
                    </span>
                  </div>
                )}

                {savedPayrollForPrintModal.hasUnpaidLeave && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 border border-rose-200 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-600" />
                      <div>
                        <span className="font-bold text-rose-950 block">
                          Ücretsiz İzin & SGK Eksik Gün Bildirim Belgesi
                        </span>
                        <span className="text-[10px] text-rose-800">
                          Süre: {savedPayrollForPrintModal.unpaidDays} Gün • Kod: {savedPayrollForPrintModal.form.missingDayCode || "21"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                      Otomatik Eklendi
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hızlı Yazdırma Seçenekleri Butonları */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const empId = savedPayrollForPrintModal.emp.id;
                  setSavedPayrollForPrintModal(null);
                  setPayrollPrintSelectedEmpId(empId);
                  setPayrollPrintInitialMode("month");
                  setIsPayrollPrintModalOpen(true);
                }}
                className="w-full p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm flex items-center justify-between shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Printer className="w-5 h-5 text-emerald-100" />
                  <div className="text-left">
                    <div className="font-black">Bordroyu ve Ekli Formları Hemen Yazdır</div>
                    <div className="text-[11px] font-normal text-emerald-100">
                      Bordro, {savedPayrollForPrintModal.hasAdvance ? "Avans Talep Formu, " : ""}{savedPayrollForPrintModal.hasUnpaidLeave ? "SGK Eksik Gün Bildirimi, " : ""}tek pencerede birlikte yazdırılır
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-200" />
              </button>

              {savedPayrollForPrintModal.hasAdvance && (
                <button
                  type="button"
                  onClick={() => {
                    const empId = savedPayrollForPrintModal.emp.id;
                    setSavedPayrollForPrintModal(null);
                    setFormsModalEmployeeId(empId);
                    setFormsModalType("advance_request");
                    setIsFormsModalOpen(true);
                  }}
                  className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    Resmi Avans Talep & Taahhüt Formunu Ayrı Yazdır ({formatTRY(savedPayrollForPrintModal.advAmount)})
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-700" />
                </button>
              )}

              {savedPayrollForPrintModal.hasUnpaidLeave && (
                <button
                  type="button"
                  onClick={() => {
                    const empId = savedPayrollForPrintModal.emp.id;
                    setSavedPayrollForPrintModal(null);
                    setFormsModalEmployeeId(empId);
                    setFormsModalType("unpaid_leave");
                    setIsFormsModalOpen(true);
                  }}
                  className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-300 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    Ücretsiz İzin Talep Dilekçesi & SGK Bildirimini Ayrı Yazdır ({savedPayrollForPrintModal.unpaidDays} Gün)
                  </span>
                  <ChevronRight className="w-4 h-4 text-rose-700" />
                </button>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSavedPayrollForPrintModal(null);
                  handleBackToList();
                }}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
              >
                Kapat & Listeye Dön
              </button>

              {savedPayrollForPrintModal.nextEmp ? (
                <button
                  type="button"
                  onClick={() => {
                    const next = savedPayrollForPrintModal.nextEmp;
                    setSavedPayrollForPrintModal(null);
                    if (next) handleOpenEditPayroll(next);
                  }}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Sıradaki Personele Geç ({savedPayrollForPrintModal.nextEmp.fullName})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSavedPayrollForPrintModal(null);
                    handleBackToList();
                  }}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Tamamla
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRManagement;
