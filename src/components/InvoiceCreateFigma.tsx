import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Search,
  MoreHorizontal,
  MoreVertical,
  Phone,
  Mail,
  Flag,
  Building,
  Edit2,
  ChevronDown,
  ArrowUpDown,
  Check,
  Download,
  Calendar,
  Layers,
} from "lucide-react";
import geometricPattern from "../assets/patterns/geometric-pattern.jpg";
import { Contact, Product, Invoice, InvoiceItem } from "../types";

interface InvoiceCreateFigmaProps {
  contacts?: Contact[];
  products?: Product[];
  initialType?: "sales" | "purchase";
  initialContactId?: string | null;
  onSave?: (invoice: Invoice) => void;
  onClose?: () => void;
}

interface FigmaInvoiceLineItem {
  id: string;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  vatStatus: "Dahil" | "Hariç";
}

// Figma görselindeki varsayılan 4 kalem
const DEFAULT_FIGMA_ITEMS: FigmaInvoiceLineItem[] = [
  {
    id: "item-1",
    code: "032",
    name: "UI/UX Arayüz tasarım hizmeti (Figma)",
    quantity: 24,
    unit: "Adet",
    unitPrice: 100000,
    vatRate: 20,
    vatStatus: "Dahil",
  },
  {
    id: "item-2",
    code: "12244485",
    name: "Mal/Hizmet Adı",
    quantity: 60,
    unit: "Saat",
    unitPrice: 100000,
    vatRate: 20,
    vatStatus: "Dahil",
  },
  {
    id: "item-3",
    code: "12244485",
    name: "Mal/Hizmet Adı",
    quantity: 60,
    unit: "Saat",
    unitPrice: 100000,
    vatRate: 20,
    vatStatus: "Dahil",
  },
  {
    id: "item-4",
    code: "12244485",
    name: "Mal/Hizmet Adı",
    quantity: 60,
    unit: "Saat",
    unitPrice: 100000,
    vatRate: 20,
    vatStatus: "Dahil",
  },
];

