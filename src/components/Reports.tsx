import React, { useState, useMemo } from "react";
import { ExportButtons } from "./ExportButtons";
import { formatCurrency, formatDate } from "../utils/exportUtils";
import {
  Contact,
  Invoice,
  Transaction,
  CompanySettings,
  TAXPAYER_TYPES,
} from "../types";
import {
  BarChart3,
  Receipt,
  TrendingUp,
  Building2,
  Calendar,
  FileCheck,
  Percent,
  CheckCircle2,
  Info,
  Calculator,
  Briefcase,
  ShieldCheck,
  Scale,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  Landmark,
  Users,
  Sparkles,
  Download,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
} from "lucide-react";

interface ReportsProps {
  contacts: Contact[];
  invoices: Invoice[];
  transactions: Transaction[];
  companySettings: CompanySettings;
  products?: any[];
  quotes?: any[];
  orders?: any[];
  waybills?: any[];
  cheques?: any[];
  promissoryNotes?: any[];
  employees?: any[];
}

// 2026 Gelir Vergisi Tarifesi (GVK M.103) - Progressive Tax Bracket Calculation
function calculateIndividualIncomeTax(netProfit: number): {
  totalTax: number;
  effectiveRate: number;
  bracketBreakdown: { bracket: string; taxableAmount: number; taxAmount: number; rate: number }[];
} {
  if (netProfit <= 0) {
    return { totalTax: 0, effectiveRate: 0, bracketBreakdown: [] };
  }

  const brackets = [
    { limit: 150000, rate: 0.15, label: "1. Dilim (%15 - 150.000 TL'ye kadar)" },
    { limit: 330000, rate: 0.20, label: "2. Dilim (%20 - 150.000 TL - 330.000 TL)" },
    { limit: 1200000, rate: 0.27, label: "3. Dilim (%27 - 330.000 TL - 1.200.000 TL)" },
    { limit: 4300000, rate: 0.35, label: "4. Dilim (%35 - 1.200.000 TL - 4.300.000 TL)" },
    { limit: Infinity, rate: 0.40, label: "5. Dilim (%40 - 4.300.000 TL üzeri)" },
  ];

  let remainingProfit = netProfit;
  let previousLimit = 0;
  let totalTax = 0;
  const bracketBreakdown: { bracket: string; taxableAmount: number; taxAmount: number; rate: number }[] = [];

  for (const b of brackets) {
    if (remainingProfit <= 0) break;

    const bracketCapacity = b.limit - previousLimit;
    const amountInBracket = Math.min(remainingProfit, bracketCapacity);
    const taxInBracket = amountInBracket * b.rate;

    totalTax += taxInBracket;
    bracketBreakdown.push({
      bracket: b.label,
      taxableAmount: amountInBracket,
      taxAmount: taxInBracket,
      rate: b.rate * 100,
    });

    remainingProfit -= amountInBracket;
    previousLimit = b.limit;
  }

  const effectiveRate = netProfit > 0 ? (totalTax / netProfit) * 100 : 0;

  return { totalTax, effectiveRate, bracketBreakdown };
}

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const Reports: React.FC<ReportsProps> = ({
  contacts,
  invoices,
  transactions,
  companySettings,
  employees = [],
}) => {
  const [activeTab, setActiveTab] = useState<"monthly" | "periodic" | "guidelines" | "ledger">("monthly");

  // Selected Taxpayer Type (Mükellefiyet Türü)
  const [activeTaxpayerType, setActiveTaxpayerType] = useState<string>(
    companySettings.taxpayerType || "Anonim Şirket"
  );

  // Filters & Sorting States (Same filter pattern as Finance Management)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // Default chronological
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // Active Period Filter State: Quarter (0..3), Month (0..11), or All
  const [selectedPeriod, setSelectedPeriod] = useState<
    | { type: "quarter"; index: number }
    | { type: "month"; index: number }
    | { type: "all" }
  >({ type: "quarter", index: 0 });

  // Additional Corporate Tax Parameters (KVK M.32 Adjustments)
  const [kkegAmount, setKkegAmount] = useState<number>(0); // Kanunen kabul edilmeyen giderler (+)
  const [exemptionsAmount, setExemptionsAmount] = useState<number>(0); // İndirim ve İstisnalar (-)
  const [priorLossesAmount, setPriorLossesAmount] = useState<number>(0); // Geçmiş Yıl Zararları (-)
  const [prepaidWithholdingAmount, setPrepaidWithholdingAmount] = useState<number>(0); // Kesinti yoluyla ödenen vergiler (-)

  // Quick Date Preset Handler
  const handleApplyPreset = (preset: "all" | "q1" | "q2" | "q3" | "q4" | "this_month" | "this_year") => {
    const yr = selectedYear;
    if (preset === "all" || preset === "this_year") {
      setSelectedPeriod({ type: "all" });
      setStartDate(`${yr}-01-01`);
      setEndDate(`${yr}-12-31`);
    } else if (preset === "this_month") {
      const currentM = new Date().getMonth();
      setSelectedPeriod({ type: "month", index: currentM });
      const mStr = String(currentM + 1).padStart(2, "0");
      setStartDate(`${yr}-${mStr}-01`);
      setEndDate(`${yr}-${mStr}-31`);
    } else if (preset === "q1") {
      setSelectedPeriod({ type: "quarter", index: 0 });
      setStartDate(`${yr}-01-01`);
      setEndDate(`${yr}-03-31`);
    } else if (preset === "q2") {
      setSelectedPeriod({ type: "quarter", index: 1 });
      setStartDate(`${yr}-04-01`);
      setEndDate(`${yr}-06-30`);
    } else if (preset === "q3") {
      setSelectedPeriod({ type: "quarter", index: 2 });
      setStartDate(`${yr}-07-01`);
      setEndDate(`${yr}-09-30`);
    } else if (preset === "q4") {
      setSelectedPeriod({ type: "quarter", index: 3 });
      setStartDate(`${yr}-10-01`);
      setEndDate(`${yr}-12-31`);
    }
  };

  // Fixed Official Stamp Duty Fees (Resmi Beyanname Damga Vergisi Tarifesi - GİB)
  const YILLIK_GELIR_DAMGA_VERGISI = 1189.50; // Yıllık Gelir Vergisi Beyannameleri
  const KURUMLAR_DAMGA_VERGISI = 1605.80; // Kurumlar Vergisi Beyannameleri
  const KDV_DAMGA_VERGISI = 791.00; // Katma Değer Vergisi Beyannameleri
  const SADECE_MUHTASAR_DAMGA_VERGISI = 791.00; // Muhtasar Beyannameler (Primsiz)
  const DIGER_VERGI_DAMGA_VERGISI = 791.00; // Diğer Vergi Beyannameleri (Damga Vergisi Beyannameleri Hariç)
  const GUMRUK_DAMGA_VERGISI = 1605.80; // Gümrük İdarelerine Verilen Beyannameler
  const BELEDIYE_DAMGA_VERGISI = 588.80; // Belediye ve İl Özel İdarelerine Verilen Beyannameler
  const SGK_PRIM_DAMGA_VERGISI = 588.80; // Sosyal Güvenlik Kurumlarına Verilen Sigorta Prim Bildirgeleri
  const MUHTASAR_PRIM_DAMGA_VERGISI = 939.70; // Muhtasar ve Prim Hizmet Beyannamesi

  const GECICI_DAMGA_VERGISI = DIGER_VERGI_DAMGA_VERGISI; // 791,00 TL (Diğer Vergi Beyannamesi Kapsamında)

  // Taxpayer Classifications
  const isCorporate = ["Anonim Şirket", "Limited Şirket"].includes(activeTaxpayerType);
  const isIndividual = activeTaxpayerType === "Gerçek Şahıs";
  const isPartnership = ["Adi Ortaklık", "Kollektif Şirket"].includes(activeTaxpayerType);
  const isExemptOrg = ["Dernek", "Vakıf", "Siyasi Parti", "Site Yönetimi", "Spor Kulübü"].includes(activeTaxpayerType);
  const isCoop = activeTaxpayerType === "Kooperatif";

  const YILLIK_DAMGA_VERGISI = (isCorporate || isCoop) ? KURUMLAR_DAMGA_VERGISI : YILLIK_GELIR_DAMGA_VERGISI;

  let taxFormulaDescription = "";
  if (isCorporate) {
    taxFormulaDescription = "Net Ticari Kar × %25 Kurumlar Vergisi (KVK M.32)";
  } else if (isIndividual || isPartnership) {
    taxFormulaDescription = "GVK M.103 Artan Oranlı Gelir Vergisi Tarifesi (%15 - %40)";
  } else if (isExemptOrg) {
    taxFormulaDescription = "İktisadi İşletmesi Bulunmayan Organizasyonlar Muaftır (KVK M.4)";
  } else if (isCoop) {
    taxFormulaDescription = "Ortak İçi İşlemlerde Muaf, Ortak Dışı İşlemlerde %25 Kurumlar Vergisi";
  }

  // -------------------------------------------------------------
  // CHRONOLOGICALLY SORTED GENERAL LEDGER ENTRIES (MUAVİN DÖKÜMÜ)
  // -------------------------------------------------------------
  const ledgerEntries = useMemo(() => {
    interface LedgerItem {
      id: string;
      date: string;
      typeLabel: string;
      category: string;
      documentNo: string;
      contactName: string;
      description: string;
      debit: number; // Borç / Çıkış
      credit: number; // Alacak / Giriş
      vatAmount: number;
      currency: string;
      source: "invoice" | "transaction";
    }

    const items: LedgerItem[] = [];

    // 1. Process Invoices
    invoices.forEach((inv) => {
      const invDate = inv.issueDate || `${selectedYear}-01-01`;
      const isSales = inv.type === "sales";
      items.push({
        id: `inv-${inv.id}`,
        date: invDate,
        typeLabel: isSales ? "Satış Faturası" : "Alış Faturası",
        category: isSales ? "Satış / Gelir" : "Alış / Gider",
        documentNo: inv.invoiceNumber || "-",
        contactName: inv.contactName || "Müşteri / Tedarikçi",
        description: inv.notes || `${isSales ? "Satış" : "Alış"} Faturası Kaydı`,
        debit: isSales ? 0 : inv.grandTotal,
        credit: isSales ? inv.grandTotal : 0,
        vatAmount: inv.totalVat || 0,
        currency: inv.currency || "TRY",
        source: "invoice",
      });
    });

    // 2. Process Transactions
    transactions.forEach((tx) => {
      const txDate = tx.date || `${selectedYear}-01-01`;
      const isIncome = tx.type === "income" || tx.type === "collection";
      items.push({
        id: `tx-${tx.id}`,
        date: txDate,
        typeLabel: isIncome ? "Tahsilat / Gelir" : "Ödeme / Gider",
        category: tx.category || "Finans",
        documentNo: tx.documentNo || "-",
        contactName: tx.contactName || tx.accountName || "Cari",
        description: tx.description || `${tx.accountName} işlemi`,
        debit: isIncome ? 0 : tx.amount,
        credit: isIncome ? tx.amount : 0,
        vatAmount: 0,
        currency: tx.currency || "TRY",
        source: "transaction",
      });
    });

    // Filter by year & date range & search
    return items
      .filter((item) => {
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;

        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          const matchContact = item.contactName.toLowerCase().includes(s);
          const matchDoc = item.documentNo.toLowerCase().includes(s);
          const matchDesc = item.description.toLowerCase().includes(s);
          const matchCategory = item.category.toLowerCase().includes(s);
          const matchType = item.typeLabel.toLowerCase().includes(s);
          if (!matchContact && !matchDoc && !matchDesc && !matchCategory && !matchType) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
  }, [invoices, transactions, startDate, endDate, searchTerm, sortOrder, selectedYear]);

  // Calculate Running Balance for General Ledger
  const ledgerWithRunningBalance = useMemo(() => {
    let running = 0;
    return ledgerEntries.map((item) => {
      running += item.credit - item.debit;
      return { ...item, runningBalance: running };
    });
  }, [ledgerEntries]);

  // -------------------------------------------------------------
  // DETAILED MONTH-BY-MONTH MATRIX (CHRONOLOGICAL 12 MONTHS)
  // -------------------------------------------------------------
  const monthlyTaxDetails = useMemo(() => {
    return MONTH_NAMES.map((monthName, mIdx) => {
      // Filter invoices by month
      const monthInvoices = invoices.filter((inv) => {
        const d = new Date(inv.issueDate);
        return d.getMonth() === mIdx && (d.getFullYear() === selectedYear || !inv.issueDate);
      });

      // Sort month invoices chronologically by date
      monthInvoices.sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());

      const mSalesInvoices = monthInvoices.filter((i) => i.type === "sales");
      const mPurchaseInvoices = monthInvoices.filter((i) => i.type === "purchase");

      const mSalesVat = mSalesInvoices.reduce((sum, i) => sum + (i.totalVat || 0), 0);
      const mPurchaseVat = mPurchaseInvoices.reduce((sum, i) => sum + (i.totalVat || 0), 0);

      const mSalesTotal = mSalesInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
      const mPurchaseTotal = mPurchaseInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

      // Filter transactions by month
      const monthTx = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === mIdx && (d.getFullYear() === selectedYear || !t.date);
      });

      // Sort month transactions chronologically by date
      monthTx.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const mIncomeTx = monthTx.filter((t) => t.type === "income" || t.type === "collection");
      const mExpenseTx = monthTx.filter((t) => t.type === "expense" || t.type === "payment");

      const mTxIncome = mIncomeTx.reduce((sum, t) => sum + t.amount, 0);
      const mTxExpense = mExpenseTx.reduce((sum, t) => sum + t.amount, 0);

      const mTotalIncome = mSalesTotal; // Sadece faturalı satışlar
      const mTotalExpense = mPurchaseTotal; // Sadece faturalı alışlar
      const mNetProfit = mTotalIncome - mTotalExpense; // Faturalı Net Matrah

      // Monthly VAT calculation
      const mNetVat = mSalesVat - mPurchaseVat;
      const mPayableVat = isExemptOrg ? 0 : Math.max(0, mNetVat);
      const mDeferredVat = isExemptOrg ? 0 : mNetVat < 0 ? Math.abs(mNetVat) : 0;
      const mKdvDamga = isExemptOrg ? 0 : KDV_DAMGA_VERGISI;

      // Monthly HR Payroll & Withholding (Muhtasar Stopaj)
      let mPayrollIncomeTax = 0;
      let mPayrollStampTax = 0;
      let mPayrollSgkShare = 0;

      if (employees.length > 0) {
        employees.forEach((emp) => {
          const gross = emp.salary || 20002.50;
          const sgkEmp = Math.round(gross * 0.15);
          const incTaxBase = Math.max(0, gross - sgkEmp);
          const incTax = Math.round(Math.max(0, incTaxBase * 0.15 - 2950));
          const stamp = Math.round(gross * 0.00759);
          const sgkEmployer = Math.round(gross * 0.205);

          mPayrollIncomeTax += incTax;
          mPayrollStampTax += stamp;
          mPayrollSgkShare += sgkEmp + sgkEmployer;
        });
      }

      // Rent Withholding (Kira Stopajı - %20)
      const rentTx = mExpenseTx.filter((t) =>
        (t.category || "").toLowerCase().includes("kira") || (t.description || "").toLowerCase().includes("kira")
      );
      const mRentAmount = rentTx.reduce((sum, t) => sum + t.amount, 0);
      const mRentWithholding = Math.round(mRentAmount * 0.20);

      // Total Withholding (Muhtasar Stopaj)
      const mTotalWithholding = mPayrollIncomeTax + mPayrollStampTax + mRentWithholding;
      const mMuhtasarDamga = (mTotalWithholding > 0 || employees.length > 0 || mRentAmount > 0)
        ? (employees.length > 0 ? MUHTASAR_PRIM_DAMGA_VERGISI : SADECE_MUHTASAR_DAMGA_VERGISI)
        : 0;

      // Total Monthly Tax Load
      const mTotalTaxLoad = mPayableVat + mKdvDamga + mTotalWithholding + mMuhtasarDamga;

      return {
        monthIndex: mIdx,
        monthName,
        monthInvoices,
        monthTx,
        salesTotal: mSalesTotal,
        purchaseTotal: mPurchaseTotal,
        txIncome: mTxIncome,
        txExpense: mTxExpense,
        totalIncome: mTotalIncome,
        totalExpense: mTotalExpense,
        netProfit: mNetProfit,
        salesVat: mSalesVat,
        purchaseVat: mPurchaseVat,
        payableVat: mPayableVat,
        deferredVat: mDeferredVat,
        kdvDamga: mKdvDamga,
        payrollIncomeTax: mPayrollIncomeTax,
        payrollStampTax: mPayrollStampTax,
        payrollSgkShare: mPayrollSgkShare,
        rentAmount: mRentAmount,
        rentWithholding: mRentWithholding,
        totalWithholding: mTotalWithholding,
        muhtasarDamga: mMuhtasarDamga,
        totalTaxLoad: mTotalTaxLoad,
        invoiceCount: monthInvoices.length,
        txCount: monthTx.length,
      };
    });
  }, [invoices, transactions, employees, selectedYear, isExemptOrg]);

  // Annual Totals from 12 Months
  const annualSalesVat = monthlyTaxDetails.reduce((sum, m) => sum + m.salesVat, 0);
  const annualPurchaseVat = monthlyTaxDetails.reduce((sum, m) => sum + m.purchaseVat, 0);
  const annualPayableVat = monthlyTaxDetails.reduce((sum, m) => sum + m.payableVat, 0);
  const annualKdvDamga = monthlyTaxDetails.reduce((sum, m) => sum + m.kdvDamga, 0);
  const annualWithholding = monthlyTaxDetails.reduce((sum, m) => sum + m.totalWithholding, 0);
  const annualMuhtasarDamga = monthlyTaxDetails.reduce((sum, m) => sum + m.muhtasarDamga, 0);
  const annualMonthlyTaxLoad = monthlyTaxDetails.reduce((sum, m) => sum + m.totalTaxLoad, 0);

  // -------------------------------------------------------------
  // QUARTERLY PROVISIONAL TAX & ANNUAL SETTLEMENT
  // -------------------------------------------------------------
  const calculateQuarter = (qIdx: number) => {
    const startM = qIdx * 3;
    const endM = startM + 2;

    let cumulativeIncome = 0;
    let cumulativeExpense = 0;
    for (let m = 0; m <= endM; m++) {
      cumulativeIncome += monthlyTaxDetails[m].totalIncome;
      cumulativeExpense += monthlyTaxDetails[m].totalExpense;
    }
    const cumulativeProfit = Math.max(0, cumulativeIncome - cumulativeExpense);

    let qIncome = 0;
    let qExpense = 0;
    for (let m = startM; m <= endM; m++) {
      qIncome += monthlyTaxDetails[m].totalIncome;
      qExpense += monthlyTaxDetails[m].totalExpense;
    }
    const qProfit = Math.max(0, qIncome - qExpense);

    let cumulativeTax = 0;
    if (isCorporate) {
      cumulativeTax = cumulativeProfit * 0.25;
    } else if (isIndividual || isPartnership) {
      cumulativeTax = calculateIndividualIncomeTax(cumulativeProfit).totalTax;
    } else if (isCoop) {
      cumulativeTax = cumulativeProfit * 0.25;
    } else {
      cumulativeTax = 0;
    }

    return {
      qIndex: qIdx + 1,
      qName: `${qIdx + 1}. Dönem (${MONTH_NAMES[startM]} - ${MONTH_NAMES[endM]})`,
      qIncome,
      qExpense,
      qProfit,
      cumulativeProfit,
      cumulativeTax,
      damgaVergisi: isExemptOrg ? 0 : GECICI_DAMGA_VERGISI,
      dueDate: qIdx === 0 ? "17 Mayıs" : qIdx === 1 ? "17 Ağustos" : qIdx === 2 ? "17 Kasım" : "17 Şubat",
    };
  };

  const quarterDetails = [0, 1, 2, 3].map((qIdx) => {
    const q = calculateQuarter(qIdx);
    const prevCumTax = qIdx > 0 ? calculateQuarter(qIdx - 1).cumulativeTax : 0;
    const qPayableTax = Math.max(0, q.cumulativeTax - prevCumTax);
    return { ...q, qPayableTax };
  });

  const totalGeçiciVergiPayable = quarterDetails.reduce((sum, q) => sum + q.qPayableTax, 0);
  const totalGeçiciDamga = quarterDetails.reduce((sum, q) => sum + q.damgaVergisi, 0);

  const totalYearIncome = monthlyTaxDetails.reduce((s, m) => s + m.totalIncome, 0);
  const totalYearExpense = monthlyTaxDetails.reduce((s, m) => s + m.totalExpense, 0);
  const totalYearNetProfit = Math.max(0, totalYearIncome - totalYearExpense);

  // -------------------------------------------------------------
  // KURUMLAR VERGİSİ HESAPLAMA MATRİSİ (5520 SAYILI KVK M.32)
  // -------------------------------------------------------------
  // Kurumlar Vergisi Matrahı = Ticari Bilanço Karı + KKEG - İndirim/İstisna - Geçmiş Yıl Zararları
  const corporateTaxableBase = Math.max(
    0,
    totalYearNetProfit + (kkegAmount || 0) - (exemptionsAmount || 0) - (priorLossesAmount || 0)
  );

  const corporateTaxRate = 0.25; // %25 Sabit Oran (KVK M.32)
  const calculatedCorporateTax = (isCorporate || isCoop)
    ? Math.round(corporateTaxableBase * corporateTaxRate)
    : 0;

  let totalYearCalculatedTax = 0;
  if (isCorporate || isCoop) {
    totalYearCalculatedTax = calculatedCorporateTax;
  } else if (isIndividual || isPartnership) {
    totalYearCalculatedTax = calculateIndividualIncomeTax(totalYearNetProfit).totalTax;
  }

  // Net Kurumlar Vergisi Mahsubu (Ödenen Geçici Vergi + Kesinti Yoluyla Ödenen Stopajlar)
  const totalPrepaidDeductions = totalGeçiciVergiPayable + (prepaidWithholdingAmount || 0);
  const netPayableCorporateTax = Math.max(0, calculatedCorporateTax - totalPrepaidDeductions);
  const corporateRefundTax = calculatedCorporateTax < totalPrepaidDeductions
    ? totalPrepaidDeductions - calculatedCorporateTax
    : 0;

  const finalPayableAnnualTax = (isCorporate || isCoop)
    ? netPayableCorporateTax
    : Math.max(0, totalYearCalculatedTax - totalGeçiciVergiPayable);

  // Render Date Filter Bar (Matching Finance Management layout)
  const renderDateFilterBar = (title: string) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-purple-50 text-purple-700 font-bold">
            <Filter className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500 font-medium">Çeyrek ve ay bazında tarih filtresi ve sıralama</p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari, Belge No, Açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-bold mr-1">Hızlı Çeyrek / Dönem:</span>
          <button
            onClick={() => handleApplyPreset("this_year")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              selectedPeriod.type === "all"
                ? "bg-purple-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700"
            }`}
          >
            Tüm Yıl ({selectedYear})
          </button>
          <button
            onClick={() => handleApplyPreset("q1")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              selectedPeriod.type === "quarter" && selectedPeriod.index === 0
                ? "bg-purple-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700"
            }`}
          >
            1. Çeyrek
          </button>
          <button
            onClick={() => handleApplyPreset("q2")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              selectedPeriod.type === "quarter" && selectedPeriod.index === 1
                ? "bg-purple-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700"
            }`}
          >
            2. Çeyrek
          </button>
          <button
            onClick={() => handleApplyPreset("q3")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              selectedPeriod.type === "quarter" && selectedPeriod.index === 2
                ? "bg-purple-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700"
            }`}
          >
            3. Çeyrek
          </button>
          <button
            onClick={() => handleApplyPreset("q4")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] font-bold ${
              selectedPeriod.type === "quarter" && selectedPeriod.index === 3
                ? "bg-purple-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700"
            }`}
          >
            4. Çeyrek
          </button>
        </div>

        {/* Date Inputs & Sort Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800"
            />
            <span>-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800"
            />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-1 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold"
            title="Tarihe Göre Sırala"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-700" />
            <span>Tarih: {sortOrder === "asc" ? "Eskiden Yeniye" : "Yeniden Eskiye"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-7xl mx-auto text-slate-900">
      {/* TOP BANNER - Matching Finance Management Top Header Design */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-6 border border-purple-200/60 shadow-2xs space-y-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
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
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-400/10"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-purple-700" />
                Finans & Vergi Modülü
              </span>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                2026 Mevzuat Uyumlu
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              Vergilendirme ve Mali Yükümlülük Portalı
            </h1>
            <p className="text-xs sm:text-sm text-purple-950/80 font-semibold leading-relaxed">
              Mükellefiyet türünüze uygun tarih ve dönem bazlı KDV, Muhtasar, SGK, Geçici Vergi ve Yıllık Beyanname dökümleri.
            </p>
          </div>

          {/* Taxpayer Switcher Box */}
          <div className="bg-white/80 backdrop-blur-md border border-purple-200/80 p-4 rounded-2xl space-y-2 min-w-[280px] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-purple-950">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-700" />
                Mükellefiyet Türü:
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-mono font-extrabold">
                {selectedYear} Mali Yılı
              </span>
            </div>

            <select
              value={activeTaxpayerType}
              onChange={(e) => setActiveTaxpayerType(e.target.value)}
              className="w-full bg-white text-slate-900 border border-purple-300 rounded-xl p-2.5 font-bold text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {TAXPAYER_TYPES.map((type) => (
                <option key={type} value={type} className="bg-white text-slate-900">
                  {type}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-[11px] text-purple-950 font-bold pt-1">
              <span>Yıl Seçimi:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-purple-50 text-purple-900 border border-purple-200 rounded px-2.5 py-1 text-xs font-mono font-bold cursor-pointer"
              >
                <option value={2026}>2026 Mali Yılı</option>
                <option value={2025}>2025 Mali Yılı</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5 SUMMARY STAT CARDS (Matching Finance Management Card Design) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-5 relative z-10">
          {/* Card 1: Mükellef Rejimi */}
          <div className="bg-white/90 border border-purple-200/80 rounded-2xl p-4 text-left shadow-2xs backdrop-blur-md hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-purple-950 tracking-wider">
              <span>Mükellef Rejimi</span>
              <Briefcase className="w-4 h-4 text-purple-700" />
            </div>
            <div className="mt-2 text-base font-black text-purple-950 truncate">
              {activeTaxpayerType}
            </div>
            <p className="text-[10px] font-semibold text-purple-900/80 mt-1 truncate">
              {taxFormulaDescription}
            </p>
          </div>

          {/* Card 2: Ödenecek KDV */}
          <div className="bg-white/90 border border-amber-200/80 rounded-2xl p-4 text-left shadow-2xs backdrop-blur-md hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-amber-950 tracking-wider">
              <span>Yıllık Ödenecek KDV</span>
              <Receipt className="w-4 h-4 text-amber-700" />
            </div>
            <div className="mt-2 text-lg font-black text-amber-950 font-mono">
              {isExemptOrg ? "₺0,00" : `₺${annualPayableVat.toLocaleString("tr-TR")}`}
            </div>
            <p className="text-[10px] font-semibold text-amber-900/80 mt-1 flex justify-between">
              <span>Satış: ₺{annualSalesVat.toLocaleString("tr-TR")}</span>
              <span>Alış: ₺{annualPurchaseVat.toLocaleString("tr-TR")}</span>
            </p>
          </div>

          {/* Card 3: Muhtasar & Stopaj */}
          <div className="bg-white/90 border border-indigo-200/80 rounded-2xl p-4 text-left shadow-2xs backdrop-blur-md hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-indigo-950 tracking-wider">
              <span>Muhtasar & Stopaj</span>
              <FileCheck className="w-4 h-4 text-indigo-700" />
            </div>
            <div className="mt-2 text-lg font-black text-indigo-950 font-mono">
              ₺{annualWithholding.toLocaleString("tr-TR")}
            </div>
            <p className="text-[10px] font-semibold text-indigo-900/80 mt-1">
              GV + SGK + Kira Stopaj Toplamı
            </p>
          </div>

          {/* Card 4: Gelir / Kurumlar Vergisi */}
          <div className="bg-white/90 border border-emerald-200/80 rounded-2xl p-4 text-left shadow-2xs backdrop-blur-md hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-emerald-950 tracking-wider">
              <span>{isCorporate || isCoop ? "Kurumlar Vergisi (%25)" : "Gelir Vergisi (Tarifeli)"}</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 text-lg font-black text-emerald-950 font-mono">
              ₺{totalYearCalculatedTax.toLocaleString("tr-TR")}
            </div>
            <p className="text-[10px] font-semibold text-emerald-900/80 mt-1 truncate">
              {isCorporate || isCoop
                ? `Matrah: ₺${corporateTaxableBase.toLocaleString("tr-TR")}`
                : "Artan Oranlı Tarife (GVK M.103)"}
            </p>
          </div>

          {/* Card 5: Toplam Yıllık Yük */}
          <div className="bg-white/90 border border-blue-200/80 rounded-2xl p-4 text-left shadow-2xs backdrop-blur-md hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-blue-950 tracking-wider">
              <span>Toplam Mali Yük</span>
              <Calculator className="w-4 h-4 text-blue-700" />
            </div>
            <div className="mt-2 text-lg font-black text-blue-950 font-mono">
              ₺{(annualMonthlyTaxLoad + totalYearCalculatedTax + totalGeçiciDamga + YILLIK_DAMGA_VERGISI).toLocaleString("tr-TR")}
            </div>
            <p className="text-[10px] font-semibold text-blue-900/80 mt-1">
              Tüm Yasal Vergiler + Damga
            </p>
          </div>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION - Matching Finance Management Subtab Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "monthly"
              ? "bg-purple-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Receipt className="w-4 h-4" />
          1. 12 Aylık Vergi Detay Matrisi (KDV & Muhtasar & Damga)
        </button>

        <button
          onClick={() => setActiveTab("periodic")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "periodic"
              ? "bg-purple-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Percent className="w-4 h-4" />
          2. 4 Dönemlik Geçici Vergi & Yıllık Mahsup
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "ledger"
              ? "bg-purple-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          3. Genel Muavin & Defter Kayıtları (Tarih Sıralı)
        </button>

        <button
          onClick={() => setActiveTab("guidelines")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "guidelines"
              ? "bg-purple-900 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          4. Vergi Takvimi & Mevzuat Rehberi
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DÖNEMSEL VERGİ VE ALIM-SATIM DETAY RAPORU */}
      {/* ========================================================================= */}
      {activeTab === "monthly" && (
        <div className="space-y-4 animate-fadeIn">
          {renderDateFilterBar("Dönemsel Vergi ve Ay Analiz Filtresi")}

          {/* PERIOD & MONTH SELECTOR PILLS BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            {/* 1. ÇEYREK SEÇİMİ (4 DÖNEM GEÇİCİ VERGİ) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                <span className="flex items-center gap-1.5 text-purple-950 font-black">
                  <Percent className="w-4 h-4 text-purple-700" />
                  Dönemsel Çeyrek Seçimi (4 Dönem Geçici Vergi & Mali Yıl):
                </span>
                <span className="text-[11px] font-mono text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 font-bold">
                  {selectedYear} Mali Yılı
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {[
                  { label: "1. Çeyrek (Oca - Mar)", key: "q1", qIdx: 0, sub: "1. Geçici Vergi Dönemi" },
                  { label: "2. Çeyrek (Nis - Haz)", key: "q2", qIdx: 1, sub: "2. Geçici Vergi Dönemi" },
                  { label: "3. Çeyrek (Tem - Eyl)", key: "q3", qIdx: 2, sub: "3. Geçici Vergi Dönemi" },
                  { label: "4. Çeyrek (Ek - Ara)", key: "q4", qIdx: 3, sub: "4. Geçici Vergi Dönemi" },
                  { label: `Tüm Yıl (${selectedYear})`, key: "all", qIdx: -1, sub: "Yıllık Beyanname Dökümü" },
                ].map((item) => {
                  const isSelected = item.qIdx === -1
                    ? selectedPeriod.type === "all"
                    : selectedPeriod.type === "quarter" && selectedPeriod.index === item.qIdx;

                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        if (item.qIdx === -1) {
                          handleApplyPreset("all");
                        } else {
                          handleApplyPreset(item.key as any);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between border ${
                        isSelected
                          ? "bg-purple-900 text-white border-purple-900 shadow-sm ring-2 ring-purple-500/40"
                          : "bg-purple-50/60 hover:bg-purple-100 text-purple-950 border-purple-200/80"
                      }`}
                    >
                      <span className="text-xs font-black truncate">{item.label}</span>
                      <span className={`text-[10px] mt-0.5 font-medium truncate ${isSelected ? "text-purple-200" : "text-purple-700/80"}`}>
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. AYLIK DETAY SEÇİMİ (12 AY) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Tekil Ay Seçimi (Aylık Break-down):
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {MONTH_NAMES.map((mName, mIdx) => {
                  const mData = monthlyTaxDetails[mIdx];
                  const totalActivity = mData.invoiceCount + mData.txCount;
                  const isSelected = selectedPeriod.type === "month" && selectedPeriod.index === mIdx;

                  return (
                    <button
                      key={mIdx}
                      onClick={() => {
                        setSelectedPeriod({ type: "month", index: mIdx });
                        const mStr = String(mIdx + 1).padStart(2, "0");
                        setStartDate(`${selectedYear}-${mStr}-01`);
                        setEndDate(`${selectedYear}-${mStr}-31`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-purple-900 text-white shadow-xs font-black ring-2 ring-purple-500/50"
                          : totalActivity > 0
                          ? "bg-slate-100 text-slate-800 hover:bg-purple-100 hover:text-purple-900 border border-slate-200"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                    >
                      <span>{mName}</span>
                      {totalActivity > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                            isSelected ? "bg-purple-950 text-purple-200" : "bg-purple-200 text-purple-950"
                          }`}
                        >
                          {totalActivity}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DYNAMIC PERIOD DETAILS & STATUTORY TAXES */}
          {(() => {
            let periodTitle = "";
            let periodBadge = "";
            let periodMonths: number[] = [];

            if (selectedPeriod.type === "quarter") {
              const qIdx = selectedPeriod.index;
              periodMonths = [qIdx * 3, qIdx * 3 + 1, qIdx * 3 + 2];
              periodTitle = `${qIdx + 1}. Çeyrek (${MONTH_NAMES[qIdx * 3]} - ${MONTH_NAMES[qIdx * 3 + 2]} ${selectedYear}) Beyanname, Vergi ve Alım-Satım Analizi`;
              periodBadge = `${qIdx + 1}. Geçici Vergi Dönemi | Son Ödeme: ${
                qIdx === 0 ? "17 Mayıs" : qIdx === 1 ? "17 Ağustos" : qIdx === 2 ? "17 Kasım" : "17 Şubat"
              }`;
            } else if (selectedPeriod.type === "month") {
              const mIdx = selectedPeriod.index;
              periodMonths = [mIdx];
              periodTitle = `${MONTH_NAMES[mIdx]} ${selectedYear} Ayı Beyanname, Vergi ve Alım-Satım Analizi`;
              periodBadge = `${MONTH_NAMES[mIdx]} Ayı Detayı`;
            } else {
              periodMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
              periodTitle = `${selectedYear} Mali Yılı Tüm Dönemler Vergi ve Alım-Satım Analizi`;
              periodBadge = `2026 Yıllık Rapor`;
            }

            const targetMonthlyDetails = periodMonths.map((mIdx) => monthlyTaxDetails[mIdx]);

            const periodIncome = targetMonthlyDetails.reduce((sum, m) => sum + m.totalIncome, 0);
            const periodExpense = targetMonthlyDetails.reduce((sum, m) => sum + m.totalExpense, 0);
            const periodNetProfit = periodIncome - periodExpense;

            const periodSalesVat = targetMonthlyDetails.reduce((sum, m) => sum + m.salesVat, 0);
            const periodPurchaseVat = targetMonthlyDetails.reduce((sum, m) => sum + m.purchaseVat, 0);
            const periodPayableVat = targetMonthlyDetails.reduce((sum, m) => sum + m.payableVat, 0);
            const periodNetVat = periodSalesVat - periodPurchaseVat;
            const periodDeferredVat = isExemptOrg ? 0 : periodNetVat < 0 ? Math.abs(periodNetVat) : 0;
            const periodKdvDamga = targetMonthlyDetails.reduce((sum, m) => sum + m.kdvDamga, 0);

            const periodRentAmount = targetMonthlyDetails.reduce((sum, m) => sum + m.rentAmount, 0);
            const periodRentWithholding = targetMonthlyDetails.reduce((sum, m) => sum + m.rentWithholding, 0);
            const periodPayrollIncomeTax = targetMonthlyDetails.reduce((sum, m) => sum + m.payrollIncomeTax, 0);
            const periodPayrollStampTax = targetMonthlyDetails.reduce((sum, m) => sum + m.payrollStampTax, 0);
            const periodTotalWithholding = targetMonthlyDetails.reduce((sum, m) => sum + m.totalWithholding, 0);
            const periodMuhtasarDamga = targetMonthlyDetails.reduce((sum, m) => sum + m.muhtasarDamga, 0);
            const periodPayrollSgkShare = targetMonthlyDetails.reduce((sum, m) => sum + m.payrollSgkShare, 0);

            // Calculate Provisional / Corporate Tax for the selected period
            let provisionalTaxTitle = isCorporate ? "Geçici Kurumlar Vergisi (%25)" : "Geçici Gelir Vergisi";
            let provisionalTaxBase = 0;
            let provisionalTaxPayable = 0;
            let provisionalTaxDescription = "";

            if (selectedPeriod.type === "quarter") {
              const qIdx = selectedPeriod.index;
              const qData = quarterDetails[qIdx];
              provisionalTaxBase = qData.qProfit;
              provisionalTaxPayable = qData.qPayableTax;
              provisionalTaxDescription = `${qIdx + 1}. Çeyrek net karı (₺${qData.qProfit.toLocaleString("tr-TR")}) ve kumulatif matrah (₺${qData.cumulativeProfit.toLocaleString("tr-TR")}) üzerinden hesaplanan ödenecek geçici vergi.`;
            } else if (selectedPeriod.type === "month") {
              const mIdx = selectedPeriod.index;
              provisionalTaxBase = Math.max(0, periodNetProfit);
              const estimatedTaxRate = isCorporate ? 0.25 : 0.15;
              provisionalTaxPayable = Math.max(0, Math.round(provisionalTaxBase * estimatedTaxRate));
              provisionalTaxDescription = `${MONTH_NAMES[mIdx]} ayının net matrahı üzerinden hesaplanan tahmini vergi payı.`;
            } else {
              provisionalTaxBase = Math.max(0, totalYearNetProfit);
              provisionalTaxPayable = totalYearCalculatedTax;
              provisionalTaxDescription = `Tüm yıl net matrahı üzerinden hesaplanan yıllık toplam vergi.`;
            }

            // Filter invoices for selected period
            const periodInvoices = invoices.filter((inv) => {
              const d = new Date(inv.issueDate);
              const monthMatch = periodMonths.includes(d.getMonth()) && (d.getFullYear() === selectedYear || !inv.issueDate);
              if (!monthMatch) return false;

              if (startDate && inv.issueDate < startDate) return false;
              if (endDate && inv.issueDate > endDate) return false;

              if (searchTerm) {
                const s = searchTerm.toLowerCase();
                const matchContact = (inv.contactName || "").toLowerCase().includes(s);
                const matchDoc = (inv.invoiceNumber || "").toLowerCase().includes(s);
                const matchNotes = (inv.notes || "").toLowerCase().includes(s);
                if (!matchContact && !matchDoc && !matchNotes) return false;
              }
              return true;
            }).sort((a, b) => {
              const timeA = new Date(a.issueDate).getTime();
              const timeB = new Date(b.issueDate).getTime();
              return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
            });

            const periodSalesInvoices = periodInvoices.filter((i) => i.type === "sales");
            const periodPurchaseInvoices = periodInvoices.filter((i) => i.type === "purchase");

            return (
              <div className="space-y-5 animate-fadeIn">
                {/* Header for Selected Period */}
                <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <Calendar className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2.5 py-0.5 rounded-full">
                          {activeTaxpayerType}
                        </span>
                        <span className="text-xs font-mono text-purple-300">
                          {periodBadge}
                        </span>
                      </div>
                      <h3 className="text-lg font-black mt-0.5">
                        {periodTitle}
                      </h3>
                    </div>
                  </div>

                  <ExportButtons
                    getExportData={() => ({
                      filename: `Muavin_Dönemsel_Vergi_Raporu_${selectedYear}`,
                      title: `${periodTitle.toUpperCase()} (${activeTaxpayerType})`,
                      subtitle: `Dönem: ${periodBadge} | Tarih: ${new Date().toLocaleDateString("tr-TR")}`,
                      headers: [
                        "Tür / İşlem", "Matrah / Tutar", "KDV / Vergi", "Net Yük / Toplam"
                      ],
                      rows: [
                        ["Faturalı Satışlar", formatCurrency(periodIncome, "TRY"), formatCurrency(periodSalesVat, "TRY"), formatCurrency(periodIncome, "TRY")],
                        ["Faturalı Alışlar", formatCurrency(periodExpense, "TRY"), formatCurrency(periodPurchaseVat, "TRY"), formatCurrency(periodExpense, "TRY")],
                        ["Faturalı Net Matrah", formatCurrency(periodNetProfit, "TRY"), "-", formatCurrency(periodNetProfit, "TRY")],
                        ["Ödenecek / Devreden KDV", "-", formatCurrency(periodSalesVat - periodPurchaseVat, "TRY"), formatCurrency(periodPayableVat, "TRY")],
                        ["Muhtasar Stopaj", formatCurrency(periodRentAmount, "TRY"), formatCurrency(periodTotalWithholding, "TRY"), formatCurrency(periodTotalWithholding, "TRY")],
                        ["SGK Primi Yükü", "-", "-", formatCurrency(periodPayrollSgkShare, "TRY")],
                        [provisionalTaxTitle, formatCurrency(provisionalTaxBase, "TRY"), "-", formatCurrency(provisionalTaxPayable, "TRY")],
                      ],
                    })}
                    size="sm"
                  />
                </div>

                {/* STATUTORY OBLIGATIONS CARDS (4 Main Categories: Geçici/Kurumlar, Stopaj, SGK, KDV) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Geçici / Kurumlar Vergisi Card */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900">
                          {provisionalTaxTitle}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-100">
                        {isCorporate ? "%25" : "GVK Tariff"}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span>Dönem Net Matrahı:</span>
                        <span className="font-mono font-bold text-slate-900">₺{provisionalTaxBase.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 text-purple-950 font-bold">
                        <span>Ödenecek Geçici Vergi:</span>
                        <span className="font-mono text-sm text-purple-900 font-extrabold">
                          ₺{provisionalTaxPayable.toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                      {provisionalTaxDescription}
                    </div>
                  </div>

                  {/* 2. Muhtasar Stopaj Vergisi Card */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-900">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900">Muhtasar Stopaj</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-100">
                        Stopaj
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span>Kira Stopajı (%20):</span>
                        <span className="font-mono font-bold text-slate-900">₺{periodRentWithholding.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Personel GV Stopajı:</span>
                        <span className="font-mono font-bold text-slate-900">₺{periodPayrollIncomeTax.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beyanname Damga Vergisi:</span>
                        <span className="font-mono font-bold text-slate-900">₺{periodMuhtasarDamga.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-indigo-950">
                        <span>Toplam Stopaj Yükü:</span>
                        <span className="font-mono text-sm text-indigo-900 font-extrabold">
                          ₺{(periodTotalWithholding + periodMuhtasarDamga).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. SGK Sigorta Primi Card */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                          <Users className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900">SGK Sigorta Primi</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-100">
                        {employees.length} Personel
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span>İşçi SGK Hissesi (%15):</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₺{(periodMonths.length * employees.reduce((sum, emp) => sum + Math.round((emp.salary || 20002.5) * 0.15), 0)).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>İşveren SGK Hissesi (%20.5):</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₺{(periodMonths.length * employees.reduce((sum, emp) => sum + Math.round((emp.salary || 20002.5) * 0.205), 0)).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-emerald-950">
                        <span>Toplam SGK Yükü:</span>
                        <span className="font-mono text-sm text-emerald-700 font-extrabold">
                          ₺{periodPayrollSgkShare.toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Katma Değer Vergisi (KDV) Card */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900">KDV Beyannamesi</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-100">
                        KDV1
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                      <div className="flex justify-between">
                        <span>Hesaplanan (Satış) KDV:</span>
                        <span className="font-mono font-bold text-slate-900">₺{periodSalesVat.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>İndirilecek (Alış) KDV:</span>
                        <span className="font-mono font-bold text-slate-900">₺{periodPurchaseVat.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>KDV Damga Vergisi:</span>
                        <span className="font-mono font-bold text-slate-900">₺{periodKdvDamga.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-amber-950">
                        <span>{periodDeferredVat > 0 ? "Devreden KDV:" : "Ödenecek KDV:"}</span>
                        <span className={`font-mono text-sm font-extrabold ${periodDeferredVat > 0 ? "text-blue-700" : "text-amber-950"}`}>
                          ₺{(periodDeferredVat > 0 ? periodDeferredVat : periodPayableVat).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DETAILED INVOICE BREAKDOWN (ALIM & SATIŞ DETAYLARI) FOR SELECTED PERIOD */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Faturalı Satışlar Tablosu */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">Faturalı Satışlar ({periodSalesInvoices.length})</h4>
                          <p className="text-[11px] text-slate-500 font-medium">Seçilen dönemde kesilen tüm satış faturaları</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                        Toplam: ₺{periodIncome.toLocaleString("tr-TR")}
                      </span>
                    </div>

                    {periodSalesInvoices.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
                        Seçilen döneme ait kesilmiş satış faturası bulunmamaktadır.
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse min-w-[450px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                              <th className="p-2.5">Tarih</th>
                              <th className="p-2.5">Fatura No</th>
                              <th className="p-2.5">Müşteri / Unvan</th>
                              <th className="p-2.5 text-right">Matrah (Net)</th>
                              <th className="p-2.5 text-right">KDV</th>
                              <th className="p-2.5 text-right">Toplam</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {periodSalesInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-emerald-50/40 transition-colors">
                                <td className="p-2.5 font-mono text-slate-700">{formatDate(inv.issueDate)}</td>
                                <td className="p-2.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                                <td className="p-2.5 font-semibold text-slate-800 truncate max-w-[150px]">{inv.contactName}</td>
                                <td className="p-2.5 text-right font-mono text-slate-700">₺{(inv.subtotal || 0).toLocaleString("tr-TR")}</td>
                                <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">₺{(inv.totalVat || 0).toLocaleString("tr-TR")}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-800">₺{(inv.grandTotal || 0).toLocaleString("tr-TR")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Faturalı Alışlar Tablosu */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">Faturalı Alışlar ({periodPurchaseInvoices.length})</h4>
                          <p className="text-[11px] text-slate-500 font-medium">Seçilen dönemde alınan tüm alış faturaları ve gider belgeleri</p>
                        </div>
                      </div>
                      <span className="font-mono font-black text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                        Toplam: ₺{periodExpense.toLocaleString("tr-TR")}
                      </span>
                    </div>

                    {periodPurchaseInvoices.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
                        Seçilen döneme ait alış faturası bulunmamaktadır.
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse min-w-[450px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border-b border-slate-200">
                              <th className="p-2.5">Tarih</th>
                              <th className="p-2.5">Fatura No</th>
                              <th className="p-2.5">Tedarikçi / Unvan</th>
                              <th className="p-2.5 text-right">Matrah (Net)</th>
                              <th className="p-2.5 text-right">KDV</th>
                              <th className="p-2.5 text-right">Toplam</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {periodPurchaseInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-rose-50/40 transition-colors">
                                <td className="p-2.5 font-mono text-slate-700">{formatDate(inv.issueDate)}</td>
                                <td className="p-2.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                                <td className="p-2.5 font-semibold text-slate-800 truncate max-w-[150px]">{inv.contactName}</td>
                                <td className="p-2.5 text-right font-mono text-slate-700">₺{(inv.subtotal || 0).toLocaleString("tr-TR")}</td>
                                <td className="p-2.5 text-right font-mono text-indigo-700 font-semibold">₺{(inv.totalVat || 0).toLocaleString("tr-TR")}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-rose-800">₺{(inv.grandTotal || 0).toLocaleString("tr-TR")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DÖNEMSEL VE YILLIK VERGİ HESAPLAYICISI */}
      {/* ========================================================================= */}
      {activeTab === "periodic" && (
        <div className="space-y-4 animate-fadeIn">
          {renderDateFilterBar("Dönemsel Vergi Hesaplama Filtresi")}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full">
                    {activeTaxpayerType}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    GİB Mevzuatı {selectedYear}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  4 Dönemlik Geçici Vergi & Yıllık Mahsup Dökümü
                </h3>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Geçici Vergi Oranı: {isCorporate ? "%25 Düz Oran" : "%15 - %40 Artan Oranlı"}</span>
              </div>
            </div>

            {/* 4 Quarterly Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quarterDetails.map((q) => (
                <div
                  key={q.qIndex}
                  className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold text-purple-300 border-b border-slate-800 pb-2">
                      <span>{q.qName}</span>
                      <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono">
                        {q.dueDate}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 font-medium">
                      <div className="flex justify-between">
                        <span>Dönemsel Gelir:</span>
                        <span className="font-mono text-emerald-400">₺{q.qIncome.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dönemsel Gider:</span>
                        <span className="font-mono text-rose-300">₺{q.qExpense.toLocaleString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white">
                        <span>Kümülatif Matrah:</span>
                        <span className="font-mono">₺{q.cumulativeProfit.toLocaleString("tr-TR")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400">Hesaplanan Geçici Vergi:</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      ₺{q.qPayableTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Beyanname Damgası:</span>
                      <span className="font-mono text-slate-300">₺{q.damgaVergisi.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Annual Settlement Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              <div className="lg:col-span-2 space-y-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>Yıllık Beyanname Mahsup ve Net Ödeme Özeti ({selectedYear})</span>
                    <span className="text-xs text-purple-900 font-bold bg-purple-100 px-2.5 py-0.5 rounded-full">
                      {isCorporate ? "Son Gün: 30 Nisan" : "Son Gün: 31 Mart"}
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-semibold block">Yıllık Toplam Matrah:</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        ₺{totalYearNetProfit.toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-semibold block">Ödenen Geçici Vergiler:</span>
                      <span className="text-lg font-black text-indigo-700 font-mono">
                        ₺{totalGeçiciVergiPayable.toLocaleString("tr-TR")}
                      </span>
                    </div>

                    <div className="bg-purple-900 text-white p-3 rounded-xl space-y-1 shadow-xs">
                      <span className="text-purple-200 font-semibold block">Net Ödenecek Yıllık Vergi:</span>
                      <span className="text-xl font-black text-emerald-300 font-mono">
                        ₺{finalPayableAnnualTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Kurumlar Vergisi Beyannamesi & Hesaplama Cetveli (KVK M.32) */}
                  {(isCorporate || isCoop) && (
                    <div className="space-y-4 pt-3 border-t border-slate-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-900 text-white p-3.5 rounded-xl shadow-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-purple-300" />
                          <div>
                            <h5 className="font-extrabold text-xs sm:text-sm">
                              Kurumlar Vergisi Beyanname ve Hesaplama Cetveli (5520 Sayılı KVK M.32)
                            </h5>
                            <p className="text-[11px] text-purple-200 font-medium">
                              {selectedYear} Mali Yılı %25 Oranlı Kurumlar Vergisi Matrah ve Mahsup Tablosu
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold bg-purple-950 text-emerald-300 border border-purple-700 px-3 py-1 rounded-lg">
                          Oran: %25 Sabit
                        </span>
                      </div>

                      {/* Interactive Matrah Adjustment Parameters */}
                      <div className="bg-white p-4 rounded-xl border border-purple-200/80 space-y-3 shadow-2xs">
                        <div className="text-xs font-extrabold text-purple-950 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-purple-700" />
                            Matrah ve Mahsup Düzeltme Parametreleri (GİB Beyanname Kalemleri):
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">Tüm değerler ₺ (TL) cinsindendir</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
                          {/* KKEG */}
                          <div className="space-y-1 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                            <label className="text-purple-950 font-bold block text-[11px]">
                              (+) KKEG (Kanunen Kabul Edilmeyen Gid.):
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={kkegAmount || ""}
                              onChange={(e) => setKkegAmount(Number(e.target.value) || 0)}
                              placeholder="0,00"
                              className="w-full bg-white text-slate-900 border border-purple-300 rounded-lg p-1.5 font-mono font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500 block">KVK M.11 Matraha ilave</span>
                          </div>

                          {/* İndirim & İstisnalar */}
                          <div className="space-y-1 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                            <label className="text-emerald-950 font-bold block text-[11px]">
                              (-) İndirim ve İstisnalar (Ar-Ge/İhracat):
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={exemptionsAmount || ""}
                              onChange={(e) => setExemptionsAmount(Number(e.target.value) || 0)}
                              placeholder="0,00"
                              className="w-full bg-white text-slate-900 border border-emerald-300 rounded-lg p-1.5 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500 block">KVK M.5 / M.10 İndirimler</span>
                          </div>

                          {/* Geçmiş Yıl Zararları */}
                          <div className="space-y-1 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                            <label className="text-indigo-950 font-bold block text-[11px]">
                              (-) Geçmiş Yıl Mali Zararları:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={priorLossesAmount || ""}
                              onChange={(e) => setPriorLossesAmount(Number(e.target.value) || 0)}
                              placeholder="0,00"
                              className="w-full bg-white text-slate-900 border border-indigo-300 rounded-lg p-1.5 font-mono font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500 block">KVK M.9 (Son 5 Yıl)</span>
                          </div>

                          {/* Stopaj Mahsubu */}
                          <div className="space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                            <label className="text-amber-950 font-bold block text-[11px]">
                              (-) Kesinti Stopajı Mahsubu:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={prepaidWithholdingAmount || ""}
                              onChange={(e) => setPrepaidWithholdingAmount(Number(e.target.value) || 0)}
                              placeholder="0,00"
                              className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-1.5 font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500 block">GVK M.94 / KVK M.15 Kesintiler</span>
                          </div>
                        </div>
                      </div>

                      {/* Official Step-by-Step Kurumlar Vergisi Table */}
                      <div className="overflow-x-auto rounded-xl border border-purple-200 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-purple-900 text-white font-extrabold text-[11px]">
                              <th className="p-2.5 w-12 text-center">Satır</th>
                              <th className="p-2.5">Beyanname Kalemi / İşlem Açıklaması</th>
                              <th className="p-2.5 text-right font-mono">Tutar (₺)</th>
                              <th className="p-2.5">Mevzuat / Açıklama</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono font-medium text-slate-800">
                            <tr className="hover:bg-slate-50">
                              <td className="p-2 text-center font-bold text-slate-500">1</td>
                              <td className="p-2 font-sans font-semibold text-slate-900">Ticari Bilanço Net Karı (Gelir - Gider)</td>
                              <td className="p-2 text-right font-bold text-slate-900">₺{totalYearNetProfit.toLocaleString("tr-TR")}</td>
                              <td className="p-2 font-sans text-[11px] text-slate-500">690 Dönem Net Karı Hesabı</td>
                            </tr>
                            <tr className="hover:bg-purple-50/30">
                              <td className="p-2 text-center font-bold text-purple-700">2</td>
                              <td className="p-2 font-sans font-semibold text-purple-950">(+) Kanunen Kabul Edilmeyen Giderler (KKEG)</td>
                              <td className="p-2 text-right font-bold text-purple-900">+₺{(kkegAmount || 0).toLocaleString("tr-TR")}</td>
                              <td className="p-2 font-sans text-[11px] text-slate-500">KVK M.11 Matraha İlave</td>
                            </tr>
                            <tr className="hover:bg-emerald-50/30">
                              <td className="p-2 text-center font-bold text-emerald-700">3</td>
                              <td className="p-2 font-sans font-semibold text-emerald-950">(-) İndirim ve İstisnalar Toplamı</td>
                              <td className="p-2 text-right font-bold text-emerald-700">-₺{(exemptionsAmount || 0).toLocaleString("tr-TR")}</td>
                              <td className="p-2 font-sans text-[11px] text-slate-500">KVK M.5 / M.10 İndirimler</td>
                            </tr>
                            <tr className="hover:bg-indigo-50/30">
                              <td className="p-2 text-center font-bold text-indigo-700">4</td>
                              <td className="p-2 font-sans font-semibold text-indigo-950">(-) Geçmiş Yıl Mali Zararları Mahsubu</td>
                              <td className="p-2 text-right font-bold text-indigo-700">-₺{(priorLossesAmount || 0).toLocaleString("tr-TR")}</td>
                              <td className="p-2 font-sans text-[11px] text-slate-500">KVK M.9 (Son 5 Yıl)</td>
                            </tr>
                            <tr className="bg-purple-100/70 font-bold border-y-2 border-purple-300">
                              <td className="p-2.5 text-center text-purple-950 font-black">5</td>
                              <td className="p-2.5 font-sans font-black text-purple-950 text-xs sm:text-sm">KURUMLAR VERGİSİ MATRAHI (Mali Kar)</td>
                              <td className="p-2.5 text-right font-black text-purple-950 text-sm sm:text-base">₺{corporateTaxableBase.toLocaleString("tr-TR")}</td>
                              <td className="p-2.5 font-sans text-xs text-purple-900 font-extrabold">Vergilendirilecek Net Matrah</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="p-2 text-center font-bold text-slate-500">6</td>
                              <td className="p-2 font-sans font-semibold text-slate-900">Kurumlar Vergisi Oranı</td>
                              <td className="p-2 text-right font-bold text-purple-900">%25</td>
                              <td className="p-2 font-sans text-[11px] text-slate-500">5520 Sayılı KVK M.32 Oranı</td>
                            </tr>
                            <tr className="bg-purple-50 font-bold">
                              <td className="p-2.5 text-center text-purple-950">7</td>
                              <td className="p-2.5 font-sans font-extrabold text-purple-950">HESAPLANAN KURUMLAR VERGİSİ (Matrah × %25)</td>
                              <td className="p-2.5 text-right font-black text-purple-950 text-sm">₺{calculatedCorporateTax.toLocaleString("tr-TR")}</td>
                              <td className="p-2.5 font-sans text-[11px] text-purple-800 font-bold">Yıllık Brüt Vergi Yükü</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="p-2 text-center font-bold text-slate-500">8</td>
                              <td className="p-2 font-sans font-semibold text-slate-900">(-) Ödenen Geçici Vergiler Toplamı (1-4. Dönem)</td>
                              <td className="p-2 text-right font-bold text-indigo-700">-₺{totalGeçiciVergiPayable.toLocaleString("tr-TR")}</td>
                              <td className="p-2 font-sans text-[11px] text-slate-500">GVK M.120 / KVK M.32 Geçici Vergi</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="p-2 text-center font-bold text-slate-500">9</td>
                              <td className="p-2 font-sans font-semibold text-slate-900">(-) Kesinti Yoluyla Ödenen Vergiler (Stopaj)</td>
                              <td className="p-2 text-right font-bold text-amber-700">-₺{(prepaidWithholdingAmount || 0).toLocaleString("tr-TR")}</td>
                              <td className="p-2 font-sans text-[11px] text-slate-500">GVK M.94 / KVK M.15 Stopaj</td>
                            </tr>
                            <tr className={`font-black text-sm border-t-2 ${netPayableCorporateTax > 0 ? "bg-purple-900 text-white" : "bg-emerald-800 text-white"}`}>
                              <td className="p-3 text-center">10</td>
                              <td className="p-3 font-sans uppercase">
                                {netPayableCorporateTax > 0 ? "ÖDENECEK KURUMLAR VERGİSİ" : "İADE ALINACAK KURUMLAR VERGİSİ"}
                              </td>
                              <td className="p-3 text-right font-mono text-base text-emerald-300">
                                ₺{(netPayableCorporateTax > 0 ? netPayableCorporateTax : corporateRefundTax).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 font-sans text-xs text-purple-200 font-semibold">
                                {netPayableCorporateTax > 0 ? "Son Beyan: 30 Nisan 2027" : "İade / Mahsup Talebi"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Kar Dağıtım Stopajı Bilgi Kartı (A.Ş. & Ltd. Şti.) */}
                      <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Kar Dağıtımı Stopajı Rehberi (GVK M.94 / 6-b):
                          </span>
                          <span className="text-[10px] bg-purple-950 text-purple-200 border border-purple-800 px-2 py-0.5 rounded">
                            Stopaj Oranı: %10
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 font-mono">
                          <div className="bg-slate-800/80 p-2.5 rounded-lg">
                            <span className="text-slate-400 text-[10px] block font-sans">Net Dağıtılabilir Kar:</span>
                            <span className="font-bold text-white">₺{Math.max(0, totalYearNetProfit - calculatedCorporateTax).toLocaleString("tr-TR")}</span>
                          </div>
                          <div className="bg-slate-800/80 p-2.5 rounded-lg">
                            <span className="text-slate-400 text-[10px] block font-sans">Ortaklara Dağıtılırsa Stopaj (%10):</span>
                            <span className="font-bold text-amber-400">₺{Math.round(Math.max(0, totalYearNetProfit - calculatedCorporateTax) * 0.10).toLocaleString("tr-TR")}</span>
                          </div>
                          <div className="bg-slate-800/80 p-2.5 rounded-lg">
                            <span className="text-slate-400 text-[10px] block font-sans">Ortakların Ele Geçen Net Kar:</span>
                            <span className="font-bold text-emerald-400">₺{Math.round(Math.max(0, totalYearNetProfit - calculatedCorporateTax) * 0.90).toLocaleString("tr-TR")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progressive Bracket table if Individual */}
                  {isIndividual || isPartnership ? (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="font-bold text-xs text-slate-900">
                        2026 Gelir Vergisi Dilimlerine Göre Dağılım Tablosu (GVK M.103)
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                              <th className="p-2">Gelir Vergisi Dilimi</th>
                              <th className="p-2 text-right">Dilime Giren Matrah</th>
                              <th className="p-2 text-right">Oran</th>
                              <th className="p-2 text-right">Vergi Tutarı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono font-medium">
                            {calculateIndividualIncomeTax(totalYearNetProfit).bracketBreakdown.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 font-sans font-semibold text-slate-800">{item.bracket}</td>
                                <td className="p-2 text-right text-slate-900">₺{item.taxableAmount.toLocaleString("tr-TR")}</td>
                                <td className="p-2 text-right text-purple-700 font-bold">%{item.rate}</td>
                                <td className="p-2 text-right text-emerald-700 font-bold">₺{item.taxAmount.toLocaleString("tr-TR")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Damga Vergileri Özeti */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span>Resmi Beyanname Damga Vergisi Tarifesi</span>
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md">
                    GİB Resmi Tarifesi
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100/80 hover:border-purple-200 transition-all">
                    <span className="text-slate-800 font-medium">Yıllık Gelir Vergisi Beyannamesi</span>
                    <span className="font-mono font-extrabold text-purple-950 text-xs ml-2 shrink-0">₺{YILLIK_GELIR_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100/80 hover:border-purple-200 transition-all">
                    <span className="text-slate-800 font-medium">Kurumlar Vergisi Beyannamesi</span>
                    <span className="font-mono font-extrabold text-purple-950 text-xs ml-2 shrink-0">₺{KURUMLAR_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-slate-800 font-medium">Katma Değer Vergisi (KDV) Beyannamesi</span>
                    <span className="font-mono font-bold text-slate-900 text-xs ml-2 shrink-0">₺{KDV_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-slate-800 font-medium">Muhtasar Beyanname</span>
                    <span className="font-mono font-bold text-slate-900 text-xs ml-2 shrink-0">₺{SADECE_MUHTASAR_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80 hover:border-indigo-200 transition-all">
                    <span className="text-indigo-950 font-bold">Muhtasar ve Prim Hizmet Beyannamesi</span>
                    <span className="font-mono font-extrabold text-indigo-900 text-xs ml-2 shrink-0">₺{MUHTASAR_PRIM_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                    <span className="text-slate-800 font-medium">Diğer Beyannameler (Geçici vb.)</span>
                    <span className="font-mono font-bold text-slate-900 text-xs ml-2 shrink-0">₺{DIGER_VERGI_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GENEL MUAVİN & DEFTER KAYITLARI (TARİH SIRALI DÖKÜM) */}
      {/* ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="space-y-4 animate-fadeIn">
          {renderDateFilterBar("Genel Muavin Defter Kayıtları Döküm Filtresi")}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full">
                    Tarih Sıralı
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {ledgerWithRunningBalance.length} Kayıt Listeleniyor
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Kronolojik Genel Muavin Defteri Dökümü
                </h3>
              </div>

              <ExportButtons
                getExportData={() => ({
                  filename: `Muavin_Defter_Kayitlari_${selectedYear}`,
                  title: `GENEL MUAVİN DEFTER KAYITLARI DÖKÜMÜ (${activeTaxpayerType})`,
                  subtitle: `Tarih Aralığı: ${startDate || "Tüm Yıl"} - ${endDate || "Tüm Yıl"}`,
                  headers: [
                    "Tarih", "İşlem Türü", "Kategori", "Belge No", "Cari / İlgili",
                    "Borç (Gider/Çıkış)", "Alacak (Gelir/Giriş)", "KDV Tutarı", "Yürüyen Bakiye"
                  ],
                  rows: ledgerWithRunningBalance.map((item) => [
                    formatDate(item.date),
                    item.typeLabel,
                    item.category,
                    item.documentNo,
                    item.contactName,
                    formatCurrency(item.debit, item.currency),
                    formatCurrency(item.credit, item.currency),
                    formatCurrency(item.vatAmount, item.currency),
                    formatCurrency(item.runningBalance, item.currency),
                  ]),
                })}
                size="sm"
              />
            </div>

            {/* General Ledger Table */}
            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">İşlem Türü</th>
                    <th className="p-3">Belge / Referans No</th>
                    <th className="p-3">Cari / Açıklama</th>
                    <th className="p-3 text-right">Borç (Çıkış/Gider)</th>
                    <th className="p-3 text-right">Alacak (Giriş/Gelir)</th>
                    <th className="p-3 text-right">KDV</th>
                    <th className="p-3 text-right">Yürüyen Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {ledgerWithRunningBalance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Seçilen kriterlere uygun muavin kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    ledgerWithRunningBalance.map((item) => (
                      <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.typeLabel.includes("Satış") || item.typeLabel.includes("Tahsilat")
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {item.typeLabel}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 font-semibold">{item.documentNo}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.contactName}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate max-w-[220px]">
                            {item.description}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-700">
                          {item.debit > 0 ? `₺${item.debit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          {item.credit > 0 ? `₺${item.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono text-indigo-700 font-semibold">
                          {item.vatAmount > 0 ? `₺${item.vatAmount.toLocaleString("tr-TR")}` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">
                          ₺{item.runningBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VERGİ TAKVİMİ & MEVZUAT REHBERİ */}
      {/* ========================================================================= */}
      {activeTab === "guidelines" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-700" />
                {activeTaxpayerType} - Yasal Vergi Takvimi & Mevzuat Rehberi
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Gelir İdaresi Başkanlığı (GİB) 2026 resmi beyanname son verme ve ödeme tarihleri.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-extrabold text-indigo-950 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Katma Değer Vergisi (KDV-1)
                </div>
                <p className="text-slate-600 font-medium">
                  Takip eden ayın 28'inci günü akşamına kadar beyan edilir ve ödenir.
                </p>
                <div className="text-[11px] font-bold text-indigo-900 bg-indigo-100/70 p-2 rounded-lg">
                  Son Ödeme: Her Ayın 28'i
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-extrabold text-purple-950 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  Muhtasar ve Prim Hizmet
                </div>
                <p className="text-slate-600 font-medium">
                  Takip eden ayın 26'ncı günü akşamına kadar beyan edilir ve ödenir.
                </p>
                <div className="text-[11px] font-bold text-purple-900 bg-purple-100/70 p-2 rounded-lg">
                  Son Ödeme: Her Ayın 26'sı
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-extrabold text-emerald-950 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  Geçici Vergi Beyannamesi
                </div>
                <p className="text-slate-600 font-medium">
                  Üçer aylık dönemleri izleyen ikinci ayın 17'nci günü akşamına kadar.
                </p>
                <div className="text-[11px] font-bold text-emerald-900 bg-emerald-100/70 p-2 rounded-lg">
                  17 Mayıs, 17 Ağustos, 17 Kasım, 17 Şubat
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
