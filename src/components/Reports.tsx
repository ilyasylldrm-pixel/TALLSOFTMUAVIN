import React, { useState } from "react";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency } from "../utils/exportUtils";
import {
  Contact,
  Invoice,
  Transaction,
  CompanySettings,
  TAXPAYER_TYPES,
} from "../types";
import {
  BarChart3,
  Download,
  Receipt,
  TrendingUp,
  Building2,
  Calendar,
  HelpCircle,
  FileCheck,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Calculator,
  Briefcase,
  Clock,
  ArrowRight,
  ShieldCheck,
  Scale,
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

export const Reports: React.FC<ReportsProps> = ({
  contacts,
  invoices,
  transactions,
  companySettings,
}) => {
  const [activeTab, setActiveTab] = useState<"monthly" | "periodic" | "guidelines" | "ledger">("monthly");
  
  // Local taxpayer type state for testing different entities
  const [activeTaxpayerType, setActiveTaxpayerType] = useState<string>(
    companySettings.taxpayerType || "Anonim Şirket"
  );

  // Simulator inputs
  const [simIncome, setSimIncome] = useState<number>(0);
  const [simExpense, setSimExpense] = useState<number>(0);
  const [useSimulator, setUseSimulator] = useState<boolean>(false);

  // Calculated base figures from recorded data or simulator
  const recordedIncome = transactions
    .filter((t) => t.type === "income" || t.type === "collection")
    .reduce((sum, t) => sum + t.amount, 0);

  const recordedExpense = transactions
    .filter((t) => t.type === "expense" || t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const salesVat = invoices
    .filter((i) => i.type === "sales")
    .reduce((sum, i) => sum + i.totalVat, 0);

  const purchaseVat = invoices
    .filter((i) => i.type === "purchase")
    .reduce((sum, i) => sum + i.totalVat, 0);

  const effectiveIncome = useSimulator ? simIncome : recordedIncome;
  const effectiveExpense = useSimulator ? simExpense : recordedExpense;
  const netProfit = Math.max(0, effectiveIncome - effectiveExpense);

  const netVat = salesVat - purchaseVat;
  const payableVat = Math.max(0, netVat);
  const deferredVat = netVat < 0 ? Math.abs(netVat) : 0;

  // Fixed Official Stamp Duty Fees (2026 Statutory Rates)
  const KDV_DAMGA_VERGISI = 308.30;
  const MUHTASAR_DAMGA_VERGISI = 308.30;
  const GECICI_DAMGA_VERGISI = 480.20;
  const YILLIK_DAMGA_VERGISI = 650.50;

  // Check Exemption / Special Tax Logic
  const isCorporate = ["Anonim Şirket", "Limited Şirket"].includes(activeTaxpayerType);
  const isIndividual = activeTaxpayerType === "Gerçek Şahıs";
  const isPartnership = ["Adi Ortaklık", "Kollektif Şirket"].includes(activeTaxpayerType);
  const isExemptOrg = ["Dernek", "Vakıf", "Siyasi Parti", "Site Yönetimi", "Spor Kulübü"].includes(activeTaxpayerType);
  const isCoop = activeTaxpayerType === "Kooperatif";

  // Calculate Periodic / Annual Tax
  let corporateTaxRate = 25; // %25 standard corporate tax
  let calculatedPeriodicTax = 0;
  let taxFormulaDescription = "";

  if (isCorporate) {
    calculatedPeriodicTax = netProfit * 0.25;
    taxFormulaDescription = "Net Ticari Kar × %25 Kurumlar Vergisi (KVK M.32)";
  } else if (isIndividual || isPartnership) {
    const res = calculateIndividualIncomeTax(netProfit);
    calculatedPeriodicTax = res.totalTax;
    taxFormulaDescription = "GVK M.103 Artan Oranlı Gelir Vergisi Tarifesi (%15 - %40)";
  } else if (isExemptOrg) {
    calculatedPeriodicTax = 0;
    taxFormulaDescription = "İktisadi İşletmesi Bulunmayan Organizasyonlar Kurumlar Vergisinden Muaftır (KVK M.4)";
  } else if (isCoop) {
    calculatedPeriodicTax = netProfit * 0.25;
    taxFormulaDescription = "Sadece Ortak İçi İşlemlerde Muaf, Ortak Dışı İşlemlerde %25 Kurumlar Vergisi";
  }

  // Quarterly provisional tax estimation (Geçici Vergi)
  const quarterlyProfit = netProfit / 4;
  let quarterlyTaxEstimate = 0;
  if (isCorporate) {
    quarterlyTaxEstimate = quarterlyProfit * 0.25;
  } else if (isIndividual || isPartnership) {
    quarterlyTaxEstimate = calculateIndividualIncomeTax(quarterlyProfit).totalTax;
  }

  const exportGeneralLedgerCSV = () => {
    let csv = "data:text/csv;charset=utf-8,Tarih;Türü;Belge No;Cari/Açıklama;Borç;Alacak;Para Birimi\n";

    invoices.forEach((i) => {
      const invCurr = i.currency || "TRY";
      if (i.type === "sales") {
        csv += `${i.issueDate};Satış Faturası;${i.invoiceNumber};"${i.contactName}";${formatCurrency(i.grandTotal, invCurr)};${formatCurrency(0, invCurr)};${invCurr}\n`;
      } else {
        csv += `${i.issueDate};Alış Faturası;${i.invoiceNumber};"${i.contactName}";${formatCurrency(0, invCurr)};${formatCurrency(i.grandTotal, invCurr)};${invCurr}\n`;
      }
    });

    transactions.forEach((t) => {
      const isInc = t.type === "income" || t.type === "collection";
      const txCurr = t.currency || "TRY";
      csv += `${t.date};${t.category};${t.documentNo || "-"};"${t.description}";${
        isInc ? formatCurrency(0, txCurr) : formatCurrency(t.amount, txCurr)
      };${isInc ? formatCurrency(t.amount, txCurr) : formatCurrency(0, txCurr)};${txCurr}\n`;
    });

    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `Muavin_Vergilendirme_Raporu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-purple-800/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Decorative Grid SVG */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: "24px 42px",
          }}
        />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-300" />
              T.C. Vergi Mevzuatı Entegre
            </span>
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              2026 Güncel Oranlar
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            Vergilendirme ve Mali Yükümlülük Portalı
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/90 font-medium leading-relaxed">
            Seçili mükellefiyet türüne göre T.C. Vergi Kanunları çerçevesinde hesaplanan aylık KDV, Muhtasar, Geçici Vergi ve Yıllık Kurumlar / Gelir Vergisi tahminleri.
          </p>
        </div>

        {/* Taxpayer Switcher Box */}
        <div className="relative z-10 w-full lg:w-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl space-y-2 min-w-[280px]">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-purple-200">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-purple-300" />
              Mükellefiyet Türü:
            </span>
            <span className="text-[10px] bg-purple-500/40 text-purple-100 px-2 py-0.5 rounded-md">
              Mevcut Ayar
            </span>
          </div>

          <select
            value={activeTaxpayerType}
            onChange={(e) => setActiveTaxpayerType(e.target.value)}
            className="w-full bg-slate-900/90 text-white border border-purple-400/50 rounded-xl p-2.5 font-bold text-xs shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
          >
            {TAXPAYER_TYPES.map((type) => (
              <option key={type} value={type} className="bg-slate-900 text-white">
                {type}
              </option>
            ))}
          </select>

          <p className="text-[11px] text-purple-200/80 font-medium italic pt-1">
            {isCorporate && "• Kurumlar Vergisi mükellefi (%25 Düz Oran)"}
            {isIndividual && "• Gelir Vergisi mükellefi (%15-%40 Artan Oranlı)"}
            {isPartnership && "• Şahıs Şirketi / Adi Ortaklık Esası"}
            {isExemptOrg && "• İktisadi işletmesiz muaf kuruluş"}
            {isCoop && "• Kooperatif mükellefiyet rejimi"}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Tax Regime */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Vergi Rejimi</span>
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            {activeTaxpayerType}
          </div>
          <div className="text-[11px] text-slate-600 font-medium pt-2 border-t border-slate-100 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>{taxFormulaDescription}</span>
          </div>
        </div>

        {/* Card 2: Net Monthly VAT */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Tahmini Ödenecek KDV</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {isExemptOrg ? "₺0,00 (Muaf)" : `₺${payableVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 font-medium">
            <span>Satış KDV: ₺{salesVat.toLocaleString("tr-TR")}</span>
            <span>Alış KDV: ₺{purchaseVat.toLocaleString("tr-TR")}</span>
          </div>
        </div>

        {/* Card 3: Projected Periodic Income Tax */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Yıllık Tahmini Vergi</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₺{calculatedPeriodicTax.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 font-medium">
            <span>Matrah (Net Kar): ₺{netProfit.toLocaleString("tr-TR")}</span>
            <span>{isIndividual ? `%${calculateIndividualIncomeTax(netProfit).effectiveRate.toFixed(1)} Etkin` : "%25 Sabit"}</span>
          </div>
        </div>

        {/* Card 4: Monthly Fixed Stamp Duties */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Sabit Damga Vergileri</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₺{(KDV_DAMGA_VERGISI + MUHTASAR_DAMGA_VERGISI).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} / ay
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
            KDV (₺308,30) + Muhtasar (₺308,30) Maktu Harç
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
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
          1. Aylık Vergi Yükümlülükleri (KDV & Muhtasar)
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
          2. Dönemsel & Yıllık Vergiler (Kurumlar / Gelir Vergisi)
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
          3. T.C. Vergi Takvimi & Mevzuat Rehberi
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
          4. Genel Muavin Defter Kayıtları & Döküm
        </button>
      </div>

      {/* TAB 1: AYLIK VERGİ YÜKÜMLÜLÜKLERİ */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-700" />
                  Aylık Katma Değer Vergisi (KDV) & Muhtasar Detay Raporu
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Hesaplanan KDV, İndirilecek KDV ve sabit maktu beyanname damga vergileri dökümü.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-700" />
                <span>KDV Son Ödeme Tarihi: Her Ayın 28'i</span>
              </div>
            </div>

            {/* Monthly Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KDV Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    KDV-1 Beyannamesi Matrahı
                  </span>
                  <span className="text-xs font-bold text-slate-500">Cari Dönem</span>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-200/80">
                    <span>Satış Faturası Hesaplanan KDV (+):</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      ₺{salesVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-200/80">
                    <span>Alış Faturası İndirilecek KDV (-):</span>
                    <span className="font-mono text-rose-700 font-bold">
                      ₺{purchaseVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between p-2.5 bg-purple-50 rounded-xl border border-purple-200 font-black text-purple-950 text-sm">
                    <span>{netVat >= 0 ? "Ödenecek Net KDV:" : "Sonraki Döneme Devreden KDV:"}</span>
                    <span className="font-mono">
                      ₺{Math.abs(netVat).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {deferredVat > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Bu dönemde indirilecek KDV tutarınız hesaplanan KDV'den fazla olduğu için <strong>₺{deferredVat.toLocaleString("tr-TR")}</strong> tutarındaki KDV sonraki döneme devretmiştir (Ödenecek KDV ₺0 çıkmaktadır).
                    </span>
                  </div>
                )}
              </div>

              {/* Muhtasar & Damga Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-purple-600" />
                    Muhtasar & Sabit Damga Vergileri
                  </span>
                  <span className="text-xs font-bold text-slate-500">Maktu Yükümlülükler</span>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-200/80">
                    <span>KDV-1 Beyanname Damga Vergisi:</span>
                    <span className="font-mono text-slate-900 font-bold">₺{KDV_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-200/80">
                    <span>Muhtasar Beyanname Damga Vergisi:</span>
                    <span className="font-mono text-slate-900 font-bold">₺{MUHTASAR_DAMGA_VERGISI.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between p-2 bg-white rounded-xl border border-slate-200/80">
                    <span>Gayrimenkul Kira Stopajı (%20 Tahmini):</span>
                    <span className="font-mono text-amber-800 font-bold">Ödemeye Bağlı</span>
                  </div>

                  <div className="flex justify-between p-2.5 bg-slate-900 text-white rounded-xl font-black text-xs">
                    <span>Aylık Sabit Beyanname Yükü:</span>
                    <span className="font-mono text-purple-300">
                      ₺{(KDV_DAMGA_VERGISI + MUHTASAR_DAMGA_VERGISI).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 text-purple-950 rounded-xl text-xs font-medium leading-relaxed">
                  <strong>Not:</strong> Muhtasar ve Prim Hizmet Beyannamesi son ödeme günü her ayın 26'sıdır. Gayrimenkul kiralamalarında mal sahibine ödenen brüt kiranın %20'si oranında stopaj vergi dairesine yatırılır.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DÖNEMSEL VE YILLIK VERGİ HESAPLAYICISI */}
      {activeTab === "periodic" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  {isCorporate ? "Kurumlar Vergisi & Geçici Vergi Hesaplaması" : "Gelir Vergisi & Geçici Vergi Hesaplaması"}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {activeTaxpayerType} mükellefiyetine uygun 3 aylık dönemler ve yıllık vergi matrahı dökümü.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Geçici Vergi Oranı: {isCorporate ? "%25 Düz Oran" : "%15 - %40 Artan Oranlı"}</span>
              </div>
            </div>

            {/* Income Tax / Corporate Tax Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-2">
                    Yıllık Kar / Zarar ve Vergi Matrahı
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-semibold mb-1">Toplam Gelir:</span>
                      <span className="text-base font-black text-slate-900 font-mono">₺{effectiveIncome.toLocaleString("tr-TR")}</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-semibold mb-1">Toplam Gider:</span>
                      <span className="text-base font-black text-slate-900 font-mono">₺{effectiveExpense.toLocaleString("tr-TR")}</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-semibold mb-1">Net Ticari Kar (Matrah):</span>
                      <span className="text-base font-black text-emerald-700 font-mono">₺{netProfit.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>

                  {/* If Individual Income Tax, show Progressive Bracket breakdown table */}
                  {isIndividual || isPartnership ? (
                    <div className="mt-4 space-y-3">
                      <h5 className="font-bold text-xs text-slate-800">2026 Gelir Vergisi Dilimlerine Göre Hesaplama Detayı (GVK M.103):</h5>
                      <div className="overflow-x-auto custom-scrollbar w-full rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-xs text-left min-w-[500px]">
                          <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                            <tr>
                              <th className="p-2.5">Gelir Dilimi</th>
                              <th className="p-2.5 text-center">Vergi Oranı</th>
                              <th className="p-2.5 text-right">Dilime Giren Tutar</th>
                              <th className="p-2.5 text-right">Hesaplanan Vergi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {calculateIndividualIncomeTax(netProfit).bracketBreakdown.map((item, idx) => (
                              <tr key={idx}>
                                <td className="p-2.5">{item.bracket}</td>
                                <td className="p-2.5 text-center font-bold text-purple-700">%{item.rate}</td>
                                <td className="p-2.5 text-right font-mono">₺{item.taxableAmount.toLocaleString("tr-TR")}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900">₺{item.taxAmount.toLocaleString("tr-TR")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between font-extrabold text-purple-950 text-sm">
                        <span>Kurumlar Vergisi Oranı:</span>
                        <span>%25</span>
                      </div>
                      <div className="flex justify-between font-black text-purple-900 text-base border-t border-purple-200 pt-2">
                        <span>Hesaplanan Yıllık Kurumlar Vergisi:</span>
                        <span className="font-mono">₺{(netProfit * 0.25).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quarterly Provisional Tax Breakdown */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-purple-300 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Dönemsel Geçici Vergi Tahminleri
                  </h4>

                  <div className="space-y-2.5 text-xs mt-3">
                    <div className="flex justify-between p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                      <span className="text-slate-300">1. Dönem (Ocak - Mart):</span>
                      <span className="font-mono font-bold text-emerald-400">₺{quarterlyTaxEstimate.toLocaleString("tr-TR")}</span>
                    </div>

                    <div className="flex justify-between p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                      <span className="text-slate-300">2. Dönem (Nisan - Haziran):</span>
                      <span className="font-mono font-bold text-emerald-400">₺{quarterlyTaxEstimate.toLocaleString("tr-TR")}</span>
                    </div>

                    <div className="flex justify-between p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                      <span className="text-slate-300">3. Dönem (Temmuz - Eylül):</span>
                      <span className="font-mono font-bold text-emerald-400">₺{quarterlyTaxEstimate.toLocaleString("tr-TR")}</span>
                    </div>

                    <div className="flex justify-between p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                      <span className="text-slate-300">4. Dönem (Ekim - Aralık):</span>
                      <span className="font-mono font-bold text-emerald-400">₺{quarterlyTaxEstimate.toLocaleString("tr-TR")}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-950/80 border border-purple-800 text-purple-200 rounded-xl text-[11px] font-medium leading-relaxed">
                  Geçici vergi 3'er aylık dönemlerde ödenir ve yıl sonunda hesaplanan yıllık vergiden düşülür (mahsup edilir).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: T.C. VERGİ TAKVİMİ & MEVZUAT REHBERİ */}
      {activeTab === "guidelines" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-700" />
                {activeTaxpayerType} Yasal Vergi Takvimi ve Yükümlülük Rehberi
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                T.C. Hazine ve Maliye Bakanlığı Gelir İdaresi Başkanlığı (GİB) güncel beyan ve ödeme süreleri.
              </p>
            </div>

            {/* Calendar Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50/50">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  KDV-1 Beyannamesi (Aylık)
                </div>
                <div className="text-xs space-y-1.5 font-medium text-slate-700">
                  <p><strong>Beyan Süresi:</strong> Her takip eden ayın 28'i akşamına kadar.</p>
                  <p><strong>Ödeme Süresi:</strong> Beyanname verildiği ayın 28'i akşamına kadar.</p>
                  <p><strong>Beyanname Damga Vergisi:</strong> ₺308,30 Maktu</p>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50/50">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  Muhtasar ve Prim Hizmet Beyannamesi
                </div>
                <div className="text-xs space-y-1.5 font-medium text-slate-700">
                  <p><strong>Beyan Süresi:</strong> Takip eden ayın 26'sı akşamına kadar.</p>
                  <p><strong>Ödeme Süresi:</strong> Takip eden ayın 26'sı akşamına kadar.</p>
                  <p><strong>Kapsam:</strong> İşyeri kirası (%20 stopaj), personel SGK & Gelir Vergisi kesintileri.</p>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50/50">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Geçici Vergi Beyannamesi (Üç Aylık)
                </div>
                <div className="text-xs space-y-1.5 font-medium text-slate-700">
                  <p><strong>Beyan & Ödeme Süreleri:</strong></p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                    <li>1. Dönem (Ocak-Mart): 17 Mayıs</li>
                    <li>2. Dönem (Nisan-Haziran): 17 Ağustos</li>
                    <li>3. Dönem (Temmuz-Eylül): 17 Kasım</li>
                    <li>4. Dönem (Ekim-Aralık): 17 Şubat</li>
                  </ul>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50/50">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  {isCorporate ? "Yıllık Kurumlar Vergisi" : "Yıllık Gelir Vergisi"} Beyannamesi
                </div>
                <div className="text-xs space-y-1.5 font-medium text-slate-700">
                  <p><strong>{isCorporate ? "Kurumlar Vergisi Son Tarih:" : "Gelir Vergisi Son Tarih:"}</strong> {isCorporate ? "30 Nisan" : "31 Mart"}</p>
                  <p><strong>Damga Vergisi:</strong> ₺650,50</p>
                  <p><strong>Not:</strong> Yıl içinde ödenen 4 dönemlik Geçici Vergiler bu beyannamede mahsup edilir.</p>
                </div>
              </div>
            </div>

            {/* Detailed Law Notes for Selected Taxpayer Type */}
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl space-y-2 text-xs text-purple-950">
              <h4 className="font-extrabold text-sm flex items-center gap-2 text-purple-900">
                <Info className="w-4 h-4 text-purple-700" />
                {activeTaxpayerType} İçin Özel Yasal Notlar & İstisnalar
              </h4>
              <p className="leading-relaxed">
                {isCorporate && "A.Ş. ve LTD. Şirketler 5520 sayılı Kurumlar Vergisi Kanunu uyarınca tam mükellef statüsündedir. Şirket ortaklarına kar dağıtımı yapıldığında %10 stopaj kesintisi yapılır."}
                {isIndividual && "Gerçek şahıs şirketleri 193 sayılı Gelir Vergisi Kanununa tabidir. Yıllık kar tutarı arttıkça vergi dilimi %15'ten başlar ve %40'a kadar yükselir."}
                {isPartnership && "Adi Ortaklıklar tüzel kişiliğe sahip değildir. Katma Değer Vergisi ve Muhtasar beyannameleri ortaklık numarası ile verilir, elde edilen kar ise ortaklar arasında paylaştırılarak kendi gelir vergisi beyannamelerine aktarılır."}
                {isExemptOrg && "Dernek, Vakıf ve Site Yönetimleri ticari faaliyette bulunmadıkları sürece Kurumlar Vergisi ve KDV'den muaftır. Yalnızca gayrimenkul kiralamalarında ve personel ödemelerinde stopaj (Muhtasar) öderler."}
                {isCoop && "1163 sayılı Kooperatifler Kanununa göre sadece ortak içi işlem yapan ve sermaye üzerinden kazanç dağıtmayan kooperatifler Kurumlar Vergisinden muaftır."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GENEL MUAVİN DEFTERİ VE DÖKÜM */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Genel Muavin Defter Kayıtları & Fatura Dökümü
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Tüm alış, satış ve muavin yevmiye kayıtlarının detaylı dökümü.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ExportButtons
                  getExportData={() => ({
                    filename: `Muavin_Defter_Kayitlari_${new Date().toISOString().split("T")[0]}`,
                    title: "GENEL MUAVİN DEFTER KAYITLARI VEYA FATURA DÖKÜMÜ",
                    subtitle: `Toplam ${invoices.length} Adet Fatura Dökümü`,
                    headers: ["Tarih", "İşlem Tipi", "Belge / Fatura No", "İlgili Taraf / Cari", "Borç Tutarı", "Alacak Tutarı", "Para Birimi"],
                    rows: invoices.map((inv) => {
                      const invCurr = inv.currency || "TRY";
                      return [
                        inv.issueDate,
                        inv.type === "sales" ? "Satış Faturası" : "Alış Faturası",
                        inv.invoiceNumber,
                        inv.contactName,
                        formatCurrency(inv.type === "sales" ? inv.grandTotal || 0 : 0, invCurr),
                        formatCurrency(inv.type === "purchase" ? inv.grandTotal || 0 : 0, invCurr),
                        invCurr,
                      ];
                    }),
                  })}
                  size="sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
              <table className="w-full text-left text-xs border-separate border-spacing-y-2 min-w-[750px]">
                <thead>
                  <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="pb-2 px-3">Tarih</th>
                    <th className="pb-2 px-3">İşlem Tipi</th>
                    <th className="pb-2 px-3">Belge No</th>
                    <th className="pb-2 px-3">İlgili Taraf / Açıklama</th>
                    <th className="pb-2 px-3 text-right">Borç Tutarı (TL)</th>
                    <th className="pb-2 px-3 text-right">Alacak Tutarı (TL)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                        Kayıtlı muavin defter kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-500 group-hover:text-purple-900 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {inv.issueDate}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {inv.type === "sales" ? "Satış Faturası" : "Alış Faturası"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 group-hover:text-purple-900 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {inv.contactName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {inv.type === "sales" ? `₺${inv.grandTotal.toLocaleString("tr-TR")}` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 group-hover:text-purple-950 rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {inv.type === "purchase" ? `₺${inv.grandTotal.toLocaleString("tr-TR")}` : "-"}
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
    </div>
  );
};
