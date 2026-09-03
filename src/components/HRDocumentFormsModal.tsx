import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  FileCheck2,
  Download,
  CreditCard,
  Banknote,
  Wallet,
  Receipt,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Employee, CompanySettings, LeaveRequest, AdvanceRequest } from "../types";
import { exportElementToPDF } from "../utils/exportUtils";
import { DetailPageLayout } from "./common/DetailPageLayout";

export type HRFormType = "annual_leave" | "unpaid_leave" | "absence_report" | "paternity_leave" | "advance_request" | "expense_request";

export interface ExpenseItemRow {
  id: string;
  date: string;
  description: string;
  receiptNo: string;
  amount: number;
}

interface HRDocumentFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  companySettings: CompanySettings;
  initialEmployeeId?: string;
  initialFormType?: HRFormType;
  initialLeaveRequest?: LeaveRequest;
  leaveRequest?: LeaveRequest;
  initialAdvanceRequest?: AdvanceRequest;
  advanceRequest?: AdvanceRequest;
  advanceRequests?: AdvanceRequest[];
}

export const HRDocumentFormsModal: React.FC<HRDocumentFormsModalProps> = ({
  isOpen,
  onClose,
  employees,
  companySettings,
  initialEmployeeId,
  initialFormType = "annual_leave",
  initialLeaveRequest,
  leaveRequest,
  initialAdvanceRequest,
  advanceRequest,
  advanceRequests = [],
}) => {
  const activeLeaveReq = leaveRequest || initialLeaveRequest;
  const activeAdvReq = advanceRequest || initialAdvanceRequest;
  const [selectedFormType, setSelectedFormType] = useState<HRFormType>(initialFormType);

  // Alfabetik sıralı personeller
  const sortedEmployees = [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialEmployeeId || (sortedEmployees.length > 0 ? sortedEmployees[0].id : "")
  );

  // Current active employee
  const currentEmployee = employees.find((e) => e.id === selectedEmployeeId) || sortedEmployees[0];

  // Helper date
  const todayStr = new Date().toISOString().split("T")[0];
  const formatTRDate = (dStr?: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  const formatTRY = (val: number | null | undefined): string => {
    const num = typeof val === "number" && !isNaN(val) ? val : Number(val || 0);
    return num.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺";
  };

  // Convert numbers to Turkish words (e.g. 15000 -> On Beş Bin Türk Lirası)
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

  const addDays = (dStr: string, days: number): string => {
    if (!dStr) return todayStr;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    d.setDate(d.getDate() + Math.max(0, days - 1));
    return d.toISOString().split("T")[0];
  };

  // Company default strings
  const defaultCompanyName = companySettings?.companyName || companySettings?.name || "ŞİRKET ÜNVANI";
  const defaultTaxNo = companySettings?.taxNumber || companySettings?.vknTckn || "1234567890";
  const defaultAddress = (typeof companySettings?.address === "string" ? companySettings.address : companySettings?.addressDetails?.fullAddress) || 
    (companySettings?.city ? `${companySettings.district || ""} / ${companySettings.city}` : "Şirket Merkez Adresi");
  const defaultSgkNo = companySettings?.sgkCredentials?.workplaceRegistrationNo || "2 1234 01 01 1234567 034 12-34 000";

  // Form State Data
  const [formData, setFormData] = useState({
    // Form Meta
    docDate: todayStr,
    leaveYear: new Date().getFullYear().toString(),

    // Employer Info
    employerName: defaultCompanyName,
    employerTaxNo: defaultTaxNo,
    employerAddress: defaultAddress,
    employerSgkNo: defaultSgkNo,

    // Employee Info
    empFullName: "",
    empTckn: "",
    empStartDate: "",
    empTitle: "",
    empDepartment: "",
    empAddress: "",
    empPhone: "",
    empGender: "Erkek",

    // Leave Info
    leaveDaysCount: 5,
    leaveStartDate: todayStr,
    leaveEndDate: addDays(todayStr, 5),
    workResumeDate: addDays(todayStr, 6),
    leaveAddress: "",
    roadLeaveDays: 0, // Yol İzni (gün)
    leaveAdvanceAmount: 0, // Avans (TL)
    leaveReason: "",

    // Tutanak Özel Alanları
    absenceDate: todayStr,
    witness1Name: "Ahmet Yılmaz",
    witness1Tckn: "10293847562",
    witness1Title: "Şube Müdürü",
    witness2Name: "Burak Kaya",
    witness2Tckn: "39482019283",
    witness2Title: "İnsan Kaynakları Uzmanı",
    witness3Name: "Selin Aksoy",
    witness3Tckn: "28471920384",
    witness3Title: "Muhasebe Uzmanı",

    // Yıllık İzin Tablosu Hesap Detayları
    calcWeekendDays: 1,
    calcHolidayDays: 0,
    calcExcuseDays: 0,
    calcUnpaidRoadDays: 0,
    calcUnpaidLeaveDays: 0,
    calcTotalLeaveDays: 5,
    calcWageAdvance: "0,00 ₺",
    approvedByManagerName: companySettings?.eDevletCredentials?.managerName || "Genel Müdür / İK Yöneticisi",

    // AVANS TALEP FORMU ALANLARI
    advanceSubject: "Maaş Avansı Talebi",
    advanceDepartment: "",
    advanceReason: "Acil nakit ihtiyacı ve kişisel harcamalar sebebiyle avans talebi",
    advanceRequestedAmount: 10000,
    advanceInstallmentCount: "1 Taksit (Müteakip İlk Maaştan Tek Seferde)",
    advanceIban: "",
    advanceApproverName: companySettings?.eDevletCredentials?.managerName || "Genel Müdür / Şirket Yetkilisi",
    advanceApproverTitle: "Genel Müdür / İK Yöneticisi",

    // MASRAF TALEP FORMU ALANLARI
    expenseDepartment: "",
    expensePeriod: `${new Date().toLocaleString("tr-TR", { month: "long" })} ${new Date().getFullYear()}`,
    expenseSubject: "İş & Saha Seyahat Masrafları Bildirimi",
    expenseApproverName: companySettings?.eDevletCredentials?.managerName || "Birim Yöneticisi / Onaylayan",
    expenseApproverTitle: "Departman / Saha Müdürü",
    expenseAccountantName: "Muhasebe & Finans Yetkilisi",
  });

  // MASRAF FORMU KALEMLERİ VE ALINAN MASRAF AVANSI STATE
  const initialExpenseItems: ExpenseItemRow[] = [
    { id: "1", date: todayStr, description: "Şehirlerarası Görev Ulaşım Bedeli", receiptNo: "PNR-89214", amount: 950 },
    { id: "2", date: todayStr, description: "Otel / Konaklama Bedeli", receiptNo: "FTR-2026-084", amount: 2800 },
    { id: "3", date: todayStr, description: "Müşteri Ziyareti Şehir İçi Ulaşım / Taksi", receiptNo: "FİŞ-0482", amount: 350 },
    { id: "4", date: todayStr, description: "Görev & Saha Yemek Masrafı", receiptNo: "FİŞ-7719", amount: 480 },
    { id: "5", date: todayStr, description: "", receiptNo: "", amount: 0 },
    { id: "6", date: todayStr, description: "", receiptNo: "", amount: 0 },
    { id: "7", date: todayStr, description: "", receiptNo: "", amount: 0 },
    { id: "8", date: todayStr, description: "", receiptNo: "", amount: 0 },
  ];

  const [expenseItems, setExpenseItems] = useState<ExpenseItemRow[]>(initialExpenseItems);
  const [expenseAdvanceAmount, setExpenseAdvanceAmount] = useState<number>(0);
  const [expenseAdvanceNote, setExpenseAdvanceNote] = useState<string>("");

  // Personelin mevcut avansları listesi
  const currentEmployeeAdvances = (advanceRequests || []).filter(
    (a) => a.employeeId === (currentEmployee?.id || selectedEmployeeId)
  );

  // Sync state when employee, advance request or leave request changes
  useEffect(() => {
    if (currentEmployee) {
      const isInitialMaleBirth = activeLeaveReq?.type?.toLowerCase().includes("babalık") || 
        activeLeaveReq?.type?.toLowerCase().includes("erkek doğum") ||
        activeLeaveReq?.type?.toLowerCase().includes("babalik") ||
        activeLeaveReq?.type?.toLowerCase().includes("dogum") ||
        activeLeaveReq?.type?.toLowerCase().includes("doğum");

      let defaultDays = 5;
      let defaultReason = "Yıllık Ücretli İzin Kullanımı";
      let formTypeToSet = selectedFormType;

      if (activeAdvReq) {
        if (activeAdvReq.type === "Masraf Avansı" || activeAdvReq.type === "Masraf") {
          formTypeToSet = "expense_request";
          setSelectedFormType("expense_request");
          setExpenseAdvanceAmount(activeAdvReq.amount || 0);
          setExpenseAdvanceNote(`${formatTRDate(activeAdvReq.requestDate)} Tarihli Masraf Avansı (${formatTRY(activeAdvReq.amount)})`);
        } else {
          formTypeToSet = "advance_request";
          setSelectedFormType("advance_request");
        }
      } else if (activeLeaveReq) {
        defaultDays = activeLeaveReq.daysCount || 5;
        defaultReason = activeLeaveReq.reason || "";
        if (activeLeaveReq.type.includes("Ücretsiz") || activeLeaveReq.type.includes("Mazeretsiz") || activeLeaveReq.type.toLowerCase().includes("ucretsiz")) {
          formTypeToSet = "unpaid_leave";
        } else if (isInitialMaleBirth) {
          formTypeToSet = "paternity_leave";
        } else {
          formTypeToSet = "annual_leave";
        }
        setSelectedFormType(formTypeToSet);
      } else if (selectedFormType === "paternity_leave") {
        defaultDays = 5;
        defaultReason = "4857 Sayılı İş Kanunu Ek Md. 2 Uyarınca Eşi Doğum Yapan Erkek Personel Babalık İzni";
      } else if (selectedFormType === "unpaid_leave") {
        defaultDays = 3;
        defaultReason = "Mazeret ve Özel İşler Sebebiyle Ücretsiz İzin Talebi";
      }

      // Check if employee has any recorded Masraf Avansı and auto-fill if advance amount is 0
      const empMasrafAdvances = currentEmployeeAdvances.filter(
        (a) => a.type === "Masraf Avansı" || a.type === "Masraf" || a.type === "Avans"
      );
      if (empMasrafAdvances.length > 0 && !activeAdvReq && expenseAdvanceAmount === 0) {
        setExpenseAdvanceAmount(empMasrafAdvances[0].amount || 0);
        setExpenseAdvanceNote(`${formatTRDate(empMasrafAdvances[0].requestDate)} Tarihli ${empMasrafAdvances[0].type} (${formatTRY(empMasrafAdvances[0].amount)})`);
      }

      const sDate = activeLeaveReq?.startDate || todayStr;
      const eDate = activeLeaveReq?.endDate || addDays(sDate, defaultDays);
      const rDate = addDays(sDate, defaultDays + 1);

      const calculatedAdvAmount = activeAdvReq?.amount 
        ? activeAdvReq.amount 
        : currentEmployee.salaryAmount 
        ? Math.round(currentEmployee.salaryAmount * 0.5) 
        : 10000;

      const advSubject = activeAdvReq?.type === "Masraf" || activeAdvReq?.type === "Masraf Avansı"
        ? "Saha Masraf Avansı Talebi" 
        : activeAdvReq?.type === "Prim"
        ? "Prim / Teşvik Avansı Talebi"
        : "Maaş Avansı Talebi";

      const advReason = activeAdvReq?.description || "Acil nakit ihtiyacı ve kişisel harcamalar sebebiyle avans talebi";
      const empIban = currentEmployee.iban || "TR00 0000 0000 0000 0000 0000 00";

      setFormData((prev) => ({
        ...prev,
        empFullName: currentEmployee.fullName,
        empTckn: currentEmployee.tckn,
        empStartDate: currentEmployee.startDate,
        empTitle: currentEmployee.title,
        empDepartment: currentEmployee.department,
        empAddress: currentEmployee.homeAddress || "İstanbul / Türkiye",
        empPhone: currentEmployee.phone || "0532 000 00 00",
        empGender: currentEmployee.gender || "Erkek",
        leaveDaysCount: defaultDays,
        leaveStartDate: sDate,
        leaveEndDate: eDate,
        workResumeDate: rDate,
        leaveAddress: currentEmployee.homeAddress || "Memleket / İkametgah Adresi",
        leaveReason: defaultReason,
        calcTotalLeaveDays: defaultDays,
        advanceSubject: prev.advanceSubject && prev.advanceSubject !== "Maaş Avansı Talebi" ? prev.advanceSubject : advSubject,
        advanceDepartment: currentEmployee.department || prev.advanceDepartment || "Genel Müdürlük",
        advanceReason: prev.advanceReason && prev.advanceReason !== "Acil nakit ihtiyacı ve kişisel harcamalar sebebiyle avans talebi" ? prev.advanceReason : advReason,
        advanceRequestedAmount: activeAdvReq?.amount || calculatedAdvAmount,
        advanceIban: empIban,
        expenseDepartment: currentEmployee.department || prev.expenseDepartment || "Saha / Satış / Operasyon",
      }));
    }
  }, [selectedEmployeeId, currentEmployee, initialLeaveRequest, initialAdvanceRequest, activeAdvReq]);

  // Update dates when start date or days change
  const handleStartDateChange = (newStart: string) => {
    const end = addDays(newStart, formData.leaveDaysCount);
    const resume = addDays(newStart, formData.leaveDaysCount + 1);
    setFormData((prev) => ({
      ...prev,
      leaveStartDate: newStart,
      leaveEndDate: end,
      workResumeDate: resume,
    }));
  };

  const handleDaysCountChange = (days: number) => {
    const count = Math.max(1, days);
    const end = addDays(formData.leaveStartDate, count);
    const resume = addDays(formData.leaveStartDate, count + 1);
    setFormData((prev) => ({
      ...prev,
      leaveDaysCount: count,
      leaveEndDate: end,
      workResumeDate: resume,
      calcTotalLeaveDays: count,
    }));
  };

  // Expense calculations
  const totalExpenses = expenseItems.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  const netExpenseBalance = totalExpenses - (Number(expenseAdvanceAmount) || 0);

  const handleAddExpenseRow = () => {
    if (expenseItems.length >= 30) return;
    setExpenseItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        date: todayStr,
        description: "",
        receiptNo: "",
        amount: 0,
      },
    ]);
  };

  const handleUpdateExpenseRow = (id: string, field: keyof ExpenseItemRow, val: any) => {
    setExpenseItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleDeleteExpenseRow = (id: string) => {
    if (expenseItems.length <= 1) {
      setExpenseItems([{ id: "1", date: todayStr, description: "", receiptNo: "", amount: 0 }]);
      return;
    }
    setExpenseItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLoadSampleExpenses = () => {
    setExpenseItems([
      { id: "1", date: todayStr, description: "Şehirlerarası Otobüs / Uçak Ulaşım Bedeli", receiptNo: "PNR-10842", amount: 1450 },
      { id: "2", date: todayStr, description: "Otel / Konaklama Faturası (2 Gece)", receiptNo: "FTR-2026-904", amount: 3200 },
      { id: "3", date: todayStr, description: "Saha Müşteri Ziyareti Taksi / Ulaşım", receiptNo: "FİŞ-0192", amount: 380 },
      { id: "4", date: todayStr, description: "Müşteri Görüşmesi & Saha Yemek Fişi", receiptNo: "FİŞ-8491", amount: 620 },
      { id: "5", date: todayStr, description: "Saha Operasyon Malzeme Temini", receiptNo: "FTR-2026-112", amount: 750 },
      { id: "6", date: todayStr, description: "", receiptNo: "", amount: 0 },
      { id: "7", date: todayStr, description: "", receiptNo: "", amount: 0 },
      { id: "8", date: todayStr, description: "", receiptNo: "", amount: 0 },
    ]);
  };

  const handleClearExpenseRows = () => {
    setExpenseItems([
      { id: "1", date: todayStr, description: "", receiptNo: "", amount: 0 },
      { id: "2", date: todayStr, description: "", receiptNo: "", amount: 0 },
      { id: "3", date: todayStr, description: "", receiptNo: "", amount: 0 },
      { id: "4", date: todayStr, description: "", receiptNo: "", amount: 0 },
      { id: "5", date: todayStr, description: "", receiptNo: "", amount: 0 },
    ]);
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const sanitizedName = (formData.empFullName || "Personel").trim().replace(/\s+/g, "_");
      const formNameMap: Record<string, string> = {
        annual_leave: "Yillik_Ucretli_Izin_Formu",
        unpaid_leave: "Ucretsiz_Izin_Talep_Formu",
        absence_report: "Devamsizlik_Tutanagi",
        paternity_leave: "Babalik_Izni_Formu",
        advance_request: "Avans_Talep_Formu",
        expense_request: "Masraf_Talep_Formu",
      };
      const prefix = formNameMap[selectedFormType] || "IK_Formu";
      const fileName = `${prefix}_${sanitizedName}.pdf`;
      await exportElementToPDF("hr-printable-paper", fileName);
    } catch (err) {
      console.error("İK Formu PDF İndirme Hatası:", err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <DetailPageLayout
      title="İzin, Avans & Masraf Resmi Evrak Yönetimi"
      subtitle="Seçilen personele göre anında doldurulabilir, düzenlenen harcamalar ve avanslar yazdırılabilir resmi A4 evrakları"
      breadcrumbs={[
        { label: "İnsan Kaynakları", onClick: onClose },
        { label: "Resmi Evrak & Formlar", active: true },
      ]}
      onBack={onClose}
      statusBadge={
        <span className="text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl">
          MEVZUATA UYGUN RESMİ EVRAK
        </span>
      }
      headerIcon={<FileCheck2 className="w-5 h-5 text-purple-600" />}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-purple-200" />
            <span>{isDownloadingPDF ? "PDF Hazırlanıyor..." : "PDF İndir"}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border border-slate-200 text-slate-600 hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            Geri Dön
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* MODAL BODY (SPLIT: LEFT EDITOR / RIGHT LIVE A4 PREVIEW) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          
          {/* LEFT: FORM SELECTOR & FORM INPUT CONTROLS - HIDE ON PRINT */}
          <div className="lg:col-span-5 bg-slate-50 border-r border-slate-200 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 print:hidden">
            
            {/* 1. Form Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                1. Resmi Belge / Form Türü Seçin
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {/* MASRAF TALEP FORMU BUTONU */}
                <button
                  type="button"
                  onClick={() => setSelectedFormType("expense_request")}
                  className={`col-span-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedFormType === "expense_request"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/50"
                      : "bg-emerald-50/70 text-emerald-950 border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">🧾</span>
                    <div>
                      <span className="block font-black text-sm">Masraf Talep Formu</span>
                      <span className={`text-[10px] block font-medium ${selectedFormType === "expense_request" ? "text-emerald-100" : "text-emerald-800"}`}>
                        Fiş / Fatura Tablolu & Alınan Masraf Avansı Mahsuplu
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedFormType === "expense_request" ? "bg-emerald-700 text-white" : "bg-emerald-200 text-emerald-900"
                  }`}>
                    Aktif
                  </span>
                </button>

                {/* AVANS TALEP FORMU BUTONU */}
                <button
                  type="button"
                  onClick={() => setSelectedFormType("advance_request")}
                  className={`col-span-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    selectedFormType === "advance_request"
                      ? "bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-400/50"
                      : "bg-amber-50/50 text-amber-950 border-amber-200 hover:bg-amber-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">💳</span>
                    <div>
                      <span className="block font-black text-sm">Avans Talep Formu</span>
                      <span className={`text-[10px] block font-medium ${selectedFormType === "advance_request" ? "text-amber-100" : "text-amber-800"}`}>
                        Maaş & Masraf Avansı Dilekçesi (Taksit & IBAN Onaylı)
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedFormType === "advance_request" ? "bg-amber-700/80 text-white" : "bg-amber-200 text-amber-900"
                  }`}>
                    Avans
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormType("annual_leave")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-start gap-2 ${
                    selectedFormType === "annual_leave"
                      ? "bg-purple-700 text-white border-purple-800 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50/50"
                  }`}
                >
                  <span className="text-base leading-none">🏖️</span>
                  <div>
                    <span className="block font-black">Yıllık Ücretli İzin</span>
                    <span className={`text-[10px] block font-medium ${selectedFormType === "annual_leave" ? "text-purple-200" : "text-slate-500"}`}>
                      4857 S.K. Md. 53 Talep Formu
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormType("paternity_leave")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-start gap-2 ${
                    selectedFormType === "paternity_leave"
                      ? "bg-sky-700 text-white border-sky-800 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-sky-50/50"
                  }`}
                >
                  <span className="text-base leading-none">🍼</span>
                  <div>
                    <span className="block font-black">Babalık / Doğum İzni</span>
                    <span className={`text-[10px] block font-medium ${selectedFormType === "paternity_leave" ? "text-sky-200" : "text-slate-500"}`}>
                      Ek Md. 2 (5 Gün Ücretli)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormType("unpaid_leave")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-start gap-2 ${
                    selectedFormType === "unpaid_leave"
                      ? "bg-purple-700 text-white border-purple-800 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-purple-50/50"
                  }`}
                >
                  <span className="text-base leading-none">⏳</span>
                  <div>
                    <span className="block font-black">Ücretsiz İzin Formu</span>
                    <span className={`text-[10px] block font-medium ${selectedFormType === "unpaid_leave" ? "text-purple-200" : "text-slate-500"}`}>
                      Mazeret & Ücretsiz İzin Talep
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormType("absence_report")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-start gap-2 ${
                    selectedFormType === "absence_report"
                      ? "bg-rose-700 text-white border-rose-800 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50/50"
                  }`}
                >
                  <span className="text-base leading-none">⚠️</span>
                  <div>
                    <span className="block font-black">Tutanaktır (Devamsızlık)</span>
                    <span className={`text-[10px] block font-medium ${selectedFormType === "absence_report" ? "text-rose-200" : "text-slate-500"}`}>
                      Mazeretsiz İşe Gelmeme Tutanağı
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Employee Selector */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800">
                  2. Çalışan Personel Seçimi
                </label>
                {currentEmployee?.gender && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    currentEmployee.gender === "Kadın"
                      ? "bg-pink-50 text-pink-700 border-pink-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {currentEmployee.gender === "Kadın" ? "Kadın ♀" : "Erkek ♂"}
                  </span>
                )}
              </div>

              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 cursor-pointer focus:ring-2 focus:ring-purple-500"
              >
                {sortedEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.gender === "Kadın" ? "Kadın ♀" : "Erkek ♂"} · {emp.department} - {emp.title})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">T.C. Kimlik No</span>
                  <strong className="font-semibold text-slate-800">{formData.empTckn || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">İşe Giriş Tarihi</span>
                  <strong className="font-semibold text-slate-800">{formatTRDate(formData.empStartDate) || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Departman</span>
                  <strong className="font-semibold text-slate-800">{formData.empDepartment || "-"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Görevi / Unvan</span>
                  <strong className="font-semibold text-slate-800">{formData.empTitle || "-"}</strong>
                </div>
              </div>
            </div>

            {/* 3. Form Specific Inputs */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <label className="block text-xs font-black text-slate-800">
                3. Belge Alanlarını Canlı Düzenleyin
              </label>

              {/* MASRAF TALEP FORMU ÖZEL GİRİŞ ALANLARI */}
              {selectedFormType === "expense_request" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Form Tarihi</label>
                      <input
                        type="date"
                        value={formData.docDate}
                        onChange={(e) => setFormData({ ...formData, docDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Masraf Dönemi</label>
                      <input
                        type="text"
                        value={formData.expensePeriod}
                        onChange={(e) => setFormData({ ...formData, expensePeriod: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        placeholder="Örn: Ağustos 2026"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Departman / Birim</label>
                      <input
                        type="text"
                        value={formData.expenseDepartment}
                        onChange={(e) => setFormData({ ...formData, expenseDepartment: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        placeholder="Saha / Satış / Operasyon"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Masraf Konusu / Bildirim</label>
                      <input
                        type="text"
                        value={formData.expenseSubject}
                        onChange={(e) => setFormData({ ...formData, expenseSubject: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        placeholder="İş & Seyahat Masrafları"
                      />
                    </div>
                  </div>

                  {/* ALINAN MASRAF AVANSI SEÇİM & GİRİŞ BÖLÜMÜ */}
                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-amber-700" />
                        <label className="text-[11px] font-black text-amber-950">
                          Personelin Aldığı Masraf Avansı
                        </label>
                      </div>
                      {expenseAdvanceAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpenseAdvanceAmount(0);
                            setExpenseAdvanceNote("");
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer underline"
                        >
                          Avansı Sıfırla
                        </button>
                      )}
                    </div>

                    {/* Personelin Sistemdeki Kayıtlı Avansları */}
                    {currentEmployeeAdvances.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 block mb-1">
                          Sistemdeki Kayıtlı Avanslardan Seç:
                        </span>
                        <select
                          onChange={(e) => {
                            const found = currentEmployeeAdvances.find((a) => a.id === e.target.value);
                            if (found) {
                              setExpenseAdvanceAmount(found.amount || 0);
                              setExpenseAdvanceNote(`${formatTRDate(found.requestDate)} Tarihli ${found.type} (${formatTRY(found.amount)}) - ${found.description || ""}`);
                            }
                          }}
                          className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs font-bold text-amber-950 cursor-pointer mb-2"
                        >
                          <option value="">-- Kayıtlı Avans Seçin ({currentEmployeeAdvances.length} adet bulundu) --</option>
                          {currentEmployeeAdvances.map((adv) => (
                            <option key={adv.id} value={adv.id}>
                              {formatTRDate(adv.requestDate)} • {adv.type} • {formatTRY(adv.amount)} ({adv.description || "Açıklamasız"})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Alınan Avans Tutarı (₺)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={expenseAdvanceAmount}
                            onChange={(e) => setExpenseAdvanceAmount(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-white border border-amber-300 rounded-lg py-1.5 px-2 text-xs font-black text-amber-950 focus:ring-2 focus:ring-amber-500"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1.5 text-[11px] font-bold text-amber-700">TL</span>
                        </div>
                      </div>
                      <div className="col-span-6">
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Hızlı Avans Seç:</label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setExpenseAdvanceAmount(2000)}
                            className="flex-1 bg-white hover:bg-amber-100 text-[10px] font-bold text-amber-950 border border-amber-200 py-1 rounded cursor-pointer"
                          >
                            2.000₺
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseAdvanceAmount(5000)}
                            className="flex-1 bg-white hover:bg-amber-100 text-[10px] font-bold text-amber-950 border border-amber-200 py-1 rounded cursor-pointer"
                          >
                            5.000₺
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseAdvanceAmount(10000)}
                            className="flex-1 bg-white hover:bg-amber-100 text-[10px] font-bold text-amber-950 border border-amber-200 py-1 rounded cursor-pointer"
                          >
                            10.000₺
                          </button>
                        </div>
                      </div>
                    </div>

                    {expenseAdvanceNote && (
                      <div className="text-[10px] text-amber-800 font-medium bg-amber-100/60 p-1.5 rounded">
                        ℹ️ {expenseAdvanceNote}
                      </div>
                    )}
                  </div>

                  {/* MASRAF KALEMLERİ TABLOSU GİRİŞİ */}
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-emerald-700" />
                        <label className="text-[11px] font-black text-slate-800">
                          Masraf Kalemleri ({expenseItems.length} Kalem)
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleLoadSampleExpenses}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                          title="Örnek Harcamaları Doldur"
                        >
                          Örnekleri Yükle
                        </button>
                        <button
                          type="button"
                          onClick={handleClearExpenseRows}
                          className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                          title="Tabloyu Boşalt"
                        >
                          Temizle
                        </button>
                        <button
                          type="button"
                          onClick={handleAddExpenseRow}
                          className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-0.5 rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Satır Ekle</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {expenseItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-1.5 items-center text-xs"
                        >
                          <div className="col-span-1 text-center font-bold text-slate-500 text-[10px]">
                            {idx + 1}
                          </div>
                          <div className="col-span-3">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => handleUpdateExpenseRow(item.id, "date", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-medium text-slate-800"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateExpenseRow(item.id, "description", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-medium text-slate-800"
                              placeholder="Masraf açıklaması..."
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={item.receiptNo}
                              onChange={(e) => handleUpdateExpenseRow(item.id, "receiptNo", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[10px] font-mono text-slate-800"
                              placeholder="Fiş/Ftr No"
                            />
                          </div>
                          <div className="col-span-2 relative">
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={item.amount || ""}
                              onChange={(e) => handleUpdateExpenseRow(item.id, "amount", Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-black text-slate-900 text-right pr-4"
                              placeholder="0"
                            />
                            <span className="absolute right-1 top-1 text-[10px] text-slate-400 font-bold">₺</span>
                          </div>
                          <div className="col-span-12 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteExpenseRow(item.id)}
                              className="text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Satırı Sil</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ÖZET VE MAHSUP KARTLARI */}
                    <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-300 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-bold text-[11px]">Toplam Harcanan Masraf:</span>
                        <span className="font-black text-slate-950 text-sm">{formatTRY(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-900">
                        <span className="font-bold text-[11px]">Personelin Aldığı Masraf Avansı:</span>
                        <span className="font-bold">{formatTRY(expenseAdvanceAmount)}</span>
                      </div>
                      <div className="border-t border-slate-300 pt-1.5 flex justify-between items-center">
                        <span className="font-black text-[11px] uppercase">
                          {netExpenseBalance >= 0 ? "Personele Ödenecek Net Tutar:" : "Şirkete İade Edilecek Avans:"}
                        </span>
                        <span className={`font-black text-sm px-2 py-0.5 rounded ${
                          netExpenseBalance >= 0 ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                        }`}>
                          {formatTRY(Math.abs(netExpenseBalance))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* YETKİLİ VE MUHASEBE GİRİŞ ALANLARI */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Onaylayan Yönetici</label>
                      <input
                        type="text"
                        value={formData.expenseApproverName}
                        onChange={(e) => setFormData({ ...formData, expenseApproverName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Muhasebe & Finans Yetkilisi</label>
                      <input
                        type="text"
                        value={formData.expenseAccountantName}
                        onChange={(e) => setFormData({ ...formData, expenseAccountantName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : selectedFormType === "advance_request" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Form Tarihi</label>
                      <input
                        type="date"
                        value={formData.docDate}
                        onChange={(e) => setFormData({ ...formData, docDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Konu</label>
                      <input
                        type="text"
                        value={formData.advanceSubject}
                        onChange={(e) => setFormData({ ...formData, advanceSubject: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        placeholder="Maaş Avansı Talebi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İlgili Birim</label>
                      <input
                        type="text"
                        value={formData.advanceDepartment}
                        onChange={(e) => setFormData({ ...formData, advanceDepartment: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        placeholder="Departman / Birim"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Taksit Kesinti Sayısı</label>
                      <select
                        value={formData.advanceInstallmentCount}
                        onChange={(e) => setFormData({ ...formData, advanceInstallmentCount: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <option value="1 Taksit (Müteakip İlk Maaştan Tek Seferde)">1 Taksit (İlk Maaştan Tek Seferde)</option>
                        <option value="2 Taksit (2 Eşit Maaş Kesintisi)">2 Taksit (2 Eşit Kesinti)</option>
                        <option value="3 Taksit (3 Eşit Maaş Kesintisi)">3 Taksit (3 Eşit Kesinti)</option>
                        <option value="4 Taksit (4 Eşit Maaş Kesintisi)">4 Taksit (4 Eşit Kesinti)</option>
                        <option value="5 Taksit (5 Eşit Maaş Kesintisi)">5 Taksit (5 Eşit Kesinti)</option>
                        <option value="6 Taksit (6 Eşit Maaş Kesintisi)">6 Taksit (6 Eşit Kesinti)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black text-amber-950">
                        Talep Edilen Tutar (₺)
                      </label>
                      <span className="text-[10px] font-bold text-amber-700">
                        {numberToTurkishWords(formData.advanceRequestedAmount)}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="100"
                        value={formData.advanceRequestedAmount}
                        onChange={(e) => setFormData({ ...formData, advanceRequestedAmount: Number(e.target.value) })}
                        className="w-full bg-white border border-amber-300 rounded-lg py-1.5 px-3 text-sm font-black text-amber-950 focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-1.5 text-xs font-bold text-amber-600">TL</span>
                    </div>

                    {/* Hızlı Tutar Seçenekleri */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {currentEmployee?.salaryAmount ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, advanceRequestedAmount: Math.round(currentEmployee.salaryAmount * 0.25) })}
                            className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-400 px-2 py-0.5 rounded cursor-pointer"
                          >
                            %25 Maaş ({formatTRY(currentEmployee.salaryAmount * 0.25)})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, advanceRequestedAmount: Math.round(currentEmployee.salaryAmount * 0.50) })}
                            className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 px-2 py-0.5 rounded cursor-pointer"
                          >
                            %50 Maaş ({formatTRY(currentEmployee.salaryAmount * 0.50)})
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceRequestedAmount: 5000 })}
                        className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-400 px-2 py-0.5 rounded cursor-pointer"
                      >
                        5.000 ₺
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceRequestedAmount: 10000 })}
                        className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-400 px-2 py-0.5 rounded cursor-pointer"
                      >
                        10.000 ₺
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceRequestedAmount: 20000 })}
                        className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-400 px-2 py-0.5 rounded cursor-pointer"
                      >
                        20.000 ₺
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Avans Nedeni / Açıklaması</label>
                    <input
                      type="text"
                      value={formData.advanceReason}
                      onChange={(e) => setFormData({ ...formData, advanceReason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      placeholder="Acil nakit ihtiyacı, sağlık vb."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Aktarılacak IBAN</label>
                    <input
                      type="text"
                      value={formData.advanceIban}
                      onChange={(e) => setFormData({ ...formData, advanceIban: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900"
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Onay Veren Yetkili</label>
                      <input
                        type="text"
                        value={formData.advanceApproverName}
                        onChange={(e) => setFormData({ ...formData, advanceApproverName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Yetkili Görevi / Unvanı</label>
                      <input
                        type="text"
                        value={formData.advanceApproverTitle}
                        onChange={(e) => setFormData({ ...formData, advanceApproverTitle: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Genel Tarih ve Gün */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        {selectedFormType === "absence_report" ? "Tutanak Tarihi" : "Form Düzenleme Tarihi"}
                      </label>
                      <input
                        type="date"
                        value={formData.docDate}
                        onChange={(e) => setFormData({ ...formData, docDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    {selectedFormType === "annual_leave" && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İzin Yılı</label>
                        <input
                          type="text"
                          value={formData.leaveYear}
                          onChange={(e) => setFormData({ ...formData, leaveYear: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>
                    )}

                    {selectedFormType === "absence_report" && (
                      <div>
                        <label className="block text-[10px] font-bold text-rose-700 mb-0.5">Mazeretsiz Gelmediği Gün</label>
                        <input
                          type="date"
                          value={formData.absenceDate}
                          onChange={(e) => setFormData({ ...formData, absenceDate: e.target.value })}
                          className="w-full bg-rose-50 border border-rose-200 rounded-lg p-1.5 text-xs font-bold text-rose-900"
                        />
                      </div>
                    )}
                  </div>

                  {/* İzin Tarih Aralığı (Tutanak Hariç) */}
                  {selectedFormType !== "absence_report" && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Başlangıç Tarihi</label>
                          <input
                            type="date"
                            value={formData.leaveStartDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Bitiş Tarihi</label>
                          <input
                            type="date"
                            value={formData.leaveEndDate}
                            onChange={(e) => setFormData({ ...formData, leaveEndDate: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İzin Süresi (Gün)</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.leaveDaysCount}
                            onChange={(e) => handleDaysCountChange(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-black text-purple-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İşe Başlama Tarihi</label>
                          <input
                            type="date"
                            value={formData.workResumeDate}
                            onChange={(e) => setFormData({ ...formData, workResumeDate: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İzin Avansı (TL)</label>
                          <input
                            type="number"
                            value={formData.leaveAdvanceAmount}
                            onChange={(e) => setFormData({ ...formData, leaveAdvanceAmount: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                            placeholder="0 ₺"
                          />
                        </div>
                      </div>

                      {selectedFormType === "annual_leave" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ücretsiz Yol İzni (Gün)</label>
                            <input
                              type="number"
                              value={formData.roadLeaveDays}
                              onChange={(e) => setFormData({ ...formData, roadLeaveDays: Number(e.target.value) })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
                              placeholder="0 Gün"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İznini Geçireceği Adres</label>
                            <input
                              type="text"
                              value={formData.leaveAddress}
                              onChange={(e) => setFormData({ ...formData, leaveAddress: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">İzin Talep Nedeni / Açıklama</label>
                        <input
                          type="text"
                          value={formData.leaveReason}
                          onChange={(e) => setFormData({ ...formData, leaveReason: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tutanak Şahitleri Girişi */}
              {selectedFormType === "absence_report" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-black text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span>Tutanak Şahitleri (3 Şahit)</span>
                  </label>

                  <div className="space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-purple-900 block">1. ŞAHİT:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="Adı Soyadı"
                        value={formData.witness1Name}
                        onChange={(e) => setFormData({ ...formData, witness1Name: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="TC Kimlik No"
                        value={formData.witness1Tckn}
                        onChange={(e) => setFormData({ ...formData, witness1Tckn: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Görevi"
                        value={formData.witness1Title}
                        onChange={(e) => setFormData({ ...formData, witness1Title: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-purple-900 block">2. ŞAHİT:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="Adı Soyadı"
                        value={formData.witness2Name}
                        onChange={(e) => setFormData({ ...formData, witness2Name: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="TC Kimlik No"
                        value={formData.witness2Tckn}
                        onChange={(e) => setFormData({ ...formData, witness2Tckn: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Görevi"
                        value={formData.witness2Title}
                        onChange={(e) => setFormData({ ...formData, witness2Title: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-purple-900 block">3. ŞAHİT:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <input
                        type="text"
                        placeholder="Adı Soyadı"
                        value={formData.witness3Name}
                        onChange={(e) => setFormData({ ...formData, witness3Name: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="TC Kimlik No"
                        value={formData.witness3Tckn}
                        onChange={(e) => setFormData({ ...formData, witness3Tckn: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Görevi"
                        value={formData.witness3Title}
                        onChange={(e) => setFormData({ ...formData, witness3Title: e.target.value })}
                        className="bg-white border border-slate-200 rounded p-1 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Şirket Bilgilerini Özelleştir */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span>Şirket / İşveren Bilgileri</span>
                </label>
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                  placeholder="İşveren Ünvanı"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={formData.employerTaxNo}
                    onChange={(e) => setFormData({ ...formData, employerTaxNo: e.target.value })}
                    placeholder="Vergi Kimlik No"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={formData.employerSgkNo}
                    onChange={(e) => setFormData({ ...formData, employerSgkNo: e.target.value })}
                    placeholder="SGK İşyeri Sicil No"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE A4 DOCUMENT PREVIEW (EXACT REPLICA OF USER FORMS) */}
          <div className="lg:col-span-7 bg-slate-200/80 p-3 sm:p-6 overflow-y-auto custom-scrollbar flex justify-center items-start print:p-0 print:bg-white print:overflow-visible print:w-full print:block">
            
            {/* A4 PAPER CONTAINER */}
            <div id="hr-printable-paper" className="bg-white text-black w-full max-w-[760px] min-h-[980px] p-8 sm:p-12 shadow-xl border border-slate-300 rounded-sm font-serif leading-relaxed text-sm print:shadow-none print:border-none print:p-8 print:max-w-none print:w-full">
              
              {/* ========================================================================= */}
              {/* FORM 1: TUTANAKTIR (Mazeretsiz İşe Gelmeme / Devamsızlık Tutanağı) */}
              {/* ========================================================================= */}
              {selectedFormType === "absence_report" && (
                <div className="space-y-6 text-black">
                  {/* Başlık */}
                  <div className="text-center font-bold text-lg tracking-wider underline pb-4">
                    TUTANAKTIR
                  </div>

                  {/* İŞVERENİN */}
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold underline">İŞVERENİN :</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">ÜNVANI</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerName}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">VERGİ KİMLİK NUMARASI</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerTaxNo}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">ADRESİ</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerAddress}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">SGK İŞYERİ SİCİL NUMARASI</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerSgkNo}</div>
                    </div>
                  </div>

                  {/* İŞÇİNİN */}
                  <div className="space-y-1 text-xs sm:text-sm pt-2">
                    <div className="font-bold underline">İŞÇİNİN :</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">ADI SOYADI</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-semibold">{formData.empFullName}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">T.C. KİMLİK NUMARASI</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empTckn}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">GÖREVİ</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empTitle} ({formData.empDepartment})</div>
                    </div>
                  </div>

                  {/* Tutanak Metni */}
                  <div className="text-justify text-xs sm:text-sm leading-relaxed space-y-3 pt-3">
                    <p>
                      Yukarıda Adı Soyadı/Unvanı adresi yazılı işyerimizde çalışan <strong>{formData.empTckn}</strong> T.C. 
                      kimlik numaralı <strong>{formData.empFullName}</strong> isimli işçimiz; <strong>{formatTRDate(formData.absenceDate)}</strong> tarihinde iznimiz 
                      ve bilgimiz olmaksızın mazeretsiz olarak mesaisine gelmemiştir.
                    </p>
                    <p>
                      İş bu tutanak <strong>{formatTRDate(formData.docDate)}</strong> tarihinde aşağıda isimleri yazılı şahitler huzurunda 
                      düzenlenmiş ve müştereken imza altına alınmıştır.
                    </p>
                  </div>

                  {/* İşveren İmzası */}
                  <div className="flex justify-end pt-4 pb-2 text-right">
                    <div className="text-center min-w-[200px]">
                      <div className="font-bold">İŞVEREN / VEKİLİ</div>
                      <div className="text-xs text-slate-500 pt-1">{formData.employerName}</div>
                      <div className="h-14 flex items-end justify-center text-xs text-slate-400">
                        (İmza / Kaşe)
                      </div>
                    </div>
                  </div>

                  {/* Şahitler (3 Adet) */}
                  <div className="space-y-3 pt-2 text-xs sm:text-sm border-t border-black/20">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Şahit 1 */}
                      <div className="border border-black p-2.5 space-y-1">
                        <div className="font-bold underline text-center pb-1">ŞAHİT 1</div>
                        <div><strong>Adı Soyadı :</strong> {formData.witness1Name}</div>
                        <div><strong>T.C. No :</strong> {formData.witness1Tckn}</div>
                        <div><strong>Görevi :</strong> {formData.witness1Title}</div>
                        <div className="h-10 border-b border-dotted border-black mt-2 text-[11px] text-slate-400 flex items-end justify-center">
                          İmza
                        </div>
                      </div>

                      {/* Şahit 2 */}
                      <div className="border border-black p-2.5 space-y-1">
                        <div className="font-bold underline text-center pb-1">ŞAHİT 2</div>
                        <div><strong>Adı Soyadı :</strong> {formData.witness2Name}</div>
                        <div><strong>T.C. No :</strong> {formData.witness2Tckn}</div>
                        <div><strong>Görevi :</strong> {formData.witness2Title}</div>
                        <div className="h-10 border-b border-dotted border-black mt-2 text-[11px] text-slate-400 flex items-end justify-center">
                          İmza
                        </div>
                      </div>

                      {/* Şahit 3 */}
                      <div className="border border-black p-2.5 space-y-1">
                        <div className="font-bold underline text-center pb-1">ŞAHİT 3</div>
                        <div><strong>Adı Soyadı :</strong> {formData.witness3Name}</div>
                        <div><strong>T.C. No :</strong> {formData.witness3Tckn}</div>
                        <div><strong>Görevi :</strong> {formData.witness3Title}</div>
                        <div className="h-10 border-b border-dotted border-black mt-2 text-[11px] text-slate-400 flex items-end justify-center">
                          İmza
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* FORM 2: ÜCRETSİZ İZİN TALEP FORMU */}
              {/* ========================================================================= */}
              {selectedFormType === "unpaid_leave" && (
                <div className="space-y-5 text-black">
                  {/* Başlık */}
                  <div className="text-center font-bold text-lg tracking-wider underline pb-2">
                    ÜCRETSİZ İZİN TALEP FORMU
                  </div>

                  {/* İŞVERENİN */}
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-bold underline">İŞVERENİN</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Adı Soyadı (Unvanı)</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerName}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Adresi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerAddress}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">SGK İşyeri Sicil No</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerSgkNo}</div>
                    </div>
                  </div>

                  {/* PERSONELİN */}
                  <div className="space-y-1 text-xs sm:text-sm pt-2">
                    <div className="font-bold underline">PERSONELİN</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Adı Soyadı</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-semibold">{formData.empFullName}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">TC Kimlik No</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empTckn}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İşe Giriş Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formatTRDate(formData.empStartDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Görevi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empTitle}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Departmanı</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empDepartment}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İkâmetgâh Adresi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empAddress}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Ev ve Cep Telefonu</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empPhone}</div>
                    </div>
                  </div>

                  {/* İZNİN */}
                  <div className="space-y-1 text-xs sm:text-sm pt-2">
                    <div className="font-bold underline">İZNİN</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Süresi (Gün)</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-bold">{formData.leaveDaysCount} Gün</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Başlangıç Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formatTRDate(formData.leaveStartDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Bitiş Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formatTRDate(formData.leaveEndDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İşe Başlama Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formatTRDate(formData.workResumeDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İzin Avansı (TL)</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.leaveAdvanceAmount ? `${formData.leaveAdvanceAmount} ₺` : "—"}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İzin Talep Nedeni</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.leaveReason || "Mazeret ve Özel İşler"}</div>
                    </div>
                  </div>

                  {/* İmzalar */}
                  <div className="grid grid-cols-3 gap-6 text-center pt-10 text-xs sm:text-sm">
                    <div>
                      <div className="font-bold">Personel</div>
                      <div className="text-xs pt-1">{formData.empFullName}</div>
                      <div className="h-16 flex items-end justify-center text-xs text-slate-400">
                        İmza
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">Düzenleyen</div>
                      <div className="text-xs pt-1">İnsan Kaynakları</div>
                      <div className="h-16 flex items-end justify-center text-xs text-slate-400">
                        İmza
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">Onay Veren</div>
                      <div className="text-xs pt-1">{formData.approvedByManagerName}</div>
                      <div className="h-16 flex items-end justify-center text-xs text-slate-400">
                        İmza
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* FORM 3: YILLIK ÜCRETLİ İZİN TALEP FORMU */}
              {/* ========================================================================= */}
              {selectedFormType === "annual_leave" && (
                <div className="space-y-4 text-black">
                  {/* Başlık */}
                  <div className="text-center font-bold text-base sm:text-lg tracking-wider underline pb-1">
                    YILLIK ÜCRETLİ İZİN TALEP FORMU
                  </div>

                  {/* Üst Bilgiler */}
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Tarih</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formatTRDate(formData.docDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Adı Soyadı</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-bold">{formData.empFullName}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">TC Kimlik No</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formData.empTckn}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İşe Giriş Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formatTRDate(formData.empStartDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Çalıştığı Bölüm</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formData.empDepartment} ({formData.empTitle})</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İkâmetgâh Adresi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formData.empAddress}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Ev ve Cep Telefonu</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formData.empPhone}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İznini geçireceği adres</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formData.leaveAddress || formData.empAddress}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İstenen ücretsiz yol izni süresi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7">{formData.roadLeaveDays > 0 ? `${formData.roadLeaveDays} Gün` : "—"}</div>
                    </div>
                  </div>

                  {/* Talep Metni */}
                  <div className="pt-2 text-justify text-xs sm:text-sm leading-relaxed space-y-2">
                    <p>
                      4857 Sayılı yasanın 53 üncü maddesine göre <strong>{formData.leaveYear}</strong> yılına ilişkin yıllık iznimi <strong>{formatTRDate(formData.leaveStartDate)}</strong> — <strong>{formatTRDate(formData.leaveEndDate)}</strong> tarihleri arasında kullanmak istiyorum.
                    </p>
                    <p>Gereğinin yapılmasını arz ederim.</p>
                  </div>

                  {/* İmza */}
                  <div className="flex justify-end pt-1 pb-2">
                    <div className="text-center min-w-[180px] text-xs sm:text-sm">
                      <div>Saygılarımla,</div>
                      <div className="font-bold pt-1">{formData.empFullName}</div>
                      <div className="h-10 flex items-end justify-center text-slate-400 text-xs">İmza</div>
                    </div>
                  </div>

                  {/* *** PERSONEL BÖLÜMÜ TARAFINDAN DOLDURULACAKTIR *** */}
                  <div className="border border-black text-xs sm:text-sm">
                    <div className="text-center font-bold bg-slate-100 border-b border-black py-1 tracking-wide">
                      *** PERSONEL BÖLÜMÜ TARAFINDAN DOLDURULACAKTIR ***
                    </div>
                    <div className="text-center font-bold bg-slate-50 border-b border-black py-0.5">
                      Yıllık Ücretli İzin Hesabı
                    </div>

                    <div className="divide-y divide-black">
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">İzine Çıkış Tarihi</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5">{formatTRDate(formData.leaveStartDate)}</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">Yıllık Ücretli İzin Süresi</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5 font-bold">{formData.leaveDaysCount} Gün</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">Hafta Tatili</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5">{formData.calcWeekendDays} Gün</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">Ulusal ve Resmi Tatil Günü</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5">{formData.calcHolidayDays} Gün</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">Mazeret İzni</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5">{formData.calcExcuseDays} Gün</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">Ücretsiz Yol İzni</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5">{formData.roadLeaveDays} Gün</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">Ücretsiz İzin</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5">{formData.calcUnpaidLeaveDays} Gün</div>
                      </div>
                      <div className="grid grid-cols-12 p-1 bg-slate-50 font-bold">
                        <div className="col-span-6">Toplam İzin Süresi</div>
                        <div className="col-span-1 text-center">:</div>
                        <div className="col-span-5">{formData.leaveDaysCount + (formData.roadLeaveDays || 0)} Gün</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">Ücret Avansı</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5">{formData.leaveAdvanceAmount ? `${formData.leaveAdvanceAmount} ₺` : "—"}</div>
                      </div>
                      <div className="grid grid-cols-12 p-1">
                        <div className="col-span-6 font-bold">İş Başı Tarihi</div>
                        <div className="col-span-1 text-center font-bold">:</div>
                        <div className="col-span-5 font-bold">{formatTRDate(formData.workResumeDate)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Onay Metni ve İmzalar */}
                  <div className="pt-3 text-justify text-xs sm:text-sm leading-relaxed">
                    <p>
                      Çalışanımızın, <strong>{formatTRDate(formData.leaveStartDate)}</strong> tarihi ile <strong>{formatTRDate(formData.leaveEndDate)}</strong> tarihleri arasında yıllık ücretli iznini kullanması uygundur.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 pb-2 text-right">
                    <div className="text-center min-w-[220px] text-xs sm:text-sm">
                      <div className="font-bold">{formData.approvedByManagerName}</div>
                      <div className="text-xs text-slate-500">İnsan Kaynakları / Şirket Müdürü</div>
                      <div className="h-12 flex items-end justify-center text-slate-400 text-xs">
                        Adı, Soyad / İmza
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* FORM 4: BABALIK / DOĞUM İZNİ TALEP FORMU (4857 S.K. Ek Md. 2) */}
              {/* ========================================================================= */}
              {selectedFormType === "paternity_leave" && (
                <div className="space-y-5 text-black">
                  {/* Başlık */}
                  <div className="text-center font-bold text-base sm:text-lg tracking-wider underline pb-1">
                    BABALIK / DOĞUM İZNİ TALEP VE BİLDİRİM FORMU
                  </div>
                  <div className="text-center text-xs font-semibold text-slate-600">
                    (4857 Sayılı İş Kanunu Ek Madde 2 Uyarınca Eşi Doğum Yapan Erkek İşçi İzni)
                  </div>

                  {/* İŞVEREN BİLGİLERİ */}
                  <div className="space-y-1 text-xs sm:text-sm pt-2">
                    <div className="font-bold underline">İŞVERENİN</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Unvanı</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerName}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">SGK İşyeri Sicil No</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.employerSgkNo}</div>
                    </div>
                  </div>

                  {/* PERSONEL BİLGİLERİ */}
                  <div className="space-y-1 text-xs sm:text-sm pt-2">
                    <div className="font-bold underline">PERSONELİN</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Adı Soyadı</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-bold">{formData.empFullName} (Erkek Personel)</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">TC Kimlik No</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empTckn}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Görevi / Bölümü</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formData.empTitle} · {formData.empDepartment}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İşe Giriş Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formatTRDate(formData.empStartDate)}</div>
                    </div>
                  </div>

                  {/* İZİN SÜRESİ VE YASAL METİN */}
                  <div className="space-y-1 text-xs sm:text-sm pt-2">
                    <div className="font-bold underline">İZİN BİLGİLERİ (PUANTAJDA: "Dİ" KODU İLE TAM ÜCRETLİ)</div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">Yasal İzin Süresi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-bold">5 Gün (Ücretli Babalık İzni)</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İzin Başlangıç Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formatTRDate(formData.leaveStartDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İzin Bitiş Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-medium">{formatTRDate(formData.leaveEndDate)}</div>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <div className="col-span-4 font-bold">İş Başı Tarihi</div>
                      <div className="col-span-1 text-center font-bold">:</div>
                      <div className="col-span-7 font-bold">{formatTRDate(formData.workResumeDate)}</div>
                    </div>
                  </div>

                  {/* Talep Beyanı */}
                  <div className="pt-2 text-justify text-xs sm:text-sm leading-relaxed space-y-2">
                    <p>
                      Eşimin doğum yapması sebebiyle 4857 Sayılı İş Kanunu Ek Madde 2 kapsamında 5 (beş) günlük ücretli <strong>Babalık İznimi (Doğum İzni)</strong> yukarıda belirtilen tarihler arasında kullanmak istiyorum. Doğum belgesi / raporu ekte sunulmuştur.
                    </p>
                    <p>Bilgilerinize arz ederim.</p>
                  </div>

                  {/* İmzalar */}
                  <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs sm:text-sm">
                    <div>
                      <div className="font-bold">Talep Eden İşçi</div>
                      <div className="text-xs pt-1">{formData.empFullName}</div>
                      <div className="h-16 flex items-end justify-center text-xs text-slate-400">
                        İmza
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">İşveren / İnsan Kaynakları Onayı</div>
                      <div className="text-xs pt-1">{formData.approvedByManagerName}</div>
                      <div className="h-16 flex items-end justify-center text-xs text-slate-400">
                        Kaşe / İmza
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 5. FORM: AVANS TALEP FORMU                                */}
              {/* ========================================================= */}
              {selectedFormType === "advance_request" && (
                <div className="space-y-6 text-slate-900 text-sm leading-normal">
                  {/* Başlık ve Şirket / Tarih */}
                  <div className="border-b-2 border-slate-800 pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                          AVANS TALEP FORMU
                        </h1>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          {formData.employerName}
                        </p>
                      </div>
                      <div className="text-right text-xs font-bold text-slate-700">
                        <div>Tarih: <span className="font-mono text-slate-900">{formatTRDate(formData.docDate)}</span></div>
                        <div className="text-[10px] text-slate-500 font-normal">Belge No: AVN-{new Date().getFullYear()}-{formData.empTckn ? formData.empTckn.slice(-4) : "001"}</div>
                      </div>
                    </div>
                  </div>

                  {/* PERSONELİN BİLGİLERİ */}
                  <div className="space-y-2">
                    <div className="text-sm font-black text-slate-900 tracking-wider">
                      PERSONELİN :
                    </div>

                    <div className="border border-slate-300 rounded-lg p-3 sm:p-4 bg-slate-50/40 space-y-2.5 text-xs sm:text-sm">
                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">ADI SOYADI</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-semibold text-slate-950 uppercase">{formData.empFullName || "-"}</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">T.C. KİMLİK NUMARASI</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-mono font-medium text-slate-950">{formData.empTckn || "-"}</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">GÖREVİ</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-medium text-slate-950">{formData.empTitle || "-"}</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">KONU</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-medium text-slate-950">{formData.advanceSubject || "Maaş Avansı Talebi"}</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">İLGİLİ BİRİM</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-medium text-slate-950">{formData.advanceDepartment || formData.empDepartment || "Genel Müdürlük"}</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">AVANS NEDENİ</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-medium text-slate-950">{formData.advanceReason || "Acil nakit ihtiyacı ve kişisel harcamalar"}</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline bg-amber-50/70 p-2 rounded border border-amber-200">
                        <div className="col-span-4 sm:col-span-3 font-black text-amber-950">TALEP EDİLEN TUTAR</div>
                        <div className="col-span-1 text-center font-black text-amber-950">:</div>
                        <div className="col-span-7 sm:col-span-8 font-black text-amber-950 text-sm">
                          {formatTRY(formData.advanceRequestedAmount)}{" "}
                          <span className="font-normal text-xs text-amber-800">
                            ({numberToTurkishWords(formData.advanceRequestedAmount)})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">AVANS TAKSİT SAYISI</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-medium text-slate-950">{formData.advanceInstallmentCount || "1 Taksit (İlk Maaştan Kesinti)"}</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 items-baseline">
                        <div className="col-span-4 sm:col-span-3 font-bold text-slate-900">AKTARILACAK İBAN</div>
                        <div className="col-span-1 text-center font-bold text-slate-700">:</div>
                        <div className="col-span-7 sm:col-span-8 font-mono font-bold text-slate-950 tracking-wider">
                          {formData.advanceIban || "TR00 0000 0000 0000 0000 0000 00"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BEYAN VE TALEP METNİ */}
                  <div className="pt-2 text-justify text-xs sm:text-sm leading-relaxed space-y-3">
                    <p className="indent-6">
                      Yukarıda vermiş olduğum bilgiler dâhilinde şirketinizde görev yapmaktayım. Talep etmiş olduğum avansın tarafıma yatırılmasını ve belirttiğim taksit sayısına göre maaşımdan kesilmesini talep etmekteyim.
                    </p>
                    <p className="indent-6">
                      Gerekli işlemlerin yapılmasını saygılarımla arz ederim.
                    </p>
                  </div>

                  {/* İMZA ALANLARI */}
                  <div className="grid grid-cols-2 gap-8 pt-10 text-xs sm:text-sm">
                    {/* TALEP EDEN */}
                    <div className="text-center space-y-1">
                      <div className="font-black tracking-wider uppercase text-slate-950">TALEP EDEN</div>
                      <div className="text-[11px] font-bold text-slate-600">AD SOYAD</div>
                      <div className="font-bold text-slate-900 pt-1 uppercase">{formData.empFullName || "-"}</div>
                      <div className="h-20 flex items-end justify-center text-xs text-slate-400 font-medium border-b border-dashed border-slate-300 mx-6 pb-1">
                        İMZA
                      </div>
                    </div>

                    {/* ONAY VEREN */}
                    <div className="text-center space-y-1">
                      <div className="font-black tracking-wider uppercase text-slate-950">ONAY VEREN</div>
                      <div className="text-[11px] font-bold text-slate-600">AD SOYAD</div>
                      <div className="font-bold text-slate-900 pt-1 uppercase">{formData.advanceApproverName || "Genel Müdür / Yetkili"}</div>
                      <div className="text-[11px] font-bold text-slate-600 pt-1">GÖREVİ</div>
                      <div className="text-xs font-semibold text-slate-800">{formData.advanceApproverTitle || "Genel Müdür / İK Yöneticisi"}</div>
                      <div className="h-16 flex items-end justify-center text-xs text-slate-400 font-medium border-b border-dashed border-slate-300 mx-6 pb-1">
                        İMZA
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 6. FORM: MASRAF TALEP FORMU                               */}
              {/* ========================================================= */}
              {selectedFormType === "expense_request" && (
                <div className="space-y-4 text-slate-900 text-xs leading-normal">
                  {/* Başlık ve Şirket / Tarih */}
                  <div className="border-b-2 border-slate-800 pb-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase">
                          MASRAF TALEP FORMU
                        </h1>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {formData.employerName}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-700">
                        <div><strong className="text-slate-900">Form Tarihi:</strong> <span className="font-mono">{formatTRDate(formData.docDate)}</span></div>
                        <div><strong className="text-slate-900">Dönem:</strong> <span>{formData.expensePeriod}</span></div>
                        <div className="text-[10px] text-slate-500 font-mono">Belge No: MSR-{new Date().getFullYear()}-{formData.empTckn ? formData.empTckn.slice(-4) : "001"}</div>
                      </div>
                    </div>
                  </div>

                  {/* PERSONELİN BİLGİLERİ */}
                  <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">ADI SOYADI</span>
                        <strong className="font-black text-slate-950 uppercase">{formData.empFullName || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">T.C. KİMLİK NO</span>
                        <span className="font-mono font-bold text-slate-900">{formData.empTckn || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">DEPARTMAN / BİRİM</span>
                        <span className="font-medium text-slate-900">{formData.expenseDepartment || formData.empDepartment || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">GÖREVİ / UNVAN</span>
                        <span className="font-medium text-slate-900">{formData.empTitle || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* MASRAF KALEMLERİ TABLOSU */}
                  <div>
                    <table className="w-full border-collapse border border-slate-800 text-[11px]">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-black uppercase text-center border-b border-slate-800">
                          <th className="border-r border-slate-800 py-1.5 px-1 w-10">SIRA</th>
                          <th className="border-r border-slate-800 py-1.5 px-2 w-24">TARİH</th>
                          <th className="border-r border-slate-800 py-1.5 px-3 text-left">AÇIKLAMA / MASRAF DETAYI</th>
                          <th className="border-r border-slate-800 py-1.5 px-2 w-28">FATURA / FİŞ NO</th>
                          <th className="py-1.5 px-2 w-24 text-right">TUTAR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Generate rows: fill existing items and pad up to at least 15 rows for authentic paper layout */}
                        {Array.from({ length: Math.max(15, expenseItems.length) }).map((_, idx) => {
                          const item = expenseItems[idx];
                          const hasContent = item && (item.description || item.amount > 0 || item.receiptNo);
                          return (
                            <tr key={idx} className={`border-b border-slate-400 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                              <td className="border-r border-slate-800 text-center font-bold text-slate-700 py-1 px-1">
                                {idx + 1}
                              </td>
                              <td className="border-r border-slate-800 text-center font-mono py-1 px-2">
                                {hasContent ? formatTRDate(item.date) : ""}
                              </td>
                              <td className="border-r border-slate-800 text-left font-medium py-1 px-3 text-slate-900">
                                {hasContent ? item.description : ""}
                              </td>
                              <td className="border-r border-slate-800 text-center font-mono py-1 px-2 text-slate-800">
                                {hasContent ? item.receiptNo : ""}
                              </td>
                              <td className="text-right font-bold py-1 px-2 font-mono text-slate-950">
                                {hasContent && item.amount > 0 ? formatTRY(item.amount) : ""}
                              </td>
                            </tr>
                          );
                        })}

                        {/* TOPLAM MASRAF SATIRI */}
                        <tr className="bg-slate-100 font-black border-t-2 border-slate-800 text-xs">
                          <td colSpan={4} className="border-r border-slate-800 py-1.5 px-3 text-right uppercase tracking-wider">
                            TOPLAM HARCANAN MASRAF :
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-950">
                            {formatTRY(totalExpenses)}
                          </td>
                        </tr>

                        {/* ALINAN MASRAF AVANSI VARSA GÖSTER */}
                        {expenseAdvanceAmount > 0 && (
                          <>
                            <tr className="bg-amber-50 font-bold border-t border-slate-300 text-xs text-amber-950">
                              <td colSpan={4} className="border-r border-slate-800 py-1 px-3 text-right">
                                (-) PERSONELİN ALDIĞI MASRAF AVANSI :
                              </td>
                              <td className="py-1 px-2 text-right font-mono text-amber-900">
                                -{formatTRY(expenseAdvanceAmount)}
                              </td>
                            </tr>
                            <tr className="bg-slate-200 font-black border-t-2 border-slate-800 text-xs text-slate-950">
                              <td colSpan={4} className="border-r border-slate-800 py-1.5 px-3 text-right uppercase">
                                {netExpenseBalance >= 0 ? "MAHSUP SONRASI PERSONELE ÖDENECEK KALAN TUTAR :" : "ŞİRKETE İADE EDİLECEK FAZLA AVANS BAKİYESİ :"}
                              </td>
                              <td className={`py-1.5 px-2 text-right font-mono font-black ${netExpenseBalance >= 0 ? "text-emerald-950" : "text-amber-950"}`}>
                                {formatTRY(Math.abs(netExpenseBalance))}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* BEYAN VE TALEP METNİ */}
                  <div className="pt-1 text-justify text-[11px] leading-relaxed">
                    <p className="indent-4 font-medium uppercase text-slate-800">
                      YUKARIDA TARİHİ, AÇIKLAMASI, FATURA / FİŞ NUMARASI VE TUTARLARI BELİRTİLEN İŞ VE SEYAHAT MASRAFLARININ TARAFIMA YATIRILMASI HUSUSUNDA GEREKLİ İŞLEMLERİN YAPILMASINI ARZ EDERİM.
                    </p>
                  </div>

                  {/* İMZA ALANLARI (3'LÜ ONAY MEKANİZMASI: TALEP EDEN, BİRİM MÜDÜRÜ, MUHASEBE) */}
                  <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs">
                    {/* TALEP EDEN PERSONEL */}
                    <div className="border border-slate-300 rounded-lg p-2.5 space-y-1">
                      <div className="font-black tracking-wider uppercase text-slate-950">MASRAFI YAPAN</div>
                      <div className="text-[10px] text-slate-500 font-bold">İSİM SOYİSİM / GÖREVİ</div>
                      <div className="font-bold text-slate-900 uppercase pt-1">{formData.empFullName || "-"}</div>
                      <div className="text-[10px] text-slate-600">{formData.empTitle || "-"}</div>
                      <div className="h-14 flex items-end justify-center text-[11px] text-slate-400 font-medium border-b border-dashed border-slate-300 mx-4 pb-1">
                        İMZA
                      </div>
                    </div>

                    {/* BİRİM YÖNETİCİSİ ONAYI */}
                    <div className="border border-slate-300 rounded-lg p-2.5 space-y-1">
                      <div className="font-black tracking-wider uppercase text-slate-950">BİRİM YÖNETİCİSİ</div>
                      <div className="text-[10px] text-slate-500 font-bold">ONAY / UNVAN</div>
                      <div className="font-bold text-slate-900 uppercase pt-1">{formData.expenseApproverName || "Departman Yöneticisi"}</div>
                      <div className="text-[10px] text-slate-600">{formData.expenseApproverTitle || "Departman Müdürü"}</div>
                      <div className="h-14 flex items-end justify-center text-[11px] text-slate-400 font-medium border-b border-dashed border-slate-300 mx-4 pb-1">
                        İMZA
                      </div>
                    </div>

                    {/* MUHASEBE & FİNANS KONTROL */}
                    <div className="border border-slate-300 rounded-lg p-2.5 space-y-1">
                      <div className="font-black tracking-wider uppercase text-slate-950">MUHASEBE & FİNANS</div>
                      <div className="text-[10px] text-slate-500 font-bold">KONTROL VE ÖDEME ONAYI</div>
                      <div className="font-bold text-slate-900 uppercase pt-1">{formData.expenseAccountantName || "Muhasebe Yetkilisi"}</div>
                      <div className="text-[10px] text-slate-600">Finans & Muhasebe Birimi</div>
                      <div className="h-14 flex items-end justify-center text-[11px] text-slate-400 font-medium border-b border-dashed border-slate-300 mx-4 pb-1">
                        KAŞE / İMZA
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </DetailPageLayout>
  );
};
