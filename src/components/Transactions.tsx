import React, { useState } from "react";
import { Transaction, Account, Contact, TransactionType } from "../types";
import { ExportButtons } from "./ExportButtons";
import { ExportData, formatCurrency } from "../utils/exportUtils";
import {
  Receipt,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Filter,
  Trash2,
} from "lucide-react";

interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  contacts: Contact[];
  forcedType?: "income" | "expense";
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  accounts,
  contacts,
  forcedType,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<string>(forcedType || "all");
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [txType, setTxType] = useState<TransactionType>(forcedType || "income");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState<number>(1000);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || "");
  const [contactId, setContactId] = useState<string>("");
  const [category, setCategory] = useState<string>("Genel Gelir");
  const [description, setDescription] = useState<string>("");
  const [documentNo, setDocumentNo] = useState<string>("");

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc || amount <= 0) return;

    const contact = contacts.find((c) => c.id === contactId);

    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      date,
      type: txType,
      amount,
      currency: "TRY",
      accountId: acc.id,
      accountName: acc.name,
      contactId: contact?.id,
      contactName: contact?.name,
      category,
      description: description || category,
      documentNo,
    };

    onAddTransaction(newTx);
    setIsModalOpen(false);
    setDescription("");
    setDocumentNo("");
  };

  const filteredTxs = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.contactName && t.contactName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "income") return t.type === "income" || t.type === "collection";
    if (filterType === "expense") return t.type === "expense" || t.type === "payment";

    return true;
  });

  const getTransactionsExportData = (): ExportData => {
    const headers = [
      "Tarih",
      "İşlem Tipi",
      "Belge / Fiş No",
      "Kategori / Tür",
      "Hesap (Kasa / Banka)",
      "İlişkili Cari Hesap",
      "Açıklama",
      "Tutar",
      "Para Birimi",
    ];
    const rows = filteredTxs.map((t) => [
      t.date,
      t.type === "income" ? "Gelir Fişi (+ Tahsilat)" : "Gider Fişi (- Tediye)",
      t.documentNo || "-",
      t.category || "-",
      t.accountName || "-",
      t.contactName || "-",
      t.description || "-",
      formatCurrency(t.amount || 0, t.currency || "TRY"),
      t.currency || "TRY",
    ]);

    return {
      filename: `Finans_Hareketleri_${new Date().toISOString().split("T")[0]}`,
      title: forcedType === "income" ? "GELİR FİŞLERİ HAREKET LİSTESİ" : forcedType === "expense" ? "GİDER FİŞLERİ HAREKET LİSTESİ" : "KASA & BANKA FİNANS HAREKETLERİ",
      subtitle: `Toplam ${filteredTxs.length} Adet Hareket Kaydı`,
      headers,
      rows,
    };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header (Lila Bal Peteği & Geometrik Desen) */}
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
            {forcedType === "income"
              ? "Gelir Fişi İşlemleri"
              : forcedType === "expense"
              ? "Gider Fişi İşlemleri"
              : "Gelir ve Gider Hareketleri"}
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            {forcedType === "income"
              ? "Fatura dışı kasa/banka gelir fişleri ve tahsilat kayıtları."
              : forcedType === "expense"
              ? "Kira, maaş, fiş ve operasyonel gider ödemelerinizi kaydedin."
              : "Fatura dışı doğrudan kasa ve banka ödemelerini (Kira, Maaş, Fiş, İnternet vb.) kaydedin."}
          </p>
        </div>

        <button
          onClick={() => {
            if (forcedType) setTxType(forcedType);
            setIsModalOpen(true);
          }}
          className="relative z-10 bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-purple-800 font-bold" />
          <span>
            {forcedType === "income"
              ? "Yeni Gelir Fişi Ekle"
              : forcedType === "expense"
              ? "Yeni Gider Fişi Ekle"
              : "Hızlı Gelir / Gider Ekle"}
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
                    filterType === "all" ? "bg-white text-purple-950 font-bold border border-purple-200/60 shadow-2xs" : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  Tümü ({transactions.length})
                </button>
                <button
                  onClick={() => setFilterType("income")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filterType === "income" ? "bg-white text-emerald-600 font-bold border border-purple-200/60 shadow-2xs" : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  Gelir Fişleri
                </button>
                <button
                  onClick={() => setFilterType("expense")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    filterType === "expense" ? "bg-white text-rose-600 font-bold border border-purple-200/60 shadow-2xs" : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  Giderler
                </button>
              </>
            ) : (
              <button
                onClick={() => setFilterType(forcedType)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  filterType === forcedType ? "bg-white text-purple-700 font-bold border border-purple-200/60 shadow-2xs" : "text-purple-900/70 hover:text-purple-950"
                }`}
              >
                Tüm {forcedType === "income" ? "Gelir Fişleri" : "Giderler"} ({filteredTxs.length})
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

        <div className="overflow-x-auto rounded-2xl bg-slate-50/60 border border-purple-200/60 p-3 shadow-2xs">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
            <thead>
              <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="pb-2 px-4">Tarih</th>
                <th className="pb-2 px-4">Açıklama / Belge No</th>
                <th className="pb-2 px-4">Hesap / Cari</th>
                <th className="pb-2 px-4">Kategori</th>
                <th className="pb-2 px-4 text-right">Tutar</th>
                <th className="pb-2 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                    Kayıtlı işlem bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => {
                  const isIncome = tx.type === "income" || tx.type === "collection";
                  return (
                    <tr
                      key={tx.id}
                      className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                    >
                      <td className="py-3 px-3 font-medium text-slate-500 group-hover:text-purple-900 whitespace-nowrap rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {tx.date}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {tx.description}
                        {tx.documentNo && (
                          <span className="block text-[10px] text-slate-400 group-hover:text-purple-700/60">
                            Belge: {tx.documentNo}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-bold text-slate-800 group-hover:text-purple-950">{tx.accountName}</div>
                        {tx.contactName && (
                          <div className="text-[10px] text-slate-400 group-hover:text-purple-700/60">{tx.contactName}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <span className="bg-slate-100 border border-slate-200 group-hover:border-purple-300 text-slate-700 group-hover:text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold transition-all">
                          {tx.category}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-black text-sm whitespace-nowrap border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                      {isIncome ? "+" : "-"}₺
                      {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: New Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Hızlı Gelir / Gider Kaydı
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    İşlem Yönü *
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => {
                      const val = e.target.value as TransactionType;
                      setTxType(val);
                      setCategory(val === "income" ? categoriesIncome[0] : categoriesExpense[0]);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                  >
                    <option value="income">Gelir Girişi (+)</option>
                    <option value="expense">Gider Çıkışı (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    İşlem Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kasa / Banka Hesabı *
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tutar (TL) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                >
                  {(txType === "income" ? categoriesIncome : categoriesExpense).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  İlişkili Cari Hesap (İsteğe Bağlı)
                </label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                >
                  <option value="">-- Cari Seçilmedi --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  placeholder="ör: Ofis kira ödemesi veya Fiş detay açıklaması"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400"
                />
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
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-xs"
                >
                  İşlemi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
