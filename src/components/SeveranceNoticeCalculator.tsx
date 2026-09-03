import React, { useState, useMemo } from "react";
import {
  Calculator,
  Calendar,
  DollarSign,
  Printer,
  Download,
  FileText,
  User,
  Building2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Briefcase,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  Scale,
  Award,
} from "lucide-react";
import { Employee, CompanySettings, LeaveRequest } from "../types";
import { sgkTerminationReasons } from "../data/sgkTerminationReasons";
import { exportElementToPDF } from "../utils/exportUtils";
import { DetailPageLayout } from "./common/DetailPageLayout";

interface SeveranceNoticeCalculatorProps {
  employees: Employee[];
  leaveRequests?: LeaveRequest[];
  companySettings: CompanySettings;
  onClose?: () => void;
}

export const SeveranceNoticeCalculator: React.FC<SeveranceNoticeCalculatorProps> = ({
  employees,
  leaveRequests = [],
  companySettings,
  onClose,
}) => {
  // Para formatlayıcı
  const formatTRY = (val: number | null | undefined): string => {
    const num = typeof val === "number" && !isNaN(val) ? val : Number(val || 0);
    return (
      "₺" +
      num.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // Alfabetik sıralı personeller
  const sortedEmployees = [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));

  // Seçili Personel
  const [selectedEmpId, setSelectedEmpId] = useState<string>(sortedEmployees[0]?.id || "");
  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || sortedEmployees[0];

  // Tarihler
  const [startDate, setStartDate] = useState<string>(selectedEmp?.startDate || "2023-01-15");
  const [endDate, setEndDate] = useState<string>(selectedEmp?.endDate || todayStr);

  // Ücret ve Yan Haklar (Aylık)
  const [nakedGrossSalary, setNakedGrossSalary] = useState<number>(
    selectedEmp ? (selectedEmp.salaryType === "gross" ? selectedEmp.salaryAmount : Math.round(selectedEmp.salaryAmount * 1.38)) : 50000
  );
  const [foodAllowance, setFoodAllowance] = useState<number>(selectedEmp?.foodAllowance || 4500);
  const [roadAllowance, setRoadAllowance] = useState<number>(selectedEmp?.roadAllowance || 2500);
  const [bonusAverage, setBonusAverage] = useState<number>(0);
  const [otherBenefits, setOtherBenefits] = useState<number>(0);

  // Yasal Parametreler
  const [severanceCeiling, setSeveranceCeiling] = useState<number>(46550.0); // 2026 Kıdem Tazminatı Tavanı
  const [terminationCode, setTerminationCode] = useState<string>("04");
  const [paySeverance, setPaySeverance] = useState<boolean>(true);
  const [payNotice, setPayNotice] = useState<boolean>(true);
  const [includeUnusedLeave, setIncludeUnusedLeave] = useState<boolean>(true);
  const [unusedLeaveDays, setUnusedLeaveDays] = useState<number>(14);

  // Printable Document Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const sanitizedName = (selectedEmp?.fullName || "Personel").trim().replace(/\s+/g, "_");
      const fileName = `Kidem_Ihbar_Bordrosu_${sanitizedName}.pdf`;
      await exportElementToPDF("severance-printable-sheet", fileName);
    } catch (err) {
      console.error("Tazminat Bordrosu PDF İndirme Hatası:", err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Personel seçimi değiştiğinde form alanlarını güncelle
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    setStartDate(emp.startDate || "2023-01-15");
    setEndDate(emp.endDate || todayStr);

    const gross = emp.salaryType === "gross" ? emp.salaryAmount : Math.round(emp.salaryAmount * 1.38);
    setNakedGrossSalary(gross);
    setFoodAllowance(emp.foodAllowance || 0);
    setRoadAllowance(emp.roadAllowance || 0);
    setBonusAverage(0);
    setOtherBenefits(0);

    // Kalan izin gününü hesapla
    const usedLeaves = leaveRequests
      .filter((lr) => lr.employeeId === emp.id && lr.status === "approved" && (lr.type.toLowerCase().includes("yıllık") || lr.type.toLowerCase().includes("yillik") || lr.type === "annual"))
      .reduce((sum, lr) => sum + (Number(lr.daysCount) || 0), 0);
    const remaining = Math.max(0, (emp.annualLeaveAllowance || 14) - usedLeaves - (emp.usedAnnualLeave || 0));
    setUnusedLeaveDays(remaining);
  };

  // Çıkış Kodu değiştiğinde hak ediş varsayılanlarını otomatik ayarla
  const handleTerminationCodeChange = (code: string) => {
    setTerminationCode(code);
    // 04: İşveren feshinde ikisi de ödenir
    // 03: İstifada ikisi de ödenmez
    // 08 (Emeklilik), 14 (Kadın Evlilik), 17 (Askerlik): Kıdem ödenir, İhbar ödenmez
    // 29 (Ahlak ve iyi niyet): İkisi de ödenmez
    if (code === "04" || code === "05" || code === "18" || code === "27" || code === "28") {
      setPaySeverance(true);
      setPayNotice(true);
    } else if (code === "08" || code === "14" || code === "17" || code === "23" || code === "24" || code === "25") {
      setPaySeverance(true);
      setPayNotice(false);
    } else if (code === "03" || code === "29" || code === "30") {
      setPaySeverance(false);
      setPayNotice(false);
    }
  };

  // HİZMET SÜRESİ VE TAZMİNAT DETAYLI HESAPLAMALARI
  const calculation = useMemo(() => {
    const sDate = new Date(startDate || "2024-01-01");
    const eDate = new Date(endDate || todayStr);

    // Toplam gün farkı
    const timeDiff = eDate.getTime() - sDate.getTime();
    const totalDays = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));

    // Yıl, Ay, Gün Ayrıştırması
    let years = eDate.getFullYear() - sDate.getFullYear();
    let months = eDate.getMonth() - sDate.getMonth();
    let days = eDate.getDate() - sDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(eDate.getFullYear(), eDate.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const completedYears = Math.max(0, years);
    const completedMonths = Math.max(0, months);
    const completedDays = Math.max(0, days);

    // Giydirilmiş Brüt Ücret (Çıplak Brüt + Düzenli Yan Haklar)
    const clothedGross = Math.max(0, nakedGrossSalary + foodAllowance + roadAllowance + bonusAverage + otherBenefits);

    // Tavan Kontrolü: Kıdem tazminatı hesabında giydirilmiş brüt tavanı aşamaz
    const isCeilingExceeded = clothedGross > severanceCeiling;
    const appliedSeveranceBaseWage = isCeilingExceeded ? severanceCeiling : clothedGross;
    const dailySeveranceBaseWage = appliedSeveranceBaseWage / 30;

    // 1475 S.K. Madde 14 - Kıdem Tazminatı Şartı: En az 1 tam yıl (veya 365 gün)
    const isSeveranceEligibleByTime = totalDays >= 365 || completedYears >= 1;

    // Kıdem Tazminatı Tutarları
    let grossSeveranceYear = 0;
    let grossSeveranceMonth = 0;
    let grossSeveranceDay = 0;
    let grossSeveranceTotal = 0;
    let severanceStampTax = 0;
    let netSeveranceTotal = 0;

    if (paySeverance && isSeveranceEligibleByTime) {
      grossSeveranceYear = completedYears * appliedSeveranceBaseWage;
      grossSeveranceMonth = (appliedSeveranceBaseWage / 12) * completedMonths;
      grossSeveranceDay = (appliedSeveranceBaseWage / 365) * completedDays;
      grossSeveranceTotal = Math.round(grossSeveranceYear + grossSeveranceMonth + grossSeveranceDay);
      severanceStampTax = Math.round(grossSeveranceTotal * 0.00759); // Binde 7.59
      netSeveranceTotal = Math.max(0, grossSeveranceTotal - severanceStampTax);
    }

    // 4857 S.K. Madde 17 - İhbar Öneli ve İhbar Tazminatı
    // 6 aya kadar: 2 hafta (14 gün)
    // 6 ay - 1.5 yıl: 4 hafta (28 gün)
    // 1.5 yıl - 3 yıl: 6 hafta (42 gün)
    // 3 yıldan fazla: 8 hafta (56 gün)
    const totalMonthsExact = completedYears * 12 + completedMonths + (completedDays > 0 ? 0.5 : 0);
    let noticeWeeks = 2;
    let noticeDays = 14;

    if (totalMonthsExact >= 36) {
      noticeWeeks = 8;
      noticeDays = 56;
    } else if (totalMonthsExact >= 18) {
      noticeWeeks = 6;
      noticeDays = 42;
    } else if (totalMonthsExact >= 6) {
      noticeWeeks = 4;
      noticeDays = 28;
    } else {
      noticeWeeks = 2;
      noticeDays = 14;
    }

    const dailyClothedGrossNotice = clothedGross / 30;
    let grossNoticeTotal = 0;
    let noticeIncomeTax = 0;
    let noticeStampTax = 0;
    let netNoticeTotal = 0;

    if (payNotice) {
      grossNoticeTotal = Math.round(dailyClothedGrossNotice * noticeDays);
      noticeIncomeTax = Math.round(grossNoticeTotal * 0.15); // %15 Gelir Vergisi Dilimi
      noticeStampTax = Math.round(grossNoticeTotal * 0.00759); // Binde 7.59 Damga Vergisi
      netNoticeTotal = Math.max(0, grossNoticeTotal - noticeIncomeTax - noticeStampTax);
    }

    // 4857 S.K. Madde 59 - Kullanılmayan Yıllık İzin Ücreti
    let grossUnusedLeave = 0;
    let leaveSgkDeduction = 0;
    let leaveIncomeTax = 0;
    let leaveStampTax = 0;
    let netUnusedLeave = 0;

    if (includeUnusedLeave && unusedLeaveDays > 0) {
      const dailyNakedGross = nakedGrossSalary / 30;
      grossUnusedLeave = Math.round(dailyNakedGross * unusedLeaveDays);
      leaveSgkDeduction = Math.round(grossUnusedLeave * 0.15); // %14 SGK + %1 İşsizlik
      const leaveTaxBase = grossUnusedLeave - leaveSgkDeduction;
      leaveIncomeTax = Math.round(leaveTaxBase * 0.15);
      leaveStampTax = Math.round(grossUnusedLeave * 0.00759);
      netUnusedLeave = Math.max(0, grossUnusedLeave - leaveSgkDeduction - leaveIncomeTax - leaveStampTax);
    }

    // TOPLAM BORDRO HAKEDİŞİ
    const grandGrossTotal = grossSeveranceTotal + grossNoticeTotal + grossUnusedLeave;
    const grandDeductionsTotal =
      severanceStampTax + (noticeIncomeTax + noticeStampTax) + (leaveSgkDeduction + leaveIncomeTax + leaveStampTax);
    const grandNetPayable = netSeveranceTotal + netNoticeTotal + netUnusedLeave;

    return {
      totalDays,
      completedYears,
      completedMonths,
      completedDays,
      clothedGross,
      isCeilingExceeded,
      appliedSeveranceBaseWage,
      isSeveranceEligibleByTime,
      // Kıdem
      grossSeveranceYear,
      grossSeveranceMonth,
      grossSeveranceDay,
      grossSeveranceTotal,
      severanceStampTax,
      netSeveranceTotal,
      // İhbar
      noticeWeeks,
      noticeDays,
      grossNoticeTotal,
      noticeIncomeTax,
      noticeStampTax,
      netNoticeTotal,
      // İzin
      grossUnusedLeave,
      leaveSgkDeduction,
      leaveIncomeTax,
      leaveStampTax,
      netUnusedLeave,
      // İcmal
      grandGrossTotal,
      grandDeductionsTotal,
      grandNetPayable,
    };
  }, [
    startDate,
    endDate,
    nakedGrossSalary,
    foodAllowance,
    roadAllowance,
    bonusAverage,
    otherBenefits,
    severanceCeiling,
    paySeverance,
    payNotice,
    includeUnusedLeave,
    unusedLeaveDays,
  ]);

  return (
    <div className="space-y-6">
      {/* BAŞLIK & AÇIKLAMA KARTI */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-purple-800/80 text-purple-200 border border-purple-400/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <Scale className="w-3.5 h-3.5 text-purple-300" />
                4857 & 1475 Sayılı İş Kanunu Uyumlu
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                2026 Tavan & Dilimler Aktif
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Kıdem, İhbar Tazminatı & İbraname Hesaplama</span>
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium max-w-3xl leading-relaxed">
              Personelin işe giriş ve ayrılış tarihine göre çalıştığı yıl, ay ve gün kesirlerini hesaplayarak, giydirilmiş brüt ücret, kıdem tavanı, yasal ihbar öneli ve kullanılmayan izin ücretlerini anlık olarak belirler.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-white text-purple-950 hover:bg-purple-50 font-black px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-700" />
              <span>Resmi Tazminat Bordrosu & İbraname</span>
            </button>
          </div>
        </div>
      </div>

      {/* FORM VE HESAPLAMA PANELİ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SOL PANEL: GİRİŞ PARAMETRELERİ (7 Kolon) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Personel Seçimi ve Temel Bilgiler */}
          <div className="bg-white rounded-2xl border border-purple-200/70 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-purple-700" />
                <span>1. Personel & Fesih Tarihleri</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {employees.length} Kayıtlı Personel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Personel Dropdown */}
              <div className="sm:col-span-2 space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Personel Seçimi</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  {sortedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} · {emp.department} ({emp.title}) · İşe Giriş: {emp.startDate || "—"}
                    </option>
                  ))}
                </select>
              </div>

              {/* İşe Giriş Tarihi */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">İşe Giriş Tarihi</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* İşten Çıkış / Fesih Tarihi */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">İşten Çıkış / Fesih Tarihi</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* Çalışılan Toplam Hizmet Süresi Göstergesi */}
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-purple-800 uppercase block">Hesaplanan Kıdem / Hizmet Süresi</span>
                  <span className="text-sm font-black text-purple-950">
                    {calculation.completedYears} Yıl, {calculation.completedMonths} Ay, {calculation.completedDays} Gün
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Toplam Süre</span>
                <span className="text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded-md border border-purple-200 shadow-2xs">
                  {calculation.totalDays} Gün
                </span>
              </div>
            </div>

            {/* 1 Yıl Şartı Uyarısı */}
            {!calculation.isSeveranceEligibleByTime && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-semibold">
                  <strong>Dikkat:</strong> Personelin çalışma süresi 1 yıldan (365 günden) az olduğu için 1475 S.K. Md. 14 gereği kıdem tazminatı hakkı doğmamaktadır. Yalnızca ihbar tazminatı hesaplanabilir.
                </span>
              </div>
            )}
          </div>

          {/* 2. Giydirilmiş Brüt Ücret ve Yan Haklar */}
          <div className="bg-white rounded-2xl border border-purple-200/70 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-700" />
                <span>2. Ücret & Düzenli Yan Haklar (Giydirilmiş Brüt)</span>
              </h3>
              <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                Kıdeme Esas Ücret
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* Çıplak Brüt Maaş */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Çıplak Brüt Maaş (₺)</label>
                <input
                  type="number"
                  value={nakedGrossSalary}
                  onChange={(e) => setNakedGrossSalary(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Düzenli Yemek Yardımı */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Aylık Yemek Yardımı (₺)</label>
                <input
                  type="number"
                  value={foodAllowance}
                  onChange={(e) => setFoodAllowance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Düzenli Yol Yardımı */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Aylık Yol Yardımı (₺)</label>
                <input
                  type="number"
                  value={roadAllowance}
                  onChange={(e) => setRoadAllowance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Düzenli Prim / İkramiye Ortalaması */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Aylık Prim / İkramiye Ort. (₺)</label>
                <input
                  type="number"
                  value={bonusAverage}
                  onChange={(e) => setBonusAverage(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                  placeholder="0"
                />
              </div>

              {/* Diğer Düzenli Haklar */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase text-[10px]">Diğer Haklar (Yakacak/Bayram) (₺)</label>
                <input
                  type="number"
                  value={otherBenefits}
                  onChange={(e) => setOtherBenefits(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                  placeholder="0"
                />
              </div>

              {/* 2026 Kıdem Tazminatı Tavanı */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase text-[10px]">Kıdem Tavanı (₺)</label>
                  <span className="text-[9px] text-purple-700 font-bold">2026 Yasal</span>
                </div>
                <input
                  type="number"
                  value={severanceCeiling}
                  onChange={(e) => setSeveranceCeiling(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-purple-950 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* Giydirilmiş Brüt Özet Şeridi */}
            <div className="bg-slate-900 text-white rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Toplam Giydirilmiş Brüt</span>
                  <span className="text-base font-black text-emerald-400">{formatTRY(calculation.clothedGross)}</span>
                </div>
                <div className="hidden sm:block border-l border-slate-700 pl-4">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Günlük Giydirilmiş Brüt</span>
                  <span className="text-xs font-bold text-white">{formatTRY(calculation.clothedGross / 30)}</span>
                </div>
              </div>

              {calculation.isCeilingExceeded ? (
                <div className="bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                  ⚠️ Tavan Uygulandı: {formatTRY(calculation.appliedSeveranceBaseWage)}
                </div>
              ) : (
                <div className="text-[11px] text-slate-300 font-medium">
                  ✓ Giydirilmiş brüt kıdem tavanının altında.
                </div>
              )}
            </div>
          </div>

          {/* 3. Fesih Nedeni, İhbar & Yıllık İzin Seçenekleri */}
          <div className="bg-white rounded-2xl border border-purple-200/70 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-700" />
                <span>3. Fesih Nedeni, İhbar Öneli & Yıllık İzin</span>
              </h3>
            </div>

            {/* SGK Çıkış Kodu Seçici */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700 uppercase text-[10px]">SGK İşten Çıkış / Fesih Kodu</label>
              <select
                value={terminationCode}
                onChange={(e) => handleTerminationCodeChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:outline-none focus:border-purple-600 cursor-pointer"
              >
                {sgkTerminationReasons.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code} - {t.reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Tazminat Dahil Etme Kutucukları */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Kıdem Tazminatı Seçeneği */}
              <label className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${paySeverance ? "bg-purple-50/80 border-purple-300 text-purple-950 font-bold" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs">Kıdem Tazminatı</span>
                  <input
                    type="checkbox"
                    checked={paySeverance}
                    onChange={(e) => setPaySeverance(e.target.checked)}
                    className="w-4 h-4 text-purple-700 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  1475 S.K. Md. 14 Esasları
                </span>
              </label>

              {/* İhbar Tazminatı Seçeneği */}
              <label className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${payNotice ? "bg-purple-50/80 border-purple-300 text-purple-950 font-bold" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs">İhbar Tazminatı</span>
                  <input
                    type="checkbox"
                    checked={payNotice}
                    onChange={(e) => setPayNotice(e.target.checked)}
                    className="w-4 h-4 text-purple-700 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  Önel Süresi: {calculation.noticeWeeks} Hafta ({calculation.noticeDays} Gün)
                </span>
              </label>

              {/* Kullanılmayan İzin Ücreti Seçeneği */}
              <label className={`p-3 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${includeUnusedLeave ? "bg-purple-50/80 border-purple-300 text-purple-950 font-bold" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs">İzin Ücreti</span>
                  <input
                    type="checkbox"
                    checked={includeUnusedLeave}
                    onChange={(e) => setIncludeUnusedLeave(e.target.checked)}
                    className="w-4 h-4 text-purple-700 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={unusedLeaveDays}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setUnusedLeaveDays(Number(e.target.value))}
                    className="w-12 bg-white border border-slate-300 rounded px-1 text-center font-bold text-slate-900 text-xs"
                  />
                  <span className="text-[10px] font-normal">Kalan Gün</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: CANLI HESAPLAMA KARTLARI & GENEL İCMAL (5 Kolon) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Kıdem Tazminatı Hesaplama Kartı */}
          <div className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <h4 className="font-black text-purple-950 text-xs uppercase">Kıdem Tazminatı Hesabı</h4>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                1475 S.K. Md. 14
              </span>
            </div>

            {paySeverance && calculation.isSeveranceEligibleByTime ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>· Tam Yıl Payı ({calculation.completedYears} Yıl):</span>
                  <span className="font-bold text-slate-900">{formatTRY(calculation.grossSeveranceYear)}</span>
                </div>
                {calculation.completedMonths > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>· Artan Ay Payı ({calculation.completedMonths} Ay):</span>
                    <span className="font-bold text-slate-900">{formatTRY(calculation.grossSeveranceMonth)}</span>
                  </div>
                )}
                {calculation.completedDays > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>· Artan Gün Payı ({calculation.completedDays} Gün):</span>
                    <span className="font-bold text-slate-900">{formatTRY(calculation.grossSeveranceDay)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1.5">
                  <span>Brüt Kıdem Tazminatı:</span>
                  <span className="text-purple-950">{formatTRY(calculation.grossSeveranceTotal)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) Damga Vergisi (%0.759):</span>
                  <span className="font-bold">-{formatTRY(calculation.severanceStampTax)}</span>
                </div>
                <div className="flex justify-between bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-purple-950 font-black text-sm">
                  <span>Net Kıdem Tazminatı:</span>
                  <span className="text-purple-900">{formatTRY(calculation.netSeveranceTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-2 text-center font-medium bg-slate-50 rounded-xl">
                Kıdem tazminatı hesaplamaya dahil edilmedi veya 1 yıl şartı dolmadı.
              </div>
            )}
          </div>

          {/* 2. İhbar Tazminatı Hesaplama Kartı */}
          <div className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h4 className="font-black text-indigo-950 text-xs uppercase">İhbar Tazminatı Hesabı</h4>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                4857 S.K. Md. 17 ({calculation.noticeWeeks} Hafta)
              </span>
            </div>

            {payNotice ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>· İhbar Öneli Süresi:</span>
                  <span className="font-bold text-slate-900">{calculation.noticeDays} Günlük Ücret</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1.5">
                  <span>Brüt İhbar Tazminatı:</span>
                  <span className="text-indigo-950">{formatTRY(calculation.grossNoticeTotal)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) Gelir Vergisi (%15):</span>
                  <span className="font-bold">-{formatTRY(calculation.noticeIncomeTax)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) Damga Vergisi (%0.759):</span>
                  <span className="font-bold">-{formatTRY(calculation.noticeStampTax)}</span>
                </div>
                <div className="flex justify-between bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 text-indigo-950 font-black text-sm">
                  <span>Net İhbar Tazminatı:</span>
                  <span className="text-indigo-900">{formatTRY(calculation.netNoticeTotal)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-2 text-center font-medium bg-slate-50 rounded-xl">
                İhbar tazminatı hesaplamaya dahil edilmedi (önel kullandırıldı).
              </div>
            )}
          </div>

          {/* 3. Kullanılmayan İzin Ücreti Kartı */}
          {includeUnusedLeave && unusedLeaveDays > 0 && (
            <div className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <h4 className="font-black text-teal-950 text-xs uppercase">Kullanılmayan Yıllık İzin Ücreti</h4>
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                  4857 S.K. Md. 59
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>· Kalan İzin Süresi:</span>
                  <span className="font-bold text-slate-900">{unusedLeaveDays} Gün</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-100 pt-1.5">
                  <span>Brüt İzin Ücreti:</span>
                  <span className="text-teal-950">{formatTRY(calculation.grossUnusedLeave)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) SGK İşçi Payı (%15):</span>
                  <span className="font-bold">-{formatTRY(calculation.leaveSgkDeduction)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>(-) Gelir & Damga Vergisi:</span>
                  <span className="font-bold">-{formatTRY(calculation.leaveIncomeTax + calculation.leaveStampTax)}</span>
                </div>
                <div className="flex justify-between bg-teal-50 p-2.5 rounded-xl border border-teal-200 text-teal-950 font-black text-sm">
                  <span>Net İzin Ücreti:</span>
                  <span className="text-teal-900">{formatTRY(calculation.netUnusedLeave)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. GENEL HAKEDİŞ İCMALİ & NET ÖDENECEK TOPLAM */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] uppercase font-black text-purple-300 tracking-wider">
                Fesih Hakediş & İbraname İcmali
              </span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                Net Ödenecek
              </span>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-slate-300">
                <span>Toplam Brüt Hakediş:</span>
                <span className="font-bold text-white">{formatTRY(calculation.grandGrossTotal)}</span>
              </div>
              <div className="flex justify-between text-rose-300">
                <span>Toplam Yasal Kesintiler:</span>
                <span className="font-bold">-{formatTRY(calculation.grandDeductionsTotal)}</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-emerald-300 block uppercase">
                Personele Ödenecek Toplam Net Tazminat
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {formatTRY(calculation.grandNetPayable)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Resmi Kıdem / İhbar Bordrosu Yazdır</span>
            </button>
          </div>
        </div>
      </div>

      {/* YAZDIRILABİLİR RESMİ TAZMİNAT VE İBRANAME TAM SAYFA GÖRÜNÜMÜ */}
      {isPrintModalOpen && (
        <DetailPageLayout
          title="Resmi Kıdem & İhbar Tazminatı Bordrosu / İbraname"
          subtitle={`${selectedEmp?.fullName || "Personel"} • Çıkış Tarihi: ${endDate} • Net Ödenecek Toplam: ${formatTRY(calculation.grandNetPayable)}`}
          breadcrumbs={[
            { label: "Tazminat Hesaplayıcı", onClick: () => setIsPrintModalOpen(false) },
            { label: "Resmi İbraname & Bordro", active: true },
          ]}
          onBack={() => setIsPrintModalOpen(false)}
          statusBadge={
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1 rounded-xl">
              RESMİ İBRANAME (4857 S.K.)
            </span>
          }
          headerIcon={<FileText className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-purple-200" />
                <span>{isDownloadingPDF ? "PDF Hazırlanıyor..." : "PDF İndir"}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Yazdır</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Geri Dön
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-4xl mx-auto p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">

            {/* A4 FORMATINDA RESMİ BELGE GÖRÜNÜMÜ */}
            <div id="severance-printable-sheet" className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 text-slate-900 font-sans text-xs">
              {/* Belge Üst Başlığı */}
              <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
                <h2 className="font-black text-base text-slate-950 uppercase tracking-wide">
                  {companySettings.companyName || "ŞİRKET ÜNVANI"}
                </h2>
                <h3 className="font-bold text-sm text-purple-900 uppercase">
                  KIDEM VE İHBAR TAZMİNATI HESAP PUSULASI & İBRANAME
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  SGK İşyeri Sicil No: {companySettings.sgkCredentials?.workplaceRegistrationNo || "Tanımsız"} · Düzenleme Tarihi: {todayStr}
                </p>
              </div>

              {/* Personel ve Hizmet Bilgileri Tablosu */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div><span className="text-slate-500">Adı Soyadı:</span> <strong className="text-slate-900">{selectedEmp.fullName}</strong></div>
                  <div><span className="text-slate-500">T.C. Kimlik No:</span> <strong className="text-slate-900">{selectedEmp.tckn || "—"}</strong></div>
                  <div><span className="text-slate-500">Departman / Görev:</span> <strong className="text-slate-900">{selectedEmp.department} / {selectedEmp.title}</strong></div>
                  <div><span className="text-slate-500">Fesih / Çıkış Kodu:</span> <strong className="text-slate-900">{terminationCode} - {sgkTerminationReasons.find(r => r.code === terminationCode)?.reason || "Fesih"}</strong></div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-slate-500">İşe Giriş Tarihi:</span> <strong className="text-slate-900">{startDate}</strong></div>
                  <div><span className="text-slate-500">İşten Ayrılış Tarihi:</span> <strong className="text-slate-900">{endDate}</strong></div>
                  <div><span className="text-slate-500">Toplam Hizmet Süresi:</span> <strong className="text-purple-900">{calculation.completedYears} Yıl, {calculation.completedMonths} Ay, {calculation.completedDays} Gün ({calculation.totalDays} Gün)</strong></div>
                  <div><span className="text-slate-500">Giydirilmiş Brüt Ücret:</span> <strong className="text-slate-900">{formatTRY(calculation.clothedGross)}</strong></div>
                </div>
              </div>

              {/* Hakediş Döküm Tablosu */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className="p-2 text-left border border-slate-700">Tazminat / Hakediş Kalemi</th>
                    <th className="p-2 text-right border border-slate-700">Brüt Tutar</th>
                    <th className="p-2 text-right border border-slate-700">SGK Kesintisi</th>
                    <th className="p-2 text-right border border-slate-700">Gelir Vergisi</th>
                    <th className="p-2 text-right border border-slate-700">Damga Vergisi</th>
                    <th className="p-2 text-right border border-slate-700">Net Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {paySeverance && (
                    <tr>
                      <td className="p-2 border border-slate-200 font-semibold">
                        Kıdem Tazminatı ({calculation.completedYears} Yıl, {calculation.completedMonths} Ay, {calculation.completedDays} Gün)
                      </td>
                      <td className="p-2 border border-slate-200 text-right font-bold">{formatTRY(calculation.grossSeveranceTotal)}</td>
                      <td className="p-2 border border-slate-200 text-right text-slate-400">0,00 ₺</td>
                      <td className="p-2 border border-slate-200 text-right text-slate-400">0,00 ₺</td>
                      <td className="p-2 border border-slate-200 text-right text-rose-700">{formatTRY(calculation.severanceStampTax)}</td>
                      <td className="p-2 border border-slate-200 text-right font-black text-purple-950">{formatTRY(calculation.netSeveranceTotal)}</td>
                    </tr>
                  )}
                  {payNotice && (
                    <tr>
                      <td className="p-2 border border-slate-200 font-semibold">
                        İhbar Tazminatı ({calculation.noticeWeeks} Hafta / {calculation.noticeDays} Gün)
                      </td>
                      <td className="p-2 border border-slate-200 text-right font-bold">{formatTRY(calculation.grossNoticeTotal)}</td>
                      <td className="p-2 border border-slate-200 text-right text-slate-400">0,00 ₺</td>
                      <td className="p-2 border border-slate-200 text-right text-rose-700">{formatTRY(calculation.noticeIncomeTax)}</td>
                      <td className="p-2 border border-slate-200 text-right text-rose-700">{formatTRY(calculation.noticeStampTax)}</td>
                      <td className="p-2 border border-slate-200 text-right font-black text-indigo-950">{formatTRY(calculation.netNoticeTotal)}</td>
                    </tr>
                  )}
                  {includeUnusedLeave && unusedLeaveDays > 0 && (
                    <tr>
                      <td className="p-2 border border-slate-200 font-semibold">
                        Kullanılmayan Yıllık İzin Ücreti ({unusedLeaveDays} Gün)
                      </td>
                      <td className="p-2 border border-slate-200 text-right font-bold">{formatTRY(calculation.grossUnusedLeave)}</td>
                      <td className="p-2 border border-slate-200 text-right text-rose-700">{formatTRY(calculation.leaveSgkDeduction)}</td>
                      <td className="p-2 border border-slate-200 text-right text-rose-700">{formatTRY(calculation.leaveIncomeTax)}</td>
                      <td className="p-2 border border-slate-200 text-right text-rose-700">{formatTRY(calculation.leaveStampTax)}</td>
                      <td className="p-2 border border-slate-200 text-right font-black text-teal-950">{formatTRY(calculation.netUnusedLeave)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-black text-slate-950">
                    <td className="p-2.5 border border-slate-300 uppercase">GENEL TOPLAM</td>
                    <td className="p-2.5 border border-slate-300 text-right">{formatTRY(calculation.grandGrossTotal)}</td>
                    <td colSpan={3} className="p-2.5 border border-slate-300 text-right text-rose-800">
                      Toplam Kesinti: -{formatTRY(calculation.grandDeductionsTotal)}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-right text-sm text-emerald-800 bg-emerald-50">
                      {formatTRY(calculation.grandNetPayable)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* İBRANAME METNİ */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-[11px] leading-relaxed text-slate-700 text-justify">
                <h4 className="font-black text-slate-900 uppercase text-center text-xs">İBRANAME BEYANI</h4>
                <p>
                  {companySettings.companyName || "Şirket"} nezdinde {startDate} - {endDate} tarihleri arasında geçen çalışma dönemime ilişkin olarak, yukarıdaki hesap pusulasında ayrıntıları belirtilen <strong>{formatTRY(calculation.grandNetPayable)}</strong> tutarındaki kıdem tazminatı, ihbar tazminatı, kullanılmayan yıllık izin ücreti ve tüm yasal işçilik hakedişlerimi banka hesabı kanalıyla eksiksiz ve nakden teslim aldım.
                </p>
                <p>
                  İş sözleşmemin sona ermesi sebebiyle işverenden ve işyerinden başkaca hiçbir ücret, fazla mesai, hafta tatili, genel tatil, prim veya tazminat alacağım kalmadığını; işvereni geçmişe ve geleceğe dönük olarak gayrikabili rücu suretiyle ibra ettiğimi kabul, beyan ve taahhüt ederim.
                </p>
              </div>

              {/* İmza Alanları */}
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="text-center space-y-8">
                  <span className="font-bold text-slate-800 block text-xs">İŞVEREN / YETKİLİ KAŞE - İMZA</span>
                  <div className="text-[11px] text-slate-500">{companySettings.companyName || "Yetkili İmza"}</div>
                </div>
                <div className="text-center space-y-8">
                  <span className="font-bold text-slate-800 block text-xs">İBRANAME VEREN PERSONEL İMZA</span>
                  <div className="text-[11px] text-slate-500">{selectedEmp.fullName}</div>
                </div>
            </div>
          </div>
        </div>
      </DetailPageLayout>
      )}
    </div>
  );
};
