import React, { useState } from "react";
import {
  Invoice,
  InvoiceItem,
  InvoiceType,
  InvoiceStatus,
  Contact,
  Product,
  Account,
  CompanySettings,
} from "../types";
import { InvoicePrintModal } from "./InvoicePrintModal";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency } from "../utils/exportUtils";
import {
  FileText,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CreditCard,
  DollarSign,
  PlusCircle,
} from "lucide-react";

interface InvoicesProps {
  invoices: Invoice[];
  contacts: Contact[];
  products: Product[];
  accounts: Account[];
  companySettings: CompanySettings;
  forcedType?: "sales" | "purchase";
  globalSearchTerm?: string;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onAddTransactionFromInvoice: (
    invoice: Invoice,
    accountId: string,
    paidAmount: number
  ) => void;
  initialContactIdForNewInvoice?: string | null;
}

export const Invoices: React.FC<InvoicesProps> = ({
  invoices,
  contacts,
  products,
  accounts,
  companySettings,
  forcedType,
  globalSearchTerm = "",
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddTransactionFromInvoice,
  initialContactIdForNewInvoice,
}) => {
  const [filterType, setFilterType] = useState<string>(forcedType || "all");
  const [search, setSearch] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(
    !!initialContactIdForNewInvoice
  );
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);

  // Payment Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ""
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // New Invoice Form State
  const [invType, setInvType] = useState<InvoiceType>(forcedType || "sales");
  const [contactId, setContactId] = useState<string>(
    initialContactIdForNewInvoice || contacts[0]?.id || ""
  );
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("Ödemenin süresinde yapılması rica olunur.");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "item_1",
      description: "Yazılım Danışmanlık ve Sistem Destek Hizmeti",
      quantity: 1,
      unit: "Adet",
      unitPrice: 5000,
      vatRate: 20,
      totalWithoutVat: 5000,
      vatAmount: 1000,
      totalWithVat: 6000,
    },
  ]);

  // Recalculate invoice totals dynamically
  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    const computedItems = items.map((item) => {
      const lineWithoutVat = item.quantity * item.unitPrice;
      const lineVat = (lineWithoutVat * item.vatRate) / 100;
      const lineWithVat = lineWithoutVat + lineVat;

      subtotal += lineWithoutVat;
      totalVat += lineVat;

      return {
        ...item,
        totalWithoutVat: lineWithoutVat,
        vatAmount: lineVat,
        totalWithVat: lineWithVat,
      };
    });

    const grandTotal = subtotal + totalVat;

    return { subtotal, totalVat, grandTotal, computedItems };
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: "item_" + Date.now(),
        description: "",
        quantity: 1,
        unit: "Adet",
        unitPrice: 0,
        vatRate: 20,
        totalWithoutVat: 0,
        vatAmount: 0,
        totalWithVat: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "productId" && value) {
            const prod = products.find((p) => p.id === value);
            if (prod) {
              let desc = prod.name;
              if (prod.imeiOrSerialNo) {
                desc += ` (SN/IMEI: ${prod.imeiOrSerialNo})`;
              }
              updated.description = desc;
              updated.unit = prod.unit;
              updated.unitPrice = invType === "sales" ? prod.sellPrice : prod.buyPrice;
              updated.vatRate = prod.vatRate;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    const { subtotal, totalVat, grandTotal, computedItems } = calculateTotals();

    const prefix = invType === "sales" ? "MUV2026" : "ALS2026";
    const nextSeq = String(invoices.length + 1).padStart(7, "0");

    const newInvoice: Invoice = {
      id: "inv_" + Date.now(),
      invoiceNumber: `${prefix}${nextSeq}`,
      type: invType,
      contactId: contact.id,
      contactName: contact.name,
      taxNumber: contact.taxNumber,
      issueDate,
      dueDate,
      items: computedItems,
      subtotal,
      totalVat,
      grandTotal,
      paidAmount: 0,
      remainingAmount: grandTotal,
      status: "sent",
      currency: "TRY",
      notes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    onAddInvoice(newInvoice);
    setIsCreateModalOpen(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    onAddTransactionFromInvoice(paymentModalInvoice, selectedAccountId, paymentAmount);
    setPaymentModalInvoice(null);
  };

  // Filter logic
  const activeSearchQuery = (globalSearchTerm || search).toLowerCase().trim();
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !activeSearchQuery ||
      inv.invoiceNumber.toLowerCase().includes(activeSearchQuery) ||
      inv.contactName.toLowerCase().includes(activeSearchQuery) ||
      (inv.notes && inv.notes.toLowerCase().includes(activeSearchQuery)) ||
      inv.items.some((item) => item.description.toLowerCase().includes(activeSearchQuery));

    if (!matchesSearch) return false;

    if (filterType === "sales") return inv.type === "sales";
    if (filterType === "purchase") return inv.type === "purchase";
    if (filterType === "overdue") return inv.status === "overdue";
    if (filterType === "paid") return inv.status === "paid";
    if (filterType === "pending") return inv.status === "sent" || inv.status === "partial";

    return true;
  });

  const { subtotal, totalVat, grandTotal } = calculateTotals();

  const getInvoicesExportData = (): ExportData => {
    const headers = [
      "Fatura No",
      "Fatura Tipi",
      "Cari Hesap / Müşteri",
      "Düzenleme Tarihi",
      "Vade Tarihi",
      "KDV Hariç Tutar",
      "KDV Tutarı",
      "Genel Toplam",
      "Ödenen Tutar",
      "Kalan Bakiye",
      "Para Birimi",
      "Durum",
      "Açıklama / Kalem Özeti",
    ];
    const rows = filteredInvoices.map((inv) => {
      const statusLabel =
        inv.status === "paid"
          ? "Ödendi"
          : inv.status === "partial"
          ? "Kısmi Ödendi"
          : inv.status === "overdue"
          ? "Vadesi Geçti"
          : inv.status === "sent"
          ? "Gönderildi"
          : "Taslak";
      const typeLabel = inv.type === "sales" ? "Satış (Gelir) Faturası" : "Alış (Gider) Faturası";
      const itemsSummary = inv.items.map((i) => `${i.description} (${i.quantity} ${i.unit})`).join("; ");
      const invCurrency = inv.currency || "TRY";

      return [
        inv.invoiceNumber,
        typeLabel,
        inv.contactName,
        inv.issueDate,
        inv.dueDate || "-",
        formatCurrency(inv.subtotal || 0, invCurrency),
        formatCurrency(inv.totalVat ?? (inv as any).vatTotal ?? 0, invCurrency),
        formatCurrency(inv.grandTotal || 0, invCurrency),
        formatCurrency(inv.paidAmount || 0, invCurrency),
        formatCurrency(inv.remainingAmount ?? ((inv.grandTotal || 0) - (inv.paidAmount || 0)), invCurrency),
        invCurrency,
        statusLabel,
        itemsSummary,
      ];
    });

    return {
      filename: `Fatura_Listesi_${new Date().toISOString().split("T")[0]}`,
      title: forcedType === "sales" ? "SATIŞ FATURALARI LİSTESİ" : forcedType === "purchase" ? "ALIŞ FATURALARI LİSTESİ" : "TÜM FATURALAR LİSTESİ",
      subtitle: `Toplam ${filteredInvoices.length} Adet Fatura Kaydı`,
      headers,
      rows,
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-400/10"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="relative z-10">
          <h2 className="text-lg font-extrabold text-slate-950">
            {forcedType === "sales"
              ? "Gelir Faturaları (Satış)"
              : forcedType === "purchase"
              ? "Gider Faturaları (Alış)"
              : "Gelir & Gider Faturaları"}
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            {forcedType === "sales"
              ? "Müşterilerinize kestiğiniz gelir faturaları ve tahsilat takibi."
              : forcedType === "purchase"
              ? "Tedarikçilerden gelen gider faturaları ve ödeme takibi."
              : "Resmi e-Fatura / e-Arşiv uyumlu faturalarınızı oluşturun ve ödeme takibi yapın."}
          </p>
        </div>

        <button
          onClick={() => {
            if (forcedType) setInvType(forcedType);
            setIsCreateModalOpen(true);
          }}
          className="relative z-10 bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-purple-800 font-bold" />
          <span>
            {forcedType === "sales"
              ? "Yeni Gelir Faturası Kes"
              : forcedType === "purchase"
              ? "Yeni Gider Faturası Kaydet"
              : "Yeni Fatura Kes / Kaydet"}
          </span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs">
          {!forcedType ? (
            <>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === "all" ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Tüm Faturalar ({invoices.length})
              </button>
              <button
                onClick={() => setFilterType("sales")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === "sales" ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Gelir Faturaları
              </button>
              <button
                onClick={() => setFilterType("purchase")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === "purchase" ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Gider Faturaları
              </button>
            </>
          ) : (
            <button
              onClick={() => setFilterType(forcedType)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === forcedType ? "bg-white text-purple-700 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
              }`}
            >
              Tümü ({invoices.filter((i) => i.type === forcedType).length})
            </button>
          )}
          <button
            onClick={() => setFilterType("pending")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "pending" ? "bg-white text-blue-600 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Bekleyenler
          </button>
          <button
            onClick={() => setFilterType("overdue")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "overdue" ? "bg-white text-amber-600 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Vadesi Geçenler
          </button>
          <button
            onClick={() => setFilterType("paid")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === "paid" ? "bg-white text-emerald-600 font-bold shadow-2xs border border-purple-200/60" : "text-purple-900/70 hover:text-purple-950"
            }`}
          >
            Ödenmiş
          </button>
        </div>

        {/* Search & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Fatura No veya Müşteri ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
            />
          </div>
          <ExportButtons getExportData={getInvoicesExportData} size="sm" />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-3 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-4">Fatura No / Tip</th>
                <th className="pb-2 px-4">Cari Hesap</th>
                <th className="pb-2 px-4">Tarih / Vade</th>
                <th className="pb-2 px-4 text-right">KDV Hariç</th>
                <th className="pb-2 px-4 text-right">Genel Toplam</th>
                <th className="pb-2 px-4 text-center">Durum</th>
                <th className="pb-2 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    Kayıtlı fatura bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                  >
                    <td className="py-3.5 px-4 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-extrabold text-slate-900 group-hover:text-purple-950 font-mono text-sm transition-colors">
                        {inv.invoiceNumber}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.2 text-[10px] font-bold rounded uppercase mt-0.5 transition-all ${
                          inv.type === "sales"
                            ? "bg-blue-50 text-blue-700 border border-blue-200 group-hover:border-blue-300"
                            : "bg-amber-50 text-amber-700 border border-amber-200 group-hover:border-amber-300"
                        }`}
                      >
                        {inv.type === "sales" ? "Satış" : "Alış"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      {inv.contactName}
                      {inv.taxNumber && (
                        <div className="text-[10px] font-normal text-slate-400 group-hover:text-purple-700/60">
                          VKN: {inv.taxNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="font-medium text-slate-800 group-hover:text-slate-900">{inv.issueDate}</div>
                      <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">Vade: {inv.dueDate}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 group-hover:text-slate-900 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      ₺{inv.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      ₺{inv.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          inv.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:border-emerald-300"
                            : inv.status === "overdue"
                            ? "bg-amber-50 text-amber-700 border border-amber-200 group-hover:border-amber-300"
                            : "bg-blue-50 text-blue-700 border border-blue-200 group-hover:border-blue-300"
                        }`}
                      >
                        {inv.status === "paid" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ödendi
                          </>
                        ) : inv.status === "overdue" ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Vadesi Geçti
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-blue-600" />
                            Bekliyor
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print / View Modal */}
                        <button
                          onClick={() => setPrintingInvoice(inv)}
                          title="Faturayı Görüntüle & e-Fatura Yazdır"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Baskı / e-Fatura</span>
                        </button>

                        {/* Add Payment / Collection */}
                        {inv.status !== "paid" && (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPaymentAmount(inv.remainingAmount);
                            }}
                            title="Tahsilat / Ödeme Ekle"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          title="Faturayı Sil"
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create New Invoice */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Yeni Fatura Hazırla (Satış / Alış)
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-5">
              {/* Top Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fatura Tipi *
                  </label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value as InvoiceType)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="sales">Satış Faturası (Müşteriye)</option>
                    <option value="purchase">Alış Faturası (Tedarikçiden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cari Hesap *
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900"
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
                    Fatura Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Son Ödeme (Vade) Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Dynamic Invoice Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Fatura Kalemleri & Ürün/Hizmetler
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Satır Ekle</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Ürün / Açıklama</th>
                        <th className="py-2 px-3 w-20 text-center">Miktar</th>
                        <th className="py-2 px-3 w-20 text-center">Birim</th>
                        <th className="py-2 px-3 w-28 text-right">Birim Fiyat</th>
                        <th className="py-2 px-3 w-24 text-center">KDV %</th>
                        <th className="py-2 px-3 w-28 text-right">Toplam (TL)</th>
                        <th className="py-2 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2">
                            <div className="space-y-1">
                              {products.length > 0 && (
                                <select
                                  value={item.productId || ""}
                                  onChange={(e) =>
                                    handleItemChange(item.id, "productId", e.target.value)
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px] font-medium text-slate-900"
                                >
                                  <option value="">-- Katalogdan Seç --</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.stockType ? `[${p.stockType}] ` : ""}{p.name} {p.barcode ? `(Barkod: ${p.barcode})` : ""} {p.imeiOrSerialNo ? `(SN: ${p.imeiOrSerialNo})` : ""} - ₺{invType === "sales" ? p.sellPrice : p.buyPrice}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                required
                                placeholder="Açıklama (ör: Yazılım danışmanlık hizmeti)"
                                value={item.description}
                                onChange={(e) =>
                                  handleItemChange(item.id, "description", e.target.value)
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 placeholder-slate-400"
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(item.id, "unit", e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center text-slate-900"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-right font-mono font-bold text-slate-900"
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-center text-slate-900"
                            >
                              <option value={20}>%20</option>
                              <option value={10}>%10</option>
                              <option value={1}>%1</option>
                              <option value={0}>%0</option>
                            </select>
                          </td>

                          <td className="p-2 text-right font-extrabold font-mono text-slate-900">
                            ₺
                            {(
                              item.quantity *
                              item.unitPrice *
                              (1 + item.vatRate / 100)
                            ).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
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

              {/* Bottom Calculations Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fatura Alt Notu / Şartlar
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Ara Toplam (KDV Hariç):</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₺{subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Toplam KDV Tutarı:</span>
                    <span className="font-mono font-bold text-slate-800">
                      ₺{totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                    <span className="text-slate-900">GENEL TOPLAM:</span>
                    <span className="text-indigo-600 font-mono text-base">
                      ₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  Faturayı Kaydet ve Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment / Collection */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {paymentModalInvoice.type === "sales"
                  ? "Tahsilat Ekle (Giriş)"
                  : "Ödeme Ekle (Çıkış)"}
              </h3>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              <strong className="text-slate-800">{paymentModalInvoice.contactName}</strong> firmasına ait{" "}
              <strong className="font-mono text-slate-800">{paymentModalInvoice.invoiceNumber}</strong> nolu
              fatura için tahsilat/ödeme kaydı.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kasa / Banka Hesabı Seçin *
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Mevcut: ₺{a.balance.toLocaleString("tr-TR")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödenen Tutar (TL) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Tahsilatı İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MODAL VIEW */}
      {printingInvoice && (
        <InvoicePrintModal
          invoice={printingInvoice}
          companySettings={companySettings}
          contact={contacts.find((c) => c.id === printingInvoice.contactId)}
          onClose={() => setPrintingInvoice(null)}
        />
      )}
    </div>
  );
};
