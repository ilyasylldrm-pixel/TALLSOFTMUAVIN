import React, { useState, useMemo, useEffect } from "react";
import {
  Scale,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Download,
  Send,
  Edit3,
  Trash2,
  Search,
  Calculator,
  FileCheck2,
  FileText,
  X,
  Save,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { Contact, Invoice, Transaction, CompanySettings } from "../types";
import { useTheme } from "../context/ThemeContext";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import { generateCariReconciliationPDF } from "../utils/pdfService";
import { saveUserFile, uploadFileToStorage } from "../lib/firebase";

export interface FinancialAdvisorProfile {
  advisorType: "SMMM" | "YMM";
  fullName: string;
  officeTitle: string;
  chamberName: string;
  licenseNo: string;
  taxOffice: string;
  taxNumber: string;
  phone: string;
  email: string;
  ebirlikContractNo: string;
  contractDate: string;
  monthlyGrossFee: number;
}

export interface AdvisorNoteItem {
  id: string;
  date: string;
  periodKey: string;
  author: "Firma" | "Mali Müşavir";
  category: "Beyanname" | "Evrak" | "Mevzuat" | "Mutabakat";
  content: string;
}

type ChecklistStatus = "pending" | "ready" | "sent";

interface FinancialAdvisorPersistedState {
  profile: FinancialAdvisorProfile;
  checklistByPeriod: Record<string, Record<string, ChecklistStatus>>;
  babsStatusByKey: Record<string, "pending" | "agreed" | "discrepancy">;
  notes: AdvisorNoteItem[];
}

interface FinancialAdvisorModuleProps {
  activeCompanyId?: string;
  currentUser?: any;
  onSelectTab?: (tab: string) => void;
  contacts: Contact[];
  invoices: Invoice[];
  transactions: Transaction[];
  employees?: any[];
  companySettings: CompanySettings;
  selectedYear: number;
  onChangeYear?: (year: number) => void;
}

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const CHECKLIST_TEMPLATES = [
  {
    id: "sales_einvoices",
    title: "Satış e-Fatura & e-Arşiv XML / İcmal Paketi",
    detail: "Dönem içi kesilen tüm gelir faturaları ve iptal/iade belgeleri",
  },
  {
    id: "purchase_invoices",
    title: "Alış & Gider Faturaları + Perakende Fişleri",
    detail: "İndirilecek KDV ve tevkifatlı alış faturalarının tasnifi",
  },
  {
    id: "bank_pos_statements",
    title: "Banka Hesap Ekstreleri & POS Gün Sonu Raporları",
    detail: "102 Bankalar ve 108 Hazır Değerler mutabakat dökümleri",
  },
  {
    id: "payroll_sgk",
    title: "Personel Puantaj, İzin & Maaş Ödeme Dekontları",
    detail: "Muhtasar ve Prim Hizmet Beyannamesi (MPHB) bordro verileri",
  },
  {
    id: "rent_smm_vouchers",
    title: "Kira, SMM & Gider Pusulası Stopaj Belgeleri",
    detail: "Muhtasar beyannameye konu tevkifatlı ödeme belgeleri",
  },
  {
    id: "cheques_notes",
    title: "Çek / Senet Tahsilat & Ciro Bordroları",
    detail: "101 Alınan Çekler ve 103 Verilen Çekler dönem sonu envanteri",
  },
];

const DEFAULT_PROFILE: FinancialAdvisorProfile = {
  advisorType: "SMMM",
  fullName: "",
  officeTitle: "",
  chamberName: "İSMMMO",
  licenseNo: "",
  taxOffice: "",
  taxNumber: "",
  phone: "",
  email: "",
  ebirlikContractNo: "",
  contractDate: "2026-01-01",
  monthlyGrossFee: 7500,
};

const formatTL = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(Number(val))) return "0,00";
  return Number(val).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const FinancialAdvisorModule: React.FC<FinancialAdvisorModuleProps> = ({
  activeCompanyId = "default",
  currentUser,
  onSelectTab,
  contacts,
  invoices,
  transactions,
  employees = [],
  companySettings,
  selectedYear,
  onChangeYear,
}) => {
  const { theme } = useTheme();
  const storageKey = `muavin_financial_advisor_v1_${activeCompanyId}`;

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const now = new Date();
    return now.getMonth();
  });

  const [innerTab, setInnerTab] = useState<"handoff" | "reconciliation" | "smm_notes">(
    "handoff"
  );

  const [persisted, setPersisted] = useState<FinancialAdvisorPersistedState>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
            checklistByPeriod: parsed.checklistByPeriod || {},
            babsStatusByKey: parsed.babsStatusByKey || {},
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          };
        }
      } catch {
        // fallback to default
      }
    }
    return {
      profile: DEFAULT_PROFILE,
      checklistByPeriod: {},
      babsStatusByKey: {},
      notes: [],
    };
  });

  // Reload state when company switches
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPersisted({
          profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
          checklistByPeriod: parsed.checklistByPeriod || {},
          babsStatusByKey: parsed.babsStatusByKey || {},
          notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        });
      } else {
        setPersisted({
          profile: DEFAULT_PROFILE,
          checklistByPeriod: {},
          babsStatusByKey: {},
          notes: [],
        });
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  // Persist changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(persisted));
    } catch {
      // ignore quota errors
    }
  }, [persisted, storageKey]);

  const periodKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const periodLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  // Modals & UI feedback
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<FinancialAdvisorProfile>(persisted.profile);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // WhatsApp modal state
  const [whatsAppPayload, setWhatsAppPayload] = useState<{
    isOpen: boolean;
    title: string;
    recipientName: string;
    recipientPhone: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    recipientName: "",
    recipientPhone: "",
    message: "",
  });

  // BA/BS filters
  const [babsSearch, setBabsSearch] = useState("");
  const [babsOnlyOverLimit, setBabsOnlyOverLimit] = useState(false);
  const [babsTypeFilter, setBabsTypeFilter] = useState<"all" | "BS" | "BA">("all");

  // SMM Calculator state
  const [smmMode, setSmmMode] = useState<"gross_to_net" | "net_to_gross">("gross_to_net");
  const [smmInputAmount, setSmmInputAmount] = useState<number>(
    persisted.profile.monthlyGrossFee || 7500
  );
  const [smmStopajRate, setSmmStopajRate] = useState<number>(20);
  const [smmVatRate, setSmmVatRate] = useState<number>(20);
  const [smmTevkifatRatio, setSmmTevkifatRatio] = useState<number>(0); // 0, 0.5, 0.7, 0.9

  // Advisor Note form state
  const [noteAuthor, setNoteAuthor] = useState<"Firma" | "Mali Müşavir">("Firma");
  const [noteCategory, setNoteCategory] = useState<
    "Beyanname" | "Evrak" | "Mevzuat" | "Mutabakat"
  >("Beyanname");
  const [noteContent, setNoteContent] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Period-filtered Invoices & Transactions
  const periodData = useMemo(() => {
    const mInvoices = invoices.filter((inv) => {
      if (!inv.issueDate) return false;
      const d = new Date(inv.issueDate);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });

    const mTransactions = transactions.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });

    const salesInvoices = mInvoices.filter((i) => i.type === "sales");
    const purchaseInvoices = mInvoices.filter((i) => i.type === "purchase");

    const salesSubtotal = salesInvoices.reduce(
      (s, i) => s + (i.subtotal ?? Math.max(0, (i.grandTotal || 0) - (i.totalVat || 0))),
      0
    );
    const salesVat = salesInvoices.reduce((s, i) => s + (i.totalVat || 0), 0);
    const salesGrandTotal = salesInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);

    const purchaseSubtotal = purchaseInvoices.reduce(
      (s, i) => s + (i.subtotal ?? Math.max(0, (i.grandTotal || 0) - (i.totalVat || 0))),
      0
    );
    const purchaseVat = purchaseInvoices.reduce((s, i) => s + (i.totalVat || 0), 0);
    const purchaseGrandTotal = purchaseInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);

    const purchaseTevkifat = purchaseInvoices.reduce(
      (s, i) => s + (i.totalWithholding || 0),
      0
    );
    const purchaseStopaj = purchaseInvoices.reduce((s, i) => s + (i.totalStopaj || 0), 0);

    const advisorMonthlyStopaj =
      persisted.profile.monthlyGrossFee > 0 ? persisted.profile.monthlyGrossFee * 0.2 : 0;

    let payrollStopaj = 0;
    let payrollSgkTotal = 0;
    employees.forEach((emp) => {
      const gross = Number(emp.salary) || 20002.5;
      const sgkEmp = Math.round(gross * 0.15);
      const taxBase = Math.max(0, gross - sgkEmp);
      payrollStopaj += Math.round(Math.max(0, taxBase * 0.15 - 2950));
      payrollSgkTotal += Math.round(gross * 0.375);
    });

    const payableKdv1 = Math.max(0, salesVat - purchaseVat);
    const deferredKdv1 = salesVat < purchaseVat ? Math.abs(salesVat - purchaseVat) : 0;
    const totalMuhtasar = purchaseStopaj + payrollStopaj + advisorMonthlyStopaj;

    const collectionsTotal = mTransactions
      .filter((t) => t.type === "income" || t.type === "collection")
      .reduce((s, t) => s + (t.amount || 0), 0);
    const paymentsTotal = mTransactions
      .filter((t) => t.type === "expense" || t.type === "payment")
      .reduce((s, t) => s + (t.amount || 0), 0);

    return {
      mInvoices,
      mTransactions,
      salesInvoices,
      purchaseInvoices,
      salesSubtotal,
      salesVat,
      salesGrandTotal,
      purchaseSubtotal,
      purchaseVat,
      purchaseGrandTotal,
      purchaseTevkifat,
      purchaseStopaj,
      payrollStopaj,
      payrollSgkTotal,
      advisorMonthlyStopaj,
      payableKdv1,
      deferredKdv1,
      totalMuhtasar,
      collectionsTotal,
      paymentsTotal,
    };
  }, [invoices, transactions, employees, selectedYear, selectedMonth, persisted.profile.monthlyGrossFee]);

  // Cari Mutabakat Counterparty Aggregation
  const allPeriodCounterparties = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        formType: "BS" | "BA";
        contactName: string;
        taxNumber: string;
        phone: string;
        docCount: number;
        netBaseTotal: number;
        vatTotal: number;
        grandTotal: number;
      }
    >();

    periodData.mInvoices.forEach((inv) => {
      const formType: "BS" | "BA" = inv.type === "sales" ? "BS" : "BA";
      const contactObj = contacts.find(
        (c) => c.id === inv.contactId || c.name === inv.contactName
      );
      const name = inv.contactName || contactObj?.name || "Belirtilmeyen Cari";
      const taxNo = contactObj?.taxNumber || "—";
      const phone = contactObj?.phone || "";
      const mapKey = `${periodKey}_${formType}_${inv.contactId || name}`;

      const netBase =
        inv.subtotal !== undefined
          ? inv.subtotal
          : Math.max(0, (inv.grandTotal || 0) - (inv.totalVat || 0));

      const existing = map.get(mapKey);
      if (existing) {
        existing.docCount += 1;
        existing.netBaseTotal += netBase;
        existing.vatTotal += inv.totalVat || 0;
        existing.grandTotal += inv.grandTotal || 0;
      } else {
        map.set(mapKey, {
          key: mapKey,
          formType,
          contactName: name,
          taxNumber: taxNo,
          phone,
          docCount: 1,
          netBaseTotal: netBase,
          vatTotal: inv.totalVat || 0,
          grandTotal: inv.grandTotal || 0,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.netBaseTotal - a.netBaseTotal);
  }, [periodData.mInvoices, contacts, periodKey]);

  const babsCounterparties = useMemo(() => {
    return allPeriodCounterparties.filter((row) => {
      if (babsTypeFilter !== "all" && row.formType !== babsTypeFilter) return false;
      if (babsOnlyOverLimit && row.netBaseTotal < 5000) return false;
      if (babsSearch.trim()) {
        const q = babsSearch.toLowerCase();
        if (
          !row.contactName.toLowerCase().includes(q) &&
          !row.taxNumber.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allPeriodCounterparties, babsTypeFilter, babsOnlyOverLimit, babsSearch]);


  // SMM Calculation
  const smmResult = useMemo(() => {
    const stopajDec = smmStopajRate / 100;
    const vatDec = smmVatRate / 100;
    const retainedVatFactor = vatDec * (1 - smmTevkifatRatio);
    const netMultiplier = 1 - stopajDec + retainedVatFactor;

    const gross =
      smmMode === "gross_to_net"
        ? Math.max(0, Number(smmInputAmount) || 0)
        : netMultiplier > 0
        ? Math.max(0, Number(smmInputAmount) || 0) / netMultiplier
        : 0;

    const stopajAmount = gross * stopajDec;
    const calculatedVat = gross * vatDec;
    const withheldVat = calculatedVat * smmTevkifatRatio;
    const payableVatToAdvisor = calculatedVat - withheldVat;
    const netCollection = gross - stopajAmount + payableVatToAdvisor;
    const totalCostToCompany = gross + calculatedVat;

    return {
      gross,
      stopajAmount,
      calculatedVat,
      withheldVat,
      payableVatToAdvisor,
      netCollection,
      totalCostToCompany,
    };
  }, [smmMode, smmInputAmount, smmStopajRate, smmVatRate, smmTevkifatRatio]);

  // Checklist Helpers
  const periodChecklist = persisted.checklistByPeriod[periodKey] || {};
  const completedChecklistCount = CHECKLIST_TEMPLATES.filter(
    (item) => periodChecklist[item.id] === "ready" || periodChecklist[item.id] === "sent"
  ).length;

  const handleCycleChecklistStatus = (itemId: string) => {
    const current: ChecklistStatus = periodChecklist[itemId] || "pending";
    const next: ChecklistStatus =
      current === "pending" ? "ready" : current === "ready" ? "sent" : "pending";
    setPersisted((prev) => ({
      ...prev,
      checklistByPeriod: {
        ...prev.checklistByPeriod,
        [periodKey]: {
          ...(prev.checklistByPeriod[periodKey] || {}),
          [itemId]: next,
        },
      },
    }));
  };

  // CSV Exports (Luca / Zirve / Mikro Tek Düzen Hesap Planı Uyumlu)
  const handleDownloadAccountingVoucherCsv = () => {
    const headers = [
      "FisTarihi",
      "BelgeNo",
      "HesapKodu",
      "HesapAdi",
      "CariUnvan",
      "Aciklama",
      "Borc",
      "Alacak",
      "ParaBirimi",
    ];
    const rows: string[][] = [];

    periodData.mInvoices.forEach((inv) => {
      const dateStr = inv.issueDate || `${periodKey}-01`;
      const docNo = inv.invoiceNumber || inv.id;
      const contactName = (inv.contactName || "Cari").replace(/;/g, ",");
      const net =
        inv.subtotal !== undefined
          ? inv.subtotal
          : Math.max(0, (inv.grandTotal || 0) - (inv.totalVat || 0));
      const vat = inv.totalVat || 0;
      const grand = inv.grandTotal || 0;

      if (inv.type === "sales") {
        rows.push([
          dateStr,
          docNo,
          "120.01.001",
          "Alıcılar Cari Hesabı",
          contactName,
          `${docNo} Satış Faturası`,
          grand.toFixed(2),
          "0.00",
          inv.currency || "TRY",
        ]);
        rows.push([
          dateStr,
          docNo,
          "600.01.020",
          "Yurtiçi Satışlar",
          contactName,
          `${docNo} Satış Matrahı`,
          "0.00",
          net.toFixed(2),
          inv.currency || "TRY",
        ]);
        if (vat > 0) {
          rows.push([
            dateStr,
            docNo,
            "391.01.020",
            "Hesaplanan KDV",
            contactName,
            `${docNo} Hesaplanan KDV`,
            "0.00",
            vat.toFixed(2),
            inv.currency || "TRY",
          ]);
        }
      } else {
        rows.push([
          dateStr,
          docNo,
          "770.01.001",
          "Genel Yönetim / Mal ve Hizmet Alımları",
          contactName,
          `${docNo} Alış Faturası Matrahı`,
          net.toFixed(2),
          "0.00",
          inv.currency || "TRY",
        ]);
        if (vat > 0) {
          rows.push([
            dateStr,
            docNo,
            "191.01.020",
            "İndirilecek KDV",
            contactName,
            `${docNo} İndirilecek KDV`,
            vat.toFixed(2),
            "0.00",
            inv.currency || "TRY",
          ]);
        }
        rows.push([
          dateStr,
          docNo,
          "320.01.001",
          "Satıcılar Cari Hesabı",
          contactName,
          `${docNo} Alış Faturası`,
          "0.00",
          grand.toFixed(2),
          inv.currency || "TRY",
        ]);
      }
    });

    periodData.mTransactions.forEach((tx) => {
      const dateStr = tx.date || `${periodKey}-01`;
      const docNo = tx.documentNo || tx.id;
      const party = (tx.contactName || tx.accountName || "Finans").replace(/;/g, ",");
      const isIn = tx.type === "income" || tx.type === "collection";
      const amt = (tx.amount || 0).toFixed(2);

      if (isIn) {
        rows.push([
          dateStr,
          docNo,
          "102.01.001",
          tx.accountName || "Bankalar / Kasa",
          party,
          (tx.description || "Tahsilat Kaydı").replace(/;/g, ","),
          amt,
          "0.00",
          tx.currency || "TRY",
        ]);
        rows.push([
          dateStr,
          docNo,
          "120.01.001",
          "Alıcılar / Gelir Karşılığı",
          party,
          (tx.description || "Tahsilat Kaydı").replace(/;/g, ","),
          "0.00",
          amt,
          tx.currency || "TRY",
        ]);
      } else {
        rows.push([
          dateStr,
          docNo,
          "320.01.001",
          "Satıcılar / Gider Karşılığı",
          party,
          (tx.description || "Ödeme Kaydı").replace(/;/g, ","),
          amt,
          "0.00",
          tx.currency || "TRY",
        ]);
        rows.push([
          dateStr,
          docNo,
          "102.01.001",
          tx.accountName || "Bankalar / Kasa",
          party,
          (tx.description || "Ödeme Kaydı").replace(/;/g, ","),
          "0.00",
          amt,
          tx.currency || "TRY",
        ]);
      }
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Muhasebe_Mahsup_Paketi_${periodKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${periodLabel} resmi muhasebe mahsup fişi (.CSV) indirildi.`);
  };

  const handleDownloadInvoiceSummaryCsv = () => {
    const headers = [
      "Tarih",
      "FaturaNo",
      "Tur",
      "CariUnvan",
      "KdvHaricMatrah",
      "KdvTutari",
      "Tevkifat",
      "Stopaj",
      "GenelToplam",
    ];
    const rows = periodData.mInvoices.map((inv) => {
      const net =
        inv.subtotal !== undefined
          ? inv.subtotal
          : Math.max(0, (inv.grandTotal || 0) - (inv.totalVat || 0));
      return [
        inv.issueDate || "",
        inv.invoiceNumber || inv.id,
        inv.type === "sales" ? "Satış" : "Alış",
        (inv.contactName || "Cari").replace(/;/g, ","),
        net.toFixed(2),
        (inv.totalVat || 0).toFixed(2),
        (inv.totalWithholding || 0).toFixed(2),
        (inv.totalStopaj || 0).toFixed(2),
        (inv.grandTotal || 0).toFixed(2),
      ];
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Fatura_KDV_Icmal_${periodKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${periodLabel} fatura ve KDV icmal listesi (.CSV) indirildi.`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPersisted((prev) => ({
      ...prev,
      profile: profileDraft,
    }));
    setSmmInputAmount(profileDraft.monthlyGrossFee || 0);
    setIsProfileModalOpen(false);
    showToast("Mali müşavir ve sözleşme bilgileri kaydedildi.");
  };



  const [exportingPdfKey, setExportingPdfKey] = useState<string | null>(null);

  const handleCycleBabsStatus = (key: string) => {
    const cur = persisted.babsStatusByKey[key] || "pending";
    const next = cur === "pending" ? "agreed" : cur === "agreed" ? "discrepancy" : "pending";
    setPersisted((prev) => ({
      ...prev,
      babsStatusByKey: {
        ...prev.babsStatusByKey,
        [key]: next,
      },
    }));
  };

  /**
   * Cari Mutabakat Mektubunu tek tıkla resmi PDF olarak üretir,
   * tarayıcıda indirir ve 'Belge Merkezi' (Bulut Dosya Deposu) arşivine kaydeder.
   */
  const handleExportReconciliationPdf = async (row: {
    key: string;
    formType: "BS" | "BA";
    contactName: string;
    taxNumber: string;
    phone: string;
    docCount: number;
    netBaseTotal: number;
    vatTotal: number;
    grandTotal: number;
  }) => {
    if (exportingPdfKey) return;
    setExportingPdfKey(row.key);

    try {
      // 1. İlgili cariye ait dönem faturalarını topla
      const relevantInvoices = periodData.mInvoices.filter((inv) => {
        const typeMatch = row.formType === "BS" ? inv.type === "sales" : inv.type === "purchase";
        if (!typeMatch) return false;
        const contactObj = contacts.find(
          (c) => c.id === inv.contactId || c.name === inv.contactName
        );
        const name = inv.contactName || contactObj?.name || "Belirtilmeyen Cari";
        return (
          (contactObj && contactObj.taxNumber === row.taxNumber) ||
          name.toLowerCase() === row.contactName.toLowerCase()
        );
      });

      const invoiceBreakdown = relevantInvoices.map((inv) => {
        const net =
          inv.subtotal !== undefined
            ? inv.subtotal
            : Math.max(0, (inv.grandTotal || 0) - (inv.totalVat || 0));
        return {
          date: inv.issueDate || `${periodKey}-01`,
          docNo: inv.invoiceNumber || inv.id,
          description: `${inv.type === "sales" ? "Satış" : "Alış"} Faturası (${inv.contactName || row.contactName})`,
          netBase: net,
          vat: inv.totalVat || 0,
          grandTotal: inv.grandTotal || 0,
        };
      });

      const currentStatus = persisted.babsStatusByKey[row.key] || "pending";
      const advisorDisplayName = persisted.profile.fullName
        ? `${persisted.profile.advisorType} ${persisted.profile.fullName}`
        : undefined;

      // 2. Resmi Türkçe VUK/TTK standartlarında PDF üret
      const pdfResult = await generateCariReconciliationPDF({
        companySettings,
        periodLabel,
        counterparty: {
          formType: row.formType,
          contactName: row.contactName,
          taxNumber: row.taxNumber,
          phone: row.phone,
          docCount: row.docCount,
          netBaseTotal: row.netBaseTotal,
          vatTotal: row.vatTotal,
          grandTotal: row.grandTotal,
        },
        invoices: invoiceBreakdown,
        status: currentStatus,
        advisorName: advisorDisplayName,
      });

      // 3. Tarayıcıda anında tek tıkla indirme başlat
      const blobUrl = URL.createObjectURL(pdfResult.blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = pdfResult.fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      // 4. PDF Dosyasını 'Belge Merkezi' (user_files / Bulut Dosya Deposu) kayıtlarına ekle
      const effectiveUserId =
        currentUser?.id || currentUser?.userId || activeCompanyId || "default_user";
      const userEmail = currentUser?.email || "";

      // PDF Blob'unu File nesnesine dönüştür
      const pdfFile = new File([pdfResult.blob], pdfResult.fileName, {
        type: "application/pdf",
      });

      // Base64 Data URL oluştur (Önizleme ve offline indirme garantisi için)
      let fileDataUri: string | undefined = undefined;
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(pdfResult.blob);
        fileDataUri = await base64Promise;
      } catch {
        // base64 reader hatası kritik değildir
      }

      // Varsa Firebase Cloud Storage'a yükle
      let cloudUrl: string | undefined = undefined;
      let cloudStoragePath: string | undefined = undefined;
      try {
        const uploadRes = await uploadFileToStorage(effectiveUserId, pdfFile);
        if (uploadRes?.fileUrl) {
          cloudUrl = uploadRes.fileUrl;
          cloudStoragePath = uploadRes.storagePath;
        }
      } catch (uploadErr) {
        console.warn("Belge Merkezi bulut depolama yüklemesi yerel yedeğe alındı:", uploadErr);
      }

      await saveUserFile({
        userId: effectiveUserId,
        userEmail,
        fileName: pdfResult.fileName,
        fileSize: pdfFile.size,
        fileType: "application/pdf",
        uploadDate: new Date().toISOString(),
        category: "Cari Mutabakat",
        description: `${periodLabel} Cari Mutabakat Mektubu - ${row.contactName} (${row.formType === "BS" ? "Satış" : "Alış"}, ${row.docCount} Belge, Matrah: ₺${formatTL(row.netBaseTotal)})`,
        fileUrl: cloudUrl,
        storagePath: cloudStoragePath,
        fileData: fileDataUri,
        extractedData: {
          taxNumber: row.taxNumber !== "—" ? row.taxNumber : "",
          companyTitle: row.contactName,
          invoiceNumber: `MUT-${periodKey.replace("-", "")}`,
          issueDate: new Date().toISOString().split("T")[0],
          docType: "Diğer",
          subtotal: row.netBaseTotal,
          vatRate: 20,
          vatAmount: row.vatTotal,
          grandTotal: row.grandTotal,
          notes: `${periodLabel} dönemi ${row.formType === "BS" ? "satış" : "alış"} mutabakat mektubu.`,
        },
      });

      showToast(
        `✓ ${row.contactName} cari mutabakat mektubu PDF olarak indirildi ve Belge Merkezi'ne kaydedildi.`
      );
    } catch (err) {
      console.error("Cari mutabakat PDF aktarma hatası:", err);
      showToast("Cari mutabakat PDF oluşturulurken bir hata oluştu.");
    } finally {
      setExportingPdfKey(null);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    const newItem: AdvisorNoteItem = {
      id: `note_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      periodKey,
      author: noteAuthor,
      category: noteCategory,
      content: noteContent.trim(),
    };
    setPersisted((prev) => ({
      ...prev,
      notes: [newItem, ...prev.notes],
    }));
    setNoteContent("");
    showToast("Müşavir notu kaydedildi.");
  };

  const handleDeleteNote = (id: string) => {
    setPersisted((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));
  };

  const handleOpenAdvisorSummaryWhatsApp = () => {
    const p = persisted.profile;
    const msg = [
      `Sayın ${p.fullName || "Mali Müşavirimiz"},`,
      `${companySettings.companyName || "Firmamız"} (VKN: ${companySettings.taxNumber || "-"}) ${periodLabel} dönemi ön muhasebe icmali aşağıdadır:`,
      `• Satış Faturaları (${periodData.salesInvoices.length} adet): ₺${formatTL(periodData.salesGrandTotal)} (Hesaplanan KDV: ₺${formatTL(periodData.salesVat)})`,
      `• Alış Faturaları (${periodData.purchaseInvoices.length} adet): ₺${formatTL(periodData.purchaseGrandTotal)} (İndirilecek KDV: ₺${formatTL(periodData.purchaseVat)})`,
      `• Tahmini KDV-1 Durumu: ${periodData.payableKdv1 > 0 ? `₺${formatTL(periodData.payableKdv1)} Ödenecek` : `₺${formatTL(periodData.deferredKdv1)} Devreden`}`,
      `• Tahmini Muhtasar / Stopaj: ₺${formatTL(periodData.totalMuhtasar)}`,
      `• Evrak Hazırlık Durumu: ${completedChecklistCount}/${CHECKLIST_TEMPLATES.length} kalem tamamlandı.`,
      `İyi çalışmalar dileriz.`,
    ].join("\n");

    setWhatsAppPayload({
      isOpen: true,
      title: "Mali Müşavire Dönem İcmali Gönder",
      recipientName: p.fullName || p.officeTitle || "Mali Müşavir",
      recipientPhone: p.phone || "",
      message: msg,
    });
  };

  const profile = persisted.profile;
  const agreedReconciliationCount = allPeriodCounterparties.filter(
    (r) => persisted.babsStatusByKey[r.key] === "agreed"
  ).length;

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className="px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Advisor Identity & Period Selector Bar */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-[#0f6bae]">{profile.advisorType} Danışmanlık & Müşavirlik Masası</span>
              <span aria-hidden="true">·</span>
              <span>{companySettings.companyName || "Aktif Firma"}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">VKN: {companySettings.taxNumber || "—"}</span>
            </div>
            <h2
              className="text-lg font-bold tracking-tight truncate"
              style={{ color: theme.pageText }}
            >
              {profile.fullName
                ? `${profile.advisorType} ${profile.fullName}${profile.officeTitle ? ` — ${profile.officeTitle}` : ""}`
                : "Mali Müşavir (SMMM / YMM) Bilgisi Tanımlanmadı"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-mono tabular-nums">
                Oda / Sicil: {profile.chamberName || "—"} / {profile.licenseNo || "Belirtilmedi"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                e-Birlik Sözleşme: {profile.ebirlikContractNo || "Belirtilmedi"}
              </span>
              {profile.phone && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{profile.phone}</span>
                </>
              )}
              {profile.email && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{profile.email}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setProfileDraft(persisted.profile);
                setIsProfileModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              style={{ color: theme.pageText }}
            >
              <Edit3 className="w-3.5 h-3.5 text-[#0f6bae]" />
              <span>{profile.fullName ? "Müşavir Kartını Düzenle" : "Müşavir Tanımla"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAccountingVoucherCsv}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              style={{ color: theme.pageText }}
            >
              <Download className="w-3.5 h-3.5 text-[#0f6bae]" />
              <span>Resmi Mahsup Fişi (.CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdvisorSummaryWhatsApp}
              className="px-4 py-2 rounded-xl bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Müşavire Dönem İcmali Gönder</span>
            </button>
          </div>
        </div>

        {/* Month & Year Strip + 4 Core Period KPIs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {onChangeYear && (
              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono tabular-nums cursor-pointer mr-1"
                style={{ color: theme.pageText }}
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            )}
            {MONTH_NAMES.map((mName, idx) => {
              const active = selectedMonth === idx;
              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => setSelectedMonth(idx)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-[#0f6bae] text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] text-slate-500">Dönem Evrak Hazırlık</div>
              <div
                className="text-sm font-bold font-mono tabular-nums mt-0.5"
                style={{ color: theme.pageText }}
              >
                {completedChecklistCount} / {CHECKLIST_TEMPLATES.length} Tamam
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Dönem KDV-1 Dengesi</div>
              <div
                className="text-sm font-bold font-mono tabular-nums mt-0.5"
                style={{ color: theme.pageText }}
              >
                {periodData.payableKdv1 > 0
                  ? `₺${formatTL(periodData.payableKdv1)}`
                  : `₺${formatTL(periodData.deferredKdv1)} Devir`}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Dönem Satış Toplamı</div>
              <div
                className="text-sm font-bold font-mono tabular-nums mt-0.5"
                style={{ color: theme.pageText }}
              >
                ₺{formatTL(periodData.salesGrandTotal)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Cari Mutabakat</div>
              <div className="text-sm font-bold font-mono tabular-nums text-emerald-600 mt-0.5">
                {agreedReconciliationCount} / {allPeriodCounterparties.length} Mutabık
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inner Segmented Navigation */}
      <div
        className="flex items-center gap-1.5 p-1.5 rounded-xl border overflow-x-auto"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
      >
        <button
          type="button"
          onClick={() => setInnerTab("handoff")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            innerTab === "handoff"
              ? "bg-[#0f6bae] text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Evrak Teslim & Resmi Veri Aktarımı</span>
        </button>

        <button
          type="button"
          onClick={() => setInnerTab("reconciliation")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            innerTab === "reconciliation"
              ? "bg-[#0f6bae] text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Cari Mutabakat</span>
        </button>

        <button
          type="button"
          onClick={() => setInnerTab("smm_notes")}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            innerTab === "smm_notes"
              ? "bg-[#0f6bae] text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>SMM Stopaj Hesaplama & Müşavir Notları</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AYLIK EVRAK TESLİM & RESMİ MUHASEBE VERİ AKTARIMI */}
      {/* ========================================================= */}
      {innerTab === "handoff" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Monthly Data Summary & Official Export */}
          <div
            className="lg:col-span-5 rounded-2xl border p-5 flex flex-col justify-between space-y-5"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold" style={{ color: theme.pageText }}>
                  {periodLabel} Ön Muhasebe Veri Özeti
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Luca, Zirve, Mikro ve Eta resmi muhasebe yazılımlarına aktarıma hazır dönem verileri.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold" style={{ color: theme.pageText }}>
                      Satış Faturaları (600 / 391)
                    </div>
                    <div className="text-slate-500 font-mono tabular-nums">
                      {periodData.salesInvoices.length} adet belge · KDV: ₺{formatTL(periodData.salesVat)}
                    </div>
                  </div>
                  <div className="font-bold font-mono tabular-nums text-right" style={{ color: theme.pageText }}>
                    ₺{formatTL(periodData.salesGrandTotal)}
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold" style={{ color: theme.pageText }}>
                      Alış & Gider Faturaları (153 / 770 / 191)
                    </div>
                    <div className="text-slate-500 font-mono tabular-nums">
                      {periodData.purchaseInvoices.length} adet belge · KDV: ₺{formatTL(periodData.purchaseVat)}
                    </div>
                  </div>
                  <div className="font-bold font-mono tabular-nums text-right" style={{ color: theme.pageText }}>
                    ₺{formatTL(periodData.purchaseGrandTotal)}
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold" style={{ color: theme.pageText }}>
                      Kasa & Banka Tahsilat / Ödeme (100 / 102)
                    </div>
                    <div className="text-slate-500 font-mono tabular-nums">
                      {periodData.mTransactions.length} finans hareketi
                    </div>
                  </div>
                  <div className="font-mono tabular-nums text-right">
                    <div className="font-bold text-emerald-600">+₺{formatTL(periodData.collectionsTotal)}</div>
                    <div className="text-[11px] text-rose-600">-₺{formatTL(periodData.paymentsTotal)}</div>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold" style={{ color: theme.pageText }}>
                      SMM & Stopaj Kesintileri (360)
                    </div>
                    <div className="text-slate-500 font-mono tabular-nums">
                      Fatura Stopajı + SMMM Stopajı + Bordro GV
                    </div>
                  </div>
                  <div className="font-bold font-mono tabular-nums text-right" style={{ color: theme.pageText }}>
                    ₺{formatTL(periodData.totalMuhtasar)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleDownloadAccountingVoucherCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Tek Düzen Hesap Planı Mahsup Fişi İndir (.CSV)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadInvoiceSummaryCsv}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                style={{ color: theme.pageText }}
              >
                <FileText className="w-3.5 h-3.5 text-[#0f6bae]" />
                <span>Dönem Fatura & KDV İcmal Listesi İndir (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Right: Interactive Monthly Document Handoff Checklist */}
          <div
            className="lg:col-span-7 rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold" style={{ color: theme.pageText }}>
                  {periodLabel} Mali Müşavir Evrak Teslim Kontrol Listesi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Durumu değiştirmek için ilgili satırdaki durum butonuna tıklayın (Bekliyor → Hazır → Müşavire İletildi).
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                Tamamlanan: {completedChecklistCount}/{CHECKLIST_TEMPLATES.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {CHECKLIST_TEMPLATES.map((item, idx) => {
                const status: ChecklistStatus = periodChecklist[item.id] || "pending";
                return (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold" style={{ color: theme.pageText }}>
                        0{idx + 1}. {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.detail}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCycleChecklistStatus(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 border ${
                        status === "sent"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : status === "ready"
                          ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {status === "sent" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Müşavire İletildi</span>
                        </>
                      ) : status === "ready" ? (
                        <>
                          <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Pakete Hazır</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Evrak Bekliyor</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CARİ MUTABAKAT                                     */}
      {/* ========================================================= */}
      {innerTab === "reconciliation" && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold" style={{ color: theme.pageText }}>
                Cari Mutabakat
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {periodLabel} dönemi KDV hariç mal ve hizmet alım/satım toplamlarının cari bazda mutabakat kontrolü.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={babsSearch}
                  onChange={(e) => setBabsSearch(e.target.value)}
                  placeholder="Cari unvan veya VKN ara..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                  style={{ color: theme.pageText }}
                />
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {(["all", "BS", "BA"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBabsTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      babsTypeFilter === t
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {t === "all" ? "Tümü" : t === "BS" ? "Satış Carileri" : "Alış Carileri"}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={babsOnlyOverLimit}
                  onChange={(e) => setBabsOnlyOverLimit(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Sadece ≥ ₺5.000</span>
              </label>

              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab("files")}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  style={{ color: theme.pageText }}
                  title="Belge Merkezi / Bulut Dosya Deposunu aç"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#0f6bae]" />
                  <span>Belge Merkezi</span>
                </button>
              )}
            </div>
          </div>

          {babsCounterparties.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Scale className="w-7 h-7 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold" style={{ color: theme.pageText }}>
                {periodLabel} döneminde kriterlere uygun faturalı cari hareketi bulunamadı.
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Gelir veya gider faturası eklendiğinde cari bazlı KDV hariç mutabakat tutarları otomatik olarak burada listelenir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50/60 dark:bg-slate-800/40">
                    <th className="py-3 px-4">İşlem Türü</th>
                    <th className="py-3 px-3">Cari Unvanı</th>
                    <th className="py-3 px-3">VKN / TCKN</th>
                    <th className="py-3 px-3 text-right">Belge Adedi</th>
                    <th className="py-3 px-3 text-right">KDV Hariç Tutar</th>
                    <th className="py-3 px-3 text-right">KDV Tutarı</th>
                    <th className="py-3 px-3">Mutabakat Durumu</th>
                    <th className="py-3 px-4 text-right">İşlemler (PDF & WhatsApp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {babsCounterparties.map((row) => {
                    const status = persisted.babsStatusByKey[row.key] || "pending";
                    const isExportingThis = exportingPdfKey === row.key;
                    return (
                      <tr
                        key={row.key}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold whitespace-nowrap">
                          {row.formType === "BS" ? (
                            <span className="inline-flex items-center gap-1 text-[#0f6bae]">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>Satış</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              <span>Alış</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold" style={{ color: theme.pageText }}>
                          {row.contactName}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-500">
                          {row.taxNumber}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {row.docCount}
                        </td>
                        <td
                          className="py-3 px-3 text-right font-mono tabular-nums font-bold"
                          style={{ color: theme.pageText }}
                        >
                          ₺{formatTL(row.netBaseTotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                          ₺{formatTL(row.vatTotal)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleCycleBabsStatus(row.key)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                              status === "agreed"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                : status === "discrepancy"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {status === "agreed"
                              ? "✓ Mutabık"
                              : status === "discrepancy"
                              ? "⚠ Fark Var"
                              : "Bekliyor"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleExportReconciliationPdf(row)}
                              disabled={isExportingThis || !!exportingPdfKey}
                              title="Cari mutabakat mektubunu resmi PDF olarak indirir ve Belge Merkezi (Bulut Dosya Deposu) arşivine kaydeder"
                              className="px-2.5 py-1 rounded-lg bg-[#0f6bae] hover:bg-[#005289] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              {isExportingThis ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Kaydediliyor...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3" />
                                  <span>PDF İndir & Kaydet</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const msg = `Sayın ${row.contactName} Yetkilisi,\n${companySettings.companyName || "Firmamız"} kayıtlarına göre ${periodLabel} dönemi ${row.formType === "BS" ? "satış" : "alış"} faturaları kapsamında toplam ${row.docCount} adet belge ve KDV hariç ₺${formatTL(row.netBaseTotal)} (KDV Dahil: ₺${formatTL(row.grandTotal)}) tutarında işlemimiz bulunmaktadır. Mutabık olup olmadığınızı bildirmenizi rica ederiz.`;
                                setWhatsAppPayload({
                                  isOpen: true,
                                  title: "Cari Mutabakat Gönder",
                                  recipientName: row.contactName,
                                  recipientPhone: row.phone,
                                  message: msg,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                              style={{ color: theme.pageText }}
                            >
                              <Send className="w-3 h-3 text-[#0f6bae]" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SMM HESAPLAMA ARACI & MÜŞAVİR NOTLARI              */}
      {/* ========================================================= */}
      {innerTab === "smm_notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: SMM (Serbest Meslek Makbuzu) Stopaj & KDV Calculator */}
          <div
            className="lg:col-span-6 rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold" style={{ color: theme.pageText }}>
                  Serbest Meslek Makbuzu (e-SMM) Hesaplama Aracı
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mali müşavirlik ücretinin brüt, %20 GV stopaj, KDV ve net ödeme tutarlarını hesaplayın.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setSmmMode("gross_to_net")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  smmMode === "gross_to_net"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Brütten Nete
              </button>
              <button
                type="button"
                onClick={() => setSmmMode("net_to_gross")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  smmMode === "net_to_gross"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Net Ödemeden Brüte
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {smmMode === "gross_to_net"
                    ? "Brüt Müşavirlik Ücreti (₺)"
                    : "Müşavire Ödenecek Net Tutar (KDV Dahil, Stopaj Düşülmüş) (₺)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={smmInputAmount}
                  onChange={(e) => setSmmInputAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums font-bold"
                  style={{ color: theme.pageText }}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Gelir Vergisi Stopaj Oranı (%)
                </label>
                <select
                  value={smmStopajRate}
                  onChange={(e) => setSmmStopajRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                  style={{ color: theme.pageText }}
                >
                  <option value={20}>%20 (Standart SMMM / YMM)</option>
                  <option value={17}>%17</option>
                  <option value={10}>%10</option>
                  <option value={0}>%0 (Stopajsız)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  KDV Oranı & Tevkifat
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={smmVatRate}
                    onChange={(e) => setSmmVatRate(Number(e.target.value))}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                    style={{ color: theme.pageText }}
                  >
                    <option value={20}>%20 KDV</option>
                    <option value={10}>%10 KDV</option>
                  </select>
                  <select
                    value={smmTevkifatRatio}
                    onChange={(e) => setSmmTevkifatRatio(Number(e.target.value))}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono tabular-nums"
                    style={{ color: theme.pageText }}
                  >
                    <option value={0}>Tevkifat Yok</option>
                    <option value={0.5}>5/10 Tevkifat</option>
                    <option value={0.7}>7/10 Tevkifat</option>
                    <option value={0.9}>9/10 Tevkifat</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="py-2 flex justify-between font-mono tabular-nums">
                <span className="text-slate-500">Brüt Ücret (Gider Matrahı):</span>
                <span className="font-bold" style={{ color: theme.pageText }}>
                  ₺{formatTL(smmResult.gross)}
                </span>
              </div>
              <div className="py-2 flex justify-between font-mono tabular-nums">
                <span className="text-slate-500">
                  GV Stopajı (%{smmStopajRate} — Muhtasar ile Vergi Dairesine):
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  -₺{formatTL(smmResult.stopajAmount)}
                </span>
              </div>
              <div className="py-2 flex justify-between font-mono tabular-nums">
                <span className="text-slate-500">Hesaplanan KDV (%{smmVatRate}):</span>
                <span className="font-semibold" style={{ color: theme.pageText }}>
                  +₺{formatTL(smmResult.calculatedVat)}
                </span>
              </div>
              {smmResult.withheldVat > 0 && (
                <div className="py-2 flex justify-between font-mono tabular-nums">
                  <span className="text-slate-500">KDV-2 Sorumlu Sıfatıyla Tevkifat:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    -₺{formatTL(smmResult.withheldVat)}
                  </span>
                </div>
              )}
              <div className="py-2.5 flex justify-between font-mono tabular-nums text-sm">
                <span className="font-bold" style={{ color: theme.pageText }}>
                  Mali Müşavire Net Ödenecek:
                </span>
                <span className="font-bold text-[#0f6bae]">
                  ₺{formatTL(smmResult.netCollection)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const roundedGross = Math.round(smmResult.gross * 100) / 100;
                setPersisted((prev) => ({
                  ...prev,
                  profile: {
                    ...prev.profile,
                    monthlyGrossFee: roundedGross,
                  },
                }));
                showToast(
                  `Aylık brüt müşavirlik ücreti ₺${formatTL(roundedGross)} olarak sözleşmeye kaydedildi.`
                );
              }}
              className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              style={{ color: theme.pageText }}
            >
              Bu Brüt Ücreti Sözleşme Ücreti Olarak Kaydet
            </button>
          </div>

          {/* Right: Advisor Notes & Audit Trail */}
          <div
            className="lg:col-span-6 rounded-2xl border p-5 flex flex-col justify-between space-y-4"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
          >
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold" style={{ color: theme.pageText }}>
                  Müşavir Notları & Dönem Talimatları
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  KKEG kalemleri, amortisman listesi, KDV iadesi veya eksik belgeler için dönem bazlı notlar.
                </p>
              </div>

              <form onSubmit={handleAddNote} className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value as "Firma" | "Mali Müşavir")}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    style={{ color: theme.pageText }}
                  >
                    <option value="Firma">Not Sahibi: Firma Yönetimi</option>
                    <option value="Mali Müşavir">Not Sahibi: Mali Müşavir</option>
                  </select>
                  <select
                    value={noteCategory}
                    onChange={(e) =>
                      setNoteCategory(
                        e.target.value as "Beyanname" | "Evrak" | "Mevzuat" | "Mutabakat"
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    style={{ color: theme.pageText }}
                  >
                    <option value="Beyanname">Konu: Dönem İşlemleri</option>
                    <option value="Evrak">Konu: Eksik Evrak</option>
                    <option value="Mevzuat">Konu: Mevzuat / KKEG</option>
                    <option value="Mutabakat">Konu: Cari Mutabakat</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={`${periodLabel} dönemi için müşavir notu yazın...`}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    style={{ color: theme.pageText }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0f6bae] hover:bg-[#005289] text-white font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Not Ekle
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                {persisted.notes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Henüz kayıtlı bir mali müşavir notu bulunmuyor.
                  </div>
                ) : (
                  persisted.notes.map((n) => (
                    <div key={n.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-[#0f6bae]">{n.author}</span>
                          <span aria-hidden="true">·</span>
                          <span>{n.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{n.periodKey}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{n.date}</span>
                        </div>
                        <p className="leading-relaxed" style={{ color: theme.pageText }}>
                          {n.content}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                        title="Notu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: MALİ MÜŞAVİR PROFİL & SÖZLEŞME DÜZENLEME         */}
      {/* ========================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mali Müşavir (SMMM / YMM) & Sözleşme Bilgileri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  TÜRMOB e-Birlik sözleşme ve iletişim bilgilerini tanımlayın.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Müşavirlik Unvanı
                  </label>
                  <select
                    value={profileDraft.advisorType}
                    onChange={(e) =>
                      setProfileDraft((p) => ({
                        ...p,
                        advisorType: e.target.value as "SMMM" | "YMM",
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="SMMM">SMMM (Serbest Muhasebeci Mali Müşavir)</option>
                    <option value="YMM">YMM (Yeminli Mali Müşavir)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileDraft.fullName}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, fullName: e.target.value }))
                    }
                    placeholder="örn: Ahmet Yılmaz"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Muhasebe Bürosu / Ortaklık Unvanı
                  </label>
                  <input
                    type="text"
                    value={profileDraft.officeTitle}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, officeTitle: e.target.value }))
                    }
                    placeholder="örn: Yılmaz Mali Müşavirlik ve Denetim Ltd. Şti."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kayıtlı Olduğu Oda
                  </label>
                  <input
                    type="text"
                    value={profileDraft.chamberName}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, chamberName: e.target.value }))
                    }
                    placeholder="örn: İSMMMO / ASMMMO"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Oda / Ruhsat Sicil No
                  </label>
                  <input
                    type="text"
                    value={profileDraft.licenseNo}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, licenseNo: e.target.value }))
                    }
                    placeholder="örn: 48291"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={profileDraft.taxOffice}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, taxOffice: e.target.value }))
                    }
                    placeholder="örn: Kadıköy VD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    VKN / TCKN
                  </label>
                  <input
                    type="text"
                    value={profileDraft.taxNumber}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, taxNumber: e.target.value }))
                    }
                    placeholder="10 veya 11 haneli vergi no"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={profileDraft.phone}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="örn: 0532 000 00 00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="musavir@ofis.com.tr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    TÜRMOB e-Birlik Sözleşme No
                  </label>
                  <input
                    type="text"
                    value={profileDraft.ebirlikContractNo}
                    onChange={(e) =>
                      setProfileDraft((p) => ({ ...p, ebirlikContractNo: e.target.value }))
                    }
                    placeholder="örn: 2026-34-098412"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aylık Brüt Müşavirlik Ücreti (₺)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={profileDraft.monthlyGrossFee}
                    onChange={(e) =>
                      setProfileDraft((p) => ({
                        ...p,
                        monthlyGrossFee: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0f6bae] hover:bg-[#005289] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* WhatsApp Integration Modal */}
      {whatsAppPayload.isOpen && (
        <UniversalWhatsAppModal
          isOpen={whatsAppPayload.isOpen}
          onClose={() => setWhatsAppPayload((prev) => ({ ...prev, isOpen: false }))}
          title={whatsAppPayload.title}
          documentTypeLabel="Mali Müşavir & Mutabakat Bildirimi"
          recipientName={whatsAppPayload.recipientName}
          recipientPhone={whatsAppPayload.recipientPhone}
          defaultMessage={whatsAppPayload.message}
          companySettings={companySettings}
        />
      )}
    </div>
  );
};
