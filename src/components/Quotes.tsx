import React, { useState } from "react";
import { Quote, QuoteStatus, Contact, Product, Invoice, CompanySettings } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency, formatDate, exportElementToPDF } from "../utils/exportUtils";
import { formatQuoteWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Trash2,
  X,
  PlusCircle,
  FileText,
  Printer,
  Download,
  Building2,
  ShoppingCart,
  Calendar,
  Filter,
  Check,
  Zap,
  MessageCircle,
} from "lucide-react";
import { numberToTurkishWords } from "../utils/numberToTurkishWords";
import { Logo } from "./Logo";

const TURKISH_MONTHS = [
  { id: 1, name: "Ocak" },
  { id: 2, name: "Şubat" },
  { id: 3, name: "Mart" },
  { id: 4, name: "Nisan" },
  { id: 5, name: "Mayıs" },
  { id: 6, name: "Haziran" },
  { id: 7, name: "Temmuz" },
  { id: 8, name: "Ağustos" },
  { id: 9, name: "Eylül" },
  { id: 10, name: "Ekim" },
  { id: 11, name: "Kasım" },
  { id: 12, name: "Aralık" },
];

const getDateYearAndMonth = (dateStr?: string) => {
  if (!dateStr) return { year: null, month: null };
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
    }
  }
  if (dateStr.includes(".")) {
    const parts = dateStr.split(".");
    if (parts.length >= 3) {
      const y = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return { year: null, month: null };
};

interface QuotesProps {
  quotes: Quote[];
  contacts: Contact[];
  products: Product[];
  companySettings?: CompanySettings;
  globalSearchTerm?: string;
  onAddQuote: (quote: Quote) => void;
  onConvertQuoteToInvoice: (quote: Quote) => void;
  onConvertQuoteToOrder?: (quote: Quote) => void;
  onDeleteQuote: (id: string) => void;
}

export const Quotes: React.FC<QuotesProps> = ({
  quotes,
  contacts,
  products,
  companySettings,
  globalSearchTerm = "",
  onAddQuote,
  onConvertQuoteToInvoice,
  onConvertQuoteToOrder,
  onDeleteQuote,
}) => {
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printingQuote, setPrintingQuote] = useState<Quote | null>(null);
  const [whatsAppQuote, setWhatsAppQuote] = useState<Quote | null>(null);
  const [isDownloadingQuotePDF, setIsDownloadingQuotePDF] = useState(false);
  const [formType, setFormType] = useState<"proforma" | "quote">("proforma");

  const handleDownloadQuotePDF = async () => {
    if (!printingQuote) return;
    setIsDownloadingQuotePDF(true);
    try {
      const fileName = `${printingQuote.quoteNumber}_Proforma_Fatura.pdf`;
      await exportElementToPDF("printable-quote", fileName);
    } catch (err) {
      console.error("Proforma PDF İndirme Hatası:", err);
    } finally {
      setIsDownloadingQuotePDF(false);
    }
  };

  // Form State
  const [contactId, setContactId] = useState(contacts[0]?.id || "");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("Proforma fatura geçerlilik süresi 30 gündür.");

  const [items, setItems] = useState([
    {
      id: "qi_1",
      productId: products[0]?.id || "",
      description: products[0]?.name || "Proforma Faturası Hizmet Kalemi",
      quantity: 1,
      unit: products[0]?.unit || "Proje",
      unitPrice: products[0]?.sellPrice || 25000,
      vatRate: products[0]?.vatRate ?? 20,
      totalWithoutVat: products[0]?.sellPrice || 25000,
      vatAmount: ((products[0]?.sellPrice || 25000) * (products[0]?.vatRate ?? 20)) / 100,
      totalWithVat: (products[0]?.sellPrice || 25000) * (1 + (products[0]?.vatRate ?? 20) / 100),
    },
  ]);

  const openNewFormModal = (type: "quote" | "proforma" = "proforma") => {
    setFormType("proforma");
    setNotes("Proforma fatura geçerlilik süresi 30 gündür.");
    setContactId(contacts[0]?.id || "");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setValidUntil(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );

    if (products.length > 0) {
      const firstP = products[0];
      setItems([
        {
          id: "qi_1",
          productId: firstP.id,
          description: firstP.name,
          quantity: 1,
          unit: firstP.unit || "Adet",
          unitPrice: firstP.sellPrice || 0,
          vatRate: firstP.vatRate ?? 20,
          totalWithoutVat: firstP.sellPrice || 0,
          vatAmount: ((firstP.sellPrice || 0) * (firstP.vatRate ?? 20)) / 100,
          totalWithVat:
            (firstP.sellPrice || 0) * (1 + (firstP.vatRate ?? 20) / 100),
        },
      ]);
    } else {
      setItems([
        {
          id: "qi_1",
          productId: "",
          description: "Yazılım Danışmanlık ve Hizmet Bedeli",
          quantity: 1,
          unit: "Adet",
          unitPrice: 10000,
          vatRate: 20,
          totalWithoutVat: 10000,
          vatAmount: 2000,
          totalWithVat: 12000,
        },
      ]);
    }

    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const newItem = {
      id: "qi_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      productId: "",
      description: "",
      quantity: 1,
      unit: "Adet",
      unitPrice: 0,
      vatRate: 20,
      totalWithoutVat: 0,
      vatAmount: 0,
      totalWithVat: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let updated = { ...item, [field]: value };

        if (field === "productId" && value) {
          const p = products.find((prod) => prod.id === value);
          if (p) {
            updated.description = p.name;
            updated.unit = p.unit || "Adet";
            updated.unitPrice = p.sellPrice || 0;
            updated.vatRate = p.vatRate ?? 20;
          }
        }

        const qty = updated.quantity || 0;
        const price = updated.unitPrice || 0;
        const vat = updated.vatRate || 0;

        const totalWithoutVat = qty * price;
        const vatAmount = (totalWithoutVat * vat) / 100;
        const totalWithVat = totalWithoutVat + vatAmount;

        updated.totalWithoutVat = totalWithoutVat;
        updated.vatAmount = vatAmount;
        updated.totalWithVat = totalWithVat;

        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, i) => sum + (i.totalWithoutVat || 0), 0);
  const totalVat = items.reduce((sum, i) => sum + (i.vatAmount || 0), 0);
  const grandTotal = items.reduce((sum, i) => sum + (i.totalWithVat || 0), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    const prefix = formType === "quote" ? "TEK2026" : "PRF2026";

    const newQuote: Quote = {
      id: "q_" + Date.now(),
      quoteNumber: `${prefix}${String(quotes.length + 1).padStart(5, "0")}`,
      contactId: contact.id,
      contactName: contact.name,
      issueDate,
      validUntil,
      items,
      grandTotal,
      status: "sent",
      notes,
    };

    onAddQuote(newQuote);
    setIsModalOpen(false);
  };

  // Available Years
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    quotes.forEach((q) => {
      const { year } = getDateYearAndMonth(q.issueDate);
      if (year) yearsSet.add(year);
    });
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear());
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [quotes]);

  const activeSearchQuery = (globalSearchTerm || search).toLowerCase().trim();
  const filteredQuotes = quotes.filter((q) => {
    // Year filter
    if (selectedYear !== "all") {
      const { year } = getDateYearAndMonth(q.issueDate);
      if (!year || year.toString() !== selectedYear) return false;
    }

    // Month filter
    if (selectedMonth !== "all") {
      const { month } = getDateYearAndMonth(q.issueDate);
      if (!month || month.toString() !== selectedMonth) return false;
    }

    // Search query
    if (activeSearchQuery) {
      const matchesSearch =
        q.quoteNumber.toLowerCase().includes(activeSearchQuery) ||
        q.contactName.toLowerCase().includes(activeSearchQuery) ||
        (q.notes && q.notes.toLowerCase().includes(activeSearchQuery));
      if (!matchesSearch) return false;
    }

    return true;
  });

  const displayedQuotes = filteredQuotes.slice(0, displayLimit);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Header (Lila Bal Peteği & Geometrik Desen) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-500/20"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="relative z-10">
          <p className="text-xs font-semibold text-purple-950/90 leading-relaxed">
            Müşterilerinize sunduğunuz ön fatura (proforma) kayıtlarını takip edin ve onaylandığında tek tıkla gelir faturasına dönüştürün.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={() => openNewFormModal("proforma")}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-white font-bold" />
            <span>Yeni Proforma Fatura Hazırla</span>
          </button>
        </div>
      </div>

      {/* Table & Filter Bar */}
      <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs overflow-hidden space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Yıl Filtresi */}
            <div className="flex items-center gap-1.5 bg-white border border-purple-200/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="text-slate-400 font-bold">Yıl:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Tüm Yıllar</option>
                {availableYears.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>

            {/* Ay Filtresi */}
            <div className="flex items-center gap-1.5 bg-white border border-purple-200/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="text-slate-400 font-bold">Ay:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Tüm Aylar</option>
                {TURKISH_MONTHS.map((m) => (
                  <option key={m.id} value={m.id.toString()}>{m.name}</option>
                ))}
              </select>
            </div>

            {(selectedYear !== "all" || selectedMonth !== "all") && (
              <button
                onClick={() => {
                  setSelectedYear("all");
                  setSelectedMonth("all");
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Yıl ve Ay filtresini temizle"
              >
                <X className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Proforma no veya Müşteri ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
              />
            </div>
          </div>
          <ExportButtons
            getExportData={() => ({
              filename: `Proforma_Faturalar_${new Date().toISOString().split("T")[0]}`,
              title: "PROFORMA FATURALAR LİSTESİ",
              subtitle: `Toplam ${filteredQuotes.length} Adet Kayıt`,
              headers: [
                "Belge No",
                "Belge Türü",
                "Cari / Müşteri",
                "Tarih",
                "Son Geçerlilik Tarihi",
                "Ara Toplam",
                "KDV Toplamı",
                "Genel Toplam",
                "Para Birimi",
                "Durum",
              ],
              rows: filteredQuotes.map((q) => {
                const qCurr = (q as any).currency || "TRY";
                return [
                  q.number,
                  "Proforma Fatura",
                  q.contactName,
                  q.issueDate,
                  q.validUntil,
                  formatCurrency(q.subtotal || 0, qCurr),
                  formatCurrency(q.taxTotal || 0, qCurr),
                  formatCurrency(q.grandTotal || 0, qCurr),
                  qCurr,
                  q.status === "approved" ? "Onaylandı" : q.status === "invoiced" ? "Faturaya Dönüştü" : q.status === "rejected" ? "Reddedildi" : "Beklemede",
                ];
              }),
            })}
            size="sm"
          />
        </div>

        <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[750px]">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-4">Belge No</th>
                <th className="pb-2 px-4">Cari Müşteri</th>
                <th className="pb-2 px-4">Tarih / Geçerlilik</th>
                <th className="pb-2 px-4 text-right">Tutar</th>
                <th className="pb-2 px-4 text-center">Durum</th>
                <th className="pb-2 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    Kayıtlı proforma fatura bulunmuyor.
                  </td>
                </tr>
              ) : (
                displayedQuotes.map((q) => (
                  <tr
                    key={q.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-purple-950 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${q.quoteNumber.startsWith("TEK") ? "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" : "bg-purple-100 text-purple-800 border-purple-200"}`}>
                          {q.quoteNumber.startsWith("TEK") ? "TEKLİF" : "PROFORMA"}
                        </span>
                        <span>{q.quoteNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {q.contactName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div>{formatDate(q.issueDate)}</div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">
                        Geçerlilik: {formatDate(q.validUntil)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      ₺{q.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          q.status === "converted"
                            ? "bg-purple-50 text-purple-700 border border-purple-200 group-hover:border-purple-300"
                            : q.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:border-emerald-300"
                            : "bg-blue-50 text-blue-700 border border-blue-200 group-hover:border-blue-300"
                        }`}
                      >
                        {q.status === "converted"
                          ? "Faturaya Dönüştü"
                          : q.status === "approved"
                          ? "Onaylandı"
                          : "Gönderildi"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPrintingQuote(q)}
                          title="Yazdır / Resmi PDF Önizleme"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Yazdır</span>
                        </button>
                        <button
                          onClick={() => setWhatsAppQuote(q)}
                          title="Teklifi WhatsApp ile Paylaş"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                        {onConvertQuoteToOrder && (
                          <button
                            onClick={() => onConvertQuoteToOrder(q)}
                            title="Bu belgeyi yeni Satış Siparişine dönüştür"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Siparişe Gönder</span>
                          </button>
                        )}
                        <button
                          onClick={() => onConvertQuoteToInvoice(q)}
                          className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Gelir Faturasına Dönüştür</span>
                        </button>
                        <button
                          onClick={() => onDeleteQuote(q.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredQuotes.length > displayLimit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              Daha Fazla Göster ({displayLimit} / {filteredQuotes.length})
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Create New Quote / Proforma Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-purple-200/80 text-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Yeni Proforma Fatura Oluştur
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Top Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Müşteri Cari *
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full bg-white border border-purple-200/80 rounded-xl p-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proforma Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white border border-purple-200/80 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Son Geçerlilik Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white border border-purple-200/80 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Items & Product/Stock Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-purple-950 tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-purple-700" />
                    <span>Proforma Kalemleri & Stok / Hizmet Seçimi</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <PlusCircle className="w-4 h-4 text-purple-700" />
                    <span>Yeni Satır Ekle</span>
                  </button>
                </div>

                <div className="border border-purple-200/80 rounded-xl overflow-x-auto custom-scrollbar w-full shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="bg-purple-50/80 text-purple-950 font-extrabold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Ürün / Hizmet (Stoktan Seç & Açıklama)</th>
                        <th className="py-2.5 px-3 w-20 text-center">Miktar</th>
                        <th className="py-2.5 px-3 w-20 text-center">Birim</th>
                        <th className="py-2.5 px-3 w-28 text-right">Birim Fiyat (TL)</th>
                        <th className="py-2.5 px-3 w-24 text-center">KDV %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Toplam (TL)</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-purple-50/30">
                          <td className="p-2">
                            <div className="space-y-1">
                              {products.length > 0 && (
                                <select
                                  value={item.productId || ""}
                                  onChange={(e) =>
                                    handleItemChange(item.id, "productId", e.target.value)
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                >
                                  <option value="">-- Stok / Hizmet Kataloğundan Seç --</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.stockType ? `[${p.stockType}] ` : ""}{p.name} {p.barcode ? `(Barkod: ${p.barcode})` : ""} - ₺{p.sellPrice.toLocaleString("tr-TR")}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                required
                                placeholder="Açıklama (ör: Danışmanlık ve Hizmet Bedeli)"
                                value={item.description}
                                onChange={(e) =>
                                  handleItemChange(item.id, "description", e.target.value)
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                              />
                            </div>
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "quantity",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(item.id, "unit", e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-right font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={item.vatRate}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "vatRate",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            >
                              <option value={0}>%0</option>
                              <option value={1}>%1</option>
                              <option value={10}>%10</option>
                              <option value={20}>%20</option>
                            </select>
                          </td>

                          <td className="p-2 text-right font-black text-slate-900 text-xs">
                            ₺{item.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={items.length <= 1}
                              className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 bg-purple-50/60 p-3.5 rounded-xl border border-purple-200/80 space-y-1.5 text-xs shadow-2xs">
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Ara Toplam (KDV Hariç):</span>
                    <span className="font-bold text-slate-900">
                      ₺{subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Toplam KDV:</span>
                    <span className="font-bold text-slate-900">
                      ₺{totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-purple-950 pt-1.5 border-t border-purple-200/80">
                    <span>Genel Toplam:</span>
                    <span>
                      ₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proforma Notu / Şartlar
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Proforma şartları, ödeme planı veya teslimat notları..."
                  className="w-full bg-slate-50 border border-purple-200/80 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl cursor-pointer shadow-2xs transition-colors"
                >
                  Proforma Faturayı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Print Quote / Proforma Document */}
      {printingQuote && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-purple-200 text-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto print:max-h-none print:shadow-none print:m-0 print:w-full print:max-w-none print:border-none print:bg-white print:text-black">
            {/* Top Control Bar (Sticky at Top - Hidden on print) */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-3.5 sm:px-6 flex items-center justify-between z-20 border-b border-purple-800/40 shadow-sm shrink-0 print:hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wide border shrink-0 bg-purple-500/20 text-purple-200 border-purple-400/30">
                  Proforma Fatura
                </span>
                <span className="text-xs text-purple-200/90 font-mono font-bold truncate">
                  Belge No: {printingQuote.quoteNumber}
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setWhatsAppQuote(printingQuote)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                  <span>WhatsApp ile Gönder</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQuotePDF}
                  disabled={isDownloadingQuotePDF}
                  className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-purple-200" />
                  <span>{isDownloadingQuotePDF ? "PDF Hazırlanıyor..." : "PDF İndir"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span className="hidden sm:inline">Yazdır</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingQuote(null)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Pencereyi Kapat"
                >
                  <X className="w-4 h-4 text-rose-300" />
                  <span>Kapat</span>
                </button>
              </div>
            </div>

            {/* Scrollable Printable Document Sheet */}
            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible custom-scrollbar">
              <div id="printable-quote" className="bg-white text-slate-900 p-6 sm:p-8 border border-purple-100 rounded-xl space-y-6 print:border-none print:p-0">
              {/* Header Banner */}
              <div className="flex items-start justify-between border-b-2 border-purple-950 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Logo size="md" />
                  </div>
                  <h1 className="text-base font-black text-slate-900">
                    {companySettings?.title || "Örnek Teknoloji ve Danışmanlık A.Ş."}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-sm">
                    {companySettings?.address || "Büyükdere Cad. No:195 Levent, Beşiktaş / İstanbul"}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    VD: {companySettings?.taxOffice || "Boğaziçi"} - VKN: {companySettings?.taxNumber || "9876543210"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Tel: {companySettings?.phone || "0850 123 45 67"} | E-posta: {companySettings?.email || "info@sirket.com"}
                  </p>
                </div>

                <div className="text-right space-y-2">
                  <div className="inline-block bg-purple-950 text-white px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wider">
                    PROFORMA FATURA
                  </div>
                  <div className="text-xs text-slate-600 font-mono space-y-1">
                    <div><span className="font-bold text-slate-800">Belge No:</span> {printingQuote.quoteNumber}</div>
                    <div><span className="font-bold text-slate-800">Tarih:</span> {formatDate(printingQuote.issueDate)}</div>
                    <div><span className="font-bold text-slate-800">Son Geçerlilik:</span> {formatDate(printingQuote.validUntil)}</div>
                  </div>
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-purple-950 tracking-wider block">
                    Müşteri / Cari Bilgileri
                  </span>
                  <div className="text-sm font-black text-slate-900">
                    {contacts.find((c) => c.id === printingQuote.contactId)?.companyTitle || printingQuote.contactName}
                  </div>
                  <div className="text-xs text-slate-600">
                    {contacts.find((c) => c.id === printingQuote.contactId)?.address || "Türkiye"}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    VD: {contacts.find((c) => c.id === printingQuote.contactId)?.taxOffice || "-"} - VKN/TCKN: {contacts.find((c) => c.id === printingQuote.contactId)?.taxNumber || "-"}
                  </div>
                </div>

                <div className="space-y-1 md:border-l md:border-purple-200/60 md:pl-4">
                  <span className="text-[10px] font-black uppercase text-purple-950 tracking-wider block">
                    Ödeme & Şartlar Özeti
                  </span>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Durum:</span>{" "}
                    {printingQuote.status === "converted"
                      ? "Faturaya Dönüştü"
                      : printingQuote.status === "approved"
                      ? "Onaylandı"
                      : "Onay Bekliyor"}
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Banka IBAN:</span>{" "}
                    <span className="font-mono font-bold text-purple-900">{companySettings?.iban || "TR33 0006 2000 0000 1234 5678 90"}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-purple-200/80 rounded-xl overflow-x-auto custom-scrollbar w-full">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="bg-purple-950 text-white font-extrabold uppercase text-[10px]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Ürün / Hizmet Açıklaması</th>
                      <th className="py-2.5 px-3 text-center w-16">Miktar</th>
                      <th className="py-2.5 px-3 text-center w-16">Birim</th>
                      <th className="py-2.5 px-3 text-right w-28">Birim Fiyat</th>
                      <th className="py-2.5 px-3 text-center w-16">KDV</th>
                      <th className="py-2.5 px-3 text-right w-28">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {printingQuote.items.map((item, index) => (
                      <tr key={item.id || index} className="even:bg-purple-50/20">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{item.description}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{item.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₺{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">%{item.vatRate}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₺{item.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations & Written Amount */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 w-full sm:w-auto flex-1 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-purple-950">Yazı ile Tutar:</div>
                  <div className="text-xs font-bold italic text-slate-800">
                    # {numberToTurkishWords(printingQuote.grandTotal)} #
                  </div>
                </div>

                <div className="w-full sm:w-72 bg-purple-50/80 p-4 rounded-xl border border-purple-200 space-y-2 text-xs shadow-2xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Ara Toplam (KDV Hariç):</span>
                    <span className="font-bold text-slate-900">
                      ₺{(printingQuote.items.reduce((s, i) => s + (i.totalWithoutVat || i.quantity * i.unitPrice), 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Toplam KDV:</span>
                    <span className="font-bold text-slate-900">
                      ₺{(printingQuote.items.reduce((s, i) => s + (i.vatAmount || (i.quantity * i.unitPrice * i.vatRate) / 100), 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-purple-950 pt-2 border-t border-purple-300">
                    <span>GENEL TOPLAM:</span>
                    <span>₺{printingQuote.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {printingQuote.notes && (
                <div className="border border-purple-100 bg-purple-50/20 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-black uppercase text-purple-950 tracking-wider block">
                    Proforma Şartları & Notlar
                  </span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{printingQuote.notes}</p>
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-purple-100 text-center text-xs">
                <div className="space-y-12">
                  <div className="font-bold text-slate-900">Düzenleyen / Firma Yetkilisi</div>
                  <div className="border-b border-dashed border-slate-300 mx-8"></div>
                  <div className="text-[10px] text-slate-400">İmza / Kaşe</div>
                </div>
                <div className="space-y-12">
                  <div className="font-bold text-slate-900">Onaylayan / Müşteri Yetkilisi</div>
                  <div className="border-b border-dashed border-slate-300 mx-8"></div>
                  <div className="text-[10px] text-slate-400">İmza / Kaşe / Onay Tarihi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* WhatsApp Share Modal */}
      {whatsAppQuote && (
        <UniversalWhatsAppModal
          isOpen={!!whatsAppQuote}
          onClose={() => setWhatsAppQuote(null)}
          title="WhatsApp ile Fiyat Teklifi Paylaş"
          documentTypeLabel="Proforma Fatura / Teklif"
          recipientName={whatsAppQuote.contactName}
          recipientPhone={contacts.find((c) => c.id === whatsAppQuote.contactId)?.phone || ""}
          defaultMessage={formatQuoteWhatsAppMessage(
            whatsAppQuote,
            companySettings,
            contacts.find((c) => c.id === whatsAppQuote.contactId)
          )}
          documentFileName={`${whatsAppQuote.quoteNumber}_Teklif.pdf`}
          companySettings={companySettings}
          onGeneratePdf={async () => {
            const el = document.getElementById("printable-quote");
            if (el) {
              const { exportElementToPDFWithPrintStyling } = await import("../utils/pdfService");
              return exportElementToPDFWithPrintStyling("printable-quote", `${whatsAppQuote.quoteNumber}_Teklif.pdf`, {
                orientation: "p",
                margin: 8,
                scale: 1.6,
              });
            }
            const { generateAutoTableFromExportData } = await import("../utils/pdfService");
            const expData: ExportData = {
              filename: `${whatsAppQuote.quoteNumber}_Teklif`,
              title: `${companySettings?.companyName || "Fiyat Teklifi"} - ${whatsAppQuote.quoteNumber}`,
              subtitle: `Müşteri: ${whatsAppQuote.contactName} | Düzenlenme: ${formatDate(whatsAppQuote.issueDate)} | Toplam: ${formatCurrency(whatsAppQuote.grandTotal)}`,
              headers: ["Ürün / Hizmet", "Miktar", "Birim", "Birim Fiyat", "KDV %", "Toplam"],
              rows: (whatsAppQuote.items || []).map((i) => [
                i.description,
                i.quantity,
                i.unit || "Adet",
                formatCurrency(i.unitPrice),
                `%${i.vatRate ?? 20}`,
                formatCurrency(i.totalWithVat || i.quantity * i.unitPrice * (1 + (i.vatRate ?? 20) / 100)),
              ]),
            };
            return generateAutoTableFromExportData(expData);
          }}
        />
      )}
    </div>
  );
};
