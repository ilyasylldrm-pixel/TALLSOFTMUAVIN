import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ExportButtons } from "./ExportButtons";
import { BankStatementImportModal } from "./BankStatementImportModal";
import { ExportData, formatCurrency, formatDate, sanitizeOklchForHtml2Canvas, exportElementToPDF } from "../utils/exportUtils";
import { exportElementToPDFWithPrintStyling } from "../utils/pdfService";
import {
  Account,
  Transaction,
  Contact,
  Cheque,
  ChequeStatus,
  PromissoryNote,
  PromissoryNoteStatus,
  CompanySettings,
} from "../types";
import {
  fetchWhatsAppStatus,
  sendWhatsAppTextApi,
  WhatsAppClientStatus,
} from "../services/whatsappClient";
import {
  Wallet,
  Building,
  Plus,
  ArrowRightLeft,
  X,
  CreditCard,
  FileCheck2,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  ChevronRight,
  Landmark,
  Banknote,
  Stamp,
  Filter,
  Calendar,
  Share2,
  Send,
  Edit,
  Edit3,
  Pencil,
  MessageSquare,
  Mail,
  Copy,
  Printer,
  Check,
  ExternalLink,
  Eye,
  Cloud,
  FileSpreadsheet,
  Upload,
  Zap,
  MessageCircle,
} from "lucide-react";
import { DetailPageLayout } from "./common/DetailPageLayout";
import { useDetailNavigation } from "../hooks/useDetailNavigation";
import { UniversalWhatsAppModal, QuickTemplateOption } from "./common/UniversalWhatsAppModal";

export type FinanceSubModule = "kasa" | "banka" | "cek" | "senet" | "virman";

export const generateAccountShareText = (acc: Account): string => {
  let text = `🏦 *${acc.name.toUpperCase()}*\n`;
  if (acc.bankName) text += `📌 Banka: ${acc.bankName}\n`;
  if (acc.iban) text += `💳 IBAN: ${acc.iban}\n`;
  text += `💱 Para Birimi: ${acc.currency}\n`;
  text += `💰 Bakiye: ₺${acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}\n`;
  text += `\nMuavin Finans Yönetimi`;
  return text;
};

export const generateTransactionShareText = (tx: Transaction): string => {
  const isInc = tx.type === "income" || tx.type === "collection";
  let text = `🧾 *İŞLEM DEKONTU / MAKBUZ*\n`;
  if (tx.documentNo) text += `📄 Evrak No: ${tx.documentNo}\n`;
  text += `📅 Tarih: ${tx.date}\n`;
  text += `🏦 Hesap: ${tx.accountName || "Kasa/Banka"}\n`;
  text += `👤 İşlem / Cari: ${tx.contactName || tx.category || "-"}\n`;
  text += `🏷️ Kategori: ${tx.category || "-"}\n`;
  text += `📝 Açıklama: ${tx.description || "-"}\n`;
  text += `💵 Tutar: ${isInc ? "(GİREN) +" : "(ÇIKAN) -"}₺${tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}\n`;
  text += `\nMuavin Finans Yönetimi`;
  return text;
};

export const generateChequeShareText = (cheque: Cheque): string => {
  let text = `🎫 *ÇEK BİLGİ DETAYI*\n`;
  text += `🔢 Çek No: ${cheque.chequeNumber}\n`;
  text += `📋 Çek Tipi: ${cheque.type === "received" ? "Alınan (Müşteri) Çeki" : "Verilen (Firma) Çeki"}\n`;
  if (cheque.bankName) text += `🏦 Banka/Şube: ${cheque.bankName} ${cheque.branchName ? "/ " + cheque.branchName : ""}\n`;
  if (cheque.contactName || cheque.drawerName) text += `👤 Keşideci/Cari: ${cheque.contactName || cheque.drawerName}\n`;
  text += `📅 Vade Tarihi: ${cheque.dueDate}\n`;
  if (cheque.issueDate) text += `🗓️ Keşide Tarihi: ${cheque.issueDate}\n`;
  text += `💰 Tutar: ₺${cheque.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}\n`;
  text += `📌 Durumu: ${cheque.status === "portfolio" ? "Portföyde" : cheque.status === "endorsed" ? "Ciro Edildi" : cheque.status === "collected" ? "Tahsil Edildi" : cheque.status}\n`;
  if (cheque.notes) text += `📝 Notlar: ${cheque.notes}\n`;
  text += `\nMuavin Finans Yönetimi`;
  return text;
};

export const generateNoteShareText = (note: PromissoryNote): string => {
  let text = `📜 *SENET BİLGİ DETAYI*\n`;
  text += `🔢 Senet No: ${note.noteNumber}\n`;
  text += `📋 Senet Tipi: ${note.type === "received" ? "Alınan (Müşteri) Senedi" : "Verilen (Firma) Senedi"}\n`;
  if (note.contactName || note.debtorName) text += `👤 Borçlu/Cari: ${note.contactName || note.debtorName}\n`;
  text += `📅 Vade Tarihi: ${note.dueDate}\n`;
  if (note.issueDate) text += `🗓️ Düzenleme Tarihi: ${note.issueDate}\n`;
  text += `💰 Tutar: ₺${note.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}\n`;
  text += `📌 Durumu: ${note.status === "portfolio" ? "Portföyde" : note.status === "endorsed" ? "Ciro Edildi" : note.status === "collected" ? "Tahsil Edildi" : note.status}\n`;
  if (note.notes) text += `📝 Notlar: ${note.notes}\n`;
  text += `\nMuavin Finans Yönetimi`;
  return text;
};

export interface ReceiptData {
  documentTitle: string;
  subTitle?: string;
  documentNo: string;
  date: string;
  time?: string;
  moduleType: "kasa" | "banka" | "cek" | "senet" | "virman" | "account";
  accountName?: string;
  bankName?: string;
  iban?: string;
  contactName?: string;
  contactTaxNumber?: string;
  contactTaxOffice?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  amount: number;
  currency: string;
  type?: string;
  category?: string;
  description?: string;
  statusText?: string;
  details: { label: string; value: string }[];
}

export function numberToTurkishWords(amount: number, currency: string = "TRY"): string {
  if (isNaN(amount) || amount === 0) return "Sıfır Türk Lirası";
  const units = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
  const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];

  const convertGroup = (num: number): string => {
    let str = "";
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    if (h > 1) str += units[h] + "Yüz";
    else if (h === 1) str += "Yüz";
    if (t > 0) str += tens[t];
    if (u > 0) str += units[u];
    return str;
  };

  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  let result = "";
  if (integerPart === 0) {
    result = "Sıfır";
  } else {
    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const ones = integerPart % 1000;

    if (billions > 0) result += convertGroup(billions) + "Milyar";
    if (millions > 0) result += convertGroup(millions) + "Milyon";
    if (thousands > 1) result += convertGroup(thousands) + "Bin";
    else if (thousands === 1) result += "Bin";
    if (ones > 0) result += convertGroup(ones);
  }

  const currSymbol = currency === "USD" ? "Dolar" : currency === "EUR" ? "Euro" : currency === "GBP" ? "Sterlin" : "Türk Lirası";
  const coinSymbol = currency === "USD" ? "Cent" : currency === "EUR" ? "Cent" : "Kuruş";

  let formatted = "Yalnız " + result + " " + currSymbol;
  if (decimalPart > 0) {
    formatted += " " + convertGroup(decimalPart) + " " + coinSymbol;
  }
  return formatted;
}

export function generateReceiptShareText(
  receipt: ReceiptData,
  companySettings?: CompanySettings | null
): string {
  const companyName = companySettings?.companyTitle || companySettings?.companyName || "Şirketimiz";
  const currency = receipt.currency || "TRY";

  let text = `🧾 *${receipt.documentTitle.toUpperCase()}*\n`;
  text += `🏛️ *Düzenleyen:* ${companyName}\n`;
  text += `📄 *Dekont No:* ${receipt.documentNo}\n`;
  text += `📅 *İşlem Tarihi:* ${receipt.date}${receipt.time ? ` • ${receipt.time}` : ""}\n`;
  if (receipt.accountName) text += `🏦 *Hesap / Kasa:* ${receipt.accountName}\n`;
  if (receipt.bankName) text += `🏛️ *Banka:* ${receipt.bankName}\n`;
  if (receipt.iban) text += `💳 *IBAN:* ${receipt.iban}\n`;
  if (receipt.contactName) text += `👤 *Cari / Muhatap:* ${receipt.contactName}\n`;
  if (receipt.statusText) text += `📌 *Durum:* ${receipt.statusText}\n`;
  text += `💰 *Tutar:* ${formatCurrency(receipt.amount, currency)}\n`;
  text += `🔤 *Yazıyla:* ${numberToTurkishWords(receipt.amount, currency)}\n`;
  if (receipt.description) text += `📝 *Açıklama:* ${receipt.description}\n`;
  text += `\nResmi finans dekont belgeniz PDF formatında WhatsApp İletişim & Entegrasyon Merkezi üzerinden iletilmiştir.\nİyi çalışmalar dileriz.\n*${companyName}*`;
  return text;
}

interface AccountsProps {
  accounts: Account[];
  transactions: Transaction[];
  contacts?: Contact[];
  cheques?: Cheque[];
  promissoryNotes?: PromissoryNote[];
  companySettings?: CompanySettings;
  activeFinanceSubTab?: FinanceSubModule;
  globalSearchTerm?: string;
  onSelectFinanceSubTab?: (subTab: FinanceSubModule) => void;
  onAddAccount: (account: Account) => void;
  onUpdateAccount?: (account: Account) => void;
  onDeleteAccount?: (id: string) => void;
  onTransferBetweenAccounts: (
    fromId: string,
    toId: string,
    amount: number,
    desc: string
  ) => void;
  onAddTransaction?: (tx: Transaction) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddCheque?: (cheque: Cheque) => void;
  onUpdateCheque?: (cheque: Cheque) => void;
  onUpdateChequeStatus?: (id: string, status: ChequeStatus) => void;
  onDeleteCheque?: (id: string) => void;
  onEndorseCheque?: (
    chequeId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => void;
  onAddPromissoryNote?: (note: PromissoryNote) => void;
  onUpdatePromissoryNote?: (note: PromissoryNote) => void;
  onUpdateNoteStatus?: (id: string, status: PromissoryNoteStatus) => void;
  onDeletePromissoryNote?: (id: string) => void;
  onEndorsePromissoryNote?: (
    noteId: string,
    targetContactId: string,
    targetContactName: string,
    endorseDate: string
  ) => void;
}

export const Accounts: React.FC<AccountsProps> = ({
  accounts,
  transactions,
  contacts = [],
  cheques = [],
  promissoryNotes = [],
  companySettings,
  activeFinanceSubTab,
  globalSearchTerm = "",
  onSelectFinanceSubTab,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransferBetweenAccounts,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddCheque,
  onUpdateCheque,
  onUpdateChequeStatus,
  onDeleteCheque,
  onEndorseCheque,
  onAddPromissoryNote,
  onUpdatePromissoryNote,
  onUpdateNoteStatus,
  onDeletePromissoryNote,
  onEndorsePromissoryNote,
}) => {
  const [internalSubModule, setInternalSubModule] = useState<FinanceSubModule>("kasa");
  const activeSubModule = activeFinanceSubTab || internalSubModule;

  // Display limit states for Finance Sub-Modules
  const [kasaDisplayLimit, setKasaDisplayLimit] = useState<number>(100);
  const [bankDisplayLimit, setBankDisplayLimit] = useState<number>(100);
  const [chequeDisplayLimit, setChequeDisplayLimit] = useState<number>(100);
  const [noteDisplayLimit, setNoteDisplayLimit] = useState<number>(100);
  const [virmanDisplayLimit, setVirmanDisplayLimit] = useState<number>(100);

  const setActiveSubModule = (tab: FinanceSubModule) => {
    setInternalSubModule(tab);
    if (onSelectFinanceSubTab) {
      onSelectFinanceSubTab(tab);
    }
  };

  // Full-Page Detail Navigation
  const detailNav = useDetailNavigation<Account>({
    moduleKey: "finance",
  });

  const handleBackToList = () => {
    detailNav.backToList();
    setIsAccountModalOpen(false);
    setIsEditAccountModalOpen(false);
    setIsTransferModalOpen(false);
    setReceiptData(null);
    setIsReceiptWhatsAppOpen(false);
    setEditingAccount(null);
  };

  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isBankStatementModalOpen, setIsBankStatementModalOpen] = useState(false);