export const InvoiceCreateFigma: React.FC<InvoiceCreateFigmaProps> = ({
  contacts = [],
  products = [],
  initialType = "sales",
  initialContactId,
  onSave,
  onClose,
}) => {
  // 1. Stepper State
  const [currentStep, setCurrentStep] = useState<number>(2); // Mockup shows step 2 active

  // 2. Fatura Bilgileri State
  const [docNumber, setDocNumber] = useState<string>("---");
  const [scenario, setScenario] = useState<string>("Ticari Fatura");
  const [docType, setDocType] = useState<string>("E-Fatura");
  const [series, setSeries] = useState<string>("QAA");
  const [invoiceType, setInvoiceType] = useState<string>("Satış");
  const [currency, setCurrency] = useState<string>("TRY");
  const [exchangeRate, setExchangeRate] = useState<string>("0,000");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [category, setCategory] = useState<string>("Seçim yapın");
  const [tag, setTag] = useState<string>("Seçim yapın");

  // 3. Alıcı Bilgileri State
  const defaultContact = useMemo(() => {
    if (initialContactId) {
      const found = contacts.find((c) => c.id === initialContactId);
      if (found) return found;
    }
    return (
      contacts[0] || {
        id: "c_default",
        name: "Aldacı Design & Development Ersel Aktaş",
        taxOffice: "Eskişehir VD",
        taxNumber: "24343795000",
        phone: "+90 055222795085",
        email: "info@aldaci.com",
        address: "Hoşnudiye Mh. Çiftkurt Sk. HKS Plaza 1/3 TEPEBAŞI - ESKİŞEHİR",
        balance: 0,
        type: "customer" as const,
      }
    );
  }, [contacts, initialContactId]);

  const [selectedContactId, setSelectedContactId] = useState<string>(
    defaultContact.id
  );
  const activeContact = useMemo(() => {
    return (
      contacts.find((c) => c.id === selectedContactId) || defaultContact
    );
  }, [contacts, selectedContactId, defaultContact]);

  // 4. Mal & Hizmet Kalemleri
  const [items, setItems] = useState<FigmaInvoiceLineItem[]>(DEFAULT_FIGMA_ITEMS);
  const [tableSearchTerm, setTableSearchTerm] = useState<string>("");

  // 5. Not ve Alt Toplamlar
  const [invoiceNote, setInvoiceNote] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(200000);
  const [roundingAmount, setRoundingAmount] = useState<number>(1000);

  // Formatting Helper: 2.400.020,00
  const formatMoney = (val: number): string => {
    return val.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Hesaplamalar
  const lineItemTotals = useMemo(() => {
    return items.map((item) => {
      const gross = item.quantity * item.unitPrice;
      const vat = gross * (item.vatRate / 100);
      return {
        ...item,
        total: gross,
        vatAmount: vat,
      };
    });
  }, [items]);

  const subtotal = useMemo(() => {
    return lineItemTotals.reduce((acc, curr) => acc + curr.total, 0);
  }, [lineItemTotals]);

  const totalVat = useMemo(() => {
    return lineItemTotals.reduce((acc, curr) => acc + curr.vatAmount, 0);
  }, [lineItemTotals]);

  const grandTotal = useMemo(() => {
    return subtotal - discountAmount + totalVat;
  }, [subtotal, discountAmount, totalVat]);

  const payableTotal = useMemo(() => {
    return grandTotal - roundingAmount;
  }, [grandTotal, roundingAmount]);

  // Yeni Satır Ekle
  const handleAddNewItem = () => {
    const newItem: FigmaInvoiceLineItem = {
      id: `item-${Date.now()}`,
      code: "12244485",
      name: "Mal/Hizmet Adı",
      quantity: 1,
      unit: "Adet",
      unitPrice: 10000,
      vatRate: 20,
      vatStatus: "Dahil",
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof FigmaInvoiceLineItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Faturayı Kaydet
  const handleSaveInvoice = () => {
    if (onSave) {
      const nowStr = new Date().toISOString();
      const compiledInvoice: Invoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber:
          docNumber && docNumber !== "---"
            ? docNumber
            : `${series}${Date.now().toString().slice(-9)}`,
        type: invoiceType === "Satış" ? "sales" : "purchase",
        contactId: activeContact.id,
        contactName: activeContact.name,
        taxNumber: activeContact.taxNumber,
        issueDate: nowStr.slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: "sent",
        currency: currency || "TRY",
        createdAt: nowStr,
        items: items.map((it) => {
          const totalNoVat = it.quantity * it.unitPrice;
          const vatAmt = totalNoVat * (it.vatRate / 100);
          return {
            id: it.id,
            description: it.name,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: it.unitPrice,
            vatRate: it.vatRate,
            totalWithoutVat: totalNoVat,
            vatAmount: vatAmt,
            totalWithVat: totalNoVat + vatAmt,
          };
        }),
        subtotal,
        totalVat,
        grandTotal,
        payableAmount: payableTotal,
        paidAmount: 0,
        remainingAmount: payableTotal,
        notes: invoiceNote,
      };
      onSave(compiledInvoice);
    } else {
      alert("Fatura başarıyla oluşturuldu ve sisteme kaydedildi!");
      if (onClose) onClose();
    }
  };

  // Tabloda arama filtresi
  const filteredItems = useMemo(() => {
    if (!tableSearchTerm.trim()) return lineItemTotals;
    const q = tableSearchTerm.toLowerCase().trim();
    return lineItemTotals.filter(
      (it) =>
        it.code.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        it.unit.toLowerCase().includes(q)
    );
  }, [lineItemTotals, tableSearchTerm]);

  return (
    <div className="w-full bg-white select-none font-sans text-slate-800 space-y-6">
      {/* ========================================================= */}
      {/* 1. TOP TITLE & ACTION BUTTONS BAR                         */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Fatura Oluştur
        </h2>

        <div className="flex items-center gap-3">
          {/* Faturayı Kaydet Button */}
          <button
            type="button"
            onClick={handleSaveInvoice}
            style={{ backgroundColor: "#7C3AED" }}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-200" />
            <span>Faturayı Kaydet</span>
          </button>

          {/* Close Button (✕) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MULTI-STEP PROGRESS STEPPER                            */}
      {/* ========================================================= */}
      <div className="flex items-center gap-3 py-1 overflow-x-auto text-xs font-medium">
        {/* Step 1: Ana bilgiler */}
        <div
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2 cursor-pointer shrink-0"
        >
          <div className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            1
          </div>
          <span className="text-slate-700 font-semibold">Ana bilgiler</span>
        </div>

        <div className="w-8 h-[1px] bg-slate-200 shrink-0" />

        {/* Step 2: Ödeme bilgileri (Active in Figma Mockup) */}
        <div
          onClick={() => setCurrentStep(2)}
          className="border-2 border-[#7C3AED] rounded-xl px-4 py-1.5 flex items-center gap-2 bg-purple-50/40 cursor-pointer shrink-0 shadow-2xs"
        >
          <div className="w-6 h-6 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-xs font-bold">
            2
          </div>
          <span className="text-[#351F62] font-bold">Ödeme bilgileri</span>
        </div>

        <div className="w-8 h-[1px] bg-slate-200 shrink-0" />

        {/* Step 3: Step Label */}
        <div
          onClick={() => setCurrentStep(3)}
          className="flex items-center gap-2 cursor-pointer shrink-0 text-slate-400"
        >
          <div className="w-6 h-6 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-xs font-semibold">
            3
          </div>
          <span>Step Label</span>
        </div>

        <div className="w-8 h-[1px] bg-slate-200 shrink-0" />

        {/* Step 4: Membership */}
        <div
          onClick={() => setCurrentStep(4)}
          className="flex items-center gap-2 cursor-pointer shrink-0 text-slate-300"
        >
          <div className="w-6 h-6 rounded-full border border-slate-200 text-slate-300 flex items-center justify-center text-xs">
            4
          </div>
          <span>Membership</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SECTION: FATURA BİLGİLERİ                              */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900">Fatura Bilgileri</h3>

        {/* Row 1: Belge Numarası, Senaryo, Belge tipi, Seri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Belge Numarası */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-400">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Belge Numarası
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="---"
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium placeholder-slate-400"
            />
          </div>

          {/* Senaryo */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Senaryo
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="Ticari Fatura">Ticari Fatura</option>
              <option value="Temel Fatura">Temel Fatura</option>
              <option value="Kamu">Kamu</option>
              <option value="Hal">Hal</option>
            </select>
          </div>

          {/* Belge tipi */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Belge tipi
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="E-Fatura">E-Fatura</option>
              <option value="E-Arşiv">E-Arşiv</option>
              <option value="Kağıt Fatura">Kağıt Fatura</option>
            </select>
          </div>

          {/* Seri */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Seri
            </label>
            <select
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="QAA">QAA</option>
              <option value="MUV">MUV</option>
              <option value="GIB">GIB</option>
              <option value="EAR">EAR</option>
            </select>
          </div>
        </div>

        {/* Row 2: Fatura Tipi, Para Birimi, Döviz Kuru */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Fatura Tipi (spans 2) */}
          <div className="sm:col-span-2 relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Fatura Tipi
            </label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="Satış">Satış</option>
              <option value="Alış">Alış</option>
              <option value="İade">İade</option>
              <option value="Tevkifat">Tevkifat</option>
              <option value="İstisna">İstisna</option>
              <option value="Özel Matrah">Özel Matrah</option>
            </select>
          </div>

          {/* Para Birimi */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Para Birimi
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          {/* Döviz Kuru */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Döviz Kuru
            </label>
            <input
              type="text"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="0,000"
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium placeholder-slate-400"
            />
          </div>
        </div>

        {/* Row 3: Fatura Zamanı, Kategori, Etiket */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Fatura Zamanı (spans 2) */}
          <div className="sm:col-span-2 relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Fatura Zamanı
            </label>
            <input
              type="datetime-local"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium"
            />
          </div>

          {/* Kategori */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="Seçim yapın">Seçim yapın</option>
              <option value="Yazılım Geliştirme">Yazılım Geliştirme</option>
              <option value="Tasarım & UI/UX">Tasarım & UI/UX</option>
              <option value="Danışmanlık">Danışmanlık</option>
              <option value="Ticari Mal Satışı">Ticari Mal Satışı</option>
            </select>
          </div>

          {/* Etiket */}
          <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Etiket
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium cursor-pointer"
            >
              <option value="Seçim yapın">Seçim yapın</option>
              <option value="Öncelikli">Öncelikli</option>
              <option value="Yıllık Sözleşme">Yıllık Sözleşme</option>
              <option value="Aylık Düzenli">Aylık Düzenli</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. SECTION: ALICI BİLGİLERİ                               */}
      {/* ========================================================= */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900">Alıcı Bilgileri</h3>

        <div className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-4">
          {/* Top Row: Avatar + Alıcı Select + Tax details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar with Edit Icon */}
            <div className="relative shrink-0 self-start sm:self-center">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 bg-purple-50 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
                  alt="Alıcı Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-xs cursor-pointer"
                title="Alıcıyı Düzenle"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Notched Alıcı Selector */}
            <div className="flex-1 space-y-1.5">
              <div className="relative border border-slate-200 rounded-xl px-3.5 pt-2.5 pb-2 bg-white focus-within:border-purple-500">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
                  Alıcı
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  {contacts.length > 0 ? (
                    contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="c_default">
                      Aldacı Design & Development Ersel Aktaş
                    </option>
                  )}
                </select>
              </div>

              {/* Tax Office & Tax Number */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-medium text-slate-600">
                  {activeContact.taxOffice || "Eskişehir VD"}
                </span>
                <span className="font-mono text-slate-400">
                  #{activeContact.taxNumber || "24343795000"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Phone, Email, Country / Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Left Contact Fields */}
            <div className="space-y-2">
              {/* Phone */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{activeContact.phone || "+90 055222795085"}</span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{activeContact.email || "info@aldaci.com"}</span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Country */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                  <Flag className="w-4 h-4 text-slate-400" />
                  <span>Türkiye</span>
                </div>
              </div>
            </div>

            {/* Right Address Field */}
            <div>
              <div className="h-full flex items-start justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-slate-700">
                <div className="flex items-start gap-2.5 font-medium">
                  <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {activeContact.address ||
                      "Hoşnudiye Mh. Çiftkurt Sk. HKS Plaza 1/3 TEPEBAŞI - ESKİŞEHİR"}
                  </span>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. SECTION: MAL & HİZMET BİLGİLERİ (FIGMA BANNER TABLE)   */}
      {/* ========================================================= */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs bg-white">
        {/* Banner with Geometric Pattern & Purple Gradient */}
        <div className="relative w-full h-[74px] overflow-hidden flex items-center px-6">
          <img
            src={geometricPattern}
            alt="Desen"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-35 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#5C39AF]/95 via-[#4F3096]/92 to-[#351F62]/95 pointer-events-none" />

          {/* Top Row Inside Banner */}
          <div className="relative z-10 w-full flex items-center justify-between">
            {/* Title with Archival Cabinet SVG */}
            <div className="flex items-center gap-3">
              <svg
                className="w-7 h-7 text-white shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="6" rx="1.5" />
                <path d="M4 10v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M9 14h6" />
              </svg>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Mal & Hizmet Bilgileri
              </h3>
            </div>

            {/* Right: [+] Add Row Button & [Q Tabloda ara] */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddNewItem}
                className="w-8 h-8 rounded-lg bg-white text-[#7C3AED] hover:bg-purple-50 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                title="Yeni Mal/Hizmet Satırı Ekle"
              >
                <Plus className="w-4 h-4 font-bold" />
              </button>

              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearchTerm}
                  onChange={(e) => setTableSearchTerm(e.target.value)}
                  placeholder="Tabloda ara"
                  className="w-full bg-white text-slate-800 placeholder:text-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-lg shadow-xs border-0 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphic Column Headers Bar */}
        <div
          style={{ backgroundColor: "rgba(53, 31, 98, 0.20)" }}
          className="relative z-10 w-full h-[46px] px-6 border-b border-white/15 backdrop-blur-[24px] flex items-center text-[11px] font-semibold text-white/95"
        >
          <div className="w-24 border-r border-white/10 pr-2 flex items-center gap-1">
            <span>Mal / Hizmet Kodu</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="flex-1 min-w-[180px] px-3 border-r border-white/10 flex items-center gap-1">
            <span>Mal / Hizmet Adı</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="w-16 px-2 text-center border-r border-white/10 flex items-center justify-center gap-1">
            <span>Miktar</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="w-16 px-2 text-center border-r border-white/10 flex items-center justify-center gap-1">
            <span>Birim</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="w-24 px-2 text-right border-r border-white/10 flex items-center justify-end gap-1">
            <span>Birim Fiyatı</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="w-28 px-2 text-right border-r border-white/10 flex items-center justify-end gap-1">
            <span>Tutar</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="w-16 px-2 text-center border-r border-white/10 flex items-center justify-center gap-1">
            <span>KDV Oranı</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="w-16 px-2 text-center border-r border-white/10">
            <span>KDV Durum</span>
          </div>
          <div className="w-24 px-2 text-right border-r border-white/10 flex items-center justify-end gap-1">
            <span>KDV Tutar</span>
            <ArrowUpDown className="w-3 h-3 opacity-70" />
          </div>
          <div className="w-12 text-center">
            <span>Action</span>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 text-xs text-slate-700 bg-white">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="px-6 py-3 flex items-center hover:bg-slate-50/60 transition-colors"
            >
              {/* Mal/Hizmet Kodu */}
              <div className="w-24 border-r border-slate-100 pr-2 font-mono text-slate-600 truncate">
                {item.code}
              </div>

              {/* Mal/Hizmet Adı */}
              <div className="flex-1 min-w-[180px] px-3 border-r border-slate-100 font-medium text-slate-900 truncate">
                {item.name}
              </div>

              {/* Miktar */}
              <div className="w-16 px-2 text-center border-r border-slate-100 tabular-nums font-semibold">
                {item.quantity}
              </div>

              {/* Birim */}
              <div className="w-16 px-2 text-center border-r border-slate-100 text-slate-600">
                {item.unit}
              </div>

              {/* Birim Fiyatı */}
              <div className="w-24 px-2 text-right border-r border-slate-100 tabular-nums">
                {formatMoney(item.unitPrice)}
              </div>

              {/* Tutar */}
              <div className="w-28 px-2 text-right border-r border-slate-100 tabular-nums font-semibold text-slate-900">
                {formatMoney(item.total)}
              </div>

              {/* KDV Oranı */}
              <div className="w-16 px-2 text-center border-r border-slate-100 text-slate-600">
                %{item.vatRate}
              </div>

              {/* KDV Durum */}
              <div className="w-16 px-2 text-center border-r border-slate-100 text-slate-600">
                {item.vatStatus}
              </div>

              {/* KDV Tutar */}
              <div className="w-24 px-2 text-right border-r border-slate-100 tabular-nums font-medium text-slate-800">
                {formatMoney(item.vatAmount)}
              </div>

              {/* Action (...) */}
              <div className="w-12 text-center">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Satırı Kaldır"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. BOTTOM SECTION: FATURA NOTU & TOPLAM HESAPLAMALARI      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 items-start">
        {/* Left: Notched Fatura Notu (5 cols) */}
        <div className="lg:col-span-6 relative border border-slate-200 rounded-2xl p-4 bg-white focus-within:border-purple-500 min-h-[170px]">
          <label className="absolute -top-2.5 left-4 bg-white px-1.5 text-xs font-medium text-slate-500 select-none">
            Fatura Notu
          </label>
          <textarea
            rows={5}
            value={invoiceNote}
            onChange={(e) => setInvoiceNote(e.target.value)}
            placeholder="Notunuzu yazın"
            className="w-full h-full bg-transparent text-xs text-slate-800 outline-none resize-none placeholder-slate-400"
          />
        </div>

        {/* Right: Notched Calculation Boxes (6 cols) */}
        <div className="lg:col-span-6 space-y-3.5">
          {/* 1. Mal / Hizmet Toplam Tutarı */}
          <div className="relative border border-slate-200 rounded-xl px-4 py-2.5 bg-white flex items-center justify-between">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Mal / Hizmet Toplam Tutarı
            </label>
            <div className="w-full text-right font-bold text-xs sm:text-sm text-slate-800 tabular-nums">
              {formatMoney(subtotal)}
            </div>
          </div>

          {/* 2. Fatura Altı İskonto */}
          <div className="relative border border-slate-200 rounded-xl px-4 py-2.5 bg-white flex items-center justify-between">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Fatura Altı İskonto
            </label>
            <div className="w-full text-right font-bold text-xs sm:text-sm text-slate-800 tabular-nums">
              {formatMoney(discountAmount)}
            </div>
          </div>

          {/* 3. Vergi Dahil Toplam Tutar */}
          <div className="relative border border-slate-200 rounded-xl px-4 py-2.5 bg-white flex items-center justify-between">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Vergi Dahil Toplam Tutar
            </label>
            <div className="w-full text-right font-bold text-xs sm:text-sm text-slate-800 tabular-nums">
              {formatMoney(grandTotal)}
            </div>
          </div>

          {/* 4. Yuvarlama Tutar */}
          <div className="relative border border-slate-200 rounded-xl px-4 py-2.5 bg-white flex items-center justify-between">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-slate-500 select-none">
              Yuvarlama Tutar
            </label>
            <div className="w-full text-right font-bold text-xs sm:text-sm text-slate-800 tabular-nums">
              {formatMoney(roundingAmount)}
            </div>
          </div>

          {/* 5. Ödenecek Tutar (#7C3AED Bold Purple) */}
          <div className="relative border-2 border-purple-300 rounded-xl px-4 py-2.5 bg-purple-50/20 flex items-center justify-between shadow-2xs">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-bold text-[#7C3AED] select-none">
              Ödenecek Tutar
            </label>
            <div className="w-full text-right font-extrabold text-sm sm:text-base text-[#7C3AED] tabular-nums">
              {formatMoney(payableTotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
