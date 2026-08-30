import React, { useState } from "react";
import { Transaction, Account, Contact, TransactionType, Product, InvoiceItem, getContactAccountCode } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency, formatDate } from "../utils/exportUtils";
import { formatTransactionWhatsAppMessage } from "../utils/whatsappTemplates";
import { UniversalWhatsAppModal } from "./common/UniversalWhatsAppModal";
import {
  Receipt,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Filter,
  Trash2,
  PlusCircle,
  Eye,
  Printer,
  FileText,
  CreditCard,
  Building2,
  Zap,
  MessageCircle,
} from "lucide-react";

interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  contacts: Contact[];
  products?: Product[];
  forcedType?: "income" | "expense";
  globalSearchTerm?: string;
  onAddTransaction: (tx: Transaction) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const isPaymentOrReceiptTx = (t: Transaction): boolean => {
  // 1. Explicit collection, payment, or transfer types
  if (t.type === "collection" || t.type === "payment" || t.type === "transfer") {
    return true;
  }

  // 2. Linked to an invoice
  if (t.invoiceId || t.invoiceNumber) {
    return true;
  }

  const category = (t.category || "").toLowerCase();
  const description = (t.description || "").toLowerCase();
  const documentNo = (t.documentNo || "").toLowerCase();

  // 3. Document number patterns for dekont, tahsilat, tediye, eft/havale, virman
  if (
    documentNo.startsWith("dek-") ||
    documentNo.startsWith("ths-") ||
    documentNo.startsWith("tdy-") ||
    documentNo.startsWith("mak-") ||
    documentNo.startsWith("eft-") ||
    documentNo.startsWith("hav-") ||
    documentNo.startsWith("vrm-")
  ) {
    return true;
  }

  // 4. Category or description keywords for invoice payments / receipts / bank transfers / collections
  if (
    category.includes("tahsilat") ||
    category.includes("ödemesi") ||
    category.includes("tediye") ||
    category.includes("dekont") ||
    category.includes("transfer") ||
    category.includes("virman") ||
    description.includes("faturanın tahsilatı") ||
    description.includes("faturanın ödemesi") ||
    description.includes("fatura tahsilatı") ||
    description.includes("fatura ödemesi") ||
    description.includes("tahsilat makbuzu") ||
    description.includes("banka dekontu") ||
    description.includes("tediye makbuzu") ||
    description.includes("havale/eft") ||
    description.includes("virman transferi")
  ) {
    return true;
  }

  return false;
};

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  accounts,
  contacts,
  products = [],
  forcedType,
  globalSearchTerm = "",
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<string>(forcedType || "all");
  const [search, setSearch] = useState<string>("");
  const [displayLimit, setDisplayLimit] = useState<number>(100);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [whatsAppTx, setWhatsAppTx] = useState<Transaction | null>(null);

  // Form State
  const [txType, setTxType] = useState<TransactionType>(forcedType || "income");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || "");
  const [contactId, setContactId] = useState<string>("");
  const [category, setCategory] = useState<string>("Genel Gelir");
  const [documentNo, setDocumentNo] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Invoice-like Itemized Lines
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "item_1",
      description: "Gelir / Gider Fiş Kalemi",
      quantity: 1,
      unit: "Adet",
      unitPrice: 1000,
      vatRate: 20,
      totalWithoutVat: 1000,
      vatAmount: 200,
      totalWithVat: 1200,
    },
  ]);

  const categoriesIncome = [
    "Danışmanlık Geliri",
    "Yazılım Satış Geliri",
    "Hizmet Bedeli",
    "Kira Geliri",
    "Diğer Gelirler",
  ];

  const categoriesExpense = [
    "Ofis Kirası",
    "Personel Maaşı / SGK",
    "Elektrik & İnternet",
    "Yemek & Mutfak Gideri",
    "Sunucu & Cloud Hizmetleri",
    "Vergi & Harçlar",
    "Reklam & Pazarlama",
    "Diğer Giderler",
  ];

  const handleOpenModal = (overrideType?: "income" | "expense") => {
    const typeToUse = overrideType || forcedType || "income";
    setTxType(typeToUse);
    setCategory(typeToUse === "income" ? categoriesIncome[0] : categoriesExpense[0]);
    setDate(new Date().toISOString().split("T")[0]);
    setAccountId(accounts[0]?.id || "");
    setContactId("");
    setDocumentNo(
      typeToUse === "income"
        ? `GLR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
        : `GDR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    );
    setDescription("");
    setItems([
      {
        id: "item_1",
        description:
          typeToUse === "income"
            ? "Danışmanlık / Hizmet Gelir Kalemi"
            : "Operasyonel Gider Kalemi",
        quantity: 1,
        unit: "Adet",
        unitPrice: 1000,
        vatRate: 20,
        totalWithoutVat: 1000,
        vatAmount: 200,
        totalWithVat: 1200,
      },
    ]);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
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
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let updated = { ...item, [field]: value };

        if (field === "productId" && value) {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            updated.description = prod.name;
            updated.unit = prod.unit || "Adet";
            updated.unitPrice = txType === "income" ? (prod.sellPrice || 0) : (prod.buyPrice || 0);
            updated.vatRate = prod.vatRate ?? 20;
          }
        }

        const q = updated.quantity || 0;
        const price = updated.unitPrice || 0;
        const vat = updated.vatRate || 0;

        const sub = q * price;
        const vatAmt = sub * (vat / 100);
        const grand = sub + vatAmt;

        updated.totalWithoutVat = sub;
        updated.vatAmount = vatAmt;
        updated.totalWithVat = grand;

        return updated;
      })
    );
  };

  const subtotal = items.reduce((acc, i) => acc + (i.totalWithoutVat || 0), 0);
  const totalVat = items.reduce((acc, i) => acc + (i.vatAmount || 0), 0);
  const grandTotal = items.reduce((acc, i) => acc + (i.totalWithVat || 0), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return;

    const contact = contacts.find((c) => c.id === contactId);

    const mainDesc =
      description.trim() ||
      items
        .map((i) => i.description)
        .filter(Boolean)
        .join(", ") ||
      category;

    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      date,
      type: txType,
      amount: grandTotal > 0 ? grandTotal : 0,
      currency: "TRY",
      accountId: acc.id,
      accountName: acc.name,
      contactId: contact?.id,
      contactName: contact?.name,
      category,
      description: mainDesc,
      documentNo:
        documentNo.trim() ||
        (txType === "income"
          ? `GLR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
          : `GDR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`),
      items,
      subtotal,
      totalVat,
    };

    onAddTransaction(newTx);
    setIsModalOpen(false);
  };

  const activeSearchQuery = (globalSearchTerm || search).toLowerCase().trim();
  const filteredTxs = transactions.filter((t) => {
    const matchesSearch =
      !activeSearchQuery ||
      t.description.toLowerCase().includes(activeSearchQuery) ||
      t.category.toLowerCase().includes(activeSearchQuery) ||
      (t.contactName && t.contactName.toLowerCase().includes(activeSearchQuery)) ||
      (t.documentNo && t.documentNo.toLowerCase().includes(activeSearchQuery)) ||
      (t.accountName && t.accountName.toLowerCase().includes(activeSearchQuery));

    if (!matchesSearch) return false;

    const isReceipt = isPaymentOrReceiptTx(t);

    if (forcedType === "income") {
      // Only faturalanmayan Gelir Fişi (excludes tahsilat makbuzları, banka dekontları, fatura ödemeleri)
      return t.type === "income" && !isReceipt;
    }

    if (forcedType === "expense") {
      // Only faturalanmayan Gider Fişi (excludes tediye makbuzları, banka dekontları, fatura ödemeleri)
      return t.type === "expense" && !isReceipt;
    }

    if (filterType === "income") return t.type === "income" && !isReceipt;
    if (filterType === "expense") return t.type === "expense" && !isReceipt;
    if (filterType === "receipts") return isReceipt;

    return true;
  });

  const displayedTxs = filteredTxs.slice(0, displayLimit);

  const getTransactionsExportData = (): ExportData => {
    const headers = [
      "Tarih",
      "İşlem Tipi",
      "Belge / Fiş No",
      "Kategori / Tür",
      "Hesap (Kasa / Banka)",
      "İlişkili Cari Hesap",
      "Stok / Kalem Adı",
      "Miktar",
      "Birim",
      "Birim Fiyat",
      "KDV (%)",
      "Kalem Tutarı",
      "Fiş Genel Toplamı",
      "Para Birimi",
      "Açıklama",
    ];

    const rows: (string | number | boolean | null | undefined)[][] = [];

    filteredTxs.forEach((t) => {
      const typeLabel =
        t.type === "income" ? "Gelir Fişi" : t.type === "expense" ? "Gider Fişi" : "Finans / Dekont Hareketi";
      const txCurrency = t.currency || "TRY";

      if ((t as any).items && (t as any).items.length > 0) {
        (t as any).items.forEach((item: any) => {
          rows.push([
            t.date,
            typeLabel,
            t.documentNo || "-",
            t.category || "-",
            t.accountName || "-",
            t.contactName || "-",
            item.description || "Belirtilmedi",
            item.quantity ?? 1,
            item.unit || "Adet",
            formatCurrency(item.unitPrice || 0, txCurrency),
            `%${item.vatRate ?? 0}`,
            formatCurrency(item.totalWithVat ?? item.totalWithoutVat ?? 0, txCurrency),
            formatCurrency(t.amount || 0, txCurrency),
            txCurrency,
            t.description || "-",
          ]);
        });
      } else {
        rows.push([
          t.date,
          typeLabel,
          t.documentNo || "-",
          t.category || "-",
          t.accountName || "-",
          t.contactName || "-",
          t.description || "Genel Fiş Kalemi",
          1,
          "Adet",
          formatCurrency(t.amount || 0, txCurrency),
          "%0",
          formatCurrency(t.amount || 0, txCurrency),
          formatCurrency(t.amount || 0, txCurrency),
          txCurrency,
          t.description || "-",
        ]);
      }
    });

    return {
      filename: `Finans_Detayli_Stok_Hareketleri_${new Date().toISOString().split("T")[0]}`,
      title:
        forcedType === "income"
          ? "GELİR FİŞLERİ VE KALEM HAREKET LİSTESİ"
          : forcedType === "expense"
          ? "GİDER FİŞLERİ VE KALEM HAREKET LİSTESİ"
          : "KASA & BANKA FİNANS VE KALEM HAREKETLERİ",
      subtitle: `Toplam ${filteredTxs.length} Adet Hareket (${rows.length} Satır Kalem Kaydı)`,
      headers,
      rows,
    };
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header (Lila Bal Peteği & Geometrik Desen) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        <div className="relative z-10">
          <h2 className="text-lg font-extrabold text-slate-950">
            {forcedType === "income"
              ? "Gelir Fişi İşlemleri"
              : forcedType === "expense"
              ? "Gider Fişi İşlemleri"
              : "Gelir ve Gider Hareketleri"}
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            {forcedType === "income"
              ? "Faturalanmayan kalemli gelir fişleri ve doğrudan satış belgeleri. (Tahsilat makbuzları ve dekontlar Kasa & Banka Hareketleri modülünde gösterilir.)"
              : forcedType === "expense"
              ? "Faturalanmayan kalemli gider fişleri ve operasyonel harcama belgeleri. (Banka dekontları ve tediye makbuzları Kasa & Banka Hareketleri modülünde gösterilir.)"
              : "Fatura düzeninde kalemli gelir ve gider fişi belgelerinizi yönetin."}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="relative z-10 bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-purple-800 font-bold" />
          <span>
            {forcedType === "income"
              ? "Yeni Gelir Fişi Ekle"
              : forcedType === "expense"
              ? "Yeni Gider Fişi Ekle"
              : "Yeni Gelir / Gider Fişi Ekle"}
          </span>
        </button>
      </div>

      {/* Filter Tabs & Table */}
      <div className="bg-white rounded-2xl border border-purple-200/60 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-purple-50/50 border border-purple-200/50 p-1 rounded-xl text-xs font-semibold shadow-2xs">
            {!forcedType ? (
              <>
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filterType === "all"
                      ? "bg-white text-purple-950 font-bold border border-purple-200/60 shadow-2xs"
                      : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  Tüm Hareketler ({transactions.length})
                </button>
                <button
                  onClick={() => setFilterType("income")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filterType === "income"
                      ? "bg-white text-emerald-600 font-bold border border-purple-200/60 shadow-2xs"
                      : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  Gelir Fişleri
                </button>
                <button
                  onClick={() => setFilterType("expense")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filterType === "expense"
                      ? "bg-white text-rose-600 font-bold border border-purple-200/60 shadow-2xs"
                      : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  Gider Fişleri
                </button>
                <button
                  onClick={() => setFilterType("receipts")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filterType === "receipts"
                      ? "bg-white text-indigo-700 font-bold border border-purple-200/60 shadow-2xs"
                      : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  Tahsilat, Dekont & Tediye
                </button>
              </>
            ) : (
              <button
                onClick={() => setFilterType(forcedType)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  filterType === forcedType
                    ? "bg-white text-purple-700 font-bold border border-purple-200/60 shadow-2xs"
                    : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Faturalanmayan {forcedType === "income" ? "Gelir Fişleri" : "Gider Fişleri"} ({filteredTxs.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Açıklama, Kategori veya Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
              />
            </div>
            <ExportButtons getExportData={getTransactionsExportData} size="sm" />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5 min-w-[750px]">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-4">Fiş No / Tarih</th>
                <th className="pb-2 px-4">Cari / Açıklama</th>
                <th className="pb-2 px-4">Kasa / Banka Hesabı</th>
                <th className="pb-2 px-4">Kategori</th>
                <th className="pb-2 px-4 text-right">Genel Toplam</th>
                <th className="pb-2 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    Kayıtlı fiş bulunamadı.
                  </td>
                </tr>
              ) : (
                displayedTxs.map((tx) => {
                  const isIncome = tx.type === "income" || tx.type === "collection";
                  return (
                    <tr
                      key={tx.id}
                      className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                    >
                      <td className="py-3 px-4 font-medium text-slate-500 group-hover:text-purple-900 whitespace-nowrap rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-mono font-extrabold text-slate-900 group-hover:text-purple-950 text-xs">
                          {tx.documentNo || (isIncome ? "GLR-FİŞ" : "GDR-FİŞ")}
                        </div>
                        <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">
                          {formatDate(tx.date)}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {tx.contactName ? (
                          <div className="font-bold text-slate-900 group-hover:text-purple-950">{tx.contactName}</div>
                        ) : (
                          <div className="text-slate-700">{tx.description}</div>
                        )}
                        {tx.contactName && (
                          <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60 line-clamp-1">
                            {tx.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-bold text-slate-800 group-hover:text-purple-950">{tx.accountName}</div>
                      </td>

                      <td className="py-3 px-4 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <span className="bg-slate-100 border border-slate-200 group-hover:border-purple-300 text-slate-700 group-hover:text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold transition-all">
                          {tx.category}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-4 text-right font-black text-sm whitespace-nowrap border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"}₺
                        {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingTx(tx)}
                            title="Fiş Detayını İncele & Yazdır"
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>İncele</span>
                          </button>
                          <button
                            onClick={() => setWhatsAppTx(tx)}
                            title="Fiş / Dekontu WhatsApp ile Paylaş"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Fişi Sil"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredTxs.length > displayLimit && (
          <div className="text-center mt-4">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 100)}
              className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
            >
              Daha Fazla Göster ({displayLimit} / {filteredTxs.length})
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Create New Invoice-style Slip */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {txType === "income" ? "Yeni Gelir Fişi Oluştur (Fatura Düzeninde)" : "Yeni Gider Fişi Oluştur (Fatura Düzeninde)"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Header Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/40 p-4 rounded-xl border border-purple-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fiş Tipi *
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => {
                      const val = e.target.value as TransactionType;
                      setTxType(val);
                      setCategory(val === "income" ? categoriesIncome[0] : categoriesExpense[0]);
                      setDocumentNo(
                        val === "income"
                          ? `GLR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
                          : `GDR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
                      );
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="income">Gelir Fişi (+ Satış / Tahsilat)</option>
                    <option value="expense">Gider Fişi (- Harcama / Tediye)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cari Hesap (Müşteri / Tedarikçi)
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="">-- Cari Seçilmedi --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{getContactAccountCode(c)}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kasa / Banka Hesabı *
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency || "TL"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fiş Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Belge / Fiş No *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNo}
                    onChange={(e) => setDocumentNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900"
                  >
                    {(txType === "income" ? categoriesIncome : categoriesExpense).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Fiş Kalemleri Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span>Fiş Kalemleri & Ürün/Hizmet Detayları</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Satır Ekle</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar w-full shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Ürün / Hizmet Seçimi veya Açıklama</th>
                        <th className="py-2.5 px-3 w-20 text-center">Miktar</th>
                        <th className="py-2.5 px-3 w-20 text-center">Birim</th>
                        <th className="py-2.5 px-3 w-28 text-right">Birim Fiyat</th>
                        <th className="py-2.5 px-3 w-24 text-center">KDV %</th>
                        <th className="py-2.5 px-3 w-32 text-right">Toplam (KDV Dahil)</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="p-2">
                            <div className="space-y-1">
                              {products.length > 0 && (
                                <select
                                  value={item.productId || ""}
                                  onChange={(e) =>
                                    handleItemChange(item.id, "productId", e.target.value)
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-[11px] font-medium text-slate-900 focus:bg-white"
                                >
                                  <option value="">-- Stok / Hizmet Kataloğundan Seç --</option>
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.stockType ? `[${p.stockType}] ` : ""}{p.name} - ₺
                                      {txType === "income" ? p.sellPrice : p.buyPrice}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                required
                                placeholder="Kalem açıklaması (ör: Ofis kırtasiye malzemesi)"
                                value={item.description}
                                onChange={(e) =>
                                  handleItemChange(item.id, "description", e.target.value)
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white"
                              />
                            </div>
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              required
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "quantity",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:bg-white"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(item.id, "unit", e.target.value)
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center text-slate-900 focus:bg-white"
                            >
                              <option value="Adet">Adet</option>
                              <option value="Saat">Saat</option>
                              <option value="Ay">Ay</option>
                              <option value="Kg">Kg</option>
                              <option value="Paket">Paket</option>
                              <option value="Litre">Litre</option>
                              <option value="Hizmet">Hizmet</option>
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              required
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-right font-mono font-bold text-slate-900 focus:bg-white"
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-900 focus:bg-white"
                            >
                              <option value={0}>%0</option>
                              <option value={1}>%1</option>
                              <option value={10}>%10</option>
                              <option value={20}>%20</option>
                            </select>
                          </td>

                          <td className="p-2 text-right font-mono font-black text-slate-900">
                            ₺{item.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={items.length <= 1}
                              className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Note & Calculation Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fiş Açıklaması / Genel Notlar
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Fiş ile ilgili özel not veya ödeme açıklaması..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span>KDV Hariç Ara Toplam:</span>
                    <span className="font-mono text-slate-900">
                      ₺{subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Toplam KDV:</span>
                    <span className="font-mono text-slate-900">
                      ₺{totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-950">
                    <span>Genel Toplam:</span>
                    <span className="font-mono text-purple-700 text-base">
                      ₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-extrabold bg-purple-700 hover:bg-purple-800 text-white rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  {txType === "income" ? "Gelir Fişini Kaydet" : "Gider Fişini Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View / Inspect Slip Details */}
      {viewingTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase mb-1 ${
                    viewingTx.type === "income" || viewingTx.type === "collection"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {viewingTx.type === "income" || viewingTx.type === "collection"
                    ? "Gelir Fişi"
                    : "Gider Fişi"}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 font-mono">
                  Belge No: {viewingTx.documentNo || "FİŞ-KAYDI"}
                </h3>
              </div>
              <button
                onClick={() => setViewingTx(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">İşlem Tarihi</span>
                <span className="font-semibold text-slate-800">{formatDate(viewingTx.date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Kategori</span>
                <span className="font-semibold text-slate-800">{viewingTx.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Cari Hesap</span>
                <span className="font-semibold text-slate-800">
                  {viewingTx.contactName || "Genel Müşteri / Cari Yok"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Kasa / Banka Hesabı</span>
                <span className="font-semibold text-slate-800">{viewingTx.accountName}</span>
              </div>
            </div>

            {/* Line Items Table if available */}
            {viewingTx.items && viewingTx.items.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fiş Kalem Detayları
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar w-full">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Açıklama</th>
                        <th className="py-2 px-3 text-center">Miktar</th>
                        <th className="py-2 px-3 text-right">Birim Fiyat</th>
                        <th className="py-2 px-3 text-center">KDV %</th>
                        <th className="py-2 px-3 text-right">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {viewingTx.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-900">{item.description}</td>
                          <td className="p-2.5 text-center text-slate-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            ₺{item.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center text-slate-700">%{item.vatRate}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ₺{item.totalWithVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[10px] font-bold">Fiş Açıklaması</span>
                <p className="font-medium text-slate-800 mt-0.5">{viewingTx.description}</p>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="bg-purple-50/50 border border-purple-200/60 p-4 rounded-xl space-y-1.5 text-xs">
              {viewingTx.subtotal !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Ara Toplam (KDV Hariç):</span>
                  <span className="font-mono">
                    ₺{viewingTx.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {viewingTx.totalVat !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Toplam KDV:</span>
                  <span className="font-mono">
                    ₺{viewingTx.totalVat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-950 pt-1 border-t border-purple-200">
                <span>Genel Toplam Tutar:</span>
                <span className="font-mono text-purple-700 text-base">
                  ₺{viewingTx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsAppTx(viewingTx)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                  <span>WhatsApp ile Gönder</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Yazdır</span>
                </button>
              </div>
              <button
                onClick={() => setViewingTx(null)}
                className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {whatsAppTx && (
        <UniversalWhatsAppModal
          isOpen={!!whatsAppTx}
          onClose={() => setWhatsAppTx(null)}
          title="WhatsApp ile Fiş / Makbuz Paylaş"
          documentTypeLabel={whatsAppTx.type === "income" || whatsAppTx.type === "collection" ? "Tahsilat / Gelir Makbuzu" : "Ödeme / Gider Fişi"}
          recipientName={whatsAppTx.contactName || "Sayın Yetkili"}
          recipientPhone={contacts.find((c) => c.id === whatsAppTx.contactId)?.phone || ""}
          defaultMessage={formatTransactionWhatsAppMessage(
            whatsAppTx,
            null,
            contacts.find((c) => c.id === whatsAppTx.contactId)
          )}
          documentFileName={`${whatsAppTx.documentNo || "Dekont"}.pdf`}
          onGeneratePdf={async () => {
            const { generateAutoTableFromExportData } = await import("../utils/pdfService");
            const expData: ExportData = {
              filename: `${whatsAppTx.documentNo || "Makbuz"}`,
              title: `Mali İşlem Makbuzu - ${whatsAppTx.documentNo || "Dekont"}`,
              subtitle: `Cari: ${whatsAppTx.contactName || "Genel"} | Tarih: ${formatDate(whatsAppTx.date)} | Tutar: ${formatCurrency(whatsAppTx.amount)} | Kasa/Banka: ${whatsAppTx.accountName}`,
              headers: ["Açıklama / Kalem", "Kategori", "Tarih", "Kasa/Banka", "Tutar"],
              rows: [
                [
                  whatsAppTx.description || "-",
                  whatsAppTx.category || "-",
                  formatDate(whatsAppTx.date),
                  whatsAppTx.accountName || "-",
                  formatCurrency(whatsAppTx.amount),
                ],
              ],
            };
            return generateAutoTableFromExportData(expData);
          }}
        />
      )}
    </div>
  );
};