  // Edit States for Finance Sub-Modules
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);

  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [isEditChequeModalOpen, setIsEditChequeModalOpen] = useState(false);

  const [editingNote, setEditingNote] = useState<PromissoryNote | null>(null);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);

  // Receipt / Voucher (Dekont Göster) Modal State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isReceiptWhatsAppOpen, setIsReceiptWhatsAppOpen] = useState(false);

  // Helper to find contact by ID or Name
  const findContactInfo = (contactId?: string, contactName?: string) => {
    if (!contactId && !contactName) return undefined;
    return contacts.find(
      (c) =>
        (contactId && c.id === contactId) ||
        (contactName && (c.name?.trim().toLowerCase() === contactName.trim().toLowerCase() || c.companyTitle?.trim().toLowerCase() === contactName.trim().toLowerCase()))
    );
  };

  // Dekont Handlers for all 5 Finance Sub-Modules
  const handleShowAccountReceipt = (acc: Account) => {
    const isKasa = acc.type === "cash";
    const docTitle = isKasa ? "KASA HESAP BAKİYE VE EKSTRE DEKONTU" : "BANKA HESAP BAKİYE VE EKSTRE DEKONTU";
    
    setReceiptData({
      documentTitle: docTitle,
      subTitle: isKasa ? "Nakit Kasa Bakiye ve Durum Raporu" : "Ticari Banka Vadesiz Mevduat Hesabı Bakiye Raporu",
      documentNo: `${isKasa ? "KAS" : "BNK"}-DEK-${acc.id.slice(0, 8).toUpperCase()}`,
      date: new Date().toLocaleDateString("tr-TR"),
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      moduleType: "account",
      accountName: acc.name,
      bankName: acc.bankName,
      iban: acc.iban,
      amount: acc.balance,
      currency: acc.currency,
      description: `${acc.name} hesabı güncel bakiye dökümü ve resmi hesap özeti belgesidir.`,
      details: [
        { label: "Hesap / Kasa Adı", value: acc.name },
        { label: "Hesap Tipi", value: isKasa ? "Nakit Kasa" : "Banka Vadesiz Mevduat" },
        ...(acc.bankName ? [{ label: "Banka Adı", value: acc.bankName }] : []),
        ...(acc.iban ? [{ label: "IBAN Numarası", value: acc.iban }] : []),
        ...(acc.accountNumber ? [{ label: "Hesap Numarası", value: acc.accountNumber }] : []),
        { label: "Para Birimi", value: acc.currency },
        { label: "Güncel Bakiye", value: `${formatCurrency(acc.balance, acc.currency)}` },
        { label: "Düzenleme Tarihi", value: `${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` },
      ]
    });
  };

  const handleShowTransactionReceipt = (tx: Transaction) => {
    const isIncome = tx.type === "income" || tx.type === "collection";
    const isKasa = activeSubModule === "kasa";
    const matchedContact = findContactInfo(tx.contactId, tx.contactName);
    
    let docTitle = "";
    if (isKasa) {
      docTitle = isIncome ? "KASA TAHSİLAT MAKBUZU / DEKONTU" : "KASA TEDİYE MAKBUZU / DEKONTU";
    } else if (tx.type === "transfer") {
      docTitle = "BANKA HESAPLAR ARASI TRANSFER DEKONTU";
    } else {
      docTitle = isIncome ? "BANKA GELEN HAVALE / EFT DEKONTU" : "BANKA GÖNDERİLEN HAVALE / EFT DEKONTU";
    }

    setReceiptData({
      documentTitle: docTitle,
      subTitle: "Resmi Finans İşlem ve Muhasebe Dekontu",
      documentNo: tx.documentNo || `DEK-${tx.id.slice(0, 8).toUpperCase()}`,
      date: tx.date,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      moduleType: isKasa ? "kasa" : "banka",
      accountName: tx.accountName,
      contactName: tx.contactName || (matchedContact ? matchedContact.companyTitle || matchedContact.name : undefined),
      contactTaxNumber: matchedContact?.taxNumber,
      contactTaxOffice: matchedContact?.taxOffice,
      contactPhone: matchedContact?.phone,
      contactAddress: matchedContact?.address,
      contactCity: matchedContact?.city,
      amount: tx.amount,
      currency: tx.currency || "TRY",
      type: tx.type,
      category: tx.category,
      description: tx.description,
      details: [
        { label: "İşlem Türü", value: isIncome ? "Giriş / Tahsilat (+)" : "Çıkış / Ödeme (-)" },
        { label: "İşlem Yapan Hesap / Kasa", value: tx.accountName },
        { label: "Cari / İlgili Kişi veya Firma", value: tx.contactName || tx.category || "-" },
        { label: "İşlem Kategorisi", value: tx.category || "Genel Finans" },
        { label: "Açıklama / Not", value: tx.description || "-" },
        { label: "İşlem Tarihi", value: formatDate(tx.date) },
        { label: "Belge / Referans No", value: tx.documentNo || tx.id.slice(0, 8) },
      ]
    });
  };

  const handleShowChequeReceipt = (c: Cheque) => {
    const isReceived = c.type === "received";
    const matchedContact = findContactInfo(c.contactId, c.contactName);
    const docTitle = isReceived
      ? "MÜŞTERİ ÇEKİ ALINDI BORDRO DEKONTU"
      : "FİRMA / BORÇ ÇEKİ DÜZENLEME DEKONTU";

    const statusMap: Record<string, string> = {
      portfolio: "Portföyde (Tahsilat Bekliyor)",
      collected: "Tahsil Edildi (Hesaba Geçti)",
      endorsed: `Ciro Edildi (${c.endorsedToContactName || "Cariye Devredildi"})`,
      paid: "Ödendi / Kapandı",
      bounced: "Karşılıksız (Karşılıksız İşlemi)",
      cancelled: "İptal Edildi",
    };

    setReceiptData({
      documentTitle: docTitle,
      subTitle: "Kıymetli Evrak İşlem ve Bordro Dekontu",
      documentNo: `ÇEK-${c.chequeNumber}`,
      date: formatDate(c.issueDate || new Date()),
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      moduleType: "cek",
      accountName: c.bankName,
      bankName: c.bankName,
      contactName: c.contactName || (matchedContact ? matchedContact.companyTitle || matchedContact.name : undefined),
      contactTaxNumber: matchedContact?.taxNumber,
      contactTaxOffice: matchedContact?.taxOffice,
      contactPhone: matchedContact?.phone,
      contactAddress: matchedContact?.address,
      contactCity: matchedContact?.city,
      amount: c.amount,
      currency: c.currency || "TRY",
      statusText: statusMap[c.status] || c.status,
      description: c.notes || `Çek No: ${c.chequeNumber} - Banka: ${c.bankName}`,
      details: [
        { label: "Çek Numarası", value: c.chequeNumber },
        { label: "Çek Türü", value: isReceived ? "Alınan Müşteri Çeki" : "Verilen Borç Çeki" },
        { label: "Banka / Şube", value: `${c.bankName} ${c.branchName ? "/ " + c.branchName : ""}` },
        { label: "Keşideci / Borçlu", value: c.drawerName || c.contactName || "-" },
        { label: "İlgili Cari Firma", value: c.contactName || "-" },
        { label: "Keşide Tarihi", value: formatDate(c.issueDate) },
        { label: "Vade Tarihi", value: formatDate(c.dueDate) },
        { label: "Çek Güncel Durumu", value: statusMap[c.status] || c.status },
        ...(c.endorsedToContactName ? [{ label: "Ciro Edilen Cari Firma", value: c.endorsedToContactName }] : []),
        ...(c.notes ? [{ label: "Açıklama / Notlar", value: c.notes }] : []),
      ]
    });
  };

  const handleShowNoteReceipt = (n: PromissoryNote) => {
    const isReceived = n.type === "received";
    const matchedContact = findContactInfo(n.contactId, n.contactName);
    const docTitle = isReceived
      ? "MÜŞTERİ SENETİ ALINDI BORDRO DEKONTU"
      : "FİRMA / BORÇ SENETİ DÜZENLEME DEKONTU";

    const statusMap: Record<string, string> = {
      portfolio: "Portföyde (Tahsilat Bekliyor)",
      collected: "Tahsil Edildi (Hesaba Geçti)",
      endorsed: `Ciro Edildi (${n.endorsedToContactName || "Cariye Devredildi"})`,
      paid: "Ödendi / Kapandı",
      protested: "Protestolu Senet İşlemi",
      cancelled: "İptal Edildi",
    };

    setReceiptData({
      documentTitle: docTitle,
      subTitle: "Kıymetli Evrak İşlem ve Bordro Dekontu",
      documentNo: `SNT-${n.noteNumber}`,
      date: formatDate(n.issueDate || new Date()),
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      moduleType: "senet",
      contactName: n.contactName || (matchedContact ? matchedContact.companyTitle || matchedContact.name : undefined),
      contactTaxNumber: matchedContact?.taxNumber,
      contactTaxOffice: matchedContact?.taxOffice,
      contactPhone: matchedContact?.phone,
      contactAddress: matchedContact?.address,
      contactCity: matchedContact?.city,
      amount: n.amount,
      currency: n.currency || "TRY",
      statusText: statusMap[n.status] || n.status,
      description: n.notes || `Senet No: ${n.noteNumber} - Borçlu: ${n.debtorName}`,
      details: [
        { label: "Senet Numarası", value: n.noteNumber },
        { label: "Senet Türü", value: isReceived ? "Alınan Müşteri Senedi" : "Verilen Borç Senedi" },
        { label: "Borçlu / Düzenleyen", value: n.debtorName || n.contactName || "-" },
        { label: "İlgili Cari Firma", value: n.contactName || "-" },
        { label: "Tanzim (Düzenleme) Tarihi", value: formatDate(n.issueDate) },
        { label: "Vade Tarihi", value: formatDate(n.dueDate) },
        { label: "Senet Güncel Durumu", value: statusMap[n.status] || n.status },
        ...(n.endorsedToContactName ? [{ label: "Ciro Edilen Cari Firma", value: n.endorsedToContactName }] : []),
        ...(n.notes ? [{ label: "Açıklama / Notlar", value: n.notes }] : []),
      ]
    });
  };

  const handleShowVirmanReceipt = (tx: Transaction) => {
    const matchedContact = findContactInfo(tx.contactId, tx.contactName);
    setReceiptData({
      documentTitle: "VİRMAN TRANSFER DEKONTU",
      subTitle: "Hesaplar Arası & Cari Virman Transfer Belgesi",
      documentNo: tx.documentNo || `VRM-${tx.id.slice(0, 8).toUpperCase()}`,
      date: formatDate(tx.date),
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      moduleType: "virman",
      accountName: tx.accountName,
      contactName: tx.contactName || tx.category || (matchedContact ? matchedContact.companyTitle || matchedContact.name : undefined),
      contactTaxNumber: matchedContact?.taxNumber,
      contactTaxOffice: matchedContact?.taxOffice,
      contactPhone: matchedContact?.phone,
      contactAddress: matchedContact?.address,
      contactCity: matchedContact?.city,
      amount: tx.amount,
      currency: tx.currency || "TRY",
      type: "transfer",
      category: "Virman Transferi",
      description: tx.description,
      details: [
        { label: "Borçlu / Çıkan Hesap", value: tx.accountName },
        { label: "Alacaklı / Giren Taraf", value: tx.contactName || tx.category || "-" },
        { label: "Transfer Tarihi", value: formatDate(tx.date) },
        { label: "İşlem Türü", value: "Hesap Arası / Cari Virman Transferi" },
        { label: "Açıklama / Not", value: tx.description || "-" },
        { label: "Dekont / Referans No", value: tx.documentNo || tx.id.slice(0, 8) },
      ]
    });
  };

  const handleExportReceiptPDF = async () => {
    const element = document.getElementById("printable-receipt");
    if (!element) {
      alert("Yazdırılacak dekont içeriği bulunamadı.");
      return;
    }
    try {
      setIsPdfGenerating(true);
      const fileName = `Dekont_${receiptData?.documentNo || "Finans_Dekontu"}.pdf`;
      await exportElementToPDF("printable-receipt", fileName, { orientation: "p", margin: 8, scale: 2 });
    } catch (err) {
      console.error("Dekont PDF oluşturulurken hata:", err);
      alert("PDF belgesi oluşturulurken bir hata oluştu.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Universal Finance Share Modal State
  const [shareConfig, setShareConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    docType: "account" | "transaction" | "cheque" | "note" | "virman";
    recipientPhone: string;
    recipientEmail: string;
    textPayload: string;
    itemData?: any;
  }>({
    isOpen: false,
    title: "",
    docType: "account",
    recipientPhone: "",
    recipientEmail: "",
    textPayload: "",
  });

  const [shareWaMode, setShareWaMode] = useState<"direct" | "auto" | "app" | "web">("direct");
  const [waConnectionStatus, setWaConnectionStatus] = useState<WhatsAppClientStatus | null>(null);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [shareActiveTab, setShareActiveTab] = useState<"whatsapp" | "email" | "copy" | "print">("whatsapp");

  const handleOpenShareModal = (
    docType: "account" | "transaction" | "cheque" | "note" | "virman",
    item: any
  ) => {
    let title = "";
    let subtitle = "";
    let textPayload = "";
    let recipientPhone = "";
    let recipientEmail = "";

    if (item.contactId) {
      const linkedContact = contacts.find((c) => c.id === item.contactId);
      if (linkedContact) {
        recipientPhone = linkedContact.phone || linkedContact.mobile || "";
        recipientEmail = linkedContact.email || "";
      }
    }

    if (docType === "account") {
      title = `${item.name} - Hesap Bilgileri Paylaş`;
      subtitle = item.type === "cash" ? "Kasa Hesabı Bilgileri" : "Banka IBAN & Hesap Detayları";
      textPayload = generateAccountShareText(item);
    } else if (docType === "transaction") {
      title = `Dekont / Fiş Paylaş (${item.documentNo || item.id})`;
      subtitle = `${item.accountName || "Kasa/Banka"} - ${item.date}`;
      textPayload = generateTransactionShareText(item);
    } else if (docType === "cheque") {
      title = `Çek Bilgisi Paylaş (${item.chequeNumber})`;
      subtitle = `Vade: ${item.dueDate} - Tutar: ₺${item.amount.toLocaleString("tr-TR")}`;
      textPayload = generateChequeShareText(item);
    } else if (docType === "note") {
      title = `Senet Bilgisi Paylaş (${item.noteNumber})`;
      subtitle = `Vade: ${item.dueDate} - Tutar: ₺${item.amount.toLocaleString("tr-TR")}`;
      textPayload = generateNoteShareText(item);
    } else if (docType === "virman") {
      title = `Virman Transfer Dekontu Paylaş`;
      subtitle = `Tarih: ${item.date} - Tutar: ₺${item.amount.toLocaleString("tr-TR")}`;
      textPayload = generateTransactionShareText(item);
    }

    setShareConfig({
      isOpen: true,
      title,
      subtitle,
      docType,
      recipientPhone,
      recipientEmail,
      textPayload,
      itemData: item,
    });
    setShareActiveTab("whatsapp");
    setCopiedSuccess(false);

    fetchWhatsAppStatus()
      .then((st) => {
        setWaConnectionStatus(st);
        if (st.status === "connected") {
          setShareWaMode("direct");
        } else {
          setShareWaMode("web");
        }
      })
      .catch(() => {
        setShareWaMode("web");
      });
  };

  const handleSendDirectWhatsApp = async () => {
    if (!shareConfig.recipientPhone.trim()) {
      alert("Lütfen WhatsApp paylaşımı için geçerli bir telefon numarası girin.");
      return;
    }

    if (shareWaMode === "direct") {
      setIsSendingWa(true);
      try {
        const res = await sendWhatsAppTextApi(
          shareConfig.recipientPhone,
          shareConfig.textPayload,
          shareConfig.title
        );
        if (res.success) {
          alert("✅ Bilgilendirme mesajı WhatsApp üzerinden doğrudan başarıyla iletildi!");
          setShareConfig((prev) => ({ ...prev, isOpen: false }));
        } else {
          alert(`WhatsApp doğrudan gönderim hatası: ${res.error || "Bilinmeyen hata"}\n\nDilerseniz 'WhatsApp Web Linki' seçeneğini deneyebilirsiniz.`);
        }
      } catch (err: any) {
        alert("Hata: " + err.message);
      } finally {
        setIsSendingWa(false);
      }
      return;
    }

    // Web / App fallback
    let cleanPhone = shareConfig.recipientPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "90" + cleanPhone.substring(1);
    } else if (cleanPhone.length === 10 && (cleanPhone.startsWith("5") || cleanPhone.startsWith("8"))) {
      cleanPhone = "90" + cleanPhone;
    }

    let waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(shareConfig.textPayload)}`;
    if (shareWaMode === "auto" || shareWaMode === "app") {
      waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(shareConfig.textPayload)}`;
    }

    window.open(waUrl, "_blank");
    setShareConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // New Transaction State
  const [addTxContext, setAddTxContext] = useState<"kasa" | "banka">("kasa");
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txAccountId, setTxAccountId] = useState("");
  const [txContactId, setTxContactId] = useState("");
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDocumentNo, setTxDocumentNo] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");

  const handleOpenAddTxModal = (context: "kasa" | "banka") => {
    setAddTxContext(context);
    setTxType("income");
    setTxContactId("");
    setTxAmount("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setTxDocumentNo("");
    setTxDescription("");

    if (context === "kasa") {
      const defaultAcc = selectedCashAccountId || accounts.find((a) => a.type === "cash")?.id || accounts[0]?.id || "";
      setTxAccountId(defaultAcc);
      setTxCategory("Kasa Tahsilat / Gelir");
    } else {
      const defaultAcc =
        selectedBankAccountId ||
        accounts.find((a) => a.type === "bank" || a.type === "credit_card")?.id ||
        accounts[0]?.id ||
        "";
      setTxAccountId(defaultAcc);
      setTxCategory("Banka Havale / EFT");
    }

    setIsAddTxModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAccountId || !txAmount || Number(txAmount) <= 0) return;

    const targetAcc = accounts.find((a) => a.id === txAccountId);
    if (!targetAcc) return;

    const targetContact = contacts.find((c) => c.id === txContactId);
    const numAmount = Number(txAmount);

    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      date: txDate || new Date().toISOString().split("T")[0],
      type: txType,
      amount: numAmount,
      currency: targetAcc.currency || "TRY",
      accountId: targetAcc.id,
      accountName: targetAcc.name,
      contactId: targetContact ? targetContact.id : undefined,
      contactName: targetContact ? targetContact.name : undefined,
      category: txCategory || (addTxContext === "kasa" ? "Kasa İşlemi" : "Banka İşlemi"),
      description: txDescription || `${addTxContext === "kasa" ? "Kasa" : "Banka"} Hareketi`,
      documentNo: txDocumentNo.trim() || undefined,
    };

    if (onAddTransaction) {
      onAddTransaction(newTx);
    }

    setIsAddTxModalOpen(false);
  };

  // Endorsement (Ciro / Ciranta) State
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [endorseDocType, setEndorseDocType] = useState<"cheque" | "note">("cheque");
  const [endorseSelectedDocId, setEndorseSelectedDocId] = useState("");
  const [endorseContactId, setEndorseContactId] = useState("");
  const [endorseDate, setEndorseDate] = useState(new Date().toISOString().split("T")[0]);
  const [endorseNote, setEndorseNote] = useState("");

  const handleOpenEndorseModal = (docType: "cheque" | "note", preselectedId?: string) => {
    setEndorseDocType(docType);
    setEndorseContactId("");
    setEndorseDate(new Date().toISOString().split("T")[0]);
    setEndorseNote("");

    if (preselectedId) {
      setEndorseSelectedDocId(preselectedId);
    } else {
      if (docType === "cheque") {
        const firstPortCheque = cheques.find((c) => c.status === "portfolio");
        setEndorseSelectedDocId(firstPortCheque ? firstPortCheque.id : "");
      } else {
        const firstPortNote = promissoryNotes.find((n) => n.status === "portfolio");
        setEndorseSelectedDocId(firstPortNote ? firstPortNote.id : "");
      }
    }

    setIsEndorseModalOpen(true);
  };

  const handleSaveEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorseSelectedDocId || !endorseContactId) return;

    const targetContact = contacts.find((c) => c.id === endorseContactId);
    if (!targetContact) return;

    if (endorseDocType === "cheque") {
      const selectedCheque = cheques.find((c) => c.id === endorseSelectedDocId);
      if (!selectedCheque) return;

      if (onEndorseCheque) {
        onEndorseCheque(selectedCheque.id, targetContact.id, targetContact.name, endorseDate);
      } else if (onUpdateChequeStatus) {
        onUpdateChequeStatus(selectedCheque.id, "endorsed");
      }

      if (onAddTransaction) {
        onAddTransaction({
          id: "tx_end_" + Date.now(),
          date: endorseDate || new Date().toISOString().split("T")[0],
          type: "payment",
          amount: selectedCheque.amount,
          currency: selectedCheque.currency || "TRY",
          accountId: accounts[0]?.id || "default",
          accountName: "Çek / Senet Portföyü",
          contactId: targetContact.id,
          contactName: targetContact.name,
          category: "Ciro Edilen Çek",
          description: `Ciro Edilen Çek (Ciranta): Çek No ${selectedCheque.chequeNumber} (${selectedCheque.bankName}) -> ${targetContact.name}. ${endorseNote}`.trim(),
          documentNo: selectedCheque.chequeNumber,
        });
      }
    } else {
      const selectedNote = promissoryNotes.find((n) => n.id === endorseSelectedDocId);
      if (!selectedNote) return;

      if (onEndorsePromissoryNote) {
        onEndorsePromissoryNote(selectedNote.id, targetContact.id, targetContact.name, endorseDate);
      } else if (onUpdateNoteStatus) {
        onUpdateNoteStatus(selectedNote.id, "endorsed");
      }

      if (onAddTransaction) {
        onAddTransaction({
          id: "tx_end_" + Date.now(),
          date: endorseDate || new Date().toISOString().split("T")[0],
          type: "payment",
          amount: selectedNote.amount,
          currency: selectedNote.currency || "TRY",
          accountId: accounts[0]?.id || "default",
          accountName: "Çek / Senet Portföyü",
          contactId: targetContact.id,
          contactName: targetContact.name,
          category: "Ciro Edilen Senet",
          description: `Ciro Edilen Senet (Ciranta): Senet No ${selectedNote.noteNumber} -> ${targetContact.name}. ${endorseNote}`.trim(),
          documentNo: selectedNote.noteNumber,
        });
      }
    }

    setIsEndorseModalOpen(false);
  };

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [chequeFilterType, setChequeFilterType] = useState<"all" | "received" | "issued">("all");
  const [noteFilterType, setNoteFilterType] = useState<"all" | "received" | "issued">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCashAccountId, setSelectedCashAccountId] = useState<string | null>(null);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);

  // Date Presets Handlers
  const handlePresetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handlePresetLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handlePresetThisYear = () => {
    const now = new Date();
    setStartDate(`${now.getFullYear()}-01-01`);
    setEndDate(`${now.getFullYear()}-12-31`);
  };

  const handlePresetLast30Days = () => {
    const now = new Date();
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    setStartDate(past.toISOString().split("T")[0]);
    setEndDate(now.toISOString().split("T")[0]);
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // Transfer Form State
  const [fromAccId, setFromAccId] = useState(accounts[0]?.id || "");
  const [toAccId, setToAccId] = useState(accounts[1]?.id || accounts[0]?.id || "");
  const [transferAmount, setTransferAmount] = useState<number>(1000);
  const [transferDesc, setTransferDesc] = useState("Kasa Banka Virman Transferi");

  // New Account Form State
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<"cash" | "bank">("bank");
  const [accCurrency, setAccCurrency] = useState("TRY");
  const [accBankName, setAccBankName] = useState("");
  const [accIban, setAccIban] = useState("");
  const [accInitialBalance, setAccInitialBalance] = useState(0);

  // New Cheque Form State
  const [chqType, setChqType] = useState<"received" | "issued">("received");
  const [chqNumber, setChqNumber] = useState("");
  const [chqBankName, setChqBankName] = useState("");
  const [chqBranchName, setChqBranchName] = useState("");
  const [chqDrawerName, setChqDrawerName] = useState("");
  const [chqContactId, setChqContactId] = useState("");
  const [chqIssueDate, setChqIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [chqDueDate, setChqDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [chqAmount, setChqAmount] = useState<number>(5000);
  const [chqCurrency, setChqCurrency] = useState("TRY");
  const [chqNotes, setChqNotes] = useState("");

  // New Note Form State
  const [ntType, setNtType] = useState<"received" | "issued">("received");
  const [ntNumber, setNtNumber] = useState("");
  const [ntDebtorName, setNtDebtorName] = useState("");
  const [ntContactId, setNtContactId] = useState("");
  const [ntIssueDate, setNtIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [ntDueDate, setNtDueDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [ntAmount, setNtAmount] = useState<number>(10000);
  const [ntCurrency, setNtCurrency] = useState("TRY");
  const [ntNotes, setNtNotes] = useState("");

  // Totals
  const totalCashBalance = accounts
    .filter((a) => a.type === "cash")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalBankBalance = accounts
    .filter((a) => a.type === "bank" || a.type === "credit_card")
    .reduce((sum, a) => sum + a.balance, 0);

  const portfolioChequesTotal = cheques
    .filter((c) => c.status === "portfolio")
    .reduce((sum, c) => sum + c.amount, 0);

  const portfolioNotesTotal = promissoryNotes
    .filter((n) => n.status === "portfolio")
    .reduce((sum, n) => sum + n.amount, 0);

  // Handlers
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    const newAcc: Account = {
      id: "acc_" + Date.now(),
      name: accName,
      type: accType,
      currency: accCurrency,
      balance: accInitialBalance,
      bankName: accType === "bank" ? accBankName : undefined,
      iban: accType === "bank" ? accIban : undefined,
    };

    onAddAccount(newAcc);
    handleBackToList();
    setAccName("");
    setAccBankName("");
    setAccIban("");
    setAccInitialBalance(0);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccId === toAccId || transferAmount <= 0) return;

    onTransferBetweenAccounts(fromAccId, toAccId, transferAmount, transferDesc);
    handleBackToList();
    setTransferAmount(0);
    setTransferDesc("");
  };

  const handleSaveCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chqNumber.trim() || chqAmount <= 0) return;

    const selectedContact = contacts.find((c) => c.id === chqContactId);

    const newChq: Cheque = {
      id: "chq_" + Date.now(),
      type: chqType,
      chequeNumber: chqNumber,
      bankName: chqBankName || "Garanti BBVA",
      branchName: chqBranchName,
      drawerName: chqDrawerName || selectedContact?.name || "Bilinmiyor",
      contactId: chqContactId || undefined,
      contactName: selectedContact?.name || chqDrawerName || "Genel Cari",
      issueDate: chqIssueDate,
      dueDate: chqDueDate,
      amount: chqAmount,
      currency: chqCurrency,
      status: "portfolio",
      notes: chqNotes,
    };

    if (onAddCheque) onAddCheque(newChq);
    setIsChequeModalOpen(false);
    setChqNumber("");
    setChqBankName("");
    setChqBranchName("");
    setChqDrawerName("");
    setChqNotes("");
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ntNumber.trim() || ntAmount <= 0) return;

    const selectedContact = contacts.find((c) => c.id === ntContactId);

    const newNt: PromissoryNote = {
      id: "nt_" + Date.now(),
      type: ntType,
      noteNumber: ntNumber,
      debtorName: ntDebtorName || selectedContact?.name || "Bilinmiyor",
      contactId: ntContactId || undefined,
      contactName: selectedContact?.name || ntDebtorName || "Genel Cari",
      issueDate: ntIssueDate,
      dueDate: ntDueDate,
      amount: ntAmount,
      currency: ntCurrency,
      status: "portfolio",
      notes: ntNotes,
    };

    if (onAddPromissoryNote) onAddPromissoryNote(newNt);
    setIsNoteModalOpen(false);
    setNtNumber("");
    setNtDebtorName("");
    setNtNotes("");
  };

  // Filtered lists with Date Range & Search filtering
  const activeSearchQuery = (globalSearchTerm || searchQuery).toLowerCase().trim();

  const kasaTransactions = transactions
    .filter((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      if (acc?.type !== "cash") return false;
      if (selectedCashAccountId && t.accountId !== selectedCashAccountId) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (activeSearchQuery) {
        const match =
          t.description.toLowerCase().includes(activeSearchQuery) ||
          (t.contactName && t.contactName.toLowerCase().includes(activeSearchQuery)) ||
          (t.documentNo && t.documentNo.toLowerCase().includes(activeSearchQuery)) ||
          t.category.toLowerCase().includes(activeSearchQuery);
        if (!match) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const bankTransactions = transactions
    .filter((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      if (acc?.type !== "bank" && acc?.type !== "credit_card") return false;
      if (selectedBankAccountId && t.accountId !== selectedBankAccountId) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (activeSearchQuery) {
        const match =
          t.description.toLowerCase().includes(activeSearchQuery) ||
          (t.contactName && t.contactName.toLowerCase().includes(activeSearchQuery)) ||
          (t.documentNo && t.documentNo.toLowerCase().includes(activeSearchQuery)) ||
          t.category.toLowerCase().includes(activeSearchQuery);
        if (!match) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredCheques = cheques.filter((c) => {
    const matchesType = chequeFilterType === "all" || c.type === chequeFilterType;
    const matchesQuery =
      !activeSearchQuery ||
      c.chequeNumber.toLowerCase().includes(activeSearchQuery) ||
      c.bankName.toLowerCase().includes(activeSearchQuery) ||
      c.contactName.toLowerCase().includes(activeSearchQuery);

    let matchesDate = true;
    if (startDate) {
      const d = c.dueDate || c.issueDate;
      if (d && d < startDate) matchesDate = false;
    }
    if (endDate && matchesDate) {
      const d = c.dueDate || c.issueDate;
      if (d && d > endDate) matchesDate = false;
    }

    return matchesType && matchesQuery && matchesDate;
  });

  const filteredNotes = promissoryNotes.filter((n) => {
    const matchesType = noteFilterType === "all" || n.type === noteFilterType;
    const matchesQuery =
      !activeSearchQuery ||
      n.noteNumber.toLowerCase().includes(activeSearchQuery) ||
      n.debtorName.toLowerCase().includes(activeSearchQuery) ||
      n.contactName.toLowerCase().includes(activeSearchQuery);

    let matchesDate = true;
    if (startDate) {
      const d = n.dueDate || n.issueDate;
      if (d && d < startDate) matchesDate = false;
    }
    if (endDate && matchesDate) {
      const d = n.dueDate || n.issueDate;
      if (d && d > endDate) matchesDate = false;
    }

    return matchesType && matchesQuery && matchesDate;
  });

  const virmanTransactions = transactions
    .filter((t) => {
      const isVirman =
        t.category === "Virman / Transfer" ||
        t.category === "Virman" ||
        t.category === "Transfer" ||
        t.description.toLowerCase().includes("virman") ||
        t.description.toLowerCase().includes("transfer");
      if (!isVirman) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const displayedKasaTransactions = kasaTransactions.slice(0, kasaDisplayLimit);
  const displayedBankTransactions = bankTransactions.slice(0, bankDisplayLimit);
  const displayedCheques = filteredCheques.slice(0, chequeDisplayLimit);
  const displayedNotes = filteredNotes.slice(0, noteDisplayLimit);
  const displayedVirmanTransactions = virmanTransactions.slice(0, virmanDisplayLimit);

  const renderDateFilterBar = (subModuleName: string) => {
    const isFiltered = Boolean(startDate || endDate);
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-purple-200/60 shadow-2xs">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Vektör Şekli */}
        <svg
          className="absolute -right-4 -bottom-6 w-32 h-32 pointer-events-none text-purple-400/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="1" />
        </svg>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-purple-100/60 border border-purple-200/60 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs backdrop-blur-2xs">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-purple-900 uppercase tracking-tight">
                Tarih Aralığı Filtresi ({subModuleName})
              </span>
              {isFiltered && (
                <span className="text-[10px] font-extrabold bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                  Filtre Aktif
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-purple-900/70 mt-0.5">
              {isFiltered
                ? `${startDate ? new Date(startDate).toLocaleDateString("tr-TR") : "Başlangıç Sınırsız"} — ${
                    endDate ? new Date(endDate).toLocaleDateString("tr-TR") : "Bitiş Sınırsız"
                  } arasındaki hareketler`
                : "Tarih aralığı seçerek belirli tarihler arasındaki finansal hareketleri süzün."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {/* Inputs */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-purple-200/60 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-purple-700/60">Tarih:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            />
            <span className="text-purple-300 font-bold text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={handlePresetThisMonth}
              type="button"
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
            >
              Bu Ay
            </button>
            <button
              onClick={handlePresetLastMonth}
              type="button"
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
            >
              Geçen Ay
            </button>
            <button
              onClick={handlePresetLast30Days}
              type="button"
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
            >
              Son 30 Gün
            </button>
            <button
              onClick={handlePresetThisYear}
              type="button"
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-900 border border-purple-200/60 transition-colors cursor-pointer shadow-2xs"
            >
              Bu Yıl
            </button>
            {isFiltered && (
              <button
                onClick={handleClearDates}
                type="button"
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getChequeStatusBadge = (status: ChequeStatus, endorsedToContactName?: string) => {
    switch (status) {
      case "portfolio":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Portföyde</span>;
      case "collected":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Tahsil Edildi</span>;
      case "endorsed":
        return (
          <span
            className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"
            title={endorsedToContactName ? `Ciro Edilen: ${endorsedToContactName}` : "Ciro Edildi"}
          >
            <span>Ciro Edildi</span>
            {endorsedToContactName && (
              <span className="text-[9px] text-blue-900 bg-blue-100/90 px-1 rounded font-semibold max-w-[90px] truncate">
                ➔ {endorsedToContactName}
              </span>
            )}
          </span>
        );
      case "paid":
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Ödendi</span>;
      case "bounced":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Karşılıksız</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">İptal</span>;
    }
  };

  const getNoteStatusBadge = (status: PromissoryNoteStatus, endorsedToContactName?: string) => {
    switch (status) {
      case "portfolio":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Portföyde</span>;
      case "collected":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Tahsil Edildi</span>;
      case "endorsed":
        return (
          <span
            className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"
            title={endorsedToContactName ? `Ciro Edilen: ${endorsedToContactName}` : "Ciro Edildi"}
          >
            <span>Ciro Edildi</span>
            {endorsedToContactName && (
              <span className="text-[9px] text-purple-900 bg-purple-100/90 px-1 rounded font-semibold max-w-[90px] truncate">
                ➔ {endorsedToContactName}
              </span>
            )}
          </span>
        );
      case "paid":
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Ödendi</span>;
      case "protested":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Protestolu</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">İptal</span>;
    }
  };

  // =========================================================================
  // 1. FULL-PAGE DETAIL VIEW: CREATE ACCOUNT (KASA / BANKA EKLE)
  // =========================================================================
  if (detailNav.mode === "create" || isAccountModalOpen) {
    const isCash = accType === "cash";
    return (
      <DetailPageLayout
        title={`Yeni ${isCash ? "Nakit Kasa Hesabı" : "Banka Vadesiz Mevduat Hesabı"}`}
        subtitle="Finans ve nakit akışı takibi için yeni kasa veya banka hesabı kartı tanımlayın"
        breadcrumbs={[
          { label: "Finans Yönetimi", onClick: handleBackToList },
          { label: activeSubModule === "kasa" ? "Nakit Kasalar" : "Banka Hesapları", onClick: handleBackToList },
          { label: `Yeni ${isCash ? "Kasa" : "Banka"} Kartı`, active: true },
        ]}
        onBack={handleBackToList}
        statusBadge={
          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
            YENİ FİNANS KARTI
          </span>
        }
        headerIcon={<Landmark className="w-5 h-5 text-purple-700" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              İptal / Vazgeç
            </button>
            <button
              type="submit"
              form="account-create-form"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Hesabı Kaydet</span>
            </button>
          </div>
        }
      >
        <div className="max-w-3xl mx-auto">
          <form id="account-create-form" onSubmit={handleSaveAccount} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-700" />
                  <span>Hesap Kartı Bilgileri</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Hesap adı, para birimi ve varsa banka IBAN bilgilerini eksiksiz girin.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hesap / Kasa Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isCash ? "Örn: Merkez Nakit Kasası, Dolar Kasası" : "Örn: Garanti Ticari TL, İş Bankası USD"}
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hesap Türü
                  </label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as "cash" | "bank")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="bank">Banka Hesabı (Vadesiz Mevduat)</option>
                    <option value="cash">Nakit Kasası</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Para Birimi
                  </label>
                  <select
                    value={accCurrency}
                    onChange={(e) => setAccCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="TRY">Türk Lirası (₺ - TRY)</option>
                    <option value="USD">Amerikan Doları ($ - USD)</option>
                    <option value="EUR">Euro (€ - EUR)</option>
                    <option value="GBP">İngiliz Sterlini (£ - GBP)</option>
                  </select>
                </div>

                {accType === "bank" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Banka Adı
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Yapı Kredi, Garanti BBVA, İş Bankası..."
                        value={accBankName}
                        onChange={(e) => setAccBankName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        IBAN Numarası
                      </label>
                      <input
                        type="text"
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        value={accIban}
                        onChange={(e) => setAccIban(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Açılış Devir Bakiyesi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={accInitialBalance}
                      onChange={(e) => setAccInitialBalance(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                      {accCurrency}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Bu hesaba ait önceki dönemden devreden mevcut nakit bakiyesini girebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DetailPageLayout>
    );
  }

  // =========================================================================
  // 2. FULL-PAGE DETAIL VIEW: EDIT ACCOUNT (KASA / BANKA DÜZENLE)
  // =========================================================================
  if ((detailNav.mode === "edit" || isEditAccountModalOpen) && editingAccount) {
    return (
      <DetailPageLayout
        title={`${editingAccount.name} - Hesap Kartı Düzenle`}
        subtitle={`${editingAccount.type === "cash" ? "Nakit Kasa" : "Banka Vadesiz Mevduat"} Kartı Bilgileri`}
        breadcrumbs={[
          { label: "Finans Yönetimi", onClick: handleBackToList },
          { label: editingAccount.type === "cash" ? "Nakit Kasalar" : "Banka Hesapları", onClick: handleBackToList },
          { label: editingAccount.name, onClick: handleBackToList },
          { label: "Düzenle", active: true },
        ]}
        onBack={handleBackToList}
        statusBadge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Güncel Bakiye: {formatCurrency(editingAccount.balance, editingAccount.currency)}
          </span>
        }
        headerIcon={<Pencil className="w-5 h-5 text-purple-700" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              İptal / Vazgeç
            </button>
            <button
              type="submit"
              form="account-edit-form"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        }
      >
        <div className="max-w-3xl mx-auto">
          <form
            id="account-edit-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateAccount && editingAccount) {
                onUpdateAccount(editingAccount);
              }
              handleBackToList();
            }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-purple-700" />
                  <span>Hesap Kartı Bilgilerini Güncelle</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Hesap adı, türü ve banka detaylarını güncelleyebilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hesap / Kasa Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAccount.name}
                    onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hesap Türü</label>
                  <select
                    value={editingAccount.type}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        type: e.target.value as "cash" | "bank" | "credit_card" | "pos",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cash">Nakit Kasa</option>
                    <option value="bank">Banka Vadesiz Hesabı</option>
                    <option value="credit_card">Kredi Kartı Hesabı</option>
                    <option value="pos">POS Hesabı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Para Birimi</label>
                  <select
                    value={editingAccount.currency || "TRY"}
                    onChange={(e) => setEditingAccount({ ...editingAccount, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                {editingAccount.type !== "cash" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Banka Adı</label>
                      <input
                        type="text"
                        value={editingAccount.bankName || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                        placeholder="Örn: Garanti BBVA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">IBAN Numarası</label>
                      <input
                        type="text"
                        value={editingAccount.iban || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, iban: e.target.value })}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Hesap Numarası</label>
                      <input
                        type="text"
                        value={editingAccount.accountNumber || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, accountNumber: e.target.value })}
                        placeholder="Örn: 1234567-5001"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Şube Adı</label>
                      <input
                        type="text"
                        value={editingAccount.branchName || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, branchName: e.target.value })}
                        placeholder="Örn: Levent Şubesi"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </DetailPageLayout>
    );
  }

  // =========================================================================
  // 3. FULL-PAGE DETAIL VIEW: VIRMAN / TRANSFER
  // =========================================================================
  if (detailNav.mode === "transfer" || isTransferModalOpen) {
    const fromAcc = accounts.find((a) => a.id === fromAccId);
    const toAcc = accounts.find((a) => a.id === toAccId);
    return (
      <DetailPageLayout
        title="Hesaplar Arası Virman Transferi"
        subtitle="Kasa, banka ve cari hesaplar arasında anlık çift taraflı bakiye transferi ve resmi virman fişi"
        breadcrumbs={[
          { label: "Finans Yönetimi", onClick: handleBackToList },
          { label: "Virman & Transferler", onClick: handleBackToList },
          { label: "Yeni Virman Fişi", active: true },
        ]}
        onBack={handleBackToList}
        statusBadge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Çift Taraflı Virman Kaydı
          </span>
        }
        headerIcon={<ArrowRightLeft className="w-5 h-5 text-purple-700" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              İptal / Vazgeç
            </button>
            <button
              type="submit"
              form="virman-transfer-form"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Transferi Gerçekleştir</span>
            </button>
          </div>
        }
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <form id="virman-transfer-form" onSubmit={handleExecuteTransfer} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-purple-700" />
                  <span>Virman & Bakiye Aktarım Formu</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Kaynak ve hedef hesapları belirleyip aktarılacak virman tutarını girin.
                </p>
              </div>

              {/* Source and Target Visual Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    Borçlandırılan (Çıkan Kaynak)
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {fromAcc ? `${fromAcc.name} (${formatCurrency(fromAcc.balance, fromAcc.currency)})` : "Seçiniz"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Alacaklandırılan (Giren Hedef)
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {toAcc ? `${toAcc.name} (${formatCurrency(toAcc.balance, toAcc.currency)})` : "Seçiniz"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Borçlu Hesap (Kaynak - Bakiye Düşecek) *
                  </label>
                  <select
                    value={fromAccId}
                    onChange={(e) => setFromAccId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <optgroup label="🏦 Kasa & Banka Hesapları">
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          [Kasa/Banka] {a.name} ({a.type === "cash" ? "Kasa" : "Banka"}) - Bakiye: ₺
                          {a.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </optgroup>
                    {contacts.length > 0 && (
                      <optgroup label="👤 Cari Hesaplar (Müşteriler / Tedarikçiler)">
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            [Cari] {c.name} ({c.type === "customer" ? "Müşteri" : "Tedarikçi"}) - Bakiye: ₺
                            {c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alacaklı Hesap (Hedef - Bakiye Eklenecek) *
                  </label>
                  <select
                    value={toAccId}
                    onChange={(e) => setToAccId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <optgroup label="🏦 Kasa & Banka Hesapları">
                      {accounts
                        .filter((a) => a.id !== fromAccId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            [Kasa/Banka] {a.name} ({a.type === "cash" ? "Kasa" : "Banka"}) - Bakiye: ₺
                            {a.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                    </optgroup>
                    {contacts.filter((c) => c.id !== fromAccId).length > 0 && (
                      <optgroup label="👤 Cari Hesaplar (Müşteriler / Tedarikçiler)">
                        {contacts
                          .filter((c) => c.id !== fromAccId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              [Cari] {c.name} ({c.type === "customer" ? "Müşteri" : "Tedarikçi"}) - Bakiye: ₺
                              {c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Transfer Tutarı (TL) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Virman Açıklaması
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Merkez kasadan Garanti hesabına nakit yatırma"
                    value={transferDesc}
                    onChange={(e) => setTransferDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </DetailPageLayout>
    );
  }

  // Helper to render printable receipt content
  const renderPrintableReceiptContent = (receipt: ReceiptData) => (
    <div
      id="printable-receipt"
      style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
      className="bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 w-full mx-auto space-y-6 font-sans text-xs sm:text-sm"
    >
      {/* Corporate Header Section */}
      <div className="border-b-2 border-indigo-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {companySettings?.logoUrl ? (
            <img
              src={companySettings.logoUrl}
              alt="Firma Logo"
              className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1 bg-white"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              style={{ backgroundColor: "#312e81", color: "#ffffff" }}
              className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl shadow-xs border border-indigo-900 shrink-0"
            >
              <Landmark className="w-7 h-7 text-indigo-100" />
            </div>
          )}
          <div className="space-y-0.5">
            <div className="font-extrabold text-base sm:text-lg text-slate-950 tracking-tight leading-tight">
              {companySettings?.companyTitle || companySettings?.companyName || "MUAVİN KURUMSAL FİNANS VE YÖNETİM HİZMETLERİ"}
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <div>{companySettings?.address || "Merkez Mah. Büyükdere Cad. No:142 Şişli / İstanbul"}</div>
              <div>
                Vergi Dairesi: {companySettings?.taxOffice || "Boğaziçi"} • VKN/TCKN: {companySettings?.taxNumber || "1234567890"}
              </div>
              <div>
                Tel: {companySettings?.phone || "0850 123 45 67"} • E-posta: {companySettings?.email || "finans@muavin.com"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1" }}
          className="text-center p-3 rounded-2xl border min-w-[220px] shrink-0"
        >
          <span className="text-[11px] font-black text-indigo-950 uppercase tracking-widest block">
            RESMİ FİNANS DEKONTU
          </span>
          <div
            style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#0f172a" }}
            className="font-mono text-xs font-black py-1 px-2 rounded-lg border mt-1"
          >
            {receipt.documentNo}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Tarih: {receipt.date} {receipt.time ? `• ${receipt.time}` : ""}
          </div>
        </div>
      </div>

      {/* Subtitle / Description */}
      <div
        style={{ backgroundColor: "#eef2ff", borderColor: "#c7d2fe" }}
        className="p-3.5 rounded-xl border flex items-center justify-between gap-2"
      >
        <div>
          <span className="font-extrabold text-indigo-950 text-xs block">
            {receipt.documentTitle}
          </span>
          <span className="text-[11px] text-indigo-700 font-medium">
            {receipt.subTitle || "Resmi muhasebe işlem ve bakiye kaydı"}
          </span>
        </div>
        {receipt.statusText && (
          <span
            style={{ backgroundColor: "#312e81", color: "#ffffff" }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider uppercase shrink-0"
          >
            {receipt.statusText}
          </span>
        )}
      </div>

      {/* Details Table / Grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
        {receipt.details.map((d, index) => (
          <div
            key={index}
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:px-4 text-xs ${
              index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
            }`}
          >
            <span className="font-bold text-slate-600 sm:w-1/3">{d.label}</span>
            <span className="font-bold text-slate-900 sm:w-2/3 sm:text-right break-words">
              {d.value}
            </span>
          </div>
        ))}
      </div>

      {/* Grand Total Highlight Box */}
      <div
        style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
        className="rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            İŞLEM TUTARI / BAKİYE
          </span>
          <span className="text-xs sm:text-sm font-bold text-indigo-200 italic mt-0.5 block">
            # {numberToTurkishWords(receipt.amount, receipt.currency)} #
          </span>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white block">
            {formatCurrency(receipt.amount, receipt.currency)}
          </span>
        </div>
      </div>

      {/* Description / Notes if any */}
      {receipt.description && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
          <span className="font-bold text-slate-900 block mb-0.5">İşlem Açıklaması:</span>
          {receipt.description}
        </div>
      )}

      {/* Signatures Zone */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center">
        <div className="space-y-12">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            TESLİM EDEN / ONAYLAYAN
          </div>
          <div className="border-t border-dashed border-slate-300 pt-1 text-[11px] text-slate-400">
            İmza & Kaşe
          </div>
        </div>
        <div className="space-y-12">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            TESLİM ALAN / CARİ FİRMA
          </div>
          <div className="border-t border-dashed border-slate-300 pt-1 text-[11px] text-slate-400">
            İmza & Kaşe
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-[10px] text-slate-400 text-center pt-2">
        Bu dekont Muavin ERP Finans Yönetim Sistemi tarafından elektronik ortamda üretilmiştir.
      </div>
    </div>
  );

  // =========================================================================
  // 4. FULL-PAGE DETAIL VIEW: RECEIPT / DEKONT GÖRÜNTÜLEME
  // =========================================================================
  if ((detailNav.mode === "receipt" || receiptData !== null) && receiptData) {
    if (isReceiptWhatsAppOpen) {
      const recipientContact = findContactInfo(undefined, receiptData.contactName);
      const recipientPhone =
        receiptData.contactPhone ||
        recipientContact?.phone ||
        recipientContact?.mobile ||
        "";

      return (
        <>
          {/* Printable Receipt DOM container for PDF generation */}
          <div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: "800px",
              zIndex: -100,
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            {renderPrintableReceiptContent(receiptData)}
          </div>
          <UniversalWhatsAppModal
            isOpen={true}
            onClose={() => setIsReceiptWhatsAppOpen(false)}
            title={`WhatsApp ile Dekont Paylaş - ${receiptData.documentNo}`}
            documentTypeLabel={receiptData.documentTitle || "Finans Dekontu / Makbuz"}
            recipientName={receiptData.contactName || receiptData.accountName || "Sayın İlgili"}
            recipientPhone={recipientPhone}
            defaultMessage={generateReceiptShareText(receiptData, companySettings)}
            documentFileName={`Dekont_${receiptData.documentNo || "Finans_Dekontu"}.pdf`}
            companySettings={companySettings}
            quickTemplates={[
              {
                id: "standard_dekont",
                label: "Standart Dekont Bildirimi",
                templateText: generateReceiptShareText(receiptData, companySettings),
              },
              {
                id: "short_notice",
                label: "Kısa Bilgilendirme",
                templateText: `Sayın Yetkili,\n\n${receiptData.documentNo} nolu ${receiptData.documentTitle} düzenlenmiştir. Tutar: ${formatCurrency(receiptData.amount, receiptData.currency)}. Dekont PDF formatında ekte bilgilerinize sunulmuştur.\n\n${companySettings?.companyName || "Muavin Finans"}`,
              },
              {
                id: "formal_receipt",
                label: "Resmi Muhasebe & Teyit",
                templateText: `Sayın ${receiptData.contactName || "Yetkili"},\n\nŞirketimiz kayıtlarında ${receiptData.date} tarihinde ${formatCurrency(receiptData.amount, receiptData.currency)} tutarındaki resmi finansal işleminiz gerçekleştirilmiştir. İlgili dekont belgesi ekte yer almaktadır.\n\nSaygılarımızla,\n${companySettings?.companyTitle || companySettings?.companyName || "Muavin Finans"}`,
              },
            ]}
            onGeneratePdf={async () => {
              const el = document.getElementById("printable-receipt");
              if (el) {
                return exportElementToPDFWithPrintStyling(
                  "printable-receipt",
                  `Dekont_${receiptData.documentNo || "Finans_Dekontu"}.pdf`,
                  { orientation: "p", margin: 8, scale: 2 }
                );
              }
              return null;
            }}
            onSuccess={() => setIsReceiptWhatsAppOpen(false)}
          />
        </>
      );
    }

    return (
      <DetailPageLayout
        title={receiptData.documentTitle}
        subtitle={`${receiptData.documentNo} • ${receiptData.date} • ${receiptData.accountName || ""}`}
        breadcrumbs={[
          { label: "Finans Yönetimi", onClick: handleBackToList },
          { label: receiptData.accountName || "Finans", onClick: handleBackToList },
          { label: `Dekont #${receiptData.documentNo}`, active: true },
        ]}
        onBack={handleBackToList}
        statusBadge={
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            TUTAR: {formatCurrency(receiptData.amount, receiptData.currency)}
          </span>
        }
        headerIcon={<FileCheck2 className="w-5 h-5 text-purple-700" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              ← Listeye Dön
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Yazdır</span>
            </button>
            <button
              type="button"
              onClick={handleExportReceiptPDF}
              disabled={isPdfGenerating}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4 text-purple-200" />
              <span>{isPdfGenerating ? "Hazırlanıyor..." : "PDF İndir"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReceiptWhatsAppOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
              title="WhatsApp İletişim & Entegrasyon Merkezi ile Paylaş"
            >
              <MessageSquare className="w-4 h-4 text-emerald-100 fill-emerald-100" />
              <span>WhatsApp ile Paylaş</span>
            </button>
          </div>
        }
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* WhatsApp İletişim & Entegrasyon Merkezi Entegrasyonu */}
          <div className="bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-slate-50 border border-emerald-300/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <MessageSquare className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>WhatsApp İletişim & Entegrasyon Merkezi</span>
                  <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    Canlı Entegrasyon
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Bu resmi finans dekontunu PDF eki ve onaylı muhasebe şablonuyla doğrudan WhatsApp üzerinden anında paylaşabilirsiniz.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsReceiptWhatsAppOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
              <span>WhatsApp ile Paylaş</span>
            </button>
          </div>

          {renderPrintableReceiptContent(receiptData)}
        </div>
      </DetailPageLayout>
    );
  }

  if (isChequeModalOpen) {
    return (
        <DetailPageLayout
          title="Yeni Finansal Çek Kaydı"
          subtitle="Müşteri çeki (tahsilat) veya firma borç çeki (ödeme) portföy girişi"
          breadcrumbs={[
            { label: "Finans Yönetimi", onClick: handleBackToList },
            { label: "Çek & Senet Portföyü", onClick: handleBackToList },
            { label: "Yeni Çek Kaydı", active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200">
              {chqType === "received" ? "Alınan Müşteri Çeki" : "Verilen Borç Çeki"}
            </span>
          }
          headerIcon={<FileCheck2 className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="add-cheque-form"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>Çek Kaydını Oluştur</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 mx-auto">
            <form id="add-cheque-form" onSubmit={handleSaveCheque} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Çek Tipi *</label>
                  <select
                    value={chqType}
                    onChange={(e) => setChqType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="received">Müşteri Çeki (Alınan)</option>
                    <option value="issued">Borç / Firma Çeki (Verilen)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Çek Numarası *</label>
                  <input
                    type="text"
                    required
                    placeholder="ör: CHK-991028"
                    value={chqNumber}
                    onChange={(e) => setChqNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Banka Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="ör: Garanti BBVA"
                    value={chqBankName}
                    onChange={(e) => setChqBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şube</label>
                  <input
                    type="text"
                    placeholder="ör: Levent Şubesi"
                    value={chqBranchName}
                    onChange={(e) => setChqBranchName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">İlişkili Cari Hesap</label>
                <select
                  value={chqContactId}
                  onChange={(e) => setChqContactId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                >
                  <option value="">-- Cari Seçin --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keşideci / Düzenleyen</label>
                <input
                  type="text"
                  placeholder="ör: Anadolu Marketler Zinciri A.Ş."
                  value={chqDrawerName}
                  onChange={(e) => setChqDrawerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keşide Tarihi</label>
                  <input
                    type="date"
                    value={chqIssueDate}
                    onChange={(e) => setChqIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vade Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={chqDueDate}
                    onChange={(e) => setChqDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Çek Tutarı *</label>
                  <input
                    type="number"
                    required
                    value={chqAmount}
                    onChange={(e) => setChqAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Para Birimi</label>
                  <select
                    value={chqCurrency}
                    onChange={(e) => setChqCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer text-xs"
                >
                  Çek Kaydını Oluştur
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* FULL-PAGE DETAIL VIEW: ADD PROMISSORY NOTE */}
      {isNoteModalOpen && (
        <DetailPageLayout
          title="Yeni Finansal Senet Kaydı"
          subtitle="Müşteri seneti (alınan) veya borç seneti (verilen) portföy kaydı"
          breadcrumbs={[
            { label: "Finans Yönetimi", onClick: handleBackToList },
            { label: "Çek & Senet Portföyü", onClick: handleBackToList },
            { label: "Yeni Senet Kaydı", active: true },
          ]}
          onBack={handleBackToList}
          statusBadge={
            <span className="px-3 py-1 text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200">
              {ntType === "received" ? "Alınan Müşteri Seneti" : "Verilen Borç Seneti"}
            </span>
          }
          headerIcon={<Stamp className="w-5 h-5 text-purple-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                form="add-note-form"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>Senet Kaydını Oluştur</span>
              </button>
            </div>
          }
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 mx-auto">
            <form id="add-note-form" onSubmit={handleSaveNote} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senet Tipi *</label>
                  <select
                    value={ntType}
                    onChange={(e) => setNtType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="received">Müşteri Seneti (Alınan)</option>
                    <option value="issued">Borç Seneti (Verilen)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senet Numarası *</label>
                  <input
                    type="text"
                    required
                    placeholder="ör: SNT-2026-088"
                    value={ntNumber}
                    onChange={(e) => setNtNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">İlişkili Cari Hesap</label>
                <select
                  value={ntContactId}
                  onChange={(e) => setNtContactId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                >
                  <option value="">-- Cari Seçin --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Borçlu / Keşideci Adı</label>
                <input
                  type="text"
                  placeholder="ör: Mavi Derinlik Yayıncılık A.Ş."
                  value={ntDebtorName}
                  onChange={(e) => setNtDebtorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Düzenleme Tarihi</label>
                  <input
                    type="date"
                    value={ntIssueDate}
                    onChange={(e) => setNtIssueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vade Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={ntDueDate}
                    onChange={(e) => setNtDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senet Tutarı *</label>
                  <input
                    type="number"
                    required
                    value={ntAmount}
                    onChange={(e) => setNtAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Para Birimi</label>
                  <select
                    value={ntCurrency}
                    onChange={(e) => setNtCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl cursor-pointer text-xs"
                >
                  Senet Kaydını Oluştur
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* NEW TRANSACTION MODAL (Kasa / Banka) */}
      {isAddTxModalOpen && (
        <DetailPageLayout
          title={addTxContext === "kasa" ? "Yeni Kasa Hareketi Ekle" : "Yeni Banka Hareketi Ekle"}
          subtitle={addTxContext === "kasa" ? "Nakit Giriş / Çıkış Fişi Kaydı" : "Banka Havale / EFT / Gelen & Giden Transfer Kaydı"}
          breadcrumbs={[
            { label: "Kasa & Banka", onClick: () => setIsAddTxModalOpen(false) },
            { label: addTxContext === "kasa" ? "Yeni Kasa Hareketi" : "Yeni Banka Hareketi", active: true },
          ]}
          onBack={() => setIsAddTxModalOpen(false)}
          statusBadge={
            <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${addTxContext === "kasa" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-800 border-blue-200"}`}>
              {addTxContext === "kasa" ? "KASA FİŞİ" : "BANKA FİŞİ"}
            </span>
          }
          headerIcon={addTxContext === "kasa" ? <Banknote className="w-5 h-5 text-amber-600" /> : <Building className="w-5 h-5 text-blue-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddTxModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">

            <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
              {/* İşlem Tipi */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    txType === "income"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {addTxContext === "kasa" ? "Tahsilat / Kasa Gelir (+)" : "Gelen Transfer / Tahsilat (+)"}
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    txType === "expense"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {addTxContext === "kasa" ? "Ödeme / Kasa Gider (-)" : "Gönderilen Transfer / Ödeme (-)"}
                </button>
              </div>

              {/* Hesap Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {addTxContext === "kasa" ? "Kasa Hesabı *" : "Banka Hesabı *"}
                </label>
                <select
                  value={txAccountId}
                  onChange={(e) => setTxAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  required
                >
                  {accounts
                    .filter((a) =>
                      addTxContext === "kasa"
                        ? a.type === "cash"
                        : a.type === "bank" || a.type === "credit_card"
                    )
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - Bakiye: ₺
                        {acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                </select>
              </div>

              {/* Cari Hesap Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cari Hesap (Müşteri veya Tedarikçi)
                </label>
                <select
                  value={txContactId}
                  onChange={(e) => setTxContactId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                >
                  <option value="">-- Cari Hesap Seçilmedi (Doğrudan Hareket) --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === "customer" ? "Müşteri" : "Tedarikçi"}) - Bakiye: ₺
                      {c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Evrak / Makbuz / Dekont No */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {addTxContext === "kasa" ? "Evrak / Makbuz Numarası" : "Dekont Numarası"}
                </label>
                <input
                  type="text"
                  value={txDocumentNo}
                  onChange={(e) => setTxDocumentNo(e.target.value)}
                  placeholder={
                    addTxContext === "kasa"
                      ? "Örn: MKB-2026-001 veya EVR-102"
                      : "Örn: DKN-8839201"
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold"
                />
              </div>

              {/* Tutar ve Tarih */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">İşlem Tutarı (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txAmount}
                    onChange={(e) =>
                      setTxAmount(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-extrabold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">İşlem Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Kategori ve Açıklama */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    placeholder="Örn: Tahsilat, Ödeme, Masraf"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="İşlem açıklaması girin..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddTxModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-bold text-white rounded-xl cursor-pointer ${
                    addTxContext === "kasa"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {addTxContext === "kasa" ? "Kasa Hareketini Kaydet" : "Banka Hareketini Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* ENDORSEMENT (CİRO / CİRANTA) DETAIL VIEW */}
      {isEndorseModalOpen && (
        <DetailPageLayout
          title="Portföydeki Çek / Seneti Ciro Et (Ciranta Yap)"
          subtitle="Portföydeki kıymetli evrakı üçüncü bir cariye devredin ve ciro bordrosunu oluşturun"
          breadcrumbs={[
            { label: "Kasa & Banka", onClick: () => setIsEndorseModalOpen(false) },
            { label: "Çek / Senet Ciro Et", active: true },
          ]}
          onBack={() => setIsEndorseModalOpen(false)}
          statusBadge={
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-xl">
              CİRO İŞLEMİ (CİRANTA)
            </span>
          }
          headerIcon={<ArrowRightLeft className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEndorseModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">

            <form onSubmit={handleSaveEndorsement} className="space-y-4 text-xs">
              {/* Belge Tipi Seçimi (Çek / Senet) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setEndorseDocType("cheque");
                    const firstPortCheque = cheques.find((c) => c.status === "portfolio");
                    setEndorseSelectedDocId(firstPortCheque ? firstPortCheque.id : "");
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    endorseDocType === "cheque"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Portföy Çekleri ({cheques.filter((c) => c.status === "portfolio").length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEndorseDocType("note");
                    const firstPortNote = promissoryNotes.find((n) => n.status === "portfolio");
                    setEndorseSelectedDocId(firstPortNote ? firstPortNote.id : "");
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    endorseDocType === "note"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Portföy Senetleri ({promissoryNotes.filter((n) => n.status === "portfolio").length})</span>
                </button>
              </div>

              {/* Portföydeki Evrak Seçimi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ciro Edilecek {endorseDocType === "cheque" ? "Çek" : "Senet"} Seçin (Portföydekiler) *
                </label>

                {endorseDocType === "cheque" ? (
                  cheques.filter((c) => c.status === "portfolio").length > 0 ? (
                    <select
                      value={endorseSelectedDocId}
                      onChange={(e) => setEndorseSelectedDocId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                      required
                    >
                      <option value="">-- Portföydeki Çeki Seçin --</option>
                      {cheques
                        .filter((c) => c.status === "portfolio")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            [{c.chequeNumber}] {c.bankName} - Keşideci: {c.contactName} - Vade: {c.dueDate} - ₺
                            {c.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Portföyünüzde henüz ciro edilebilir (aktif) müşteri çeki bulunmuyor.</span>
                    </div>
                  )
                ) : (
                  promissoryNotes.filter((n) => n.status === "portfolio").length > 0 ? (
                    <select
                      value={endorseSelectedDocId}
                      onChange={(e) => setEndorseSelectedDocId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                      required
                    >
                      <option value="">-- Portföydeki Seneti Seçin --</option>
                      {promissoryNotes
                        .filter((n) => n.status === "portfolio")
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            [{n.noteNumber}] Borçlu: {n.debtorName} ({n.contactName}) - Vade: {n.dueDate} - ₺
                            {n.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Portföyünüzde henüz ciro edilebilir (aktif) müşteri seneti bulunmuyor.</span>
                    </div>
                  )
                )}
              </div>

              {/* Seçilen Evrak Detay Kartı */}
              {endorseSelectedDocId && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
                  {endorseDocType === "cheque" ? (() => {
                    const doc = cheques.find((c) => c.id === endorseSelectedDocId);
                    if (!doc) return null;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-400">Çek No:</span> <strong className="text-slate-900 font-mono">{doc.chequeNumber}</strong></div>
                        <div><span className="text-slate-400">Banka:</span> <strong className="text-slate-900">{doc.bankName}</strong></div>
                        <div><span className="text-slate-400">Keşideci / Cari:</span> <strong className="text-slate-900">{doc.contactName}</strong></div>
                        <div><span className="text-slate-400">Vade Tarihi:</span> <strong className="text-slate-900 font-mono">{doc.dueDate}</strong></div>
                        <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Çek Tutarı:</span>
                          <span className="text-base font-black font-mono text-indigo-700">₺{doc.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  })() : (() => {
                    const doc = promissoryNotes.find((n) => n.id === endorseSelectedDocId);
                    if (!doc) return null;
                    return (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-400">Senet No:</span> <strong className="text-slate-900 font-mono">{doc.noteNumber}</strong></div>
                        <div><span className="text-slate-400">Borçlu:</span> <strong className="text-slate-900">{doc.debtorName}</strong></div>
                        <div><span className="text-slate-400">Cari Hesap:</span> <strong className="text-slate-900">{doc.contactName}</strong></div>
                        <div><span className="text-slate-400">Vade Tarihi:</span> <strong className="text-slate-900 font-mono">{doc.dueDate}</strong></div>
                        <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between items-center">
                          <span className="text-slate-500 font-bold">Senet Tutarı:</span>
                          <span className="text-base font-black font-mono text-purple-700">₺{doc.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Ciranta Edilecek Cari Hesap (Hedef Cari) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ciranta Edilecek Cari (Devredilecek Müşteri / Tedarikçi) *
                </label>
                <select
                  value={endorseContactId}
                  onChange={(e) => setEndorseContactId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  required
                >
                  <option value="">-- Ciro Edilecek Cariyı Seçin --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === "customer" ? "Müşteri" : "Tedarikçi"}) - Bakiye: ₺
                      {c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ciro Tarihi & Not */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciro Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={endorseDate}
                    onChange={(e) => setEndorseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciro Notu / Açıklama</label>
                  <input
                    type="text"
                    value={endorseNote}
                    onChange={(e) => setEndorseNote(e.target.value)}
                    placeholder="Örn: Fatura borcuna mahsuben"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEndorseModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!endorseSelectedDocId || !endorseContactId}
                  className={`px-5 py-2 font-bold text-white rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    endorseDocType === "cheque"
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  Ciro İşlemini Onayla (Ciranta Et)
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* FULL-PAGE DETAIL VIEW: EDIT ACCOUNT (KASA / BANKA DÜZENLE) */}
      {isEditAccountModalOpen && editingAccount && (
        <DetailPageLayout
          title="Finans Hesabını Düzenle"
          subtitle={`${editingAccount.name} (${editingAccount.type === "bank" ? "Banka Hesabı" : "Nakit Kasa"})`}
          breadcrumbs={[
            { label: "Kasa & Banka", onClick: () => setIsEditAccountModalOpen(false) },
            { label: "Hesap Düzenle", active: true },
          ]}
          onBack={() => setIsEditAccountModalOpen(false)}
          statusBadge={
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-xl">
              HESAP DÜZENLEME
            </span>
          }
          headerIcon={<Pencil className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditAccountModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateAccount && editingAccount) {
                  onUpdateAccount(editingAccount);
                }
                setIsEditAccountModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hesap / Kasa Adı *</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hesap Türü</label>
                  <select
                    value={editingAccount.type}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        type: e.target.value as "cash" | "bank" | "credit_card" | "pos",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="cash">Nakit Kasa</option>
                    <option value="bank">Banka Vadesiz Hesabı</option>
                    <option value="credit_card">Kredi Kartı Hesabı</option>
                    <option value="pos">POS Hesabı</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Para Birimi</label>
                  <select
                    value={editingAccount.currency || "TRY"}
                    onChange={(e) => setEditingAccount({ ...editingAccount, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {editingAccount.type !== "cash" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Banka Adı</label>
                      <input
                        type="text"
                        value={editingAccount.bankName || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                        placeholder="Örn: Garanti BBVA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Şube Adı / Kodu</label>
                      <input
                        type="text"
                        value={editingAccount.branchName || ""}
                        onChange={(e) => setEditingAccount({ ...editingAccount, branchName: e.target.value })}
                        placeholder="Örn: Kadıköy Şubesi (123)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">IBAN Numarası</label>
                    <input
                      type="text"
                      value={editingAccount.iban || ""}
                      onChange={(e) => setEditingAccount({ ...editingAccount, iban: e.target.value })}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hesap Bakiyesi (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingAccount.balance}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditAccountModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* FULL-PAGE DETAIL VIEW: EDIT TRANSACTION (HAREKET DÜZENLE) */}
      {isEditTxModalOpen && editingTransaction && (
        <DetailPageLayout
          title="Finans Hareketini / Fişi Düzenle"
          subtitle={`${editingTransaction.title || "Fiş"} • Tarih: ${editingTransaction.date} • Tutar: ${formatCurrency(editingTransaction.amount, editingTransaction.currency)}`}
          breadcrumbs={[
            { label: "Kasa & Banka", onClick: () => setIsEditTxModalOpen(false) },
            { label: "Fiş / Hareket Düzenle", active: true },
          ]}
          onBack={() => setIsEditTxModalOpen(false)}
          statusBadge={
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-xl">
              FİNANS HAREKETİ
            </span>
          }
          headerIcon={<Pencil className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditTxModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateTransaction && editingTransaction) {
                  onUpdateTransaction(editingTransaction);
                }
                setIsEditTxModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    required
                    value={editingTransaction.date}
                    onChange={(e) =>
                      setEditingTransaction({ ...editingTransaction, date: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evrak / Makbuz / Dekont No</label>
                  <input
                    type="text"
                    value={editingTransaction.documentNo || ""}
                    onChange={(e) =>
                      setEditingTransaction({ ...editingTransaction, documentNo: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">İşlem Türü</label>
                  <select
                    value={editingTransaction.type}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="income">Tahsilat / Giriş (+)</option>
                    <option value="expense">Ödeme / Çıkış (-)</option>
                    <option value="collection">Cari Tahsilatı (+)</option>
                    <option value="payment">Cari Ödemesi (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingTransaction.amount}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Not</label>
                <input
                  type="text"
                  value={editingTransaction.description || ""}
                  onChange={(e) =>
                    setEditingTransaction({ ...editingTransaction, description: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditTxModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* FULL-PAGE DETAIL VIEW: EDIT CHEQUE (ÇEK DÜZENLE) */}
      {isEditChequeModalOpen && editingCheque && (
        <DetailPageLayout
          title="Çek Kaydını Düzenle"
          subtitle={`Çek No: ${editingCheque.chequeNumber} • Vade: ${editingCheque.dueDate} • Tutar: ${formatCurrency(editingCheque.amount, editingCheque.currency)}`}
          breadcrumbs={[
            { label: "Kasa & Banka", onClick: () => setIsEditChequeModalOpen(false) },
            { label: "Çek Düzenle", active: true },
          ]}
          onBack={() => setIsEditChequeModalOpen(false)}
          statusBadge={
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-xl">
              ÇEK BİLGİLERİ
            </span>
          }
          headerIcon={<Pencil className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditChequeModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateCheque && editingCheque) {
                  onUpdateCheque(editingCheque);
                }
                setIsEditChequeModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Çek No *</label>
                  <input
                    type="text"
                    required
                    value={editingCheque.chequeNumber}
                    onChange={(e) =>
                      setEditingCheque({ ...editingCheque, chequeNumber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Çek Türü</label>
                  <select
                    value={editingCheque.type}
                    onChange={(e) =>
                      setEditingCheque({
                        ...editingCheque,
                        type: e.target.value as "received" | "issued",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="received">Alınan Müşteri Çeki</option>
                    <option value="issued">Verilen Borç / Firma Çeki</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Banka Adı</label>
                  <input
                    type="text"
                    value={editingCheque.bankName}
                    onChange={(e) =>
                      setEditingCheque({ ...editingCheque, bankName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şube Adı</label>
                  <input
                    type="text"
                    value={editingCheque.branchName || ""}
                    onChange={(e) =>
                      setEditingCheque({ ...editingCheque, branchName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vade Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={editingCheque.dueDate}
                    onChange={(e) =>
                      setEditingCheque({ ...editingCheque, dueDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingCheque.amount}
                    onChange={(e) =>
                      setEditingCheque({ ...editingCheque, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditChequeModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* FULL-PAGE DETAIL VIEW: EDIT NOTE (SENET DÜZENLE) */}
      {isEditNoteModalOpen && editingNote && (
        <DetailPageLayout
          title="Senet Kaydını Düzenle"
          subtitle={`Senet No: ${editingNote.noteNumber} • Vade: ${editingNote.dueDate} • Tutar: ${formatCurrency(editingNote.amount, editingNote.currency)}`}
          breadcrumbs={[
            { label: "Kasa & Banka", onClick: () => setIsEditNoteModalOpen(false) },
            { label: "Senet Düzenle", active: true },
          ]}
          onBack={() => setIsEditNoteModalOpen(false)}
          statusBadge={
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-xl">
              SENET BİLGİLERİ
            </span>
          }
          headerIcon={<Pencil className="w-5 h-5 text-indigo-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditNoteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl mx-auto p-6 shadow-sm space-y-4">

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdatePromissoryNote && editingNote) {
                  onUpdatePromissoryNote(editingNote);
                }
                setIsEditNoteModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senet No *</label>
                  <input
                    type="text"
                    required
                    value={editingNote.noteNumber}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, noteNumber: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Senet Türü</label>
                  <select
                    value={editingNote.type}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        type: e.target.value as "received" | "issued",
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="received">Alınan Müşteri Senedi</option>
                    <option value="issued">Verilen Borç Senedi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Borçlu / Keşideci Adı</label>
                  <input
                    type="text"
                    value={editingNote.debtorName || ""}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, debtorName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keşide / Düzenleme Tarihi</label>
                  <input
                    type="date"
                    value={editingNote.issueDate || ""}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, issueDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vade Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={editingNote.dueDate}
                    onChange={(e) => setEditingNote({ ...editingNote, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingNote.amount}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditNoteModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 cursor-pointer rounded-xl font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </DetailPageLayout>
    );
  }

      {/* MODAL: BANK STATEMENT IMPORT */}
      <BankStatementImportModal
        isOpen={isBankStatementModalOpen}
        onClose={() => setIsBankStatementModalOpen(false)}
        accounts={accounts}
        contacts={contacts}
        transactions={transactions}
        selectedBankAccountId={selectedBankAccountId}
        onAddTransaction={onAddTransaction}
      />

      {/* FULL-PAGE DETAIL VIEW: UNIVERSAL FINANCE & TRANSACTION SHARE */}
      {shareConfig.isOpen && (
        <DetailPageLayout
          title={shareConfig.title || "WhatsApp ile Paylaş"}
          subtitle={shareConfig.subtitle || "Finans hesabı veya hareket bilgisi iletimi"}
          breadcrumbs={[
            { label: "Kasa & Banka", onClick: () => setShareConfig((prev) => ({ ...prev, isOpen: false })) },
            { label: "WhatsApp Paylaşımı", active: true },
          ]}
          onBack={() => setShareConfig((prev) => ({ ...prev, isOpen: false }))}
          statusBadge={
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-xl uppercase">
              WHATSAPP ENTEGRASYONU
            </span>
          }
          headerIcon={<MessageSquare className="w-5 h-5 text-emerald-600" />}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShareConfig((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSendDirectWhatsApp}
                disabled={isSendingWa}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingWa
                    ? "İletiliyor..."
                    : shareWaMode === "direct"
                    ? "WhatsApp ile Gönder"
                    : "WhatsApp Web'de Aç"}
                </span>
              </button>
            </div>
          }
        >
          <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl w-full mx-auto p-4 sm:p-6 shadow-sm space-y-4">

            {/* Inputs & Modes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Telefon Numarası
                </label>
                <input
                  type="text"
                  value={shareConfig.recipientPhone}
                  onChange={(e) =>
                    setShareConfig((prev) => ({ ...prev, recipientPhone: e.target.value }))
                  }
                  placeholder="Örn: 0532 123 45 67 veya 905321234567"
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gönderim Kanalı
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShareWaMode("direct")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      shareWaMode === "direct"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-800">⚡ WhatsApp API</span>
                      {waConnectionStatus?.status === "connected" ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          Bağlı
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold">
                          QR Gerekli
                        </span>
                      )}
                    </div>
                    <span className="block text-[10px] font-normal text-slate-500 mt-1">
                      Doğrudan mesaj iletir
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareWaMode("web")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      shareWaMode === "web"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    🌐 WhatsApp Web
                    <span className="block text-[10px] font-normal text-slate-500 mt-1">
                      Web sohbet penceresini aç
                    </span>
                  </button>
                </div>
              </div>

              {/* Message Payload Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  İleti Metni
                </label>
                <textarea
                  rows={5}
                  value={shareConfig.textPayload}
                  onChange={(e) =>
                    setShareConfig((prev) => ({ ...prev, textPayload: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShareConfig((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSendDirectWhatsApp}
                disabled={isSendingWa}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingWa
                    ? "İletiliyor..."
                    : shareWaMode === "direct"
                    ? "🟢 WhatsApp ile Doğrudan Gönder"
                    : "WhatsApp Web'de Aç"}
                </span>
              </button>
            </div>
          </div>
        </DetailPageLayout>
    );
  }



  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* MODULE HEADER & TOP SUMMARY (Lila Bal Peteği & Geometrik Desen) */}
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

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-100/90 border border-purple-200/90 flex items-center justify-center text-purple-700 shadow-2xs backdrop-blur-2xs font-bold shrink-0">
                <Landmark className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  Finans Yönetimi
                </h2>
                <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
                  Nakit Kasa, Banka Hesapları, Çek, Senet ve Hesaplar Arası Virman Yönetimi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setIsTransferModalOpen(true);
                detailNav.openTransfer();
              }}
              className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4 text-purple-800 font-bold" />
              <span>Hızlı Virman</span>
            </button>

            {activeSubModule === "cek" && (
              <button
                onClick={() => {
                  setChqNumber(`CHK-${Math.floor(100000 + Math.random() * 900000)}`);
                  setIsChequeModalOpen(true);
                }}
                className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-4 h-4 text-purple-800 font-bold" />
                <span>Yeni Çek Girişi</span>
              </button>
            )}

            {activeSubModule === "senet" && (
              <button
                onClick={() => {
                  setNtNumber(`SNT-2026-${Math.floor(100 + Math.random() * 900)}`);
                  setIsNoteModalOpen(true);
                }}
                className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-4 h-4 text-purple-800 font-bold" />
                <span>Yeni Senet Girişi</span>
              </button>
            )}

            {activeSubModule === "banka" && (
              <button
                onClick={() => setIsBankStatementModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-100" />
                <span>Banka Ekstresi Yükle</span>
              </button>
            )}

            {(activeSubModule === "kasa" || activeSubModule === "banka") && (
              <button
                onClick={() => {
                  setAccType(activeSubModule === "kasa" ? "cash" : "bank");
                  setIsAccountModalOpen(true);
                  detailNav.openCreate();
                }}
                className="bg-purple-700/15 hover:bg-purple-700/25 text-purple-950 border border-purple-400/50 backdrop-blur-md font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-4 h-4 text-purple-800 font-bold" />
                <span>
                  {activeSubModule === "kasa" ? "Yeni Kasa Ekle" : "Yeni Banka Hesabı"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 relative z-10">
          {/* Nakit Kasalar */}
          <button
            onClick={() => {
              setActiveSubModule("kasa");
              setSelectedCashAccountId(null);
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              activeSubModule === "kasa"
                ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-100/80 border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                : "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/70 border-amber-300/70 hover:border-amber-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <span>Nakit Kasalar</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Banknote className="w-5 h-5 text-amber-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                ₺{totalCashBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-semibold text-amber-900/80 mt-1 flex items-center gap-1">
                <span className="text-amber-950 font-bold bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300/80">
                  {accounts.filter((a) => a.type === "cash").length} Kasa
                </span>{" "}
                aktif
              </p>
            </div>
          </button>

          {/* Banka Bakiyeleri */}
          <button
            onClick={() => {
              setActiveSubModule("banka");
              setSelectedBankAccountId(null);
            }}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              activeSubModule === "banka"
                ? "bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-100/80 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                : "bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 border-blue-300/70 hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                <span>Banka Bakiyeleri</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Building className="w-5 h-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                ₺{totalBankBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-semibold text-blue-900/80 mt-1 flex items-center gap-1">
                <span className="text-blue-950 font-bold bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300/80">
                  {accounts.filter((a) => a.type === "bank" || a.type === "credit_card").length} Banka
                </span>{" "}
                hesabı
              </p>
            </div>
          </button>

          {/* Portföydeki Çekler */}
          <button
            onClick={() => setActiveSubModule("cek")}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              activeSubModule === "cek"
                ? "bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-indigo-100/80 border-2 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md"
                : "bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-indigo-50/70 border-indigo-300/70 hover:border-indigo-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                <span>Portföydeki Çekler</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <FileCheck2 className="w-5 h-5 text-indigo-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-indigo-950 font-mono tracking-tight">
                ₺{portfolioChequesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-semibold text-indigo-900/80 mt-1 flex items-center gap-1">
                <span className="text-indigo-950 font-bold bg-indigo-200/80 px-1.5 py-0.5 rounded border border-indigo-300/80">
                  {cheques.filter((c) => c.status === "portfolio").length} Çek
                </span>{" "}
                portföyde
              </p>
            </div>
          </button>

          {/* Portföydeki Senetler */}
          <button
            onClick={() => setActiveSubModule("senet")}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              activeSubModule === "senet"
                ? "bg-gradient-to-br from-fuchsia-500/20 via-pink-500/10 to-fuchsia-100/80 border-2 border-fuchsia-500 ring-2 ring-fuchsia-500/30 shadow-md"
                : "bg-gradient-to-br from-fuchsia-500/10 via-pink-500/5 to-fuchsia-50/70 border-fuchsia-300/70 hover:border-fuchsia-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-fuchsia-950 tracking-wider flex items-center gap-1.5">
                <span>Portföydeki Senetler</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <Stamp className="w-5 h-5 text-fuchsia-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-fuchsia-950 font-mono tracking-tight">
                ₺{portfolioNotesTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs font-semibold text-fuchsia-900/80 mt-1 flex items-center gap-1">
                <span className="text-fuchsia-950 font-bold bg-fuchsia-200/80 px-1.5 py-0.5 rounded border border-fuchsia-300/80">
                  {promissoryNotes.filter((n) => n.status === "portfolio").length} Senet
                </span>{" "}
                portföyde
              </p>
            </div>
          </button>

          {/* Hesaplar Arası Virman */}
          <button
            onClick={() => setActiveSubModule("virman")}
            className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all cursor-pointer backdrop-blur-md border ${
              activeSubModule === "virman"
                ? "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-100/80 border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                : "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-50/70 border-emerald-300/70 hover:border-emerald-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                <span>Hesaplar Arası Virman</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                <ArrowRightLeft className="w-5 h-5 text-emerald-700" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
                {virmanTransactions.length} Kayıt
              </div>
              <p className="text-xs font-semibold text-emerald-900/80 mt-1 flex items-center gap-1">
                <span className="text-emerald-950 font-bold bg-emerald-200/80 px-1.5 py-0.5 rounded border border-emerald-300/80">
                  Transfer
                </span>{" "}
                hareketleri
              </p>
            </div>
          </button>
        </div>


      </div>

      {/* SUB-MODULE 1: KASA */}
      {activeSubModule === "kasa" && (
        <div className="space-y-6 animate-fadeIn">
          {renderDateFilterBar("Kasa İşlemleri")}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts
              .filter((a) => a.type === "cash")
              .map((acc) => {
                const isSelected = selectedCashAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() =>
                      setSelectedCashAccountId((prev) => (prev === acc.id ? null : acc.id))
                    }
                    className={`group relative overflow-hidden rounded-2xl p-5 border transition-all cursor-pointer space-y-3 backdrop-blur-md ${
                      isSelected
                        ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-100/80 border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                        : "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/70 border-amber-300/70 hover:border-amber-400 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                        <Wallet className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            Seçili Kasa
                          </span>
                        )}
                        <span className="text-xs font-bold font-mono bg-amber-200/80 border border-amber-300/80 px-2 py-0.5 rounded text-amber-950">
                          {acc.currency}
                        </span>
                        <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleShowAccountReceipt(acc)}
                            className="px-2 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Dekont / Ekstre Göster (Yazdır / PDF)"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                            <span>Ekstre</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleShowAccountReceipt(acc);
                              setIsReceiptWhatsAppOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Ekstre / Dekontu WhatsApp ile Paylaş"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-850 shrink-0" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccount(acc);
                              setIsEditAccountModalOpen(true);
                              detailNav.openEdit(acc, acc.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Hesabı Düzenle"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                            <span>Düzenle</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-amber-950">{acc.name}</h3>
                      <p className="text-[11px] font-semibold text-amber-900/80 mt-0.5">
                        Nakit Kasa / Tıklayarak Hareketleri Süz
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-200/80 flex items-baseline justify-between">
                      <span className="text-[10px] uppercase font-extrabold text-amber-900/90 tracking-wider">
                        Kasa Bakiyesi:
                      </span>
                      <span className="text-lg font-black text-amber-950 font-mono">
                        ₺{acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-600" />
                <span>Nakit Kasa Gelir ve Gider Hareketleri</span>
                {selectedCashAccountId && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Seçili: {accounts.find((a) => a.id === selectedCashAccountId)?.name}
                  </span>
                )}
              </h3>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {selectedCashAccountId && (
                  <button
                    onClick={() => setSelectedCashAccountId(null)}
                    className="text-xs text-amber-700 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                  >
                    Tüm Kasaları Göster
                  </button>
                )}
                <button
                  onClick={() => handleOpenAddTxModal("kasa")}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kasa Hareketi Ekle</span>
                </button>
                <ExportButtons
                  getExportData={() => ({
                    filename: `Kasa_Hareketleri_${new Date().toISOString().split("T")[0]}`,
                    title: "NAKİT KASA HAREKETLERİ LİSTESİ",
                    subtitle: selectedCashAccountId ? `Seçili Kasa: ${accounts.find(a => a.id === selectedCashAccountId)?.name}` : "Tüm Kasalar Genel Toplamı",
                    headers: ["Tarih", "Makbuz No", "Kasa Adı", "İşlem Türü / Cari", "Açıklama", "Tutar", "Para Birimi"],
                    rows: kasaTransactions.map((tx) => [
                      tx.date,
                      tx.documentNo || "-",
                      tx.accountName || "-",
                      `${tx.type === "income" || tx.type === "collection" ? "Tahsilat / Gelir" : "Ödeme / Gider"} (${tx.contactName || tx.category || "-"})`,
                      tx.description || "-",
                      formatCurrency(tx.amount || 0, tx.currency || "TRY"),
                      tx.currency || "TRY",
                    ]),
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
                    <th className="pb-2 px-3">Evrak / Makbuz No</th>
                    <th className="pb-2 px-3">Kasa</th>
                    <th className="pb-2 px-3">İşlem / Cari</th>
                    <th className="pb-2 px-3">Açıklama</th>
                    <th className="pb-2 px-3 text-right">Tutar</th>
                    <th className="pb-2 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {kasaTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                        Kasa hareketi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    displayedKasaTransactions.map((tx) => {
                      const isIncome = tx.type === "income" || tx.type === "collection";
                      return (
                        <tr
                          key={tx.id}
                          className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                        >
                          <td className="py-2.5 px-3 font-medium text-slate-500 group-hover:text-purple-900 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.documentNo ? (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                                {tx.documentNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.accountName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 group-hover:text-purple-900 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.contactName || tx.category}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 group-hover:text-purple-800/80 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.description}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-black border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all ${
                              isIncome ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isIncome ? "+" : "-"}₺
                            {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                              <button
                                type="button"
                                onClick={() => handleShowTransactionReceipt(tx)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="Dekont Göster (Yazdır / PDF)"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>Dekont</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleShowTransactionReceipt(tx);
                                  setIsReceiptWhatsAppOpen(true);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="Dekontu WhatsApp ile Paylaş"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>WhatsApp</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTransaction(tx);
                                  setIsEditTxModalOpen(true);
                                }}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="İşlemi Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                <span>Düzenle</span>
                              </button>
                              {onDeleteTransaction && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteTransaction(tx.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Sil</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {kasaTransactions.length > kasaDisplayLimit && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setKasaDisplayLimit((prev) => prev + 100)}
                  className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  Daha Fazla Göster ({kasaDisplayLimit} / {kasaTransactions.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-MODULE 2: BANKA */}
      {activeSubModule === "banka" && (
        <div className="space-y-6 animate-fadeIn">
          {renderDateFilterBar("Banka İşlemleri")}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts
              .filter((a) => a.type === "bank" || a.type === "credit_card")
              .map((acc) => {
                const isSelected = selectedBankAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() =>
                      setSelectedBankAccountId((prev) => (prev === acc.id ? null : acc.id))
                    }
                    className={`group relative overflow-hidden rounded-2xl p-5 border transition-all cursor-pointer space-y-3 backdrop-blur-md ${
                      isSelected
                        ? "bg-gradient-to-br from-blue-500/20 via-sky-500/10 to-blue-100/80 border-2 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                        : "bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-blue-50/70 border-blue-300/70 hover:border-blue-400 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform font-bold">
                        <Building className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                            Seçili Banka
                          </span>
                        )}
                        <span className="text-xs font-bold font-mono bg-blue-200/80 border border-blue-300/80 px-2 py-0.5 rounded text-blue-950">
                          {acc.currency}
                        </span>
                        <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleShowAccountReceipt(acc)}
                            className="px-2 py-1 rounded-lg bg-blue-200/80 hover:bg-blue-300 text-blue-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Dekont / Ekstre Göster (Yazdır / PDF)"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                            <span>Ekstre</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleShowAccountReceipt(acc);
                              setIsReceiptWhatsAppOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Ekstre / Dekontu WhatsApp ile Paylaş"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-850 shrink-0" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccount(acc);
                              setIsEditAccountModalOpen(true);
                              detailNav.openEdit(acc, acc.id);
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-200/80 hover:bg-blue-300 text-blue-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Hesabı Düzenle"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                            <span>Düzenle</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-blue-950">{acc.name}</h3>
                      {acc.bankName && (
                        <p className="text-[11px] font-semibold text-blue-900/80 truncate">{acc.bankName}</p>
                      )}
                      {acc.iban && (
                        <p className="text-[10px] font-mono text-blue-900/70 mt-1 truncate">
                          {acc.iban}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-blue-200/80 flex items-baseline justify-between">
                      <span className="text-[10px] uppercase font-extrabold text-blue-900/90 tracking-wider">
                        Banka Bakiyesi:
                      </span>
                      <span className="text-lg font-black text-blue-950 font-mono">
                        {acc.currency === "TRY" ? "₺" : "$"}
                        {acc.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Banka Hesabı Havale / EFT / POS Hareketleri</span>
                {selectedBankAccountId && (
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Seçili: {accounts.find((a) => a.id === selectedBankAccountId)?.name}
                  </span>
                )}
              </h3>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {selectedBankAccountId && (
                  <button
                    onClick={() => setSelectedBankAccountId(null)}
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                  >
                    Tüm Bankaları Göster
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsBankStatementModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="CSV veya Excel banka ekstresini yükleyip cari eşleştirin"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                  <span>Banka Ekstresi Yükle</span>
                </button>

                <button
                  onClick={() => handleOpenAddTxModal("banka")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Banka Hareketi Ekle</span>
                </button>
                <ExportButtons
                  getExportData={() => ({
                    filename: `Banka_Hareketleri_${new Date().toISOString().split("T")[0]}`,
                    title: "BANKA HESABI HAVALE / EFT / POS HAREKETLERİ",
                    subtitle: selectedBankAccountId ? `Seçili Banka: ${accounts.find(a => a.id === selectedBankAccountId)?.name}` : "Tüm Bankalar Genel Toplamı",
                    headers: ["Tarih", "Dekont No", "Banka Hesabı", "İşlem Türü / Cari", "Açıklama", "Tutar", "Para Birimi"],
                    rows: bankTransactions.map((tx) => [
                      tx.date,
                      tx.documentNo || "-",
                      tx.accountName || "-",
                      `${tx.type === "income" || tx.type === "collection" ? "Gelen Transfer / Gelir" : "Giden Transfer / Gider"} (${tx.contactName || tx.category || "-"})`,
                      tx.description || "-",
                      formatCurrency(tx.amount || 0, tx.currency || "TRY"),
                      tx.currency || "TRY",
                    ]),
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
                    <th className="pb-2 px-3">Dekont No</th>
                    <th className="pb-2 px-3">Banka Hesabı</th>
                    <th className="pb-2 px-3">İşlem / Cari</th>
                    <th className="pb-2 px-3">Açıklama</th>
                    <th className="pb-2 px-3 text-right">Tutar</th>
                    <th className="pb-2 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {bankTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80 font-medium">
                        Seçilen tarih aralığında veya bu banka hesabına ait işlem hareketi bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    displayedBankTransactions.map((tx) => {
                      const isIncome = tx.type === "income" || tx.type === "collection";
                      return (
                        <tr
                          key={tx.id}
                          className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                        >
                          <td className="py-2.5 px-3 font-medium text-slate-500 group-hover:text-purple-900 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.documentNo ? (
                              <span className="bg-blue-50 text-blue-800 border border-blue-200/80 px-2 py-0.5 rounded text-[11px]">
                                {tx.documentNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.accountName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 group-hover:text-purple-900 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.contactName || tx.category}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 group-hover:text-purple-800/80 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            {tx.description}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-black border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all ${
                              isIncome ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isIncome ? "+" : "-"}₺
                            {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                              <button
                                type="button"
                                onClick={() => handleShowTransactionReceipt(tx)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="Dekont Göster (Yazdır / PDF)"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>Dekont</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleShowTransactionReceipt(tx);
                                  setIsReceiptWhatsAppOpen(true);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="Dekontu WhatsApp ile Paylaş"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>WhatsApp</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTransaction(tx);
                                  setIsEditTxModalOpen(true);
                                }}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="İşlemi Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                <span>Düzenle</span>
                              </button>
                              {onDeleteTransaction && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteTransaction(tx.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Sil</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {bankTransactions.length > bankDisplayLimit && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setBankDisplayLimit((prev) => prev + 100)}
                  className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  Daha Fazla Göster ({bankDisplayLimit} / {bankTransactions.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-MODULE 3: ÇEK */}
      {activeSubModule === "cek" && (
        <div className="space-y-6 animate-fadeIn">
          {renderDateFilterBar("Çek Portföyü")}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600">Filtrele:</span>
              <button
                onClick={() => setChequeFilterType("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  chequeFilterType === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Tümü ({cheques.length})
              </button>
              <button
                onClick={() => setChequeFilterType("received")}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  chequeFilterType === "received"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Müşteri Çekleri ({cheques.filter((c) => c.type === "received").length})
              </button>
              <button
                onClick={() => setChequeFilterType("issued")}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  chequeFilterType === "issued"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Firma / Borç Çekleri ({cheques.filter((c) => c.type === "issued").length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Çek no, banka veya cari ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => handleOpenEndorseModal("cheque")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Portföydeki bir çeki başka bir cariye devret/ciro et"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Çek Ciro Et (Ciranta)</span>
              </button>

              <ExportButtons
                getExportData={() => ({
                  filename: `Cek_Portfoy_Listesi_${new Date().toISOString().split("T")[0]}`,
                  title: "ÇEK PORTFÖYÜ LİSTESİ",
                  subtitle: `Toplam ${cheques.length} Adet Çek Kaydı`,
                  headers: ["Çek No", "Çek Tipi", "Banka / Şube", "Keşideci / Cari", "Vade Tarihi", "Tutar", "Para Birimi", "Durum"],
                  rows: cheques.map((c) => [
                    c.chequeNumber,
                    c.type === "received" ? "Alınan (Müşteri) Çeki" : "Verilen (Firma) Çeki",
                    `${c.bankName || ""} ${c.branchName ? "/ " + c.branchName : ""}`,
                    c.contactName || c.drawer || "-",
                    c.dueDate,
                    formatCurrency(c.amount || 0, c.currency || "TRY"),
                    c.currency || "TRY",
                    c.status === "portfolio" ? "Portföyde" : c.status === "endorsed" ? "Ciro Edildi" : c.status === "collected" ? "Tahsil Edildi" : c.status === "bounced" ? "Karşılıksız" : c.status,
                  ]),
                })}
                size="sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2 min-w-[800px]">
              <thead>
                <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="pb-2 px-3">Çek No & Tipi</th>
                  <th className="pb-2 px-3">Banka / Şube</th>
                  <th className="pb-2 px-3">Keşideci / Cari</th>
                  <th className="pb-2 px-3">Vade Tarihi</th>
                  <th className="pb-2 px-3 text-right">Tutar</th>
                  <th className="pb-2 px-3 text-center">Durum</th>
                  <th className="pb-2 px-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheques.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                      Kayıtlı çek bulunamadı.
                    </td>
                  </tr>
                ) : (
                  displayedCheques.map((c) => (
                    <tr
                      key={c.id}
                      className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                    >
                      <td className="py-2.5 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-purple-950">{c.chequeNumber}</div>
                        <span
                          className={`text-[10px] font-bold ${
                            c.type === "received" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {c.type === "received" ? "Müşteri Çeki" : "Borç / Firma Çeki"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-bold text-slate-800 group-hover:text-purple-950">{c.bankName}</div>
                        <div className="text-[10px] text-slate-500 group-hover:text-purple-700/60">{c.branchName || "-"}</div>
                      </td>
                      <td className="py-2.5 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-bold text-slate-900 group-hover:text-purple-950">{c.contactName}</div>
                        <div className="text-[10px] text-slate-500 group-hover:text-purple-700/60">{c.drawerName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 group-hover:text-purple-900 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {formatDate(c.dueDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        ₺{c.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {getChequeStatusBadge(c.status, c.endorsedToContactName)}
                      </td>
                      <td className="py-2.5 px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => handleShowChequeReceipt(c)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Dekont / Çek Bordrosu Göster (Yazdır / PDF)"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Bordro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleShowChequeReceipt(c);
                              setIsReceiptWhatsAppOpen(true);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Çek Bordrosu / Dekontunu WhatsApp ile Paylaş"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCheque(c);
                              setIsEditChequeModalOpen(true);
                            }}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Çeki Düzenle"
                          >
                            <Pencil className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            <span>Düzenle</span>
                          </button>

                          {c.status === "portfolio" && (
                            <button
                              type="button"
                              onClick={() => handleOpenEndorseModal("cheque", c.id)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Bu çeki başka bir cariye ciro et"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span>Ciro Et</span>
                            </button>
                          )}
                          <select
                            value={c.status}
                            onChange={(e) => {
                              const val = e.target.value as ChequeStatus;
                              if (val === "endorsed") {
                                handleOpenEndorseModal("cheque", c.id);
                              } else if (onUpdateChequeStatus) {
                                onUpdateChequeStatus(c.id, val);
                              }
                            }}
                            className="text-xs bg-slate-100 font-bold text-slate-800 rounded-lg border border-slate-200 px-2 py-1.5 cursor-pointer shadow-2xs shrink-0"
                          >
                            <option value="portfolio">Portföyde</option>
                            <option value="collected">Tahsil Edildi</option>
                            <option value="endorsed">Ciro Edildi</option>
                            <option value="paid">Ödendi</option>
                            <option value="bounced">Karşılıksız</option>
                          </select>
                          {onDeleteCheque && (
                            <button
                              type="button"
                              onClick={() => onDeleteCheque(c.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Sil</span>
                            </button>
                          )}
                        </div>
                      </td>
                  </tr>
                )
              )
            )}
          </tbody>
            </table>
          </div>

          {filteredCheques.length > chequeDisplayLimit && (
            <div className="text-center mt-4">
              <button
                onClick={() => setChequeDisplayLimit((prev) => prev + 100)}
                className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
              >
                Daha Fazla Göster ({chequeDisplayLimit} / {filteredCheques.length})
              </button>
            </div>
          )}
        </div>
        </div>
      )}

      {/* SUB-MODULE 4: SENET */}
      {activeSubModule === "senet" && (
        <div className="space-y-6 animate-fadeIn">
          {renderDateFilterBar("Senet Portföyü")}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-600">Filtrele:</span>
              <button
                onClick={() => setNoteFilterType("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  noteFilterType === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Tümü ({promissoryNotes.length})
              </button>
              <button
                onClick={() => setNoteFilterType("received")}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  noteFilterType === "received"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Müşteri Senetleri ({promissoryNotes.filter((n) => n.type === "received").length})
              </button>
              <button
                onClick={() => setNoteFilterType("issued")}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  noteFilterType === "issued"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Borç Senetleri ({promissoryNotes.filter((n) => n.type === "issued").length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Senet no, borçlu veya cari ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <button
                onClick={() => handleOpenEndorseModal("note")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Portföydeki bir seneti başka bir cariye devret/ciro et"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Senet Ciro Et (Ciranta)</span>
              </button>

              <ExportButtons
                getExportData={() => ({
                  filename: `Senet_Portfoy_Listesi_${new Date().toISOString().split("T")[0]}`,
                  title: "SENET PORTFÖYÜ LİSTESİ",
                  subtitle: `Toplam ${promissoryNotes.length} Adet Senet Kaydı`,
                  headers: ["Senet No", "Senet Tipi", "Borçlu / Cari", "Vade Tarihi", "Düzenleme Tarihi", "Tutar", "Para Birimi", "Durum"],
                  rows: promissoryNotes.map((n) => [
                    n.noteNumber,
                    n.type === "received" ? "Alınan (Müşteri) Senedi" : "Verilen (Firma) Senedi",
                    n.contactName || n.debtorName || "-",
                    n.dueDate,
                    n.issueDate || "-",
                    formatCurrency(n.amount || 0, n.currency || "TRY"),
                    n.currency || "TRY",
                    n.status === "portfolio" ? "Portföyde" : n.status === "endorsed" ? "Ciro Edildi" : n.status === "collected" ? "Tahsil Edildi" : n.status === "protested" ? "Protestolu" : n.status,
                  ]),
                })}
                size="sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2 min-w-[800px]">
              <thead>
                <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="pb-2 px-3">Senet No & Tipi</th>
                  <th className="pb-2 px-3">Borçlu / Cari</th>
                  <th className="pb-2 px-3">Keşide / Düzenleme</th>
                  <th className="pb-2 px-3">Vade Tarihi</th>
                  <th className="pb-2 px-3 text-right">Tutar</th>
                  <th className="pb-2 px-3 text-center">Durum</th>
                  <th className="pb-2 px-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                      Kayıtlı senet bulunamadı.
                    </td>
                  </tr>
                ) : (
                  displayedNotes.map((n) => (
                    <tr
                      key={n.id}
                      className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                    >
                      <td className="py-2.5 px-3 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-purple-950">{n.noteNumber}</div>
                        <span
                          className={`text-[10px] font-bold ${
                            n.type === "received" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {n.type === "received" ? "Müşteri Seneti" : "Borç Seneti"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="font-bold text-slate-900 group-hover:text-purple-950">{n.contactName}</div>
                        <div className="text-[10px] text-slate-500 group-hover:text-purple-700/60">{n.debtorName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 group-hover:text-purple-800/80 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">{formatDate(n.issueDate)}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 group-hover:text-purple-900 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {formatDate(n.dueDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        ₺{n.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        {getNoteStatusBadge(n.status, n.endorsedToContactName)}
                      </td>
                      <td className="py-2.5 px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => handleShowNoteReceipt(n)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Dekont / Senet Bordrosu Göster (Yazdır / PDF)"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Bordro</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleShowNoteReceipt(n);
                              setIsReceiptWhatsAppOpen(true);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Senet Bordrosu / Dekontunu WhatsApp ile Paylaş"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNote(n);
                              setIsEditNoteModalOpen(true);
                            }}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                            title="Seneti Düzenle"
                          >
                            <Pencil className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            <span>Düzenle</span>
                          </button>

                          {n.status === "portfolio" && (
                            <button
                              type="button"
                              onClick={() => handleOpenEndorseModal("note", n.id)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Bu seneti başka bir cariye ciro et"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span>Ciro Et</span>
                            </button>
                          )}
                          <select
                            value={n.status}
                            onChange={(e) => {
                              const val = e.target.value as PromissoryNoteStatus;
                              if (val === "endorsed") {
                                handleOpenEndorseModal("note", n.id);
                              } else if (onUpdateNoteStatus) {
                                onUpdateNoteStatus(n.id, val);
                              }
                            }}
                            className="text-xs bg-slate-100 font-bold text-slate-800 rounded-lg border border-slate-200 px-2 py-1.5 cursor-pointer shadow-2xs shrink-0"
                          >
                            <option value="portfolio">Portföyde</option>
                            <option value="collected">Tahsil Edildi</option>
                            <option value="endorsed">Ciro Edildi</option>
                            <option value="paid">Ödendi</option>
                            <option value="protested">Protestolu</option>
                          </select>
                          {onDeletePromissoryNote && (
                            <button
                              type="button"
                              onClick={() => onDeletePromissoryNote(n.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Sil</span>
                            </button>
                          )}
                        </div>
                      </td>
                  </tr>
                )
              )
            )}
          </tbody>
            </table>
          </div>

          {filteredNotes.length > noteDisplayLimit && (
            <div className="text-center mt-4">
              <button
                onClick={() => setNoteDisplayLimit((prev) => prev + 100)}
                className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
              >
                Daha Fazla Göster ({noteDisplayLimit} / {filteredNotes.length})
              </button>
            </div>
          )}
        </div>
        </div>
      )}

      {/* SUB-MODULE 5: HESAPLAR ARASI VİRMAN */}
      {activeSubModule === "virman" && (
        <div className="space-y-6 animate-fadeIn">
          {renderDateFilterBar("Hesaplar Arası Virman Transferleri")}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Virman Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>Yeni Virman (Transfer) İşlemi</span>
            </h3>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Borçlu Hesap (Borçlandırılan / Çıkan Kaynak) *
                </label>
                <select
                  value={fromAccId}
                  onChange={(e) => setFromAccId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <optgroup label="🏦 Kasa & Banka Hesapları">
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        [Kasa/Banka] {a.name} ({a.type === "cash" ? "Kasa" : "Banka"}) - Bakiye: ₺
                        {a.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </optgroup>
                  {contacts.length > 0 && (
                    <optgroup label="👤 Cari Hesaplar (Müşteriler / Tedarikçiler)">
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          [Cari] {c.name} ({c.type === "customer" ? "Müşteri" : "Tedarikçi"}) - Bakiye: ₺
                          {c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alacaklı Hesap (Alacaklandırılan / Giren Hedef) *
                </label>
                <select
                  value={toAccId}
                  onChange={(e) => setToAccId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <optgroup label="🏦 Kasa & Banka Hesapları">
                    {accounts
                      .filter((a) => a.id !== fromAccId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          [Kasa/Banka] {a.name} ({a.type === "cash" ? "Kasa" : "Banka"}) - Bakiye: ₺
                          {a.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                  </optgroup>
                  {contacts.filter((c) => c.id !== fromAccId).length > 0 && (
                    <optgroup label="👤 Cari Hesaplar (Müşteriler / Tedarikçiler)">
                      {contacts
                        .filter((c) => c.id !== fromAccId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            [Cari] {c.name} ({c.type === "customer" ? "Müşteri" : "Tedarikçi"}) - Bakiye: ₺
                            {c.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Virman Tutarı (₺) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Açıklama / Not
                </label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Virman Transferini Onayla</span>
              </button>
            </form>
          </div>

          {/* Virman History */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Virman Transfer Geçmişi</h3>

            <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl bg-slate-50/60 border border-purple-200/60 p-2 sm:p-3 shadow-2xs">
              <table className="w-full text-left text-xs border-separate border-spacing-y-2 min-w-[700px]">
                <thead>
                  <tr className="text-purple-950 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="pb-2 px-3">Tarih</th>
                    <th className="pb-2 px-3">Hesap</th>
                    <th className="pb-2 px-3">Kategori / Açıklama</th>
                    <th className="pb-2 px-3 text-right">Tutar</th>
                    <th className="pb-2 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {virmanTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 bg-white rounded-xl border border-purple-100/80">
                        Seçilen tarih aralığında virman transfer hareketi bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    displayedVirmanTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl relative z-0 hover:z-10"
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-500 group-hover:text-purple-900 rounded-l-xl border-y border-l border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-purple-950 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {tx.accountName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 group-hover:text-purple-900 border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          {tx.description}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-black font-mono border-y border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all ${
                            tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}₺
                          {tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center rounded-r-xl border-y border-r border-purple-200/50 group-hover:border-purple-300 group-hover:bg-purple-50/30 transition-all">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap sm:flex-nowrap">
                            <button
                              type="button"
                              onClick={() => handleShowVirmanReceipt(tx)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Virman Dekontu Göster (Yazdır / PDF)"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Dekont</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleShowVirmanReceipt(tx);
                                setIsReceiptWhatsAppOpen(true);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Virman Dekontunu WhatsApp ile Paylaş"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsEditTxModalOpen(true);
                              }}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                              title="Virman İletisini Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span>Düzenle</span>
                            </button>

                            {onDeleteTransaction && (
                              <button
                                type="button"
                                onClick={() => onDeleteTransaction(tx.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Sil</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {virmanTransactions.length > virmanDisplayLimit && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setVirmanDisplayLimit((prev) => prev + 100)}
                  className="px-4 py-2 bg-purple-100 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  Daha Fazla Göster ({virmanDisplayLimit} / {virmanTransactions.length})
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      )}


    </div>
  );
};
